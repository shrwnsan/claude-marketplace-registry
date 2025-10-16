/**
 * Types related to data processing, validation, and scanning
 */

/**
 * Quality metrics for marketplaces and plugins
 */
export interface QualityMetrics {
  score: number; // 0-100
  factors: {
    popularity: number; // Based on stars, forks
    activity: number; // Based on recent commits
    completeness: number; // Based on manifest completeness
    age: number; // Based on repository age
    maintenance: number; // Based on update frequency
  };
  lastCalculated: string;
}

/**
 * Validation result for manifests and data
 */
export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  score: number;
  timestamp: string;
}

/**
 * Validation error details
 */
export interface ValidationError {
  field: string;
  message: string;
  code: string;
  severity: 'error';
}

/**
 * Validation warning details
 */
export interface ValidationWarning {
  field: string;
  message: string;
  code: string;
  severity: 'warning';
}

/**
 * Processing result for batch operations
 */
export interface ProcessingResult<T> {
  success: boolean;
  processed: number;
  total: number;
  successful: T[];
  failed: ProcessingError[];
  warnings: ProcessingWarning[];
  duration: number; // Processing time in milliseconds
  timestamp: string;
}

/**
 * Processing error information
 */
export interface ProcessingError {
  item: any;
  error: string;
  code: string;
  retryable: boolean;
}

/**
 * Processing warning information
 */
export interface ProcessingWarning {
  item: any;
  warning: string;
  code: string;
}

/**
 * Scan result for marketplace discovery
 */
export interface ScanResult {
  scanId: string;
  timestamp: string;
  duration: number;
  summary: {
    totalRepositories: number;
    marketplacesFound: number;
    pluginsFound: number;
    errors: number;
    warnings: number;
  };
  marketplaces: MarketplaceScanResult[];
  errors: ScanError[];
  rateLimitInfo?: RateLimitInfo;
}

/**
 * Individual marketplace scan result
 */
export interface MarketplaceScanResult {
  repository: {
    url: string;
    fullName: string;
    stars: number;
    forks: number;
    language: string;
    updatedAt: string;
  };
  manifestUrl: string;
  manifestValid: boolean;
  pluginCount: number;
  qualityScore: number;
  errors: string[];
  warnings: string[];
}

/**
 * Scan error information
 */
export interface ScanError {
  repository: string;
  error: string;
  type: 'api_error' | 'validation_error' | 'network_error' | 'parse_error';
  retryable: boolean;
}

/**
 * Rate limit information from GitHub API
 */
export interface RateLimitInfo {
  core: {
    limit: number;
    remaining: number;
    reset: number;
    used: number;
  };
  search: {
    limit: number;
    remaining: number;
    reset: number;
    used: number;
  };
}

/**
 * Scan configuration options
 */
export interface ScanConfig {
  maxRepositories?: number;
  searchQueries: string[];
  excludeForks?: boolean;
  excludeArchived?: boolean;
  minStars?: number;
  languages?: string[];
  updateExisting?: boolean;
  validatePlugins?: boolean;
  calculateQualityScores?: boolean;
}

/**
 * Data export options
 */
export interface ExportOptions {
  format: 'json' | 'csv' | 'xml';
  includeMetadata?: boolean;
  includeQualityScores?: boolean;
  filter?: SearchFilters;
  sort?: SortOptions;
}

/**
 * Import/Export result
 */
export interface ImportExportResult {
  success: boolean;
  recordsProcessed: number;
  recordsImported: number;
  recordsSkipped: number;
  errors: ImportError[];
  warnings: ImportWarning[];
  timestamp: string;
}

/**
 * Import error information
 */
export interface ImportError {
  record: any;
  error: string;
  line?: number;
}

/**
 * Import warning information
 */
export interface ImportWarning {
  record: any;
  warning: string;
  line?: number;
}

// Re-export types from other files to avoid circular imports
import type { SearchFilters, SortOptions } from './common';