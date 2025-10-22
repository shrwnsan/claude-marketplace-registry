/**
 * EcosystemStats Components Export
 *
 * Centralized export point for all ecosystem statistics components.
 * This file provides a clean import interface for consumers of the
 * ecosystem statistics functionality.
 *
 * @author Claude Marketplace Team
 * @version 1.0.0
 */

// Main EcosystemStats Components
export { default as EcosystemStats } from './EcosystemStats';
export { default as OverviewMetrics } from './OverviewMetrics';
export { default as OverviewMetricsDemo } from './OverviewMetricsDemo';
export { default as GrowthTrends } from './GrowthTrends';
export { default as CategoryAnalytics } from './CategoryAnalytics';
export { default as QualityIndicators } from './QualityIndicators';

// Demo components for development
export { default as GrowthTrendsDemo } from './GrowthTrendsDemo';
export { default as QualityIndicatorsDemo } from './QualityIndicatorsDemo';

// Mock data for testing and development
export {
  mockEcosystemOverview,
  mockApiResponse,
  fetchMockEcosystemData
} from './mock-api-data';

// Re-export commonly used types for convenience
export type {
  TrendDataPoint,
  GrowthTrends as IGrowthTrends,
  EcosystemOverview,
  EcosystemStatsResponse,
  CommunityData,
  QualityIndicators as IQualityIndicators,
} from '../../types/ecosystem-stats';

export type { CategoryAnalytics as ICategoryAnalytics } from '../../types/ecosystem-stats';

export type { TimeRange } from '../../utils/data-processor';