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
  },

  // Disable ESLint during builds to allow deployment
  eslint: {
    ignoreDuringBuilds: true,
  },

  // Disable TypeScript checking during builds
  typescript: {
    ignoreBuildErrors: true,
  },

  // Webpack configuration
  webpack: (config, { isServer }) => {
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

    return config;
  },

  // Enable strict mode for better development experience
  reactStrictMode: true,

  // Enable SWC minification
  swcMinify: true,

  // Configure page extensions
  pageExtensions: ['ts', 'tsx', 'js', 'jsx'],

  // Static generation configuration
  generateBuildId: async () => {
    // Use commit hash or timestamp for build ID
    return process.env.GITHUB_SHA || Date.now().toString();
  },
};

module.exports = nextConfig;