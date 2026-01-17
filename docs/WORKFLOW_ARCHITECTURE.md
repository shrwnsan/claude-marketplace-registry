# GitHub Actions Workflow Architecture

## Overview

This document provides comprehensive visual diagrams and documentation for all GitHub Actions workflows in the Claude Marketplace Aggregator project. It includes workflow relationships, trigger mappings, dependency graphs, and data flow diagrams.

---

## Table of Contents

1. [Workflow Ecosystem Overview](#workflow-ecosystem-overview)
2. [Workflow Categories](#workflow-categories)
3. [Trigger Mapping](#trigger-mapping)
4. [Workflow Dependencies](#workflow-dependencies)
5. [Data Flow Diagrams](#data-flow-diagrams)
6. [Job Dependencies](#job-dependencies)
7. [Security & Permissions](#security--permissions)
8. [Timeline & Frequency](#timeline--frequency)

---

## Workflow Ecosystem Overview

### Complete Workflow Map

```mermaid
graph TB
    subgraph "CI/CD Pipeline"
        CI[ci.yml]
        DEPLOY[deploy.yml]
    end

    subgraph "Data Processing"
        SCAN[scan.yml]
        BACKUP[backup.yml]
    end

    subgraph "Monitoring & Analysis"
        MONITOR[monitoring.yml]
        PERF[performance.yml]
    end

    subgraph "Security & Maintenance"
        SEC[security.yml]
        DEPS[dependency-update.yml]
    end

    subgraph "Community & AI"
        TRIAGE[issue-triage.yml]
        CLAUDE[claude-code.yml]
        OPENCODE[opencode.yml]
    end

    %% Event triggers
    PUSH[Push to main/develop] --> CI
    PUSH --> DEPLOY
    PUSH --> SEC
    PR[Pull Request] --> CI
    PR --> SEC
    PR --> TRIAGE

    %% Scheduled triggers
    SCHEDULE_6H[Every 6 hours] --> SCAN
    SCHEDULE_6H --> BACKUP
    SCHEDULE_DAILY[Daily 2:00 UTC] --> SEC
    SCHEDULE_5MIN[Every 5 min] --> MONITOR
    SCHEDULE_WEEKLY[Weekly Sundays] --> PERF
    SCHEDULE_MON[Weekly Mondays] --> DEPS

    %% Manual triggers
    MANUAL[Workflow Dispatch] --> SCAN
    MANUAL --> DEPLOY
    MANUAL --> PERF
    MANUAL --> BACKUP

    %% Issue/PR events
    ISSUE[Issue opened/commented] --> TRIAGE
    ISSUE --> CLAUDE
    ISSUE --> OPENCODE
    PRCOMMENT[PR Comment] --> CLAUDE
    PRCOMMENT --> OPENCODE

    %% Workflow dependencies
    CI -->|success| DEPLOY
    SCAN -->|data updated| DEPLOY
    SEC -.->|vulnerability found| DEPS

    %% Style
    classDef cicd fill:#4CAF50,stroke:#2E7D32,color:#fff
    classDef data fill:#2196F3,stroke:#1565C0,color:#fff
    classDef monitor fill:#FF9800,stroke:#E65100,color:#fff
    classDef sec fill:#F44336,stroke:#C62828,color:#fff
    classDef community fill:#9C27B0,stroke:#6A1B9A,color:#fff

    class CI,DEPLOY cicd
    class SCAN,BACKUP data
    class MONITOR,PERF monitor
    class SEC,DEPS sec
    class TRIAGE,CLAUDE,OPENCODE community
```

### Workflow Statistics

| Category | Count | Total Runtime/Day | Secrets Required |
|----------|-------|-------------------|------------------|
| CI/CD | 2 | ~10 min | GITHUB_TOKEN |
| Data Processing | 2 | ~20 min | GITHUB_TOKEN |
| Monitoring | 2 | ~15 min | WEBHOOK_URL (optional) |
| Security | 2 | ~8 min | GITLEAKS_LICENSE (optional) |
| Community/AI | 3 | On-demand | ANTHROPIC_API_KEY, OPENCODE_ZAI_API_KEY |

---

## Workflow Categories

### 1. CI/CD Pipeline

```mermaid
graph LR
    subgraph "ci.yml - Continuous Integration"
        direction TB
        LINT[Lint & Type Check]
        TEST[Test with Coverage]
        BUILD[Build Application]
        SECURITY[Security Audit]
        SCAN_TEST[Scan Scripts Test]
        SUMMARY[Build Summary]

        LINT --> BUILD
        TEST --> BUILD
        BUILD --> SUMMARY
        SECURITY --> SUMMARY
        SCAN_TEST --> SUMMARY
    end

    subgraph "deploy.yml - Deployment"
        direction TB
        SCAN_OPT[Optional Scan]
        BUILD_DEP[Build for Deploy]
        DEPLOY_PAGES[GitHub Pages Deploy]
        NOTIFY[Notify Status]
        RELEASE[Create Release]

        SCAN_OPT --> BUILD_DEP
        BUILD_DEP --> DEPLOY_PAGES
        DEPLOY_PAGES --> NOTIFY
        DEPLOY_PAGES --> RELEASE
    end

    CI -->|success| DEPLOY
```

**Purpose**: Code quality validation and production deployment

**Key Features**:
- Multi-stage validation (lint, test, build)
- Artifact caching and reuse
- CodeQL security analysis
- Automatic GitHub Pages deployment
- Tag-based release creation

**Triggers**:
- Push to `main` or `develop` branches
- Pull requests to `main` or `develop`
- Manual workflow dispatch
- Git tags (for releases)

---

### 2. Data Processing

```mermaid
graph TB
    subgraph "scan.yml - Marketplace Scanning"
        direction TB
        SCAN_MKT[Scan Marketplaces]
        VAL_PLUGINS[Validate Plugins]
        GEN_DATA[Generate Data Files]
        COMMIT[Commit Changes]
        CREATE_PR[Create Pull Request]
        NOTIFY[Notify Results]
        TRIGGER[Trigger Deploy]

        SCAN_MKT --> VAL_PLUGINS
        VAL_PLUGINS --> GEN_DATA
        GEN_DATA --> COMMIT
        COMMIT --> CREATE_PR
        COMMIT --> NOTIFY
        COMMIT --> TRIGGER
    end

    subgraph "backup.yml - Data Backup"
        direction TB
        PRE_CHECK[Pre-Backup Checks]
        CREATE_BACK[Create Backup]
        VERIFY[Verify Integrity]
        UPLOAD[Upload Artifact]
        CLEANUP[Cleanup Old Backups]

        PRE_CHECK -->|backup needed| CREATE_BACK
        CREATE_BACK --> VERIFY
        VERIFY --> UPLOAD
        UPLOAD --> CLEANUP
    end

    SCAN -.->|data updated| BACKUP
```

**Purpose**: Automated data collection and backup

**Key Features**:
- GitHub API integration for marketplace discovery
- Plugin validation and metadata extraction
- Automatic data file generation
- Backup with integrity verification
- Incremental updates with smart caching

**Triggers**:
- Scheduled every 6 hours (`0 */6 * * *`)
- Manual dispatch with options (full/marketplaces/validation/data)

---

### 3. Monitoring & Analysis

```mermaid
graph TB
    subgraph "monitoring.yml - Health Monitoring"
        direction TB
        HEALTH[Health Check]
        DETAILED[Detailed Status]
        UPLOAD[Upload Report]
        NOTIFY_TEAM[Notify Team]
        PERF_MON[Performance Monitoring]
        CLEANUP[Cleanup Artifacts]

        HEALTH --> DETAILED
        HEALTH --> UPLOAD
        DETAILED --> UPLOAD
        HEALTH -->|unhealthy| NOTIFY_TEAM
        DETAILED --> PERF_MON
        PERF_MON --> CLEANUP
    end

    subgraph "performance.yml - Performance Analysis"
        direction TB
        BUILD_ANAL[Build Analysis]
        BUNDLE_ANAL[Bundle Analysis]
        LIGHTHOUSE[Lighthouse Audit]
        TREND[Performance Trend]
        REPORT[Monthly Report]

        BUILD_ANAL --> TREND
        BUNDLE_ANAL --> TREND
        LIGHTHOUSE --> REPORT
        TREND --> REPORT
    end
```

**Purpose**: System health monitoring and performance tracking

**Key Features**:
- 5-minute health check intervals
- Response time tracking
- Lighthouse performance audits
- Bundle size analysis
- Monthly performance reports

**Triggers**:
- Monitoring: Every 5 minutes (`*/5 * * * *`)
- Performance: Weekly Sundays at 3:00 UTC (`0 3 * * 0`)

---

### 4. Security & Maintenance

```mermaid
graph TB
    subgraph "security.yml - Security Scanning"
        direction TB
        VULN[Vulnerability Scan]
        CODEQL[CodeQL Analysis]
        SECRETS[Secrets Scan]
        ISSUE[Create Security Issue]
        COMMENT[PR Comment]

        VULN -->|vulnerabilities| ISSUE
        VULN --> COMMENT
        CODEQL --> SECURITY_EVENTS
        SECRETS --> SECURITY_EVENTS
    end

    subgraph "dependency-update.yml - Dependency Updates"
        direction TB
        CHECK[Check Outdated]
        UPDATE[Update Dependencies]
        RUN_TEST[Run Tests]
        BUILD_APP[Build Application]
        CREATE_PR[Create Pull Request]

        CHECK -->|updates available| UPDATE
        UPDATE --> RUN_TEST
        RUN_TEST --> BUILD_APP
        BUILD_APP --> CREATE_PR
    end
```

**Purpose**: Security vulnerability detection and dependency maintenance

**Key Features**:
- Daily npm audit with automated issue creation
- CodeQL advanced static analysis
- Secrets detection (TruffleHog + Gitleaks)
- Weekly dependency updates with PR creation
- PR security comments

**Triggers**:
- Security: Daily at 2:00 UTC, push to main, PRs
- Dependencies: Weekly Mondays at 9:00 UTC

---

### 5. Community & AI Assistants

```mermaid
graph TB
    subgraph "issue-triage.yml - Issue Automation"
        direction TB
        AUTO_LABEL[Auto Label Issues]
        WELCOME[Welcome Comment]
        RESPOND[Auto Respond]

        ISSUE_OPEN[Issue Opened] --> AUTO_LABEL
        ISSUE_OPEN --> WELCOME
        COMMENT[Comment Created] --> RESPOND
    end

    subgraph "claude-code.yml - Claude AI"
        direction TB
        CHECK_MENTION[Check for @claude]
        CHECK_PERMS[Check Permissions]
        RUN_CLAUDE[Run Claude Code]

        CHECK_MENTION -->|member| CHECK_PERMS
        CHECK_PERMS --> RUN_CLAUDE
    end

    subgraph "opencode.yml - OpenCode AI"
        direction TB
        CHECK_CMD[Check for /oc or /opencode]
        CHECK_PERMS_OC[Check Permissions]
        RUN_OPENCODE[Run OpenCode]

        CHECK_CMD -->|member| CHECK_PERMS_OC
        CHECK_PERMS_OC --> RUN_OPENCODE
    end
```

**Purpose**: Community management and AI-assisted development

**Key Features**:
- Automatic issue labeling based on content
- Welcome comments for new issues
- Context-aware responses to common questions
- AI-powered code assistance (Claude + OpenCode)
- Member-only access for AI features

**Triggers**:
- Issue/PR events (opened, edited, commented)
- Commands: `@claude`, `/opencode`, `/oc`

---

## Trigger Mapping

### Event-Based Triggers

```mermaid
graph LR
    subgraph "Git Events"
        PUSH[Push]
        PR[Pull Request]
        TAG[Git Tag]
    end

    subgraph "Issue Events"
        ISSUE_OPEN[Issue Opened]
        ISSUE_EDIT[Issue Edited]
        ISSUE_COMMENT[Issue Comment]
        PR_COMMENT[PR Comment]
    end

    subgraph "Workflows"
        CI[ci.yml]
        DEPLOY[deploy.yml]
        SEC[security.yml]
        TRIAGE[issue-triage.yml]
        CLAUDE[claude-code.yml]
        OPENCODE[opencode.yml]
    end

    PUSH --> CI
    PUSH --> SEC
    PUSH --> DEPLOY
    PR --> CI
    PR --> SEC
    TAG --> DEPLOY

    ISSUE_OPEN --> TRIAGE
    ISSUE_COMMENT --> TRIAGE
    ISSUE_COMMENT --> CLAUDE
    ISSUE_COMMENT --> OPENCODE
    PR_COMMENT --> CLAUDE
    PR_COMMENT --> OPENCODE
```

### Scheduled Triggers

```mermaid
graph TB
    subgraph "Time-Based Triggers"
        direction TB
        MIN_5["Every 5 Minutes"]
        HOUR_6["Every 6 Hours"]
        DAY_2["Daily 2:00 UTC"]
        WEEK_SUN["Weekly Sunday 3:00 UTC"]
        WEEK_MON["Weekly Monday 9:00 UTC"]
    end

    subgraph "Target Workflows"
        MONITOR[monitoring.yml]
        SCAN[scan.yml]
        BACKUP[backup.yml]
        SEC[security.yml]
        PERF[performance.yml]
        DEPS[dependency-update.yml]
    end

    MIN_5 --> MONITOR
    HOUR_6 --> SCAN
    HOUR_6 --> BACKUP
    DAY_2 --> SEC
    WEEK_SUN --> PERF
    WEEK_MON --> DEPS
```

### Manual Triggers

All workflows support manual dispatch via GitHub Actions UI with varying options:

| Workflow | Input Options |
|----------|--------------|
| `deploy.yml` | `scan_before_deploy` (boolean) |
| `scan.yml` | `scan_type` (choice), `force_update` (boolean), `commit_changes` (boolean) |
| `performance.yml` | `analyze_build` (boolean), `analyze_bundle` (boolean), `analyze_lighthouse` (boolean) |
| `backup.yml` | `backup_type` (choice), `force_backup` (boolean), `restore_backup` (string) |
| `monitoring.yml` | `detailed_check` (boolean), `notify_on_success` (boolean) |

---

## Workflow Dependencies

### Dependency Graph

```mermaid
graph TB
    subgraph "Primary Workflows"
        CI[ci.yml]
        SCAN[scan.yml]
    end

    subgraph "Dependent Workflows"
        DEPLOY[deploy.yml]
        PERF[performance.yml]
        MONITOR[monitoring.yml]
    end

    subgraph "Independent Workflows"
        SEC[security.yml]
        DEPS[dependency-update.yml]
        BACKUP[backup.yml]
        TRIAGE[issue-triage.yml]
        CLAUDE[claude-code.yml]
        OPENCODE[opencode.yml]
    end

    CI -->|blocks deploy on failure| DEPLOY
    SCAN -.->|triggers deploy on data update| DEPLOY
    DEPLOY -->|provides data for| PERF
    DEPLOY -->|provides site for| MONITOR

    SEC -.->|creates PR for| DEPS
    BACKUP -.->|can restore from| SCAN
```

### Hard Dependencies

- **deploy.yml** requires **ci.yml** to pass on the same commit
- **deploy.yml** optional scan job requires **scan.yml** data

### Soft Dependencies

- **performance.yml** assumes site is deployed (doesn't block)
- **monitoring.yml** checks deployed site (doesn't block)
- **dependency-update.yml** may be triggered by **security.yml** findings

---

## Data Flow Diagrams

### CI/CD Data Flow

```mermaid
graph LR
    subgraph "Source"
        CODE[Repository Code]
    end

    subgraph "CI Pipeline"
        LINT[Lint Results]
        TEST[Test Results + Coverage]
        BUILD[Build Artifacts]
    end

    subgraph "Deployment"
        SCAN[Optional Scan Data]
        SITE[Static Site]
    end

    subgraph "Outputs"
        PAGES[GitHub Pages]
        RELEASE[GitHub Release]
    end

    CODE --> LINT
    CODE --> TEST
    CODE --> BUILD
    LINT --> BUILD
    TEST --> BUILD

    BUILD -->|artifacts| SITE
    SCAN -.->|data| SITE
    SITE --> PAGES
    SITE -->|on tag| RELEASE
```

### Data Processing Flow

```mermaid
graph TB
    subgraph "GitHub API"
        API[GitHub API]
    end

    subgraph "Scanning Pipeline"
        SEARCH[Search Repos]
        FETCH[Fetch Manifests]
        VALIDATE[Validate Plugins]
    end

    subgraph "Data Generation"
        PROCESS[Process Data]
        GENERATE[Generate JSON]
        BUILD[Build Site]
    end

    subgraph "Storage"
        REPO[Repository Data]
        BACKUP[Backup Artifacts]
        PAGES[GitHub Pages]
    end

    API --> SEARCH
    SEARCH --> FETCH
    FETCH --> VALIDATE
    VALIDATE --> PROCESS
    PROCESS --> GENERATE
    GENERATE --> REPO
    REPO --> BUILD
    BUILD --> PAGES
    REPO --> BACKUP
```

### Monitoring Data Flow

```mermaid
graph LR
    subgraph "Data Sources"
        SITE[Deployed Site]
        HEALTH[Health Endpoint]
        STATUS[Status Endpoint]
    end

    subgraph "Monitoring"
        CHECK[Health Check]
        PERF[Performance Tests]
        ANALYZE[Analyze Metrics]
    end

    subgraph "Outputs"
        ARTIFACTS[Report Artifacts]
        ISSUES[GitHub Issues]
        WEBHOOKS[Webhook Notifications]
    end

    SITE --> CHECK
    HEALTH --> CHECK
    STATUS --> CHECK
    SITE --> PERF
    CHECK --> ANALYZE
    PERF --> ANALYZE
    ANALYZE --> ARTIFACTS
    ANALYZE -->|on failure| ISSUES
    ANALYZE --> WEBHOOKS
```

---

## Job Dependencies

### ci.yml Job Graph

```mermaid
graph TB
    subgraph "ci.yml Jobs"
        LINT[lint]
        TEST[test]
        BUILD[build]
        SECURITY[security]
        SCAN_TEST[scan-test]
        SUMMARY[summary]

        LINT --> BUILD
        TEST --> BUILD
        SECURITY -.-> SUMMARY
        SCAN_TEST -.-> SUMMARY
        BUILD --> SUMMARY
    end

    classDef parallel fill:#E3F2FD,stroke:#1976D2
    classDef sequential fill:#FFF3E0,stroke:#F57C00

    class LINT,TEST,SECURITY,SCAN_TEST parallel
    class BUILD,SUMMARY sequential
```

### scan.yml Job Graph

```mermaid
graph TB
    subgraph "scan.yml Jobs"
        SCAN_MKT[scan-marketplaces]
        VAL_PLUGINS[validate-plugins]
        GEN_DATA[generate-data]
        COMMIT[commit-changes]
        CREATE_PR[create-pull-request]
        NOTIFY[notify]
        TRIGGER[trigger-deploy]

        SCAN_MKT --> VAL_PLUGINS
        VAL_PLUGINS --> GEN_DATA
        SCAN_MKT --> GEN_DATA
        GEN_DATA --> COMMIT
        COMMIT --> CREATE_PR
        COMMIT --> NOTIFY
        COMMIT --> TRIGGER
    end
```

### deploy.yml Job Graph

```mermaid
graph TB
    subgraph "deploy.yml Jobs"
        SCAN[scan]
        BUILD[build]
        DEPLOY[deploy]
        NOTIFY[notify]
        RELEASE[release]

        SCAN --> BUILD
        BUILD --> DEPLOY
        DEPLOY --> NOTIFY
        DEPLOY --> RELEASE
    end

    %% SCAN is conditional
    style SCAN stroke-dasharray: 5 5
```

---

## Security & Permissions

### Permission Matrix

| Workflow | contents: read | contents: write | actions: read | security-events: write | pages: write | id-token: write | pull-requests: write | issues: write |
|----------|----------------|-----------------|---------------|------------------------|--------------|-----------------|----------------------|---------------|
| ci.yml | ✅ | | ✅ | ✅ | | | | |
| deploy.yml | ✅ | | | | ✅ | ✅ | | |
| scan.yml | ✅ | | | | | | ✅ | |
| security.yml | ✅ | | ✅ | ✅ | | | ✅ | |
| monitoring.yml | ✅ | | | | | | | |
| performance.yml | ✅ | | | | | | ✅ | |
| dependency-update.yml | ✅ | | | | | | ✅ | |
| issue-triage.yml | ✅ | | | | | | | ✅ |
| backup.yml | ✅ | | | | | | | |
| claude-code.yml | ✅ | ✅ | ✅ | | | ✅ | ✅ | ✅ |
| opencode.yml | ✅ | ✅ | | | | ✅ | ✅ | ✅ |

### Secrets Usage

```mermaid
graph TB
    subgraph "Required Secrets"
        GITHUB_TOKEN[GITHUB_TOKEN<br/>Built-in]
    end

    subgraph "Optional Secrets"
        CODECOV[CODECOV_TOKEN<br/>Coverage reporting]
        ANTHROPIC[ANTHROPIC_API_KEY<br/>Claude AI]
        OPENCODE[OPENCODE_ZAI_API_KEY<br/>OpenCode AI]
        GITLEAKS[GITLEAKS_LICENSE<br/>Advanced secrets scanning]
        WEBHOOK[WEBHOOK_URL<br/>Notifications]
        SLACK[SLACK_WEBHOOK<br/>Slack notifications]
    end

    subgraph "Workflows"
        ALL[All Workflows] --> GITHUB_TOKEN
        CI[ci.yml] --> CODECOV
        CLAUDE[claude-code.yml] --> ANTHROPIC
        OPENCODE[opencode.yml] --> OPENCODE
        SEC[security.yml] --> GITLEAKS
        MONITOR[monitoring.yml] --> WEBHOOK
        MONITOR --> SLACK
        BACKUP[backup.yml] --> SLACK
    end
```

---

## Timeline & Frequency

### Weekly Schedule

```mermaid
gantt
    title Weekly Workflow Schedule
    dateFormat X
    axisFormat %a

    section Daily
    Security Scan        :mon, 02:00, 1d
    Backup (6h)         :mon, 1d

    section Weekly
    Dependency Update    :mon, 09:00, 1d
    Performance Analysis :sun, 03:00, 1d

    section Continuous
    Marketplace Scan     :mon, 1d
    Health Monitoring    :mon, 1d
```

### Runtime Estimates

| Workflow | Average Duration | Frequency | Daily Runtime |
|----------|------------------|-----------|---------------|
| ci.yml | 3-5 min | On push/PR | Variable |
| deploy.yml | 2-3 min | On push to main | Variable |
| scan.yml | 5-10 min | Every 6h | ~20 min |
| backup.yml | 1-2 min | Every 6h | ~4 min |
| security.yml | 2-4 min | Daily | ~3 min |
| monitoring.yml | 1-2 min | Every 5 min | ~288 min |
| performance.yml | 5-8 min | Weekly | ~1 min/day |
| dependency-update.yml | 3-5 min | Weekly | ~1 min/day |

---

## Quick Reference

### Workflow Commands

```bash
# Trigger workflows manually
gh workflow run ci.yml
gh workflow run deploy.yml
gh workflow run scan.yml -f scan_type=full
gh workflow run performance.yml
gh workflow run backup.yml -f backup_type=daily

# View workflow status
gh run list --workflow=ci.yml
gh run view <run-id>
gh run watch <run-id>

# View workflow logs
gh run view <run-id> --log
gh run download <run-id>

# List workflows
gh workflow list
```

### Troubleshooting Commands

```bash
# Check GitHub Actions status
curl -s https://www.githubstatus.com/api/v2/status.json

# Verify repository permissions
gh api repos/:owner/:repo/actions/permissions

# Check workflow runs
gh run list --limit 20

# Cancel a workflow
gh run cancel <run-id>

# Re-run a workflow
gh run rerun <run-id>
```

---

## Related Documentation

- [MAINTENANCE_GUIDE.md](MAINTENANCE_GUIDE.md) - Operational procedures and monitoring
- [DISASTER_RECOVERY.md](DISASTER_RECOVERY.md) - Backup and recovery procedures
- [DEPLOYMENT-SUMMARY.md](DEPLOYMENT-SUMMARY.md) - Deployment configuration
- [.github/workflows/README.md](../.github/workflows/README.md) - Workflow configuration details

---

**Last Updated**: 2025-01-17
**Version**: 1.0.0
**Maintained By**: Infrastructure Team
