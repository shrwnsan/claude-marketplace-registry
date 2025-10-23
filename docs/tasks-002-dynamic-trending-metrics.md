# Task Breakdown: Dynamic Trending Metrics Implementation

**Task ID**: TASK-002
**Priority**: Medium
**Estimated Time**: 2-3 weeks
**Target Audience**: Junior to Mid-level Developers
**Dependencies**: Existing ecosystem stats infrastructure

## 🎯 Objective

Replace static mock trending percentages with real calculated metrics based on historical data analysis. Currently trending numbers are randomly generated (`Math.random() * 20 - 5`) and should reflect actual GitHub activity trends.

## 📋 Overview

Current trending metrics in the ecosystem dashboard show random percentages that change on each refresh. This task implements a real trending system that:

1. **Stores historical snapshots** of ecosystem metrics
2. **Calculates genuine growth rates** based on time-based comparisons
3. **Provides accurate trending indicators** for plugins, marketplaces, developers, and downloads

## 🏗️ Architecture Overview

```
Historical Data Collection → Trend Calculation → API Response → UI Display
```

**Current State**: `Math.random()` → Random percentages
**Target State**: Historical comparison → Real growth rates

---

## 📝 Task Breakdown

### **Phase 1: Data Infrastructure Setup**
**Estimated Time**: 3-4 days | **Complexity**: Medium | **Assign to**: Mid-level Dev

#### Task 1.1: Create Historical Data Storage
- **File**: `src/data/historical-data.ts`
- **Description**: Create data structures and storage for historical ecosystem metrics
- **Acceptance Criteria**:
  ```typescript
  // Create these interfaces and storage functions
  interface HistoricalSnapshot {
    timestamp: string;
    totalPlugins: number;
    totalMarketplaces: number;
    totalDevelopers: number;
    totalDownloads: number;
    // Additional metrics as needed
  }

  interface TrendingData {
    plugins: number;      // Real growth percentage
    marketplaces: number; // Real growth percentage
    developers: number;   // Real growth percentage
    downloads: number;    // Real growth percentage
  }
  ```
- **Implementation Steps**:
  1. Define TypeScript interfaces for historical data
  2. Create storage mechanism (file-based initially)
  3. Implement data persistence functions
  4. Add data retrieval functions for specific time ranges

#### Task 1.2: Implement Data Collection Service
- **File**: `src/services/data-collection.ts`
- **Description**: Create automated service to collect and store historical snapshots
- **Acceptance Criteria**:
  - Collects snapshots every 6 hours (aligned with existing scan schedule)
  - Stores data in `data/historical/` directory
  - Handles data validation and error recovery
  - Implements data retention (keep 90 days of daily snapshots)
- **Implementation Steps**:
  1. Create snapshot collection function
  2. Integrate with existing marketplace scanner (`scripts/scan-marketplaces.ts`)
  3. Add data validation and error handling
  4. Implement cleanup for old data

---

### **Phase 2: Trend Calculation Engine**
**Estimated Time**: 4-5 days | **Complexity**: Medium | **Assign to**: Mid-level Dev

#### Task 2.1: Create Trend Calculation Service
- **File**: `src/services/trend-calculator.ts`
- **Description**: Implement algorithms to calculate real growth rates from historical data
- **Acceptance Criteria**:
  ```typescript
  // Implement this core function
  interface TrendCalculator {
    calculateGrowthRate(current: number, previous: number): number;
    getTrendingData(timeRange: '7d' | '30d' | '90d'): Promise<TrendingData>;
    validateTrendData(data: TrendingData): boolean;
  }
  ```
- **Implementation Steps**:
  1. Create growth rate calculation formula: `((current - previous) / previous) * 100`
  2. Implement time-based data retrieval (7d, 30d, 90d ranges)
  3. Add edge case handling (division by zero, missing data)
  4. Create data validation functions

#### Task 2.2: Update Mock Data Generator
- **File**: `src/data/ecosystem-stats.ts`
- **Description**: Replace random trend generation with real trend calculation
- **Acceptance Criteria**:
  - Remove `Math.random() * 20 - 5` from growthRate generation
  - Integrate with trend calculation service
  - Maintain backward compatibility during transition
  - Add fallback to mock data when historical data unavailable
- **Implementation Steps**:
  1. Import trend calculator service
  2. Replace mock growthRate generation in `generateMockOverview()`
  3. Add conditional logic: real data → mock data fallback
  4. Update related mock generation functions

---

### **Phase 3: API Integration**
**Estimated Time**: 2-3 days | **Complexity**: Low | **Assign to**: Junior Dev

#### Task 3.1: Update API Endpoint
- **File**: `pages/api/ecosystem-stats.ts`
- **Description**: Modify API to return real trending data instead of mock data
- **Acceptance Criteria**:
  - API returns real calculated growth rates
  - Maintains existing response structure
  - Includes data source information (mock vs real)
  - Handles errors gracefully
- **Implementation Steps**:
  1. Import trend calculation service
  2. Update `processOverview()` function to use real trends
  3. Add metadata indicating data source
  4. Test API response structure consistency

#### Task 3.2: Add API Configuration
- **File**: `src/data/ecosystem-stats.ts` or new config file
- **Description**: Add configuration for trend calculation parameters
- **Acceptance Criteria**:
  - Configurable time ranges for trend calculation
  - Toggle between mock and real data (for testing)
  - Configurable data retention periods
- **Implementation Steps**:
  1. Create configuration interface
  2. Add environment variable support
  3. Implement configuration validation
  4. Update services to use configuration

---

### **Phase 4: Testing & Validation**
**Estimated Time**: 3-4 days | **Complexity**: Low-Medium | **Assign to**: Junior Dev

#### Task 4.1: Unit Tests
- **Files**: `src/services/__tests__/`, `src/data/__tests__/`
- **Description**: Create comprehensive test suite for trend calculation
- **Acceptance Criteria**:
  - 90%+ code coverage for trend calculation
  - Test edge cases (missing data, zero values)
  - Test data validation functions
  - Test configuration management
- **Test Cases to Implement**:
  ```typescript
  describe('TrendCalculator', () => {
    it('calculates correct growth rate for positive growth');
    it('calculates correct growth rate for negative growth');
    it('handles zero previous values gracefully');
    it('validates trend data correctly');
    it('handles missing historical data');
  });
  ```

#### Task 4.2: Integration Tests
- **Files**: `__tests__/integration/`
- **Description**: Test end-to-end trending data flow
- **Acceptance Criteria**:
  - API returns real trending data
  - UI displays correct trend indicators
  - Data persistence works correctly
  - Error handling functions properly
- **Implementation Steps**:
  1. Create test historical data sets
  2. Test API response with real data
  3. Test UI component rendering
  4. Test error scenarios

---

### **Phase 5: Documentation & Deployment**
**Estimated Time**: 1-2 days | **Complexity**: Low | **Assign to**: Junior Dev

#### Task 5.1: Update Documentation
- **File**: `docs/DEVELOPER_API.md` (update existing)
- **Description**: Document new trending metrics system
- **Acceptance Criteria**:
  - API documentation updated with new trend data structure
  - Configuration options documented
  - Setup instructions for historical data collection
  - Troubleshooting guide added
- **Implementation Steps**:
  1. Document new API response structure
  2. Add configuration guide
  3. Create setup instructions
  4. Add troubleshooting section

#### Task 5.2: Update Scripts & Automation
- **File**: `scripts/` directory
- **Description**: Integrate historical data collection into existing automation
- **Acceptance Criteria**:
  - Historical data collection runs automatically
  - Data cleanup automation implemented
  - Health checks include historical data status
  - Backup processes include historical data
- **Implementation Steps**:
  1. Update `scripts/scan-marketplaces.ts` to collect snapshots
  2. Add data cleanup to maintenance scripts
  3. Update health check endpoints
  4. Include historical data in backup processes

---

## 🎯 Success Criteria

### Functional Requirements
- ✅ Trending percentages reflect real GitHub activity changes
- ✅ Data is calculated from historical snapshots (30-day comparison)
- ✅ UI displays accurate up/down indicators
- ✅ System gracefully handles missing historical data
- ✅ API maintains backward compatibility

### Technical Requirements
- ✅ 90%+ test coverage for new code
- ✅ Zero breaking changes to existing API
- ✅ Performance impact < 100ms on API response time
- ✅ Data retention of 90 days with automated cleanup
- ✅ Fallback to mock data when historical data unavailable

### Quality Requirements
- ✅ All TypeScript errors resolved
- ✅ ESLint passes without warnings
- ✅ Integration tests cover critical paths
- ✅ Documentation is complete and accurate
- ✅ Error handling is comprehensive

---

## 🚀 Implementation Notes

### For Junior Developers
1. **Start with Phase 1**: Focus on understanding existing data structures first
2. **Use TypeScript strictly**: All new code must have proper types
3. **Test as you go**: Write tests for each function before moving to next
4. **Ask for code review**: Especially for trend calculation algorithms

### For Mid-level Developers
1. **Focus on Phase 2**: Trend calculation logic requires careful attention
2. **Consider edge cases**: Think about missing data, zero values, etc.
3. **Performance matters**: Historical data queries should be optimized
4. **Plan for scalability**: Design for future enhancements

### Testing Strategy
1. **Mock Historical Data**: Create test datasets with known patterns
2. **Boundary Testing**: Test with very small and very large datasets
3. **Error Scenarios**: Test what happens when historical data is missing
4. **Performance Testing**: Ensure API response times remain acceptable

---

## 📚 Related Documentation

- **PRD**: `docs/prd-001-claude-marketplace-aggregator.md`
- **Architecture**: `docs/MAINTENANCE_GUIDE.md`
- **API Reference**: `docs/DEVELOPER_API.md`
- **Previous Tasks**: `docs/tasks-001-prd-claude-marketplace-aggregator.md`

---

**Last Updated**: 2025-10-23
**Next Review**: After Phase 2 completion
**Dependencies**: None (can start immediately)