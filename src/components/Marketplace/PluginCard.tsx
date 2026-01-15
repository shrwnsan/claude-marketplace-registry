import React, { useState } from 'react';
import Link from 'next/link';
import { Star, Download, ExternalLink, Github, Verified, Copy, Check } from 'lucide-react';
import { MarketplacePlugin } from '../../data/mock-data';
import { useClickTracking } from '../../utils/analytics/hooks';

interface PluginCardProps {
  plugin: MarketplacePlugin;
  className?: string;
}

const PluginCard: React.FC<PluginCardProps> = ({ plugin, className = '' }) => {
  const [copied, setCopied] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const { handleClick, handleDownload, handleShare } = useClickTracking(
    plugin.id,
    'plugin',
    plugin.name
  );

  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return `${Math.floor(diffDays / 365)} years ago`;
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const getInstallCommand = () => {
    // Generate a mock install command for demonstration
    return `npm install ${plugin.name.toLowerCase().replace(/\s+/g, '-')}`;
  };

  return (
    <div
      className={`card-interactive ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Header */}
      <div className='flex items-start justify-between mb-4'>
        <div className='flex-1 min-w-0'>
          <div className='flex items-center space-x-2 mb-2'>
            <h3 className='text-lg font-semibold text-gray-900 dark:text-gray-100 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors truncate'>
              <Link
                href={`/plugins/${plugin.id}`}
                className='hover:underline focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 rounded'
                aria-label={`View details for ${plugin.name}`}
                onClick={() => handleClick('plugin-card')}
              >
                {plugin.name}
              </Link>
            </h3>
            <div className='flex items-center space-x-1 flex-shrink-0'>
              {plugin.verified && (
                <div className='relative group'>
                  <Verified className='w-4 h-4 text-blue-500' aria-label='Verified plugin' />
                  <div className='absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none'>
                    Verified Plugin
                  </div>
                </div>
              )}
              {plugin.featured && (
                <span className='badge badge-warning'>
                  <span className='sr-only'>Featured:</span>
                  Featured
                </span>
              )}
            </div>
          </div>
          <p className='text-sm text-gray-600 dark:text-gray-300 line-clamp-2 leading-relaxed'>
            {plugin.description}
          </p>
        </div>
      </div>

      {/* Tags */}
      <div className='flex flex-wrap gap-1.5 mb-4'>
        {plugin.tags.slice(0, 3).map((tag) => (
          <span
            key={tag}
            className='badge badge-secondary text-xs hover:border-primary-300 dark:hover:border-primary-600 transition-colors cursor-pointer'
            onClick={() => copyToClipboard(tag)}
            title={`Click to copy "${tag}"`}
          >
            {tag}
          </span>
        ))}
        {plugin.tags.length > 3 && (
          <span
            className='badge badge-secondary text-xs'
            title={`${plugin.tags.length - 3} more tags: ${plugin.tags.slice(3).join(', ')}`}
          >
            +{plugin.tags.length - 3}
          </span>
        )}
      </div>

      {/* Author and Marketplace */}
      <div className='flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 mb-4'>
        <div className='flex items-center space-x-2 min-w-0 flex-1'>
          <span className='text-gray-400 dark:text-gray-500'>by</span>
          <a
            href={plugin.authorUrl}
            target='_blank'
            rel='noopener noreferrer'
            className='text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium truncate hover:underline transition-colors'
            aria-label={`View ${plugin.author}'s profile`}
          >
            {plugin.author}
          </a>
        </div>
        <span className='badge badge-secondary text-xs'>{plugin.marketplace}</span>
      </div>

      {/* Stats */}
      <div className='flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 mb-4'>
        <div className='flex items-center space-x-4'>
          <div className='flex items-center space-x-1 group'>
            <Star
              className='w-4 h-4 group-hover:fill-current group-hover:text-yellow-500 transition-colors'
              aria-hidden='true'
            />
            <span className='font-medium'>{formatNumber(plugin.stars)}</span>
          </div>
          <div className='flex items-center space-x-1 group'>
            <Download
              className='w-4 h-4 group-hover:text-green-500 transition-colors'
              aria-hidden='true'
            />
            <span className='font-medium'>{formatNumber(plugin.downloads)}</span>
          </div>
        </div>
        <span className='text-xs text-gray-400 dark:text-gray-500'>
          {formatDate(plugin.lastUpdated)}
        </span>
      </div>

      {/* Install Command */}
      {isHovered && (
        <div className='mb-4 p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600 animate-fade-in'>
          <div className='flex items-center justify-between'>
            <code className='text-xs text-gray-600 dark:text-gray-300 font-mono truncate'>
              {getInstallCommand()}
            </code>
            <button
              onClick={() => {
                copyToClipboard(getInstallCommand());
                handleDownload();
              }}
              className='ml-2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors rounded'
              aria-label='Copy install command'
            >
              {copied ? <Check className='w-3 h-3 text-green-500' /> : <Copy className='w-3 h-3' />}
            </button>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className='flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-700'>
        <div className='flex items-center space-x-1'>
          <a
            href={plugin.repositoryUrl}
            target='_blank'
            rel='noopener noreferrer'
            className='btn-ghost p-2 group'
            aria-label='View repository on GitHub'
          >
            <Github className='w-4 h-4 group-hover:scale-110 transition-transform' />
          </a>
          <a
            href={plugin.marketplaceUrl}
            target='_blank'
            rel='noopener noreferrer'
            className='btn-ghost p-2 group'
            aria-label={`View on ${plugin.marketplace}`}
          >
            <ExternalLink className='w-4 h-4 group-hover:scale-110 transition-transform' />
          </a>
          <button
            onClick={() => {
              copyToClipboard(plugin.repositoryUrl);
              handleShare('clipboard');
            }}
            className='btn-ghost p-2 group'
            aria-label='Copy repository URL'
          >
            <Copy className='w-4 h-4 group-hover:scale-110 transition-transform' />
          </button>
        </div>
        <div className='flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400'>
          <span className='font-mono bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded'>
            v{plugin.version}
          </span>
          <span className='text-gray-300 dark:text-gray-600'>•</span>
          <span className='truncate max-w-20' title={plugin.license}>
            {plugin.license}
          </span>
        </div>
      </div>

      {/* Copied notification */}
      {copied && (
        <div className='absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-md animate-fade-in'>
          Copied!
        </div>
      )}
    </div>
  );
};

export default PluginCard;
