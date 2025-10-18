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
            // Check for plugins in manifest.plugins (correct location in our data structure)
            if (marketplace.manifest?.plugins && Array.isArray(marketplace.manifest.plugins)) {
              marketplace.manifest.plugins.forEach((plugin, index) => {
                extractedPlugins.push({
                  id: `${marketplace.id}-${plugin.name}`,
                  name: plugin.name || `Plugin ${index + 1}`,
                  description: plugin.description || 'No description available',
                  category: plugin.category || 'General',
                  tags: Array.isArray(plugin.tags) ? plugin.tags : [],
                  author: marketplace.manifest.owner?.name || marketplace.owner || 'Unknown',
                  authorUrl: marketplace.repositoryUrl,
                  repositoryUrl: marketplace.repositoryUrl,
                  stars: marketplace.stars || 0, // Use marketplace stars since plugins don't have individual stars
                  downloads: 0, // Not available in current data structure
                  lastUpdated: marketplace.updatedAt || new Date().toISOString(),
                  version: plugin.version || '1.0.0',
                  license: marketplace.license || 'MIT',
                  marketplace: marketplace.name,
                  marketplaceUrl: marketplace.url,
                  featured: index === 0, // Make first plugin featured
                  verified: marketplace.verified || false,
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