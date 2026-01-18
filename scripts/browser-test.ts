#!/usr/bin/env ts-node

/**
 * Browser Testing Script
 * Uses Puppeteer to test what's actually rendering on localhost:3000
 */

import puppeteer, { Browser, Page } from 'puppeteer';

interface TestResult {
  url: string;
  title: string;
  marketplacesCount: number;
  pluginsCount: number;
  hasContent: boolean;
  consoleLogs: string[];
  errors: string[];
  screenshots: {
    fullPage: string;
    marketplacesSection: string;
    console?: string;
  };
}

class BrowserTester {
  private browser: Browser | null = null;
  private page: Page | null = null;

  async init(): Promise<void> {
    console.log('🚀 Starting browser testing...');

    this.browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    this.page = await this.browser.newPage();

    // Set viewport
    await this.page.setViewport({ width: 1920, height: 1080 });

    // Capture console logs
    const consoleLogs: string[] = [];
    this.page.on('console', (msg) => {
      consoleLogs.push(`[${msg.type()}] ${msg.text()}`);
    });

    // Capture errors
    const errors: string[] = [];
    this.page.on('pageerror', (error) => {
      errors.push(`Page Error: ${error.message}`);
    });

    this.page.on('requestfailed', (request) => {
      errors.push(`Request Failed: ${request.url()} - ${request.failure()?.errorText}`);
    });

    console.log('✅ Browser initialized');
  }

  async testHomepage(): Promise<TestResult> {
    if (!this.page) {
      throw new Error('Browser not initialized');
    }

    const url = 'http://localhost:3000';
    const consoleLogs: string[] = [];
    const errors: string[] = [];

    console.log(`🔍 Testing homepage: ${url}`);

    try {
      // Navigate to the page
      const response = await this.page.goto(url, {
        waitUntil: 'networkidle2',
        timeout: 10000,
      });

      console.log(`📄 Page loaded with status: ${response?.status()}`);

      // Wait a bit for React to potentially render
      await new Promise((resolve) => setTimeout(resolve, 3000));

      // Get page title
      const title = await this.page.title();
      console.log(`📝 Page title: ${title}`);

      // Check if React actually rendered content
      const hasReactContent = await this.page.evaluate(() => {
        const nextElement = document.getElementById('__next');
        if (!nextElement) return false;

        // Check if it's just an empty div
        const innerHTML = nextElement.innerHTML.trim();
        return innerHTML !== '' && innerHTML !== '<div></div>';
      });

      console.log(`🎯 React content rendered: ${hasReactContent}`);

      // Count marketplaces and plugins
      const { marketplacesCount, pluginsCount } = await this.page.evaluate(() => {
        const marketplaces = document.querySelectorAll('[data-testid="marketplace-card"]');
        const plugins = document.querySelectorAll('[data-testid="plugin-card"]');

        // Also try to find content by text patterns
        const marketplaceHeadings = document.querySelectorAll('h2, h3');
        const pluginCards = document.querySelectorAll('.plugin-card, [class*="plugin"]');

        return {
          marketplacesCount: marketplaces.length || marketplaceHeadings.length,
          pluginsCount: plugins.length || pluginCards.length,
        };
      });

      console.log(`📊 Found ${marketplacesCount} marketplaces and ${pluginsCount} plugins`);

      // Check if it's using real data or mock data by looking for specific content
      const dataSource = await this.page.evaluate(() => {
        // Look for anthropic/claude-code specific content
        const hasAnthropic =
          document.body.innerText.includes('anthropic') ||
          document.body.innerText.includes('claude-code');

        // Look for mock data indicators
        const hasMockIndicators =
          document.body.innerText.includes('npm marketplace') ||
          document.body.innerText.includes('GitHub Marketplace') ||
          document.body.innerText.includes('Community Hub');

        return {
          hasAnthropic,
          hasMockIndicators,
          bodyText: document.body.innerText.substring(0, 500), // First 500 chars
        };
      });

      console.log(`🔍 Data source analysis:`, dataSource);

      // Take full page screenshot
      await this.page.screenshot({
        path: 'screenshots/fullpage.png',
        fullPage: true,
      });

      console.log('📸 Full page screenshot saved');

      // Get console logs and errors
      const pageConsoleLogs = await this.page.evaluate(() => {
        // Try to get React-specific logs
        const logs: string[] = [];
        // This won't work directly, but we can check for React DevTools presence
        return logs;
      });

      return {
        url,
        title,
        marketplacesCount,
        pluginsCount,
        hasContent: hasReactContent,
        consoleLogs: [...consoleLogs, ...pageConsoleLogs],
        errors,
        screenshots: {
          fullPage: 'screenshots/fullpage.png',
          marketplacesSection: 'screenshots/fullpage.png', // We'll take a more targeted one if needed
        },
      };
    } catch (error) {
      console.error('❌ Error testing homepage:', error);
      throw error;
    }
  }

  async checkNetworkRequests(): Promise<void> {
    if (!this.page) return;

    console.log('🌐 Checking network requests...');

    const requests = await this.page.evaluate(() => {
      // Check if our data endpoint was requested
      return performance
        .getEntriesByType('resource')
        .filter((entry) => entry.name.includes('marketplaces.json'));
    });

    console.log(
      `📡 Found ${requests.length} marketplace.json requests:`,
      requests.map((r) => r.name)
    );

    // Also check if any API calls were made
    const apiCalls = await this.page.evaluate(() => {
      return performance
        .getEntriesByType('resource')
        .filter((entry) => entry.name.includes('/data/'));
    });

    console.log(
      `📡 Found ${apiCalls.length} data requests:`,
      apiCalls.map((r) => r.name)
    );
  }

  async testDataHook(): Promise<void> {
    if (!this.page) return;

    console.log('🔍 Testing what the data hook is actually returning...');

    // Check what data is available in the window object
    const hookData = await this.page.evaluate(() => {
      // Try to access the data that our hook should be loading
      return fetch('data/marketplaces.json')
        .then((response) => response.json())
        .catch((error) => {
          console.error('Fetch error:', error);
          return null;
        });
    });

    if (hookData) {
      const marketplaces = hookData.marketplaces || [];
      console.log('📊 Hook data retrieved successfully:');
      console.log(`   - Marketplaces: ${marketplaces.length}`);
      if (marketplaces.length > 0) {
        console.log(`   - First marketplace: ${marketplaces[0].name}`);
        console.log(`   - Plugins in first: ${marketplaces[0].plugins?.length || 0}`);
      }
    } else {
      console.log('❌ Hook data fetch failed');
    }

    // Also check what's being rendered in the DOM
    const domData = await this.page.evaluate(() => {
      const marketplaceCards = document.querySelectorAll('[class*="marketplace"], [class*="card"]');
      const marketplaceHeadings = Array.from(document.querySelectorAll('h2, h3, h4')).filter(
        (h) =>
          h.textContent?.toLowerCase().includes('marketplace') ||
          h.textContent?.toLowerCase().includes('claude')
      );

      const pluginCards = document.querySelectorAll('[class*="plugin"], [class*="card"]');

      return {
        marketplaceCards: marketplaceCards.length,
        marketplaceHeadings: marketplaceHeadings.length,
        pluginCards: pluginCards.length,
        marketplaceHeadingsText: marketplaceHeadings.map((h) => h.textContent?.trim()),
        bodyText: document.body.innerText.substring(0, 200),
      };
    });

    console.log('🎨 DOM Analysis:');
    console.log(`   - Marketplace cards: ${domData.marketplaceCards}`);
    console.log(`   - Marketplace headings: ${domData.marketplaceHeadings}`);
    console.log(`   - Plugin cards: ${domData.pluginCards}`);
    console.log(`   - Headings text: ${domData.marketplaceHeadingsText.slice(0, 3)}`);
    console.log(`   - Body preview: ${domData.bodyText}`);
  }

  async testDirectDataEndpoint(): Promise<void> {
    console.log('🔗 Testing direct data endpoint...');

    try {
      const response = await fetch('http://localhost:3000/data/marketplaces.json');
      const data = await response.json();

      const marketplaces = data.marketplaces || [];
      console.log(`✅ Data endpoint responding with ${marketplaces.length} marketplaces`);

      if (marketplaces.length > 0) {
        const firstMarketplace = marketplaces[0];
        console.log('📋 First marketplace:', {
          name: firstMarketplace.name,
          stars: firstMarketplace.stars,
          plugins: firstMarketplace.plugins?.length || 0,
        });
      }
    } catch (error) {
      console.error('❌ Data endpoint test failed:', error);
    }
  }

  async cleanup(): Promise<void> {
    if (this.page) {
      await this.page.close();
    }
    if (this.browser) {
      await this.browser.close();
    }
    console.log('🧹 Browser cleanup completed');
  }
}

async function runTests(): Promise<void> {
  const tester = new BrowserTester();

  try {
    await tester.init();

    // Test direct data endpoint first
    await tester.testDirectDataEndpoint();

    // Test the homepage
    const result = await tester.testHomepage();

    // Check network requests
    await tester.checkNetworkRequests();

    // Test the data hook
    await tester.testDataHook();

    // Print results
    console.log('\n📊 TEST RESULTS:');
    console.log('================');
    console.log(`URL: ${result.url}`);
    console.log(`Title: ${result.title}`);
    console.log(`React rendered: ${result.hasContent}`);
    console.log(`Marketplaces found: ${result.marketplacesCount}`);
    console.log(`Plugins found: ${result.pluginsCount}`);
    console.log(`Console logs: ${result.consoleLogs.length}`);
    console.log(`Errors: ${result.errors.length}`);

    if (result.errors.length > 0) {
      console.log('\n❌ ERRORS:');
      result.errors.forEach((error) => console.log(`  - ${error}`));
    }

    if (result.consoleLogs.length > 0) {
      console.log('\n📝 CONSOLE LOGS:');
      result.consoleLogs.forEach((log) => console.log(`  - ${log}`));
    }

    console.log(`\n📸 Screenshots saved to: ${result.screenshots.fullPage}`);

    // Analysis
    console.log('\n🔍 ANALYSIS:');
    console.log('================');

    if (!result.hasContent) {
      console.log('❌ React is NOT rendering - empty div detected');
      console.log('   This indicates a JavaScript execution or hydration failure');
    } else {
      console.log('✅ React is rendering content');
    }

    if (result.marketplacesCount === 1 && result.pluginsCount === 5) {
      console.log('✅ CORRECT: Shows 1 marketplace with 5 plugins (real data)');
    } else if (result.marketplacesCount > 1) {
      console.log(
        `⚠️  UNEXPECTED: Shows ${result.marketplacesCount} marketplaces (likely mock data)`
      );
    } else {
      console.log(
        `❓ UNKNOWN: Shows ${result.marketplacesCount} marketplaces and ${result.pluginsCount} plugins`
      );
    }
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await tester.cleanup();
  }
}

// Create screenshots directory
import fs from 'fs';
import path from 'path';

const screenshotsDir = path.join(process.cwd(), 'screenshots');
if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir, { recursive: true });
}

// Run the tests
runTests().catch(console.error);
