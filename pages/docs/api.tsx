import React, { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import MainLayout from '@/components/layout/MainLayout';
import { Copy, Check, Database, Globe, Code } from 'lucide-react';

const BASE = 'https://shrwnsan.github.io/claude-marketplace-registry';

interface Endpoint {
  file: string;
  description: string;
  shape: string;
  example: string;
}

const ENDPOINTS: Endpoint[] = [
  {
    file: 'data/stats.json',
    description:
      'Ecosystem overview: plugin/marketplace/developer/star totals, 30-day growth rates (null until a baseline snapshot exists), daily trend series, topic counts, and computed quality signals.',
    shape: `{ "success": true,
  "data": {
    "overview": {
      "totalPlugins": 1274,
      "totalMarketplaces": 100,
      "totalDevelopers": 396,
      "totalStars": 311529,
      "lastUpdated": "2026-09-18T…Z",
      "growthRate": { "plugins": null, "marketplaces": null, "developers": null, "stars": null }
    },
    "plugins":  [{ "date": "2026-02-23", "value": 178 }, …],
    "categories": [{ "id": "claude-code", "name": "claude-code", "count": 936 }, …],
    "insights": ["1274 plugins discovered across 100 marketplaces", …],
    "manifestCoverage": { "withManifest": 99, "total": 100, "rate": 99 },
    "maintenance": { "recentlyUpdated": 90, "recentlyUpdatedRate": 90, "staleOver180Days": 0 }
  },
  "meta": { "timestamp": "2026-09-18T…Z" } }`,
    example: `curl -s ${BASE}/data/stats.json | jq '.data.overview'`,
  },
  {
    file: 'data/marketplaces.json',
    description:
      'Every discovered marketplace as a bare array. Topics overlap — a marketplace can carry several.',
    shape: `[
  {
    "id": "1061953414",
    "name": "skills",
    "description": "Public repository for Agent Skills",
    "url": "https://github.com/anthropics/skills",
    "stars": 176783,
    "forks": 20932,
    "language": "Python",
    "updatedAt": "2026-09-18T…Z",
    "topics": ["agent-skills"],
    "hasManifest": true
  }, … ]`,
    example: `curl -s ${BASE}/data/marketplaces.json \\
  | jq '[.[] | select(.stars > 1000)] | sort_by(-.stars)'`,
  },
  {
    file: 'data/plugins.json',
    description:
      'Compact plugin index — one row per plugin (description truncated to 160 chars, skill count only). Full records are sharded per marketplace under data/plugins/<marketplaceId>.json.',
    shape: `[
  {
    "id": "1061953414-academy-guide",
    "name": "academy-guide",
    "description": "Recommends relevant Claude Academy courses…",
    "version": "1.0.0",
    "author": "Keith Lazuka",
    "isValid": true,
    "marketplaceId": "1061953414",
    "marketplaceName": "skills",
    "skillsCount": 1
  }, … ]`,
    example: `curl -s ${BASE}/data/plugins.json \\
  | jq '[.[] | select(.marketplaceName == "skills")]'`,
  },
  {
    file: 'data/plugins/<marketplaceId>.json',
    description:
      'Full plugin records for one marketplace (repository, manifestPath, skills, errors, warnings). Take the marketplaceId from the index, then fetch its shard.',
    shape: `[
  {
    "id": "1061953414-academy-guide",
    "name": "academy-guide",
    "description": "Recommends relevant Claude Academy courses…",
    "version": "1.0.0",
    "author": "Keith Lazuka",
    "repository": "https://github.com/anthropics/skills",
    "manifestPath": "academy-guide",
    "isValid": true,
    "errors": [],
    "warnings": [],
    "metadata": {
      "marketplaceId": "1061953414",
      "marketplaceName": "skills",
      "skills": ["skills/academy-guide"]
    }
  }, … ]`,
    example: `curl -s ${BASE}/data/plugins/1061953414.json | jq 'length'  # plugins in that marketplace`,
  },
  {
    file: 'data/history.json',
    description:
      'One snapshot per daily scan — the source for every growth number on the site. Entries from ~Feb 2026 onward; developers was added mid-2026 and may be null in older entries.',
    shape: `[
  { "date": "2026-02-23T…Z", "marketplaces": 3,   "plugins": 178,  "stars": 114193 },
  { "date": "2026-09-18T…Z", "marketplaces": 100, "plugins": 1274, "stars": 311529, "developers": 396 },
  … ]`,
    example: `curl -s ${BASE}/data/history.json | jq 'length'  # days recorded`,
  },
];

const ApiDocumentation: React.FC = () => {
  const [copied, setCopied] = useState('');

  const copyToClipboard = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      setTimeout(() => setCopied(''), 2000);
    } catch {
      console.error('Failed to copy');
    }
  };

  return (
    <>
      <Head>
        <title>JSON Data API - Claude Marketplace Registry</title>
        <meta
          name='description'
          content='Free public JSON catalog of Claude Code marketplaces and plugins. No API key, CORS enabled, updated daily.'
        />
        <link rel='icon' href={`${process.env.NEXT_PUBLIC_BASE_PATH || ''}/favicon.ico`} />
      </Head>

      <MainLayout>
        <div className='min-h-screen bg-gray-50 dark:bg-gray-900'>
          {/* Header */}
          <section className='bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700'>
            <div className='max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12'>
              {/* Breadcrumb — doubles as the back-link to the docs overview */}
              <nav
                aria-label='Breadcrumb'
                className='font-mono text-xs uppercase tracking-[0.18em] mb-3 flex items-center gap-1.5'
              >
                <Link
                  href='/docs'
                  className='text-primary-600 dark:text-primary-400 hover:underline'
                >
                  docs
                </Link>
                <span className='text-gray-300 dark:text-gray-600' aria-hidden='true'>
                  /
                </span>
                <span className='text-gray-500 dark:text-gray-400' aria-current='page'>
                  api
                </span>
              </nav>
              <h1 className='text-3xl sm:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-3'>
                JSON Data API
              </h1>
              <p className='text-lg text-gray-600 dark:text-gray-300 mb-6'>
                The entire Claude Code plugin catalog is published as static JSON. No API key, no
                auth, CORS enabled for every origin — it is plain files on GitHub Pages, refreshed
                daily by the scan pipeline.
              </p>
              <div className='flex flex-wrap gap-2 text-sm'>
                <span className='badge badge-secondary flex items-center'>
                  <Globe className='w-3.5 h-3.5 mr-1' /> CORS: *
                </span>
                <span className='badge badge-secondary flex items-center'>
                  <Database className='w-3.5 h-3.5 mr-1' /> Updated daily ~00:00 UTC
                </span>
                <span className='badge badge-secondary flex items-center'>
                  <Code className='w-3.5 h-3.5 mr-1' /> Served via GitHub Pages CDN
                </span>
              </div>
            </div>
          </section>

          <div className='max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8'>
            {/* Base URL */}
            <section className='card p-5'>
              <h2 className='text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3'>
                Base URL
              </h2>
              <div className='flex items-center justify-between bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-100 dark:border-gray-700 px-4 py-3'>
                <code className='text-primary-600 dark:text-primary-400 break-all'>{BASE}</code>
                <button
                  title={`Copy: ${BASE}`}
                  onClick={() => copyToClipboard(BASE, 'base')}
                  className='btn-ghost p-1.5 ml-3 flex-shrink-0'
                  aria-label='Copy base URL'
                >
                  {copied === 'base' ? (
                    <Check className='w-4 h-4 text-green-500' />
                  ) : (
                    <Copy className='w-4 h-4' />
                  )}
                </button>
              </div>
              <p className='text-sm text-gray-500 dark:text-gray-400 mt-3'>
                Append any endpoint path below. Pages are cached by the GitHub Pages CDN (typically
                ~10 minutes), so poll at most every few minutes.
              </p>
            </section>

            {/* Endpoints */}
            {ENDPOINTS.map((endpoint) => (
              <section key={endpoint.file} className='card p-5 sm:p-6'>
                <div className='flex items-center justify-between gap-3 mb-3'>
                  <h2 className='text-lg font-semibold text-primary-600 dark:text-primary-400 break-all'>
                    /{endpoint.file}
                  </h2>
                  <button
                    title={`Copy URL: ${BASE}/${endpoint.file}`}
                    onClick={() => copyToClipboard(`${BASE}/${endpoint.file}`, endpoint.file)}
                    className='btn-ghost p-1.5 flex-shrink-0'
                    aria-label={`Copy ${endpoint.file} URL`}
                  >
                    {copied === endpoint.file ? (
                      <Check className='w-4 h-4 text-green-500' />
                    ) : (
                      <Copy className='w-4 h-4' />
                    )}
                  </button>
                </div>
                <p className='text-gray-600 dark:text-gray-300 text-sm leading-relaxed mb-4'>
                  {endpoint.description}
                </p>
                <div className='space-y-3'>
                  <div>
                    <p className='text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5'>
                      Response shape
                    </p>
                    <div className='code-block'>
                      <div className='code-block__bar'>
                        <span className='code-block__dot bg-error-400/70' aria-hidden='true' />
                        <span className='code-block__dot bg-warning-400/70' aria-hidden='true' />
                        <span className='code-block__dot bg-success-400/70' aria-hidden='true' />
                        <span className='code-block__file'>{endpoint.file}</span>
                      </div>
                      <pre className='code-block__pre'>{endpoint.shape}</pre>
                    </div>
                  </div>
                  <div>
                    <p className='text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5'>
                      Example
                    </p>
                    <div className='flex items-start justify-between gap-2 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-100 dark:border-gray-700 px-4 py-3'>
                      <code className='text-xs text-gray-700 dark:text-gray-200 break-all whitespace-pre-wrap'>
                        {endpoint.example}
                      </code>
                      <button
                        title={`Copy: ${endpoint.example}`}
                        onClick={() => copyToClipboard(endpoint.example, `ex-${endpoint.file}`)}
                        className='btn-ghost p-1 flex-shrink-0'
                        aria-label='Copy example'
                      >
                        {copied === `ex-${endpoint.file}` ? (
                          <Check className='w-4 h-4 text-green-500' />
                        ) : (
                          <Copy className='w-4 h-4' />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </section>
            ))}

            {/* Notes */}
            <section className='card p-5 sm:p-6'>
              <h2 className='text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3'>
                Data contract notes
              </h2>
              <ul className='space-y-2.5 text-sm text-gray-600 dark:text-gray-300 list-disc list-inside leading-relaxed'>
                <li>
                  <code>marketplaces.json</code> and <code>plugins.json</code> are bare arrays;{' '}
                  <code>stats.json</code> wraps its payload in{' '}
                  <code>{`{success, data, meta}`}</code>.
                </li>
                <li>
                  <code>plugins.json</code> is a compact index — fetch{' '}
                  <code>data/plugins/&lt;marketplaceId&gt;.json</code> for a marketplace&apos;s full
                  plugin records (repository, manifestPath, skills).
                </li>
                <li>
                  Growth rates are <code>null</code> until a baseline snapshot (&gt;0 days old)
                  exists — treat null as “no data”, not zero.
                </li>
                <li>
                  Topic counts overlap: one plugin appears under every topic its marketplace
                  carries. Never render them as a pie chart.
                </li>
                <li>
                  Plugin-level <code>stars</code> are the parent marketplace&#39;s stars; downloads
                  are not published (GitHub does not expose them per plugin).
                </li>
                <li>
                  Join plugins to marketplaces via{' '}
                  <code>metadata.marketplaceId === marketplace.id</code> (string comparison on both
                  sides).
                </li>
              </ul>
            </section>
          </div>
        </div>
      </MainLayout>
    </>
  );
};

export default ApiDocumentation;
