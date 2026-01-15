/**
 * Service exports for the Claude Marketplace Aggregator
 */

// GitHub services
export * from './github-search';
export * from './github-metadata';

// Service factory functions
export { createGitHubSearchService, getDefaultGitHubSearchService } from './github-search';
export { createGitHubMetadataService, getDefaultGitHubMetadataService } from './github-metadata';
