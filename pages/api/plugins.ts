import { NextApiRequest, NextApiResponse } from 'next';
import { mockPlugins } from '../../src/data/mock-data';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const {
    method,
    query: {
      category,
      tags,
      author,
      verified,
      featured,
      limit = '20',
      offset = '0',
      sort = 'name',
      order = 'asc'
    }
  } = req;

  switch (method) {
    case 'GET':
      try {
        let filteredPlugins = [...mockPlugins];

        // Apply filters
        if (category && category !== 'all') {
          filteredPlugins = filteredPlugins.filter(plugin =>
            plugin.category.toLowerCase() === (category as string).toLowerCase()
          );
        }

        if (tags) {
          const tagArray = Array.isArray(tags) ? tags : [tags];
          filteredPlugins = filteredPlugins.filter(plugin =>
            tagArray.some(tag =>
              plugin.tags.some(pluginTag =>
                pluginTag.toLowerCase().includes((tag as string).toLowerCase())
              )
            )
          );
        }

        if (author) {
          filteredPlugins = filteredPlugins.filter(plugin =>
            plugin.author.toLowerCase().includes((author as string).toLowerCase())
          );
        }

        if (verified === 'true') {
          filteredPlugins = filteredPlugins.filter(plugin => plugin.verified);
        }

        if (featured === 'true') {
          filteredPlugins = filteredPlugins.filter(plugin => plugin.featured);
        }

        // Apply sorting
        filteredPlugins.sort((a, b) => {
          let comparison = 0;

          switch (sort) {
            case 'name':
              comparison = a.name.localeCompare(b.name);
              break;
            case 'stars':
              comparison = b.stars - a.stars;
              break;
            case 'downloads':
              comparison = b.downloads - a.downloads;
              break;
            case 'updated':
              comparison = new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime();
              break;
            case 'author':
              comparison = a.author.localeCompare(b.author);
              break;
            case 'category':
              comparison = a.category.localeCompare(b.category);
              break;
            default:
              comparison = a.name.localeCompare(b.name);
          }

          return order === 'desc' ? -comparison : comparison;
        });

        // Apply pagination
        const limitNum = Math.min(parseInt(limit as string), 100); // Max 100 items
        const offsetNum = parseInt(offset as string);
        const paginatedPlugins = filteredPlugins.slice(offsetNum, offsetNum + limitNum);

        // Return response
        res.status(200).json({
          plugins: paginatedPlugins,
          pagination: {
            total: filteredPlugins.length,
            limit: limitNum,
            offset: offsetNum,
            hasMore: offsetNum + limitNum < filteredPlugins.length
          },
          filters: {
            category,
            tags: tags ? (Array.isArray(tags) ? tags : [tags]) : undefined,
            author,
            verified: verified === 'true',
            featured: featured === 'true'
          },
          sort: {
            by: sort,
            order
          }
        });
      } catch (error) {
        console.error('Error fetching plugins:', error);
        res.status(500).json({
          error: 'Internal Server Error',
          message: 'Failed to fetch plugins'
        });
      }
      break;

    case 'POST':
      try {
        // In a real implementation, this would create a new plugin
        const newPlugin = req.body;

        // Validate required fields
        if (!newPlugin.name || !newPlugin.description || !newPlugin.author) {
          return res.status(400).json({
            error: 'Bad Request',
            message: 'Missing required fields: name, description, author'
          });
        }

        // Generate mock ID and timestamps
        const pluginWithMetadata = {
          ...newPlugin,
          id: `plugin-${Date.now()}`,
          stars: 0,
          downloads: 0,
          lastUpdated: new Date().toISOString().split('T')[0],
          verified: false,
          featured: false,
          createdAt: new Date().toISOString()
        };

        res.status(201).json({
          message: 'Plugin created successfully',
          plugin: pluginWithMetadata
        });
      } catch (error) {
        console.error('Error creating plugin:', error);
        res.status(500).json({
          error: 'Internal Server Error',
          message: 'Failed to create plugin'
        });
      }
      break;

    default:
      res.setHeader('Allow', ['GET', 'POST']);
      res.status(405).json({
        error: 'Method Not Allowed',
        message: `Method ${method} not allowed`
      });
      break;
  }
}

// API rate limiting middleware
export function rateLimit(req: NextApiRequest, res: NextApiResponse, next: () => void) {
  // Simple rate limiting - in production, use a proper rate limiting library
  const userAgent = req.headers['user-agent'];
  const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;

  // For demo purposes, we'll just log the request
  console.log(`API Request: ${req.method} from ${ip} (${userAgent})`);

  next();
}