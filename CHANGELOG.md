# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Security
- Gated AI-assist workflows (`claude-code.yml`, `droid.yml`) to OWNER/MEMBER/COLLABORATOR authors and excluded bot accounts — anonymous comments/PRs can no longer drive an agent holding a repo-write token
- Dropped unused `id-token: write` from agent workflows; `follow-up-implementation.yml` now only implements owner-authored issues
- Untracked `.env.production` from git (had silently pinned the scanner to legacy single-query search via `SEARCH_QUERY`)
- CI now enforces a production `npm audit` gate; production dependencies are at 0 vulnerabilities (next 16.3.5)

### Fixed
- Daily bot merges now trigger deployment: auto-merge executes with `DATA_UPDATES_PAT` instead of `GITHUB_TOKEN` (GITHUB_TOKEN pushes never fire `on: push`)
- Pipeline output reaches the site: `generate-data` artifacts download into `data/marketplaces/` and `data/plugins/` instead of flattening into `data/`, which caused `generate-data.ts` to silently fall back to stale committed snapshots
- Data-update PRs now carry `public/data/`, the directory the website actually fetches
- `useRealMarketplaceData` fetches with the basePath prefix and handles both array and wrapped JSON shapes (previously rendered real data as zero marketplaces)
- Fixed `EMAIL_SERVICE_API_KEY` being used as a fetch URL in success-metrics
- Fixed `TS18046` in `browser-test.ts` that broke the dependency-update workflow

### Changed
- Docs rewritten to match reality (Next.js 16 / React 19 / Node 20, daily scan cadence, real file structure, data-flow documentation)
- Removed dead pipeline code (~2,300 lines): unused GitHub client/search/metadata/content-fetcher modules, their tests, workflow-test stub files, and an example script
- Unified repo identity (`shrwnsan/claude-marketplace-registry`) across `next.config.js`, `.env.example`, and maintenance scripts; engines bumped to Node >=20.9
- Lint warning budget ratcheted from 350 to 266

## [0.4.0-beta.1] - 2026-02-18

### Added
- Plugin discovery module for extracting plugins from marketplace manifests
- Spec-compliant manifest path handling (`.claude-plugin/marketplace.json` only)
- Plugin data generation (`plugins.json`) from marketplace scans
- Design document for plugin discovery (PRD-003 Phase 2)
- Implementation plan for plugin discovery integration

### Changed
- Tightened manifest paths to official Claude Code spec
- Integrated plugin discovery into scan workflow

## [0.3.0-beta.1] - 2025-01-16

### Added
- Phase 1 complete - Production-ready Claude Marketplace Aggregator
- Automated GitHub marketplace scanning and discovery
- Comprehensive monitoring with health, status, metrics, and analytics endpoints
- CI/CD pipeline with GitHub Actions (CI, Deploy, Scan, Monitoring, Backup)
- Automated backup system with 6-hour intervals and retention policies
- Disaster recovery procedures and documentation
- Security scanning with CodeQL and dependency audits
- Performance monitoring with Core Web Vitals tracking
- Comprehensive test suite with 90%+ coverage
- Responsive web interface with dark mode support
- Static site generation with Next.js for optimal performance
- Plugin validation and metadata extraction
- Real-time data updates every 6 hours

### Changed
- Improved data integrity checks with SHA-256 verification
- Enhanced error handling and logging throughout the application
- Optimized bundle size and loading performance

### Fixed
- Resolved CI/CD pipeline issues for green builds
- Fixed React warnings in test suite
- Corrected TypeScript type definitions

### Security
- Implemented content security policy headers
- Added input validation for all user inputs
- Enabled automated dependency scanning
- No secrets in client-side code

### Documentation
- Comprehensive user and developer documentation
- API reference for all endpoints
- Security and maintenance guides
- Disaster recovery procedures
- Product requirements and task breakdowns

## [0.2.0] - Previous Release

### Added
- Initial marketplace discovery functionality
- Basic web interface
- GitHub API integration

### Notes
- Pre-release phase - not publicly deployed

---

## Versioning Scheme

- **Major (X.0.0)**: Breaking changes, major features
- **Minor (0.X.0)**: New features, backward compatible
- **Patch (0.0.X)**: Bug fixes, minor improvements
- **Pre-release**: `-alpha.X`, `-beta.X`, `-rc.X` for pre-release versions

---

## Links

- [GitHub Repository](https://github.com/shrwnsan/claude-marketplace-registry)
- [Live Demo](https://shrwnsan.github.io/claude-marketplace-registry)
- [Documentation](./docs)
- [Issue Tracker](https://github.com/shrwnsan/claude-marketplace-registry/issues)
