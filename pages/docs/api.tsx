import React, { useState } from 'react';
import Head from 'next/head';
import MainLayout from '@/components/layout/MainLayout';
import {
  Code,
  Copy,
  Check,
  Server,
  Shield,
  Zap,
  Database,
  Key,
  Globe,
  ChevronRight,
  Terminal,
  Package,
  BarChart,
} from 'lucide-react';
import { mockPlugins } from '@/data/mock-data';

const ApiDocumentation: React.FC = () => {
  const [copied, setCopied] = useState('');
  const [activeSection, setActiveSection] = useState('overview');

  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(type);
      setTimeout(() => setCopied(''), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const sections = [
    { id: 'overview', title: 'Overview', icon: Globe },
    { id: 'authentication', title: 'Authentication', icon: Key },
    { id: 'endpoints', title: 'API Endpoints', icon: Server },
    { id: 'examples', title: 'Examples', icon: Code },
    { id: 'rate-limiting', title: 'Rate Limiting', icon: Shield },
    { id: 'error-handling', title: 'Error Handling', icon: Zap },
  ];

  const apiEndpoints = [
    {
      method: 'GET',
      path: '/api/plugins',
      description: 'Get a list of all available plugins',
      parameters: [
        { name: 'category', type: 'string', description: 'Filter by category' },
        { name: 'tags', type: 'string', description: 'Filter by tags (comma-separated)' },
        { name: 'author', type: 'string', description: 'Filter by author' },
        { name: 'verified', type: 'boolean', description: 'Filter verified plugins only' },
        { name: 'featured', type: 'boolean', description: 'Filter featured plugins only' },
        { name: 'limit', type: 'integer', description: 'Number of results to return (max 100)' },
        { name: 'offset', type: 'integer', description: 'Number of results to skip' },
        {
          name: 'sort',
          type: 'string',
          description: 'Sort field (name, stars, downloads, updated, author, category)',
        },
        { name: 'order', type: 'string', description: 'Sort order (asc, desc)' },
      ],
      example: `GET /api/plugins?category=Development%20Tools&verified=true&sort=stars&order=desc&limit=10`,
    },
    {
      method: 'GET',
      path: '/api/marketplaces',
      description: 'Get a list of all available marketplaces',
      parameters: [
        { name: 'category', type: 'string', description: 'Filter by category' },
        { name: 'verified', type: 'boolean', description: 'Filter verified marketplaces only' },
        { name: 'featured', type: 'boolean', description: 'Filter featured marketplaces only' },
        { name: 'limit', type: 'integer', description: 'Number of results to return (max 100)' },
        { name: 'offset', type: 'integer', description: 'Number of results to skip' },
        { name: 'sort', type: 'string', description: 'Sort field (name, stars, category, owner)' },
        { name: 'order', type: 'string', description: 'Sort order (asc, desc)' },
      ],
      example: `GET /api/marketplaces?featured=true&sort=stars&order=desc&limit=5`,
    },
    {
      method: 'GET',
      path: '/api/search',
      description: 'Search for plugins and marketplaces',
      parameters: [
        { name: 'q', type: 'string', description: 'Search query (required)' },
        { name: 'type', type: 'string', description: 'Search type (plugins, marketplaces, all)' },
        { name: 'limit', type: 'integer', description: 'Number of results to return (max 100)' },
        { name: 'offset', type: 'integer', description: 'Number of results to skip' },
      ],
      example: `GET /api/search?q=code%20review&type=plugins&limit=10`,
    },
    {
      method: 'GET',
      path: '/api/analytics',
      description: 'Get analytics data (requires API key)',
      parameters: [
        {
          name: 'type',
          type: 'string',
          description:
            'Analytics type (overview, plugins, marketplaces, searches, pageviews, events)',
        },
        { name: 'timeRange', type: 'string', description: 'Time range (24h, 7d, 30d)' },
        { name: 'limit', type: 'string', description: 'Number of results to return' },
      ],
      example: `GET /api/analytics?type=overview&timeRange=7d`,
    },
  ];

  const codeExamples = [
    {
      title: 'JavaScript / Node.js',
      code: `// Fetch all verified plugins
const response = await fetch('https://claude-marketplace.vercel.app/api/plugins?verified=true&sort=stars&order=desc&limit=10');
const data = await response.json();

console.log('Top verified plugins:', data.plugins);`,
    },
    {
      title: 'Python',
      code: `import requests

# Search for plugins
response = requests.get(
    'https://claude-marketplace.vercel.app/api/search',
    params={'q': 'code review', 'type': 'plugins', 'limit': 10}
)
data = response.json()

print('Search results:', data['results'])`,
    },
    {
      title: 'cURL',
      code: `# Get featured marketplaces
curl -X GET "https://claude-marketplace.vercel.app/api/marketplaces?featured=true&sort=stars&order=desc&limit=5" \\
  -H "Accept: application/json"

# Search with query
curl -X GET "https://claude-marketplace.vercel.app/api/search?q=API%20documentation&type=plugins" \\
  -H "Accept: application/json"`,
    },
  ];

  return (
    <>
      <Head>
        <title>API Documentation - Claude Marketplace Aggregator</title>
        <meta
          name='description'
          content='Complete API documentation for the Claude Marketplace Aggregator'
        />
        <meta name='viewport' content='width=device-width, initial-scale=1' />
        <link rel='icon' href='/favicon.ico' />
      </Head>

      <MainLayout>
        {/* Header */}
        <section className='bg-gradient-to-br from-primary-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-900 dark:to-primary-900/20 py-16'>
          <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
            <div className='text-center'>
              <h1 className='text-4xl sm:text-5xl font-bold text-gray-900 dark:text-gray-100 mb-6'>
                API Documentation
              </h1>
              <p className='text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto'>
                Build amazing applications with the Claude Marketplace API. Access comprehensive
                data about plugins, marketplaces, and ecosystem analytics.
              </p>
            </div>
          </div>
        </section>

        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12'>
          <div className='grid grid-cols-1 lg:grid-cols-4 gap-8'>
            {/* Sidebar Navigation */}
            <div className='lg:col-span-1'>
              <nav className='sticky top-8 space-y-2'>
                {sections.map((section) => (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`w-full flex items-center space-x-3 px-4 py-3 text-left rounded-lg transition-colors ${
                      activeSection === section.id
                        ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 border-l-4 border-primary-500'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                    }`}
                  >
                    <section.icon className='w-5 h-5' />
                    <span className='font-medium'>{section.title}</span>
                  </button>
                ))}
              </nav>
            </div>

            {/* Main Content */}
            <div className='lg:col-span-3 space-y-12'>
              {/* Overview Section */}
              {activeSection === 'overview' && (
                <div>
                  <h2 className='text-3xl font-bold text-gray-900 dark:text-gray-100 mb-6 flex items-center'>
                    <Globe className='w-8 h-8 mr-3 text-primary-500' />
                    API Overview
                  </h2>

                  <div className='space-y-8'>
                    <div className='card'>
                      <h3 className='text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4'>
                        Welcome to the Claude Marketplace API
                      </h3>
                      <p className='text-gray-600 dark:text-gray-300 mb-6'>
                        The Claude Marketplace API provides programmatic access to our comprehensive
                        database of Claude Code plugins and marketplaces. Build powerful
                        integrations, analytics dashboards, and custom applications using our
                        RESTful API.
                      </p>

                      <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
                        <div className='text-center p-6 bg-primary-50 dark:bg-primary-900/20 rounded-lg'>
                          <Package className='w-12 h-12 text-primary-500 mx-auto mb-3' />
                          <div className='font-semibold text-gray-900 dark:text-gray-100 mb-2'>
                            {mockPlugins.length}+ Plugins
                          </div>
                          <div className='text-sm text-gray-600 dark:text-gray-400'>
                            Access comprehensive plugin data
                          </div>
                        </div>
                        <div className='text-center p-6 bg-green-50 dark:bg-green-900/20 rounded-lg'>
                          <Database className='w-12 h-12 text-green-500 mx-auto mb-3' />
                          <div className='font-semibold text-gray-900 dark:text-gray-100 mb-2'>
                            Real-time Data
                          </div>
                          <div className='text-sm text-gray-600 dark:text-gray-400'>
                            Always up-to-date information
                          </div>
                        </div>
                        <div className='text-center p-6 bg-blue-50 dark:bg-blue-900/20 rounded-lg'>
                          <BarChart className='w-12 h-12 text-blue-500 mx-auto mb-3' />
                          <div className='font-semibold text-gray-900 dark:text-gray-100 mb-2'>
                            Analytics
                          </div>
                          <div className='text-sm text-gray-600 dark:text-gray-400'>
                            Usage insights and trends
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className='card'>
                      <h3 className='text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4'>
                        Base URL
                      </h3>
                      <div className='bg-gray-900 text-gray-100 p-4 rounded-lg font-mono'>
                        <div className='flex items-center justify-between'>
                          <code>https://claude-marketplace.vercel.app/api</code>
                          <button
                            onClick={() =>
                              copyToClipboard(
                                'https://claude-marketplace.vercel.app/api',
                                'base-url'
                              )
                            }
                            className='text-gray-400 hover:text-white transition-colors'
                          >
                            {copied === 'base-url' ? (
                              <Check className='w-5 h-5' />
                            ) : (
                              <Copy className='w-5 h-5' />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className='card'>
                      <h3 className='text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4'>
                        Response Format
                      </h3>
                      <p className='text-gray-600 dark:text-gray-300 mb-4'>
                        All API responses are in JSON format with the following structure:
                      </p>
                      <div className='bg-gray-900 text-gray-100 p-4 rounded-lg font-mono text-sm overflow-x-auto'>
                        <pre>{`{
  "data": [...],
  "pagination": {
    "total": 100,
    "limit": 20,
    "offset": 0,
    "hasMore": true
  },
  "filters": {...},
  "sort": {
    "by": "stars",
    "order": "desc"
  }
}`}</pre>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Authentication Section */}
              {activeSection === 'authentication' && (
                <div>
                  <h2 className='text-3xl font-bold text-gray-900 dark:text-gray-100 mb-6 flex items-center'>
                    <Key className='w-8 h-8 mr-3 text-primary-500' />
                    Authentication
                  </h2>

                  <div className='space-y-8'>
                    <div className='card'>
                      <h3 className='text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4'>
                        API Key Authentication
                      </h3>
                      <p className='text-gray-600 dark:text-gray-300 mb-6'>
                        Some endpoints, particularly analytics endpoints, require an API key for
                        authentication. Include your API key in the request header:
                      </p>

                      <div className='bg-gray-900 text-gray-100 p-4 rounded-lg font-mono text-sm'>
                        <div className='flex items-center justify-between mb-3'>
                          <span className='text-gray-400'># HTTP Header</span>
                          <button
                            onClick={() =>
                              copyToClipboard('X-API-Key: your-api-key-here', 'auth-header')
                            }
                            className='text-gray-400 hover:text-white transition-colors'
                          >
                            {copied === 'auth-header' ? (
                              <Check className='w-5 h-5' />
                            ) : (
                              <Copy className='w-5 h-5' />
                            )}
                          </button>
                        </div>
                        <code>X-API-Key: your-api-key-here</code>
                      </div>
                    </div>

                    <div className='card'>
                      <h3 className='text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4'>
                        Getting an API Key
                      </h3>
                      <div className='space-y-4 text-gray-600 dark:text-gray-300'>
                        <p>To get an API key for accessing analytics and premium features:</p>
                        <ol className='list-decimal list-inside space-y-2 ml-4'>
                          <li>Sign up for a Claude Marketplace account</li>
                          <li>Navigate to your account settings</li>
                          <li>Generate an API key under the &quot;Developer&quot; section</li>
                          <li>Include the API key in your requests</li>
                        </ol>
                      </div>
                    </div>

                    <div className='card bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800'>
                      <h3 className='text-xl font-semibold text-yellow-800 dark:text-yellow-200 mb-4'>
                        <Shield className='w-6 h-6 inline mr-2' />
                        Security Best Practices
                      </h3>
                      <ul className='space-y-2 text-yellow-700 dark:text-yellow-300'>
                        <li>• Never expose your API key in client-side code</li>
                        <li>• Use environment variables to store API keys</li>
                        <li>• Implement proper error handling for rate limits</li>
                        <li>• Use HTTPS for all API requests</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* Endpoints Section */}
              {activeSection === 'endpoints' && (
                <div>
                  <h2 className='text-3xl font-bold text-gray-900 dark:text-gray-100 mb-6 flex items-center'>
                    <Server className='w-8 h-8 mr-3 text-primary-500' />
                    API Endpoints
                  </h2>

                  <div className='space-y-8'>
                    {apiEndpoints.map((endpoint, index) => (
                      <div key={index} className='card'>
                        <div className='flex items-center justify-between mb-4'>
                          <div className='flex items-center space-x-3'>
                            <span
                              className={`px-3 py-1 rounded-full text-sm font-mono ${
                                endpoint.method === 'GET'
                                  ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                  : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                              }`}
                            >
                              {endpoint.method}
                            </span>
                            <code className='text-lg font-mono text-gray-900 dark:text-gray-100'>
                              {endpoint.path}
                            </code>
                          </div>
                          <button
                            onClick={() => copyToClipboard(endpoint.example, `endpoint-${index}`)}
                            className='text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors'
                          >
                            {copied === `endpoint-${index}` ? (
                              <Check className='w-5 h-5' />
                            ) : (
                              <Copy className='w-5 h-5' />
                            )}
                          </button>
                        </div>

                        <p className='text-gray-600 dark:text-gray-300 mb-6'>
                          {endpoint.description}
                        </p>

                        <div className='mb-6'>
                          <h4 className='font-semibold text-gray-900 dark:text-gray-100 mb-3'>
                            Parameters
                          </h4>
                          <div className='overflow-x-auto'>
                            <table className='min-w-full divide-y divide-gray-200 dark:divide-gray-700'>
                              <thead>
                                <tr>
                                  <th className='px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase'>
                                    Name
                                  </th>
                                  <th className='px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase'>
                                    Type
                                  </th>
                                  <th className='px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase'>
                                    Description
                                  </th>
                                </tr>
                              </thead>
                              <tbody className='divide-y divide-gray-200 dark:divide-gray-700'>
                                {endpoint.parameters.map((param, paramIndex) => (
                                  <tr key={paramIndex}>
                                    <td className='px-4 py-2 text-sm font-mono text-gray-900 dark:text-gray-100'>
                                      {param.name}
                                    </td>
                                    <td className='px-4 py-2 text-sm text-gray-600 dark:text-gray-400'>
                                      {param.type}
                                    </td>
                                    <td className='px-4 py-2 text-sm text-gray-600 dark:text-gray-400'>
                                      {param.description}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>

                        <div>
                          <h4 className='font-semibold text-gray-900 dark:text-gray-100 mb-3'>
                            Example
                          </h4>
                          <div className='bg-gray-900 text-gray-100 p-4 rounded-lg font-mono text-sm overflow-x-auto'>
                            <code>{endpoint.example}</code>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Examples Section */}
              {activeSection === 'examples' && (
                <div>
                  <h2 className='text-3xl font-bold text-gray-900 dark:text-gray-100 mb-6 flex items-center'>
                    <Code className='w-8 h-8 mr-3 text-primary-500' />
                    Code Examples
                  </h2>

                  <div className='space-y-8'>
                    {codeExamples.map((example, index) => (
                      <div key={index} className='card'>
                        <h3 className='text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4'>
                          {example.title}
                        </h3>
                        <div className='bg-gray-900 text-gray-100 p-4 rounded-lg font-mono text-sm overflow-x-auto'>
                          <div className='flex items-center justify-between mb-3'>
                            <span className='text-gray-400'>Example code</span>
                            <button
                              onClick={() => copyToClipboard(example.code, `example-${index}`)}
                              className='text-gray-400 hover:text-white transition-colors'
                            >
                              {copied === `example-${index}` ? (
                                <Check className='w-5 h-5' />
                              ) : (
                                <Copy className='w-5 h-5' />
                              )}
                            </button>
                          </div>
                          <pre>{example.code}</pre>
                        </div>
                      </div>
                    ))}

                    <div className='card'>
                      <h3 className='text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4'>
                        Complete Example: Plugin Search Application
                      </h3>
                      <p className='text-gray-600 dark:text-gray-300 mb-6'>
                        Here&apos;s a complete example of a web application that searches for plugins:
                      </p>
                      <div className='bg-gray-900 text-gray-100 p-4 rounded-lg font-mono text-sm overflow-x-auto max-h-96 overflow-y-auto'>
                        <pre>{`<!DOCTYPE html>
<html>
<head>
    <title>Claude Plugin Search</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        .plugin { border: 1px solid #ddd; padding: 15px; margin: 10px 0; border-radius: 5px; }
        .plugin h3 { margin: 0 0 10px 0; color: #333; }
        .plugin p { margin: 0; color: #666; }
        .search { margin-bottom: 20px; }
        input { padding: 8px; width: 300px; margin-right: 10px; }
        button { padding: 8px 15px; background: #0070f3; color: white; border: none; border-radius: 3px; cursor: pointer; }
    </style>
</head>
<body>
    <h1>Claude Plugin Search</h1>

    <div class="search">
        <input type="text" id="searchInput" placeholder="Search plugins...">
        <button onclick="searchPlugins()">Search</button>
    </div>

    <div id="results"></div>

    <script>
        async function searchPlugins() {
            const query = document.getElementById('searchInput').value;
            const resultsDiv = document.getElementById('results');

            if (!query) {
                resultsDiv.innerHTML = '<p>Please enter a search term</p>';
                return;
            }

            try {
                const response = await fetch(\`/api/search?q=\${encodeURIComponent(query)}&type=plugins&limit=10\`);
                const data = await response.json();

                if (data.results.plugins.length === 0) {
                    resultsDiv.innerHTML = '<p>No plugins found</p>';
                    return;
                }

                resultsDiv.innerHTML = data.results.plugins.map(plugin => \`
                    <div class="plugin">
                        <h3>\${plugin.name}</h3>
                        <p>\${plugin.description}</p>
                        <p><strong>Author:</strong> \${plugin.author}</p>
                        <p><strong>Category:</strong> \${plugin.category}</p>
                        <p><strong>Stars:</strong> \${plugin.stars} | <strong>Downloads:</strong> \${plugin.downloads}</p>
                    </div>
                \`).join('');

            } catch (error) {
                resultsDiv.innerHTML = '<p>Error fetching results. Please try again.</p>';
            }
        }

        // Search on Enter key
        document.getElementById('searchInput').addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                searchPlugins();
            }
        });
    </script>
</body>
</html>`}</pre>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Rate Limiting Section */}
              {activeSection === 'rate-limiting' && (
                <div>
                  <h2 className='text-3xl font-bold text-gray-900 dark:text-gray-100 mb-6 flex items-center'>
                    <Shield className='w-8 h-8 mr-3 text-primary-500' />
                    Rate Limiting
                  </h2>

                  <div className='space-y-8'>
                    <div className='card'>
                      <h3 className='text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4'>
                        API Rate Limits
                      </h3>
                      <div className='space-y-4 text-gray-600 dark:text-gray-300'>
                        <p>
                          To ensure fair usage and maintain service quality, the API implements rate
                          limiting:
                        </p>

                        <div className='overflow-x-auto'>
                          <table className='min-w-full divide-y divide-gray-200 dark:divide-gray-700'>
                            <thead>
                              <tr>
                                <th className='px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase'>
                                  Plan
                                </th>
                                <th className='px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase'>
                                  Requests/Minute
                                </th>
                                <th className='px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase'>
                                  Requests/Hour
                                </th>
                                <th className='px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase'>
                                  Requests/Day
                                </th>
                              </tr>
                            </thead>
                            <tbody className='divide-y divide-gray-200 dark:divide-gray-700'>
                              <tr>
                                <td className='px-4 py-3 text-sm font-medium text-gray-900 dark:text-gray-100'>
                                  Free
                                </td>
                                <td className='px-4 py-3 text-sm text-gray-600 dark:text-gray-400'>
                                  60
                                </td>
                                <td className='px-4 py-3 text-sm text-gray-600 dark:text-gray-400'>
                                  1,000
                                </td>
                                <td className='px-4 py-3 text-sm text-gray-600 dark:text-gray-400'>
                                  10,000
                                </td>
                              </tr>
                              <tr>
                                <td className='px-4 py-3 text-sm font-medium text-gray-900 dark:text-gray-100'>
                                  Pro
                                </td>
                                <td className='px-4 py-3 text-sm text-gray-600 dark:text-gray-400'>
                                  300
                                </td>
                                <td className='px-4 py-3 text-sm text-gray-600 dark:text-gray-400'>
                                  10,000
                                </td>
                                <td className='px-4 py-3 text-sm text-gray-600 dark:text-gray-400'>
                                  100,000
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>

                    <div className='card'>
                      <h3 className='text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4'>
                        Rate Limit Headers
                      </h3>
                      <p className='text-gray-600 dark:text-gray-300 mb-6'>
                        Each API response includes rate limit information in the headers:
                      </p>
                      <div className='bg-gray-900 text-gray-100 p-4 rounded-lg font-mono text-sm'>
                        <pre>{`X-RateLimit-Limit: 60
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 1640995200`}</pre>
                      </div>
                    </div>

                    <div className='card bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800'>
                      <h3 className='text-xl font-semibold text-blue-800 dark:text-blue-200 mb-4'>
                        Best Practices
                      </h3>
                      <ul className='space-y-2 text-blue-700 dark:text-blue-300'>
                        <li>• Implement exponential backoff for retry logic</li>
                        <li>• Cache responses when appropriate</li>
                        <li>• Monitor rate limit headers in your application</li>
                        <li>• Use pagination to reduce the number of requests</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* Error Handling Section */}
              {activeSection === 'error-handling' && (
                <div>
                  <h2 className='text-3xl font-bold text-gray-900 dark:text-gray-100 mb-6 flex items-center'>
                    <Zap className='w-8 h-8 mr-3 text-primary-500' />
                    Error Handling
                  </h2>

                  <div className='space-y-8'>
                    <div className='card'>
                      <h3 className='text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4'>
                        HTTP Status Codes
                      </h3>
                      <div className='space-y-4'>
                        {[
                          { code: '200', message: 'OK', description: 'Request successful' },
                          {
                            code: '400',
                            message: 'Bad Request',
                            description: 'Invalid request parameters',
                          },
                          {
                            code: '401',
                            message: 'Unauthorized',
                            description: 'Missing or invalid API key',
                          },
                          { code: '404', message: 'Not Found', description: 'Resource not found' },
                          {
                            code: '429',
                            message: 'Too Many Requests',
                            description: 'Rate limit exceeded',
                          },
                          {
                            code: '500',
                            message: 'Internal Server Error',
                            description: 'Server error',
                          },
                        ].map((status, index) => (
                          <div
                            key={index}
                            className='flex items-start space-x-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg'
                          >
                            <div
                              className={`px-3 py-1 rounded-full text-sm font-mono ${
                                status.code.startsWith('2')
                                  ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                  : status.code.startsWith('4')
                                    ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                                    : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                              }`}
                            >
                              {status.code}
                            </div>
                            <div className='flex-1'>
                              <div className='font-medium text-gray-900 dark:text-gray-100'>
                                {status.message}
                              </div>
                              <div className='text-sm text-gray-600 dark:text-gray-400'>
                                {status.description}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className='card'>
                      <h3 className='text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4'>
                        Error Response Format
                      </h3>
                      <p className='text-gray-600 dark:text-gray-300 mb-6'>
                        Error responses follow this consistent format:
                      </p>
                      <div className='bg-gray-900 text-gray-100 p-4 rounded-lg font-mono text-sm'>
                        <pre>{`{
  "error": "Error type",
  "message": "Human-readable error message",
  "details": "Additional error details",
  "timestamp": "2024-01-15T10:30:00Z"
}`}</pre>
                      </div>
                    </div>

                    <div className='card'>
                      <h3 className='text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4'>
                        Handling Rate Limit Errors
                      </h3>
                      <div className='bg-gray-900 text-gray-100 p-4 rounded-lg font-mono text-sm overflow-x-auto'>
                        <pre>{`// JavaScript example with retry logic
async function fetchWithRetry(url, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(url);

      if (response.ok) {
        return response.json();
      }

      if (response.status === 429) {
        const resetTime = parseInt(response.headers.get('X-RateLimit-Reset'));
        const waitTime = Math.max(0, resetTime * 1000 - Date.now());

        console.log(\`Rate limited. Waiting \${waitTime}ms...\`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        continue;
      }

      throw new Error(\`HTTP error! status: \${response.status}\`);

    } catch (error) {
      if (i === maxRetries - 1) throw error;

      // Exponential backoff
      const delay = Math.pow(2, i) * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}`}</pre>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <section className='py-16 bg-gradient-to-r from-primary-600 to-primary-700 dark:from-primary-700 dark:to-primary-800'>
          <div className='max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center'>
            <h2 className='text-3xl font-bold text-white mb-6'>
              Ready to Build Something Amazing?
            </h2>
            <p className='text-xl text-primary-100 mb-8'>
              Get started with the Claude Marketplace API and create powerful integrations.
            </p>
            <div className='flex flex-col sm:flex-row gap-4 justify-center'>
              <a
                href='/api/plugins'
                target='_blank'
                rel='noopener noreferrer'
                className='btn bg-white text-primary-600 hover:bg-gray-50 font-medium px-6 py-3 text-base group'
              >
                <Terminal className='w-5 h-5 mr-2' />
                Try the API
                <ChevronRight className='w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform' />
              </a>
              <a
                href='mailto:support@claude-marketplace.com'
                className='btn border-2 border-white text-white hover:bg-white hover:text-primary-600 font-medium px-6 py-3 text-base'
              >
                Get Support
              </a>
            </div>
          </div>
        </section>
      </MainLayout>
    </>
  );
};

export default ApiDocumentation;
