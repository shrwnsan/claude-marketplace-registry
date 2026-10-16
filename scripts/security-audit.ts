#!/usr/bin/env ts-node

/**
 * Security Audit Enrichment (skills.sh)
 *
 * Fetches the per-skill security verdicts that skills.sh publishes (Gen Agent
 * Trust Hub, Socket, Snyk) and stores them in data/marketplaces/
 * security-audit.json, a persistent sidecar keyed by marketplace id;
 * generate-data.ts merges them into the site data as an optional
 * `securityAudit` summary on marketplace records. Follows the Jev sidecar
 * pattern (scripts/jev-categorize.ts): additive, cache-respecting, and never
 * load-bearing — a partial or skipped run leaves the previously committed
 * sidecar in place.
 *
 * Data source: GET https://add-skill.vercel.sh/audit?source=<owner/repo>&skills=<slug>[,<slug>]
 * This is the same unauthenticated endpoint the `npx skills` CLI uses. It is
 * undocumented, so this script is deliberately defensive: short timeout, one
 * 429 backoff retry, per-repo error isolation, positive-result freshness
 * caching, and hard caps on request volume. Repos skills.sh has not audited
 * return 404 — we record nothing for them (no negative caching, so they are
 * retried on a later run once skills.sh learns them).
 *
 * Verdicts are indicative, not authoritative: independent research (Trail of
 * Bits / CSA, June 2026) demonstrated all three skills.sh scanners can be
 * bypassed. Downstream display must attribute ("Gen/Socket/Snyk via
 * skills.sh · audited <date>") and link to the skills.sh audit pages.
 *
 * Usage:
 *   npm run audit:security                 # audit stale/unaudited repos
 *   npm run audit:security -- --dry-run    # show what would be fetched
 *   npm run audit:security -- --limit 25   # cap repos fetched this run
 *   npm run audit:security -- --force      # ignore freshness, refetch all
 */

import fs from 'fs';
import os from 'os';
import path from 'path';
import { config } from 'dotenv';
config({ path: path.join(process.cwd(), '.env.local') });
config({ path: path.join(os.homedir(), '.config', '.env') });

const AUDIT_ENDPOINT = 'https://add-skill.vercel.sh/audit';
const MAX_SKILLS_PER_REQUEST = 20;
const DEFAULT_MAX_REPOS_PER_RUN = 100;
const DEFAULT_MAX_AGE_DAYS = 7;
const FETCH_TIMEOUT_MS = 15_000;

/** Record shape written by scan-marketplaces.ts into data/marketplaces/processed.json. */
interface ScanMarketplace {
  id: string;
  url: string;
  stars?: number;
}

/** Record shape written by validate-plugins.ts into data/plugins/valid-plugins.json. */
interface ValidPlugin {
  repository?: string;
  metadata?: { marketplaceId?: string | number; skills?: string[] };
}

/** One auditor's verdict as returned by the endpoint. */
export interface AuditVerdict {
  risk?: string;
  alerts?: number;
  score?: number;
}

/** All verdicts skills.sh holds for one skill slug. */
export interface SkillAudits {
  ath?: AuditVerdict;
  socket?: AuditVerdict;
  snyk?: AuditVerdict;
  analyzedAt?: string;
}

/** Per-marketplace sidecar entry. */
export interface RepoAuditEntry {
  repo: string;
  auditedAt: string;
  skills: Record<string, SkillAudits>;
}

/** The sidecar file shape (data/marketplaces/security-audit.json). */
export interface SecurityAuditFile {
  source: string;
  generatedAt: string;
  entries: Record<string, RepoAuditEntry>;
}

/** Summary attached to site marketplace records by generate-data.ts. */
export interface SecurityAuditSummary {
  /** Worst verdict across audited skills (safe|low|medium|high|critical). */
  risk: string;
  /** Sum of Socket alerts across audited skills. */
  alerts: number;
  auditedSkills: number;
  totalSkills: number;
  auditedAt: string;
  source: string;
}

const RISK_ORDER = ['safe', 'low', 'medium', 'high', 'critical'];

/**
 * skills.sh skill slug from a manifest skill path: "./skills/pdf" → "pdf",
 * "./skills/brag" → "brag". Pure for unit testing.
 */
export function slugFromSkillPath(skillPath: string): string {
  const parts = String(skillPath || '')
    .split('/')
    .filter(Boolean);
  return parts[parts.length - 1] || '';
}

/** "https://github.com/owner/repo(.git)" → "owner/repo", else null. Pure. */
export function repoFromUrl(url: string): string | null {
  const match = String(url || '').match(/github\.com\/([^/]+)\/([^/#?]+)/);
  if (!match) return null;
  return `${match[1]}/${match[2].replace(/\.git$/, '')}`;
}

/** Severity rank; unknown risk strings rank above safe but below low. Pure. */
export function riskSeverity(risk: string | undefined): number {
  if (!risk) return -1;
  const idx = RISK_ORDER.indexOf(risk.toLowerCase());
  return idx === -1 ? 0.5 : idx;
}

/** Worst verdict across a repo's audited skills, or null when nothing audited. Pure. */
export function worstRisk(skills: Record<string, SkillAudits>): string | null {
  let worst: string | null = null;
  for (const skill of Object.values(skills)) {
    for (const risk of [skill.ath?.risk, skill.socket?.risk, skill.snyk?.risk]) {
      if (risk && (worst === null || riskSeverity(risk) > riskSeverity(worst))) {
        worst = risk;
      }
    }
  }
  return worst;
}

/** Build the marketplace-level summary attached to site data. Pure. */
export function aggregateAudit(
  entry: RepoAuditEntry,
  totalSkills: number
): SecurityAuditSummary | null {
  const skillEntries = Object.values(entry.skills || {});
  if (skillEntries.length === 0) return null;
  const risk = worstRisk(entry.skills);
  if (!risk) return null;
  const alerts = skillEntries.reduce((sum, s) => sum + (s.socket?.alerts || 0), 0);
  const auditedAt = skillEntries
    .map((s) => s.analyzedAt || '')
    .sort()
    .pop() as string;
  return {
    risk,
    alerts,
    auditedSkills: skillEntries.length,
    totalSkills,
    auditedAt,
    source: 'skills.sh',
  };
}

/** Attach `securityAudit` summaries to marketplace records. Pure, additive. */
export function applySecurityAudit<T extends { id: string }>(
  marketplaces: T[],
  file: SecurityAuditFile | null
): (T & { securityAudit?: SecurityAuditSummary })[] {
  if (!file) return marketplaces;
  return marketplaces.map((mp) => {
    const entry = file.entries?.[mp.id];
    if (!entry) return mp;
    const totalSkills = countTotalSkills(entry);
    const summary = aggregateAudit(entry, totalSkills);
    return summary ? { ...mp, securityAudit: summary } : mp;
  });
}

/** Total known skill slugs for a repo entry (audited + observed). Pure. */
function countTotalSkills(entry: RepoAuditEntry): number {
  return Object.keys(entry.skills || {}).length;
}

/** Sidecar reader for generate-data.ts — null when absent or corrupt. */
export function loadSecurityAudit(dataDir: string): SecurityAuditFile | null {
  const auditPath = path.join(dataDir, 'marketplaces', 'security-audit.json');
  if (!fs.existsSync(auditPath)) return null;
  try {
    const parsed = JSON.parse(fs.readFileSync(auditPath, 'utf-8')) as SecurityAuditFile;
    if (!parsed || typeof parsed !== 'object' || typeof parsed.entries !== 'object') return null;
    return parsed;
  } catch (error) {
    console.warn(`⚠️ Ignoring corrupt security-audit.json: ${(error as Error).message}`);
    return null;
  }
}

/** Tolerant endpoint response → SkillAudits. Unknown shapes yield nothing. */
interface EndpointSkill {
  analyzedAt?: unknown;
  ath?: unknown;
  socket?: unknown;
  snyk?: unknown;
}

export function parseAuditResponse(payload: unknown): Record<string, SkillAudits> {
  const out: Record<string, SkillAudits> = {};
  if (!payload || typeof payload !== 'object') return out;
  for (const [slug, value] of Object.entries(payload as Record<string, unknown>)) {
    if (!value || typeof value !== 'object') continue;
    const v = value as EndpointSkill;
    const skill: SkillAudits = {};
    for (const provider of ['ath', 'socket', 'snyk'] as const) {
      const p = v[provider];
      if (p && typeof p === 'object') {
        const pv = p as Record<string, unknown>;
        const verdict: AuditVerdict = {};
        if (typeof pv.risk === 'string') verdict.risk = pv.risk;
        if (typeof pv.alerts === 'number') verdict.alerts = pv.alerts;
        if (typeof pv.score === 'number') verdict.score = pv.score;
        if (Object.keys(verdict).length > 0) skill[provider] = verdict;
      }
    }
    const times = [v.analyzedAt, v.ath, v.socket, v.snyk]
      .map((t) => (t && typeof t === 'object' ? (t as EndpointSkill).analyzedAt : t))
      .filter((t): t is string => typeof t === 'string')
      .sort();
    if (times.length > 0) skill.analyzedAt = times[times.length - 1];
    if (Object.keys(skill).length > 0) out[slug] = skill;
  }
  return out;
}

/** One endpoint fetch with timeout and a single 429 backoff retry. */
export async function fetchAudits(
  repo: string,
  skills: string[],
  fetchImpl: typeof fetch = fetch
): Promise<Record<string, SkillAudits> | null> {
  const url = `${AUDIT_ENDPOINT}?source=${encodeURIComponent(repo)}&skills=${encodeURIComponent(skills.join(','))}`;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
      const res = await fetchImpl(url, { signal: controller.signal });
      clearTimeout(timer);
      if (res.status === 429 && attempt === 0) {
        await new Promise((r) => setTimeout(r, 2000));
        continue;
      }
      if (!res.ok) return null;
      return parseAuditResponse(await res.json());
    } catch {
      return null;
    }
  }
  return null; // unreachable; both attempts handled above
}

function isFresh(iso: string | undefined, maxAgeDays: number, now: number): boolean {
  if (!iso) return false;
  const t = Date.parse(iso);
  return Number.isFinite(t) && now - t <= maxAgeDays * 24 * 60 * 60 * 1000;
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const force = args.includes('--force');
  const limitIdx = args.indexOf('--limit');
  const maxRepos =
    limitIdx !== -1
      ? parseInt(args[limitIdx + 1], 10) || DEFAULT_MAX_REPOS_PER_RUN
      : DEFAULT_MAX_REPOS_PER_RUN;
  const maxAgeDays = parseInt(process.env.AUDIT_MAX_AGE_DAYS || '', 10) || DEFAULT_MAX_AGE_DAYS;

  const inputDir = path.join(process.cwd(), 'data');
  const processedPath = path.join(inputDir, 'marketplaces', 'processed.json');
  const pluginsPath = path.join(inputDir, 'plugins', 'valid-plugins.json');
  if (!fs.existsSync(processedPath) || !fs.existsSync(pluginsPath)) {
    console.error('✗ Missing processed.json or valid-plugins.json — run scan + validation first.');
    process.exit(1);
  }

  const marketplaces: ScanMarketplace[] = JSON.parse(fs.readFileSync(processedPath, 'utf-8'));
  const plugins: ValidPlugin[] = JSON.parse(fs.readFileSync(pluginsPath, 'utf-8'));

  // Group skill slugs by marketplace id; repo URL comes from the marketplace record.
  const mpById = new Map(marketplaces.map((m) => [m.id, m]));
  const skillsByMp = new Map<string, Set<string>>();
  for (const plugin of plugins) {
    const mpId = String(plugin.metadata?.marketplaceId ?? '');
    if (!mpId || !mpById.has(mpId)) continue;
    for (const skillPath of plugin.metadata?.skills || []) {
      const slug = slugFromSkillPath(skillPath);
      if (!slug) continue;
      const set = skillsByMp.get(mpId) || new Set<string>();
      set.add(slug);
      skillsByMp.set(mpId, set);
    }
  }

  const sidecarPath = path.join(inputDir, 'marketplaces', 'security-audit.json');
  const file: SecurityAuditFile = loadSecurityAudit(inputDir) || {
    source: 'skills.sh (Gen / Socket / Snyk)',
    generatedAt: new Date().toISOString(),
    entries: {},
  };
  const now = Date.now();
  const candidates: Array<{ mp: ScanMarketplace; repo: string; slugs: string[] }> = [];

  for (const [mpId, slugs] of skillsByMp) {
    const mp = mpById.get(mpId);
    if (!mp) continue;
    const repo = repoFromUrl(mp.url);
    if (!repo) continue;
    const existing = file.entries[mpId];
    const stale = force
      ? slugs
      : new Set(
          [...slugs].filter((s) => !isFresh(existing?.skills?.[s]?.analyzedAt, maxAgeDays, now))
        );
    if (stale.size === 0) continue;
    candidates.push({ mp, repo, slugs: [...stale].slice(0, MAX_SKILLS_PER_REQUEST) });
  }

  // Highest-starred marketplaces first: the most visible entries get audited
  // first under the per-run cap.
  candidates.sort((a, b) => (b.mp.stars || 0) - (a.mp.stars || 0));
  const run = candidates.slice(0, maxRepos);
  const skipped = candidates.length - run.length;
  console.log(
    `🔒 ${candidates.length} repo(s) with stale/unaudited skills` +
      (skipped > 0 ? ` (auditing ${run.length}, ${skipped} over this run's cap)` : '')
  );
  if (dryRun) {
    for (const c of run) {
      console.log(`  would fetch: ${c.repo} → ${c.slugs.join(', ')}`);
    }
    return;
  }

  let fetched = 0;
  let failed = 0;
  for (const c of run) {
    const result = await fetchAudits(c.repo, c.slugs);
    if (!result || Object.keys(result).length === 0) {
      failed++;
      continue; // 404/not-yet-audited or transient failure — record nothing
    }
    const entry: RepoAuditEntry = file.entries[c.mp.id] || {
      repo: c.repo,
      auditedAt: '',
      skills: {},
    };
    entry.repo = c.repo;
    const merged = { ...entry.skills, ...result };
    entry.skills = merged;
    entry.auditedAt = new Date().toISOString();
    file.entries[c.mp.id] = entry;
    fetched++;
    process.stdout.write(`  ✓ ${c.repo}: ${Object.keys(result).length} skill(s)\n`);
  }

  if (fetched === 0 && Object.keys(file.entries).length === 0) {
    console.log('ℹ️ No audit data available yet — keeping sidecar unwritten.');
    return;
  }

  file.generatedAt = new Date().toISOString();
  const serialized = JSON.stringify(file, null, 2);
  if (fs.existsSync(sidecarPath) && fs.readFileSync(sidecarPath, 'utf-8') === serialized) {
    console.log('ℹ️ Sidecar unchanged.');
    return;
  }
  fs.writeFileSync(sidecarPath, serialized);
  console.log(`✅ security-audit.json updated: ${fetched} repo(s) fetched, ${failed} unavailable.`);
}

if (require.main === module) {
  main().catch((error) => {
    console.error(`✗ Security audit enrichment failed: ${(error as Error).message}`);
    process.exit(1);
  });
}
