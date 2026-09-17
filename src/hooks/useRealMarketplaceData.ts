import { useState, useEffect } from 'react';

interface MarketplaceData {
  marketplaces: any[];
  lastUpdated: string | null;
  totalCount: number;
}

interface UseRealMarketplaceDataReturn {
  data: MarketplaceData | null;
  loading: boolean;
  error: string | null;
}

/**
 * Loads the pipeline-generated marketplace catalog (public/data/marketplaces.json,
 * a bare array). On failure the page renders an honest error state — no mock data.
 */
export function useRealMarketplaceData(): UseRealMarketplaceDataReturn {
  const [data, setData] = useState<MarketplaceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function fetchData() {
      try {
        setLoading(true);
        setError(null);
        // Base path is required on GitHub Pages (site served under /<repo>/);
        // a relative path resolves against the current page URL and 404s.
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_BASE_PATH || ''}/data/marketplaces.json`
        );
        if (!response.ok) {
          throw new Error(`marketplaces.json ${response.status}`);
        }
        const jsonResponse = await response.json();
        if (cancelled) return;
        // The pipeline writes a bare array; accept the wrapped shape too.
        const realDataArray: any[] = Array.isArray(jsonResponse)
          ? jsonResponse
          : jsonResponse.marketplaces || [];
        const lastUpdated: string | null = Array.isArray(jsonResponse)
          ? null
          : jsonResponse.lastUpdated || null;
        setData({
          marketplaces: realDataArray,
          lastUpdated,
          totalCount: realDataArray.length,
        });
      } catch (err) {
        if (!cancelled) {
          console.error('Error loading marketplace data:', err);
          setError('Failed to load marketplace data');
          setData({ marketplaces: [], lastUpdated: null, totalCount: 0 });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchData();
    return () => {
      cancelled = true;
    };
  }, []);

  return { data, loading, error };
}
