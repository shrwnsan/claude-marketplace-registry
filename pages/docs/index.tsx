import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import MainLayout from '@/components/layout/MainLayout';
import {
  BookOpen,
  Database,
  ScanSearch,
  ShieldCheck,
  RefreshCw,
  ArrowRight,
  Github,
} from 'lucide-react';

const REPO_URL = 'https://github.com/shrwnsan/claude-marketplace-registry';

const DocsPage: React.FC = () => {
  return (
    <>
      <Head>
        <title>Documentation - Claude Marketplace Registry</title>
        <meta
          name='description'
          content='How the Claude Marketplace Registry discovers, validates, and serves the Claude Code plugin ecosystem.'
        />
        <link rel='icon' href={`${process.env.NEXT_PUBLIC_BASE_PATH || ''}/favicon.ico`} />
      </Head>

      <MainLayout>
        <div className='min-h-screen bg-gray-50 dark:bg-gray-900'>
          {/* Header */}
          <section className='bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700'>
            <div className='max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12'>
              <p className='text-sm font-medium text-primary-600 dark:text-primary-400 uppercase tracking-wider mb-2'>
                Documentation
              </p>
              <h1 className='text-3xl sm:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-3'>
                How this aggregator works
              </h1>
              <p className='text-lg text-gray-600 dark:text-gray-300'>
                The Claude Marketplace Registry scans GitHub daily for Claude Code marketplace
                repositories, validates their manifests, and publishes everything as a browsable
                catalog and a free JSON API.
              </p>
            </div>
          </section>

          <div className='max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10'>
            {/* How discovery works */}
            <section aria-labelledby='discovery-heading'>
              <h2
                id='discovery-heading'
                className='text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center'
              >
                <ScanSearch className='w-6 h-6 mr-2 text-primary-500' />
                How discovery works
              </h2>
              <div className='card p-6 space-y-4 text-gray-600 dark:text-gray-300 leading-relaxed'>
                <p>
                  Every day at 00:00 UTC a scheduled GitHub Actions run executes an 11-strategy
                  search across GitHub — manifest file paths (
                  <code>.claude-plugin/marketplace.json</code>
                  ), repository topics (<code>claude-plugins</code>, <code>claude-skills</code>, …),
                  and name/description matches. Results are deduplicated and merged with a seed list
                  of known marketplaces.
                </p>
                <p>
                  Each candidate repository is probed for a spec-compliant{' '}
                  <code>.claude-plugin/marketplace.json</code> manifest. Plugins are extracted from
                  valid manifests, joined to their parent marketplace, and validated. Every number
                  on this site traces back to that scan — nothing is estimated or mocked.
                </p>
              </div>
            </section>

            {/* Data pipeline */}
            <section aria-labelledby='pipeline-heading'>
              <h2
                id='pipeline-heading'
                className='text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center'
              >
                <RefreshCw className='w-6 h-6 mr-2 text-primary-500' />
                Freshness &amp; pipeline
              </h2>
              <div className='card p-6'>
                <ol className='space-y-3 text-gray-600 dark:text-gray-300 list-decimal list-inside leading-relaxed'>
                  <li>
                    <strong className='text-gray-900 dark:text-gray-100'>Scan</strong> — daily
                    multi-strategy GitHub search (00:00 UTC).
                  </li>
                  <li>
                    <strong className='text-gray-900 dark:text-gray-100'>Validate</strong> —
                    manifests are parsed and plugins extracted.
                  </li>
                  <li>
                    <strong className='text-gray-900 dark:text-gray-100'>Generate</strong> — stats,
                    topic counts, and history snapshots are computed.
                  </li>
                  <li>
                    <strong className='text-gray-900 dark:text-gray-100'>Gate</strong> — a validator
                    checks counts, ID integrity, and data freshness before anything ships.
                  </li>
                  <li>
                    <strong className='text-gray-900 dark:text-gray-100'>Publish</strong> — an
                    automated PR is reviewed by CI and merged; the static site rebuilds on GitHub
                    Pages.
                  </li>
                </ol>
                <p className='mt-4 text-sm text-gray-500 dark:text-gray-400 flex items-center'>
                  <ShieldCheck className='w-4 h-4 mr-1.5 text-success-500' />
                  The whole chain runs unattended — catalog data on this site is at most one day
                  old.
                </p>
              </div>
            </section>

            {/* JSON API teaser */}
            <section aria-labelledby='api-heading'>
              <h2
                id='api-heading'
                className='text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center'
              >
                <Database className='w-6 h-6 mr-2 text-primary-500' />
                JSON data API
              </h2>
              <div className='card p-6'>
                <p className='text-gray-600 dark:text-gray-300 leading-relaxed mb-4'>
                  The entire catalog is available as free, public JSON — no key, no rate limit
                  beyond GitHub Pages&#39; CDN, CORS enabled for every origin. Point your scripts,
                  dashboards, or agents at it:
                </p>
                <div className='grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5'>
                  {[
                    ['stats.json', 'Ecosystem totals, trends, topics'],
                    ['marketplaces.json', 'All discovered marketplaces'],
                    [
                      'plugins.json',
                      'Compact plugin index (full records per marketplace in data/plugins/)',
                    ],
                    ['history.json', 'Daily snapshot history'],
                  ].map(([file, desc]) => (
                    <div
                      key={file}
                      className='bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3 border border-gray-100 dark:border-gray-700'
                    >
                      <code className='text-sm font-semibold text-primary-600 dark:text-primary-400'>
                        data/{file}
                      </code>
                      <p className='text-xs text-gray-500 dark:text-gray-400 mt-1'>{desc}</p>
                    </div>
                  ))}
                </div>
                <Link href='/docs/api' className='btn btn-primary inline-flex items-center group'>
                  Full API reference
                  <ArrowRight className='w-4 h-4 ml-2 transform transition-transform group-hover:translate-x-1' />
                </Link>
              </div>
            </section>

            {/* For maintainers */}
            <section aria-labelledby='maintainers-heading'>
              <h2
                id='maintainers-heading'
                className='text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center'
              >
                <BookOpen className='w-6 h-6 mr-2 text-primary-500' />
                Getting your marketplace listed
              </h2>
              <div className='card p-6 space-y-3 text-gray-600 dark:text-gray-300 leading-relaxed'>
                <p>
                  Listing is automatic: publish a spec-compliant{' '}
                  <code>.claude-plugin/marketplace.json</code> at your repository root, and the next
                  daily scan will discover it. Adding the <code>claude-plugins</code> or{' '}
                  <code>claude-skills</code> topic improves discoverability.
                </p>
                <p>
                  Found bad data, want a repository excluded, or have an idea?{' '}
                  <a
                    href={`${REPO_URL}/issues`}
                    target='_blank'
                    rel='noopener noreferrer'
                    className='text-primary-600 dark:text-primary-400 hover:underline inline-flex items-center'
                  >
                    Open an issue on GitHub
                    <Github className='w-3.5 h-3.5 ml-1' />
                  </a>
                  .
                </p>
              </div>
            </section>
          </div>
        </div>
      </MainLayout>
    </>
  );
};

export default DocsPage;
