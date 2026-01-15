// Mock data types
export interface MarketplacePlugin {
  id: string;
  name: string;
  description: string;
  category: string;
  tags: string[];
  author: string;
  authorUrl: string;
  repositoryUrl: string;
  stars: number;
  downloads: number;
  lastUpdated: string;
  version: string;
  license: string;
  marketplace: string;
  marketplaceUrl: string;
  featured: boolean;
  verified: boolean;
}

export interface Marketplace {
  id: string;
  name: string;
  description: string;
  url: string;
  repositoryUrl: string;
  owner: string;
  stars: number;
  plugins: MarketplacePlugin[];
  category: string;
  verified: boolean;
  featured: boolean;
}

// Mock marketplaces data
export const mockMarketplaces: Marketplace[] = [
  {
    id: 'official-claude-marketplace',
    name: 'Official Claude Marketplace',
    description:
      'The official marketplace for Claude Code plugins and extensions maintained by Anthropic.',
    url: 'https://claude.ai/marketplace',
    repositoryUrl: 'https://github.com/anthropic/claude-marketplace',
    owner: 'Anthropic',
    stars: 5420,
    plugins: [],
    category: 'Official',
    verified: true,
    featured: true,
  },
  {
    id: 'community-claude-plugins',
    name: 'Community Claude Plugins',
    description: 'A community-driven collection of Claude Code plugins and tools for developers.',
    url: 'https://community.claude-plugins.com',
    repositoryUrl: 'https://github.com/claude-community/plugins',
    owner: 'Claude Community',
    stars: 1280,
    plugins: [],
    category: 'Community',
    verified: false,
    featured: true,
  },
  {
    id: 'awesome-claude',
    name: 'Awesome Claude',
    description: 'A curated list of awesome Claude Code resources, plugins, and tools.',
    url: 'https://awesome-claude.com',
    repositoryUrl: 'https://github.com/awesome-claude/awesome-claude',
    owner: 'Awesome Claude',
    stars: 890,
    plugins: [],
    category: 'Curated',
    verified: true,
    featured: false,
  },
];

// Mock plugins data
export const mockPlugins: MarketplacePlugin[] = [
  {
    id: 'code-review-assistant',
    name: 'Code Review Assistant',
    description:
      'Automated code review suggestions and best practices enforcement for various programming languages.',
    category: 'Development Tools',
    tags: ['code-review', 'automation', 'best-practices', 'quality-assurance'],
    author: 'Claude Dev Team',
    authorUrl: 'https://github.com/claude-dev',
    repositoryUrl: 'https://github.com/claude-dev/code-review-assistant',
    stars: 856,
    downloads: 12450,
    lastUpdated: '2024-10-15',
    version: '2.1.0',
    license: 'MIT',
    marketplace: 'Official Claude Marketplace',
    marketplaceUrl: 'https://claude.ai/marketplace/plugins/code-review-assistant',
    featured: true,
    verified: true,
  },
  {
    id: 'api-documentation-generator',
    name: 'API Documentation Generator',
    description:
      'Automatically generate comprehensive API documentation from code comments and OpenAPI specs.',
    category: 'Documentation',
    tags: ['api', 'documentation', 'openapi', 'auto-generation'],
    author: 'DocGen Inc',
    authorUrl: 'https://github.com/docgen',
    repositoryUrl: 'https://github.com/docgen/api-docs-generator',
    stars: 432,
    downloads: 6780,
    lastUpdated: '2024-10-12',
    version: '1.8.2',
    license: 'Apache-2.0',
    marketplace: 'Community Claude Plugins',
    marketplaceUrl: 'https://community.claude-plugins.com/plugins/api-docs-generator',
    featured: false,
    verified: false,
  },
  {
    id: 'database-schema-analyzer',
    name: 'Database Schema Analyzer',
    description:
      'Analyze and optimize database schemas with AI-powered suggestions for performance improvements.',
    category: 'Database',
    tags: ['database', 'sql', 'schema', 'optimization', 'performance'],
    author: 'DBTools Co',
    authorUrl: 'https://github.com/dbtools',
    repositoryUrl: 'https://github.com/dbtools/schema-analyzer',
    stars: 298,
    downloads: 4230,
    lastUpdated: '2024-10-10',
    version: '1.3.1',
    license: 'MIT',
    marketplace: 'Official Claude Marketplace',
    marketplaceUrl: 'https://claude.ai/marketplace/plugins/db-schema-analyzer',
    featured: true,
    verified: true,
  },
  {
    id: 'unit-test-generator',
    name: 'Unit Test Generator',
    description:
      'Generate comprehensive unit tests for your codebase with intelligent test case suggestions.',
    category: 'Testing',
    tags: ['testing', 'unit-tests', 'tdd', 'automation'],
    author: 'TestGen Team',
    authorUrl: 'https://github.com/testgen',
    repositoryUrl: 'https://github.com/testgen/unit-test-generator',
    stars: 672,
    downloads: 9870,
    lastUpdated: '2024-10-14',
    version: '3.0.1',
    license: 'MIT',
    marketplace: 'Community Claude Plugins',
    marketplaceUrl: 'https://community.claude-plugins.com/plugins/unit-test-generator',
    featured: false,
    verified: false,
  },
  {
    id: 'security-audit-scanner',
    name: 'Security Audit Scanner',
    description:
      'Comprehensive security vulnerability scanning and remediation suggestions for your codebase.',
    category: 'Security',
    tags: ['security', 'vulnerability', 'audit', 'compliance'],
    author: 'SecureCode Labs',
    authorUrl: 'https://github.com/securecode',
    repositoryUrl: 'https://github.com/securecode/security-scanner',
    stars: 1245,
    downloads: 18900,
    lastUpdated: '2024-10-16',
    version: '4.2.0',
    license: 'GPL-3.0',
    marketplace: 'Official Claude Marketplace',
    marketplaceUrl: 'https://claude.ai/marketplace/plugins/security-audit-scanner',
    featured: true,
    verified: true,
  },
  {
    id: 'react-component-builder',
    name: 'React Component Builder',
    description:
      'Build React components with TypeScript, accessibility features, and modern best practices.',
    category: 'Frontend',
    tags: ['react', 'typescript', 'components', 'ui', 'accessibility'],
    author: 'ReactCraft',
    authorUrl: 'https://github.com/reactcraft',
    repositoryUrl: 'https://github.com/reactcraft/component-builder',
    stars: 523,
    downloads: 8120,
    lastUpdated: '2024-10-13',
    version: '2.5.3',
    license: 'MIT',
    marketplace: 'Community Claude Plugins',
    marketplaceUrl: 'https://community.claude-plugins.com/plugins/react-component-builder',
    featured: false,
    verified: false,
  },
];

// Categories for filtering
export const categories = [
  'All',
  'Development Tools',
  'Documentation',
  'Database',
  'Testing',
  'Security',
  'Frontend',
  'Backend',
  'DevOps',
  'AI/ML',
  'Design',
];

// Statistics data
export const stats = {
  totalMarketplaces: mockMarketplaces.length,
  totalPlugins: mockPlugins.length,
  totalDownloads: mockPlugins.reduce((sum, plugin) => sum + plugin.downloads, 0),
  totalStars:
    mockPlugins.reduce((sum, plugin) => sum + plugin.stars, 0) +
    mockMarketplaces.reduce((sum, marketplace) => sum + marketplace.stars, 0),
  verifiedPlugins: mockPlugins.filter((plugin) => plugin.verified).length,
  featuredPlugins: mockPlugins.filter((plugin) => plugin.featured).length,
};

export default {
  mockMarketplaces,
  mockPlugins,
  categories,
  stats,
};
