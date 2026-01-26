# Developer API Documentation

## Overview

The Claude Marketplace Aggregator provides a comprehensive REST API for accessing marketplace data, system status, and analytics. This documentation covers all available endpoints, request/response formats, authentication, and integration examples.

## Table of Contents

1. [Base URL and Authentication](#base-url-and-authentication)
2. [Rate Limiting](#rate-limiting)
3. [Response Format](#response-format)
4. [Endpoints](#endpoints)
5. [Error Handling](#error-handling)
6. [SDK and Libraries](#sdk-and-libraries)
7. [Webhooks](#webhooks)
8. [Examples](#examples)

---

## Base URL and Authentication

### Base URL
```
https://claude-marketplace.github.io/aggregator
```

### Authentication
Most endpoints are public and do not require authentication. For rate-limited endpoints, standard HTTP headers are used.

#### Headers
```http
Content-Type: application/json
User-Agent: YourApp/1.0
Authorization: Bearer <token> (if required)
```

---

## Rate Limiting

### Rate Limits by Endpoint

| Endpoint | Limit | Window | Authentication |
|----------|-------|--------|-----------------|
| `/api/health` | 100/minute | IP | No |
| `/api/status` | 100/minute | IP | No |
| `/api/metrics` | 100/minute | IP | No |
| `/api/analytics` | 60/minute | IP | No |
| `/data/*` | No limit | - | No |

### Rate Limit Headers
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
```

### Handling Rate Limits
```typescript
async function makeRequest(url: string): Promise<Response> {
  const response = await fetch(url);

  if (response.status === 429) {
    const resetTime = parseInt(response.headers.get('X-RateLimit-Reset') || '0');
    const waitTime = resetTime * 1000 - Date.now();

    if (waitTime > 0) {
      await new Promise(resolve => setTimeout(resolve, waitTime));
      return makeRequest(url);
    }
  }

  return response;
}
```

---

## Response Format

### Success Response
```json
{
  "success": true,
  "data": {
    // Response data
  },
  "timestamp": "2024-01-01T00:00:00Z"
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request parameters",
    "details": {
      "field": "category",
      "value": "invalid-category"
    }
  },
  "timestamp": "2024-01-01T00:00:00Z"
}
```

### HTTP Status Codes
- `200 OK` - Successful request
- `400 Bad Request` - Invalid parameters
- `401 Unauthorized` - Authentication required
- `403 Forbidden` - Access denied
- `404 Not Found` - Resource not found
- `429 Too Many Requests` - Rate limit exceeded
- `500 Internal Server Error` - Server error
- `503 Service Unavailable` - System maintenance

---

## Endpoints

### Health Check

#### GET /api/health

Returns basic system health status.

**Request**: No parameters required

**Response**:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00Z",
  "uptime": 86400,
  "version": "1.0.0",
  "checks": {
    "dataFiles": true,
    "githubApi": true,
    "buildStatus": true,
    "memoryUsage": true
  },
  "details": {
    "dataFreshness": "2 hours ago",
    "lastScan": "2024-01-01T02:00:00Z",
    "memoryUsage": {
      "heapUsed": 45678912,
      "heapTotal": 67108864
    }
  }
}
```

**Response Fields**:
- `status` (string): Overall health status
- `timestamp` (string): Response timestamp
- `uptime` (number): System uptime in seconds
- `version` (string): Current version
- `checks` (object): Individual component status
- `details` (object): Additional system details

### System Status

#### GET /api/status

Provides detailed system diagnostics and component status.

**Request**: No parameters required

**Response**:
```json
{
  "status": "operational",
  "timestamp": "2024-01-01T00:00:00Z",
  "uptime": 86400,
  "version": "1.0.0",
  "environment": "production",
  "systems": {
    "data": {
      "status": "operational",
      "lastUpdate": "2024-01-01T02:00:00Z",
      "totalMarketplaces": 150,
      "totalPlugins": 1200,
      "dataFreshness": "2 hours ago",
      "errors": []
    },
    "github": {
      "status": "operational",
      "rateLimit": {
        "limit": 5000,
        "remaining": 4500,
        "reset": "2024-01-01T03:00:00Z",
        "used": 500
      },
      "lastCheck": "2024-01-01T00:00:00Z",
      "errors": []
    },
    "build": {
      "status": "operational",
      "lastBuild": "2024-01-01T01:30:00Z",
      "buildTime": "2m 15s",
      "errors": []
    },
    "performance": {
      "status": "operational",
      "memory": {
        "used": 45,
        "total": 64,
        "percentage": 70
      },
      "responseTime": 125,
      "errors": []
    }
  },
  "incidents": [],
  "metrics": {
    "requestsToday": 15420,
    "errorsToday": 12,
    "averageResponseTime": 145,
    "uptimePercentage": 99.95
  }
}
```

### Performance Metrics

#### GET /api/metrics

Returns performance metrics in JSON or Prometheus format.

**Query Parameters**:
- `format` (optional): `json` (default) or `prometheus`
- `include` (optional): Include additional metrics (`prometheus`)

**JSON Response**:
```json
{
  "timestamp": "2024-01-01T00:00:00Z",
  "uptime": 86400,
  "version": "1.0.0",
  "performance": {
    "report": {
      "totalMetrics": 156,
      "averageResponseTime": 145,
      "memoryUsage": {
        "heapUsed": 45678912,
        "heapTotal": 67108864
      },
      "errorCount": 0
    },
    "prometheus": "claude_marketplace_api_duration_ms 145"
  },
  "system": {
    "nodeVersion": "v18.17.0",
    "platform": "linux",
    "arch": "x64",
    "memory": {
      "heapUsed": 45678912,
      "heapTotal": 67108864,
      "external": 2097152,
      "rss": 67108864
    }
  }
}
```

**Prometheus Response**:
```prometheus
# HELP claude_marketplace_api_duration_ms API request duration in milliseconds
# TYPE claude_marketplace_api_duration_ms gauge
claude_marketplace_api_duration_ms 145

# HELP claude_marketplace_memory_used_bytes Memory usage in bytes
# TYPE claude_marketplace_memory_used_bytes gauge
claude_marketplace_memory_used_bytes{type="heap_used"} 45678912
claude_marketplace_memory_used_bytes{type="heap_total"} 67108864

# HELP claude_marketplace_process_uptime_seconds Process uptime in seconds
# TYPE claude_marketplace_process_uptime_seconds gauge
claude_marketplace_process_uptime_seconds 86400
```

### Analytics Dashboard

#### GET /api/analytics

Provides comprehensive analytics data about the ecosystem.

**Query Parameters**:
- `period` (optional): `daily`, `weekly`, `monthly` (default: `daily`)
- `limit` (optional): Number of items to return (default: 100)

**Response**:
```json
{
  "overview": {
    "totalMarketplaces": 150,
    "totalPlugins": 1200,
    "totalDownloads": 50000,
    "totalStars": 12500,
    "activeDevelopers": 450,
    "languages": [
      {
        "name": "TypeScript",
        "count": 85,
        "percentage": 57
      },
      {
        "name": "JavaScript",
        "count": 45,
        "percentage": 30
      }
    ],
    "categories": [
      {
        "name": "API",
        "count": 350,
        "percentage": 29
      },
      {
        "name": "Database",
        "count": 280,
        "percentage": 23
      }
    ]
  },
  "trends": {
    "daily": [
      {
        "date": "2024-01-01",
        "marketplaces": 2,
        "plugins": 15,
        "stars": 120,
        "downloads": 500
      }
    ],
    "weekly": [
      {
        "week": "2024-01-01",
        "marketplaces": 12,
        "plugins": 85,
        "stars": 800,
        "downloads": 3500
      }
    ],
    "monthly": [
      {
        "month": "2024-01",
        "marketplaces": 45,
        "plugins": 320,
        "stars": 3500,
        "downloads": 15000
      }
    ]
  },
  "ecosystem": {
    "topMarketplaces": [
      {
        "name": "Awesome Claude Plugins",
        "url": "https://github.com/user/awesome-claude-plugins",
        "stars": 1250,
        "forks": 89,
        "plugins": 45,
        "lastUpdated": "2024-01-01T02:00:00Z"
      }
    ],
    "topPlugins": [
      {
        "name": "Database Connector",
        "repository": "https://github.com/user/db-connector",
        "stars": 450,
        "downloads": 2500,
        "author": "username",
        "lastUpdated": "2024-01-01T01:00:00Z"
      }
    ],
    "activeContributors": [
      {
        "username": "contributor1",
        "contributions": 25,
        "repositories": 3
      }
    ]
  },
  "health": {
    "dataFreshness": "2 hours ago",
    "lastScan": "2024-01-01T02:00:00Z",
    "scanDuration": 125,
    "errorCount": 0,
    "successRate": 100,
    "githubApiStatus": "healthy",
    "rateLimitStatus": {
      "limit": 5000,
      "remaining": 4500,
      "reset": "2024-01-01T03:00:00Z"
    }
  }
}
```

### Data Endpoints

#### GET /data/index.json

Returns summary statistics and metadata.

**Response**:
```json
{
  "stats": {
    "totalMarketplaces": 150,
    "totalPlugins": 1200,
    "totalDownloads": 50000,
    "totalStars": 12500,
    "lastUpdated": "2024-01-01T02:00:00Z"
  },
  "categories": [
    {
      "name": "API",
      "count": 350,
      "description": "API integration and communication plugins"
    }
  ],
  "languages": [
    {
      "name": "TypeScript",
      "count": 85,
      "percentage": 57
    }
  ],
  "metadata": {
    "lastScan": "2024-01-01T02:00:00Z",
    "scanDuration": 125,
    "version": "1.0.0"
  }
}
```

#### GET /data/marketplaces.json

Returns all discovered marketplaces.

**Query Parameters**:
- `category` (optional): Filter by category
- `language` (optional): Filter by programming language
- `sort` (optional): Sort by `stars`, `forks`, `updated` (default: `stars`)
- `order` (optional): `asc` or `desc` (default: `desc`)
- `limit` (optional): Number of results (default: 100)

**Response**:
```json
{
  "marketplaces": [
    {
      "id": "awesome-claude-plugins",
      "name": "Awesome Claude Plugins",
      "description": "A curated list of awesome Claude plugins and resources",
      "url": "https://github.com/user/awesome-claude-plugins",
      "repositoryUrl": "https://github.com/user/awesome-claude-plugins",
      "stars": 1250,
      "forks": 89,
      "language": "TypeScript",
      "updatedAt": "2024-01-01T02:00:00Z",
      "topics": ["claude", "plugins", "ai", "awesome"],
      "hasManifest": true,
      "owner": "username",
      "pluginCount": 45,
      "verified": true,
      "category": "Development",
      "lastCommit": "2024-01-01T01:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 100,
    "total": 150,
    "hasMore": true
  }
}
```

#### GET /data/plugins.json

Returns all discovered plugins.

**Query Parameters**:
- `marketplace` (optional): Filter by marketplace ID
- `category` (optional): Filter by category
- `author` (optional): Filter by author
- `tags` (optional): Filter by tags (comma-separated)
- `sort` (optional): Sort by `stars`, `downloads`, `updated` (default: `stars`)
- `order` (optional): `asc` or `desc` (default: `desc`)
- `limit` (optional): Number of results (default: 100)

**Response**:
```json
{
  "plugins": [
    {
      "id": "database-connector",
      "name": "Database Connector",
      "description": "Connect to various databases from Claude Code",
      "version": "1.2.0",
      "author": "username",
      "repository": "https://github.com/user/db-connector",
      "homepage": "https://github.com/user/db-connector#readme",
      "license": "MIT",
      "keywords": ["database", "sql", "nosql", "connector"],
      "category": "Database",
      "tags": ["postgresql", "mysql", "mongodb"],
      "stars": 450,
      "downloads": 2500,
      "forks": 32,
      "issues": 5,
      "createdAt": "2023-06-01T00:00:00Z",
      "updatedAt": "2024-01-01T01:00:00Z",
      "lastCommit": "2024-01-01T00:45:00Z",
      "isValid": true,
      "marketplaceId": "awesome-claude-plugins",
      "marketplaceName": "Awesome Claude Plugins",
      "verified": true,
      "metadata": {
        "description": "Detailed plugin description",
        "installation": "npm install db-connector",
        "usage": "import { DatabaseConnector } from 'db-connector';",
        "dependencies": ["pg", "mysql2", "mongodb"],
        "claudeVersion": ">=1.0.0"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 100,
    "total": 1200,
    "hasMore": true
  }
}
```

#### GET /data/complete.json

Returns complete dataset with all marketplaces and plugins.

**Response**: Combines both marketplaces and plugins data with full metadata.

---

## Error Handling

### Error Response Format
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {
      "field": "field_name",
      "value": "provided_value",
      "expected": "expected_value"
    },
    "suggestions": [
      "Suggestion 1",
      "Suggestion 2"
    ]
  },
  "timestamp": "2024-01-01T00:00:00Z",
  "requestId": "req_123456789"
}
```

### Error Codes

#### Client Errors (4xx)
- `VALIDATION_ERROR` - Invalid request parameters
- `NOT_FOUND` - Resource not found
- `RATE_LIMIT_EXCEEDED` - Too many requests
- `UNAUTHORIZED` - Authentication required
- `FORBIDDEN` - Access denied
- `METHOD_NOT_ALLOWED` - HTTP method not supported

#### Server Errors (5xx)
- `INTERNAL_ERROR` - Internal server error
- `SERVICE_UNAVAILABLE` - Service temporarily unavailable
- `GATEWAY_TIMEOUT` - External service timeout
- `DATABASE_ERROR` - Database connection error

### Error Handling Examples

#### TypeScript
```typescript
interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, any>;
  };
  timestamp: string;
}

async function handleApiResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error: ApiError = await response.json();
    throw new Error(`${error.error.code}: ${error.error.message}`);
  }

  const result = await response.json();
  if (!result.success) {
    throw new Error(`${result.error.code}: ${result.error.message}`);
  }

  return result.data;
}
```

#### JavaScript
```javascript
async function fetchWithErrorHandling(url) {
  try {
    const response = await fetch(url);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`${error.error.code}: ${error.error.message}`);
    }

    const result = await response.json();
    if (!result.success) {
      throw new Error(`${result.error.code}: ${result.error.message}`);
    }

    return result.data;
  } catch (error) {
    console.error('API Error:', error.message);
    throw error;
  }
}
```

---

## SDK and Libraries

### Official JavaScript/TypeScript SDK

#### Installation
```bash
npm install @claude-marketplace/sdk
# or
yarn add @claude-marketplace/sdk
```

#### Usage
```typescript
import { ClaudeMarketplaceAPI } from '@claude-marketplace/sdk';

const api = new ClaudeMarketplaceAPI({
  baseURL: 'https://claude-marketplace.github.io/aggregator',
  timeout: 10000,
  retries: 3
});

// Get marketplaces
const marketplaces = await api.getMarketplaces({
  category: 'API',
  limit: 10,
  sort: 'stars'
});

// Get plugins
const plugins = await api.getPlugins({
  marketplace: 'awesome-claude-plugins',
  tags: ['database', 'postgresql']
});

// Get system status
const status = await api.getSystemStatus();

// Get analytics
const analytics = await api.getAnalytics({
  period: 'weekly'
});
```

### Python SDK

#### Installation
```bash
pip install claude-marketplace-sdk
```

#### Usage
```python
from claude_marketplace import ClaudeMarketplaceAPI

api = ClaudeMarketplaceAPI(
    base_url="https://claude-marketplace.github.io/aggregator"
)

# Get marketplaces
marketplaces = api.get_marketplaces(
    category="API",
    limit=10,
    sort="stars"
)

# Get plugins
plugins = api.get_plugins(
    marketplace="awesome-claude-plugins",
    tags=["database", "postgresql"]
)

# Get system status
status = api.get_system_status()

# Get analytics
analytics = api.get_analytics(period="weekly")
```

### Go SDK

#### Installation
```bash
go get github.com/claude-marketplace/go-sdk
```

#### Usage
```go
package main

import (
    "fmt"
    "github.com/claude-marketplace/go-sdk"
)

func main() {
    api := claudeMarketplace.NewAPI("https://claude-marketplace.github.io/aggregator")

    // Get marketplaces
    marketplaces, err := api.GetMarketplaces(&claudeMarketplace.GetMarketplacesOptions{
        Category: "API",
        Limit:    10,
        Sort:     "stars",
    })

    // Get plugins
    plugins, err := api.GetPlugins(&claudeMarketplace.GetPluginsOptions{
        Marketplace: "awesome-claude-plugins",
        Tags:        []string{"database", "postgresql"},
    })

    fmt.Printf("Found %d marketplaces and %d plugins\n", len(marketplaces), len(plugins))
}
```

---

## Webhooks

### Webhook Events

The platform supports webhooks for real-time notifications:

#### Available Events
- `marketplace.discovered` - New marketplace discovered
- `marketplace.updated` - Marketplace updated
- `plugin.discovered` - New plugin discovered
- `plugin.updated` - Plugin updated
- `system.status_changed` - System status changed
- `data.refreshed` - Data refreshed

### Webhook Configuration

#### Creating a Webhook
```typescript
const webhookConfig = {
  url: 'https://your-app.com/webhooks/claude-marketplace',
  events: ['marketplace.discovered', 'plugin.discovered'],
  secret: 'your-webhook-secret',
  active: true
};
```

#### Webhook Payload
```json
{
  "event": "marketplace.discovered",
  "data": {
    "marketplace": {
      "id": "new-marketplace",
      "name": "New Marketplace",
      "url": "https://github.com/user/new-marketplace"
    }
  },
  "timestamp": "2024-01-01T00:00:00Z",
  "signature": "sha256=abc123..."
}
```

#### Verifying Webhook Signatures
```typescript
import crypto from 'crypto';

function verifyWebhookSignature(payload: string, signature: string, secret: string): boolean {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');

  return `sha256=${expectedSignature}` === signature;
}
```

---

## Examples

### Basic Usage Examples

#### Fetch All Marketplaces
```typescript
async function getAllMarketplaces() {
  const response = await fetch(
    'https://claude-marketplace.github.io/aggregator/data/marketplaces.json'
  );

  const data = await response.json();
  return data.marketplaces;
}

// Usage
const marketplaces = await getAllMarketplaces();
console.log(`Found ${marketplaces.length} marketplaces`);
```

#### Search Plugins
```typescript
async function searchPlugins(query: string, category?: string) {
  const params = new URLSearchParams({
    search: query,
    limit: '20'
  });

  if (category) {
    params.append('category', category);
  }

  const response = await fetch(
    `https://claude-marketplace.github.io/aggregator/data/plugins.json?${params}`
  );

  const data = await response.json();
  return data.plugins;
}

// Usage
const databasePlugins = await searchPlugins('postgresql', 'Database');
```

#### Get System Health
```typescript
async function getSystemHealth() {
  const response = await fetch(
    'https://claude-marketplace.github.io/aggregator/api/health'
  );

  const health = await response.json();

  if (health.status === 'healthy') {
    console.log('All systems operational');
  } else {
    console.warn('System issues detected');
  }

  return health;
}
```

### Advanced Examples

#### Real-time Monitoring
```typescript
class MarketplaceMonitor {
  private interval: NodeJS.Timeout;

  constructor(private checkInterval: number = 60000) {
    this.start();
  }

  start() {
    this.interval = setInterval(async () => {
      const health = await this.checkHealth();
      const metrics = await this.getMetrics();

      this.processMetrics(health, metrics);
    }, this.checkInterval);
  }

  stop() {
    clearInterval(this.interval);
  }

  private async checkHealth() {
    const response = await fetch('/api/health');
    return response.json();
  }

  private async getMetrics() {
    const response = await fetch('/api/metrics');
    return response.json();
  }

  private processMetrics(health: any, metrics: any) {
    // Process and store metrics
    console.log('Health:', health.status);
    console.log('Response time:', metrics.performance.report.averageResponseTime);
  }
}

// Usage
const monitor = new MarketplaceMonitor(30000); // Check every 30 seconds
```

#### Data Analysis
```typescript
interface PluginStats {
  totalPlugins: number;
  averageStars: number;
  topCategories: Array<{ name: string; count: number }>;
  languageDistribution: Array<{ language: string; count: number }>;
}

async function analyzePluginData(): Promise<PluginStats> {
  const response = await fetch('/data/plugins.json');
  const data = await response.json();
  const plugins = data.plugins;

  // Calculate statistics
  const totalPlugins = plugins.length;
  const averageStars = plugins.reduce((sum: number, p: any) => sum + p.stars, 0) / totalPlugins;

  // Top categories
  const categoryCounts: Record<string, number> = {};
  plugins.forEach((plugin: any) => {
    categoryCounts[plugin.category] = (categoryCounts[plugin.category] || 0) + 1;
  });

  const topCategories = Object.entries(categoryCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // Language distribution
  const languageCounts: Record<string, number> = {};
  plugins.forEach((plugin: any) => {
    if (plugin.language) {
      languageCounts[plugin.language] = (languageCounts[plugin.language] || 0) + 1;
    }
  });

  const languageDistribution = Object.entries(languageCounts)
    .map(([language, count]) => ({ language, count }))
    .sort((a, b) => b.count - a.count);

  return {
    totalPlugins,
    averageStars: Math.round(averageStars),
    topCategories,
    languageDistribution
  };
}

// Usage
const stats = await analyzePluginData();
console.log('Plugin Statistics:', stats);
```

#### Integration with Monitoring Systems
```typescript
async function exportToPrometheus() {
  const response = await fetch('/api/metrics?format=prometheus');
  const metrics = await response.text();

  // Send to Prometheus Pushgateway
  const pushgatewayResponse = await fetch('http://pushgateway:9091/metrics/job/claude-marketplace', {
    method: 'POST',
    headers: {
      'Content-Type': 'text/plain',
    },
    body: metrics
  });

  if (pushgatewayResponse.ok) {
    console.log('Metrics exported to Prometheus');
  } else {
    console.error('Failed to export metrics');
  }
}
```

---

## OpenAPI Specification

### Complete API Schema

The complete OpenAPI 3.0 specification is available at:
```
https://claude-marketplace.github.io/aggregator/api/openapi.json
```

### Interactive Documentation
- **Swagger UI**: `/api/docs` (interactive API documentation)
- **ReDoc**: `/api/redoc` (API documentation)

---

## Changelog

### Version 1.0.0 (2024-01-01)
- Initial API release
- Health check endpoints
- System status monitoring
- Data access endpoints
- Analytics dashboard
- Performance metrics

### Version 1.1.0 (Planned)
- Real-time webhooks
- Advanced filtering
- Export capabilities
- Enhanced analytics

---

## Support

### Getting Help
- **Documentation**: [Complete API Docs](https://claude-marketplace.github.io/aggregator/docs)
- **GitHub Issues**: [Report Issues](https://github.com/claude-marketplace/aggregator/issues)
- **Discussions**: [Community Forum](https://github.com/claude-marketplace/aggregator/discussions)

### Contributing
- **Contributing Guide**: [How to Contribute](../CONTRIBUTING.md)
- **Development Setup**: [Development Guide](../README.md#development-guide)
- **API Design**: [API Design Principles](./API_DESIGN.md)

---

**Last Updated**: October 17, 2024
**API Version**: 1.0.0
**Base URL**: https://claude-marketplace.github.io/aggregator

For questions about the API or to report issues, please visit our GitHub repository or join our community discussions.