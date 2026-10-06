#!/usr/bin/env node
/** SPIKE part 2 — measure ecosystem-wide mods adoption via GitHub code search. */
import { readFileSync, writeFileSync } from 'node:fs';

function loadToken() {
  if (process.env.GITHUB_TOKEN) return process.env.GITHUB_TOKEN;
  for (const p of ['.env.local', '../../.env.local']) {
    try {
      const line = readFileSync(p, 'utf8').split('\n').find((l) => l.trim().startsWith('GITHUB_TOKEN='));
      if (line) return line.slice(line.indexOf('=') + 1).trim().replace(/^["']|["']$/g, '');
    } catch { /* no such file */ }
  }
  return null;
}
const token = loadToken();
const gh = async (url) => {
  const res = await fetch(url, { headers: { Accept: 'application/vnd.github+json', 'User-Agent': 'cmr-mods-spike', Authorization: `Bearer ${token}` } });
  return { status: res.status, j: await res.json().catch(() => null) };
};

const queries = {
  markerStrict: `"modules" filename:hooks.json path:hooks`,
  markerLoose: `"modules" filename:hooks.json`,
};
const out = {};
for (const [name, q] of Object.entries(queries)) {
  const { status, j } = await gh(`https://api.github.com/search/code?q=${encodeURIComponent(q)}&per_page=40&sort=indexed`);
  out[name] = status === 200
    ? { total: j.total_count, repos: [...new Set(j.items.map((i) => i.repository.full_name))], sample: j.items.slice(0, 12).map((i) => `${i.repository.full_name} ${i.path}`) }
    : { status };
  console.log(`${name}: status=${status} total=${out[name].total ?? '?'} distinct-repos=${out[name].repos?.length ?? '?'}`);
  await new Promise((r) => setTimeout(r, 8000)); // search API: 30 req/min, be polite
}
writeFileSync('spike-search-results.json', JSON.stringify(out, null, 2));
console.log('→ spike-search-results.json');
