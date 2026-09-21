import { useState, useEffect, useMemo } from 'react';
import { useRealMarketplaceData } from './useRealMarketplaceData';

/**
 * UI-facing plugin shape. Index entries (public/data/plugins.json) carry
 * skillsCount only; full records from a marketplace shard
 * (public/data/plugins/<marketplaceId>.json) also carry the skill names.
 */
export interface CatalogPlugin {
  id: string;
  name: string;
  description: string;
  version: string;
  author: string;
  repositoryUrl: string;
  /** Best-known per-plugin URL (source dir when derivable, else repo root). */
  sourceUrl: string;
  /** Number of skills the plugin carries (from the compact index). */
  skillsCount: number;
  /** Full skill list — only present on shard-loaded records. */
  skills?: string[];
  marketplaceId: string;
  marketplaceName: string;
  /** Parent marketplace stars (plugins have no independent star counts). */
  stars: number;
  updatedAt?: string;
}

/**
 * Raw plugin entry. The generated index is the compact shape (top-level
 * marketplaceId/marketplaceName + skillsCount); fields below that only exist
 * on full shard records — and on the pre-shard plugins.json format, which the
 * site keeps tolerating until the next data-update PR lands the index.
 */
interface RawPlugin {
  id?: string;
  name?: string;
  description?: string;
  version?: string;
  author?: string | { name?: string };
  repository?: string | { url?: string };
  manifestPath?: string | { url?: string; path?: string; ref?: string };
  isValid?: boolean;
  skillsCount?: number;
  marketplaceId?: string;
  marketplaceName?: string;
  updatedAt?: string;
  metadata?: {
    marketplaceId?: string;
    marketplaceName?: string;
    skills?: string[];
    hasSkillMd?: boolean;
  };
}

const asUrl = (repo: RawPlugin['repository']): string => {
  if (typeof repo === 'string') return repo;
  return repo?.url || '';
};

const asAuthor = (author: RawPlugin['author']): string => {
  if (typeof author === 'string') return author;
  return author?.name || 'Unknown';
};

/**
 * Best per-plugin source URL. Manifest entries sometimes carry their own
 * location (url + subdirectory + ref); otherwise fall back to the repo root.
 */
const toSourceUrl = (repoUrl: string, manifestPath: RawPlugin['manifestPath']): string => {
  if (!repoUrl) return '';
  const cleanRepo = repoUrl.replace(/\.git$/, '');
  if (manifestPath && typeof manifestPath === 'object') {
    const { url, path, ref } = manifestPath;
    if (url && path) {
      return `${url.replace(/\.git$/, '')}/tree/${ref || 'HEAD'}/${path.replace(/^\//, '')}`;
    }
    if (path) {
      return `${cleanRepo}/tree/HEAD/${path.replace(/^\//, '')}`;
    }
    return cleanRepo;
  }
  if (typeof manifestPath === 'string') {
    const dir = manifestPath.replace(/^\.\//, '').replace(/\/$/, '');
    if (dir && dir !== '.') {
      return `${cleanRepo}/tree/HEAD/${dir}`;
    }
    return cleanRepo;
  }
  return cleanRepo;
};

/** Derive skillsCount from either the index field or full-record metadata. */
const toSkillsCount = (raw: RawPlugin): number => {
  if (typeof raw.skillsCount === 'number') return raw.skillsCount;
  if (Array.isArray(raw.metadata?.skills)) return raw.metadata!.skills!.length;
  if (typeof raw.metadata?.hasSkillMd === 'boolean') return raw.metadata!.hasSkillMd ? 1 : 0;
  return 0;
};

/** Map a raw index/shard record to the UI-facing shape (used by both hooks). */
export function toCatalogPlugin(raw: RawPlugin, index: number): CatalogPlugin {
  const repoUrl = asUrl(raw.repository);
  return {
    id: raw.id || `plugin-${index}`,
    name: raw.name || `Plugin ${index + 1}`,
    description: raw.description || 'No description available',
    version: raw.version || '',
    author: asAuthor(raw.author),
    repositoryUrl: repoUrl,
    sourceUrl: toSourceUrl(repoUrl, raw.manifestPath),
    skillsCount: toSkillsCount(raw),
    skills: Array.isArray(raw.metadata?.skills)
      ? raw.metadata!.skills!.map((s) => s.replace(/^\.?\//, ''))
      : undefined,
    marketplaceId: raw.marketplaceId || raw.metadata?.marketplaceId || '',
    marketplaceName: raw.marketplaceName || raw.metadata?.marketplaceName || '',
    stars: 0,
    updatedAt: raw.updatedAt,
  };
}

interface UsePluginDataReturn {
  plugins: CatalogPlugin[];
  loading: boolean;
  error: string | null;
  totalCount: number;
}

/**
 * Loads the pipeline-generated plugin index (public/data/plugins.json).
 * Full per-plugin records live in per-marketplace shards (usePluginShard);
 * parent-marketplace stars are joined in from public/data/marketplaces.json.
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
        setRawPlugins(entries.map(toCatalogPlugin));
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

/**
 * Popular plugins for the homepage: the top plugin from each of the
 * most-starred marketplaces first (so the list isn't dominated by a single
 * source), then remaining plugins by parent-marketplace stars.
 */
export function topPluginsByStars(plugins: CatalogPlugin[], count: number): CatalogPlugin[] {
  const ranked = [...plugins]
    .filter((p) => p.name)
    .sort((a, b) => b.stars - a.stars || a.id.localeCompare(b.id));
  const seenMarketplaces = new Set<string>();
  const perMarketplace: CatalogPlugin[] = [];
  const rest: CatalogPlugin[] = [];
  for (const p of ranked) {
    if (!p.marketplaceId || seenMarketplaces.has(p.marketplaceId)) {
      rest.push(p);
    } else {
      seenMarketplaces.add(p.marketplaceId);
      perMarketplace.push(p);
    }
  }
  return [...perMarketplace, ...rest].slice(0, count);
}
