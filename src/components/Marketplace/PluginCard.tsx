import React from 'react';
import Link from 'next/link';
import { Star, ExternalLink, Github, Copy, Check, Package } from 'lucide-react';
import { CatalogPlugin } from '../../hooks/usePluginData';
import { useClickTracking } from '../../utils/analytics/hooks';

interface PluginCardProps {
  plugin: CatalogPlugin;
  className?: string;
}

const PluginCard: React.FC<PluginCardProps> = ({ plugin, className = '' }) => {
  const { handleClick } = useClickTracking(plugin.id, 'plugin', plugin.name);

  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  return (
    <div className={`card-interactive ${className}`}>
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
          </div>
          <p className='text-sm text-gray-600 dark:text-gray-300 line-clamp-2 leading-relaxed'>
            {plugin.description}
          </p>
        </div>
      </div>

      {/* Skills */}
      {plugin.skills.length > 0 && (
        <div className='flex flex-wrap gap-1.5 mb-4'>
          {plugin.skills.slice(0, 3).map((skill) => (
            <span key={skill} className='badge badge-secondary text-xs'>
              {skill}
            </span>
          ))}
          {plugin.skills.length > 3 && (
            <span
              className='badge badge-secondary text-xs'
              title={`${plugin.skills.length - 3} more: ${plugin.skills.slice(3).join(', ')}`}
            >
              +{plugin.skills.length - 3}
            </span>
          )}
        </div>
      )}

      {/* Author and Marketplace */}
      <div className='flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 mb-4'>
        <div className='flex items-center space-x-2 min-w-0 flex-1'>
          <span className='text-gray-400 dark:text-gray-500'>by</span>
          <span className='font-medium truncate'>{plugin.author}</span>
        </div>
        {plugin.marketplaceId && (
          <Link
            href={`/marketplaces/${plugin.marketplaceId}`}
            className='badge badge-secondary text-xs hover:border-primary-300 dark:hover:border-primary-600 transition-colors'
            aria-label={`View ${plugin.marketplaceName} marketplace`}
          >
            {plugin.marketplaceName}
          </Link>
        )}
      </div>

      {/* Stats */}
      <div className='flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 mb-4'>
        <div className='flex items-center space-x-4'>
          <div className='flex items-center space-x-1 group'>
            <Star
              className='w-4 h-4 group-hover:fill-current group-hover:text-yellow-500 transition-colors'
              aria-hidden='true'
            />
            <span
              className='font-medium'
              title={`Stars of parent marketplace ${plugin.marketplaceName}`}
            >
              {formatNumber(plugin.stars)}
            </span>
          </div>
          {plugin.skills.length > 0 && (
            <div className='flex items-center space-x-1'>
              <Package className='w-4 h-4' aria-hidden='true' />
              <span className='font-medium'>
                {plugin.skills.length} skill{plugin.skills.length === 1 ? '' : 's'}
              </span>
            </div>
          )}
        </div>
        {plugin.version && (
          <span className='text-xs text-gray-400 dark:text-gray-500 font-mono'>
            v{plugin.version}
          </span>
        )}
      </div>

      {/* Actions */}
      <div className='flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-700'>
        <div className='flex items-center space-x-1'>
          {plugin.repositoryUrl && (
            <a
              href={plugin.repositoryUrl}
              target='_blank'
              rel='noopener noreferrer'
              className='btn-ghost p-2 group'
              aria-label='View repository on GitHub'
            >
              <Github className='w-4 h-4 group-hover:scale-110 transition-transform' />
            </a>
          )}
          <CopyRepoButton url={plugin.repositoryUrl} />
        </div>
        {plugin.marketplaceId && (
          <Link
            href={`/marketplaces/${plugin.marketplaceId}`}
            className='btn-ghost p-2 group'
            aria-label={`Open ${plugin.marketplaceName} marketplace page`}
          >
            <ExternalLink className='w-4 h-4 group-hover:scale-110 transition-transform' />
          </Link>
        )}
      </div>
    </div>
  );
};

const CopyRepoButton: React.FC<{ url: string }> = ({ url }) => {
  const [copied, setCopied] = React.useState(false);
  if (!url) return null;
  return (
    <button
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(url);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        } catch {
          /* clipboard unavailable */
        }
      }}
      className='btn-ghost p-2 group'
      aria-label='Copy repository URL'
    >
      {copied ? (
        <Check className='w-4 h-4 text-green-500' />
      ) : (
        <Copy className='w-4 h-4 group-hover:scale-110 transition-transform' />
      )}
    </button>
  );
};

export default PluginCard;
