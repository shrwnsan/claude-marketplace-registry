# Maintenance Checklists and Troubleshooting Guide

## Overview

This document provides comprehensive maintenance checklists, troubleshooting procedures, and operational guidance for the Claude Marketplace Aggregator. It covers daily, weekly, and monthly maintenance tasks, as well as detailed troubleshooting procedures for common issues.

## Table of Contents

1. [Maintenance Checklists](#maintenance-checklists)
2. [System Monitoring](#system-monitoring)
3. [Troubleshooting Procedures](#troubleshooting-procedures)
4. [Performance Optimization](#performance-optimization)
5. [Emergency Procedures](#emergency-procedures)
6. [Maintenance Scripts](#maintenance-scripts)

---

## Maintenance Checklists

### Daily Checklist

#### System Health Monitoring
**Time**: 09:00 UTC daily
**Duration**: 15-30 minutes

**Checks**:
- [ ] **Website Accessibility**
  ```bash
  curl -I https://claude-marketplace.github.io/aggregator
  # Expected: 200 OK response
  ```

- [ ] **Health Endpoint Status**
  ```bash
  curl https://claude-marketplace.github.io/aggregator/api/health
  # Verify all checks return true
  ```

- [ ] **Data Freshness**
  ```bash
  curl https://claude-marketplace.github.io/aggregator/api/status | jq '.systems.data.dataFreshness'
  # Expected: Less than 6 hours old
  ```

- [ ] **GitHub API Status**
  ```bash
  curl https://claude-marketplace.github.io/aggregator/api/status | jq '.systems.github.status'
  # Expected: "operational"
  ```

- [ ] **Performance Metrics**
  ```bash
  curl https://claude-marketplace.github.io/aggregator/api/metrics | jq '.performance.report.averageResponseTime'
  # Expected: Less than 1000ms
  ```

#### GitHub Actions Status
**Time**: After daily scan completion
**Duration**: 5-10 minutes

**Checks**:
- [ ] **CI Pipeline Status**
  - Visit: https://github.com/claude-marketplace/aggregator/actions
  - Verify: No failed workflows in last 24 hours

- [ ] **Scan Workflow Status**
  - Check: Last scan completed successfully
  - Verify: Data updated within last 6 hours

- [ ] **Deployment Status**
  - Verify: Latest deployment successful
  - Check: Website reflects latest changes

- [ ] **Backup Status**
  - Verify: Last backup completed successfully
  - Check: Backup integrity validated

#### Error Monitoring
**Time**: Continuous monitoring
**Duration**: Ongoing

**Checks**:
- [ ] **Error Rate Review**
  ```bash
  curl https://claude-marketplace.github.io/aggregator/api/status | jq '.metrics.errorsToday'
  # Expected: Less than 10 errors per day
  ```

- [ ] **GitHub Issues Review**
  - Check: New issues created in last 24 hours
  - Prioritize: Critical bugs and security issues

- [ ] **User Feedback Review**
  - Check: GitHub Discussions for user reports
  - Review: Social media mentions and feedback

#### Documentation Updates
**Time**: As needed
**Duration**: 15-30 minutes

**Checks**:
- [ ] **Update Status Page** (if issues detected)
- [ ] **Document Any Changes** (if configuration changes made)
- [ ] **Update Knowledge Base** (with new solutions)

### Weekly Checklist

#### Performance Analysis
**Day**: Every Sunday
**Duration**: 1-2 hours

**Analysis**:
- [ ] **Performance Trends Review**
  ```bash
  # Get weekly performance data
  curl https://claude-marketplace.github.io/aggregator/api/analytics?period=weekly
  ```

- [ ] **Response Time Analysis**
  - Identify: Slowest endpoints
  - Analyze: Performance degradation patterns
  - Plan: Optimization strategies

- [ ] **Error Pattern Analysis**
  - Review: Error types and frequencies
  - Identify: Recurring issues
  - Plan: Preventive measures

- [ ] **User Engagement Metrics**
  - Review: Page views and user interactions
  - Analyze: Popular features and content
  - Plan: UX improvements

#### Security Assessment
**Day**: Every Sunday
**Duration**: 30-60 minutes

**Assessment**:
- [ ] **Dependency Vulnerability Scan**
  ```bash
  npm audit
  # Review: Any high/critical vulnerabilities
  ```

- [ ] **Security Workflow Review**
  - Check: Latest security scan results
  - Review: Any security alerts or notifications

- [ ] **Access Control Review**
  - Verify: Repository access permissions
  - Review: API key and token security

- [ ] **Code Security Review**
  - Review: Recent code changes for security issues
  - Check: Sensitive data exposure

#### Data Quality Assessment
**Day**: Every Sunday
**Duration**: 30-45 minutes

**Assessment**:
- [ ] **Data Validation Results**
  ```bash
  npm run validate:plugins
  # Review: Validation errors and warnings
  ```

- [ ] **Marketplace Quality Review**
  - Sample: Recently added marketplaces
  - Verify: Data accuracy and completeness
  - Check: Broken links or outdated information

- [ ] **Categorization Review**
  - Review: Plugin and marketplace categories
  - Verify: Consistent categorization
  - Update: Category definitions if needed

#### Backup Verification
**Day**: Every Sunday
**Duration**: 15-30 minutes

**Verification**:
- [ ] **Backup Integrity Check**
  ```bash
  npm run backup list
  # Verify: Recent backups created successfully
  ```

- [ ] **Restore Test (Monthly)**
  - Test: Restore from latest backup in staging
  - Verify: Data integrity and functionality

- [ ] **Backup Retention Review**
  - Verify: Retention policies enforced
  - Clean: Old backups if needed

### Monthly Checklist

#### System Maintenance
**Day**: First of each month
**Duration**: 2-4 hours

**Maintenance**:
- [ ] **Dependency Updates**
  ```bash
  npm update
  npm audit fix
  # Test: All functionality after updates
  ```

- [ ] **Node.js Version Review**
  - Check: Latest stable Node.js version
  - Plan: Upgrade if beneficial and compatible

- [ ] **Build Optimization**
  ```bash
  npm run build -- --analyze
  # Review: Bundle sizes and optimization opportunities
  ```

- [ ] **Security Hardening**
  - Review: Security configurations
  - Update: Security policies and rules
  - Implement: Additional security measures

#### Documentation Review
**Day**: First of each month
**Duration**: 1-2 hours

**Review**:
- [ ] **API Documentation Update**
  - Verify: All endpoints documented
  - Update: Examples and response formats
  - Check: Documentation accuracy

- [ ] **User Guide Review**
  - Update: Feature changes and improvements
  - Add: New functionality documentation
  - Review: User feedback and suggestions

- [ ] **Developer Documentation**
  - Update: Setup and development guides
  - Review: Code examples and best practices
  - Add: Troubleshooting solutions

#### Analytics and Reporting
**Day**: First of each month
**Duration**: 1-2 hours

**Reporting**:
- [ ] **Monthly Analytics Report**
  ```bash
  curl https://claude-marketplace.github.io/aggregator/api/analytics?period=monthly
  # Generate: Monthly performance and growth report
  ```

- [ ] **Ecosystem Growth Analysis**
  - Track: New marketplaces and plugins
  - Analyze: Growth trends and patterns
  - Report: Community engagement metrics

- [ ] **Performance Benchmarking**
  - Compare: Current vs. previous month performance
  - Identify: Improvements or degradations
  - Plan: Performance optimization strategies

#### Capacity Planning
**Day**: First of each month
**Duration**: 30-60 minutes

**Planning**:
- [ ] **Resource Usage Review**
  - Analyze: GitHub Actions usage and limits
  - Review: Storage and bandwidth usage
  - Plan: Capacity upgrades if needed

- [ ] **Scalability Assessment**
  - Evaluate: Current system limitations
  - Identify: Bottlenecks and constraints
  - Plan: Scalability improvements

- [ ] **Cost Analysis**
  - Review: Service costs and usage
  - Optimize: Resource allocation
  - Budget: Future expenses

---

## System Monitoring

### Key Metrics to Monitor

#### Performance Metrics
- **Response Time**: API endpoint response times
- **Throughput**: Requests per minute
- **Error Rate**: Percentage of failed requests
- **Memory Usage**: Application memory consumption
- **CPU Usage**: Processor utilization

#### Business Metrics
- **Data Freshness**: Age of marketplace data
- **Discovery Rate**: New marketplaces/plugins found
- **User Engagement**: Page views and interactions
- **Growth Rate**: Ecosystem expansion metrics

#### Infrastructure Metrics
- **GitHub API Rate Limits**: Remaining requests
- **Build Success Rate**: CI/CD success percentage
- **Backup Success Rate**: Backup completion rate
- **Scan Duration**: Data processing time

### Monitoring Setup

#### Automated Monitoring
```yaml
# monitoring.yml configuration
checks:
  - name: website_health
    url: https://claude-marketplace.github.io/aggregator/api/health
    interval: 300  # 5 minutes
    timeout: 30
    expected_status: 200

  - name: data_freshness
    url: https://claude-marketplace.github.io/aggregator/api/status
    interval: 900  # 15 minutes
    check_script: |
      data_age=$(curl -s $URL | jq -r '.systems.data.dataFreshness')
      if [[ $data_age == *"hours"* ]]; then
        hours=$(echo $data_age | cut -d' ' -f1)
        if [ $hours -gt 6 ]; then
          exit 1
        fi
      fi
```

#### Alert Configuration
```yaml
alerts:
  - name: website_down
    condition: website_health.status != 200
    severity: critical
    channels: [slack, email]
    message: "Website is down! Status: {{website_health.status}}"

  - name: data_stale
    condition: data_freshness.age_hours > 6
    severity: warning
    channels: [slack]
    message: "Data is {{data_freshness.age_hours}} hours old"

  - name: high_error_rate
    condition: error_rate > 5%
    severity: warning
    channels: [slack]
    message: "Error rate is {{error_rate}}% in the last hour"
```

### Dashboard Setup

#### Grafana Dashboard Metrics
```json
{
  "dashboard": {
    "title": "Claude Marketplace Aggregator",
    "panels": [
      {
        "title": "Response Time",
        "type": "graph",
        "targets": [
          {
            "expr": "claude_marketplace_api_duration_ms",
            "legendFormat": "Response Time (ms)"
          }
        ]
      },
      {
        "title": "Data Freshness",
        "type": "stat",
        "targets": [
          {
            "expr": "claude_marketplace_data_age_hours",
            "legendFormat": "Data Age (hours)"
          }
        ]
      }
    ]
  }
}
```

---

## Troubleshooting Procedures

### Common Issues and Solutions

#### Issue 1: Website Not Loading

**Symptoms**:
- Website returns 404 or 500 errors
- Pages load slowly or not at all
- GitHub Pages deployment failed

**Troubleshooting Steps**:

1. **Check GitHub Pages Status**
   ```bash
   # Check GitHub Status
   curl https://www.githubstatus.com/api/v2/status.json

   # Check Repository Settings
   # GitHub: Repository > Settings > Pages
   ```

2. **Verify Deployment**
   ```bash
   # Check latest deployment
   gh run list --repo claude-marketplace/aggregator --workflow=deploy.yml

   # Redeploy if needed
   gh workflow run deploy.yml --repo claude-marketplace/aggregator
   ```

3. **Check DNS Configuration**
   ```bash
   # Verify DNS resolution
   nslookup claude-marketplace.github.io
   dig claude-marketplace.github.io
   ```

4. **Check SSL Certificate**
   ```bash
   # Verify SSL certificate
   openssl s_client -connect claude-marketplace.github.io:443
   ```

**Prevention**:
- Monitor GitHub Pages status
- Regular deployment verification
- DNS monitoring

#### Issue 2: Data Not Updating

**Symptoms**:
- Marketplace data is stale
- No new plugins discovered
- Scan workflow failing

**Troubleshooting Steps**:

1. **Check Scan Workflow**
   ```bash
   # Check workflow status
   gh run list --repo claude-marketplace/aggregator --workflow=scan.yml

   # Review workflow logs
   gh run view <run-id> --repo claude-marketplace/aggregator --log
   ```

2. **Verify GitHub API Access**
   ```bash
   # Check rate limits
   curl -H "Authorization: token $GITHUB_TOKEN" \
        https://api.github.com/rate_limit

   # Test API access
   curl -H "Authorization: token $GITHUB_TOKEN" \
        https://api.github.com/search/repositories?q=claude-plugin
   ```

3. **Check Data Validation**
   ```bash
   # Run validation locally
   npm run validate:plugins

   # Check for validation errors
   npm run generate:data
   ```

4. **Manual Scan Trigger**
   ```bash
   # Trigger manual scan
   gh workflow run scan.yml --repo claude-marketplace/aggregator
   ```

**Prevention**:
- Monitor API rate limits
- Regular validation checks
- Automated scan monitoring

#### Issue 3: Performance Degradation

**Symptoms**:
- Slow page load times
- High API response times
- Memory usage warnings

**Troubleshooting Steps**:

1. **Check Performance Metrics**
   ```bash
   # Get current metrics
   curl https://claude-marketplace.github.io/aggregator/api/metrics

   # Check response times
   time curl https://claude-marketplace.github.io/aggregator/api/health
   ```

2. **Analyze Bundle Size**
   ```bash
   # Analyze build output
   npm run build -- --analyze

   # Check for large assets
   du -sh out/**/*.js out/**/*.css
   ```

3. **Monitor Memory Usage**
   ```bash
   # Check system metrics
   curl https://claude-marketplace.github.io/aggregator/api/status | jq '.systems.performance.memory'
   ```

4. **Database/Cache Issues**
   ```bash
   # Clear build cache
   rm -rf .next
   rm -rf node_modules/.cache

   # Rebuild with fresh cache
   npm run build
   ```

**Prevention**:
- Regular performance monitoring
- Bundle size optimization
- Memory usage tracking

#### Issue 4: GitHub API Rate Limiting

**Symptoms**:
- 403 Forbidden errors from GitHub API
- Scan workflow fails with rate limit errors
- Missing data in API responses

**Troubleshooting Steps**:

1. **Check Current Rate Limits**
   ```bash
   curl -H "Authorization: token $GITHUB_TOKEN" \
        https://api.github.com/rate_limit
   ```

2. **Review API Usage Patterns**
   ```bash
   # Check recent API calls in workflow logs
   gh run view <run-id> --repo claude-marketplace/aggregator --log
   ```

3. **Optimize API Usage**
   - Implement caching for API responses
   - Use conditional requests with ETags
   - Reduce unnecessary API calls
   - Implement exponential backoff

4. **Request Rate Limit Increase**
   - Apply for higher rate limits through GitHub
   - Use multiple tokens if applicable
   - Consider GitHub App authentication

**Prevention**:
- Implement rate limit monitoring
- Optimize API usage patterns
- Use efficient search queries

#### Issue 5: Build Failures

**Symptoms**:
- CI/CD pipeline failures
- TypeScript compilation errors
- Linting or test failures

**Troubleshooting Steps**:

1. **Check Build Logs**
   ```bash
   # Get detailed build logs
   gh run view <run-id> --repo claude-marketplace/aggregator --log

   # Focus on error messages
   gh run view <run-id> --repo claude-marketplace/aggregator --log | grep -A 10 -B 5 "error"
   ```

2. **Local Build Testing**
   ```bash
   # Replicate build locally
   npm run ci

   # Check specific issues
   npm run type-check
   npm run lint
   npm run test
   ```

3. **Dependency Issues**
   ```bash
   # Clean and reinstall dependencies
   rm -rf node_modules package-lock.json
   npm install

   # Check for dependency conflicts
   npm ls
   ```

4. **Configuration Issues**
   - Check Next.js configuration
   - Verify environment variables
   - Review TypeScript configuration

**Prevention**:
- Pre-commit hooks
- Comprehensive testing
- Regular dependency updates

### Diagnostic Commands

#### System Health Diagnostics
```bash
#!/bin/bash
# health-check.sh - Comprehensive system health check

echo "=== Claude Marketplace Aggregator Health Check ==="
echo "Timestamp: $(date)"
echo

# Website accessibility
echo "1. Website Accessibility:"
if curl -s -o /dev/null -w "%{http_code}" https://claude-marketplace.github.io/aggregator | grep -q "200"; then
    echo "   ✅ Website accessible"
else
    echo "   ❌ Website not accessible"
fi

# Health endpoint
echo "2. Health Endpoint:"
health_status=$(curl -s https://claude-marketplace.github.io/aggregator/api/health | jq -r '.status')
if [ "$health_status" = "healthy" ]; then
    echo "   ✅ Health check passed"
else
    echo "   ❌ Health check failed: $health_status"
fi

# Data freshness
echo "3. Data Freshness:"
data_freshness=$(curl -s https://claude-marketplace.github.io/aggregator/api/status | jq -r '.systems.data.dataFreshness')
echo "   📊 Data age: $data_freshness"

# GitHub API status
echo "4. GitHub API Status:"
github_status=$(curl -s https://claude-marketplace.github.io/aggregator/api/status | jq -r '.systems.github.status')
if [ "$github_status" = "operational" ]; then
    echo "   ✅ GitHub API operational"
else
    echo "   ❌ GitHub API issue: $github_status"
fi

# Response time
echo "5. Response Time:"
response_time=$(curl -s -o /dev/null -w "%{time_total}" https://claude-marketplace.github.io/aggregator/api/health)
echo "   ⏱️ Response time: ${response_time}s"

echo
echo "=== Health Check Complete ==="
```

#### Performance Diagnostics
```bash
#!/bin/bash
# performance-check.sh - Performance diagnostic tool

echo "=== Performance Diagnostics ==="
echo "Timestamp: $(date)"
echo

# API endpoint response times
echo "1. API Response Times:"
endpoints=(
    "/api/health"
    "/api/status"
    "/api/metrics"
    "/api/analytics"
    "/data/index.json"
)

for endpoint in "${endpoints[@]}"; do
    response_time=$(curl -s -o /dev/null -w "%{time_total}" "https://claude-marketplace.github.io/aggregator$endpoint")
    printf "   %-20s: %s seconds\n" "$endpoint" "$response_time"
done

# Page load times
echo "2. Page Load Times:"
pages=(
    "/"
    "/docs"
    "/admin"
)

for page in "${pages[@]}"; do
    load_time=$(curl -s -o /dev/null -w "%{time_total}" "https://claude-marketplace.github.io/aggregator$page")
    printf "   %-20s: %s seconds\n" "$page" "$load_time"
done

# Bundle sizes
echo "3. Bundle Sizes:"
if [ -d "out" ]; then
    find out -name "*.js" -exec du -h {} \; | sort -hr | head -5
    find out -name "*.css" -exec du -h {} \; | sort -hr | head -5
fi

echo
echo "=== Performance Diagnostics Complete ==="
```

---

## Performance Optimization

### Optimization Strategies

#### Frontend Optimization
```typescript
// Performance monitoring setup
import performanceMonitor from '../utils/performance-monitor';

// Monitor page load performance
performanceMonitor.recordMetric('page_load_time', loadTime, 'ms', {
  page: window.location.pathname
});

// Monitor API calls
const apiCall = async (endpoint: string) => {
  const startTime = performance.now();

  try {
    const response = await fetch(endpoint);
    const duration = performance.now() - startTime;

    performanceMonitor.recordApiCall(endpoint, 'GET', duration, response.status);
    return response;
  } catch (error) {
    const duration = performance.now() - startTime;
    performanceMonitor.recordApiCall(endpoint, 'GET', duration, 0);
    throw error;
  }
};
```

#### Bundle Optimization
```javascript
// next.config.js optimizations
module.exports = {
  experimental: {
    optimizePackageImports: ['lucide-react', 'date-fns']
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production'
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback.fs = false;
    }

    // Bundle analyzer
    if (process.env.ANALYZE === 'true') {
      const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
      config.plugins.push(
        new BundleAnalyzerPlugin({
          analyzerMode: 'static',
          openAnalyzer: false
        })
      );
    }

    return config;
  }
};
```

#### Caching Strategy
```typescript
// Cache configuration
const cacheConfig = {
  // Static assets - long cache
  'static/*': {
    maxAge: 365 * 24 * 60 * 60, // 1 year
    immutable: true
  },

  // API responses - short cache
  'api/*': {
    maxAge: 5 * 60, // 5 minutes
    staleWhileRevalidate: 60 * 60 // 1 hour
  },

  // Data files - medium cache
  'data/*': {
    maxAge: 15 * 60, // 15 minutes
    staleWhileRevalidate: 2 * 60 * 60 // 2 hours
  }
};
```

### Monitoring Performance

#### Core Web Vitals
```typescript
// Core Web Vitals monitoring
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

function sendToAnalytics(metric: any) {
  // Send to analytics service
  performanceMonitor.recordMetric(`cwv_${metric.name}`, metric.value, metric.unit || 'ms', {
    id: metric.id,
    rating: metric.rating
  });
}

getCLS(sendToAnalytics);
getFID(sendToAnalytics);
getFCP(sendToAnalytics);
getLCP(sendToAnalytics);
getTTFB(sendToAnalytics);
```

#### Performance Budgets
```json
{
  "budgets": [
    {
      "resourceType": "script",
      "budget": 300000
    },
    {
      "resourceType": "total",
      "budget": 1000000
    },
    {
      "resourceType": "image",
      "budget": 500000
    }
  ]
}
```

---

## Emergency Procedures

### Incident Response

#### Severity Classification
- **Critical**: System completely down, data loss
- **High**: Major functionality impaired, security breach
- **Medium**: Partial functionality affected, performance degraded
- **Low**: Minor issues, cosmetic problems

#### Response Timeline
- **0-5 minutes**: Initial assessment and alert
- **5-15 minutes**: Incident mobilization
- **15-60 minutes**: Investigation and diagnosis
- **1-4 hours**: Resolution implementation
- **4-24 hours**: Recovery verification
- **24+ hours**: Post-incident review

#### Communication Protocol
```markdown
## Incident Communication Template

**INCIDENT ALERT**
- **Severity**: [Critical/High/Medium/Low]
- **Service**: Claude Marketplace Aggregator
- **Status**: [Investigating/Identified/Monitoring/Resolved]
- **Started**: [Timestamp]
- **Impact**: [Description of user impact]

**UPDATES**
- [HH:MM] [Status update]
- [HH:MM] [Status update]

**RESOLUTION**
- **Resolved**: [Timestamp]
- **Root Cause**: [Brief description]
- **Prevention**: [Preventive measures]
```

### Emergency Contacts

#### Primary Response Team
- **Incident Commander**: [Name, Email, Phone]
- **Technical Lead**: [Name, Email, Phone]
- **Communications Lead**: [Name, Email, Phone]

#### Escalation Contacts
- **GitHub Support**: support@github.com
- **Hosting Provider**: [Provider support]
- **Security Team**: [Security contact]

### Emergency Scripts

#### Emergency Recovery
```bash
#!/bin/bash
# emergency-recovery.sh - Emergency system recovery

echo "🚨 EMERGENCY RECOVERY PROCEDURE"
echo "Timestamp: $(date)"
echo

# Create emergency backup
echo "1. Creating emergency backup..."
npm run backup backup
echo "   ✅ Emergency backup created"

# Restore from latest known good backup
echo "2. Restoring from backup..."
latest_backup=$(npm run backup list | grep "backup-" | head -1 | awk '{print $1}')
npm run backup restore $latest_backup
echo "   ✅ Restored from backup: $latest_backup"

# Validate system
echo "3. Validating system..."
npm run validate:plugins
npm run build
echo "   ✅ System validation complete"

# Deploy emergency fix
echo "4. Deploying emergency fix..."
git add .
git commit -m "emergency: restore system from backup"
git push origin main
echo "   ✅ Emergency fix deployed"

echo
echo "🚨 EMERGENCY RECOVERY COMPLETE"
echo "Monitor system closely for the next 24 hours"
```

#### Service Restart
```bash
#!/bin/bash
# service-restart.sh - Service restart procedure

echo "🔄 SERVICE RESTART PROCEDURE"
echo "Timestamp: $(date)"
echo

# Stop services
echo "1. Stopping services..."
# Stop any background processes
pkill -f "next-server" || true
echo "   ✅ Services stopped"

# Clear caches
echo "2. Clearing caches..."
rm -rf .next
rm -rf node_modules/.cache
echo "   ✅ Caches cleared"

# Rebuild application
echo "3. Rebuilding application..."
npm run build
echo "   ✅ Application rebuilt"

# Start services
echo "4. Starting services..."
npm start &
echo "   ✅ Services started"

# Verify health
echo "5. Verifying health..."
sleep 10
health_status=$(curl -s http://localhost:3000/api/health | jq -r '.status')
if [ "$health_status" = "healthy" ]; then
    echo "   ✅ Service health verified"
else
    echo "   ❌ Service health check failed"
    exit 1
fi

echo
echo "🔄 SERVICE RESTART COMPLETE"
```

---

## Maintenance Scripts

### Automated Maintenance Script
```bash
#!/bin/bash
# maintenance.sh - Automated maintenance script

set -e  # Exit on any error

LOG_FILE="/var/log/claude-marketplace-maintenance.log"
ALERT_EMAIL="admin@claude-marketplace.com"

# Logging function
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Alert function
alert() {
    echo "$1" | mail -s "Claude Marketplace Alert" "$ALERT_EMAIL"
    log "ALERT: $1"
}

# Health check function
health_check() {
    log "Starting health check..."

    # Check website accessibility
    if ! curl -f -s https://claude-marketplace.github.io/aggregator > /dev/null; then
        alert "Website is not accessible!"
        return 1
    fi

    # Check API health
    health_status=$(curl -s https://claude-marketplace.github.io/aggregator/api/health | jq -r '.status')
    if [ "$health_status" != "healthy" ]; then
        alert "API health check failed: $health_status"
        return 1
    fi

    # Check data freshness
    data_age=$(curl -s https://claude-marketplace.github.io/aggregator/api/status | jq -r '.systems.data.dataFreshness')
    if [[ $data_age == *"hours"* ]]; then
        hours=$(echo $data_age | cut -d' ' -f1)
        if [ "$hours" -gt 6 ]; then
            alert "Data is stale: $data_age"
            return 1
        fi
    fi

    log "Health check passed"
    return 0
}

# Backup function
create_backup() {
    log "Creating backup..."

    if npm run backup backup; then
        log "Backup created successfully"
    else
        alert "Backup creation failed!"
        return 1
    fi
}

# Cleanup function
cleanup() {
    log "Starting cleanup..."

    # Clean old logs
    find /var/log -name "claude-marketplace-*.log" -mtime +30 -delete

    # Clean build artifacts
    rm -rf .next/cache

    # Clean npm cache
    npm cache clean --force

    log "Cleanup completed"
}

# Main maintenance routine
main() {
    log "Starting maintenance routine..."

    # Health check
    if ! health_check; then
        log "Health check failed, aborting maintenance"
        exit 1
    fi

    # Create backup
    create_backup

    # Cleanup
    cleanup

    # Performance check
    response_time=$(curl -s -o /dev/null -w "%{time_total}" https://claude-marketplace.github.io/aggregator/api/health)
    log "API response time: ${response_time}s"

    if (( $(echo "$response_time > 2.0" | bc -l) )); then
        alert "Slow response time detected: ${response_time}s"
    fi

    log "Maintenance routine completed successfully"
}

# Execute main function
main "$@"
```

### Monitoring Script
```bash
#!/bin/bash
# monitor.sh - System monitoring script

METRICS_FILE="/var/www/claude-marketplace/metrics.json"
THRESHOLDS_FILE="/etc/claude-marketplace/thresholds.json"

# Load thresholds
if [ -f "$THRESHOLDS_FILE" ]; then
    thresholds=$(cat "$THRESHOLDS_FILE")
else
    thresholds='{
        "response_time": 2.0,
        "error_rate": 5.0,
        "memory_usage": 80.0,
        "data_age_hours": 6.0
    }'
fi

# Get current metrics
get_metrics() {
    local metrics=$(curl -s https://claude-marketplace.github.io/aggregator/api/metrics)

    # Add system metrics
    local response_time=$(curl -s -o /dev/null -w "%{time_total}" https://claude-marketplace.github.io/aggregator/api/health)

    echo "$metrics" | jq ". + {
        response_time: $response_time,
        timestamp: \"$(date -Iseconds)\"
    }"
}

# Check thresholds
check_thresholds() {
    local metrics="$1"

    # Check response time
    local response_time=$(echo "$metrics" | jq -r '.performance.report.averageResponseTime // 0')
    local threshold_rt=$(echo "$thresholds" | jq -r '.response_time')

    if (( $(echo "$response_time > $threshold_rt" | bc -l) )); then
        echo "ALERT: High response time: ${response_time}s (threshold: ${threshold_rt}s)"
    fi

    # Check memory usage
    local memory_usage=$(echo "$metrics" | jq -r '.system.memory.percentage // 0')
    local threshold_mem=$(echo "$thresholds" | jq -r '.memory_usage')

    if (( $(echo "$memory_usage > $threshold_mem" | bc -l) )); then
        echo "ALERT: High memory usage: ${memory_usage}% (threshold: ${threshold_mem}%)"
    fi

    # Check data age
    local data_status=$(curl -s https://claude-marketplace.github.io/aggregator/api/status)
    local data_freshness=$(echo "$data_status" | jq -r '.systems.data.dataFreshness // "0 hours"')

    if [[ $data_freshness =~ ([0-9]+)\ hours? ]]; then
        local data_age=${BASH_REMATCH[1]}
        local threshold_age=$(echo "$thresholds" | jq -r '.data_age_hours')

        if [ "$data_age" -gt "$threshold_age" ]; then
            echo "ALERT: Stale data: ${data_age} hours old (threshold: ${threshold_age} hours)"
        fi
    fi
}

# Main monitoring loop
main() {
    while true; do
        local metrics=$(get_metrics)

        # Store metrics
        echo "$metrics" > "$METRICS_FILE"

        # Check thresholds
        local alerts=$(check_thresholds "$metrics")

        if [ -n "$alerts" ]; then
            echo "$alerts" | logger -t claude-marketplace-monitor
            echo "$alerts" | mail -s "Claude Marketplace Alert" admin@claude-marketplace.com
        fi

        # Wait before next check
        sleep 300  # 5 minutes
    done
}

# Start monitoring
main
```

---

**Last Updated**: October 17, 2024
**Version**: 1.0.0
**Maintained By**: Infrastructure Team

For questions about maintenance procedures or to report issues, please create an issue in the GitHub repository or contact the infrastructure team.