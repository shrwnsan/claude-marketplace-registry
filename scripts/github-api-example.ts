#!/usr/bin/env ts-node

/**
 * GitHub API Integration Example
 * Demonstrates the usage of the GitHub API integration components
 */

import {
  createGitHubClient,
  createGitHubSearchService,
  createGitHubMetadataService,
  createContentFetcher,
} from '../src';

async function main() {
  console.log('🚀 GitHub API Integration Example');
  console.log('==================================\n');

  // Check if GitHub token is available
  const githubToken = process.env.GITHUB_TOKEN;
  if (!githubToken) {
    console.error('❌ GITHUB_TOKEN environment variable is required');
    console.log('Please set your GitHub Personal Access Token:');
    console.log('export GITHUB_TOKEN=ghp_your_token_here');
    process.exit(1);
  }

  // Initialize GitHub client
  console.log('📡 Initializing GitHub client...');
  const githubClient = createGitHubClient({
    token: githubToken,
    retry: {
      enabled: true,
      maxRetries: 3,
      baseDelay: 1000,
      maxDelay: 10000,
    },
  });

  // Check authentication
  if (!githubClient.isAuthenticated()) {
    console.error('❌ GitHub client is not authenticated');
    process.exit(1);
  }

  console.log('✅ GitHub client authenticated successfully\n');

  // Check rate limits
  console.log('📊 Checking rate limits...');
  const rateLimitResponse = await githubClient.getRateLimit();
  if (rateLimitResponse.success && rateLimitResponse.data) {
    const { core, search } = rateLimitResponse.data.resources;
    console.log(`Core API: ${core.remaining}/${core.limit} remaining`);
    console.log(`Search API: ${search.remaining}/${search.limit} remaining`);
    if (core.remaining < 100) {
      console.warn('⚠️  Low rate limit remaining. Consider waiting for reset.');
    }
  }
  console.log('');

  // Initialize services
  const searchService = createGitHubSearchService(githubClient, {
    maxResultsPerPage: 10,
    excludeForks: true,
    excludeArchived: true,
    minStars: 0,
  });

  const metadataService = createGitHubMetadataService(githubClient, {
    fetchLanguages: true,
    fetchContributors: true,
    fetchCommits: true,
    maxContributors: 5,
    maxCommits: 10,
  });

  const contentFetcher = createContentFetcher(githubClient, {
    maxFileSize: 1024 * 512, // 512KB
    cacheEnabled: true,
    cacheTTL: 1800, // 30 minutes
  });

  try {
    // Example 1: Search for marketplace repositories
    console.log('🔍 Searching for marketplace repositories...');
    const searchResponse = await searchService.searchMarketplaceRepositories(
      {
        query: '',
        stars: { min: 0 },
        updated: { from: '2024-01-01' },
      },
      1,
      5 // Limit to 5 results for demo
    );

    if (!searchResponse.success || !searchResponse.data) {
      console.error('❌ Search failed:', searchResponse.error?.message);
      return;
    }

    const { repositories, totalCount } = searchResponse.data;
    console.log(`✅ Found ${totalCount} repositories, showing first ${repositories.length}:\n`);

    // Example 2: Get metadata for first repository
    if (repositories.length > 0) {
      const repo = repositories[0];
      console.log(`📋 Analyzing repository: ${repo.full_name}`);
      console.log(`   Description: ${repo.description || 'No description'}`);
      console.log(`   Stars: ${repo.stargazers_count}, Forks: ${repo.forks_count}`);
      console.log(`   Language: ${repo.language || 'Unknown'}`);
      console.log(`   Updated: ${new Date(repo.updated_at).toLocaleDateString()}\n`);

      const [owner, repoName] = repo.full_name.split('/');

      // Example 3: Get enhanced metadata
      console.log('📈 Fetching enhanced metadata...');
      const metadataResponse = await metadataService.getEnhancedRepositoryMetadata(owner, repoName);

      if (metadataResponse.success && metadataResponse.data) {
        const metadata = metadataResponse.data;
        console.log(`   License: ${metadata.license || 'None'}`);
        console.log(`   Topics: ${metadata.topics.join(', ') || 'None'}`);
        console.log(`   Contributors: ${metadata.contributors?.length || 0}`);
        console.log(`   Recent commits: ${metadata.recentCommits?.length || 0}`);
        console.log(`   Code health score: ${metadata.codeHealthScore || 0}/100`);
        console.log(`   Has documentation: ${metadata.hasDocumentation ? 'Yes' : 'No'}`);
        console.log(`   Has tests: ${metadata.hasTests ? 'Yes' : 'No'}`);
        console.log(`   Has CI: ${metadata.hasCI ? 'Yes' : 'No'}\n`);
      }

      // Example 4: Try to fetch marketplace manifest
      console.log('📄 Checking for marketplace manifest...');
      const manifestExists = await contentFetcher.checkManifestExists(owner, repoName);

      if (manifestExists) {
        console.log('✅ Marketplace manifest found, fetching...');
        const manifestResponse = await contentFetcher.fetchAndParseMarketplaceManifest(owner, repoName);

        if (manifestResponse.success && manifestResponse.data) {
          const manifest = manifestResponse.data;
          console.log(`   Format: ${manifest.format}`);
          console.log(`   Size: ${manifest.size} bytes`);
          console.log(`   Valid: ${manifest.isValid}`);

          if (manifest.isValid && manifest.data) {
            const data = manifest.data;
            console.log(`   Marketplace name: ${data.name || 'Unknown'}`);
            console.log(`   Description: ${data.description || 'No description'}`);
            console.log(`   Plugins: ${Array.isArray(data.plugins) ? data.plugins.length : 0}`);
          } else {
            console.log(`   Validation errors: ${manifest.validationErrors?.join(', ') || 'Unknown'}`);
          }
        } else {
          console.log(`❌ Failed to fetch manifest: ${manifestResponse.error?.message}`);
        }
      } else {
        console.log('ℹ️  No marketplace manifest found in this repository');
      }
      console.log('');
    }

    // Example 5: Get popular marketplaces
    console.log('🌟 Fetching popular marketplaces...');
    const popularResponse = await searchService.getPopularMarketplaces(3, 5);

    if (popularResponse.success && popularResponse.data) {
      console.log('Popular marketplaces:');
      popularResponse.data.forEach((repo: any, index: number) => {
        console.log(`   ${index + 1}. ${repo.full_name} (${repo.stargazers_count} ⭐)`);
      });
    } else {
      console.log('❌ Failed to fetch popular marketplaces');
    }
    console.log('');

    // Example 6: Get recently updated marketplaces
    console.log('🕒 Fetching recently updated marketplaces...');
    const recentResponse = await searchService.getRecentlyUpdatedMarketplaces(3, 30);

    if (recentResponse.success && recentResponse.data) {
      console.log('Recently updated marketplaces:');
      recentResponse.data.forEach((repo: any, index: number) => {
        const daysAgo = Math.floor((Date.now() - new Date(repo.pushed_at).getTime()) / (1000 * 60 * 60 * 24));
        console.log(`   ${index + 1}. ${repo.full_name} (updated ${daysAgo} days ago)`);
      });
    } else {
      console.log('❌ Failed to fetch recent marketplaces');
    }
    console.log('');

    // Example 7: Validate a repository
    if (repositories.length > 0) {
      const [owner, repoName] = repositories[0].full_name.split('/');
      console.log(`✅ Validating repository: ${repositories[0].full_name}`);
      const validationResponse = await searchService.validateMarketplaceRepository(owner, repoName);

      if (validationResponse.success) {
        if (validationResponse.data) {
          console.log('   ✅ Valid marketplace repository');
        } else {
          console.log('   ❌ Not a marketplace repository');
        }
      } else {
        console.log(`   ❌ Validation failed: ${validationResponse.error?.message}`);
      }
    }

  } catch (error: any) {
    console.error('❌ Unexpected error:', error.message);
  }

  // Show final statistics
  console.log('\n📊 Final Statistics:');
  const requestStats = githubClient.getRequestStats();
  console.log(`   Total requests: ${requestStats.requestCount}`);

  const searchCacheStats = searchService.getConfig();
  const metadataCacheStats = metadataService.getCacheStats();
  const contentCacheStats = contentFetcher.getCacheStats();

  console.log(`   Search cache: Enabled`);
  console.log(`   Metadata cache: ${metadataCacheStats.size} entries`);
  console.log(`   Content cache: ${contentCacheStats.size} entries`);

  console.log('\n🎉 Example completed successfully!');
}

// Run the example
if (require.main === module) {
  main().catch((error) => {
    console.error('❌ Example failed:', error);
    process.exit(1);
  });
}