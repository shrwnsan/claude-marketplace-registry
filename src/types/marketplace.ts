/**
 * Marketplace interface representing a Claude Code marketplace
 * Based on the PRD specification for marketplace data structure
 */
export interface Marketplace {
  /** Unique identifier for the marketplace */
  id: string;
  /** Name of the marketplace */
  name: string;
  /** Description of what the marketplace offers */
  description: string;
  /** Owner information */
  owner: {
    name: string;
    url: string;
    type: 'User' | 'Organization';
  };
  /** Repository information */
  repository: {
    url: string;
    stars: number;
    forks: number;
    createdAt: string;
    updatedAt: string;
    language: string;
    license?: string;
    defaultBranch?: string;
    openIssues?: number;
  };
  /** URL to the manifest file */
  manifestUrl: string;
  /** List of plugins in this marketplace */
  plugins: Plugin[];
  /** Tags for categorization */
  tags: string[];
  /** Whether this marketplace has been verified */
  verified: boolean;
  /** Quality score (0-100) */
  qualityScore: number;
  /** Last scan timestamp */
  lastScanned: string;
  /** When this marketplace was added to the aggregator */
  addedAt: string;
}

/**
 * Simplified marketplace interface for list views
 */
export interface MarketplaceListItem {
  id: string;
  name: string;
  description: string;
  owner: {
    name: string;
    url: string;
  };
  repository: {
    url: string;
    stars: number;
    forks: number;
  };
  pluginCount: number;
  tags: string[];
  verified: boolean;
  qualityScore: number;
  lastScanned: string;
}

/**
 * Marketplace creation interface for API responses
 */
export interface MarketplaceCreateInput {
  name: string;
  description: string;
  owner: {
    name: string;
    url: string;
    type: 'User' | 'Organization';
  };
  repository: {
    url: string;
    stars: number;
    forks: number;
    createdAt: string;
    updatedAt: string;
    language: string;
    license?: string;
  };
  manifestUrl: string;
  tags: string[];
}

/**
 * Marketplace update interface for partial updates
 */
export type MarketplaceUpdateInput = Partial<
  Omit<MarketplaceCreateInput, 'id' | 'addedAt' | 'lastScanned'>
> & {
  plugins?: Plugin[];
  verified?: boolean;
  qualityScore?: number;
};

// Re-export Plugin type to avoid circular imports
import type { Plugin } from './plugin';
