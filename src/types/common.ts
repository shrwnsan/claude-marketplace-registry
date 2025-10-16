/**
 * Common types used across the application
 */

/**
 * Search filters for marketplaces and plugins
 */
export interface SearchFilters {
  query?: string;
  category?: string;
  tags?: string[];
  author?: string;
  license?: string;
  language?: string;
  minStars?: number;
  minQualityScore?: number;
  verified?: boolean;
  dateRange?: {
    from?: string;
    to?: string;
  };
}

/**
 * Sort options for search results
 */
export interface SortOptions {
  field: 'name' | 'stars' | 'forks' | 'updated' | 'qualityScore' | 'addedAt';
  order: 'asc' | 'desc';
}

/**
 * Pagination options
 */
export interface PaginationOptions {
  page: number;
  limit: number;
  offset?: number;
}

/**
 * Generic search result with pagination
 */
export interface SearchResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  hasNext: boolean;
  hasPrev: boolean;
  totalPages: number;
}

/**
 * API response wrapper
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

/**
 * Loading states
 */
export interface LoadingState {
  isLoading: boolean;
  error?: string;
  lastUpdated?: string;
}

/**
 * Selection state for UI components
 */
export interface SelectionState<T> {
  selected: T[];
  selectedIds: string[];
  isAllSelected: boolean;
  isPartiallySelected: boolean;
}

/**
 * Filter state for UI components
 */
export interface FilterState {
  activeFilters: SearchFilters;
  availableCategories: string[];
  availableTags: string[];
  availableAuthors: string[];
  availableLicenses: string[];
}

/**
 * Theme types
 */
export type Theme = 'light' | 'dark' | 'system';

/**
 * Breakpoint types for responsive design
 */
export type Breakpoint = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

/**
 * Device information
 */
export interface DeviceInfo {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  breakpoint: Breakpoint;
  width: number;
  height: number;
}