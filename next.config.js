/** @type {import('next').NextConfig} */

// Get repository name from environment or use default
const repoName = process.env.REPOSITORY_NAME || 'claude-marketplace-repo';

/**
 * Generate CSP nonce for inline scripts
 */
function generateCspNonce() {
  const crypto = require('crypto');
  return crypto.randomBytes(16).toString('base64');
}

const nextConfig = {
  // Output configuration for static export
  output: 'export',
  trailingSlash: true,
  distDir: 'out',

  // Image configuration for static export
  images: {
    unoptimized: true,
  },

  // Base path for GitHub Pages deployment
  basePath: process.env.NODE_ENV === 'production' ? `/${repoName}` : '',
  assetPrefix: process.env.NODE_ENV === 'production' ? `/${repoName}` : '',

  // Environment variables
  env: {
    SITE_URL: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
    GITHUB_REPO: process.env.NEXT_PUBLIC_GITHUB_REPO || 'claude-marketplace/aggregator',
  },

  // Experimental features
  experimental: {
    // CSS optimization disabled for static export compatibility
    // optimizeCss: true,
  },

  // Webpack configuration
  webpack: (config, { isServer }) => {
    // Custom webpack configurations
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

  // Headers configuration for security and performance
  async headers() {
    // Generate CSP nonce for inline scripts (in production)
    const isProduction = process.env.NODE_ENV === 'production';
    const cspNonce = isProduction ? generateCspNonce() : '';

    return [
      {
        source: '/(.*)',
        headers: [
          // Content Security Policy
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' https://fonts.googleapis.com",
              isProduction ? `'nonce-${cspNonce}'` : "'unsafe-inline'",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "img-src 'self' data: https: blob:",
              "font-src 'self' data: https://fonts.gstatic.com",
              "connect-src 'self' https://api.github.com https://fonts.googleapis.com",
              "frame-ancestors 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "upgrade-insecure-requests",
              "block-all-mixed-content",
            ].filter(Boolean).join('; '),
          },
          // Additional security headers
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: [
              'camera=()',
              'microphone=()',
              'geolocation=()',
              'payment=()',
              'usb=()',
              'magnetometer=()',
              'gyroscope=()',
              'accelerometer=()',
            ].join(', '),
          },
          // HSTS (HTTPS only in production)
          ...(isProduction ? [{
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains; preload',
          }] : []),
          // Cache control for static assets
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/data/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=3600, must-revalidate',
          },
        ],
      },
      {
        source: '/_next/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/api/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, no-cache, must-revalidate, proxy-revalidate',
          },
        ],
      },
    ];
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