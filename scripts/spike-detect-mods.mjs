#!/usr/bin/env node
/**
 * SPIKE — detect Claude Code mods in the registry's plugin corpus.
 *
 * A mod is a plugin whose `hooks/hooks.json` contains a non-empty `modules`
 * array (verified against code.claude.com/docs/en/plugins/mods/reference and
 * anthropics/claude-code/mods/diff/hooks/hooks.json). This script probes a
 * sample of data/plugins/valid-plugins.json over the GitHub contents API to
 * answer: does the marker hold in the wild, and how many registry plugins
 * already ship mods?
 *
 * Spike-only: standalone .mjs, zero deps, not wired into the pipeline.
 * Run: node scripts/spike-detect-mods.mjs [--limit N]
 */
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const DATA_FILE = path.join(ROOT, 'data/plugins/valid-plugins.json');
const RESULTS_FILE = path.join(ROOT, 'spike-results.json');
const LIMIT = (() => {
  const i = process.argv.indexOf('--limit');
  return i > -1 ? Number(process.argv[i + 1]) : Infinity;
})();

// --- token: env var first, then .env.local (CWD, then main repo root). Never printed.
function loadToken() {
  if (process.env.GITHUB_TOKEN) return process.env.GITHUB_TOKEN;
  for (const p of ['.env.local', '../../.env.local']) {
    try {
      const line = readFileSync(path.resolve(ROOT, p), 'utf8')
        .split('\n')
        .find((l) => l.trim().startsWith('GITHUB_TOKEN='));
      if (line) return line.slice(line.indexOf('=') + 1).trim().replace(/^["']|["']$/g, '');
    } catch { /* no such file */ }
  }
  return null;
}
const token = loadToken();

// --- GitHub contents API
const API = 'https://api.github.com';
let remaining = null;
async function ghJson(url) {
  const res = await fetch(url, {
    headers: {
      Accept: 'application/vnd.github+json',
      'User-Agent': 'cmr-mods-spike',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  remaining = Number(res.headers.get('x-ratelimit-remaining'));
  if (res.status === 304 || res.status === 404) return { status: res.status };
  if (res.status === 200) {
    const j = await res.json();
    let text = null;
    if (j.encoding === 'base64' && j.content) text = Buffer.from(j.content, 'base64').toString('utf8');
    return { status: 200, text, size: j.size };
  }
  return { status: res.status };
}

// --- probe one plugin dir for hooks/hooks.json with a modules array
function parseRepo(repository) {
  const m = typeof repository === 'string' && repository.match(/^https?:\/\/github\.com\/([^/#?]+)\/([^/#?]+?)(\.git)?$/i);
  return m ? { owner: m[1], repo: m[2] } : null;
}
const normDir = (d) =>
  String(d || './')
    .replace(/\/\.claude-plugin\/plugin\.json$/, '') // full-manifest-path shape
    .replace(/^\.?\//, '')
    .replace(/\/+$/, '');
// two dataset shapes: string manifestPath (repo = parent `repository`) and
// object manifestPath = plugin source blob (repo = manifestPath.url, dir = .path, optional git ref)
function resolveTarget(p) {
  if (p.manifestPath && typeof p.manifestPath === 'object') {
    const r = parseRepo(p.manifestPath.url || p.repository);
    return r ? { owner: r.owner, repo: r.repo, dir: normDir(p.manifestPath.path), ref: p.manifestPath.ref } : null;
  }
  const r = parseRepo(p.repository);
  return r ? { owner: r.owner, repo: r.repo, dir: normDir(p.manifestPath), ref: null } : null;
}
async function probeMod(owner, repo, dir, ref) {
  const enc = dir ? encodeURIComponent(dir) + '/' : '';
  const q = ref ? `?ref=${encodeURIComponent(ref)}` : '';
  const r = await ghJson(`${API}/repos/${owner}/${repo}/contents/${enc}hooks/hooks.json${q}`);
  if (r.status === 404) return { mod: false, reason: 'no-hooks-json' };
  if (r.status !== 200) return { mod: false, reason: `http-${r.status}` };
  try {
    const hooks = JSON.parse(r.text);
    const modules = Array.isArray(hooks.modules) ? hooks.modules : null;
    const legacy = Object.keys(hooks).filter((k) => k !== 'modules');
    return { mod: !!modules?.length, modules, legacyKeys: legacy, size: r.size };
  } catch {
    return { mod: false, reason: 'unparseable' };
  }
}

// --- build sample
const all = JSON.parse(readFileSync(DATA_FILE, 'utf8'));
const CANDIDATE_RE = /\b(mods?|hook|guard|spend|meter|dashboard|banner|status\s?bar|forecast|replay|blast|context\s?(window|bar)|now\s?playing|usage)\b/i;
const seen = new Set();
const perRepo = new Map();
let skippedNoRepo = 0;
const candidates = [];
const baseline = [];

for (let i = 0; i < all.length; i++) {
  const p = all[i];
  const t = resolveTarget(p);
  if (!t) { skippedNoRepo++; continue; }
  const key = `${t.owner}/${t.repo}::${t.dir}`;
  if (seen.has(key)) continue;
  const repoCount = perRepo.get(`${t.owner}/${t.repo}`) || 0;
  if (repoCount >= 2) continue; // cap probes per repo
  seen.add(key);
  const entry = { name: p.name, owner: t.owner, repo: t.repo, dir: t.dir, ref: t.ref, marketplace: p.metadata?.marketplaceName || p.metadata?.marketplaceId };
  if (CANDIDATE_RE.test(`${p.name} ${p.description || ''}`)) candidates.push(entry);
  else if (i % 47 === 0) baseline.push(entry); // deterministic ~1/47 slice for base rate
  perRepo.set(`${t.owner}/${t.repo}`, repoCount + 1);
}

// positive controls: canonical mods from Anthropic's repos
const controls = [
  { name: 'diff (built-in)', owner: 'anthropics', repo: 'claude-code', dir: 'mods/diff' },
  { name: 'agents-md (built-in)', owner: 'anthropics', repo: 'claude-code', dir: 'mods/agents-md' },
  { name: 'sec-default (built-in)', owner: 'anthropics', repo: 'claude-code', dir: 'mods/sec-default' },
  { name: 'telemetry (built-in)', owner: 'anthropics', repo: 'claude-code', dir: 'mods/telemetry' },
  { name: 'token-weather (sample)', owner: 'anthropics', repo: 'claude-code-playground', dir: 'claude-code/mods/token-weather' },
  { name: 'blast-radius (sample)', owner: 'anthropics', repo: 'claude-code-playground', dir: 'claude-code/mods/blast-radius' },
  { name: 'replay-theater (sample)', owner: 'anthropics', repo: 'claude-code-playground', dir: 'claude-code/mods/replay-theater' },
];

// budget-aware sample sizing (unauthenticated core limit is 60/hr)
const budget = token ? Infinity : 46 - 8;
const pick = (arr, n) => arr.slice(0, Math.min(n, Math.ceil(budget === Infinity ? Infinity : budget)));
const candidateSample = pick(candidates, Math.min(candidates.length, 70));
const baselineSample = pick(baseline, Math.min(baseline.length, 50));

// --- run
const delay = (ms) => new Promise((r) => setTimeout(r, ms));
const results = { controls: [], candidateHits: [], baselineHits: [], stats: { probed: 0, mods: 0, noHooksJson: 0, httpErrors: 0, skippedNoRepo: 0 } };
let probed = 0;

async function run(kind, entry, sink) {
  if (remaining !== null && remaining < 15) throw new Error(`rate-limit: ${remaining} remaining, stopping early`);
  const r = await probeMod(entry.owner, entry.repo, entry.dir);
  probed++;
  results.stats.probed++;
  if (r.reason === 'no-hooks-json') results.stats.noHooksJson++;
  else if (r.reason?.startsWith('http-')) results.stats.httpErrors++;
  if (r.mod) {
    results.stats.mods++;
    sink.push({ ...entry, modules: r.modules, legacyKeys: r.legacyKeys, kind });
  }
  await delay(token ? 120 : 1500);
}

console.log(`token: ${token ? 'yes' : 'NO (rate-limited run)'} | candidates: ${candidates.length} → probing ${candidateSample.length} | baseline: probing ${baselineSample.length} | controls: ${controls.length}`);

try {
  for (const c of controls) {
    const before = results.stats.mods;
    await run('control', c, results.controls);
    if (results.stats.mods > before) console.log(`  control HIT: ${c.name} ✓`);
  }
  for (const c of candidateSample) {
    await run('candidate', c, results.candidateHits);
    if (results.candidateHits.length && results.candidateHits.at(-1)?.name === c.name) console.log(`  candidate HIT: ${c.name} (${c.owner}/${c.repo})`);
  }
  for (const b of baselineSample) {
    await run('baseline', b, results.baselineHits);
    if (results.baselineHits.length && results.baselineHits.at(-1)?.name === b.name) console.log(`  baseline HIT: ${b.name} (${b.owner}/${b.repo})`);
  }
} catch (e) {
  console.error(`ABORTED: ${e.message}`);
}

results.stats.rateLimitRemaining = remaining;
results.stats.candidatePool = candidates.length;
results.stats.baselinePool = baseline.length;
results.stats.totalPluginsInDataset = all.length;
results.stats.skippedNoRepo = skippedNoRepo;
writeFileSync(RESULTS_FILE, JSON.stringify(results, null, 2));

// --- summary
const s = results.stats;
const baseRate = s.probed ? (s.mods / s.probed * 100).toFixed(1) : '0';
console.log(`\n=== SPIKE RESULTS ===`);
console.log(`probed: ${s.probed} | mods found: ${s.mods} (${baseRate}% of probed) | no hooks.json: ${s.noHooksJson} | http errors: ${s.httpErrors}`);
console.log(`controls passing: ${results.controls.length}/${controls.length}`);
console.log(`candidate hits: ${results.candidateHits.length} | baseline hits: ${results.baselineHits.length}`);
console.log(`results → ${RESULTS_FILE}`);
