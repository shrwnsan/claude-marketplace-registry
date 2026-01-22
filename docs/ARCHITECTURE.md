# System Architecture

## Overview

The Claude Marketplace Aggregator is a **static site generator** that discovers, validates, and displays Claude Code marketplaces and plugins from GitHub. The system follows a **data pipeline architecture** with scheduled scanning and automated deployment.

## High-Level Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  GitHub API     │───▶│  Data Pipeline  │───▶│  Static Site    │
│  (Marketplaces) │    │  (Scan/Validate)│    │  (Next.js)      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                              │
                              ▼
                       ┌─────────────────┐
                       │  GitHub Pages   │
                       │  (Deployment)   │
                       └─────────────────┘
```

## System Components

### 1. GitHub API Scanner
**Location**: `scripts/scan-marketplaces.ts`

**Purpose**: Discovers Claude marketplace repositories

**Flow**:
1. Searches GitHub for repositories containing `marketplace.json`
2. Filters by Claude Code-related keywords
3. Fetches repository metadata (stars, forks, updated_at)
4. Stores results in `data/marketplaces/`

**Key Dependencies**:
- `@octokit/rest` - GitHub API client
- `src/services/github-search.ts` - Search logic
- `src/services/github-metadata.ts` - Metadata fetching

### 2. Plugin Validator
**Location**: `scripts/validate-plugins.ts`

**Purpose**: Validates and scores plugin quality

**Flow**:
1. Reads discovered marketplaces
2. Fetches `marketplace.json` from each repository
3. Validates plugins against JSON schema
4. Calculates quality scores (stars, age, completeness)
5. Stores validated plugins in `data/plugins/`

**Key Dependencies**:
- `src/parsers/manifest-parser.ts` - Manifest parsing
- `src/services/quality-scoring.ts` - Quality calculations

### 3. Data Generator
**Location**: `scripts/generate-data.ts`

**Purpose**: Generates static data files for the website

**Flow**:
1. Combines marketplace and plugin data
2. Generates statistics and analytics
3. Creates index files for fast lookup
4. Outputs to `public/data/` as JSON

**Output Files**:
- `public/data/marketplaces.json` - All marketplaces
- `public/data/plugins.json` - All plugins
- `public/data/index.json` - Summary and stats
- `public/data/health.json` - Health status
- `public/data/status.json` - System status
- `public/data/metrics.json` - Performance metrics
- `public/data/analytics.json` - Analytics data

### 4. Static Website
**Location**: `pages/`, `src/components/`

**Purpose**: User-facing interface for browsing marketplaces

**Architecture**:
- **Next.js 14** - Static site generation
- **React 18** - UI components
- **Tailwind CSS** - Styling
- **shadcn/ui** - Component library

**Key Pages**:
- `pages/index.tsx` - Homepage
- `pages/marketplaces/[id].tsx` - Marketplace details
- `pages/plugins/[id].tsx` - Plugin details
- `pages/admin/` - Admin dashboard

### 5. CI/CD Pipeline
**Location**: `.github/workflows/`

**Workflows**:

#### CI Workflow (`ci.yml`)
**Trigger**: Push to main/develop, Pull requests
**Steps**:
- Lint code (ESLint)
- Type check (TypeScript)
- Run tests (Jest)
- Build production site
- Security scan (CodeQL)

#### Deploy Workflow (`deploy.yml`)
**Trigger**: Push to main branch
**Steps**:
- Build Next.js static site
- Optimize assets
- Deploy to GitHub Pages

#### Scan Workflow (`scan.yml`)
**Trigger**: Every 6 hours (cron), Manual dispatch
**Steps**:
- Scan GitHub for marketplaces
- Validate plugins
- Generate data files
- Create summary report

## Data Flow

```
GitHub Repository (marketplace.json)
         │
         ▼
┌─────────────────────┐
│  Scan Marketplaces  │  (scripts/scan-marketplaces.ts)
│  - Search GitHub    │
│  - Fetch metadata   │
└─────────────────────┘
         │
         ▼
┌─────────────────────┐
│  Validate Plugins   │  (scripts/validate-plugins.ts)
│  - Parse manifests  │
│  - Score quality    │
└─────────────────────┘
         │
         ▼
┌─────────────────────┐
│  Generate Data      │  (scripts/generate-data.ts)
│  - Combine data     │
│  - Create index     │
└─────────────────────┘
         │
         ▼
┌─────────────────────┐
│  Build Static Site  │  (Next.js)
│  - Generate pages   │
│  - Optimize assets  │
└─────────────────────┘
         │
         ▼
┌─────────────────────┐
│  Deploy to GitHub   │  (GitHub Pages)
│  Pages              │
└─────────────────────┘
```

## Data Models

### Marketplace Model
**Location**: `src/types/marketplace.ts`

```typescript
interface Marketplace {
  id: string;
  name: string;
  description: string;
  owner: { name: string; url: string; type: 'User' | 'Organization' };
  repository: {
    url: string;
    stars: number;
    forks: number;
    issues: number;
    createdAt: string;
    updatedAt: string;
    language: string;
  };
  manifestUrl: string;
  plugins: Plugin[];
  tags: string[];
  verified: boolean;
  qualityScore: number;
  lastScanned: string;
  addedAt: string;
}
```

### Plugin Model
**Location**: `src/types/plugin.ts`

```typescript
interface Plugin {
  id: string;
  name: string;
  description: string;
  source: {
    type: 'github' | 'url';
    url: string;
    path?: string;
  };
  commands?: string[];
  agents?: string[];
  hooks?: Record<string, unknown>;
  mcpServers?: Record<string, unknown>;
  marketplaceId: string;
  validated: boolean;
  qualityScore: number;
}
```

## Key Technologies

### Frontend
- **Next.js 14** - React framework with static generation
- **React 18** - UI library
- **Tailwind CSS** - Utility-first CSS
- **shadcn/ui** - Component library

### Backend/Data Processing
- **Node.js 18+** - Runtime
- **TypeScript** - Type safety
- **@octokit/rest** - GitHub API client

### Infrastructure
- **GitHub Pages** - Static hosting
- **GitHub Actions** - CI/CD automation

### Testing
- **Jest** - Unit testing
- **React Testing Library** - Component testing

### Security
- **CodeQL** - Static analysis
- **GitLeaks** - Secret scanning
- **TruffleHog** - Secret scanning
- **Dependabot** - Dependency updates

## Security Considerations

### Data Privacy
- ✅ No end-user PII collected
- ✅ Only public GitHub data accessed
- ✅ Read-only GitHub API access
- ✅ No user authentication required

### API Security
- ✅ GitHub token stored in secrets
- ✅ Rate limiting enforced
- ✅ Request caching to reduce API usage
- ✅ Input validation on all endpoints

### Content Security
- ✅ CSP headers configured
- ✅ No user-generated content
- ✅ No external script loading
- ✅ Static site (no server-side processing)

## Performance Optimization

### Static Generation
- Pre-renders all pages at build time
- Fast page loads (no server queries)
- CDN distribution via GitHub Pages

### Data Optimization
- JSON files compressed
- Index files for fast lookups
- Lazy loading for large datasets

### Build Optimization
- Tree shaking eliminates unused code
- Asset optimization (images, fonts)
- Bundle size monitoring

## Monitoring & Observability

### Health Checks
- `/data/health.json` - Basic health status
- `/data/status.json` - Detailed system status
- `/data/metrics.json` - Performance metrics

### GitHub Actions Monitoring
- Workflow run status
- Build summaries
- Security scan results
- Deployment notifications

### Backup & Recovery
- Automated backups every 6 hours
- Versioned backup retention
- Disaster recovery procedures documented

## Development Workflow

### Local Development
```bash
npm install          # Install dependencies
npm run dev          # Start dev server (localhost:3000)
npm run scan:full    # Run full scanning pipeline
npm run test         # Run tests
npm run lint         # Lint code
```

### Making Changes
1. Create feature branch
2. Make changes
3. Run tests and linting
4. Create pull request
5. Automated PR review
6. Merge to main
7. Automatic deployment

## Deployment Process

### Automatic Deployment
1. Code merged to `main` branch
2. GitHub Actions triggers `deploy.yml`
3. Next.js builds static site
4. Site deployed to GitHub Pages
5. Data files updated via `scan.yml` (every 6 hours)

### Manual Deployment
```bash
npm run build        # Build production site
npm run deploy       # Deploy to GitHub Pages
```

## Scalability Considerations

### Current Limitations
- GitHub API rate limits (5,000 requests/hour)
- Static site updates require rebuild
- No real-time data updates

### Scaling Strategies
- **GitHub API**: Implement caching, use pagination, respect rate limits
- **Data Processing**: Optimize parsing, use streaming for large files
- **Static Site**: Implement incremental builds, optimize bundle size
- **Deployment**: GitHub Pages can handle high traffic (CDN-backed)

## Future Enhancements

### Phase 2 (Planned)
- Advanced semantic search
- Community rating system
- Enhanced quality scoring
- Analytics dashboard

### Phase 3 (Future)
- CLI tool integration
- Public API
- Advanced security scanning
- Enterprise features

## Troubleshooting

### Common Issues

**GitHub API Rate Limiting**
- Symptom: Scan fails with 403 errors
- Solution: Wait for rate limit reset, verify token has proper scope

**Build Failures**
- Symptom: Next.js build fails
- Solution: Check TypeScript errors, run `npm run type-check`

**Data Processing Errors**
- Symptom: Invalid marketplace data
- Solution: Check manifest validation, review logs

### Debugging Tips

- Check GitHub Actions logs for workflow failures
- Review browser console for frontend errors
- Monitor GitHub API usage in developer settings
- Validate JSON data files after processing

## Related Documentation

- **Product Requirements**: `docs/prd-001-claude-marketplace-aggregator.md`
- **Development Tasks**: `docs/tasks-001-prd-claude-marketplace-aggregator.md`
- **Security**: `docs/SECURITY.md`
- **Maintenance**: `docs/MAINTENANCE_GUIDE.md`
- **Disaster Recovery**: `docs/DISASTER_RECOVERY.md`

---

**Last Updated**: 2026-01-22
**Maintainer**: @shrwnsan
