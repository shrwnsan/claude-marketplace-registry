#!/usr/bin/env node

/**
 * Production build script with validation and optimization
 * for the Claude Marketplace Registry with Ecosystem Statistics
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// ANSI color codes for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function logStep(step, message) {
  log(`\n[STEP ${step}] ${message}`, colors.cyan);
}

function logSuccess(message) {
  log(`✅ ${message}`, colors.green);
}

function logWarning(message) {
  log(`⚠️  ${message}`, colors.yellow);
}

function logError(message) {
  log(`❌ ${message}`, colors.red);
}

function runCommand(command, description, options = {}) {
  try {
    log(`Running: ${description}...`);
    const result = execSync(command, {
      stdio: 'inherit',
      ...options,
    });
    logSuccess(`${description} completed successfully`);
    return true;
  } catch (error) {
    logError(`${description} failed: ${error.message}`);
    return false;
  }
}

function validateEnvironment() {
  logStep(1, 'Environment Validation');

  const requiredEnvVars = ['NODE_ENV'];

  const optionalEnvVars = [
    'NEXT_PUBLIC_SITE_URL',
    'NEXT_PUBLIC_ECOSYSTEM_API_URL',
    'NEXT_PUBLIC_SENTRY_DSN',
    'NEXT_PUBLIC_ANALYTICS_ID',
  ];

  let allValid = true;

  // Check required variables
  requiredEnvVars.forEach((envVar) => {
    if (!process.env[envVar]) {
      logError(`Missing required environment variable: ${envVar}`);
      allValid = false;
    } else {
      logSuccess(`✓ ${envVar} is set`);
    }
  });

  // Check optional variables
  optionalEnvVars.forEach((envVar) => {
    if (process.env[envVar]) {
      logSuccess(`✓ ${envVar} is configured`);
    } else {
      logWarning(`Optional ${envVar} is not set (using defaults)`);
    }
  });

  // Set production environment if not set
  if (!process.env.NODE_ENV) {
    process.env.NODE_ENV = 'production';
    logWarning('NODE_ENV not set, defaulting to production');
  }

  return allValid;
}

function checkDependencies() {
  logStep(2, 'Dependency Check');

  // Check if package.json exists
  if (!fs.existsSync('package.json')) {
    logError('package.json not found');
    return false;
  }

  // Check if node_modules exists
  if (!fs.existsSync('node_modules')) {
    logWarning('node_modules not found, running npm install...');
    if (!runCommand('npm install', 'npm install')) {
      return false;
    }
  }

  logSuccess('Dependencies verified');
  return true;
}

function runPreBuildChecks() {
  logStep(3, 'Pre-Build Checks');

  const checks = [
    { command: 'npm run lint', desc: 'ESLint check' },
    { command: 'npm run type-check', desc: 'TypeScript compilation' },
  ];

  for (const check of checks) {
    if (!runCommand(check.command, check.desc)) {
      logError(`Pre-build check failed: ${check.desc}`);
      if (process.env.NODE_ENV === 'production') {
        logError('Build aborted due to failed pre-build checks');
        process.exit(1);
      } else {
        logWarning('Continuing despite failed pre-build checks...');
      }
    }
  }
}

function buildProject() {
  logStep(4, 'Production Build');

  // Set production environment
  process.env.NODE_ENV = 'production';

  // Run data generation first
  if (!runCommand('npm run scan:full', 'Ecosystem data generation')) {
    logWarning('Data generation failed, continuing with build...');
  }

  // Build the project
  const buildCmd = process.env.ANALYZE === 'true' ? 'npm run build -- --analyze' : 'npm run build';

  if (!runCommand(buildCmd, 'Next.js production build')) {
    logError('Build failed');
    return false;
  }

  logSuccess('Production build completed successfully');
  return true;
}

function validateBuild() {
  logStep(5, 'Build Validation');

  const buildDir = '.next';

  if (!fs.existsSync(buildDir)) {
    logError('Build directory not found');
    return false;
  }

  // Check for essential build files
  const essentialFiles = ['.next/BUILD_ID', '.next/routes-manifest.json'];

  for (const file of essentialFiles) {
    if (fs.existsSync(path.join(buildDir, file))) {
      logSuccess(`✓ ${file} found`);
    } else {
      logWarning(`Optional ${file} not found`);
    }
  }

  // Check bundle size
  try {
    const stats = fs.statSync(path.join(buildDir, 'static'));
    const sizeInMB = stats.size / (1024 * 1024);

    log(`Build size: ${sizeInMB.toFixed(2)} MB`, colors.blue);

    if (sizeInMB > 100) {
      logWarning('Build size is large (>100MB). Consider optimization.');
    } else {
      logSuccess('Build size is within acceptable limits');
    }
  } catch (error) {
    logWarning('Could not determine build size');
  }

  return true;
}

function generateBuildReport() {
  logStep(6, 'Build Report Generation');

  const report = {
    buildTime: new Date().toISOString(),
    nodeVersion: process.version,
    environment: process.env.NODE_ENV,
    platform: process.platform,
    buildId: process.env.GITHUB_SHA || Date.now().toString(),
  };

  const reportPath = '.next/build-report.json';

  try {
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    logSuccess(`Build report saved to ${reportPath}`);
  } catch (error) {
    logError(`Failed to save build report: ${error.message}`);
  }
}

function main() {
  log('\n🚀 Claude Marketplace Registry - Production Build', colors.magenta);
  log('='.repeat(60));

  const startTime = Date.now();

  try {
    // Run build pipeline
    if (!validateEnvironment()) {
      logError('Environment validation failed');
      process.exit(1);
    }

    if (!checkDependencies()) {
      logError('Dependency check failed');
      process.exit(1);
    }

    runPreBuildChecks();

    if (!buildProject()) {
      logError('Build failed');
      process.exit(1);
    }

    if (!validateBuild()) {
      logError('Build validation failed');
      process.exit(1);
    }

    generateBuildReport();

    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);

    log('\n🎉 Production build completed successfully!', colors.green);
    log(`⏱️  Total build time: ${duration}s`, colors.blue);
    log('\nNext steps:', colors.cyan);
    log('  - Test the build: npm run start');
    log('  - Deploy to staging/production');
    log('  - Monitor performance and error rates');
  } catch (error) {
    logError(`Build process failed: ${error.message}`);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  log('\n\n⚠️  Build interrupted by user', colors.yellow);
  process.exit(1);
});

process.on('SIGTERM', () => {
  log('\n\n⚠️  Build terminated', colors.yellow);
  process.exit(1);
});

// Run the build process
if (require.main === module) {
  main();
}
