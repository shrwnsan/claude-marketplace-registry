#!/usr/bin/env node
/**
 * SPIKE (mods-capture) — can standalone mod repos be synthesized into
 * single-plugin marketplace entries?
 *
 * Probes, in budget order (hard cap: 25 GitHub API calls / run):
 *   1. Census: code search `"modules" filename:hooks.json path:hooks`
 *      (per_page=100, up to 2 pages, sort=indexed) — 2 calls.
 *   2. Split: for the first 15 distinct repos in the results, ONE contents
 *      call each checking `.claude-plugin/marketplace.json` at repo root —
 *      15 calls. 200 => already an installable marketplace; 404 => standalone
 *      mod repo that would need synthesis.
 *   3. Event surface: for standalone repos, fetch their hooks.json (path as
 *      observed by the search index) and record which event keys they
 *      register — classic settings-hooks keys (PreToolUse, PostToolUse, ...)
 *      plus the `modules` array contents — 1 call each.
 *
 * Resume mode (`--resume <file> [--probe repo,repo,...]`) continues a partial
 * run against its saved results: the call counter carries over (cumulative
 * total stays budget-capped), extra repos listed after --probe are split-
 * probed (falling back to `hooks/hooks.json` when the run had no recorded
 * path for them) and any standalone ones get the event-surface fetch.
 *
 * Zero dependency. Token: env GITHUB_TOKEN or ../../.env.local (repo root,
 * two levels up from the worktree). Results: spike-capture-results.json.
 */
import { readFileSync, writeFileSync } from 'node:fs';

const API_ROOT = 'https://api.github.com';
const BUDGET = 25;
const SEARCH_QUERY = '"modules" filename:hooks.json path:hooks';
const SPLIT_PROBES = 15; // repos checked for a root marketplace.json in a fresh run
const EVENT_PROBES = 5; // standalone repos whose hooks.json is opened per run

// Canonical Claude Code hook-event names (settings-schema "classic" keys).
const HOOK_EVENTS = new Set([
  'PreToolUse',
  'PostToolUse',
  'UserPromptSubmit',
  'Notification',
  'Stop',
  'SubagentStop',
  'PreCompact',
  'SessionStart',
  'SessionEnd',
]);

function loadToken() {
  if (process.env.GITHUB_TOKEN) return process.env.GITHUB_TOKEN;
  for (const p of ['.env.local', '../../.env.local']) {
    try {
      const line = readFileSync(p, 'utf8')
        .split('\n')
        .find((l) => l.trim().startsWith('GITHUB_TOKEN='));
      if (line) return line.slice(line.indexOf('=') + 1).trim().replace(/^["']|["']$/g, '');
    } catch {
      /* no such file */
    }
  }
  return null;
}

let callsUsed = 0;

/**
 * One GitHub API call, budget-checked. Retries once on 403/429 honouring
 * Retry-After (the retry counts against the same budget).
 */
async function gh(url, { accept = 'application/vnd.github+json', raw = false } = {}) {
  const token = loadToken();
  const headers = {
    Accept: raw ? 'application/vnd.github.raw' : accept,
    'User-Agent': 'cmr-mods-capture-spike',
    Authorization: `Bearer ${token}`,
  };
  for (let attempt = 0; attempt < 2; attempt++) {
    if (callsUsed >= BUDGET) return { status: 0, j: null, text: '', budgetExhausted: true };
    callsUsed++;
    const res = await fetch(url, { headers });
    if ((res.status === 403 || res.status === 429) && attempt === 0) {
      const retryAfter = Number(res.headers.get('retry-after')) || 15;
      console.log(`  rate-limited (${res.status}); honouring Retry-After: ${retryAfter}s`);
      await new Promise((r) => setTimeout(r, retryAfter * 1000));
      continue;
    }
    const text = await res.text();
    return { status: res.status, j: res.ok ? safeJson(text) : null, text };
  }
  return { status: 0, j: null, text: '' };
}

function safeJson(text) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

/** Recognized hook-event keys found among an object's own keys (plus the
 *  keys of its `events`/`hooks` sub-objects, where modules sometimes nest). */
function eventKeysOf(obj) {
  if (!obj || typeof obj !== 'object') return [];
  const pools = [Object.keys(obj)];
  for (const sub of ['events', 'hooks']) {
    if (obj[sub] && typeof obj[sub] === 'object' && !Array.isArray(obj[sub])) {
      pools.push(Object.keys(obj[sub]));
    }
  }
  return [...new Set(pools.flat().filter((k) => HOOK_EVENTS.has(k)))];
}

function summarizeModule(mod, i) {
  if (!mod || typeof mod !== 'object') return { index: i, events: [] };
  return {
    index: i,
    name: mod.name ?? mod.id ?? mod.module ?? null,
    path: mod.path ?? mod.source ?? null,
    events: eventKeysOf(mod),
  };
}

/** One split probe: does `repo` carry `.claude-plugin/marketplace.json` at
 *  root? Files the result into out.split and returns 'marketplace' |
 *  'standalone' | 'unknown'. */
async function probeSplit(info, out) {
  const { status } = await gh(
    `${API_ROOT}/repos/${info.repo}/contents/.claude-plugin/marketplace.json`
  );
  if (!out.split.probed.includes(info.repo)) out.split.probed.push(info.repo);
  if (status === 200) {
    out.split.marketplace.push(info.repo);
    console.log(`split ${info.repo}: marketplace.json YES`);
  } else if (status === 404) {
    out.split.standalone.push(info.repo);
    console.log(`split ${info.repo}: marketplace.json no (standalone)`);
  } else {
    out.split.unknown.push({ repo: info.repo, status });
    console.log(`split ${info.repo}: HTTP ${status}`);
  }
  await new Promise((r) => setTimeout(r, 300));
  return status === 200 ? 'marketplace' : status === 404 ? 'standalone' : 'unknown';
}

/** Fetch hooks.json for a standalone repo and record its event surface. */
async function fetchEventSurface(info, out) {
  const { status, text } = await gh(`${API_ROOT}/repos/${info.repo}/contents/${info.hooksPath}`, {
    raw: true,
  });
  if (status !== 200) {
    out.eventSurfaces.push({ repo: info.repo, hooksPath: info.hooksPath, fetchStatus: status });
    console.log(`events ${info.repo}: HTTP ${status}`);
    return;
  }
  const hooks = safeJson(text);
  const modules = Array.isArray(hooks?.modules) ? hooks.modules : [];
  out.eventSurfaces.push({
    repo: info.repo,
    hooksPath: info.hooksPath,
    stars: info.stars ?? null,
    classicEventKeys: eventKeysOf(hooks), // legacy settings-hooks keys on the file itself
    modsCount: modules.length,
    modules: modules.slice(0, 12).map(summarizeModule),
  });
  const es = out.eventSurfaces.at(-1);
  console.log(`events ${info.repo}: classic=[${es.classicEventKeys}] mods=${modules.length}`);
  await new Promise((r) => setTimeout(r, 300));
}

async function main() {
  const args = process.argv.slice(2);
  const resumeIdx = args.indexOf('--resume');
  const resumeFile = resumeIdx >= 0 ? args[resumeIdx + 1] : null;
  const probeIdx = args.indexOf('--probe');
  const probeList = probeIdx >= 0 ? (args[probeIdx + 1] ?? '').split(',').filter(Boolean) : [];

  const out = resumeFile
    ? JSON.parse(readFileSync(resumeFile, 'utf8'))
    : {
        ranAt: new Date().toISOString(),
        query: SEARCH_QUERY,
        budget: BUDGET,
        census: null,
        split: { probed: [], marketplace: [], standalone: [], unknown: [] },
        eventSurfaces: [],
        apiCallsUsed: 0,
        truncated: false,
      };
  if (resumeFile) out.resumeAt = new Date().toISOString();
  callsUsed = out.apiCallsUsed || 0; // budget is cumulative across the spike

  if (resumeFile) {
    // ---- resume: split-probe the requested repos, fetch standalone hooks -
    const byRepo = new Map((out.census?.sample ?? []).map((s) => [s.repo, s]));
    for (const repo of probeList) {
      if (callsUsed >= BUDGET) {
        out.truncated = true;
        break;
      }
      const known = byRepo.get(repo);
      const info = known ?? { repo, hooksPath: 'hooks/hooks.json', stars: null, pushedAt: null };
      const verdict = await probeSplit(info, out);
      if (verdict === 'standalone' && callsUsed < BUDGET) await fetchEventSurface(info, out);
    }
  } else {
    // ---- 1. Census: up to 2 search pages, freshest-indexed first ---------
    const items = [];
    for (const page of [1, 2]) {
      const { status, j, budgetExhausted } = await gh(
        `${API_ROOT}/search/code?q=${encodeURIComponent(SEARCH_QUERY)}&per_page=100&sort=indexed&order=desc&page=${page}`
      );
      if (budgetExhausted) break;
      if (status !== 200) {
        console.log(`search page ${page}: HTTP ${status} — stopping`);
        break;
      }
      out.census = {
        totalCount: j.total_count,
        fetchedFiles: (out.census?.fetchedFiles ?? 0) + j.items.length,
      };
      items.push(...j.items);
      console.log(`search page ${page}: total_count=${j.total_count} page_items=${j.items.length}`);
      if (j.items.length < 100) break;
      await new Promise((r) => setTimeout(r, 8000)); // search API: 30 req/min
    }

    if (!items.length) {
      out.apiCallsUsed = callsUsed;
      writeFileSync('spike-capture-results.json', JSON.stringify(out, null, 2));
      console.log('no search results; wrote skeleton results file');
      return;
    }

    // Distinct repos in first-seen order, with the hooks.json path the index gave us.
    const repos = new Map(); // full_name -> { repo, path, stars, pushedAt, sha }
    for (const it of items) {
      const name = it.repository?.full_name;
      if (!name || repos.has(name)) continue;
      repos.set(name, {
        repo: name,
        hooksPath: it.path,
        stars: it.repository?.stargazers_count ?? null,
        pushedAt: it.repository?.pushed_at ?? null,
        sha: it.sha,
      });
    }
    out.census.distinctReposInSample = repos.size;
    out.census.sample = [...repos.values()].slice(0, 25);

    // ---- 2. Split probe: root marketplace.json present? ------------------
    const probeRepos = [...repos.values()].slice(0, SPLIT_PROBES);
    const standaloneInfos = [];
    for (const info of probeRepos) {
      if (callsUsed >= BUDGET - EVENT_PROBES) {
        // reserve room for the event-surface fetches
        out.truncated = true;
        break;
      }
      const verdict = await probeSplit(info, out);
      if (verdict === 'standalone') standaloneInfos.push(info);
    }

    // ---- 3. Event surface for the first standalone repos -----------------
    for (const info of standaloneInfos.slice(0, EVENT_PROBES)) {
      if (callsUsed >= BUDGET) {
        out.truncated = true;
        break;
      }
      await fetchEventSurface(info, out);
    }
  }

  out.apiCallsUsed = callsUsed;
  writeFileSync('spike-capture-results.json', JSON.stringify(out, null, 2));
  console.log(
    `\ncensus=${out.census?.totalCount ?? '?'} distinctReposInSample=${out.census?.distinctReposInSample ?? '?'} ` +
      `marketplace=${out.split.marketplace.length}/${out.split.probed.length} probed ` +
      `standalone=${out.split.standalone.length}/${out.split.probed.length} probed ` +
      `eventSurfaces=${out.eventSurfaces.length} ` +
      `apiCalls=${callsUsed}/${BUDGET} truncated=${out.truncated}`
  );
  console.log('→ spike-capture-results.json');
}

main().catch((e) => {
  console.error('spike failed:', e.message);
  process.exit(1);
});
