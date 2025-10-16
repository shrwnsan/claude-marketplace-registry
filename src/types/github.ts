/**
 * GitHub API TypeScript types
 * Based on GitHub REST API v4 specification
 */

// Base GitHub user/organization type
export interface GitHubUser {
  id: number;
  login: string;
  name: string | null;
  email: string | null;
  bio: string | null;
  company: string | null;
  blog: string | null;
  location: string | null;
  avatar_url: string;
  html_url: string;
  type: 'User' | 'Organization';
  public_repos: number;
  followers: number;
  following: number;
  created_at: string;
  updated_at: string;
}

// Repository information
export interface GitHubRepository {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  private: boolean;
  fork: boolean;
  html_url: string;
  clone_url: string;
  ssh_url: string;
  stargazers_count: number;
  watchers_count: number;
  forks_count: number;
  language: string | null;
  license: GitHubLicense | null;
  default_branch: string;
  created_at: string;
  updated_at: string;
  pushed_at: string;
  size: number;
  open_issues_count: number;
  topics: string[];
  owner: GitHubUser;
}

// License information
export interface GitHubLicense {
  key: string;
  name: string;
  spdx_id: string;
  url: string | null;
  node_id: string;
}

// Commit information
export interface GitHubCommit {
  sha: string;
  url: string;
  commit: {
    message: string;
    author: {
      name: string;
      email: string;
      date: string;
    };
    committer: {
      name: string;
      email: string;
      date: string;
    };
    tree: {
      sha: string;
      url: string;
    };
  };
  author?: {
    login: string;
    id: number;
    avatar_url: string;
    gravatar_id: string;
    url: string;
    html_url: string;
    followers_url: string;
    following_url: string;
    gists_url: string;
    starred_url: string;
    subscriptions_url: string;
    organizations_url: string;
    repos_url: string;
    events_url: string;
    received_events_url: string;
    type: string;
    site_admin: boolean;
  };
  committer?: any;
  tree?: any;
}

// Repository content (file/directory)
export interface GitHubContent {
  name: string;
  path: string;
  sha: string;
  size: number;
  url: string;
  html_url: string;
  git_url: string;
  download_url: string | null;
  type: 'file' | 'dir' | 'submodule' | 'symlink';
  content?: string; // Base64 encoded content for files
  encoding?: string;
}

// Search results
export interface GitHubSearchResponse<T> {
  total_count: number;
  incomplete_results: boolean;
  items: T[];
}

// Repository search item
export interface GitHubSearchRepositoryItem {
  id: number;
  name: string;
  full_name: string;
  private: boolean;
  owner: GitHubUser;
  html_url: string;
  description: string | null;
  fork: boolean;
  created_at: string;
  updated_at: string;
  pushed_at: string;
  homepage: string | null;
  stargazers_count: number;
  watchers_count: number;
  language: string | null;
  forks_count: number;
  default_branch: string;
  open_issues_count: number;
  topics: string[];
  score: number;
  license?: GitHubLicense;
}

// Rate limit information
export interface GitHubRateLimit {
  resources: {
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
    graphql?: unknown;
    integration_manifest?: unknown;
  };
  rate: {
    limit: number;
    remaining: number;
    reset: number;
    used: number;
  };
}

// API error response
export interface GitHubError {
  message: string;
  documentation_url?: string;
  errors?: Array<{
    resource: string;
    field: string;
    code: string;
  }>;
}

// Pagination links
export interface GitHubPaginationLinks {
  first?: string;
  prev?: string;
  next?: string;
  last?: string;
}

// Enhanced repository metadata for our use case
export interface RepositoryMetadata {
  id: number;
  name: string;
  fullName: string;
  description: string | null;
  url: string;
  stars: number;
  forks: number;
  language: string | null;
  license: string | null;
  createdAt: string;
  updatedAt: string;
  pushedAt: string;
  size: number;
  openIssuesCount: number;
  topics: string[];
  defaultBranch: string;
  owner: {
    id: number;
    login: string;
    name: string | null;
    type: 'User' | 'Organization';
    avatarUrl: string;
    url: string;
  };
  lastCommitSha?: string;
  lastCommitDate?: string;
  manifestUrl?: string;
  hasManifest: boolean;
}

// Search query parameters
export interface GitHubSearchParams {
  q: string;
  sort?: 'stars' | 'forks' | 'updated';
  order?: 'asc' | 'desc';
  per_page?: number;
  page?: number;
}

// Content fetcher options
export interface ContentFetchOptions {
  ref?: string; // Git reference (branch, tag, or commit SHA)
  mediaType?: string; // Media type for the content
}

// API response wrapper for error handling
export interface GitHubApiResponse<T> {
  success: boolean;
  data?: T;
  error?: GitHubError;
  rateLimit?: GitHubRateLimit;
}

// Client configuration
export interface GitHubClientConfig {
  token?: string;
  baseUrl?: string;
  userAgent?: string;
  throttle?: {
    enabled: boolean;
    limit: number;
    windowMs: number;
  };
  retry?: {
    enabled: boolean;
    maxRetries: number;
    baseDelay: number;
    maxDelay: number;
  };
}

// Repository search filters
export interface RepositorySearchFilters {
  query?: string;
  language?: string;
  stars?: {
    min?: number;
    max?: number;
  };
  forks?: {
    min?: number;
    max?: number;
  };
  created?: {
    from?: string;
    to?: string;
  };
  updated?: {
    from?: string;
    to?: string;
  };
  topics?: string[];
  excludeForks?: boolean;
  excludeArchived?: boolean;
  sort?: 'stars' | 'forks' | 'updated';
  order?: 'asc' | 'desc';
}