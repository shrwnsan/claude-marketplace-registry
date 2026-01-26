# Ecosystem Statistics Types Guide

## Overview

This guide documents the comprehensive TypeScript type system created for the Claude Code ecosystem statistics feature. The type system provides type safety, validation, and utilities for handling ecosystem-wide metrics, growth trends, and analytics.

## Architecture

The ecosystem statistics type system is organized into four main files:

1. **`ecosystem-stats.ts`** - Core interfaces and types
2. **`ecosystem-stats-validation.ts`** - Zod validation schemas
3. **`ecosystem-stats-utils.ts`** - Utility functions and helpers
4. **`ecosystem-stats-examples.ts`** - Mock data and examples

## Core Interfaces

### EcosystemOverview

The main interface for ecosystem-wide metrics.

```typescript
interface EcosystemOverview {
  totalPlugins: number;
  totalMarketplaces: number;
  totalDevelopers: number;
  totalDownloads: number;
  lastUpdated: string;
  growthRate: {
    plugins: number;
    marketplaces: number;
    developers: number;
    downloads: number;
  };
  healthScore?: number;
  activeUsers?: number;
}
```

**Usage Example:**
```typescript
const overview: EcosystemOverview = {
  totalPlugins: 1250,
  totalMarketplaces: 15,
  totalDevelopers: 340,
  totalDownloads: 48200,
  lastUpdated: new Date().toISOString(),
  growthRate: {
    plugins: 15.2,
    marketplaces: 7.1,
    developers: 12.8,
    downloads: 23.4,
  },
  healthScore: 87.5,
  activeUsers: 12500,
};
```

### GrowthTrends

Time-series data for tracking ecosystem growth over time.

```typescript
interface GrowthTrends {
  plugins: TrendDataPoint[];
  marketplaces: TrendDataPoint[];
  developers: TrendDataPoint[];
  downloads: TrendDataPoint[];
  period: '7d' | '30d' | '90d' | '1y';
  aggregation: 'daily' | 'weekly' | 'monthly';
  predictions?: {
    plugins: TrendDataPoint[];
    marketplaces: TrendDataPoint[];
  };
}
```

**TrendDataPoint:**
```typescript
interface TrendDataPoint {
  date: string;
  value: number;
  change?: number;
  metadata?: Record<string, unknown>;
}
```

### CategoryAnalytics

Plugin distribution and category-specific insights.

```typescript
interface CategoryAnalytics {
  categories: CategoryData[];
  trending: string[];
  emerging: string[];
  underserved?: string[];
  insights: string[];
  performance?: {
    bestPerforming: string;
    fastestGrowing: string;
    mostPopular: string;
  };
}
```

### CommunityData

Developer participation and engagement metrics.

```typescript
interface CommunityData {
  activeDevelopers: number;
  developerParticipation: {
    newDevelopers: number;
    multiPluginDevelopers: number;
    retentionRate: number;
    avgContributions: number;
  };
  geographicDistribution?: Array<{
    country: string;
    count: number;
    percentage: number;
  }>;
  engagement: {
    avgRating: number;
    totalReviews: number;
    activeDiscussions: number;
    contributions: number;
  };
  topContributors?: Array<{
    username: string;
    contributions: number;
    plugins: string[];
    avatar?: string;
  }>;
}
```

### QualityIndicators

Trust signals, verification status, and maintenance metrics.

```typescript
interface QualityIndicators {
  verification: {
    verifiedPlugins: number;
    verificationRate: number;
    badges: Array<{
      type: 'security' | 'quality' | 'popularity' | 'maintenance';
      count: number;
    }>;
  };
  maintenance: {
    recentlyUpdated: number;
    activeMaintenanceRate: number;
    avgUpdateFrequency: number;
    abandonedPlugins: number;
  };
  qualityMetrics: {
    avgQualityScore: number;
    highQualityPlugins: number;
    commonIssues: Array<{
      issue: string;
      frequency: number;
      severity: 'low' | 'medium' | 'high';
    }>;
  };
  security?: {
    scannedPlugins: number;
    criticalIssues: number;
    securityScore: number;
  };
}
```

## API Response Types

### EcosystemStatsResponse

Standardized API response wrapper.

```typescript
interface EcosystemStatsResponse<T = any> {
  success: boolean;
  data?: T;
  error?: EcosystemError;
  meta: {
    timestamp: string;
    requestId: string;
    responseTime: number;
    cache?: CacheInfo;
  };
}
```

### PaginatedResponse

For handling large datasets with pagination.

```typescript
interface PaginatedResponse<T> extends EcosystemStatsResponse<T[]> {
  pagination: PaginationInfo;
}
```

### Error Handling

Comprehensive error information for debugging and user feedback.

```typescript
interface EcosystemError {
  code: string;
  message: string;
  details?: string;
  suggestions?: string[];
  stack?: string;
}
```

## Validation with Zod

All interfaces have corresponding Zod schemas for runtime validation.

### Basic Usage

```typescript
import { validators } from '@/types';

// Validate data
try {
  const validatedOverview = validators.ecosystemOverview(data);
  // Data is valid and typed
} catch (error) {
  // Handle validation error
}
```

### Safe Validation

```typescript
import { safeValidators } from '@/types';

// Safe validation that returns null instead of throwing
const validatedData = safeValidators.ecosystemOverview(data);
if (validatedData) {
  // Use validated data
}
```

### Custom Validation

```typescript
import { ecosystemOverviewSchema } from '@/types';

// Create custom validator
const customValidator = createValidator(ecosystemOverviewSchema);
const result = customValidator(data);
```

## Utility Functions

### Number Formatting

```typescript
import { formatters } from '@/types';

// Format large numbers
formatters.number(1250); // "1.3K"
formatters.number(2500000); // "2.5M"

// Format percentages
formatters.percentage(15.234); // "15.2%"

// Format growth rates with +/- prefix
formatters.growthRate(15.2); // "+15.2%"
formatters.growthRate(-5.3); // "-5.3%"

// Format download counts
formatters.downloads(1250); // "1.3K downloads"
```

### Date Formatting

```typescript
import { formatters } from '@/types';

const date = '2025-10-21T10:30:00Z';

formatters.date(date, 'short'); // "Oct 21, 2025"
formatters.date(date, 'medium'); // "Oct 21, 2025, 10:30 AM"
formatters.date(date, 'long'); // "Monday, October 21, 2025, 10:30:00 AM"
formatters.date(date, 'relative'); // "2 hours ago"
```

### Calculations

```typescript
import { calculators } from '@/types';

// Growth rates
calculators.growthRate(150, 100); // 50.0
calculators.growthRate(100, 150); // -33.3

// Percentages
calculators.percentage(25, 100); // 25.0
calculators.percentage(15, 30); // 50.0

// Averages and medians
const values = [1, 2, 3, 4, 5];
calculators.average(values); // 3
calculators.median(values); // 3

// Compound Annual Growth Rate (CAGR)
calculators.cagr(100, 150, 2); // 22.5
```

### Data Transformation

```typescript
import { transformers } from '@/types';

// Transform trends to chart data
const chartData = transformers.trendsToChartData(growthTrends, ['plugins', 'marketplaces']);

// Transform categories to pie chart
const pieData = transformers.categoriesToPieChart(categoryAnalytics);

// Create public-friendly stats
const publicStats = transformers.toPublicStats(fullStats);

// Aggregate plugins by marketplace
const marketplaceStats = transformers.aggregateByMarketplace(plugins);
```

## Chart Data Preparation

### Chart Configuration

```typescript
import { generateChartConfig } from '@/types';

const lineChart = generateChartConfig(
  'line',
  'Plugin Growth Over Time',
  {
    name: 'Total Plugins',
    data: mockGrowthTrends.plugins.map(point => [point.date, point.value]),
    color: '#3b82f6',
    type: 'line',
  }
);
```

### Recharts Integration

```typescript
import { prepareRechartsData } from '@/types';

const rechartsData = prepareRechartsData(
  rawTrendData,
  'date',
  'value',
  {
    formatX: (value) => new Date(value).toLocaleDateString(),
    formatY: (value) => formatNumber(value),
    sortX: true,
  }
);
```

## API Response Helpers

### Creating Responses

```typescript
import { apiHelpers } from '@/types';

// Success response
const successResponse = apiHelpers.createSuccessResponse(
  ecosystemData,
  { cache: { hit: true, ttl: 3600 } }
);

// Error response
const errorResponse = apiHelpers.createErrorResponse(
  'VALIDATION_ERROR',
  'Invalid ecosystem data',
  'Missing required fields: totalPlugins, totalMarketplaces'
);

// Paginated response
const paginatedResponse = apiHelpers.createPaginatedResponse(
  plugins,
  {
    page: 1,
    limit: 10,
    total: 1250,
    totalPages: 125,
    hasNext: true,
    hasPrev: false,
    offset: 0,
  }
);
```

### Response Validation

```typescript
const validatedResponse = apiHelpers.validateApiResponse(
  apiResponse,
  validators.ecosystemOverview
);
```

## Performance Utilities

### Performance Measurement

```typescript
import { performance } from '@/types';

// Measure execution time
const { result, time } = performance.measureExecutionTime(() => {
  return expensiveCalculation();
});
console.log(`Calculation took ${time}ms`);

// Debounce function calls
const debouncedSearch = performance.debounce(searchFunction, 300);

// Throttle function calls
const throttledUpdate = performance.throttle(updateFunction, 1000);
```

## Mock Data and Testing

### Using Mock Data

```typescript
import {
  mockEcosystemOverview,
  mockGrowthTrends,
  mockCategoryAnalytics,
  createCompleteEcosystemStats,
} from '@/types';

// Use individual mock data
const overview = mockEcosystemOverview;
const trends = mockGrowthTrends;

// Create complete ecosystem stats
const completeStats = createCompleteEcosystemStats();
```

### Test Data Filtering

```typescript
import { createFilteredPluginData } from '@/types';

// Filter plugins for testing
const verifiedPlugins = createFilteredPluginData({
  verified: true,
  minQualityScore: 80,
  minDownloads: 1000,
});

const categoryPlugins = createFilteredPluginData({
  category: 'development',
});
```

### Test Scenarios

The system includes edge cases for testing:

- **Empty ecosystem**: All zero values
- **Minimal ecosystem**: Single plugin/marketplace
- **Large ecosystem**: High-volume data for performance testing

## Best Practices

### Type Safety

1. **Always use validators** when receiving data from external sources
2. **Prefer safe validators** for optional data that may be invalid
3. **Use type guards** for runtime type checking

```typescript
// Good: Validate external data
const validatedData = validators.ecosystemOverview(apiResponse.data);

// Good: Safe validation for optional data
const optionalData = safeValidators.ecosystemOverview(maybeValidData);

// Good: Type guard for runtime checks
if (isEcosystemOverview(data)) {
  // TypeScript knows data is valid here
}
```

### Error Handling

1. **Use structured error responses** with codes and suggestions
2. **Provide meaningful error messages** for debugging
3. **Include suggestions** for user actions

```typescript
const errorResponse = createErrorResponse(
  'VALIDATION_ERROR',
  'Invalid ecosystem data provided',
  'The following fields are invalid: totalPlugins (must be non-negative)',
  ['Check that all numeric values are positive numbers', 'Ensure date fields are valid ISO strings']
);
```

### Performance

1. **Use debouncing** for user input like search
2. **Use throttling** for frequent updates
3. **Measure execution time** for performance-critical operations
4. **Use pagination** for large datasets

```typescript
// Debounced search
const debouncedSearch = debounce(performSearch, 300);

// Throttled updates
const throttledUpdate = throttle(updateDashboard, 1000);

// Measure performance
const { result, time } = measureExecutionTime(calculateEcosystemStats);
```

### Data Transformation

1. **Transform data once** at component boundaries
2. **Use memoization** for expensive transformations
3. **Create reusable transformers** for common operations

```typescript
// Transform data once
const chartData = useMemo(() =>
  transformTrendsToChartData(growthTrends, ['plugins', 'marketplaces']),
  [growthTrends]
);

// Reusable transformer
const createPublicStats = (fullStats) => {
  // Transform for public API consumption
};
```

## Integration Examples

### React Component Usage

```typescript
import React, { useState, useEffect } from 'react';
import { EcosystemOverview, validators } from '@/types';

interface EcosystemStatsProps {
  apiUrl: string;
}

export const EcosystemStats: React.FC<EcosystemStatsProps> = ({ apiUrl }) => {
  const [overview, setOverview] = useState<EcosystemOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch(apiUrl);
        const data = await response.json();

        // Validate data before using
        const validatedOverview = validators.ecosystemOverview(data);
        setOverview(validatedOverview);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch stats');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [apiUrl]);

  if (loading) return <div>Loading ecosystem stats...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!overview) return <div>No data available</div>;

  return (
    <div>
      <h2>Ecosystem Overview</h2>
      <div>Total Plugins: {formatNumber(overview.totalPlugins)}</div>
      <div>Total Marketplaces: {overview.totalMarketplaces}</div>
      <div>Plugin Growth: {formatGrowthRate(overview.growthRate.plugins)}</div>
    </div>
  );
};
```

### API Endpoint Usage

```typescript
import { NextApiRequest, NextApiResponse } from 'next';
import {
  EcosystemStatsResponse,
  validators,
  createSuccessResponse,
  createErrorResponse,
  apiHelpers
} from '@/types';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<EcosystemStatsResponse>
) {
  try {
    // Fetch ecosystem data from various sources
    const [marketplaces, plugins] = await Promise.all([
      fetchMarketplaces(),
      fetchPlugins(),
    ]);

    // Process and validate data
    const overview = {
      totalPlugins: plugins.length,
      totalMarketplaces: marketplaces.length,
      totalDevelopers: new Set(plugins.map(p => p.author)).size,
      totalDownloads: plugins.reduce((sum, p) => sum + p.downloads, 0),
      lastUpdated: new Date().toISOString(),
      growthRate: calculateGrowthRates(),
    };

    // Validate before responding
    const validatedOverview = validators.ecosystemOverview(overview);

    const response = apiHelpers.createSuccessResponse(validatedOverview, {
      responseTime: Date.now() - startTime,
      cache: { hit: false, ttl: 3600 },
    });

    res.status(200).json(response);
  } catch (error) {
    const errorResponse = apiHelpers.createErrorResponse(
      'INTERNAL_ERROR',
      'Failed to fetch ecosystem statistics',
      error instanceof Error ? error.message : 'Unknown error'
    );

    res.status(500).json(errorResponse);
  }
}
```

## Migration Guide

### From Single Repository Stats

When migrating from GitHub repository stats to ecosystem statistics:

1. **Replace data sources**: Use ecosystem-wide data instead of single repo metrics
2. **Update interfaces**: Use `EcosystemOverview` instead of repository stats
3. **Add validation**: Implement runtime validation for all ecosystem data
4. **Handle larger datasets**: Use pagination and filtering for ecosystem data

### Data Mapping

| Old Metric | New Ecosystem Metric | Description |
|------------|---------------------|-------------|
| Repository stars | Total downloads | More meaningful for ecosystem health |
| Repository forks | Total marketplaces | Shows ecosystem diversity |
| Contributors | Total developers | Tracks community participation |
| Commits | Plugin updates | Shows development activity |

## Conclusion

The ecosystem statistics type system provides a comprehensive foundation for handling ecosystem-wide metrics with full type safety, validation, and utilities. By following this guide and using the provided interfaces and utilities, you can build robust ecosystem analytics features that are maintainable, performant, and type-safe.

For additional examples and test cases, see the `ecosystem-stats-examples.ts` and `__tests__/ecosystem-stats.test.ts` files.