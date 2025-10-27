/** @type {import('next').NextConfig} */

const nextConfig = {
  // Image configuration
  images: {
    unoptimized: true,
  },

  // Environment variables
  env: {
    SITE_URL: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
    GITHUB_REPO: process.env.NEXT_PUBLIC_GITHUB_REPO || 'claude-marketplace/aggregator',
    // API endpoints for ecosystem statistics
    ECOSYSTEM_API_URL: process.env.NEXT_PUBLIC_ECOSYSTEM_API_URL || '/api/ecosystem-stats',
    ECOSYSTEM_CACHE_TTL: process.env.NEXT_PUBLIC_ECOSYSTEM_CACHE_TTL || '21600000', // 6 hours
    // Monitoring and analytics
    SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN,
    ANALYTICS_ID: process.env.NEXT_PUBLIC_ANALYTICS_ID,
  },

  // Disable ESLint during builds to allow deployment
  eslint: {
    ignoreDuringBuilds: true,
  },

  // Disable TypeScript checking during builds
  typescript: {
    ignoreBuildErrors: true,
  },

  // Webpack configuration for optimized production builds
  webpack: (config, { isServer, dev }) => {
    // Custom webpack configurations for static export compatibility
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
    };

    // Add support for .json files
    config.module.rules.push({
      test: /\.json$/,
      type: 'json',
    });

    // Production optimizations
    if (!dev) {
      // Code splitting for chart libraries
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            // Separate chunk for chart libraries
            charts: {
              test: /[\\/]node_modules[\\/](recharts|d3)[\\/]/,
              name: 'charts',
              chunks: 'all',
              priority: 20,
            },
            // Separate chunk for ecosystem components
            ecosystem: {
              test: /[\\/]src[\\/]components[\\/]EcosystemStats[\\/]/,
              name: 'ecosystem',
              chunks: 'all',
              priority: 10,
            },
          },
        },
      };
    }

    return config;
  },

  // Enable strict mode for better development experience
  reactStrictMode: true,

  // Enable SWC minification for better performance
  swcMinify: true,

  // Configure page extensions
  pageExtensions: ['ts', 'tsx', 'js', 'jsx'],

  // Static generation configuration with build optimization
  generateBuildId: async () => {
    // Use commit hash or timestamp for build ID
    return process.env.GITHUB_SHA || Date.now().toString();
  },

  // Production optimizations
  compiler: {
    // Remove console.log in production
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
  },

  // Performance and monitoring headers
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 's-maxage=21600, stale-while-revalidate=3600', // 6 hours cache, 1 hour stale
          },
        ],
      },
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable', // 1 year cache
          },
        ],
      },
    ];
  },

  // Compression and optimization
  compress: true,

  // Bundle analyzer for development
  ...(process.env.ANALYZE === 'true' && {
    webpack: (config) => {
      const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
      config.plugins.push(
        new BundleAnalyzerPlugin({
          analyzerMode: 'static',
          openAnalyzer: false,
          reportFilename: 'bundle-analysis.html',
        })
      );
      return config;
    },
  }),
};

module.exports = nextConfig;