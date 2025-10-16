/**
 * Plugin interface representing a Claude Code plugin
 * Based on the PRD specification for plugin data structure
 */
export interface Plugin {
  /** Unique identifier for the plugin */
  id: string;
  /** Name of the plugin */
  name: string;
  /** Description of what the plugin does */
  description: string;
  /** Plugin version */
  version?: string;
  /** Plugin author */
  author?: string;
  /** Plugin homepage URL */
  homepage?: string;
  /** Plugin repository URL */
  repository?: string;
  /** Plugin license */
  license?: string;
  /** Keywords for search */
  keywords?: string[];
  /** Plugin category */
  category?: string;
  /** Tags for categorization */
  tags?: string[];
  /** Available commands */
  commands?: string[];
  /** Compatible agents */
  agents?: string[];
  /** Plugin hooks configuration */
  hooks?: Record<string, unknown>;
  /** MCP servers configuration */
  mcpServers?: Record<string, unknown>;
  /** Source information */
  source: {
    type: 'github' | 'url';
    url: string;
    path?: string;
  };
  /** ID of the marketplace this plugin belongs to */
  marketplaceId: string;
  /** Whether this plugin has been validated */
  validated: boolean;
  /** Quality score (0-100) */
  qualityScore: number;
  /** Last scan timestamp */
  lastScanned: string;
}

/**
 * Simplified plugin interface for list views
 */
export interface PluginListItem {
  id: string;
  name: string;
  description: string;
  version?: string;
  author?: string;
  category?: string;
  tags?: string[];
  commands?: string[];
  agents?: string[];
  source: {
    type: 'github' | 'url';
    url: string;
  };
  marketplaceId: string;
  marketplaceName: string;
  validated: boolean;
  qualityScore: number;
  lastScanned: string;
}

/**
 * Plugin creation interface for API responses
 */
export interface PluginCreateInput {
  name: string;
  description: string;
  version?: string;
  author?: string;
  homepage?: string;
  repository?: string;
  license?: string;
  keywords?: string[];
  category?: string;
  tags?: string[];
  commands?: string[];
  agents?: string[];
  hooks?: Record<string, unknown>;
  mcpServers?: Record<string, unknown>;
  source: {
    type: 'github' | 'url';
    url: string;
    path?: string;
  };
  marketplaceId: string;
}

/**
 * Plugin update interface for partial updates
 */
export type PluginUpdateInput = Partial<
  Omit<PluginCreateInput, 'id' | 'lastScanned'> & {
    validated?: boolean;
    qualityScore?: number;
  }
>;

/**
 * Plugin manifest structure from marketplace.json files
 */
export interface PluginManifest {
  name: string;
  description: string;
  version?: string;
  author?: string;
  homepage?: string;
  repository?: string;
  license?: string;
  keywords?: string[];
  category?: string;
  tags?: string[];
  commands?: string[];
  agents?: string[];
  hooks?: Record<string, unknown>;
  mcpServers?: Record<string, unknown>;
  source: {
    type: 'github' | 'url';
    url: string;
    path?: string;
  };
}

/**
 * Plugin validation result
 */
export interface PluginValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  score: number;
}

/**
 * Plugin search filters
 */
export interface PluginSearchFilters {
  category?: string;
  tags?: string[];
  agents?: string[];
  commands?: string[];
  marketplaceId?: string;
  validated?: boolean;
  minQualityScore?: number;
  author?: string;
  license?: string;
}