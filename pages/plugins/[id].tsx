import React, { useState, useEffect, useMemo } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Link from 'next/link';
import MainLayout from '@/components/layout/MainLayout';
import {
  Star,
  Download,
  Github,
  ExternalLink,
  Users,
  Package,
  Shield,
  Terminal,
  Copy,
  Check,
  Share2,
  MessageSquare,
  FileText,
  AlertTriangle,
  CheckCircle,
  GitBranch,
  GitCommit,
  User,
  Book,
  Zap,
  Lock,
  ChevronRight,
  ArrowLeft,
} from 'lucide-react';
import { mockPlugins, mockMarketplaces } from '@/data/mock-data';

const PluginDetailPage: React.FC = () => {
  const router = useRouter();
  const { id } = router.query;
  const [copied, setCopied] = useState('');
  const [rating, setRating] = useState(0);
  const [userRating, setUserRating] = useState(0);
  const [activeTab, setActiveTab] = useState<'overview' | 'installation' | 'usage' | 'security'>(
    'overview'
  );
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', message: '' });

  // Find plugin by ID
  const plugin = useMemo(() => {
    return mockPlugins.find((p) => p.id === id);
  }, [id]);

  // Find marketplace
  const marketplace = useMemo(() => {
    if (!plugin) return null;
    return mockMarketplaces.find((m) => m.name === plugin.marketplace);
  }, [plugin]);

  // Find related plugins
  const relatedPlugins = useMemo(() => {
    if (!plugin) return [];
    return mockPlugins
      .filter(
        (p) =>
          p.id !== plugin.id &&
          (p.category === plugin.category ||
            p.tags.some((tag) => plugin.tags?.includes(tag)) ||
            p.author === plugin.author)
      )
      .slice(0, 6);
  }, [plugin]);

  // Mock additional plugin data for demonstration
  const pluginDetails = useMemo(() => {
    if (!plugin) return null;

    return {
      commands: [
        `${plugin.name.toLowerCase().replace(/\s+/g, '-')} --help`,
        `${plugin.name.toLowerCase().replace(/\s+/g, '-')} install`,
        `${plugin.name.toLowerCase().replace(/\s+/g, '-')} config --set`,
        `${plugin.name.toLowerCase().replace(/\s+/g, '-')} run --verbose`,
      ],
      agents: ['code-reviewer', 'documentation-generator', 'test-automation', 'security-analyzer'],
      hooks: {
        'pre-commit': 'Runs automated checks before commit',
        'pre-push': 'Validates code before pushing',
        'post-checkout': 'Sets up environment after checkout',
      },
      mcpServers: {
        main: {
          command: `${plugin.name.toLowerCase().replace(/\s+/g, '-')}`,
          args: ['--server'],
          description: 'Main MCP server for plugin functionality',
        },
      },
      securityMetrics: {
        vulnerabilities: Math.floor(Math.random() * 3),
        dependencies: Math.floor(Math.random() * 50) + 10,
        licenseCheck:
          plugin.license === 'MIT' || plugin.license === 'Apache-2.0' ? 'pass' : 'warning',
        securityScore: Math.floor(Math.random() * 30) + 70,
      },
      githubStats: {
        commits: Math.floor(Math.random() * 500) + 50,
        contributors: Math.floor(Math.random() * 20) + 1,
        lastCommit: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
        defaultBranch: 'main',
        openIssues: Math.floor(Math.random() * 10),
        closedIssues: Math.floor(Math.random() * 50) + 10,
      },
    };
  }, [plugin]);

  // Load saved rating from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined' && plugin) {
      const savedRating = localStorage.getItem(`rating-plugin-${plugin.id}`);
      if (savedRating) {
        setUserRating(parseInt(savedRating));
      }

      // Load average rating (mock data for now)
      const avgRating = localStorage.getItem(`avg-rating-plugin-${plugin.id}`);
      if (avgRating) {
        setRating(parseFloat(avgRating));
      } else {
        // Mock average rating
        const mockRating = 3.5 + Math.random() * 1.5;
        setRating(mockRating);
        localStorage.setItem(`avg-rating-plugin-${plugin.id}`, mockRating.toString());
      }
    }
  }, [plugin]);

  const copyToClipboard = async (text: string, type: string = '') => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(type);
      setTimeout(() => setCopied(''), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleRating = (newRating: number) => {
    setUserRating(newRating);
    if (typeof window !== 'undefined' && plugin) {
      localStorage.setItem(`rating-plugin-${plugin.id}`, newRating.toString());

      // Update average rating (simple calculation)
      const newAvgRating = (rating + newRating) / 2;
      setRating(newAvgRating);
      localStorage.setItem(`avg-rating-plugin-${plugin.id}`, newAvgRating.toString());
    }
  };

  const sharePlugin = async () => {
    if (navigator.share && plugin) {
      try {
        await navigator.share({
          title: plugin.name,
          text: plugin.description,
          url: window.location.href,
        });
      } catch (err) {
        console.log('Error sharing:', err);
      }
    } else {
      copyToClipboard(window.location.href, 'url');
    }
  };

  const submitFeedback = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, this would send feedback to a server
    console.log('Feedback submitted:', feedback);
    setShowFeedbackForm(false);
    setFeedback({ type: '', message: '' });
  };

  const getInstallCommand = () => {
    if (!plugin) return '';
    return `claude install ${plugin.name.toLowerCase().replace(/\s+/g, '-')}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getSecurityLevel = (score: number) => {
    if (score >= 90) return { level: 'Excellent', color: 'text-green-600', bg: 'bg-green-100' };
    if (score >= 70) return { level: 'Good', color: 'text-blue-600', bg: 'bg-blue-100' };
    if (score >= 50) return { level: 'Fair', color: 'text-yellow-600', bg: 'bg-yellow-100' };
    return { level: 'Poor', color: 'text-red-600', bg: 'bg-red-100' };
  };

  if (!plugin || !pluginDetails) {
    return (
      <MainLayout>
        <div className='min-h-screen flex items-center justify-center'>
          <div className='text-center'>
            <div className='text-gray-400 dark:text-gray-500 mb-6'>
              <Package className='w-16 h-16 mx-auto' />
            </div>
            <h1 className='text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-3'>
              Plugin not found
            </h1>
            <p className='text-gray-600 dark:text-gray-400 mb-8'>
              The plugin you&apos;re looking for doesn&apos;t exist or has been removed.
            </p>
            <Link href='/' className='btn btn-primary'>
              <ArrowLeft className='w-4 h-4 mr-2' />
              Back to Home
            </Link>
          </div>
        </div>
      </MainLayout>
    );
  }

  const securityLevel = getSecurityLevel(pluginDetails.securityMetrics.securityScore);

  return (
    <>
      <Head>
        <title>{plugin.name} - Claude Plugin Marketplace</title>
        <meta name='description' content={plugin.description} />
        <meta name='viewport' content='width=device-width, initial-scale=1' />
        <link rel='icon' href='/favicon.ico' />

        {/* Open Graph tags */}
        <meta property='og:title' content={plugin.name} />
        <meta property='og:description' content={plugin.description} />
        <meta property='og:type' content='website' />
        <meta
          property='og:url'
          content={typeof window !== 'undefined' ? window.location.href : ''}
        />
        <meta
          property='og:image'
          content={`${process.env.NEXT_PUBLIC_SITE_URL}/images/og-image.png`}
        />

        {/* Twitter Card tags */}
        <meta name='twitter:card' content='summary_large_image' />
        <meta name='twitter:title' content={plugin.name} />
        <meta name='twitter:description' content={plugin.description} />
        <meta
          name='twitter:image'
          content={`${process.env.NEXT_PUBLIC_SITE_URL}/images/og-image.png`}
        />
      </Head>

      <MainLayout>
        {/* Header Section */}
        <section className='bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700'>
          <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12'>
            {/* Breadcrumb */}
            <nav className='mb-6'>
              <ol className='flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400'>
                <li>
                  <Link
                    href='/'
                    className='hover:text-primary-600 dark:hover:text-primary-400 transition-colors'
                  >
                    Home
                  </Link>
                </li>
                <li className='flex items-center space-x-2'>
                  <span>/</span>
                  <Link
                    href='/plugins'
                    className='hover:text-primary-600 dark:hover:text-primary-400 transition-colors'
                  >
                    Plugins
                  </Link>
                </li>
                <li className='flex items-center space-x-2'>
                  <span>/</span>
                  <span className='text-gray-900 dark:text-gray-100 truncate'>{plugin.name}</span>
                </li>
              </ol>
            </nav>

            {/* Plugin Header */}
            <div className='flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6'>
              <div className='flex-1'>
                <div className='flex items-center space-x-3 mb-4'>
                  <h1 className='text-3xl sm:text-4xl font-bold text-gray-900 dark:text-gray-100'>
                    {plugin.name}
                  </h1>
                  <div className='flex items-center space-x-2'>
                    {plugin.verified && (
                      <div className='flex items-center space-x-1'>
                        <Shield className='w-5 h-5 text-blue-500' />
                        <span className='text-sm text-blue-500 font-medium'>Verified</span>
                      </div>
                    )}
                    {plugin.featured && <span className='badge badge-warning'>Featured</span>}
                  </div>
                </div>

                <p className='text-lg text-gray-600 dark:text-gray-300 mb-6 leading-relaxed'>
                  {plugin.description}
                </p>

                {/* Rating and Stats */}
                <div className='flex flex-wrap items-center gap-6 mb-6'>
                  <div className='flex items-center space-x-1'>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => handleRating(star)}
                        className='transition-colors'
                        aria-label={`Rate ${star} stars`}
                      >
                        <Star
                          className={`w-5 h-5 ${
                            star <= rating
                              ? 'fill-current text-yellow-500'
                              : star <= userRating
                                ? 'fill-current text-yellow-400'
                                : 'text-gray-300 dark:text-gray-600'
                          } hover:text-yellow-400`}
                        />
                      </button>
                    ))}
                    <span className='ml-2 text-sm text-gray-600 dark:text-gray-400'>
                      {rating.toFixed(1)} ratings
                    </span>
                  </div>

                  <div className='flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400'>
                    <div className='flex items-center space-x-1'>
                      <Star className='w-4 h-4' />
                      <span>{plugin.stars.toLocaleString()}</span>
                    </div>
                    <div className='flex items-center space-x-1'>
                      <Download className='w-4 h-4' />
                      <span>{plugin.downloads.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* Tags */}
                <div className='flex flex-wrap gap-2 mb-6'>
                  {plugin.tags.map((tag) => (
                    <span key={tag} className='badge badge-secondary text-sm'>
                      {tag}
                    </span>
                  ))}
                  <span className='badge badge-secondary text-sm'>{plugin.category}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className='flex flex-col space-y-3 lg:w-64'>
                <button
                  onClick={() => copyToClipboard(getInstallCommand(), 'install')}
                  className='btn btn-primary group justify-center'
                >
                  <Terminal className='w-4 h-4 mr-2' />
                  {copied === 'install' ? 'Copied!' : 'Copy Install Command'}
                  {copied === 'install' ? (
                    <Check className='w-4 h-4 ml-2' />
                  ) : (
                    <Copy className='w-4 h-4 ml-2 group-hover:scale-110 transition-transform' />
                  )}
                </button>

                <div className='flex space-x-2'>
                  <a
                    href={plugin.repositoryUrl}
                    target='_blank'
                    rel='noopener noreferrer'
                    className='btn-ghost p-3 group flex-1 justify-center'
                    title='View on GitHub'
                  >
                    <Github className='w-5 h-5 group-hover:scale-110 transition-transform' />
                  </a>

                  <a
                    href={plugin.marketplaceUrl}
                    target='_blank'
                    rel='noopener noreferrer'
                    className='btn-ghost p-3 group flex-1 justify-center'
                    title='View on marketplace'
                  >
                    <ExternalLink className='w-5 h-5 group-hover:scale-110 transition-transform' />
                  </a>

                  <button
                    onClick={sharePlugin}
                    className='btn-ghost p-3 group flex-1 justify-center'
                    title='Share plugin'
                  >
                    <Share2 className='w-5 h-5 group-hover:scale-110 transition-transform' />
                  </button>
                </div>

                <div className='text-xs text-gray-500 dark:text-gray-400 text-center space-y-1'>
                  <div>Version {plugin.version}</div>
                  <div>{plugin.license} license</div>
                  <div>Updated {formatDate(plugin.lastUpdated)}</div>
                </div>
              </div>
            </div>

            {/* Install Command Display */}
            <div className='mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700'>
              <div className='flex items-center justify-between'>
                <div>
                  <div className='text-sm text-gray-600 dark:text-gray-400 mb-1'>
                    Install command:
                  </div>
                  <code className='text-sm text-gray-900 dark:text-gray-100 font-mono'>
                    {getInstallCommand()}
                  </code>
                </div>
                <button
                  onClick={() => copyToClipboard(getInstallCommand(), 'install-main')}
                  className='ml-4 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors'
                >
                  {copied === 'install-main' ? (
                    <Check className='w-4 h-4 text-green-500' />
                  ) : (
                    <Copy className='w-4 h-4' />
                  )}
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Tabs Navigation */}
        <section className='bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10'>
          <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
            <nav className='flex space-x-8'>
              {[
                { id: 'overview', label: 'Overview', icon: FileText },
                { id: 'installation', label: 'Installation', icon: Download },
                { id: 'usage', label: 'Usage', icon: Terminal },
                { id: 'security', label: 'Security', icon: Shield },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                  }`}
                >
                  <tab.icon className='w-4 h-4' />
                  <span>{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>
        </section>

        {/* Tab Content */}
        <section className='py-12 bg-gray-50 dark:bg-gray-800/50'>
          <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
                <div className='lg:col-span-2 space-y-8'>
                  {/* Description */}
                  <div className='card'>
                    <h2 className='text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4'>
                      About this plugin
                    </h2>
                    <p className='text-gray-600 dark:text-gray-300 leading-relaxed'>
                      {plugin.description}
                    </p>
                  </div>

                  {/* Commands */}
                  <div className='card'>
                    <h3 className='text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4'>
                      <Terminal className='w-5 h-5 inline mr-2' />
                      Available Commands
                    </h3>
                    <div className='space-y-3'>
                      {pluginDetails.commands.map((command, index) => (
                        <div
                          key={index}
                          className='flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg'
                        >
                          <code className='text-sm font-mono text-gray-900 dark:text-gray-100'>
                            {command}
                          </code>
                          <button
                            onClick={() => copyToClipboard(command, `cmd-${index}`)}
                            className='ml-4 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors'
                          >
                            {copied === `cmd-${index}` ? (
                              <Check className='w-4 h-4 text-green-500' />
                            ) : (
                              <Copy className='w-4 h-4' />
                            )}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Agents */}
                  <div className='card'>
                    <h3 className='text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4'>
                      <Users className='w-5 h-5 inline mr-2' />
                      Compatible Agents
                    </h3>
                    <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
                      {pluginDetails.agents.map((agent) => (
                        <div
                          key={agent}
                          className='flex items-center space-x-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg'
                        >
                          <Zap className='w-4 h-4 text-primary-500' />
                          <span className='text-sm font-medium text-gray-900 dark:text-gray-100'>
                            {agent}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Sidebar */}
                <div className='space-y-6'>
                  {/* Author Info */}
                  <div className='card'>
                    <h3 className='text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4'>
                      <User className='w-5 h-5 inline mr-2' />
                      Author
                    </h3>
                    <div className='space-y-3'>
                      <div>
                        <div className='font-medium text-gray-900 dark:text-gray-100'>
                          {plugin.author}
                        </div>
                        <a
                          href={plugin.authorUrl}
                          target='_blank'
                          rel='noopener noreferrer'
                          className='text-sm text-primary-600 dark:text-primary-400 hover:underline'
                        >
                          View profile
                        </a>
                      </div>
                    </div>
                  </div>

                  {/* Marketplace Info */}
                  {marketplace && (
                    <div className='card'>
                      <h3 className='text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4'>
                        <Package className='w-5 h-5 inline mr-2' />
                        Marketplace
                      </h3>
                      <div className='space-y-3'>
                        <div>
                          <div className='font-medium text-gray-900 dark:text-gray-100'>
                            {marketplace.name}
                          </div>
                          <p className='text-sm text-gray-600 dark:text-gray-300'>
                            {marketplace.description}
                          </p>
                        </div>
                        <Link
                          href={`/marketplaces/${marketplace.id}`}
                          className='text-sm text-primary-600 dark:text-primary-400 hover:underline flex items-center'
                        >
                          View marketplace
                          <ChevronRight className='w-4 h-4 ml-1' />
                        </Link>
                      </div>
                    </div>
                  )}

                  {/* GitHub Stats */}
                  <div className='card'>
                    <h3 className='text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4'>
                      <Github className='w-5 h-5 inline mr-2' />
                      Repository Stats
                    </h3>
                    <div className='space-y-3'>
                      <div className='flex justify-between'>
                        <span className='text-sm text-gray-600 dark:text-gray-400'>Commits</span>
                        <span className='text-sm font-medium text-gray-900 dark:text-gray-100'>
                          {pluginDetails.githubStats.commits}
                        </span>
                      </div>
                      <div className='flex justify-between'>
                        <span className='text-sm text-gray-600 dark:text-gray-400'>
                          Contributors
                        </span>
                        <span className='text-sm font-medium text-gray-900 dark:text-gray-100'>
                          {pluginDetails.githubStats.contributors}
                        </span>
                      </div>
                      <div className='flex justify-between'>
                        <span className='text-sm text-gray-600 dark:text-gray-400'>
                          Open Issues
                        </span>
                        <span className='text-sm font-medium text-gray-900 dark:text-gray-100'>
                          {pluginDetails.githubStats.openIssues}
                        </span>
                      </div>
                      <div className='flex justify-between'>
                        <span className='text-sm text-gray-600 dark:text-gray-400'>
                          Last Commit
                        </span>
                        <span className='text-sm font-medium text-gray-900 dark:text-gray-100'>
                          {formatDate(pluginDetails.githubStats.lastCommit)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Installation Tab */}
            {activeTab === 'installation' && (
              <div className='max-w-4xl'>
                <div className='space-y-8'>
                  <div className='card'>
                    <h2 className='text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4'>
                      Installation Instructions
                    </h2>
                    <div className='space-y-6'>
                      <div>
                        <h3 className='text-lg font-medium text-gray-900 dark:text-gray-100 mb-3'>
                          1. Install via Claude
                        </h3>
                        <p className='text-gray-600 dark:text-gray-300 mb-3'>
                          Run the following command in your Claude Code session:
                        </p>
                        <div className='relative'>
                          <div className='bg-gray-900 text-gray-100 p-4 rounded-lg font-mono text-sm'>
                            <div className='flex items-center justify-between'>
                              <code>{getInstallCommand()}</code>
                              <button
                                onClick={() =>
                                  copyToClipboard(getInstallCommand(), 'install-step1')
                                }
                                className='ml-4 text-gray-400 hover:text-white transition-colors'
                              >
                                {copied === 'install-step1' ? (
                                  <Check className='w-4 h-4 text-green-500' />
                                ) : (
                                  <Copy className='w-4 h-4' />
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h3 className='text-lg font-medium text-gray-900 dark:text-gray-100 mb-3'>
                          2. Configure Plugin
                        </h3>
                        <p className='text-gray-600 dark:text-gray-300 mb-3'>
                          Add the plugin configuration to your Claude config file:
                        </p>
                        <div className='bg-gray-900 text-gray-100 p-4 rounded-lg font-mono text-sm'>
                          <div className='flex items-center justify-between mb-2'>
                            <span className='text-gray-400'># ~/.claude/config.json</span>
                            <button
                              onClick={() =>
                                copyToClipboard('config.json content', 'install-step2')
                              }
                              className='text-gray-400 hover:text-white transition-colors'
                            >
                              {copied === 'install-step2' ? (
                                <Check className='w-4 h-4 text-green-500' />
                              ) : (
                                <Copy className='w-4 h-4' />
                              )}
                            </button>
                          </div>
                          <code>{`{
  "plugins": {
    "${plugin.name.toLowerCase().replace(/\s+/g, '-')}": {
      "enabled": true,
      "config": {
        // Add your plugin-specific configuration here
      }
    }
  }
}`}</code>
                        </div>
                      </div>

                      <div>
                        <h3 className='text-lg font-medium text-gray-900 dark:text-gray-100 mb-3'>
                          3. Verify Installation
                        </h3>
                        <p className='text-gray-600 dark:text-gray-300 mb-3'>
                          Verify the plugin is installed and working:
                        </p>
                        <div className='bg-gray-900 text-gray-100 p-4 rounded-lg font-mono text-sm'>
                          <div className='flex items-center justify-between'>
                            <code>claude plugins list</code>
                            <button
                              onClick={() =>
                                copyToClipboard('claude plugins list', 'install-step3')
                              }
                              className='text-gray-400 hover:text-white transition-colors'
                            >
                              {copied === 'install-step3' ? (
                                <Check className='w-4 h-4 text-green-500' />
                              ) : (
                                <Copy className='w-4 h-4' />
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Requirements */}
                  <div className='card'>
                    <h3 className='text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4'>
                      Requirements
                    </h3>
                    <ul className='space-y-2 text-gray-600 dark:text-gray-300'>
                      <li className='flex items-start'>
                        <CheckCircle className='w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5' />
                        <span>Claude Code version 1.0 or higher</span>
                      </li>
                      <li className='flex items-start'>
                        <CheckCircle className='w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5' />
                        <span>Node.js 16.0 or higher (if applicable)</span>
                      </li>
                      <li className='flex items-start'>
                        <CheckCircle className='w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5' />
                        <span>{pluginDetails.securityMetrics.dependencies}MB disk space</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* Usage Tab */}
            {activeTab === 'usage' && (
              <div className='max-w-4xl'>
                <div className='space-y-8'>
                  <div className='card'>
                    <h2 className='text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4'>
                      Usage Examples
                    </h2>
                    <div className='space-y-6'>
                      {pluginDetails.commands.slice(0, 3).map((command, index) => (
                        <div key={index}>
                          <h3 className='text-lg font-medium text-gray-900 dark:text-gray-100 mb-3'>
                            Example {index + 1}
                          </h3>
                          <p className='text-gray-600 dark:text-gray-300 mb-3'>
                            {index === 0 && 'Display help information and available options.'}
                            {index === 1 && 'Install the plugin in your current project.'}
                            {index === 2 && 'Set configuration values for the plugin.'}
                          </p>
                          <div className='bg-gray-900 text-gray-100 p-4 rounded-lg font-mono text-sm'>
                            <div className='flex items-center justify-between'>
                              <code>{command}</code>
                              <button
                                onClick={() => copyToClipboard(command, `usage-${index}`)}
                                className='text-gray-400 hover:text-white transition-colors'
                              >
                                {copied === `usage-${index}` ? (
                                  <Check className='w-4 h-4 text-green-500' />
                                ) : (
                                  <Copy className='w-4 h-4' />
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Hooks */}
                  <div className='card'>
                    <h3 className='text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4'>
                      <GitBranch className='w-5 h-5 inline mr-2' />
                      Git Hooks
                    </h3>
                    <div className='space-y-4'>
                      {Object.entries(pluginDetails.hooks).map(([hook, description]) => (
                        <div key={hook} className='flex items-start space-x-3'>
                          <div className='flex-shrink-0'>
                            <GitCommit className='w-5 h-5 text-primary-500' />
                          </div>
                          <div>
                            <div className='font-medium text-gray-900 dark:text-gray-100'>
                              {hook}
                            </div>
                            <div className='text-sm text-gray-600 dark:text-gray-300'>
                              {description}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* MCP Servers */}
                  <div className='card'>
                    <h3 className='text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4'>
                      <Zap className='w-5 h-5 inline mr-2' />
                      MCP Servers
                    </h3>
                    <div className='space-y-4'>
                      {Object.entries(pluginDetails.mcpServers).map(([name, server]) => (
                        <div key={name} className='p-4 bg-gray-50 dark:bg-gray-800 rounded-lg'>
                          <div className='font-medium text-gray-900 dark:text-gray-100 mb-2'>
                            {name}
                          </div>
                          <p className='text-sm text-gray-600 dark:text-gray-300 mb-3'>
                            {server.description}
                          </p>
                          <div className='bg-gray-900 text-gray-100 p-3 rounded-lg font-mono text-sm'>
                            <code>
                              {server.command} {server.args.join(' ')}
                            </code>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Security Tab */}
            {activeTab === 'security' && (
              <div className='max-w-4xl'>
                <div className='space-y-8'>
                  <div className='card'>
                    <h2 className='text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4'>
                      Security Analysis
                    </h2>
                    <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8'>
                      <div className='text-center'>
                        <div className={`text-3xl font-bold ${securityLevel.color} mb-2`}>
                          {pluginDetails.securityMetrics.securityScore}
                        </div>
                        <div
                          className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${securityLevel.bg} ${securityLevel.color}`}
                        >
                          {securityLevel.level}
                        </div>
                        <div className='text-sm text-gray-600 dark:text-gray-400 mt-2'>
                          Security Score
                        </div>
                      </div>
                      <div className='text-center'>
                        <div className='text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2'>
                          {pluginDetails.securityMetrics.vulnerabilities}
                        </div>
                        <div className='text-sm text-gray-600 dark:text-gray-400'>
                          Vulnerabilities
                        </div>
                      </div>
                      <div className='text-center'>
                        <div className='text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2'>
                          {pluginDetails.securityMetrics.dependencies}
                        </div>
                        <div className='text-sm text-gray-600 dark:text-gray-400'>Dependencies</div>
                      </div>
                      <div className='text-center'>
                        <div className='text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2'>
                          {pluginDetails.securityMetrics.licenseCheck === 'pass' ? '✓' : '!'}
                        </div>
                        <div className='text-sm text-gray-600 dark:text-gray-400'>
                          License Check
                        </div>
                      </div>
                    </div>

                    <div className='space-y-4'>
                      {pluginDetails.securityMetrics.vulnerabilities === 0 ? (
                        <div className='flex items-start space-x-3 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800'>
                          <CheckCircle className='w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5' />
                          <div>
                            <div className='font-medium text-green-800 dark:text-green-200'>
                              No vulnerabilities found
                            </div>
                            <div className='text-sm text-green-700 dark:text-green-300'>
                              This plugin has no known security vulnerabilities.
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className='flex items-start space-x-3 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800'>
                          <AlertTriangle className='w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5' />
                          <div>
                            <div className='font-medium text-yellow-800 dark:text-yellow-200'>
                              {pluginDetails.securityMetrics.vulnerabilities} vulnerabilities found
                            </div>
                            <div className='text-sm text-yellow-700 dark:text-yellow-300'>
                              This plugin has security vulnerabilities that should be reviewed.
                            </div>
                          </div>
                        </div>
                      )}

                      <div className='flex items-start space-x-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800'>
                        <Shield className='w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5' />
                        <div>
                          <div className='font-medium text-blue-800 dark:text-blue-200'>
                            License: {plugin.license}
                          </div>
                          <div className='text-sm text-blue-700 dark:text-blue-300'>
                            This plugin is licensed under {plugin.license}, which is compatible with
                            most projects.
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Best Practices */}
                  <div className='card'>
                    <h3 className='text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4'>
                      Security Best Practices
                    </h3>
                    <ul className='space-y-3 text-gray-600 dark:text-gray-300'>
                      <li className='flex items-start'>
                        <Lock className='w-5 h-5 text-gray-400 mr-2 flex-shrink-0 mt-0.5' />
                        <span>Always review the source code before installing any plugin</span>
                      </li>
                      <li className='flex items-start'>
                        <Lock className='w-5 h-5 text-gray-400 mr-2 flex-shrink-0 mt-0.5' />
                        <span>Keep plugins updated to the latest version</span>
                      </li>
                      <li className='flex items-start'>
                        <Lock className='w-5 h-5 text-gray-400 mr-2 flex-shrink-0 mt-0.5' />
                        <span>Only install plugins from trusted sources and verified authors</span>
                      </li>
                      <li className='flex items-start'>
                        <Lock className='w-5 h-5 text-gray-400 mr-2 flex-shrink-0 mt-0.5' />
                        <span>Review the plugin&apos;s permissions and access requirements</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Related Plugins */}
        {relatedPlugins.length > 0 && (
          <section className='py-12 bg-white dark:bg-gray-900'>
            <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
              <h2 className='text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6'>
                Related Plugins
              </h2>
              <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
                {relatedPlugins.map((relatedPlugin) => (
                  <div key={relatedPlugin.id} className='card group hover:shadow-lg transition-all'>
                    <div className='flex items-start justify-between mb-4'>
                      <div className='flex-1'>
                        <h3 className='text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors'>
                          <Link href={`/plugins/${relatedPlugin.id}`} className='hover:underline'>
                            {relatedPlugin.name}
                          </Link>
                        </h3>
                        <p className='text-sm text-gray-600 dark:text-gray-300 line-clamp-2'>
                          {relatedPlugin.description}
                        </p>
                      </div>
                      {relatedPlugin.verified && (
                        <Shield className='w-5 h-5 text-blue-500 flex-shrink-0 ml-2' />
                      )}
                    </div>

                    <div className='flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 mb-4'>
                      <div className='flex items-center space-x-3'>
                        <div className='flex items-center space-x-1'>
                          <Star className='w-4 h-4' />
                          <span>{relatedPlugin.stars.toLocaleString()}</span>
                        </div>
                        <div className='flex items-center space-x-1'>
                          <Download className='w-4 h-4' />
                          <span>{relatedPlugin.downloads.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>

                    <div className='mt-4 pt-4 border-t border-gray-100 dark:border-gray-700'>
                      <Link
                        href={`/plugins/${relatedPlugin.id}`}
                        className='text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium text-sm group'
                      >
                        View plugin
                        <span className='ml-1 transform transition-transform group-hover:translate-x-1 inline-block'>
                          →
                        </span>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Feedback Section */}
        <section className='py-12 bg-gray-50 dark:bg-gray-800/50'>
          <div className='max-w-4xl mx-auto px-4 sm:px-6 lg:px-8'>
            <div className='card'>
              <h2 className='text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4'>
                Feedback & Support
              </h2>
              <p className='text-gray-600 dark:text-gray-300 mb-6'>
                Found an issue or have a suggestion? We&apos;d love to hear from you!
              </p>

              <div className='flex flex-col sm:flex-row gap-4'>
                <button onClick={() => setShowFeedbackForm(true)} className='btn btn-primary'>
                  <MessageSquare className='w-4 h-4 mr-2' />
                  Send Feedback
                </button>
                <a
                  href={plugin.repositoryUrl + '/issues'}
                  target='_blank'
                  rel='noopener noreferrer'
                  className='btn-ghost'
                >
                  <Github className='w-4 h-4 mr-2' />
                  Report Issue on GitHub
                </a>
                <a
                  href={plugin.repositoryUrl + '/discussions'}
                  target='_blank'
                  rel='noopener noreferrer'
                  className='btn-ghost'
                >
                  <Book className='w-4 h-4 mr-2' />
                  Join Discussion
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* Feedback Form Modal */}
        {showFeedbackForm && (
          <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50'>
            <div className='bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6'>
              <h3 className='text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4'>
                Send Feedback
              </h3>
              <form onSubmit={submitFeedback}>
                <div className='mb-4'>
                  <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'>
                    Feedback Type
                  </label>
                  <select
                    value={feedback.type}
                    onChange={(e) => setFeedback({ ...feedback, type: e.target.value })}
                    className='w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100'
                    required
                  >
                    <option value=''>Select type</option>
                    <option value='bug'>Bug Report</option>
                    <option value='feature'>Feature Request</option>
                    <option value='improvement'>Improvement</option>
                    <option value='other'>Other</option>
                  </select>
                </div>
                <div className='mb-6'>
                  <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'>
                    Message
                  </label>
                  <textarea
                    value={feedback.message}
                    onChange={(e) => setFeedback({ ...feedback, message: e.target.value })}
                    rows={4}
                    className='w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100'
                    placeholder='Describe your feedback...'
                    required
                  />
                </div>
                <div className='flex justify-end space-x-3'>
                  <button
                    type='button'
                    onClick={() => setShowFeedbackForm(false)}
                    className='btn-ghost'
                  >
                    Cancel
                  </button>
                  <button type='submit' className='btn btn-primary'>
                    Send Feedback
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </MainLayout>
    </>
  );
};

export default PluginDetailPage;
