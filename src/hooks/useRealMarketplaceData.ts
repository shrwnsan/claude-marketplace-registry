import { useState, useEffect } from 'react';
import { mockMarketplaces } from '../data/mock-data';

interface MarketplaceData {
  marketplaces: any[];
  lastUpdated: string;
  totalCount: number;
}

interface UseRealMarketplaceDataReturn {
  data: MarketplaceData | null;
  loading: boolean;
  error: string | null;
}

export function useRealMarketplaceData(): UseRealMarketplaceDataReturn {
  const [data, setData] = useState<MarketplaceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        setError(null);

        // Try to load real data first
        // Base path is required on GitHub Pages (site served under /<repo>/);
        // a relative path resolves against the current page URL and 404s.
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_BASE_PATH || ''}/data/marketplaces.json`
        );

        if (response.ok) {
          const jsonResponse = await response.json();
          const realDataArray = jsonResponse.marketplaces || [];
          const realData = {
            marketplaces: realDataArray,
            lastUpdated: new Date().toISOString(),
            totalCount: realDataArray.length,
            source: 'real',
          };
          setData(realData);
          console.log('✅ Loaded real marketplace data:', realDataArray.length, 'marketplaces');
          console.log('📊 Real data details:', realData);
        } else {
          // Fallback to mock data
          console.warn('Using mock data - real data not available');
          const mockData = {
            marketplaces: mockMarketplaces,
            lastUpdated: new Date().toISOString(),
            totalCount: mockMarketplaces.length,
            source: 'mock',
          };
          setData(mockData);
        }
      } catch (err) {
        console.error('Error loading marketplace data:', err);
        setError('Failed to load marketplace data');

        // Fallback to mock data on error
        console.warn('Falling back to mock data due to error');
        const mockData = {
          marketplaces: mockMarketplaces,
          lastUpdated: new Date().toISOString(),
          totalCount: mockMarketplaces.length,
          source: 'mock-fallback',
        };
        setData(mockData);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  return { data, loading, error };
}
