# Deployment Runbook
## Claude Marketplace Registry - Ecosystem Statistics

**Version:** 1.0
**Last Updated:** 2025-10-26
**Owner:** Development Team

---

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [Build Process](#build-process)
4. [Deployment Checklist](#deployment-checklist)
5. [Rollback Procedures](#rollback-procedures)
6. [Health Checks](#health-checks)
7. [Troubleshooting](#troubleshooting)
8. [Post-Deployment](#post-deployment)

---

## 🔧 Prerequisites

### Required Tools
- Node.js 18.0.0 or higher
- npm 8.0.0 or higher
- Git
- Docker (optional, for containerized deployments)

### Required Access
- Repository write access
- Deployment platform access (Vercel, Netlify, or self-hosted server)
- Environment variable configuration access

### Pre-Deployment Checklist
- [ ] All tests passing (`npm run maintenance:check`)
- [ ] Build successful locally (`npm run build:production`)
- [ ] Security audit passed (`npm run security:check`)
- [ ] Environment variables configured
- [ ] Backup current deployment if applicable

---

## 🌍 Environment Setup

### Development Environment
```bash
# Clone repository
git clone https://github.com/shrwnsan/claude-marketplace-registry.git
cd claude-marketplace-registry

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local

# Start development server
npm run dev
```

### Required Environment Variables

#### Core Application
```bash
NODE_ENV=production
NEXT_PUBLIC_SITE_URL=https://your-domain.com
NEXT_PUBLIC_GITHUB_REPO=claude-marketplace/aggregator
```

#### API Configuration
```bash
NEXT_PUBLIC_ECOSYSTEM_API_URL=/api/ecosystem-stats
NEXT_PUBLIC_ECOSYSTEM_CACHE_TTL=21600000  # 6 hours in milliseconds
```

#### Monitoring & Analytics (Optional)
```bash
NEXT_PUBLIC_SENTRY_DSN=https://your-sentry-dsn
NEXT_PUBLIC_ANALYTICS_ID=GA4-XXXXXXXXX
NEXT_PUBLIC_ANALYTICS_ENDPOINT=https://your-analytics-endpoint.com/api/events
NEXT_PUBLIC_ERROR_REPORTING_ENDPOINT=https://your-error-endpoint.com/api/errors
```

#### Build Configuration
```bash
NEXT_PUBLIC_APP_VERSION=1.0.0
NEXT_PUBLIC_BUILD_TIME=2025-10-26T10:30:00Z
```

### Platform-Specific Configuration

#### Vercel
```bash
# vercel.json
{
  "buildCommand": "npm run build:production",
  "outputDirectory": ".next",
  "functionsDirectory": "api",
  "env": {
    "NODE_ENV": "production"
  }
}
```

#### Netlify
```bash
# netlify.toml
[build]
  command = "npm run build:production"
  publish = ".next"

[build.environment]
  NODE_ENV = "production"
```

#### Docker
```dockerfile
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build:production

EXPOSE 3000
CMD ["npm", "start"]
```

---

## 🏗️ Build Process

### Production Build Script
Use the optimized production build script:

```bash
npm run build:production
```

### Build Steps
1. **Environment Validation** - Checks required environment variables
2. **Dependency Check** - Verifies all dependencies are installed
3. **Pre-Build Checks** - Runs linting and TypeScript compilation
4. **Data Generation** - Generates ecosystem data via `npm run scan:full`
5. **Production Build** - Optimized Next.js build with code splitting
6. **Build Validation** - Verifies build output and size
7. **Report Generation** - Creates build report for monitoring

### Build Outputs
- `.next/` - Next.js build output
- `public/` - Static assets
- `.next/build-report.json` - Build analysis report
- Bundle analysis (if `ANALYZE=true`)

### Build Validation
```bash
# Check build was successful
ls -la .next/

# Review build report
cat .next/build-report.json

# Analyze bundle size (optional)
ANALYZE=true npm run build:production
```

---

## ✅ Deployment Checklist

### Pre-Deployment
- [ ] Code merged to main branch
- [ ] All tests passing
- [ ] Security audit completed
- [ ] Build successful locally
- [ ] Environment variables configured
- [ ] Backup current deployment
- [ ] Performance budget met (<3s load time)

### Deployment Steps

#### Automated Deployment (Vercel/Netlify)
1. **Trigger Deployment**
   ```bash
   git push origin main  # Triggers automatic deployment
   ```

2. **Monitor Build**
   - Check build logs in platform dashboard
   - Verify no build errors or warnings

3. **Verify Deployment**
   - Wait for deployment to complete
   - Test live site functionality

#### Manual Deployment
1. **Build Application**
   ```bash
   npm run build:production
   ```

2. **Deploy to Platform**

   **Vercel CLI:**
   ```bash
   vercel --prod
   ```

   **Netlify CLI:**
   ```bash
   netlify deploy --prod --dir=.next
   ```

   **Docker:**
   ```bash
   docker build -t claude-marketplace-registry .
   docker run -p 3000:3000 claude-marketplace-registry
   ```

3. **Configure Environment Variables**
   - Set all required environment variables in deployment platform
   - Verify configuration in deployed environment

### Post-Deployment Verification
- [ ] Site loads correctly
- [ ] All pages accessible
- [ ] API endpoints responding
- [ ] Ecosystem statistics loading
- [ ] Performance metrics acceptable
- [ ] No console errors
- [ ] Mobile responsive working
- [ ] Accessibility features functional

---

## 🔄 Rollback Procedures

### Quick Rollback (Git)
```bash
# Rollback to previous commit
git log --oneline -10  # Find previous commit hash
git checkout <previous-commit-hash>

# Deploy rollback
vercel --prod  # or platform-specific command
```

### Platform-Specific Rollbacks

#### Vercel
1. Go to Vercel dashboard
2. Select your project
3. Click "Deployments"
4. Find previous successful deployment
5. Click "..." menu and select "Promote to Production"

#### Netlify
1. Go to Netlify dashboard
2. Select your site
3. Click "Deploys"
4. Find previous successful deploy
5. Click "Publish deploy"

#### Docker
```bash
# Tag previous working image
docker tag claude-marketplace-registry:latest claude-marketplace-registry:previous

# Deploy previous version
docker run -p 3000:3000 claude-marketplace-registry:previous
```

### Emergency Rollback
1. **Immediate Actions**
   - Stop deployment if in progress
   - Route traffic to previous version
   - Communicate status to team

2. **Investigation**
   - Check deployment logs
   - Review recent code changes
   - Monitor error rates

3. **Recovery**
   - Apply hotfix if needed
   - Re-deploy after verification
   - Monitor closely post-recovery

---

## 🏥 Health Checks

### Automated Health Monitoring
The application includes comprehensive health monitoring:

```javascript
// Health check endpoints
GET /api/health          // Basic health check
GET /api/health/detailed // Detailed system status
```

### Manual Health Checks
```bash
# Check basic health
curl -f https://your-domain.com/api/health

# Check detailed status
curl https://your-domain.com/api/health/detailed

# Monitor response times
curl -w "@curl-format.txt" https://your-domain.com/api/ecosystem-stats?overview
```

### Health Check Metrics
- **API Connectivity**: Can the API reach required services?
- **Response Times**: Are response times under 2 seconds?
- **Error Rates**: Is error rate below 5%?
- **Data Freshness**: Is data less than 6 hours old?
- **Memory Usage**: Is memory usage under 90%?
- **Bundle Size**: Is bundle size under 50MB?

### Alerting Thresholds
- Response time > 2 seconds
- Error rate > 5%
- Data age > 6 hours
- Memory usage > 90%
- Any health check failure

---

## 🐛 Troubleshooting

### Common Issues

#### Build Failures
```bash
# Clear build cache
npm run maintenance:cleanup

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Check Node.js version
node --version  # Should be 18+
```

#### Performance Issues
```bash
# Analyze bundle size
ANALYZE=true npm run build:production

# Check memory usage
npm run performance:test

# Profile in browser
# 1. Open Chrome DevTools
# 2. Go to Performance tab
# 3. Record and analyze
```

#### API Issues
```bash
# Check API endpoints
curl -v https://your-domain.com/api/ecosystem-stats?overview

# Test data freshness
curl https://your-domain.com/api/ecosystem-stats?overview | jq '.meta.timestamp'

# Monitor error rates
tail -f logs/error.log
```

#### Environment Variable Issues
```bash
# Check current variables
printenv | grep NEXT_PUBLIC

# Test local configuration
npm run dev -- --inspect
```

### Debug Mode
Enable debug logging:
```bash
# Set debug environment variable
NEXT_PUBLIC_DEBUG=true npm run dev

# Or in browser console
localStorage.setItem('debug', 'true');
```

### Performance Debugging
```javascript
// In browser console
// Check performance metrics
performanceMonitor.getAllMetrics();

// Check error tracking
errorTracker.getAllErrors();

// Check health status
healthChecker.getHealthStatus();
```

---

## 📊 Post-Deployment

### Monitoring Setup
1. **Performance Monitoring**
   - Enable Google Analytics
   - Configure Sentry for error tracking
   - Set up custom monitoring endpoints

2. **Health Check Monitoring**
   - Configure external monitoring (Pingdom, Uptime Robot)
   - Set up alerts for health endpoint failures
   - Monitor key metrics dashboard

3. **Analytics Tracking**
   - Verify Google Analytics is collecting data
   - Check custom event tracking
   - Monitor user engagement metrics

### Success Metrics
Track the following metrics after deployment:

#### Performance Metrics
- **Page Load Time**: <3 seconds
- **First Contentful Paint**: <1.5 seconds
- **Time to Interactive**: <2 seconds
- **Bundle Size**: <50MB gzipped

#### User Engagement Metrics
- **Session Duration**: Average time spent on ecosystem stats
- **Feature Usage**: Most used ecosystem features
- **Interaction Rate**: User interactions per session
- **Bounce Rate**: <50%

#### System Health Metrics
- **Uptime**: >99.9%
- **Error Rate**: <5%
- **API Response Time**: <500ms average
- **Data Freshness**: <6 hours old

### Documentation Updates
- Update API documentation if endpoints changed
- Update deployment procedures
- Document any new environment variables
- Update runbook with lessons learned

### Communication
- Notify team of successful deployment
- Share performance metrics
- Update project status documentation
- Schedule post-deployment review

---

## 📞 Support Contacts

### Team Contacts
- **Development Lead**: [Contact Info]
- **DevOps Team**: [Contact Info]
- **Product Manager**: [Contact Info]
- **Support Team**: [Contact Info]

### External Services
- **Vercel Support**: https://vercel.com/support
- **Netlify Support**: https://www.netlify.com/support/
- **GitHub Issues**: https://github.com/shrwnsan/claude-marketplace-registry/issues

### Emergency Procedures
1. **Critical Issues** (Site Down, Data Loss)
   - Contact DevOps team immediately
   - Initiate emergency rollback
   - Communicate status to users

2. **High Priority Issues** (Performance Degradation, Feature Failures)
   - Contact development lead
   - Monitor situation closely
   - Plan fix and deployment

3. **Low Priority Issues** (Minor Bugs, Improvements)
   - Create GitHub issue
   - Add to backlog for next release

---

## 📝 Change Log

### Version 1.0 (2025-10-26)
- Initial deployment runbook
- Comprehensive monitoring and health checking
- Production build optimization
- Performance and error tracking integration

---

**This runbook should be updated after every deployment and reviewed monthly for accuracy and completeness.**

For questions or issues, contact the Development Team or create an issue in the project repository.