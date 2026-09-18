import React from 'react';
import Head from 'next/head';
import MainLayout from '@/components/layout/MainLayout';
import { EcosystemStats } from '@/components/EcosystemStats';

const StatsPage: React.FC = () => (
  <>
    <Head>
      <title>Ecosystem Statistics - Claude Marketplace Registry</title>
      <meta
        name='description'
        content='Live Claude Code ecosystem statistics: growth trends, topic distribution, and quality indicators from the daily marketplace scans.'
      />
      <link rel='icon' href={`${process.env.NEXT_PUBLIC_BASE_PATH || ''}/favicon.ico`} />
    </Head>

    <MainLayout>
      <div className='min-h-screen bg-gray-50 dark:bg-gray-900'>
        <section className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16'>
          <EcosystemStats
            title='Ecosystem Statistics'
            subtitle='Live metrics from the daily marketplace scans'
            showRefreshButton={true}
            showLastUpdated={true}
            className='max-w-7xl mx-auto'
          />
        </section>
      </div>
    </MainLayout>
  </>
);

export default StatsPage;
