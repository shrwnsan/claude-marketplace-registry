#!/usr/bin/env node
/**
 * Build-time sitemap generator — runs via the `prebuild` npm hook so every
 * deploy ships a fresh public/sitemap.xml (the scan-time generator could
 * never reach production: its artifact only carries data/ paths, so the
 * file 404ed on GitHub Pages since #360).
 *
 * Reads the generated data JSONs (committed by the nightly data-update PRs),
 * writes public/sitemap.xml. Zero dependencies; NEXT_PUBLIC_SITE_URL defaults
 * to the production origin — NOT localhost — because a deployed robots.txt
 * points at this file.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const ROOT = process.cwd();
const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || 'https://shrwnsan.github.io/claude-marketplace-registry';
const today = new Date().toISOString().split('T')[0];

const readJson = (rel) => {
  try {
    return JSON.parse(readFileSync(path.join(ROOT, rel), 'utf-8'));
  } catch {
    return [];
  }
};

const marketplaces = readJson('public/data/marketplaces.json');
const plugins = readJson('public/data/plugins.json');

const url = (loc, { changefreq = 'daily', priority = '0.8', lastmod = today } = {}) => `
  <url>
    <loc>${SITE_URL}${loc}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${[
  url('/', { priority: '1.0' }),
  url('/marketplaces', { priority: '0.9' }),
  url('/plugins', { priority: '0.9' }),
  url('/mods', { priority: '0.9' }),
  url('/stats', { priority: '0.8' }),
  url('/docs', { changefreq: 'weekly', priority: '0.6' }),
  url('/docs/api', { changefreq: 'weekly', priority: '0.6' }),
  ...marketplaces.map((mp) =>
    url(`/marketplaces/${mp.id}`, {
      changefreq: 'weekly',
      priority: '0.7',
      lastmod: mp.updatedAt ? String(mp.updatedAt).split('T')[0] : today,
    })
  ),
  ...plugins.map((p) => url(`/plugins/${p.id}`, { changefreq: 'weekly', priority: '0.6' })),
].join('')}
</urlset>
`;

const outPath = path.join(ROOT, 'public', 'sitemap.xml');
writeFileSync(outPath, sitemap);
const count = (sitemap.match(/<loc>/g) || []).length;
console.log(`🗺️ Generated sitemap.xml — ${count} URLs (site-wide rollout build hook)`);
if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  // Direct invocation: nothing else to do; npm prebuild also lands here.
}
