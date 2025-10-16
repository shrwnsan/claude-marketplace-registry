# GitHub API Integration

This document describes the GitHub API integration implementation for the Claude Marketplace Aggregator project.

## Overview

The GitHub API integration consists of several components that work together to:

1. **Authenticate with GitHub API** using personal access tokens
2. **Search for repositories** containing `.claude-plugin/marketplace.json` files
3. **Fetch repository metadata** (stars, forks, language, commits, license, etc.)
4. **Download and parse manifest files** from repositories
5. **Handle rate limiting** with exponential backoff
6. **Provide comprehensive error handling** for API failures

## Architecture

### Core Components

#### 1. GitHub Client (`src/utils/github-client.ts`)

The main client that provides:
- Authentication with GitHub API
- Rate limiting and retry logic
- Error handling and exponential backoff
- Request statistics and caching

```typescript
import { createGitHubClient } from '@/utils/github-client';

const githubClient = createGitHubClient({
  token: process.env.GITHUB_TOKEN,
  retry: {
    enabled: true,
    maxRetries: 3,
    baseDelay: 1000,
    maxDelay: 30000,
  },
});
```

#### 2. GitHub Search Service (`src/services/github-search.ts`)

Handles searching for repositories with marketplace manifests:
- Searches for repositories containing `.claude-plugin/marketplace.json` files
- Supports advanced filtering (stars, forks, dates, topics, etc.)
- Handles pagination for large result sets
- Provides specialized search methods (by organization, user, topics)

```typescript
import { createGitHubSearchService } from '@/services/github-search';

const searchService = createGitHubSearchService(githubClient);

// Search for marketplace repositories
const results = await searchService.searchMarketplaceRepositories({
  stars: { min: 10 },
  updated: { from: '2024-01-01' },
  topics: ['claude', 'marketplace'],
});

// Get popular marketplaces
const popular = await searchService.getPopularMarketplaces(50, 10);
```

#### 3. GitHub Metadata Service (`src/services/github-metadata.ts`)

Fetches comprehensive repository metadata:
- Basic repository information
- Language statistics
- Contributor information
- Commit history and activity metrics
- Repository features (documentation, tests, CI)
- Code health scoring

```typescript
import { createGitHubMetadataService } from '@/services/github-metadata';

const metadataService = createGitHubMetadataService(githubClient);

// Get basic metadata
const basic = await metadataService.getRepositoryMetadata('owner', 'repo');

// Get enhanced metadata with additional details
const enhanced = await metadataService.getEnhancedRepositoryMetadata('owner', 'repo');

// Fetch metadata for multiple repositories
const multiple = await metadataService.getMultipleRepositoryMetadata([
  { owner: 'owner1', repo: 'repo1' },
  { owner: 'owner2', repo: 'repo2' },
]);
```

#### 4. Content Fetcher (`src/utils/content-fetcher.ts`)

Downloads and parses manifest files:
- Fetches file content from repositories
- Handles different file encodings and formats
- Validates file size and type
- Parses JSON, YAML, and other formats
- Provides caching for performance

```typescript
import { createContentFetcher } from '@/utils/content-fetcher';

const contentFetcher = createContentFetcher(githubClient);

// Fetch marketplace manifest
const manifest = await contentFetcher.fetchAndParseMarketplaceManifest('owner', 'repo');

// Check if manifest exists
const exists = await contentFetcher.checkManifestExists('owner', 'repo');

// Fetch multiple manifests in parallel
const multiple = await contentFetcher.fetchMultipleManifests(repositories);
```

## Configuration

### Environment Variables

Create a `.env.local` file based on `.env.example`:

```bash
# GitHub Personal Access Token (required)
GITHUB_TOKEN=ghp_your_personal_access_token_here

# Optional configuration
GITHUB_RATE_LIMIT=5000
CACHE_TTL=3600
ENABLE_CACHE=true
```

### GitHub Token Setup

1. Go to [GitHub Settings > Developer settings > Personal access tokens](https://github.com/settings/tokens)
2. Click "Generate new token (classic)"
3. Give it a descriptive name (e.g., "Claude Marketplace Aggregator")
4. Select the following scopes:
   - `public_repo` (Access public repositories)
   - `read:org` (Read org and team membership - if scanning private orgs)
5. Generate the token and copy it
6. Add it to your `.env.local` file

### Client Configuration

Each component can be configured with custom options:

```typescript
// GitHub Client configuration
const githubClient = createGitHubClient({
  token: process.env.GITHUB_TOKEN,
  userAgent: 'claude-marketplace-aggregator/0.1.0',
  throttle: {
    enabled: true,
    limit: 5000,
    windowMs: 60 * 60 * 1000, // 1 hour
  },
  retry: {
    enabled: true,
    maxRetries: 3,
    baseDelay: 1000,
    maxDelay: 30000,
  },
});

// Search service configuration
const searchService = createGitHubSearchService(githubClient, {
  maxResultsPerPage: 100,
  maxTotalResults: 1000,
  excludeForks: true,
  excludeArchived: true,
  minStars: 0,
});

// Metadata service configuration
const metadataService = createGitHubMetadataService(githubClient, {
  fetchLanguages: true,
  fetchContributors: true,
  fetchCommits: true,
  maxContributors: 10,
  maxCommits: 30,
  cacheEnabled: true,
  cacheTTL: 3600,
});

// Content fetcher configuration
const contentFetcher = createContentFetcher(githubClient, {
  maxFileSize: 1024 * 1024, // 1MB
  allowedEncodings: ['utf-8', 'base64', 'ascii'],
  cacheEnabled: true,
  cacheTTL: 1800, // 30 minutes
  timeout: 10000,
  retryAttempts: 3,
});
```

## Usage Examples

### Basic Usage

```typescript
import {
  createGitHubClient,
  createGitHubSearchService,
  createGitHubMetadataService,
  createContentFetcher,
} from '@/src';

// Initialize services
const githubClient = createGitHubClient();
const searchService = createGitHubSearchService(githubClient);
const metadataService = createGitHubMetadataService(githubClient);
const contentFetcher = createContentFetcher(githubClient);

// Search for marketplaces
const searchResults = await searchService.searchMarketplaceRepositories({
  stars: { min: 5 },
  updated: { from: '2024-01-01' },
});

if (searchResults.success && searchResults.data) {
  for (const repo of searchResults.data.repositories) {
    const [owner, repoName] = repo.full_name.split('/');

    // Get metadata
    const metadata = await metadataService.getEnhancedRepositoryMetadata(owner, repoName);

    if (metadata.success && metadata.data) {
      console.log(`${repo.full_name}: ${metadata.data.stars} stars, ${metadata.data.codeHealthScore}/100 health score`);

      // Check for manifest
      const hasManifest = await contentFetcher.checkManifestExists(owner, repoName);
      if (hasManifest) {
        const manifest = await contentFetcher.fetchAndParseMarketplaceManifest(owner, repoName);
        if (manifest.success && manifest.data?.isValid) {
          console.log(`  ✅ Valid manifest found: ${manifest.data.data?.name}`);
        }
      }
    }
  }
}
```

### Advanced Search

```typescript
// Search with complex filters
const results = await searchService.searchMarketplaceRepositories({
  query: 'claude code plugins',
  language: 'TypeScript',
  stars: { min: 10, max: 10000 },
  forks: { min: 5 },
  updated: { from: '2024-01-01', to: '2024-12-31' },
  topics: ['claude', 'plugins', 'marketplace'],
  excludeForks: true,
  excludeArchived: true,
});

// Search by organization
const orgResults = await searchService.searchOrganizationMarketplaces('claude-marketplace');

// Search by user
const userResults = await searchService.searchUserMarketplaces('username');

// Search by topics
const topicResults = await searchService.searchTopicMarketplaces(['claude', 'marketplace']);
```

### Batch Processing

```typescript
// Process multiple repositories efficiently
const repositories = [
  { owner: 'owner1', repo: 'repo1' },
  { owner: 'owner2', repo: 'repo2' },
  // ... more repositories
];

// Get metadata for all repositories in parallel
const metadataResults = await metadataService.getMultipleRepositoryMetadata(repositories, true);

// Fetch manifests from all repositories
const manifestResults = await contentFetcher.fetchMultipleManifests(repositories);

// Process results
metadataResults.data?.forEach(metadata => {
  console.log(`Processed: ${metadata.fullName}`);
});
```

## Error Handling

The API integration provides comprehensive error handling:

```typescript
const response = await searchService.searchMarketplaceRepositories({});

if (!response.success) {
  console.error('Search failed:', response.error?.message);

  // Check rate limit
  if (response.rateLimit?.resources.search.remaining === 0) {
    const resetTime = response.rateLimit.resources.search.reset * 1000;
    const waitTime = Math.max(0, resetTime - Date.now());
    console.log(`Rate limit exceeded. Wait ${Math.ceil(waitTime / 1000)} seconds`);
  }

  return;
}

// Process successful response
const { repositories, totalCount } = response.data!;
```

## Rate Limiting

The integration handles GitHub API rate limits automatically:

- **Automatic detection** of rate limit status from response headers
- **Exponential backoff** when limits are exceeded
- **Request scheduling** to stay within limits
- **Rate limit monitoring** with detailed statistics

```typescript
// Check current rate limits
const rateLimit = await githubClient.getRateLimit();
console.log(`Core: ${rateLimit.data?.resources.core.remaining}/${rateLimit.data?.resources.core.limit}`);
console.log(`Search: ${rateLimit.data?.resources.search.remaining}/${rateLimit.data?.resources.search.limit}`);

// Monitor request statistics
const stats = githubClient.getRequestStats();
console.log(`Total requests: ${stats.requestCount}`);
```

## Testing

Run the test suite:

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

Run the example script:

```bash
# Set your GitHub token
export GITHUB_TOKEN=ghp_your_token_here

# Run the example
npm run github:example
```

## Type Safety

The integration provides comprehensive TypeScript types:

```typescript
import type {
  GitHubRepository,
  RepositoryMetadata,
  GitHubApiResponse,
  SearchResult,
  ParsedManifest,
  // ... many more types
} from '@/src/types';
```

All API responses are properly typed, ensuring type safety throughout the application.

## Performance Considerations

### Caching

- **Metadata caching**: Repository metadata is cached for 1 hour by default
- **Content caching**: Manifest files are cached for 30 minutes by default
- **Rate limit awareness**: Caching helps reduce API usage

### Parallel Processing

- **Batch operations**: Multiple repositories can be processed in parallel
- **Concurrent requests**: Services are designed to handle concurrent API calls
- **Request queuing**: Built-in request queuing prevents overwhelming the API

### Rate Limit Management

- **Automatic backoff**: Exponential backoff when rate limits are hit
- **Request throttling**: Built-in throttling to prevent hitting limits
- **Priority handling**: Important requests get priority when limits are low

## Troubleshooting

### Common Issues

1. **Authentication Failed**
   - Ensure `GITHUB_TOKEN` is set correctly
   - Check that the token has the required scopes
   - Verify the token hasn't expired

2. **Rate Limit Exceeded**
   - The integration will automatically wait and retry
   - Consider upgrading to a higher rate limit if needed
   - Use caching to reduce API calls

3. **Repository Not Found**
   - Check that the repository exists and is public
   - Verify the owner and repository name are correct
   - Ensure the repository contains the expected files

4. **Large File Downloads**
   - Adjust `maxFileSize` configuration if needed
   - Consider using Git API for very large files
   - Implement streaming for large content

### Debug Mode

Enable debug logging:

```typescript
const githubClient = createGitHubClient({
  // ... other config
});

// Enable console logging for debugging
console.log('GitHub client initialized');
console.log('Authenticated:', githubClient.isAuthenticated());
```

## Future Enhancements

- **GraphQL Support**: For more efficient data fetching
- **Webhook Integration**: Real-time updates from GitHub
- **Advanced Caching**: Redis-based caching for better performance
- **Parallel Processing**: Worker threads for large-scale processing
- **Metrics Collection**: Detailed performance and usage metrics