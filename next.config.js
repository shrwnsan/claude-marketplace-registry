/** @type {import('next').NextConfig} */

const isProd = process.env.NODE_ENV === 'production';
const isAnalyzing = process.env.ANALYZE === 'true';

const nextConfig = {
  // Image configuration
  images: {
    unoptimized: true,
  },

  // Environment variables
  env: {
    SITE_URL: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
    GITHUB_REPO: process.env.NEXT_PUBLIC_GITHUB_REPO || 'claude-marketplace/aggregator',
    ECOSYSTEM_API_URL: process.env.NEXT_PUBLIC_ECOSYSTEM_API_URL || '/api/ecosystem-stats',
    ECOSYSTEM_CACHE_TTL: process.env.NEXT_PUBLIC_ECOSYSTEM_CACHE_TTL || '21600000',
    SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN,
    ANALYTICS_ID: process.env.NEXT_PUBLIC_ANALYTICS_ID,
  },

  // Disable ESLint and TypeScript checks during builds
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },

  // Enable strict mode and SWC minification
  reactStrictMode: true,
  swcMinify: true,
  compress: true,

  // Configure page extensions
  pageExtensions: ['ts', 'tsx', 'js', 'jsx'],

  // Generate build ID
  generateBuildId: async () => process.env.GITHUB_SHA || Date.now().toString(),

  // Remove console.log in production (except errors and warnings)
  compiler: {
    removeConsole: isProd ? { exclude: ['error', 'warn'] } : false,
  },

  // Webpack configuration
  webpack: (config, { dev, isServer }) => {
    // Fallbacks for server-side modules in client bundles
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }

    // Production optimizations
    if (!dev) {
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          charts: {
            test: /[\\/]node_modules[\\/](recharts|d3)[\\/]/,
            name: 'charts',
            priority: 20,
          },
          ecosystem: {
            test: /[\\/]src[\\/]components[\\/]EcosystemStats[\\/]/,
            name: 'ecosystem',
            priority: 10,
          },
        },
      };
    }

    // Bundle analyzer
    if (isAnalyzing) {
      const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
      config.plugins.push(
        new BundleAnalyzerPlugin({
          analyzerMode: 'static',
          openAnalyzer: false,
          reportFilename: 'bundle-analysis.html',
        })
      );
    }

    return config;
  },

  // Performance and monitoring headers
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Cache-Control', value: 's-maxage=21600, stale-while-revalidate=3600' },
        ],
      },
      {
        source: '/_next/static/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
    ];
  },

  // Redirects
  async redirects() {
    return [
      { source: '/docs', destination: '/docs/api', permanent: false },
    ];
  },
};

module.exports = nextConfig;
