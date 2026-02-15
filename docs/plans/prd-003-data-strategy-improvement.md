# Data Strategy Improvement PRD

> **Status:** Phase 1 Partial | Phase 2 Not Started | Phase 3 Not Started | Phase 4 Not Started
> **Maps to:** PRD-001 Phase 1 & 2 (Data Pipeline, Quality Scoring)
> **Last Updated:** 2026-02-15

## 📋 Executive Summary

This PRD outlines improvements to the Claude Marketplace Aggregator's data strategy to evolve from batch-only scanning to a sophisticated, incremental system with change detection, caching, and plugin discovery.

## 🎯 Objectives

### Primary Goals
1. **Enable Incremental Updates**: Move from full re-scans to intelligent delta updates ❌
2. **Implement Change Detection**: Track additions, updates, and removals across scans ❌
3. **Add Plugin Discovery**: Extend from marketplace discovery to comprehensive plugin indexing ❌
4. **Optimize API Usage**: Reduce GitHub API calls through smart caching 🔄
5. **Improve Data Quality**: Add validation and error handling ✅

### Success Metrics
- **Reduce API calls by 80%** through caching and incremental updates ❌
- **Detect 100% of changes** (added/updated/removed marketplaces) ❌
- **Index 500+ plugins** from discovered marketplaces ❌
- **Maintain >99% uptime** during data refresh cycles ✅
- **Enable daily automated scans** without manual intervention ✅

## 📊 Current State Analysis

### What's Working Well ✅
- **Marketplace Discovery**: 5 marketplaces found (0% with manifests) - Discovery working, manifest adoption low
- **Data Pipeline**: Clean separation of raw/processed/summary data ✅
- **Build Integration**: Automated data generation pre-build ✅
- **API Endpoints**: Functional ecosystem statistics ✅
- **Validation**: Schema validation for marketplace and plugin manifests (`src/utils/schema-validation.ts`) ✅
- **Rate Limiting**: GitHub API client with rate limiting (`src/utils/github-client.ts`) ✅
- **Health Monitoring**: Health checker system (`src/lib/monitoring/health-checker.ts`) ✅
- **Automated Scans**: Daily automated scans via GitHub Actions (`.github/workflows/scan.yml`) ✅

### Current Limitations ❌
- **No Change Detection**: Every scan is full refresh (expensive) ❌
- **No Persistent Caching**: Only in-memory cache (lost on restart), no file-based cache ❌
- **No Conditional Requests**: ETag/If-Modified-Since not implemented ❌
- **Limited Plugin Data**: Only marketplace metadata, plugins array empty (`public/data/plugins.json` = `[]`) ❌
- **No Update Intelligence**: Can't prioritize important changes ❌
- **Rate Limit Risk**: Full repo scans could hit GitHub limits 🔄

## 🚀 Proposed Solution

### 1. Incremental Scanning System

#### Change Detection Engine
```typescript
interface ScanComparison {
  previousScan: string;           // ISO timestamp of last scan
  currentScan: string;            // ISO timestamp of current scan
  changes: {
    added: Marketplace[];       // New repositories discovered
    updated: Marketplace[];     // Repositories with new commits/stars
    removed: string[];         // Repository IDs no longer found
    unchanged: Marketplace[];   // Repositories with no changes
  };
  scanDuration: number;           // Time taken for current scan
  apiCallsUsed: number;         // GitHub API calls consumed
}
```

#### Smart Update Logic
```typescript
interface UpdateStrategy {
  // Triggers for incremental updates
  forceFullScan: boolean;        // Manual override option
  timeSinceLastScan: number;      // Hours since last update
  hasChanges: boolean;            // Any repositories detected changes
  apiRateLimit: boolean;          // GitHub API rate limit status

  // Decision matrix
  shouldIncremental: boolean;
  updatePriority: 'high' | 'medium' | 'low';
}
```

### 2. Intelligent Caching Layer

#### Multi-Level Cache Strategy
```typescript
interface CacheSystem {
  // L1: In-memory cache (current runtime)
  memoryCache: Map<string, CachedData>;

  // L2: File-based cache (persistent)
  fileCache: {
    marketplaces: CachedMarketplaces;
    repositoryDetails: CachedRepository[];
    manifests: CachedManifests[];
  };

  // L3: GitHub API conditional requests
  conditionalRequests: {
    useIfModifiedSince: boolean;
    etagTracking: boolean;
    cacheTTL: number;           // Hours
  };
}
```

#### Cache Optimization Rules
- **Repository Data**: 1-hour TTL for basic info, 24-hour TTL for detailed stats
- **Manifest Content**: 6-hour TTL (changes less frequent)
- **Search Results**: 30-minute TTL with pagination caching
- **API Rate Limiting**: Respect 429 responses with exponential backoff

### 3. Plugin Discovery Framework

#### Multi-Source Plugin Detection
```typescript
interface PluginDiscovery {
  sources: {
    // Method 1: Manifest-based discovery
    marketplaceManifests: {
      pluginsPath: string[];    // Common plugin directory paths
      manifestFormat: string;   // Expected schema
    };

    // Method 2: File system traversal
    repositoryScanning: {
      excludePatterns: string[];  // .git, node_modules, etc.
      includeExtensions: string[]; // .js, .ts, .json
      maxDepth: number;          // Limit recursion depth
    };

    // Method 3: README parsing
    documentationMining: {
      keywords: string[];       // "plugin", "extension", "tool"
      patterns: RegExp[];       // URL patterns, code blocks
    };
  };
}
```

#### Plugin Validation Pipeline
```typescript
interface PluginValidation {
  stages: {
    // Stage 1: Basic validation
    metadataCheck: {
      required: ['name', 'version', 'description'];
      optional: ['author', 'repository', 'homepage'];
      validators: {
        semver: RegExp;          // Version format validation
        urlFormat: RegExp;       // URL validation
        uniqueIds: boolean;      // Prevent duplicates
      };
    };

    // Stage 2: Content validation
    contentCheck: {
      fileExists: boolean;        // Verify referenced files exist
      syntaxValid: boolean;       // JSON/schema validation
      accessibilityCheck: boolean; // URL reachability test
    };

    // Stage 3: Security validation
    securityCheck: {
      packageAudit: boolean;       // npm audit if package.json
      codeAnalysis: boolean;       // Basic security pattern scan
      reputationCheck: boolean;    // Repository stats verification
    };
  };
}
```

### 4. Data Quality & Validation

#### Schema Enforcement
```typescript
interface DataValidation {
  marketplaceSchema: {
    required: ['id', 'name', 'url', 'updatedAt'];
    optional: ['description', 'stars', 'forks', 'language'];
    types: {
      id: 'string';
      stars: 'number';
      updatedAt: 'ISO8601';
    };
  };

  pluginSchema: {
    required: ['name', 'version', 'marketplaceId'];
    optional: ['description', 'author', 'repository'];
    validators: {
      version: 'semver';         // Semantic versioning
      marketplaceId: 'existing'; // Must reference known marketplace
    };
  };
}
```

#### Error Handling & Recovery
```typescript
interface ErrorHandling {
  retryStrategy: {
    maxRetries: number;
    backoffStrategy: 'exponential' | 'linear';
    retryableErrors: string[];   // HTTP 429, 500, 502, 503
  };

  fallbackStrategy: {
    useCachedData: boolean;       // Serve stale data if API fails
    indicateStale: boolean;       // Flag data as potentially outdated
    partialProcessing: boolean;   // Continue with subset of data
  };
}
```

## 🗓️ Implementation Roadmap

### Phase 1: Foundation (Week 1-2)
**Goal**: Add change detection and incremental scanning
**Status**: 🔄 Partial - Basic caching exists, no change detection

#### Sprint 1.1: Change Detection Engine
- [ ] **Implement timestamp tracking** in scan results ❌
- [ ] **Create comparison logic** for detecting changes ❌
- [ ] **Add change summary reporting** (added/updated/removed counts) ❌
- [ ] **Build incremental scan decision matrix** ❌

#### Sprint 1.2: Caching Layer v1
- [x] **Add in-memory caching** for data collection results ✅ (via `DataCache` in `src/services/ecosystem-data.ts`)
- [ ] **Add file-based caching** for GitHub API responses ❌
- [x] **Implement TTL logic** for different data types ✅ (`cacheTTL: 360` minutes default)
- [ ] **Add cache hit/miss metrics** and logging ❌
- [ ] **Create cache invalidation strategy** ❌

**Deliverables**:
- Updated `scan-marketplaces.ts` with incremental logic ❌
- New `cache-manager.ts` module ❌
- Enhanced `summary.json` with change tracking ❌
- Reduced API calls by ~60% ❌ (only in-memory caching exists)

### Phase 2: Plugin Discovery (Week 3-4)
**Goal**: Comprehensive plugin indexing from marketplaces
**Status**: ❌ Not Started

#### Sprint 2.1: Plugin Scanning Engine
- [x] **Implement marketplace manifest parsing** for plugin arrays ✅ (`parseManifestToPlugins` in ecosystem-data.ts)
- [ ] **Add repository file system scanning** for plugin discovery ❌
- [x] **Create plugin validation pipeline** with schema enforcement ✅ (`validatePluginManifest` in schema-validation.ts)
- [ ] **Build plugin metadata extraction** from multiple sources ❌

#### Sprint 2.2: Plugin Data Integration
- [ ] **Update data pipeline** to process plugin data ❌
- [ ] **Create plugin-specific API endpoints** (`/api/plugins/*`) ❌
- [ ] **Add plugin statistics and analytics** ❌
- [ ] **Implement plugin search and filtering** ❌

**Deliverables**:
- New `plugin-discovery.ts` scanner ❌
- Updated `generate-data.ts` for plugin processing ❌
- Plugin API endpoints with search/filter capabilities ❌
- Index of 300+ plugins across 80+ marketplaces ❌ (currently 0 plugins indexed)

### Phase 3: Optimization (Week 5-6)
**Goal**: Performance, reliability, and automation
**Status**: 🔄 Partial - Some automation exists

#### Sprint 3.1: Advanced Caching & Performance
- [ ] **Implement conditional GitHub requests** (ETag, If-Modified-Since) ❌
- [x] **Add API rate limit handling** with intelligent backoff ✅ (`RateLimiter` in `src/utils/security.ts`, used by `GitHubClient`)
- [ ] **Create cache warming strategy** for frequently accessed data ❌
- [x] **Build performance monitoring** and alerting ✅ (`health-checker.ts` monitors response times, data freshness)

#### Sprint 3.2: Automation & Scheduling
- [x] **Implement scheduled scanning** (daily/weekly options) ✅ (`.github/workflows/scan.yml` runs daily)
- [x] **Add health check endpoints** for scan status ✅ (`/api/health`, `public/data/health.json`)
- [ ] **Create administrative dashboard** for data management ❌
- [ ] **Build backup/restore functionality** for data recovery ❌

**Deliverables**:
- Advanced caching with 90%+ hit rate ❌
- Automated daily scanning system ✅
- Admin dashboard for data management ❌
- Complete backup/restore system ❌

### Phase 4: Production Readiness (Week 7-8)
**Goal**: Enterprise-grade reliability and monitoring
**Status**: ❌ Not Started

#### Sprint 4.1: Monitoring & Alerting
- [ ] **Implement comprehensive error tracking** and reporting ❌
- [x] **Add performance metrics** and monitoring dashboards 🔄 (basic metrics in `health-checker.ts`, `metrics.json`)
- [ ] **Create alerting system** for data anomalies ❌
- [x] **Build data quality metrics** and validation reports ✅ (`validateMarketplaceManifest`, `validatePluginManifest`)

#### Sprint 4.2: Documentation & Deployment
- [ ] **Complete API documentation** for all endpoints ❌
- [ ] **Create operational runbooks** for data management ❌
- [x] **Build deployment automation** with rollback capabilities ✅ (`.github/workflows/deploy.yml`, auto-merge for data updates)
- [ ] **Add A/B testing** for scanning strategies ❌

**Deliverables**:
- Production-ready data pipeline 🔄 (partial - basic pipeline exists)
- Comprehensive monitoring and alerting 🔄 (basic health monitoring exists)
- Complete documentation suite ❌
- Automated deployment with rollback ✅

## 📈 Success Metrics & KPIs

### Technical Metrics
- **API Call Reduction**: Target 80% reduction through caching
- **Cache Hit Rate**: Target 90%+ for repeated requests
- **Scan Performance**: Target 50% faster incremental scans
- **Data Freshness**: Target <1 hour staleness for active repos
- **Error Rate**: Target <0.1% failed scans

### Business Metrics
- **Plugin Coverage**: Target 500+ indexed plugins
- **Marketplace Coverage**: Target 150+ indexed marketplaces
- **Update Frequency**: Target daily automatic updates
- **Data Quality**: Target 99%+ validation success rate
- **User Engagement**: Track plugin marketplace API usage

### Operational Metrics
- **System Uptime**: Target 99.9% availability
- **Mean Time To Recovery**: Target <5 minutes for failures
- **Data Backup Success**: Target 100% daily backup completion
- **Alert Response Time**: Target <15 minutes for critical alerts

## 🔧 Technical Implementation Details

### File Structure Changes
```
src/
├── data/
│   ├── cache-manager.ts          # NEW: Caching system
│   ├── change-detector.ts        # NEW: Change detection logic
│   ├── plugin-discovery.ts      # NEW: Plugin scanning
│   ├── data-validator.ts          # NEW: Data validation
│   └── scan-manager.ts          # NEW: Orchestrate scanning
├── types/
│   ├── cache.types.ts            # NEW: Cache type definitions
│   ├── change-detector.types.ts  # NEW: Change detection types
│   └── plugin.types.ts           # NEW: Plugin type definitions
└── scripts/
    ├── scan-marketplaces.ts       # UPDATED: Incremental scanning
    ├── generate-data.ts           # UPDATED: Plugin processing
    └── maintenance/
        ├── scheduled-scan.ts     # NEW: Automated scheduling
        └── data-backup.ts        # NEW: Backup system
```

### API Enhancements
```typescript
// NEW API Endpoints
GET  /api/data/status              // Scan status and health
GET  /api/data/changes             // Recent changes history
GET  /api/plugins/search?q=...     // Plugin search
GET  /api/plugins/:id             // Plugin details
GET  /api/admin/scan              // Trigger manual scan
GET  /api/admin/cache              // Cache management
POST /api/admin/cache/clear        // Cache invalidation
```

### Configuration Management
```typescript
// environment variables
CACHE_TTL_HOURS = 1              // Cache time-to-live
SCAN_MODE = 'incremental'         // 'incremental' | 'full'
PLUGIN_DISCOVERY = true             // Enable plugin scanning
SCHEDULE_SCAN_HOURS = 24           // Auto-scan interval
RATE_LIMIT_DELAY = 1000           // API rate limiting (ms)
```

## 🚦 Risk Assessment & Mitigation

### Technical Risks
| Risk | Impact | Mitigation |
|------|---------|------------|
| Cache invalidation bugs | High | Comprehensive cache versioning + TTL strategies |
| API rate limiting | Medium | Intelligent backoff + priority queuing |
| Plugin schema drift | Medium | Versioned manifests + backward compatibility |
| Performance degradation | Low | Comprehensive monitoring + rollback procedures |

### Business Risks
| Risk | Impact | Mitigation |
|------|---------|------------|
| Data staleness | Medium | Real-time updates + freshness indicators |
| GitHub API changes | Low | Abstraction layer + adapter pattern |
| Increased complexity | Low | Incremental rollout + comprehensive testing |

## 🚨 Data Degradation & Error Handling Strategy

### Critical Issues to Address

#### 1. Repository Lifecycle Management
```typescript
interface RepositoryLifecycle {
  // Handle repositories that disappear or change status
  lifecycleEvents: {
    deleted: Repository[];           // Previously found, now 404s
    archived: Repository[];           // Still exists but archived
    renamed: Repository[];            // Changed owner/name
    private: Repository[];            // Made private (403s)
    corrupted: Repository[];           // Bad data, parsing errors
  };

  // UX/UI implications
  userNotifications: {
    deprecationWarning: boolean;    // Alert users of removals
    migrationNotice: boolean;        // Inform about renames
    alternativeSuggestions: string[]; // Suggest similar marketplaces
  };
}
```

#### 2. Data Quality & Validation
```typescript
interface DataQuality {
  // Detect and handle problematic data
  validationResults: {
    highErrorRate: number;          // % repositories with errors
    dataCorruption: boolean;        // System-wide data issues
    inconsistentSchema: string[];    // Schema drift across sources
    duplicateEntries: Repository[];   // Same marketplace multiple times
  };

  // Progressive degradation handling
  fallbackStrategies: {
    useStaleCache: boolean;         // Serve old but functional data
    partialDataset: boolean;          // Serve subset if full fails
    readOnlyMode: boolean;           // Disable writes, keep serving reads
  };
}
```

#### 3. Error Detection & Recovery
```typescript
interface ErrorHandling {
  // Proactive error detection
  errorPatterns: {
    apiTimeouts: number;             // GitHub API timeout rate
    parsingFailures: number;           // Malformed manifests
    networkErrors: number;            // Connection issues
    rateLimitHits: number;            // GitHub API limits reached
  };

  // Automated recovery actions
  recoveryActions: {
    retryWithBackoff: boolean;        // Exponential backoff retry
    switchToAlternative: boolean;      // Use backup data source
    notifyAdministrators: boolean;     // Alert team immediately
    enterSafeMode: boolean;           // Disable non-essential features
  };
}
```

#### 4. User Experience (UX) for Data Issues
```typescript
interface DataUX {
  // Transparency and user communication
  statusIndicators: {
    dataFreshness: 'fresh' | 'stale' | 'very-stale' | 'unknown';
    lastUpdateTime: ISO8601;           // When data was last verified
    confidenceScore: number;             // 0-100 data reliability score
    activeIssues: string[];              // Known current problems
  };

  // User controls and information
  userInterface: {
    forceRefreshButton: boolean;          // Manual refresh option
    showLastScanDetails: boolean;        // Detailed scan status
    subscribeToUpdates: boolean;         // Email/webhook notifications
    reportDataIssue: boolean;            // Easy problem reporting
  };
}
```

### Specific Scenarios & Solutions

#### Scenario 1: Repository Disappears
**Problem**: Popular marketplace gets deleted/renamed
**Current Impact**: Broken links, 404 errors, poor UX
**Solution**:
- Detect 404s during incremental scans
- Maintain graceful degradation (show last known state)
- Display "This marketplace appears to be unavailable" message
- Suggest alternatives based on similar repositories
- Keep entry for 30 days before full removal (in case of temp issues)

#### Scenario 2: Data Corruption
**Problem**: Invalid JSON, parsing errors, schema violations
**Current Impact**: Application crashes, broken data display
**Solution**:
- Schema validation before data processing
- Quarantine corrupted entries
- Fall back to last known good dataset
- Log detailed error information for debugging
- Automatic data repair for common issues

#### Scenario 3: API Rate Limiting
**Problem**: GitHub API limits reached during scan
**Current Impact**: Incomplete scans, missing data
**Solution**:
- Implement intelligent rate limiting with queuing
- Cache partial results during rate limit period
- Resume scanning when limits reset
- Display "Scan in progress - partial data available" status
- Prioritize high-importance repositories first

#### Scenario 4: Stale Cache Data
**Problem**: Cached data becomes outdated but system doesn't know
**Current Impact**: Users see old information, wrong statistics
**Solution**:
- Implement cache invalidation with TTL + change detection
- Show "Last updated" timestamps prominently
- Implement freshness indicators (green = fresh, yellow = stale, red = very stale)
- Allow manual cache refresh by users
- Background verification of critical data

### Error Communication Strategy

#### UI Status Indicators
```typescript
interface StatusDisplay {
  // Visual indicators for data health
  dataHealth: {
    status: 'healthy' | 'warning' | 'critical';
    message: string;                    // Human-readable status
    actionRequired: boolean;            // User should take action
    lastChecked: ISO8601;            // When status was verified
  };

  // Contextual information
  context: {
    totalMarketplaces: number;
    recentErrors: number;
    lastSuccessfulScan: ISO8601;
    nextScheduledScan: ISO8601;
  };
}
```

#### Error Messaging Guidelines
1. **Be Specific**: "Cannot connect to GitHub API" vs "Data loading failed"
2. **Provide Context**: "Last successful scan: 2 hours ago"
3. **Offer Solutions**: "Try refreshing in 5 minutes" or "Contact support"
4. **Set Expectations**: "Automatic retry in 10 minutes" vs indefinite loading
5. **Maintain Functionality**: Show old data with warnings vs complete failure

### Monitoring & Alerting

#### Data Quality Metrics
```typescript
interface DataQualityMetrics {
  // Real-time quality monitoring
  qualityScore: number;               // 0-100 overall data health
  errorRate: number;                 // % of repositories with issues
  stalenessScore: number;            // How fresh the data is
  coverageRate: number;               // % of expected data successfully collected
  reliabilityScore: number;            // Historical success rate
}
```

#### Automated Alerting Rules
- **Critical**: Data corruption, >10% error rate, scan failures >3 consecutive
- **Warning**: High staleness, increased error rate, cache miss rate >50%
- **Info**: Scheduled scan results, data updates, performance metrics

#### Recovery Automation
- **Immediate**: Switch to cached data, enter read-only mode
- **Short-term**: Retry failed operations with backoff, use alternative data sources
- **Long-term**: Implement fixes, add monitoring, improve error handling

## ✅ Acceptance Criteria

### Phase Completion Gates
- [ ] **Phase 1**: 60% reduction in API calls, change detection working, basic error handling ❌ (error handling done, others not)
- [ ] **Phase 2**: 300+ plugins indexed, plugin API functional, data validation pipeline ❌ (validation done, others not)
- [ ] **Phase 3**: Daily automated scans, 90%+ cache hit rate, comprehensive monitoring 🔄 (daily scans done)
- [ ] **Phase 4**: 99.9% uptime, complete monitoring suite, graceful degradation handling ❌

### Final Success Metrics
- [ ] **500+ plugins** indexed from 80+ marketplaces ❌ (currently 0 plugins, 5 marketplaces)
- [ ] **80% reduction** in GitHub API usage through caching ❌ (no persistent caching)
- [x] **Daily automated** updates with zero manual intervention ✅
- [ ] **Sub-minute incremental** scans for changed repositories ❌
- [ ] **99.9% system uptime** with <5 minute recovery time 🔄 (uptime good, no formal measurement)
- [ ] **Complete monitoring** and alerting for all data pipeline components 🔄 (basic health monitoring)
- [ ] **Graceful degradation** - system remains usable during partial failures ❌
- [ ] **Transparent error communication** - users understand issues and timelines ❌
- [ ] **Data freshness indicators** - users know how current their data is 🔄 (timestamps in data)
- [ ] **Automated recovery** - system heals common issues without intervention ❌

---

## 📋 Next Steps

1. **Stakeholder Review**: Present PRD for approval and feedback
2. **Sprint Planning**: Break down Phase 1 into 2-week sprints
3. **Resource Allocation**: Assign development responsibilities
4. **Implementation Timeline**: Set concrete dates for each phase
5. **Success Metrics Setup**: Implement tracking and reporting dashboard

**Document Version**: 1.1
**Last Updated**: 2026-02-15
**Author**: Claude Marketplace Aggregator Team
**Reviewers**: [To be assigned]
**Approval Status**: [Pending]

---

## Implementation Status Summary

| Goal | Status | Notes |
|------|--------|-------|
| Incremental Updates | ❌ | Full scan on each run |
| Change Detection | ❌ | Not implemented |
| Plugin Discovery | ❌ | Manifest parsing exists but 0 plugins indexed |
| API Optimization | 🔄 | Rate limiting done, no caching |
| Data Quality | ✅ | Schema validation implemented |

| Phase | Status | Completion |
|-------|--------|------------|
| Phase 1: Foundation | 🔄 | ~30% (caching partial) |
| Phase 2: Plugin Discovery | ❌ | ~10% (validation only) |
| Phase 3: Optimization | 🔄 | ~40% (daily scans, health checks) |
| Phase 4: Production Readiness | ❌ | ~20% (deployment automation) |

**Overall Progress**: ~25% Complete