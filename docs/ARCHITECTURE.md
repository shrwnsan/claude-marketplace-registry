# System Architecture

The Claude Marketplace Aggregator is a **static site generator** that discovers Claude Code marketplaces from GitHub and deploys to GitHub Pages.

## How It Works

```
GitHub API  →  Scan  →  Validate  →  Generate  →  Build  →  Deploy
   ↓            ↓          ↓           ↓           ↓          ↓
Repositories  data/    data/      public/     .next/    GitHub
              marketplaces/  plugins/   data/      out/      Pages
```

## Key Scripts

| Script | Purpose | Output |
|--------|---------|--------|
| `npm run scan:marketplaces` | Search GitHub for marketplace repos | `data/marketplaces/*.json` |
| `npm run validate:plugins` | Parse manifests, score quality | `data/plugins/*.json` |
| `npm run generate:data` | Combine data for website | `public/data/*.json` |
| `npm run build` | Build Next.js static site | `out/` |

## Directory Structure

```
scripts/           # Data pipeline scripts
src/
├── services/      # GitHub API, quality scoring
├── parsers/       # Manifest parsing
├── types/         # TypeScript interfaces (Marketplace, Plugin)
├── components/    # React components
└── utils/         # Helpers (content-fetcher, data-exporter)
pages/             # Next.js pages
data/              # Raw scan results (git-ignored in prod)
public/data/       # Generated JSON for website
```

## Data Models

**Marketplace**: Repository containing a `marketplace.json` with plugins
- id, name, description, owner, repository metadata, qualityScore

**Plugin**: Individual tool/agent from a marketplace
- id, name, source (github/url), commands, agents, mcpServers, qualityScore

See: [`src/types/marketplace.ts`](../src/types/marketplace.ts), [`src/types/plugin.ts`](../src/types/plugin.ts)

## Workflows

| Workflow | Trigger | Purpose |
|----------|---------|---------|
| `ci.yml` | Push/PR | Lint, typecheck, test, build |
| `deploy.yml` | Push to main | Deploy to GitHub Pages |
| `scan.yml` | Every 6 hours | Discover new marketplaces |
| `auto-pr-review.yml` | PR opened | Automated code review |

## Common Failure Modes

| Issue | Symptom | Fix |
|-------|---------|-----|
| GitHub rate limit | 403 errors in scan | Wait for reset; verify `GITHUB_TOKEN` |
| Invalid manifest | Plugin validation fails | Check marketplace.json schema |
| Build failure | TypeScript errors | Run `npm run type-check` locally |

## Making Changes

- **Add marketplace sources**: Modify search queries in `src/services/github-search.ts`
- **Change quality scoring**: Edit `src/services/quality-scoring.ts`
- **Update UI**: Components in `src/components/`, pages in `pages/`
- **Modify pipeline**: Scripts in `scripts/`

## Deployment

Automatic on push to `main`. Rollback by reverting the commit (GitHub Pages redeploys).

---

*Last verified: 2025-01-22*
