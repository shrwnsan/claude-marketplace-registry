/**
 * Ecosystem Statistics Test Data and Examples
 *
 * Mock data and examples for development, testing, and demonstration purposes.
 * All data is designed to pass validation schemas and provide realistic test scenarios.
 *
 * @fileoverview Test data and examples for ecosystem statistics
 * @author Claude Marketplace Team
 * @version 1.0.0
 * @since 2025-10-21
 */

import type {
  EcosystemOverview,
  GrowthTrends,
  CategoryAnalytics,
  CommunityData,
  QualityIndicators,
  MarketplaceData,
  PluginData,
  TrendDataPoint,
  CategoryData,
  EcosystemStatsResponse,
  PaginatedResponse,
  ChartData,
} from './ecosystem-stats';

// ============================================================================
// MOCK TREND DATA
// ============================================================================

/**
 * Generate mock trend data points for a given period
 */
const generateTrendData = (
  baseValue: number,
  days: number,
  growthRate: number = 0.02
): TrendDataPoint[] => {
  const data: TrendDataPoint[] = [];
  const now = new Date();

  for (let i = days; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);

    const randomVariation = (Math.random() - 0.5) * 0.1; // ±5% random variation
    const growthFactor = Math.pow(1 + growthRate, days - i);
    const value = Math.round(baseValue * growthFactor * (1 + randomVariation));

    data.push({
      date: date.toISOString(),
      value: Math.max(0, value),
      change:
        i > 0
          ? data[data.length - 1]?.value
            ? value - data[data.length - 1].value
            : 0
          : undefined,
    });
  }

  return data;
};

/**
 * Mock growth trends data for the last 30 days
 */
export const mockGrowthTrends: GrowthTrends = {
  plugins: generateTrendData(1080, 30, 0.015),
  marketplaces: generateTrendData(14, 30, 0.008),
  developers: generateTrendData(320, 30, 0.012),
  downloads: generateTrendData(42000, 30, 0.025),
  period: '30d',
  aggregation: 'daily',
  predictions: {
    plugins: generateTrendData(1250, 30, 0.018).map((point) => ({
      ...point,
      date: new Date(new Date(point.date).getTime() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    })),
    marketplaces: generateTrendData(15, 30, 0.01).map((point) => ({
      ...point,
      date: new Date(new Date(point.date).getTime() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    })),
  },
};

// ============================================================================
// MOCK CATEGORY DATA
// ============================================================================

/**
 * Mock category data
 */
export const mockCategories: CategoryData[] = [
  {
    id: 'development',
    name: 'Development Tools',
    count: 450,
    percentage: 36.0,
    growthRate: 18.2,
    topPlugins: [
      { id: 'git-integration', name: 'Git Integration', downloads: 8500, rating: 4.7 },
      { id: 'code-formatter', name: 'Code Formatter', downloads: 6200, rating: 4.5 },
      { id: 'debugger', name: 'Enhanced Debugger', downloads: 5100, rating: 4.8 },
    ],
    trending: true,
    description: 'Tools for software development, debugging, and code quality',
  },
  {
    id: 'ai-ml',
    name: 'AI & Machine Learning',
    count: 280,
    percentage: 22.4,
    growthRate: 45.3,
    topPlugins: [
      { id: 'ml-assistant', name: 'ML Assistant', downloads: 7200, rating: 4.6 },
      { id: 'model-training', name: 'Model Training Helper', downloads: 4800, rating: 4.4 },
      { id: 'data-analyzer', name: 'Data Analyzer', downloads: 3900, rating: 4.5 },
    ],
    trending: true,
    description: 'Artificial intelligence and machine learning tools',
  },
  {
    id: 'productivity',
    name: 'Productivity',
    count: 195,
    percentage: 15.6,
    growthRate: 12.7,
    topPlugins: [
      { id: 'task-automator', name: 'Task Automator', downloads: 3400, rating: 4.3 },
      { id: 'time-tracker', name: 'Time Tracker', downloads: 2800, rating: 4.2 },
      { id: 'focus-mode', name: 'Focus Mode', downloads: 2100, rating: 4.6 },
    ],
    trending: false,
    description: 'Productivity enhancement and workflow automation tools',
  },
  {
    id: 'documentation',
    name: 'Documentation',
    count: 142,
    percentage: 11.4,
    growthRate: 8.9,
    topPlugins: [
      { id: 'doc-generator', name: 'Doc Generator', downloads: 2900, rating: 4.4 },
      { id: 'markdown-helper', name: 'Markdown Helper', downloads: 2200, rating: 4.5 },
    ],
    trending: false,
    description: 'Documentation generation and writing assistance tools',
  },
  {
    id: 'testing',
    name: 'Testing & QA',
    count: 98,
    percentage: 7.8,
    growthRate: 15.4,
    topPlugins: [
      { id: 'test-runner', name: 'Advanced Test Runner', downloads: 3100, rating: 4.7 },
      { id: 'coverage-analyzer', name: 'Coverage Analyzer', downloads: 1900, rating: 4.3 },
    ],
    trending: false,
    description: 'Testing frameworks and quality assurance tools',
  },
  {
    id: 'security',
    name: 'Security',
    count: 85,
    percentage: 6.8,
    growthRate: 22.1,
    topPlugins: [
      { id: 'security-scanner', name: 'Security Scanner', downloads: 2600, rating: 4.8 },
      { id: 'vulnerability-checker', name: 'Vulnerability Checker', downloads: 1800, rating: 4.6 },
    ],
    trending: true,
    description: 'Security analysis and vulnerability assessment tools',
  },
];

/**
 * Mock category analytics
 */
export const mockCategoryAnalytics: CategoryAnalytics = {
  categories: mockCategories,
  trending: ['ai-ml', 'security', 'development'],
  emerging: ['productivity', 'testing'],
  underserved: ['infrastructure', 'monitoring'],
  insights: [
    'AI tools saw 45% growth this month, the highest of all categories',
    'Security plugins are gaining traction as development teams prioritize security',
    'Development tools remain the largest category with steady growth',
    'New productivity tools are emerging to support remote work workflows',
  ],
  performance: {
    bestPerforming: 'ai-ml',
    fastestGrowing: 'ai-ml',
    mostPopular: 'development',
  },
};

// ============================================================================
// MOCK ECOSYSTEM OVERVIEW
// ============================================================================

/**
 * Mock ecosystem overview data
 */
export const mockEcosystemOverview: EcosystemOverview = {
  totalPlugins: 1250,
  totalMarketplaces: 15,
  totalDevelopers: 340,
  totalDownloads: 48200,
  lastUpdated: '2025-10-21T10:30:00Z',
  growthRate: {
    plugins: 15.2,
    marketplaces: 7.1,
    developers: 12.8,
    downloads: 23.4,
  },
  healthScore: 87.5,
  activeUsers: 12500,
};

// ============================================================================
// MOCK COMMUNITY DATA
// ============================================================================

/**
 * Mock community data
 */
export const mockCommunityData: CommunityData = {
  activeDevelopers: 340,
  developerParticipation: {
    newDevelopers: 42,
    multiPluginDevelopers: 128,
    retentionRate: 78.5,
    avgContributions: 2.8,
  },
  geographicDistribution: [
    { country: 'US', count: 142, percentage: 41.8 },
    { country: 'GB', count: 58, percentage: 17.1 },
    { country: 'DE', count: 45, percentage: 13.2 },
    { country: 'CA', count: 32, percentage: 9.4 },
    { country: 'FR', count: 28, percentage: 8.2 },
    { country: 'IN', count: 21, percentage: 6.2 },
    { country: 'AU', count: 14, percentage: 4.1 },
  ],
  engagement: {
    avgRating: 4.5,
    totalReviews: 3240,
    activeDiscussions: 487,
    contributions: 1250,
  },
  topContributors: [
    {
      username: 'alice-developer',
      contributions: 47,
      plugins: ['git-integration', 'code-formatter', 'debugger'],
      avatar: 'https://github.com/alice-developer.png',
    },
    {
      username: 'bob-ai-engineer',
      contributions: 38,
      plugins: ['ml-assistant', 'model-training'],
      avatar: 'https://github.com/bob-ai-engineer.png',
    },
    {
      username: 'charlie-security',
      contributions: 35,
      plugins: ['security-scanner', 'vulnerability-checker'],
      avatar: 'https://github.com/charlie-security.png',
    },
  ],
};

// ============================================================================
// MOCK QUALITY INDICATORS
// ============================================================================

/**
 * Mock quality indicators data
 */
export const mockQualityIndicators: QualityIndicators = {
  verification: {
    verifiedPlugins: 525,
    verificationRate: 42.0,
    badges: [
      { type: 'security', count: 85 },
      { type: 'quality', count: 320 },
      { type: 'popularity', count: 450 },
      { type: 'maintenance', count: 380 },
    ],
  },
  maintenance: {
    recentlyUpdated: 892,
    activeMaintenanceRate: 71.4,
    avgUpdateFrequency: 14.5,
    abandonedPlugins: 45,
  },
  qualityMetrics: {
    avgQualityScore: 76.8,
    highQualityPlugins: 475,
    commonIssues: [
      { issue: 'Missing documentation', frequency: 142, severity: 'medium' },
      { issue: 'No unit tests', frequency: 98, severity: 'high' },
      { issue: 'Outdated dependencies', frequency: 67, severity: 'high' },
      { issue: 'No changelog', frequency: 45, severity: 'low' },
      { issue: 'License missing', frequency: 23, severity: 'medium' },
    ],
  },
  security: {
    scannedPlugins: 625,
    criticalIssues: 12,
    securityScore: 82.3,
  },
};

// ============================================================================
// MOCK MARKETPLACE DATA
// ============================================================================

/**
 * Mock marketplace data
 */
export const mockMarketplaceData: MarketplaceData[] = [
  {
    marketplace: {
      id: 'claude-official',
      name: 'Claude Official Marketplace',
      description: 'Official marketplace for Claude Code plugins',
      url: 'https://claude.ai/marketplace',
      verified: true,
      qualityScore: 92.5,
    },
    pluginStats: {
      totalPlugins: 425,
      verifiedPlugins: 380,
      avgDownloadsPerPlugin: 2500,
      avgQualityScore: 85.2,
    },
    growth: {
      newPluginsThisMonth: 28,
      growthRate: 12.5,
      trendDirection: 'up',
    },
    community: {
      activeDevelopers: 180,
      totalContributors: 320,
      avgRating: 4.6,
    },
    lastUpdated: '2025-10-21T09:15:00Z',
  },
  {
    marketplace: {
      id: 'community-plugins',
      name: 'Community Plugins Hub',
      description: 'Community-driven plugin repository',
      url: 'https://github.com/claude-community/plugins',
      verified: true,
      qualityScore: 78.3,
    },
    pluginStats: {
      totalPlugins: 380,
      verifiedPlugins: 95,
      avgDownloadsPerPlugin: 850,
      avgQualityScore: 72.1,
    },
    growth: {
      newPluginsThisMonth: 15,
      growthRate: 8.3,
      trendDirection: 'up',
    },
    community: {
      activeDevelopers: 95,
      totalContributors: 180,
      avgRating: 4.2,
    },
    lastUpdated: '2025-10-21T08:45:00Z',
  },
  {
    marketplace: {
      id: 'developer-tools',
      name: 'Developer Tools Collection',
      description: 'Curated collection of development tools',
      url: 'https://github.com/dev-tools/claude-plugins',
      verified: false,
      qualityScore: 68.7,
    },
    pluginStats: {
      totalPlugins: 195,
      verifiedPlugins: 28,
      avgDownloadsPerPlugin: 420,
      avgQualityScore: 65.8,
    },
    growth: {
      newPluginsThisMonth: 8,
      growthRate: 4.2,
      trendDirection: 'stable',
    },
    community: {
      activeDevelopers: 42,
      totalContributors: 68,
      avgRating: 4.0,
    },
    lastUpdated: '2025-10-21T07:30:00Z',
  },
];

// ============================================================================
// MOCK PLUGIN DATA
// ============================================================================

/**
 * Mock plugin data
 */
export const mockPluginData: PluginData[] = [
  {
    plugin: {
      id: 'git-integration',
      name: 'Advanced Git Integration',
      description: 'Enhanced Git workflow integration with Claude Code',
      version: '2.4.1',
      author: 'alice-developer',
      category: 'development',
      marketplaceId: 'claude-official',
      marketplaceName: 'Claude Official Marketplace',
    },
    popularity: {
      downloads: 8500,
      stars: 1250,
      forks: 180,
      rating: 4.7,
      reviewCount: 245,
    },
    quality: {
      qualityScore: 89.2,
      verified: true,
      lastUpdated: '2025-10-18T14:30:00Z',
      updateFrequency: 7,
      hasSecurityScan: true,
      securityScore: 94.1,
    },
    engagement: {
      activeIssues: 3,
      activePRs: 1,
      communityContributions: 18,
      discussionActivity: 142,
    },
    usage: {
      activeUsers: 2100,
      avgSessionDuration: 25,
      retentionRate: 85.2,
    },
  },
  {
    plugin: {
      id: 'ml-assistant',
      name: 'ML Development Assistant',
      description: 'AI-powered assistant for machine learning workflows',
      version: '1.8.3',
      author: 'bob-ai-engineer',
      category: 'ai-ml',
      marketplaceId: 'claude-official',
      marketplaceName: 'Claude Official Marketplace',
    },
    popularity: {
      downloads: 7200,
      stars: 980,
      forks: 120,
      rating: 4.6,
      reviewCount: 186,
    },
    quality: {
      qualityScore: 91.5,
      verified: true,
      lastUpdated: '2025-10-20T10:15:00Z',
      updateFrequency: 5,
      hasSecurityScan: true,
      securityScore: 96.3,
    },
    engagement: {
      activeIssues: 5,
      activePRs: 3,
      communityContributions: 24,
      discussionActivity: 198,
    },
    usage: {
      activeUsers: 1850,
      avgSessionDuration: 35,
      retentionRate: 89.1,
    },
  },
  {
    plugin: {
      id: 'task-automator',
      name: 'Smart Task Automator',
      description: 'Automate repetitive development tasks',
      version: '3.1.0',
      author: 'charlie-productivity',
      category: 'productivity',
      marketplaceId: 'community-plugins',
      marketplaceName: 'Community Plugins Hub',
    },
    popularity: {
      downloads: 3400,
      stars: 420,
      forks: 58,
      rating: 4.3,
      reviewCount: 89,
    },
    quality: {
      qualityScore: 74.8,
      verified: false,
      lastUpdated: '2025-10-15T16:45:00Z',
      updateFrequency: 14,
      hasSecurityScan: false,
    },
    engagement: {
      activeIssues: 8,
      activePRs: 2,
      communityContributions: 12,
      discussionActivity: 67,
    },
    usage: {
      activeUsers: 680,
      avgSessionDuration: 18,
      retentionRate: 72.3,
    },
  },
];

// ============================================================================
// MOCK API RESPONSES
// ============================================================================

/**
 * Mock successful ecosystem stats response
 */
export const mockEcosystemStatsResponse: EcosystemStatsResponse = {
  success: true,
  data: {
    overview: mockEcosystemOverview,
    growthTrends: mockGrowthTrends,
    categoryAnalytics: mockCategoryAnalytics,
    communityData: mockCommunityData,
    qualityIndicators: mockQualityIndicators,
    lastUpdated: {
      overview: '2025-10-21T10:30:00Z',
      growthTrends: '2025-10-21T10:25:00Z',
      categoryAnalytics: '2025-10-21T10:20:00Z',
      communityData: '2025-10-21T10:15:00Z',
      qualityIndicators: '2025-10-21T10:10:00Z',
      marketplaceData: '2025-10-21T09:15:00Z',
      pluginData: '2025-10-21T08:45:00Z',
    },
  },
  meta: {
    timestamp: '2025-10-21T10:30:00Z',
    requestId: 'req_abc123def456',
    responseTime: 245,
    cache: {
      hit: false,
      ttl: 3600,
      expiresAt: '2025-10-21T11:30:00Z',
      key: 'ecosystem_stats_full',
    },
  },
};

/**
 * Mock error response
 */
export const mockErrorResponse: EcosystemStatsResponse = {
  success: false,
  error: {
    code: 'DATA_UNAVAILABLE',
    message: 'Ecosystem statistics are temporarily unavailable',
    details:
      'The data aggregation service is currently undergoing maintenance. Please try again later.',
    suggestions: [
      'Try refreshing the page in a few minutes',
      'Check the status page for service updates',
      'Contact support if the issue persists',
    ],
  },
  meta: {
    timestamp: '2025-10-21T10:30:00Z',
    requestId: 'req_xyz789uvw456',
    responseTime: 125,
  },
};

/**
 * Mock paginated plugin response
 */
export const mockPaginatedPluginResponse: PaginatedResponse<PluginData> = {
  success: true,
  data: mockPluginData,
  meta: {
    timestamp: '2025-10-21T10:30:00Z',
    requestId: 'req_plugins123',
    responseTime: 180,
  },
  pagination: {
    page: 1,
    limit: 10,
    total: 1250,
    totalPages: 125,
    hasNext: true,
    hasPrev: false,
    offset: 0,
  },
};

// ============================================================================
// MOCK CHART DATA
// ============================================================================

/**
 * Mock line chart data for plugin growth
 */
export const mockPluginGrowthChart: ChartData = {
  type: 'line',
  title: 'Plugin Growth Over Time',
  xAxis: {
    label: 'Date',
    type: 'datetime',
    format: 'MMM dd',
  },
  yAxis: {
    label: 'Number of Plugins',
    type: 'linear',
    format: ',.0f',
  },
  series: [
    {
      name: 'Total Plugins',
      data: mockGrowthTrends.plugins.map((point) => [point.date, point.value] as [string, number]),
      color: '#3b82f6',
      type: 'line',
    },
    {
      name: 'Verified Plugins',
      data: mockGrowthTrends.plugins.map(
        (point) => [point.date, Math.round(point.value * 0.42)] as [string, number]
      ),
      color: '#10b981',
      type: 'line',
    },
  ],
  options: {
    responsive: true,
    interactive: true,
    animation: true,
    legend: true,
    grid: true,
    tooltips: true,
  },
};

/**
 * Mock pie chart data for category distribution
 */
export const mockCategoryPieChart: ChartData = {
  type: 'pie',
  title: 'Plugin Distribution by Category',
  series: [
    {
      name: 'Categories',
      data: mockCategories.map((cat) => [cat.name, cat.count] as [string, number]),
      color: '#3b82f6',
    },
  ],
  options: {
    responsive: true,
    interactive: true,
    animation: true,
    legend: true,
    tooltips: true,
  },
};

/**
 * Mock bar chart data for marketplace comparison
 */
export const mockMarketplaceBarChart: ChartData = {
  type: 'bar',
  title: 'Plugins per Marketplace',
  xAxis: {
    label: 'Marketplace',
    type: 'category',
  },
  yAxis: {
    label: 'Number of Plugins',
    type: 'linear',
    format: ',.0f',
  },
  series: [
    {
      name: 'Total Plugins',
      data: mockMarketplaceData.map(
        (mp) => [mp.marketplace.name, mp.pluginStats.totalPlugins] as [string, number]
      ),
      color: '#3b82f6',
    },
    {
      name: 'Verified Plugins',
      data: mockMarketplaceData.map(
        (mp) => [mp.marketplace.name, mp.pluginStats.verifiedPlugins] as [string, number]
      ),
      color: '#10b981',
    },
  ],
  options: {
    responsive: true,
    interactive: true,
    animation: true,
    legend: true,
    grid: true,
    tooltips: true,
  },
};

// ============================================================================
// TEST SCENARIOS
// ============================================================================

/**
 * Edge case: Empty ecosystem data
 */
export const mockEmptyEcosystem: EcosystemOverview = {
  totalPlugins: 0,
  totalMarketplaces: 0,
  totalDevelopers: 0,
  totalDownloads: 0,
  lastUpdated: new Date().toISOString(),
  growthRate: {
    plugins: 0,
    marketplaces: 0,
    developers: 0,
    downloads: 0,
  },
  healthScore: 0,
  activeUsers: 0,
};

/**
 * Edge case: Single plugin ecosystem
 */
export const mockMinimalEcosystem: EcosystemOverview = {
  totalPlugins: 1,
  totalMarketplaces: 1,
  totalDevelopers: 1,
  totalDownloads: 5,
  lastUpdated: new Date().toISOString(),
  growthRate: {
    plugins: 0,
    marketplaces: 0,
    developers: 0,
    downloads: 150,
  },
  healthScore: 45.2,
  activeUsers: 1,
};

/**
 * Large ecosystem data for performance testing
 */
export const mockLargeEcosystem: EcosystemOverview = {
  totalPlugins: 50000,
  totalMarketplaces: 500,
  totalDevelopers: 12000,
  totalDownloads: 5000000,
  lastUpdated: new Date().toISOString(),
  growthRate: {
    plugins: 25.3,
    marketplaces: 15.7,
    developers: 32.1,
    downloads: 45.8,
  },
  healthScore: 94.2,
  activeUsers: 250000,
};

// ============================================================================
// EXAMPLE USAGE FUNCTIONS
// ============================================================================

/**
 * Example: Create a complete ecosystem statistics object
 */
export const createCompleteEcosystemStats = () => ({
  overview: mockEcosystemOverview,
  growthTrends: mockGrowthTrends,
  categoryAnalytics: mockCategoryAnalytics,
  communityData: mockCommunityData,
  qualityIndicators: mockQualityIndicators,
  lastUpdated: mockEcosystemStatsResponse.data!.lastUpdated,
});

/**
 * Example: Create filtered plugin data for testing
 */
export const createFilteredPluginData = (filters: {
  verified?: boolean;
  category?: string;
  minQualityScore?: number;
  minDownloads?: number;
}) => {
  return mockPluginData.filter((plugin) => {
    if (filters.verified !== undefined && plugin.quality.verified !== filters.verified) {
      return false;
    }
    if (filters.category && plugin.plugin.category !== filters.category) {
      return false;
    }
    if (filters.minQualityScore && plugin.quality.qualityScore < filters.minQualityScore) {
      return false;
    }
    if (filters.minDownloads && plugin.popularity.downloads < filters.minDownloads) {
      return false;
    }
    return true;
  });
};

/**
 * Example: Generate sample chart data for any metrics
 */
export const generateSampleChartData = (
  title: string,
  data: Array<{ name: string; value: number }>,
  type: ChartData['type'] = 'bar'
): ChartData => ({
  type,
  title,
  series: [
    {
      name: title,
      data: data.map((item) => [item.name, item.value] as [string, number]),
    },
  ],
  options: {
    responsive: true,
    interactive: true,
    animation: true,
    legend: type !== 'pie' && type !== 'donut',
    tooltips: true,
  },
});

// No individual exports - all exports are handled by index.ts
