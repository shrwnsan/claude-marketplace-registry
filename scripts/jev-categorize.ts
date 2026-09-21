#!/usr/bin/env ts-node

/**
 * Jev Category Enrichment
 *
 * Fills the categorization gaps the deterministic topic-alias matching in
 * src/utils/categories.ts cannot: marketplaces whose GitHub topics match no
 * curated alias. Each gap is one TypeSafe "System One" (Jev) request with a
 * Choice question over the curated category ids plus a Noul question that
 * doubles as discovery triage ("is this actually a marketplace?"). Results
 * land in data/marketplaces/jev-enrichment.json, a persistent sidecar keyed
 * by marketplace id; generate-data.ts merges it into the site data as
 * `inferredCategory`. Topic-alias matches always win over Jev at read time,
 * so this file only ever fills holes.
 *
 * Usage:
 *   npm run enrich:jev                 # classify all unresolved marketplaces
 *   npm run enrich:jev -- --dry-run    # show what would be asked, write nothing
 *   npm run enrich:jev -- --limit 25   # cap the number of live requests
 *   npm run enrich:jev -- --force      # re-ask ids already in the sidecar
 *
 * Requires TYPESAFE_API_KEY for live requests (dry-run works without one).
 */

import fs from 'fs';
import os from 'os';
import path from 'path';
// Environment loading, matching scan-marketplaces.ts: repo-local .env.local
// first, then the user's central ~/.config/.env as a fallback. dotenv never
// overrides variables already set in the real environment.
import { config } from 'dotenv';
config({ path: path.join(process.cwd(), '.env.local') });
config({ path: path.join(os.homedir(), '.config', '.env') });

import { TypeSafeClient, choice, noul, type JsonValue } from '@typesafe-ai/sdk';
import { MARKETPLACE_CATEGORIES, categoryForTopics } from '../src/utils/categories';

/** Record shape written by scan-marketplaces.ts into data/marketplaces/processed.json. */
interface ScanMarketplace {
  id: string;
  name: string;
  description: string;
  url: string;
  stars: number;
  forks: number;
  language?: string;
  updatedAt?: string;
  topics?: string[];
  hasManifest?: boolean;
}

/** One marketplace's Jev verdicts. `category` may be 'none'. */
export interface JevEnrichmentEntry {
  category: string;
  categoryConfidence?: number;
  /** Noul probability that the repo is genuinely a marketplace (discovery triage). */
  isMarketplace?: number;
}

export interface JevEnrichmentFile {
  model: string;
  generatedAt: string;
  entries: Record<string, JevEnrichmentEntry>;
}

/** The record attached to site marketplace data when a Jev category applies. */
export interface InferredCategory {
  id: string;
  confidence?: number;
  model: string;
}

export const NONE_CATEGORY = 'none';

/** Choice criteria kept in lockstep with the curated frontend categories. */
export function buildCategoryCriteria(): Record<string, string> {
  const criteria: Record<string, string> = {};
  for (const category of MARKETPLACE_CATEGORIES) {
    criteria[category.id] = `${category.label} — repos tagged things like: ${category.aliases
      .slice(0, 6)
      .join(', ')}`;
  }
  criteria[NONE_CATEGORY] =
    'None of these — its function is unclear, mixed, or outside the buckets above';
  return criteria;
}

export function buildQuestions() {
  return {
    category: choice(
      'Which functional category best describes what this Claude Code marketplace repository collects?',
      buildCategoryCriteria()
    ),
    isMarketplace: noul(
      'This repository is itself a marketplace: a directory or collection of Claude Code plugins, skills, or agents (usually with a .claude-plugin/marketplace.json), not a single-purpose project that merely uses Claude Code.',
      {
        true: 'A marketplace or curated collection of Claude Code extensions',
        false: 'A standalone project, docs site, template, or unrelated repo',
      }
    ),
  };
}

/** Compact per-marketplace state — kept small because billing is input-only. */
export function buildState(mp: ScanMarketplace): Record<string, JsonValue> {
  const state: Record<string, JsonValue> = {
    name: mp.name,
    description: (mp.description || '').slice(0, 600),
    stars: mp.stars,
    hasManifest: !!mp.hasManifest,
  };
  if (mp.language) state.language = mp.language;
  if (Array.isArray(mp.topics) && mp.topics.length > 0) state.topics = mp.topics.slice(0, 20);
  return state;
}

/** Sidecar reader for generate-data.ts — null when the file is absent or corrupt. */
export function loadJevEnrichment(dataDir: string): JevEnrichmentFile | null {
  const enrichmentPath = path.join(dataDir, 'marketplaces', 'jev-enrichment.json');
  if (!fs.existsSync(enrichmentPath)) return null;
  try {
    const parsed = JSON.parse(fs.readFileSync(enrichmentPath, 'utf-8')) as JevEnrichmentFile;
    if (!parsed || typeof parsed !== 'object' || typeof parsed.entries !== 'object') return null;
    return parsed;
  } catch (error) {
    console.warn(`⚠️ Ignoring corrupt jev-enrichment.json: ${(error as Error).message}`);
    return null;
  }
}

function isCuratedCategory(id: unknown): id is string {
  return typeof id === 'string' && MARKETPLACE_CATEGORIES.some((c) => c.id === id);
}

/**
 * Attach `inferredCategory` to marketplace records that have a usable Jev
 * verdict. 'none' and unknown ids attach nothing — unknown ids guard against
 * a sidecar written against an older category set.
 */
export function applyJevEnrichment<T extends { id: string }>(
  marketplaces: T[],
  enrichment: JevEnrichmentFile | null
): (T & { inferredCategory?: InferredCategory })[] {
  if (!enrichment) return marketplaces;
  return marketplaces.map((mp) => {
    const entry = enrichment.entries?.[mp.id];
    if (!entry || !isCuratedCategory(entry.category)) return mp;
    return {
      ...mp,
      inferredCategory: {
        id: entry.category,
        confidence: entry.categoryConfidence,
        model: enrichment.model,
      },
    };
  });
}

interface RunStats {
  aliased: number;
  cached: number;
  asked: number;
  failed: number;
  noneVerdicts: number;
  inputTokens: number;
  models: Set<string>;
}

async function run(): Promise<void> {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const force = args.includes('--force');
  const limitIndex = args.indexOf('--limit');
  const limit = limitIndex !== -1 ? parseInt(args[limitIndex + 1], 10) : Infinity;

  const inputDir = path.join(process.cwd(), 'data');
  const processedPath = path.join(inputDir, 'marketplaces', 'processed.json');
  const outPath = path.join(inputDir, 'marketplaces', 'jev-enrichment.json');

  if (!fs.existsSync(processedPath)) {
    console.error(`❌ No scan output at ${processedPath} — run npm run scan:marketplaces first`);
    process.exit(1);
  }
  const raw = JSON.parse(fs.readFileSync(processedPath, 'utf-8'));
  const marketplaces: ScanMarketplace[] = Array.isArray(raw) ? raw : raw.marketplaces || [];

  const existing: JevEnrichmentFile = fs.existsSync(outPath)
    ? JSON.parse(fs.readFileSync(outPath, 'utf-8'))
    : { model: '', generatedAt: '', entries: {} };
  const entries: Record<string, JevEnrichmentEntry> = { ...existing.entries };

  // Deterministic first: topic aliases already answer these — only gaps go to Jev.
  const pending: ScanMarketplace[] = [];
  const stats: RunStats = {
    aliased: 0,
    cached: 0,
    asked: 0,
    failed: 0,
    noneVerdicts: 0,
    inputTokens: 0,
    models: new Set(),
  };

  for (const mp of marketplaces) {
    if (!mp.id) continue;
    if (!force && categoryForTopics(mp.topics)) {
      stats.aliased += 1;
    } else if (!force && entries[mp.id]) {
      stats.cached += 1;
    } else {
      pending.push(mp);
    }
  }

  const queue = pending.slice(0, Number.isFinite(limit) ? Math.max(0, limit) : pending.length);
  console.log('🧠 Jev Category Enrichment');
  console.log(`   Marketplaces: ${marketplaces.length}`);
  console.log(`   Already categorized by topic aliases: ${stats.aliased}`);
  console.log(`   Cached in sidecar: ${stats.cached}`);
  console.log(
    `   To ask Jev${dryRun ? ' (dry run)' : ''}: ${queue.length}${force ? ' [force]' : ''}`
  );
  console.log('');

  if (queue.length === 0) {
    console.log('✅ Nothing to classify — sidecar already covers every unresolved marketplace');
    return;
  }

  if (dryRun) {
    for (const mp of queue.slice(0, 5)) {
      console.log(`   · ${mp.name} (${mp.url})`);
      console.log(`     state: ${JSON.stringify(buildState(mp)).slice(0, 160)}…`);
    }
    if (queue.length > 5) console.log(`   … and ${queue.length - 5} more`);
    console.log('\n✅ Dry run complete — no requests made, nothing written');
    return;
  }

  if (!process.env.TYPESAFE_API_KEY) {
    console.error(
      '❌ TYPESAFE_API_KEY is not set — get an early-access key at https://console.typesafe.ai/settings/keys'
    );
    process.exit(1);
  }

  const client = new TypeSafeClient();
  const questions = buildQuestions();
  let cursor = 0;

  async function worker(): Promise<void> {
    while (cursor < queue.length) {
      const mp = queue[cursor++];
      try {
        const result = await client.systemOne({ state: buildState(mp), questions });
        const category = result.answers.category;
        stats.models.add(result.model);
        stats.inputTokens += result.usage.input_tokens;
        if (category.choice === NONE_CATEGORY) stats.noneVerdicts += 1;
        entries[mp.id] = {
          category: category.choice,
          categoryConfidence: category.confidence,
          isMarketplace: result.answers.isMarketplace.noul,
        };
        stats.asked += 1;
        console.log(
          `   ✓ ${mp.name} → ${category.choice} (${(category.confidence * 100).toFixed(0)}%)`
        );
      } catch (error) {
        stats.failed += 1;
        console.warn(`   ✗ ${mp.name}: ${(error as Error).message}`);
      }
    }
  }

  await Promise.all(Array.from({ length: 5 }, () => worker()));

  const file: JevEnrichmentFile = {
    model: [...stats.models].join(',') || existing.model,
    generatedAt: new Date().toISOString(),
    entries,
  };
  fs.writeFileSync(outPath, JSON.stringify(file, null, 2));

  console.log('');
  console.log('💾 Enrichment summary');
  console.log(`   Asked: ${stats.asked}  (failed: ${stats.failed})`);
  console.log(`   Verdict "none": ${stats.noneVerdicts}`);
  console.log(`   Input tokens: ${stats.inputTokens.toLocaleString()}`);
  console.log(`   Model: ${file.model}`);
  const lowTrust = Object.entries(entries)
    .filter(([, e]) => e.isMarketplace !== undefined && e.isMarketplace < 0.5)
    .map(([id]) => id);
  if (lowTrust.length > 0) {
    console.log(
      `   ⚠️ ${lowTrust.length} entries have isMarketplace < 0.5 — possible scan false positives: ${lowTrust
        .slice(0, 10)
        .join(', ')}`
    );
  }
  console.log(`✅ Wrote ${outPath}`);
}

if (require.main === module) {
  run().catch((error) => {
    console.error('❌ Jev enrichment failed:', error);
    process.exit(1);
  });
}
