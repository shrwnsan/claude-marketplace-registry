# Claude Code Guidelines

## Project Overview

Claude Marketplace Aggregator - An automated aggregator that discovers and curates Claude Code plugins and marketplaces from GitHub.

**Tech Stack:**
- **Framework:** Next.js 14.2.5 with Pages Router (`pages/` directory structure)
- **Language:** TypeScript (strict mode enabled)
- **Styling:** Tailwind CSS
- **Data:** GitHub API integration, JSON data files
- **Deployment:** GitHub Pages (static export)

## Code Style

### General Principles
- **Avoid "AI slop"** — generic component grids, meaningless abstractions, over-engineering
- **Prefer simple, direct solutions** over clever ones
- **Match existing patterns** in the codebase before introducing new patterns
- **Delete dead code** rather than commenting it out

### TypeScript Specifics
- **Strict mode is enabled** - All code must pass type checking
- **Use proper typing** for function parameters, return types, and component props
- **Avoid `any`** - Use proper types or `unknown` with type guards
- **Prefer interfaces** for object shapes that extend across files
- **Use type imports** sparingly; prefer inline types for component-local shapes

### React/Next.js Patterns
- **Functional components** with hooks (no class components)
- **Proper dependency arrays** in `useEffect`, `useMemo`, `useCallback`
- **Client components**: Use `'use client'` directive at top of file when needed
- **Loading states**: Use proper loading skeletons, not just "loading..." text
- **Error boundaries**: Implement where appropriate for better UX

## Project-Specific Rules

### File Operations
- **Use `trash` command** instead of `rm -rf` for safe file deletion
- **Never commit secrets** - Check `.gitignore` before committing
- **Follow Conventional Commits** format: `type(scope): description`

### Data Handling
- **Real data preferred**: Use `useRealMarketplaceData()` hook with mock data fallback
- **Static JSON files**: Data files in `public/data/` for static export compatibility
- **GitHub API integration**: Use official `octokit` or `gh` CLI via API calls

### Git Workflow
- **Branch from main** for new features
- **Small, reviewable commits** with clear messages
- **Push to origin** for PR creation
- **Never force push** to shared branches

## Review Criteria

When reviewing code (automated or manual), focus on:

### Security (Critical)
- Injection vulnerabilities (SQL, command, XSS)
- Hardcoded secrets or API keys
- Authentication/authorization flaws
- Input validation and sanitization

### Code Quality (High)
- Type safety and proper error handling
- Memory leaks or resource cleanup issues
- Performance anti-patterns
- Breaking changes (API modifications, removed exports)

### Code Quality (Medium)
- Unused variables, imports, or dead code
- Missing JSDoc for public APIs
- Inconsistent naming conventions
- Code that could be simplified

### Style (Low)
- Formatting issues (let Prettier handle)
- Minor naming improvements
- Documentation gaps in non-public code

## Preferred Patterns

### Component Structure
```typescript
// Good: Clear typing, proper hooks usage
interface MyComponentProps {
  title: string;
  onAction: () => void;
}

export function MyComponent({ title, onAction }: MyComponentProps) {
  const [loading, setLoading] = useState(false);

  const handleClick = useCallback(() => {
    onAction();
  }, [onAction]);

  return <button onClick={handleClick}>{title}</button>;
}
```

### Data Fetching
```typescript
// Good: Real data with fallback
const { data, loading, error } = useRealMarketplaceData();
const marketplaces = data?.marketplaces || mockMarketplaces;
```

### Error Handling
```typescript
// Good: Proper error types and handling
try {
  const result = await fetchData();
} catch (error) {
  if (error instanceof Error) {
    console.error('Failed to fetch:', error.message);
  }
  throw error;
}
```

## What NOT to Do

- **Don't create generic abstractions** without clear use cases
- **Don't add comments** that state the obvious (e.g., "This is a function")
- **Don't leave TODO/FIXME** in production code without creating issues
- **Don't use `any`** to bypass type checking
- **Don't modify workflow files** (`**/.github/workflows/**`) without understanding the implications

## External Contributions

For external contributors using `@claude`:
- **Ask before making major architectural changes**
- **Follow existing code patterns** in the files you modify
- **Include tests** for new functionality when appropriate
- **Update documentation** when changing behavior

## Repository Context

**Purpose:** Discover and showcase Claude Code plugins and marketplaces
**Primary Users:** Developers looking for Claude Code extensions
**Data Sources:** GitHub API (marketplaces, repositories)
**Deployment:** GitHub Pages with static export

**Key Files:**
- `pages/index.tsx` - Homepage with ecosystem stats
- `pages/marketplaces/index.tsx` - Marketplace listing
- `src/components/` - Reusable components
- `src/services/` - External API integrations
- `.github/workflows/claude-code.yml` - Automated review workflow

For more details, see the [README](../README.md) and [Architecture Documentation](../docs/ref/ARCHITECTURE.md).
