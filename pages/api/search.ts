import { NextApiRequest, NextApiResponse } from 'next';
import { mockPlugins, mockMarketplaces } from '../../src/data/mock-data';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const {
    method,
    query: {
      q: query,
      type = 'all', // 'plugins', 'marketplaces', or 'all'
      limit = '20',
      offset = '0'
    }
  } = req;

  switch (method) {
    case 'GET':
      try {
        if (!query || (query as string).trim().length === 0) {
          return res.status(400).json({
            error: 'Bad Request',
            message: 'Search query is required'
          });
        }

        const searchTerm = (query as string).trim().toLowerCase();
        const limitNum = Math.min(parseInt(limit as string), 100);
        const offsetNum = parseInt(offset as string);

        const results = {
          plugins: [] as any[],
          marketplaces: [] as any[],
          total: 0
        };

        // Search plugins
        if (type === 'all' || type === 'plugins') {
          const pluginResults = mockPlugins.filter(plugin =>
            plugin.name.toLowerCase().includes(searchTerm) ||
            plugin.description.toLowerCase().includes(searchTerm) ||
            plugin.author.toLowerCase().includes(searchTerm) ||
            plugin.category.toLowerCase().includes(searchTerm) ||
            plugin.tags.some(tag => tag.toLowerCase().includes(searchTerm))
          );

          // Add search score
          const scoredPlugins = pluginResults.map(plugin => {
            let score = 0;

            // Exact name match gets highest score
            if (plugin.name.toLowerCase() === searchTerm) score += 100;
            // Name starts with query
            else if (plugin.name.toLowerCase().startsWith(searchTerm)) score += 80;
            // Name contains query
            else if (plugin.name.toLowerCase().includes(searchTerm)) score += 60;

            // Description match
            if (plugin.description.toLowerCase().includes(searchTerm)) score += 40;

            // Tag match
            plugin.tags.forEach(tag => {
              if (tag.toLowerCase() === searchTerm) score += 50;
              else if (tag.toLowerCase().includes(searchTerm)) score += 30;
            });

            // Category match
            if (plugin.category.toLowerCase() === searchTerm) score += 45;

            // Author match
            if (plugin.author.toLowerCase().includes(searchTerm)) score += 35;

            return {
              ...plugin,
              _searchScore: score
            };
          });

          // Sort by search score
          scoredPlugins.sort((a, b) => b._searchScore - a._searchScore);

          results.plugins = scoredPlugins.slice(offsetNum, offsetNum + limitNum);
        }

        // Search marketplaces
        if (type === 'all' || type === 'marketplaces') {
          const marketplaceResults = mockMarketplaces.filter(marketplace =>
            marketplace.name.toLowerCase().includes(searchTerm) ||
            marketplace.description.toLowerCase().includes(searchTerm) ||
            marketplace.owner.toLowerCase().includes(searchTerm) ||
            marketplace.category.toLowerCase().includes(searchTerm)
          );

          // Add search score
          const scoredMarketplaces = marketplaceResults.map(marketplace => {
            let score = 0;

            // Exact name match gets highest score
            if (marketplace.name.toLowerCase() === searchTerm) score += 100;
            // Name starts with query
            else if (marketplace.name.toLowerCase().startsWith(searchTerm)) score += 80;
            // Name contains query
            else if (marketplace.name.toLowerCase().includes(searchTerm)) score += 60;

            // Description match
            if (marketplace.description.toLowerCase().includes(searchTerm)) score += 40;

            // Category match
            if (marketplace.category.toLowerCase() === searchTerm) score += 45;

            // Owner match
            if (marketplace.owner.toLowerCase().includes(searchTerm)) score += 35;

            return {
              ...marketplace,
              _searchScore: score
            };
          });

          // Sort by search score
          scoredMarketplaces.sort((a, b) => b._searchScore - a._searchScore);

          results.marketplaces = scoredMarketplaces.slice(offsetNum, offsetNum + limitNum);
        }

        results.total = results.plugins.length + results.marketplaces.length;

        // Get suggestions for related searches
        const suggestions = new Set<string>();

        // Add plugin tags from results
        results.plugins.forEach((plugin: any) => {
          plugin.tags.forEach((tag: string) => {
            if (tag.toLowerCase() !== searchTerm && tag.toLowerCase().includes(searchTerm)) {
              suggestions.add(tag);
            }
          });
        });

        // Add categories from results
        [...results.plugins, ...results.marketplaces].forEach((item: any) => {
          if (item.category && item.category.toLowerCase() !== searchTerm &&
              item.category.toLowerCase().includes(searchTerm)) {
            suggestions.add(item.category);
          }
        });

        res.status(200).json({
          query: searchTerm,
          type,
          results,
          pagination: {
            total: results.total,
            limit: limitNum,
            offset: offsetNum,
            hasMore: results.total > offsetNum + limitNum
          },
          suggestions: Array.from(suggestions).slice(0, 10)
        });
      } catch (error) {
        console.error('Error performing search:', error);
        res.status(500).json({
          error: 'Internal Server Error',
          message: 'Failed to perform search'
        });
      }
      break;

    default:
      res.setHeader('Allow', ['GET']);
      res.status(405).json({
        error: 'Method Not Allowed',
        message: `Method ${method} not allowed`
      });
      break;
  }
}