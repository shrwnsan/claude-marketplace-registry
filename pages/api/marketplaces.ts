import { NextApiRequest, NextApiResponse } from 'next';
import { mockMarketplaces } from '../../src/data/mock-data';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const {
    method,
    query: {
      category,
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
        let filteredMarketplaces = [...mockMarketplaces];

        // Apply filters
        if (category && category !== 'all') {
          filteredMarketplaces = filteredMarketplaces.filter(marketplace =>
            marketplace.category.toLowerCase() === (category as string).toLowerCase()
          );
        }

        if (verified === 'true') {
          filteredMarketplaces = filteredMarketplaces.filter(marketplace => marketplace.verified);
        }

        if (featured === 'true') {
          filteredMarketplaces = filteredMarketplaces.filter(marketplace => marketplace.featured);
        }

        // Apply sorting
        filteredMarketplaces.sort((a, b) => {
          let comparison = 0;

          switch (sort) {
            case 'name':
              comparison = a.name.localeCompare(b.name);
              break;
            case 'stars':
              comparison = b.stars - a.stars;
              break;
            case 'category':
              comparison = a.category.localeCompare(b.category);
              break;
            case 'owner':
              comparison = a.owner.localeCompare(b.owner);
              break;
            default:
              comparison = a.name.localeCompare(b.name);
          }

          return order === 'desc' ? -comparison : comparison;
        });

        // Apply pagination
        const limitNum = Math.min(parseInt(limit as string), 100); // Max 100 items
        const offsetNum = parseInt(offset as string);
        const paginatedMarketplaces = filteredMarketplaces.slice(offsetNum, offsetNum + limitNum);

        // Return response
        res.status(200).json({
          marketplaces: paginatedMarketplaces,
          pagination: {
            total: filteredMarketplaces.length,
            limit: limitNum,
            offset: offsetNum,
            hasMore: offsetNum + limitNum < filteredMarketplaces.length
          },
          filters: {
            category,
            verified: verified === 'true',
            featured: featured === 'true'
          },
          sort: {
            by: sort,
            order
          }
        });
      } catch (error) {
        console.error('Error fetching marketplaces:', error);
        res.status(500).json({
          error: 'Internal Server Error',
          message: 'Failed to fetch marketplaces'
        });
      }
      break;

    case 'POST':
      try {
        // In a real implementation, this would create a new marketplace
        const newMarketplace = req.body;

        // Validate required fields
        if (!newMarketplace.name || !newMarketplace.description || !newMarketplace.owner) {
          return res.status(400).json({
            error: 'Bad Request',
            message: 'Missing required fields: name, description, owner'
          });
        }

        // Generate mock ID and timestamps
        const marketplaceWithMetadata = {
          ...newMarketplace,
          id: `marketplace-${Date.now()}`,
          stars: 0,
          plugins: [],
          verified: false,
          featured: false,
          createdAt: new Date().toISOString()
        };

        res.status(201).json({
          message: 'Marketplace created successfully',
          marketplace: marketplaceWithMetadata
        });
      } catch (error) {
        console.error('Error creating marketplace:', error);
        res.status(500).json({
          error: 'Internal Server Error',
          message: 'Failed to create marketplace'
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