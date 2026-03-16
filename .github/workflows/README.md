# GitHub Actions Workflows

This directory contains the complete CI/CD pipeline configuration for the Claude Marketplace Aggregator project.

## 🚀 Workflow Overview

### Core Workflows

| Workflow | Purpose | Triggers | Status |
|----------|---------|----------|--------|
| **ci.yml** | Continuous Integration | Push to main/develop, PRs | ![CI](https://github.com/${{ github.repository }}/workflows/CI/badge.svg) |
| **deploy.yml** | GitHub Pages Deployment | Push to main, manual | ![Deploy](https://github.com/${{ github.repository }}/workflows/Deploy%20to%20GitHub%20Pages/badge.svg) |
| **scan.yml** | Marketplace Scanning | Every 6 hours, manual | ![Scan](https://github.com/${{ github.repository }}/workflows/Scan%20Marketplaces/badge.svg) |

### Maintenance Workflows

| Workflow | Purpose | Triggers | Status |
|----------|---------|----------|--------|
| **security.yml** | Security Scanning | Daily, PRs, push to main | ![Security](https://github.com/${{ github.repository }}/workflows/Security%20Scan/badge.svg) |
| **performance.yml** | Performance Monitoring | Weekly, manual | ![Performance](https://github.com/${{ github.repository }}/workflows/Performance%20Monitor/badge.svg) |
| **dependency-update.yml** | Dependency Updates | Weekly, manual | ![Deps](https://github.com/${{ github.repository }}/workflows/Dependency%20Update/badge.svg) |
| **issue-triage.yml** | Issue Automation | Issue opened/commented | ![Triage](https://github.com/${{ github.repository }}/workflows/Issue%20Triage/badge.svg) |

### AI Assistant Workflows

| Workflow | Purpose | Triggers | Commands |
|----------|---------|----------|----------|
| **claude-code.yml** | Claude Code AI Assistant | Issue/PR comments, PRs, Issues | `@claude` |
| **opencode.yml** | OpenCode AI Assistant | Issue/PR comments | `/opencode` or `/oc` |

> **Note:** AI assistant workflows are restricted to repository members, owners, and collaborators only. |

## 📋 Workflow Details

### CI Pipeline (`ci.yml`)

**Jobs:**
- **lint**: Linting and type checking
- **test**: Unit testing with coverage
- **build**: Application build and artifact upload
- **security**: Security audit and CodeQL analysis
- **scan-test**: Dry run testing of scan scripts
- **summary**: Pipeline status summary

**Features:**
- ✅ Multi-stage validation
- ✅ Coverage reporting with Codecov
- ✅ Security scanning with CodeQL
- ✅ Artifact handling
- ✅ Comprehensive error handling
- ✅ Performance caching

### Deployment (`deploy.yml`)

**Jobs:**
- **scan**: Optional marketplace scanning before deployment
- **build**: Build and artifact creation
- **deploy**: GitHub Pages deployment
- **notify**: Deployment status notification
- **release**: Automatic release creation for tags

**Features:**
- ✅ GitHub Pages static deployment
- ✅ Optional pre-deployment scanning
- ✅ Automatic releases for tags
- ✅ Deployment notifications
- ✅ Proper environment configuration

### Scanning (`scan.yml`)

**Jobs:**
- **scan-marketplaces**: GitHub API scanning for new marketplaces
- **validate-plugins**: Plugin validation and verification
- **generate-data**: Data file generation
- **commit-changes**: Automatic commit of scan results
- **create-pull-request**: Optional PR creation
- **notify**: Scan results notification
- **trigger-deploy**: Optional deployment trigger

**Features:**
- ✅ Scheduled every 6 hours
- ✅ Manual dispatch with options
- ✅ Modular scan pipeline
- ✅ Automatic data updates
- ✅ GitHub API optimization
- ✅ Comprehensive caching

### Security (`security.yml`)

**Jobs:**
- **vulnerability-scan**: npm audit and dependency checking
- **codeql-scan**: CodeQL advanced analysis
- **secrets-scan**: Secrets detection with TruffleHog and Gitleaks

**Features:**
- ✅ Daily vulnerability scanning
- ✅ Automatic security issue creation
- ✅ PR security comments
- ✅ Secrets detection
- ✅ Comprehensive coverage

### Performance (`performance.yml`)

**Jobs:**
- **build-analysis**: Build time and output analysis
- **bundle-analysis**: Bundle size optimization
- **lighthouse-audit**: Performance score analysis
- **performance-trend**: Monthly performance reports

**Features:**
- ✅ Build performance monitoring
- ✅ Bundle size tracking
- ✅ Lighthouse audits
- ✅ Monthly performance reports
- ✅ Optimization recommendations

### Dependencies (`dependency-update.yml`)

**Features:**
- ✅ Weekly dependency checks
- ✅ Automated PR creation
- ✅ Security vulnerability fixes
- ✅ Build and test validation

### Issue Triage (`issue-triage.yml`)

**Features:**
- ✅ Automatic issue labeling
- ✅ Welcome comments for new issues
- ✅ Common question responses
- ✅ Context-aware help

### AI Assistant Workflows

#### Claude Code Assistant (`claude-code.yml`)

**Purpose:** AI-powered code assistance via Anthropic Claude

**Commands:** `@claude` in issues, PRs, or comments

**Features:**
- ✅ Multi-tool support (Read, Write, Edit, Bash, etc.)
- ✅ Web search and content fetching
- ✅ 10-turn conversation limit
- ✅ Member-only access

**Documentation:** [Claude Code Action](https://github.com/anthropics/claude-code-action)

#### OpenCode Assistant (`opencode.yml`)

**Purpose:** AI-powered code assistance via OpenCode with Z.ai

**Commands:** `/opencode` or `/oc` in issue/PR comments

**Features:**
- ✅ GLM-5 model via Z.ai
- ✅ Lightweight alternative to Claude Code
- ✅ Member-only access

**Documentation:** [OpenCode GitHub Actions Docs](https://opencode.ai/docs/github/)

## 🔧 Configuration

### Required Secrets

| Secret | Purpose | Workflow | Required |
|--------|---------|----------|----------|
| `GITHUB_TOKEN` | GitHub API access | All | ✅ (Built-in) |
| `ANTHROPIC_API_KEY` | Claude Code AI assistant | claude-code.yml | ⚠️ For AI features |
| `OPENCODE_ZAI_API_KEY` | OpenCode AI assistant | opencode.yml | ⚠️ For AI features |
| `CODECOV_TOKEN` | Coverage reporting | ci.yml | ⚠️ Optional |
| `GITLEAKS_LICENSE` | Gitleaks advanced features | security.yml | ⚠️ Optional |

### Environment Variables

Key environment variables used across workflows:

```yaml
NODE_VERSION: '18'
CACHE_VERSION: 'v1'
REPOSITORY_NAME: # Auto-set from repository name
NEXT_PUBLIC_SITE_URL: # Auto-configured for GitHub Pages
```

### Permissions

Each workflow is configured with minimal required permissions:

```yaml
permissions:
  contents: read      # Read repository content
  actions: read       # Read workflow status
  security-events: write  # Upload security results
  pages: write        # Deploy to GitHub Pages
  id-token: write     # OIDC authentication
  pull-requests: write  # Create/update PRs
  issues: write       # Manage issues
```

## 🚀 Usage

### Manual Triggers

Most workflows support manual execution through the GitHub Actions UI:

1. Navigate to **Actions** tab
2. Select the desired workflow
3. Click **Run workflow**
4. Configure inputs if available
5. Click **Run workflow**

### Monitoring

- Check the **Actions** tab for workflow status
- Review workflow summaries for detailed results
- Monitor artifact uploads for build outputs
- Check issues for automated security and dependency alerts

### Troubleshooting

**Common Issues:**

1. **Build Failures**: Check dependencies and Node.js version
2. **Deployment Issues**: Verify GitHub Pages configuration
3. **Scan Failures**: Check GitHub API rate limits
4. **Security Alerts**: Review vulnerability reports

**Debug Steps:**

1. Check workflow logs for error details
2. Review environment variable configuration
3. Verify secrets are properly configured
4. Check repository permissions

## 📊 Performance

**Optimizations Implemented:**

- ✅ Dependency caching across workflows
- ✅ Artifact reuse between jobs
- ✅ Parallel job execution where possible
- ✅ Efficient GitHub API usage
- ✅ Conditional job execution
- ✅ Resource optimization

**Metrics:**

- **Average CI Time**: ~3-5 minutes
- **Average Deploy Time**: ~2-3 minutes
- **Average Scan Time**: ~5-10 minutes
- **Build Size**: Optimized for GitHub Pages

## 🔐 Security

**Security Measures:**

- ✅ Minimal permissions principle
- ✅ Secrets management
- ✅ Automated vulnerability scanning
- ✅ CodeQL analysis
- ✅ Secrets detection
- ✅ Dependency security updates

## 📈 Monitoring

**Automated Monitoring:**

- ✅ Performance tracking
- ✅ Security alerts
- ✅ Dependency updates
- ✅ Build success rates
- ✅ Error notifications

## 🔄 Maintenance

**Automated Maintenance:**

- ✅ Weekly dependency updates
- ✅ Monthly performance reports
- ✅ Daily security scans
- ✅ Continuous marketplace scanning
- ✅ Issue triage and responses

---

## 📝 Development Notes

### Adding New Workflows

1. Create new `.yml` file in `.github/workflows/`
2. Follow the established naming convention
3. Include proper permissions
4. Add error handling and notifications
5. Update this documentation

### Modifying Existing Workflows

1. Test changes in a feature branch
2. Validate YAML syntax
3. Check permissions and security
4. Update documentation
5. Monitor after deployment

### Best Practices

- ✅ Use specific action versions
- ✅ Implement proper caching
- ✅ Add comprehensive error handling
- ✅ Include meaningful notifications
- ✅ Follow security guidelines
- ✅ Document purpose and usage

---

🤖 **Automated CI/CD Pipeline** | **Claude Marketplace Aggregator** | **Last Updated:** $(date '+%Y-%m-%d')