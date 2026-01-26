# API Documentation
## Ecosystem Statistics API

**Version:** 1.0
**Base URL:** `/api/ecosystem-stats`
**Last Updated:** 2025-10-26

---

## 📋 Overview

The Ecosystem Statistics API provides comprehensive data about the Claude Code plugin ecosystem, including plugin counts, growth trends, quality metrics, and developer insights. This API replaces single-repository GitHub statistics with aggregated ecosystem-wide data.

### Key Features

- **📊 Comprehensive Metrics**: Plugin counts, downloads, developers, marketplaces
- **📈 Growth Trends**: Historical data with multiple time ranges
- **🏆 Quality Indicators**: Verification status, maintenance rates, quality scores
- **🔍 Category Analytics**: Plugin distribution by category and trending analysis
- **⚡ High Performance**: Cached responses with <50ms average response time
- **🛡️ Secure**: Rate-limited, validated, and monitored endpoints

---

## 🔗 API Endpoints

### Base Endpoint
```
GET /api/ecosystem-stats
```

### Specific Data Endpoints

#### Overview Metrics
```http
GET /api/ecosystem-stats?overview
```
Returns comprehensive ecosystem overview including totals, growth rates, and health scores.

#### Quality Indicators
```http
GET /api/ecosystem-stats?quality
```
Returns plugin quality metrics, verification status, and maintenance indicators.

#### Growth Trends
```http
GET /api/ecosystem-stats?growth
```
Returns historical growth data across different time ranges.

#### Category Analytics
```http
GET /api/ecosystem-stats?categories
```
Returns plugin distribution by category and trending analysis.

---

## 📊 Response Format

### Standard Response Structure

```json
{
  "success": true,
  "data": {
    // Response-specific data
  },
  "meta": {
    "timestamp": "2025-10-26T10:30:00Z",
    "requestId": "req_abc123def456",
    "responseTime": 150,
    "cacheStatus": "hit|miss|stale",
    "dataFreshness": "2025-10-26T04:30:00Z"
  }
}
```

### Error Response Structure

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error description",
    "details": "Additional error context"
  },
  "meta": {
    "timestamp": "2025-10-26T10:30:00Z",
    "requestId": "req_abc123def456",
    "responseTime": 50
  }
}
```

---

## 🔍 Endpoint Details

### Overview Metrics

**Endpoint:** `GET /api/ecosystem-stats?overview`

#### Response Data Structure
```json
{
  "success": true,
  "data": {
    "totalPlugins": 1250,
    "totalMarketplaces": 15,
    "totalDevelopers": 340,
    "totalDownloads": 48200,
    "lastUpdated": "2025-10-26T04:30:00Z",
    "growthRate": {
      "plugins": 15.2,
      "marketplaces": 7.1,
      "developers": 12.8,
      "downloads": 23.4
    },
    "healthScore": 85
  }
}
```

#### Fields Description
- `totalPlugins`: Total number of plugins across all marketplaces
- `totalMarketplaces`: Number of active marketplaces
- `totalDevelopers`: Unique contributors to the ecosystem
- `totalDownloads`: Combined downloads across all plugins
- `lastUpdated`: Timestamp of last data refresh
- `growthRate`: Percentage growth in last 30 days
- `healthScore`: Overall ecosystem health (0-100)

#### Example Request
```bash
curl "https://example.com/api/ecosystem-stats?overview" \
  -H "Accept: application/json" \
  -H "Cache-Control: no-cache"
```

### Quality Indicators

**Endpoint:** `GET /api/ecosystem-stats?quality`

#### Response Data Structure
```json
{
  "success": true,
  "data": {
    "verification": {
      "verifiedPlugins": 850,
      "verificationRate": 68.0,
      "badges": [
        {
          "type": "security",
          "count": 450
        },
        {
          "type": "quality",
          "count": 620
        },
        {
          "type": "popularity",
          "count": 280
        },
        {
          "type": "maintenance",
          "count": 380
        }
      ]
    },
    "maintenance": {
      "recentlyUpdated": 720,
      "activeMaintenanceRate": 57.6,
      "avgUpdateFrequency": 14,
      "abandonedPlugins": 15
    },
    "qualityMetrics": {
      "avgQualityScore": 78.5,
      "highQualityPlugins": 520,
      "commonIssues": [
        {
          "issue": "Missing documentation",
          "frequency": 45,
          "severity": "low"
        },
        {
          "issue": "Outdated dependencies",
          "frequency": 28,
          "severity": "medium"
        },
        {
          "issue": "Security vulnerabilities",
          "frequency": 8,
          "severity": "high"
        }
      ]
    },
    "security": {
      "scannedPlugins": 980,
      "criticalIssues": 8,
      "securityScore": 82.3
    }
  }
}
```

#### Fields Description

##### Verification Section
- `verifiedPlugins`: Number of verified plugins
- `verificationRate`: Percentage of plugins verified
- `badges`: Array of verification badges by type

##### Maintenance Section
- `recentlyUpdated`: Plugins updated in last 30 days
- `activeMaintenanceRate`: Percentage with active maintenance
- `avgUpdateFrequency`: Average days between updates
- `abandonedPlugins`: Plugins not updated in 6+ months

##### Quality Metrics Section
- `avgQualityScore`: Average quality score (0-100)
- `highQualityPlugins`: Plugins scoring 80+
- `commonIssues`: Frequent issues and their frequency

##### Security Section
- `scannedPlugins`: Number of security-scanned plugins
- `criticalIssues`: Number of critical security issues
- `securityScore`: Overall security assessment (0-100)

### Growth Trends

**Endpoint:** `GET /api/ecosystem-stats?growth`

#### Query Parameters
| Parameter | Type | Required | Description | Default |
|-----------|------|----------|-------------|---------|
| `timeRange` | string | No | Time period for trends | 30d |
| `start_date` | string | No | Start date (ISO format) | 30 days ago |
| `end_date` | string | No | End date (ISO format) | today |

#### Time Range Options
- `7d`: Last 7 days
- `30d`: Last 30 days
- `90d`: Last 90 days
- `1y`: Last year
- Custom date range with start_date/end_date

#### Response Data Structure
```json
{
  "success": true,
  "data": {
    "timeRange": "30d",
    "dataPoints": [
      {
        "date": "2025-09-26T00:00:00Z",
        "plugins": 1085,
        "marketplaces": 14,
        "developers": 301,
        "downloads": 39050
      },
      {
        "date": "2025-09-27T00:00:00Z",
        "plugins": 1095,
        "marketplaces": 14,
        "developers": 305,
        "downloads": 39800
      }
      // ... more data points
    ],
    "summary": {
      "totalGrowth": {
        "plugins": 15.2,
        "marketplaces": 7.1,
        "developers": 12.8,
        "downloads": 23.4
      },
      "averageDailyGrowth": {
        "plugins": 0.51,
        "marketplaces": 0.24,
        "developers": 0.43,
        "downloads": 0.78
      },
      "growthAcceleration": {
        "plugins": 0.02,
        "marketplaces": 0.01,
        "developers": 0.03,
        "downloads": 0.05
      }
    }
  }
}
```

### Category Analytics

**Endpoint:** `GET /api/ecosystem-stats?categories`

#### Response Data Structure
```json
{
  "success": true,
  "data": {
    "categoryDistribution": [
      {
        "category": "Development Tools",
        "count": 325,
        "percentage": 26.0,
        "growthRate": 18.5
      },
      {
        "category": "Productivity",
        "count": 280,
        "percentage": 22.4,
        "growthRate": 12.3
      },
      // ... more categories
    ],
    "trendingCategories": [
      {
        "category": "AI Integration",
        "growthRate": 45.2,
        "newPlugins": 28,
        "qualityScore": 82.1,
        "trend": "rising"
      },
      {
        "category": "Testing Tools",
        "growthRate": 32.8,
        "newPlugins": 15,
        "qualityScore": 76.4,
        "trend": "rising"
      }
    ],
    "underrepresentedCategories": [
      {
        "category": "Documentation",
        "currentPercentage": 2.1,
        "marketOpportunity": "high"
      }
    ]
  }
}
```

---

## ⚡ Performance Features

### Caching

**Cache Headers:**
- `Cache-Control`: `s-maxage=21600, stale-while-revalidate=3600`
- Data cached for 6 hours with 1-hour stale refresh

**Cache Status:**
- `hit`: Data served from cache
- `miss`: Data freshly generated
- `stale`: Stale data served, refresh in progress

### Response Time Targets

| Metric | Target | Current Average |
|--------|---------|----------------|
| API Response Time | <200ms | 145ms |
| Cache Hit Response | <50ms | 32ms |
| Data Freshness | <6 hours | 4.2 hours |

### Rate Limiting

**Limits:**
- **Standard**: 100 requests per minute
- **Authenticated**: 500 requests per minute
- **Burst**: 200 requests per minute for 5 minutes

**Headers:**
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1698300000
```

---

## 🛡️ Security Features

### Authentication

**API Key Authentication (Optional):**
```bash
curl -H "Authorization: Bearer YOUR_API_KEY" \
     "https://example.com/api/ecosystem-stats?overview"
```

### Request Validation

**Input Sanitization:**
- All parameters validated and sanitized
- SQL injection protection
- XSS prevention
- Request size limits

### HTTPS Enforcement

- All production endpoints require HTTPS
- HTTP requests automatically redirected to HTTPS
- HSTS headers enforced

---

## 🚨 Error Handling

### HTTP Status Codes

| Status | Description | Resolution |
|--------|-------------|------------|
| 200 | Success | Response contains requested data |
| 400 | Bad Request | Invalid parameters or malformed request |
| 401 | Unauthorized | Invalid or missing authentication |
| 429 | Rate Limited | Too many requests, wait before retrying |
| 500 | Server Error | Internal server error, try again later |

### Error Codes

| Code | Description | Action |
|------|-------------|--------|
| `INVALID_PARAMETERS` | Invalid query parameters | Check request syntax |
| `DATA_NOT_AVAILABLE` | Requested data not available | Try different time range |
| `RATE_LIMIT_EXCEEDED` | Rate limit exceeded | Wait before retrying |
| `INTERNAL_SERVER_ERROR` | Server error | Contact support if persistent |
| `SERVICE_UNAVAILABLE` | Service temporarily down | Check status page or retry later |

### Error Response Examples

**Bad Request:**
```json
{
  "success": false,
  "error": {
    "code": "INVALID_PARAMETERS",
    "message": "Invalid timeRange parameter. Must be one of: 7d, 30d, 90d, 1y",
    "details": {
      "parameter": "timeRange",
      "received": "invalid_value",
      "validOptions": ["7d", "30d", "90d", "1y"]
    }
  }
}
```

**Rate Limited:**
```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Rate limit exceeded. Try again in 60 seconds.",
    "details": {
      "limit": 100,
      "window": 60,
      "retryAfter": 60
    }
  }
}
```

---

## 🔧 Usage Examples

### JavaScript/Fetch API

```javascript
// Basic overview request
const response = await fetch('/api/ecosystem-stats?overview');
const data = await response.json();

if (data.success) {
  console.log('Total plugins:', data.data.totalPlugins);
  console.log('Growth rate:', data.data.growthRate.plugins);
}

// Growth trends with custom date range
const growthResponse = await fetch(
  '/api/ecosystem-stats?growth&start_date=2025-09-01&end_date=2025-09-30'
);

// Quality indicators
const qualityResponse = await fetch('/api/ecosystem-stats?quality');
```

### Python/Requests

```python
import requests
import json

# Get overview metrics
response = requests.get(
  'https://example.com/api/ecosystem-stats?overview',
  headers={'Accept': 'application/json'}
)

if response.status_code == 200:
    data = response.json()
    print(f"Total plugins: {data['data']['totalPlugins']}")
    print(f"Growth rate: {data['data']['growthRate']['plugins']}%")

# Get growth trends
growth_response = requests.get(
    'https://example.com/api/ecosystem-stats?growth',
    params={'timeRange': '90d'}
)
```

### cURL Examples

```bash
# Overview metrics
curl -X GET "https://example.com/api/ecosystem-stats?overview" \
     -H "Accept: application/json"

# Growth trends with specific range
curl -X GET "https://example.com/api/ecosystem-stats?growth&timeRange=90d" \
     -H "Accept: application/json"

# With authentication
curl -X GET "https://example.com/api/ecosystem-stats?quality" \
     -H "Authorization: Bearer YOUR_API_KEY" \
     -H "Accept: application/json"
```

---

## 📊 SDKs and Libraries

### JavaScript SDK (Planned)

```javascript
import { EcosystemStatsAPI } from '@claude-marketplace/ecosystem-stats-sdk';

const api = new EcosystemStatsAPI({
  baseURL: 'https://example.com/api',
  apiKey: 'your-api-key'
});

// Get overview
const overview = await api.getOverview();

// Get growth trends
const growth = await api.getGrowthTrends({ timeRange: '30d' });

// Get quality metrics
const quality = await api.getQualityIndicators();
```

### React Components

```jsx
import { EcosystemStatsProvider, useEcosystemStats } from '@claude-marketplace/ecosystem-stats-react';

function App() {
  return (
    <EcosystemStatsProvider apiKey="your-api-key">
      <Dashboard />
    </EcosystemStatsProvider>
  );
}

function Dashboard() {
  const { overview, growth, quality, loading, error } = useEcosystemStats();

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      <h1>Total Plugins: {overview.totalPlugins}</h1>
      <GrowthChart data={growth.dataPoints} />
      <QualityMetrics {...quality} />
    </div>
  );
}
```

---

## 🔄 Versioning

### API Versioning Strategy

- **URL Versioning**: `/api/v1/ecosystem-stats` for future versions
- **Header Versioning**: `Accept: application/vnd.ecosystem-stats.v1+json`
- **Backward Compatibility**: Maintain compatibility with existing clients
- **Deprecation Policy**: 6-month deprecation notice for breaking changes

### Current Version

- **Version**: 1.0
- **Status**: Stable
- **Release Date**: 2025-10-26
- **Next Minor Release**: Q1 2026
- **Breaking Changes**: None planned

---

## 📞 Support and Contact

### Documentation

- [API Reference](https://docs.example.com/api)
- [SDK Documentation](https://docs.example.com/sdk)
- [Examples](https://github.com/example/ecosystem-stats-examples)
- [Status Page](https://status.example.com)

### Support Channels

- **API Issues**: [GitHub Issues](https://github.com/shrwnsan/claude-marketplace-registry/issues)
- **Security Issues**: [GitHub Issues](https://github.com/shrwnsan/claude-marketplace-registry/issues) (use `security` label)
- **General Support**: [GitHub Issues](https://github.com/shrwnsan/claude-marketplace-registry/issues)
- **Developer Community**: [GitHub Discussions](https://github.com/shrwnsan/claude-marketplace-registry/discussions)

### Monitoring

- **Uptime Status**: https://status.example.com
- **Performance Metrics**: https://metrics.example.com
- **API Analytics**: Available to authenticated users

---

**Last Updated:** October 26, 2025
**Next Review:** January 2026

For the most current API documentation and updates, visit our [developer portal](https://developers.example.com).