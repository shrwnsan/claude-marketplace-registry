import { EcosystemOverview } from '../../types/ecosystem-stats';

// Mock data for testing and development
export const mockEcosystemOverview: EcosystemOverview = {
  totalPlugins: 1250,
  totalMarketplaces: 15,
  totalDevelopers: 340,
  totalDownloads: 48200,
  lastUpdated: new Date().toISOString(),
  growthRate: {
    plugins: 15.2,
    marketplaces: 7.1,
    developers: 12.8,
    downloads: 23.4,
  },
  healthScore: 85,
  activeUsers: 12500,
};

// Mock API response structure
export const mockApiResponse = {
  success: true,
  data: mockEcosystemOverview,
  meta: {
    timestamp: new Date().toISOString(),
    requestId: 'test-request-id',
    responseTime: 150,
    cache: {
      hit: false,
      ttl: 300,
      expiresAt: new Date(Date.now() + 300000).toISOString(),
      key: 'ecosystem-stats:overview',
    },
  },
};

// Simulated API function for local development
export const fetchMockEcosystemData = async (): Promise<Response> => {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 800));

  return new Response(JSON.stringify(mockApiResponse), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
    },
  });
};

// Export for testing
export default {
  mockEcosystemOverview,
  mockApiResponse,
  fetchMockEcosystemData,
};
