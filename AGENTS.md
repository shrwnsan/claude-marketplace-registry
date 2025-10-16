# AGENTS.md

This file provides guidance to AI agents (Claude Code, GitHub Copilot, etc.) when working with code in this repository.

## Project Overview

This is the **Claude Marketplace Aggregator** - an automated, open-source aggregator that discovers and curates Claude Code marketplaces and plugins from across GitHub. The project aims to be the definitive directory for the Claude Code plugin ecosystem.

### Vision & Mission

- **Vision**: Create an automated aggregator that discovers and curates Claude Code marketplaces and plugins
- **Mission**: Eliminate friction in plugin discovery by automatically finding marketplaces, validating plugins, and presenting them in a user-friendly interface

## Architecture & Technology Stack

### Core Components

1. **GitHub API Scanner**: Automated discovery of marketplaces and plugins
2. **Data Processing Pipeline**: Validation, quality scoring, and data enrichment
3. **Static Website**: Next.js-based frontend for browsing and discovery
4. **GitHub Actions**: Automated scanning, building, and deployment

### Technology Stack

- **Frontend**: Next.js 14, React 18, Tailwind CSS, shadcn/ui
- **Backend/Data Processing**: Node.js 18+, TypeScript
- **API Integration**: GitHub REST API v4
- **Infrastructure**: GitHub Pages (hosting), GitHub Actions (CI/CD)
- **Data Storage**: Git repository (JSON files)

### Data Models

The project works with two primary data structures:

**Marketplace Model** (`src/types/marketplace.ts`):
```typescript
interface Marketplace {
  id: string;
  name: string;
  description: string;
  owner: { name: string; url: string; type: 'User' | 'Organization' };
  repository: { url: string; stars: number; forks: number; /* ... */ };
  manifestUrl: string;
  plugins: Plugin[];
  tags: string[];
  verified: boolean;
  qualityScore: number;
  lastScanned: string;
  addedAt: string;
}
```

**Plugin Model** (`src/types/plugin.ts`):
```typescript
interface Plugin {
  id: string;
  name: string;
  description: string;
  source: { type: 'github' | 'url'; url: string; path?: string; };
  commands?: string[];
  agents?: string[];
  hooks?: Record<string, unknown>;
  mcpServers?: Record<string, unknown>;
  marketplaceId: string;
  validated: boolean;
  qualityScore: number;
}
```

## Development Commands

### Core Development Commands

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Run type checking
npm run type-check

# Run linting
npm run lint

# Fix linting issues
npm run lint:fix

# Run tests
npm test

# Scan GitHub for marketplaces (development)
npm run scan:marketplaces

# Validate plugin manifests
npm run validate:plugins

# Generate data files for website
npm run generate:data

# Full scanning pipeline (production)
npm run scan:full
```

### GitHub Actions Workflows

The project uses several automated workflows:

1. **`.github/workflows/scan.yml`**: Scheduled marketplace scanning (every 6 hours)
2. **`.github/workflows/ci.yml`**: Continuous integration on pull requests
3. **`.github/workflows/deploy.yml`**: Automatic deployment to GitHub Pages

## Key File Structure

```
├── src/
│   ├── types/           # TypeScript interfaces
│   │   ├── marketplace.ts
│   │   ├── plugin.ts
│   │   └── github.ts
│   ├── services/        # Business logic
│   │   ├── github-search.ts
│   │   ├── github-metadata.ts
│   │   └── quality-scoring.ts
│   ├── utils/           # Utility functions
│   │   ├── github-client.ts
│   │   ├── content-fetcher.ts
│   │   └── data-exporter.ts
│   ├── parsers/         # Data parsing
│   │   └── manifest-parser.ts
│   ├── components/      # React components
│   │   ├── layout/
│   │   ├── Search/
│   │   ├── Filters/
│   │   └── Marketplace/
│   ├── pages/           # Next.js pages
│   ├── hooks/           # React hooks
│   └── data/            # Static data and mock data
├── data/                # Generated JSON data
│   ├── marketplaces.json
│   ├── plugins.json
│   └── stats.json
├── .github/workflows/   # GitHub Actions
└── docs/               # Project documentation
```

## Development Patterns

### API Integration Patterns

- Use `@octokit/rest` for GitHub API interactions
- Implement proper rate limiting with exponential backoff
- Cache API responses to reduce GitHub API usage
- Handle authentication via environment variables (`GITHUB_TOKEN`)

### Data Processing Patterns

- Validate all plugin manifests against JSON schema
- Use TypeScript interfaces for type safety
- Implement quality scoring based on multiple factors (stars, age, completeness)
- Store data in JSON format for easy consumption by frontend

### Frontend Patterns

- Use Next.js static generation for optimal performance
- Implement responsive design with Tailwind CSS
- Use React hooks for state management and data fetching
- Follow accessibility best practices (WCAG 2.1 AA)

### Error Handling Patterns

- Implement comprehensive error handling for all API calls
- Use try-catch blocks with proper error logging
- Provide user-friendly error messages
- Implement retry logic with exponential backoff

## Environment Setup

### Required Environment Variables

```bash
# GitHub Personal Access Token (for API rate limits)
GITHUB_TOKEN=ghp_...

# Optional: Custom GitHub API URL
GITHUB_API_URL=https://api.github.com

# Optional: Node environment
NODE_ENV=production
```

### Development Setup

1. Fork the repository
2. Clone your fork locally
3. Install dependencies: `npm install`
4. Copy `.env.example` to `.env.local` and configure
5. Start development server: `npm run dev`

## Testing Strategy

### Unit Tests
- Test all utility functions and services
- Mock GitHub API responses for consistent testing
- Validate data parsing and transformation logic

### Integration Tests
- Test GitHub API integration with real data
- Validate end-to-end data processing pipeline
- Test website functionality with processed data

### Performance Tests
- Monitor API usage and rate limiting
- Test website load times with large datasets
- Validate GitHub Actions execution times

## Deployment & CI/CD

### GitHub Actions Pipeline

1. **Scan Workflow**: Runs every 6 hours to discover new marketplaces
2. **CI Workflow**: Runs on every push/PR to validate code
3. **Deploy Workflow**: Builds and deploys to GitHub Pages

### Deployment Process

1. Code is merged to main branch
2. GitHub Actions triggers build process
3. Next.js generates static site
4. Site is deployed to GitHub Pages
5. Data files are updated via scan workflow

## Security Considerations

- No personal data collection - only public GitHub repository information
- Read-only GitHub API access with proper authentication
- Input validation and sanitization for all user inputs
- Content Security Policy headers on website
- Regular dependency updates and vulnerability scanning

## Contributing Guidelines

### Code Style

- Use TypeScript for all new code
- Follow ESLint and Prettier configurations
- Use conventional commit messages (`feat:`, `fix:`, `docs:`, etc.)
- Write clear, descriptive variable and function names

### Pull Request Process

1. Create feature branch from main
2. Implement changes with comprehensive tests
3. Update documentation as needed
4. Create pull request with detailed description
5. Ensure CI/CD checks pass
6. Request code review
7. Address feedback and merge

### Development Workflow

- Work in feature branches for each task group
- Test each subtask independently before integration
- Commit frequently with clear messages
- Create detailed pull requests for review
- Tag releases with semantic versioning

## Performance Requirements

- **Website Load Time**: < 2 seconds
- **API Response Time**: < 5 seconds per marketplace
- **Data Freshness**: < 6 hours outdated
- **Uptime**: 99.9% availability
- **Mobile Performance**: Responsive design, < 3 seconds load

## Troubleshooting

### Common Issues

1. **GitHub API Rate Limiting**: Ensure `GITHUB_TOKEN` is properly configured
2. **Build Failures**: Check TypeScript compilation and linting errors
3. **Deployment Issues**: Verify GitHub Pages configuration and build output
4. **Data Processing Errors**: Check manifest file formats and validation rules

### Debugging Tips

- Use GitHub Actions logs to identify deployment issues
- Check browser console for frontend errors
- Monitor GitHub API usage in GitHub developer settings
- Validate JSON data files after processing

## Future Enhancements

### Phase 2 Features (Planned)
- Advanced semantic search capabilities
- Community rating and review system
- Enhanced quality scoring algorithms
- Analytics dashboard for ecosystem insights

### Phase 3 Features (Future)
- CLI tool integration with Claude Code
- Public API for third-party consumption
- Advanced security scanning
- Enterprise features and compliance tools

## Related Documentation

- **PRD**: `docs/prd-001-claude-marketplace-aggregator.md`
- **Research**: `docs/research-001-claude-code-plugins-ecosystem-analysis.md`
- **Development Tasks**: `docs/tasks-001-prd-claude-marketplace-aggregator.md`
- **LLM Pricing**: `docs/research-003-current-llm-pricing-openrouter.md`

## Contact & Support

- Create GitHub Issues for bug reports or feature requests
- Check existing documentation before asking questions
- Follow the contribution guidelines for code submissions
- Use the provided issue templates for consistent communication