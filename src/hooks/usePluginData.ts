import { useState, useEffect, useMemo } from 'react';
import { useRealMarketplaceData } from './useRealMarketplaceData';
import { mockPlugins, MarketplacePlugin } from '../data/mock-data';

interface UsePluginDataReturn {
  plugins: MarketplacePlugin[];
  loading: boolean;
  error: string | null;
  totalCount: number;
}

export function usePluginData(): UsePluginDataReturn {
  const { data: marketplaceData, loading: marketplaceLoading, error: marketplaceError } = useRealMarketplaceData();
  const [plugins, setPlugins] = useState<MarketplacePlugin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    function extractPlugins() {
      try {
        setLoading(true);
        setError(null);

        if (marketplaceData?.marketplaces && marketplaceData.marketplaces.length > 0) {
          // Extract plugins from real marketplace data
          const extractedPlugins: MarketplacePlugin[] = [];

          marketplaceData.marketplaces.forEach((marketplace) => {
            if (marketplace.plugins && Array.isArray(marketplace.plugins)) {
              marketplace.plugins.forEach((plugin, index) => {
                extractedPlugins.push({
                  id: plugin.id || `${marketplace.id}-${index}`,
                  name: plugin.name || `Plugin ${index + 1}`,
                  description: plugin.description || 'No description available',
                  category: plugin.category || 'General',
                  tags: Array.isArray(plugin.tags) ? plugin.tags : [],
                  author: plugin.author || marketplace.owner || 'Unknown',
                  authorUrl: plugin.authorUrl || marketplace.repositoryUrl,
                  repositoryUrl: plugin.repositoryUrl || marketplace.repositoryUrl,
                  stars: plugin.stars || 0,
                  downloads: plugin.downloads || 0,
                  lastUpdated: plugin.lastUpdated || new Date().toISOString(),
                  version: plugin.version || '1.0.0',
                  license: plugin.license || 'MIT',
                  marketplace: marketplace.name,
                  marketplaceUrl: marketplace.url,
                  featured: plugin.featured || false,
                  verified: plugin.verified || marketplace.verified || false,
                });
              });
            }
          });

          setPlugins(extractedPlugins);
          console.log(`✅ Extracted ${extractedPlugins.length} plugins from ${marketplaceData.marketplaces.length} marketplaces`);
        } else {
          // Fallback to mock plugins
          setPlugins(mockPlugins);
          console.log('⚠️ Using mock plugins - no real marketplace data available');
        }
      } catch (err) {
        console.error('Error extracting plugins:', err);
        setError('Failed to extract plugin data');

        // Fallback to mock plugins on error
        setPlugins(mockPlugins);
        console.log('⚠️ Using mock plugins due to error');
      } finally {
        setLoading(false);
      }
    }

    extractPlugins();
  }, [marketplaceData, marketplaceLoading, marketplaceError]);

  const totalCount = useMemo(() => plugins.length, [plugins]);

  return {
    plugins,
    loading: loading || marketplaceLoading,
    error: error || marketplaceError,
    totalCount
  };
}