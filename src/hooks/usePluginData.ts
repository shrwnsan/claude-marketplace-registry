import { useState, useEffect, useMemo } from 'react';
import { useRealMarketplaceData } from './useRealMarketplaceData';

/**
 * UI-facing plugin shape derived from public/data/plugins.json entries:
 * { id, name, description, version, author, repository, isValid,
 *   metadata: { marketplaceId, marketplaceName, skills[] } }
 */
export interface CatalogPlugin {
  id: string;
  name: string;
  description: string;
  version: string;
  author: string;
  repositoryUrl: string;
  skills: string[];
  marketplaceId: string;
  marketplaceName: string;
  /** Parent marketplace stars (plugins have no independent star counts). */
  stars: number;
  updatedAt?: string;
}

interface RawPlugin {
  id?: string;
  name?: string;
  description?: string;
  version?: string;
  author?: string | { name?: string };
  repository?: string | { url?: string };
  isValid?: boolean;
  updatedAt?: string;
  metadata?: { marketplaceId?: string; marketplaceName?: string; skills?: string[] };
}

const asUrl = (repo: RawPlugin['repository']): string => {
  if (typeof repo === 'string') return repo;
  return repo?.url || '';
};

const asAuthor = (author: RawPlugin['author']): string => {
  if (typeof author === 'string') return author;
  return author?.name || 'Unknown';
};

interface UsePluginDataReturn {
  plugins: CatalogPlugin[];
  loading: boolean;
  error: string | null;
  totalCount: number;
}

/**
 * Loads the pipeline-generated plugin catalog (public/data/plugins.json).
 * Parent-marketplace stars are joined in from public/data/marketplaces.json.
 */
export function usePluginData(): UsePluginDataReturn {
  const {
    data: marketplaceData,
    loading: marketplaceLoading,
    error: marketplaceError,
  } = useRealMarketplaceData();
  const [rawPlugins, setRawPlugins] = useState<CatalogPlugin[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function fetchPlugins() {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_BASE_PATH || ''}/data/plugins.json`
        );
        if (!response.ok) {
          throw new Error(`plugins.json ${response.status}`);
        }
        const json = await response.json();
        const entries: RawPlugin[] = Array.isArray(json) ? json : json.plugins || [];
        if (cancelled) return;
        setRawPlugins(
          entries.map((p, index) => ({
            id: p.id || `plugin-${index}`,
            name: p.name || `Plugin ${index + 1}`,
            description: p.description || 'No description available',
            version: p.version || '',
            author: asAuthor(p.author),
            repositoryUrl: asUrl(p.repository),
            skills: Array.isArray(p.metadata?.skills)
              ? p.metadata!.skills.map((s) => s.replace(/^\.?\//, ''))
              : [],
            marketplaceId: p.metadata?.marketplaceId || '',
            marketplaceName: p.metadata?.marketplaceName || '',
            stars: 0,
            updatedAt: p.updatedAt,
          }))
        );
      } catch (err) {
        if (!cancelled) {
          console.error('Error loading plugin data:', err);
          setError('Failed to load plugin data');
          setRawPlugins([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchPlugins();
    return () => {
      cancelled = true;
    };
  }, []);

  const plugins = useMemo<CatalogPlugin[]>(() => {
    if (!rawPlugins) return [];
    const starsById = new Map(
      (marketplaceData?.marketplaces || []).map((m: any) => [String(m.id), m.stars || 0])
    );
    return rawPlugins.map((p) => ({
      ...p,
      stars: starsById.get(String(p.marketplaceId)) || 0,
    }));
  }, [rawPlugins, marketplaceData]);

  const totalCount = plugins.length;

  return {
    plugins,
    loading: loading || marketplaceLoading,
    error: error || marketplaceError,
    totalCount,
  };
}

/** Top plugins ordered by parent-marketplace stars (deterministic tiebreak by id). */
export function topPluginsByStars(plugins: CatalogPlugin[], count: number): CatalogPlugin[] {
  return [...plugins]
    .filter((p) => p.name)
    .sort((a, b) => b.stars - a.stars || a.id.localeCompare(b.id))
    .slice(0, count);
}
