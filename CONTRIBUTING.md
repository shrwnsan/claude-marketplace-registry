# Contributing to Claude Marketplace Aggregator

Thank you for your interest in contributing to the Claude Marketplace Aggregator! This document provides comprehensive guidelines for contributors of all skill levels.

## Table of Contents

1. [Getting Started](#getting-started)
2. [Development Workflow](#development-workflow)
3. [Code Standards](#code-standards)
4. [Testing Guidelines](#testing-guidelines)
5. [Documentation](#documentation)
6. [Pull Request Process](#pull-request-process)
7. [Community Guidelines](#community-guidelines)
8. [Release Process](#release-process)

---

## Getting Started

### Prerequisites

- **Node.js**: 18.x or higher
- **npm**: 8.x or higher
- **Git**: Latest version
- **GitHub Account**: For collaboration and PRs
- **Code Editor**: VS Code recommended (with extensions)

### Quick Setup

1. **Fork the Repository**
   ```bash
   # Click "Fork" on GitHub, then clone your fork
   git clone https://github.com/YOUR_USERNAME/aggregator.git
   cd aggregator
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   # Copy environment template
   cp .env.example .env.local

   # Edit .env.local with your configuration
   # Add your GitHub token for API access
   ```

4. **Start Development Server**
   ```bash
   npm run dev
   ```

5. **Verify Setup**
   - Open [http://localhost:3000](http://localhost:3000)
   - Check that all pages load correctly
   - Run tests: `npm test`

### Recommended VS Code Extensions

```json
{
  "recommendations": [
    "ms-vscode.vscode-typescript-next",
    "esbenp.prettier-vscode",
    "dbaeumer.vscode-eslint",
    "bradlc.vscode-tailwindcss",
    "ms-vscode.vscode-json",
    "redhat.vscode-yaml",
    "github.vscode-pull-request-github"
  ]
}
```

---

## Development Workflow

### 1. Create an Issue

Before starting work, create or find an issue:

- **New Feature**: Create an enhancement issue
- **Bug Fix**: Create a bug report issue
- **Documentation**: Create a documentation issue
- **Question**: Use GitHub Discussions

Include:
- Clear description
- Acceptance criteria
- Implementation approach (if known)
- Screenshots/mockups (for UI changes)

### 2. Set Up Your Branch

```bash
# Sync with upstream
git remote add upstream https://github.com/claude-marketplace/aggregator.git
git fetch upstream
git checkout main
git merge upstream/main

# Create feature branch
git checkout -b feature/your-feature-name
# or
git checkout -b fix/issue-number-description
```

### 3. Development Process

#### Make Changes
- Follow code standards (see below)
- Make small, focused commits
- Write tests for new functionality
- Update documentation

#### Test Your Changes
```bash
# Run all tests
npm test

# Type checking
npm run type-check

# Linting
npm run lint

# Build verification
npm run build

# Format code
npm run format
```

#### Commit Guidelines
```bash
# Commit format: type(scope): description
git commit -m "feat(api): add health check endpoint"
git commit -m "fix(ui): resolve responsive layout issues"
git commit -m "docs(readme): update installation instructions"
git commit -m "test(scan): add plugin validation tests"
```

**Commit Types**:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks
- `perf`: Performance improvements
- `ci`: CI/CD changes

### 4. Create Pull Request

#### PR Requirements
- [ ] All tests pass
- [ ] Code follows style guidelines
- [ ] TypeScript types are valid
- [ ] Build succeeds
- [ ] Documentation is updated
- [ ] PR description is complete

#### PR Template
```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing completed
- [ ] Cross-browser testing (if UI changes)

## Checklist
- [ ] Code follows project style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] Build succeeds locally
- [ ] Ready for review

## Related Issues
Closes #issue-number
```

---

## Code Standards

### TypeScript Standards

#### Type Definitions
```typescript
// Good: Explicit types
interface Plugin {
  id: string;
  name: string;
  version: string;
  metadata: PluginMetadata;
}

// Good: Generic types
interface ApiResponse<T> {
  data: T;
  status: number;
  message: string;
}

// Avoid: 'any' type
// Instead: Use specific types or 'unknown'
```

#### Function Signatures
```typescript
// Good: Clear parameter and return types
async function fetchPlugins(
  category?: string,
  limit: number = 10
): Promise<Plugin[]> {
  // Implementation
}

// Good: Interface for complex objects
interface ScanOptions {
  query?: string;
  maxResults?: number;
  includeMetadata?: boolean;
}

function scanMarketplaces(options: ScanOptions): Promise<Marketplace[]> {
  // Implementation
}
```

#### Error Handling
```typescript
// Good: Specific error types
class ValidationError extends Error {
  constructor(
    message: string,
    public readonly field: string,
    public readonly value: unknown
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

// Good: Consistent error handling
try {
  const result = await riskyOperation();
  return result;
} catch (error) {
  if (error instanceof ValidationError) {
    logger.warn('Validation failed', { field: error.field, value: error.value });
    throw error;
  }
  logger.error('Unexpected error', { error });
  throw new InternalServerError('Operation failed');
}
```

### React/Next.js Standards

#### Component Structure
```typescript
// Good: Component with clear props interface
interface PluginCardProps {
  plugin: Plugin;
  onInstall?: (plugin: Plugin) => void;
  className?: string;
}

const PluginCard: React.FC<PluginCardProps> = ({
  plugin,
  onInstall,
  className
}) => {
  // Component logic
  return (
    <div className={cn('plugin-card', className)}>
      {/* JSX content */}
    </div>
  );
};

export default PluginCard;
```

#### Hooks Usage
```typescript
// Good: Custom hook with clear return type
interface UsePluginsResult {
  plugins: Plugin[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

function usePlugins(category?: string): UsePluginsResult {
  const [plugins, setPlugins] = useState<Plugin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Hook implementation

  return { plugins, loading, error, refetch };
}
```

### CSS/Tailwind Standards

#### Class Organization
```tsx
// Good: Consistent class ordering
<div className="
  flex items-center justify-between
  p-4 bg-white dark:bg-gray-800
  rounded-lg shadow-md
  hover:shadow-lg transition-shadow
">
  {/* Content */}
</div>

// Order: Layout -> Spacing -> Colors -> Borders -> Typography -> States
```

#### Responsive Design
```tsx
// Good: Mobile-first approach
<div className="
  w-full
  md:w-1/2
  lg:w-1/3
  p-2 sm:p-4
  text-sm sm:text-base
">
  {/* Content */}
</div>
```

### API Standards

#### REST API Endpoints
```typescript
// Good: Consistent API patterns
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
}

// Endpoint patterns
GET    /api/plugins          // List plugins
GET    /api/plugins/:id      // Get specific plugin
POST   /api/plugins          // Create plugin
PUT    /api/plugins/:id      // Update plugin
DELETE /api/plugins/:id      // Delete plugin
```

#### Error Responses
```typescript
// Good: Standardized error format
interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
  timestamp: string;
}
```

---

## Testing Guidelines

### Unit Testing

#### Test Structure
```typescript
describe('PluginValidator', () => {
  describe('validatePlugin', () => {
    it('should validate a correct plugin manifest', () => {
      const plugin = createValidPlugin();
      const result = PluginValidator.validate(plugin);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject plugin with missing required fields', () => {
      const plugin = createInvalidPlugin();
      const result = PluginValidator.validate(plugin);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Missing required field: name');
    });
  });
});
```

#### Test Utilities
```typescript
// Test factories for consistent test data
function createPlugin(overrides: Partial<Plugin> = {}): Plugin {
  return {
    id: 'test-plugin',
    name: 'Test Plugin',
    version: '1.0.0',
    author: 'Test Author',
    ...overrides
  };
}

// Mock data for API tests
const mockGitHubApiResponse = {
  items: [createMockRepository()],
  total_count: 1
};
```

### Integration Testing

#### API Testing
```typescript
describe('/api/health', () => {
  it('should return health status', async () => {
    const response = await fetch('/api/health');
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.status).toBe('healthy');
    expect(data.timestamp).toBeDefined();
  });
});
```

### E2E Testing

#### Playwright Testing
```typescript
test('user can search for plugins', async ({ page }) => {
  await page.goto('/');

  // Search for plugins
  await page.fill('[data-testid="search-input"]', 'database');
  await page.press('[data-testid="search-input"]', 'Enter');

  // Verify results
  await expect(page.locator('[data-testid="plugin-card"]')).toHaveCount(3);
  await expect(page.locator('text=Database Connector')).toBeVisible();
});
```

### Test Coverage

#### Coverage Goals
- **Statements**: 90%+
- **Branches**: 85%+
- **Functions**: 90%+
- **Lines**: 90%+

#### Coverage Commands
```bash
# Run tests with coverage
npm run test:coverage

# View coverage report
open coverage/lcov-report/index.html

# Check coverage thresholds
npm run test:coverage:check
```

---

## Documentation

### Code Documentation

#### JSDoc Comments
```typescript
/**
 * Fetches plugins from the GitHub API
 * @param category - Optional category filter
 * @param limit - Maximum number of plugins to return
 * @returns Promise resolving to array of plugins
 * @throws {ValidationError} When parameters are invalid
 * @example
 * ```typescript
 * const plugins = await fetchPlugins('database', 10);
 * ```
 */
async function fetchPlugins(
  category?: string,
  limit: number = 10
): Promise<Plugin[]> {
  // Implementation
}
```

#### README Updates
- Update feature lists
- Add new configuration options
- Include breaking changes
- Update contribution guidelines

### API Documentation

#### OpenAPI Specification
```yaml
paths:
  /api/plugins:
    get:
      summary: List all plugins
      parameters:
        - name: category
          in: query
          schema:
            type: string
      responses:
        200:
          description: List of plugins
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/Plugin'
```

#### Endpoint Examples
```typescript
// Request examples
const response = await fetch('/api/plugins?category=database&limit=10');
const plugins = await response.json();

// Response examples
{
  "success": true,
  "data": [
    {
      "id": "database-connector",
      "name": "Database Connector",
      "version": "1.2.0"
    }
  ],
  "timestamp": "2024-01-01T00:00:00Z"
}
```

---

## Pull Request Process

### Before Submitting

1. **Self-Review**
   - Code follows style guidelines
   - Tests are comprehensive
   - Documentation is updated
   - No console.log statements
   - No commented-out code

2. **Local Testing**
   ```bash
   npm run lint
   npm run type-check
   npm run test
   npm run build
   ```

3. **Update Documentation**
   - README changes
   - API documentation
   - Code comments
   - Changelog entries

### PR Review Process

#### Reviewer Checklist
- [ ] Code is well-structured and readable
- [ ] Tests are comprehensive and passing
- [ ] TypeScript types are correct
- [ ] Security considerations addressed
- [ ] Performance impact assessed
- [ ] Documentation is updated
- [ ] Breaking changes are documented

#### Approval Requirements
- **Code Changes**: At least 1 reviewer approval
- **Breaking Changes**: At least 2 reviewer approvals
- **Security Changes**: Security team review required
- **Infrastructure Changes**: Infrastructure team review required

### Merging Process

1. **Automated Checks**
   - All CI checks must pass
   - Code coverage requirements met
   - Security scan passes
   - Build succeeds

2. **Merge Methods**
   - **Squash and Merge**: For most PRs
   - **Create Merge Commit**: For significant feature branches
   - **Rebase and Merge**: Rare, for hotfixes

3. **Post-Merge**
   - Delete feature branch
   - Update project documentation
   - Notify team of changes
   - Monitor deployment

---

## Community Guidelines

### Code of Conduct

#### Our Pledge
- Be inclusive and respectful
- Welcome newcomers and help them learn
- Focus on constructive feedback
- Assume good intentions

#### Expected Behavior
- Use welcoming and inclusive language
- Respect different viewpoints and experiences
- Gracefully accept constructive criticism
- Focus on what is best for the community

#### Unacceptable Behavior
- Harassment or discrimination
- Personal attacks or insults
- Spam or unnecessary noise
- Sharing private information

### Communication Channels

#### GitHub
- **Issues**: Bug reports and feature requests
- **Discussions**: Questions and general discussion
- **Pull Requests**: Code contributions
- **Reviews**: Code review feedback

#### Discord/Slack
- **#general**: Community discussion
- **#help**: Support and questions
- **#dev**: Development discussion
- **#announcements**: Project updates

### Getting Help

#### For Contributors
- **New Contributors**: Check `good-first-issue` label
- **Questions**: Use GitHub Discussions
- **Mentorship**: Request help in PR descriptions
- **Documentation**: Read project docs thoroughly

#### For Users
- **Bug Reports**: Create detailed issue
- **Feature Requests**: Use issue templates
- **Questions**: Use GitHub Discussions
- **Support**: Check documentation first

---

## Release Process

### Version Management

#### Semantic Versioning
- **Major (X.0.0)**: Breaking changes
- **Minor (X.Y.0)**: New features (backward compatible)
- **Patch (X.Y.Z)**: Bug fixes (backward compatible)

#### Release Types
- **Stable Releases**: Production-ready features
- **Beta Releases**: Feature testing
- **Alpha Releases**: Early development

### Release Checklist

#### Pre-Release
- [ ] All tests passing
- [ ] Documentation updated
- [ ] CHANGELOG updated
- [ ] Security review completed
- [ ] Performance testing done

#### Release Process
```bash
# Update version
npm version patch  # or minor/major

# Generate changelog
npm run changelog

# Create release tag
git tag -a v1.2.3 -m "Release v1.2.3"
git push origin v1.2.3

# Deploy to production
npm run deploy
```

#### Post-Release
- [ ] Monitor deployment
- [ ] Check for regressions
- [ ] Update documentation
- [ ] Communicate release
- [ ] Handle any issues

### Hotfix Process

#### Emergency Fixes
```bash
# Create hotfix branch
git checkout -b hotfix/critical-issue

# Make minimal fix
# Update version (patch)
# Test thoroughly

# Merge to main
git checkout main
git merge hotfix/critical-issue
git tag -a v1.2.4 -m "Hotfix v1.2.4"

# Deploy immediately
git push origin main v1.2.4
npm run deploy
```

---

## Recognition

### Contributors Hall of Fame

All contributors are recognized in:
- **README.md**: Contributor list
- **Release Notes**: Feature attributions
- **Annual Report**: Top contributors
- **Community Events**: Contributor spotlights

### Types of Contributions

#### Code Contributions
- New features and improvements
- Bug fixes and patches
- Performance optimizations
- Refactoring and cleanup

#### Non-Code Contributions
- Documentation improvements
- Bug reports and testing
- Community support
- Design and UX improvements
- Translation and localization

### Getting Recognized

- **GitHub Profile**: Link to your portfolio
- **Blog Posts**: Write about your contributions
- **Conference Talks**: Present your work
- **Mentorship**: Help other contributors

---

## Need Help?

### Quick Help
- **Discord**: Join our community
- **GitHub Discussions**: Ask questions
- **Issues**: Report bugs or request features
- **Email**: claude-marketplace@example.com

### Resources
- [Project Documentation](./docs/)
- [API Reference](./docs/api.md)
- [Troubleshooting Guide](./docs/troubleshooting.md)
- [Architecture Overview](./docs/architecture.md)

Thank you for contributing to the Claude Marketplace Aggregator! Your contributions help make the Claude ecosystem better for everyone.

---

**Last Updated**: October 17, 2024
**Maintainers**: Claude Marketplace Team

For questions about contributing, please open an issue or start a discussion in the repository.