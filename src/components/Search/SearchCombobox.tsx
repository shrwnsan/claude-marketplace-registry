import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { Search, X, Clock, Store, Package, CornerDownLeft } from 'lucide-react';
import { validateSearchQuery } from '@/utils/security';
import { useRealMarketplaceData } from '../../hooks/useRealMarketplaceData';
import { usePluginData } from '../../hooks/usePluginData';

interface SearchComboboxProps {
  /** Placeholder, e.g. 'Search plugins and marketplaces…' */
  placeholder?: string;
  /** Real, data-derived chips shown under the input (top marketplace topics). */
  trending?: string[];
  /** Where "see all marketplace results" deep-links to. */
  marketplacesHref?: string;
  /** Where "see all plugin results" deep-links to. */
  pluginsHref?: string;
  className?: string;
}

interface MarketplaceLike {
  id: string | number;
  name?: string;
  description?: string;
  stars?: number;
  topics?: string[];
}

/**
 * WAI-ARIA combobox typeahead: results render in this component's own
 * dropdown (grouped marketplaces/plugins) instead of filtering the page.
 * Enter/ArrowDown/ArrowUp navigate; "See all" deep-links with ?q=.
 */
const SearchCombobox: React.FC<SearchComboboxProps> = ({
  placeholder = 'Search plugins and marketplaces…',
  trending = [],
  marketplacesHref = '/marketplaces',
  pluginsHref = '/plugins',
  className = '',
}) => {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [validationError, setValidationError] = useState<string>('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: marketplaceData } = useRealMarketplaceData();
  const { plugins } = usePluginData();

  useEffect(() => {
    try {
      const stored = localStorage.getItem('claude-marketplace-recent-searches');
      if (stored) setRecentSearches(JSON.parse(stored));
    } catch {
      /* storage unavailable */
    }
  }, []);

  // Arriving via /#site-search (header search button on another page) focuses the combobox.
  useEffect(() => {
    if (window.location.hash === '#site-search') {
      inputRef.current?.focus();
    }
  }, []);

  // Debounce the query used for matching so the dropdown stays smooth
  const [debounced, setDebounced] = useState('');
  useEffect(() => {
    const t = setTimeout(() => setDebounced(query), 180);
    return () => clearTimeout(t);
  }, [query]);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const { marketplaceMatches, pluginMatches } = useMemo(() => {
    const q = debounced.trim().toLowerCase();
    if (q.length < 2) {
      return { marketplaceMatches: [], pluginMatches: [] };
    }
    const marketplaces = marketplaceData?.marketplaces || [];
    const mMatches = marketplaces
      .filter(
        (m: MarketplaceLike) =>
          (m.name || '').toLowerCase().includes(q) ||
          (m.description || '').toLowerCase().includes(q) ||
          (Array.isArray(m.topics) && m.topics.some((t) => t.toLowerCase().includes(q)))
      )
      .slice(0, 4);
    const pMatches = plugins
      .filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.author.toLowerCase().includes(q)
      )
      .slice(0, 5);
    return { marketplaceMatches: mMatches, pluginMatches: pMatches };
  }, [debounced, marketplaceData, plugins]);

  // Total match counts (for the "see all" links)
  const totals = useMemo(() => {
    const q = debounced.trim().toLowerCase();
    if (q.length < 2) return { marketplaces: 0, plugins: 0 };
    const marketplaces = marketplaceData?.marketplaces || [];
    return {
      marketplaces: marketplaces.filter(
        (m: MarketplaceLike) =>
          (m.name || '').toLowerCase().includes(q) ||
          (m.description || '').toLowerCase().includes(q) ||
          (Array.isArray(m.topics) && m.topics.some((t) => t.toLowerCase().includes(q)))
      ).length,
      plugins: plugins.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.author.toLowerCase().includes(q)
      ).length,
    };
  }, [debounced, marketplaceData, plugins]);

  // Flattened navigable options: recent searches OR result rows
  const options = useMemo(() => {
    const q = debounced.trim();
    if (q.length < 2) {
      return recentSearches.map((text) => ({ kind: 'recent' as const, text }));
    }
    return [
      ...marketplaceMatches.map((m: MarketplaceLike) => ({
        kind: 'marketplace' as const,
        id: String(m.id),
        name: m.name || String(m.id),
        stars: m.stars || 0,
        description: m.description || '',
      })),
      ...pluginMatches.map((p) => ({
        kind: 'plugin' as const,
        id: p.id,
        name: p.name,
        author: p.author,
        marketplaceName: p.marketplaceName,
      })),
    ];
  }, [debounced, recentSearches, marketplaceMatches, pluginMatches]);

  const showRecent = query.trim().length < 2 && open && recentSearches.length > 0;
  const showResults = query.trim().length >= 2 && open;
  const showNoResults =
    showResults &&
    query.trim().length >= 2 &&
    debounced.trim().length >= 2 &&
    marketplaceMatches.length === 0 &&
    pluginMatches.length === 0;

  const commit = (value: string) => {
    const validation = validateSearchQuery(value.trim());
    if (!validation.isValid) {
      setValidationError(validation.errors[0] || 'Invalid search query');
      return null;
    }
    setValidationError('');
    return validation.sanitized || value.trim();
  };

  const rememberRecent = (value: string) => {
    const updated = [value, ...recentSearches.filter((r) => r !== value)].slice(0, 5);
    setRecentSearches(updated);
    try {
      localStorage.setItem('claude-marketplace-recent-searches', JSON.stringify(updated));
    } catch {
      /* storage unavailable */
    }
  };

  const goToListing = (kind: 'marketplaces' | 'plugins', value: string) => {
    const clean = commit(value);
    if (!clean) return;
    rememberRecent(clean);
    setOpen(false);
    router.push(
      `${kind === 'marketplaces' ? marketplacesHref : pluginsHref}?q=${encodeURIComponent(clean)}`
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown' && options.length > 0) {
      e.preventDefault();
      setOpen(true);
      setActiveIndex((i) => (i + 1) % options.length);
    } else if (e.key === 'ArrowUp' && options.length > 0) {
      e.preventDefault();
      setActiveIndex((i) => (i <= 0 ? options.length - 1 : i - 1));
    } else if (e.key === 'Escape') {
      setOpen(false);
      setActiveIndex(-1);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const active = options[activeIndex];
      if (active) {
        if (active.kind === 'recent') {
          setQuery(active.text);
          setOpen(true);
          return;
        }
        rememberRecent(query.trim());
        setOpen(false);
        router.push(
          active.kind === 'marketplace' ? `/marketplaces/${active.id}` : `/plugins/${active.id}`
        );
      } else {
        goToListing(totals.plugins >= totals.marketplaces ? 'plugins' : 'marketplaces', query);
      }
    }
  };

  const activateOption = (index: number) => {
    const active = options[index];
    if (!active) return;
    if (active.kind === 'recent') {
      setQuery(active.text);
      setDebounced(active.text);
      inputRef.current?.focus();
      return;
    }
    rememberRecent(query.trim());
    setOpen(false);
    router.push(
      active.kind === 'marketplace' ? `/marketplaces/${active.id}` : `/plugins/${active.id}`
    );
  };

  return (
    <div className={`w-full max-w-3xl mx-auto ${className}`} ref={containerRef}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (options[activeIndex]) {
            activateOption(activeIndex);
          } else if (query.trim()) {
            goToListing(totals.plugins >= totals.marketplaces ? 'plugins' : 'marketplaces', query);
          }
        }}
        role='combobox'
        aria-expanded={open && (showRecent || showResults || showNoResults)}
        aria-haspopup='listbox'
        aria-owns='homepage-search-listbox'
      >
        <div className='flex items-stretch w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl shadow-sm hover:shadow-md focus-within:ring-2 focus-within:ring-primary-500 dark:focus-within:ring-primary-400 focus-within:border-primary-500 transition-all'>
          <div className='flex items-center pl-3 sm:pl-4 pointer-events-none'>
            <Search className='h-5 w-5 text-gray-400 dark:text-gray-500' aria-hidden='true' />
          </div>
          <input
            ref={inputRef}
            id='site-search'
            type='text'
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActiveIndex(-1);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            onKeyDown={handleKeyDown}
            className='block flex-1 min-w-0 px-3 py-3 text-base bg-transparent border-0 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-0'
            placeholder={placeholder}
            autoComplete='off'
            aria-label={placeholder}
            aria-autocomplete='list'
            aria-controls='homepage-search-listbox'
          />
          {query && (
            <button
              type='button'
              onClick={() => {
                setQuery('');
                setDebounced('');
                inputRef.current?.focus();
              }}
              className='flex items-center px-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors'
              aria-label='Clear search'
            >
              <X className='h-4 w-4' />
            </button>
          )}
        </div>
      </form>

      {/* Dropdown: results live here, in the component — page sections below are untouched */}
      {open && (showRecent || showResults) && (
        <div
          className='absolute z-50 w-full mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg dark:shadow-gray-900/50 max-h-[26rem] overflow-y-auto animate-slide-in'
          role='listbox'
          id='homepage-search-listbox'
        >
          {showRecent && (
            <div className='p-3'>
              <h3 className='text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 flex items-center'>
                <Clock className='h-3 w-3 mr-1' />
                Recent searches
              </h3>
              {options.map((option, index) =>
                option.kind === 'recent' ? (
                  <button
                    key={`recent-${option.text}`}
                    type='button'
                    onMouseEnter={() => setActiveIndex(index)}
                    onClick={() => activateOption(index)}
                    className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-colors flex items-center ${
                      activeIndex === index
                        ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                        : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                    role='option'
                    aria-selected={activeIndex === index}
                  >
                    <Clock className='h-3 w-3 mr-2 text-gray-400 flex-shrink-0' />
                    {option.text}
                  </button>
                ) : null
              )}
            </div>
          )}

          {showResults && (
            <div className='py-2'>
              {marketplaceMatches.length > 0 && (
                <div className='px-3 pb-1 pt-2'>
                  <p className='text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1 flex items-center'>
                    <Store className='h-3 w-3 mr-1' /> Marketplaces
                  </p>
                  {marketplaceMatches.map((m: MarketplaceLike) => {
                    const index = options.findIndex(
                      (o) => o.kind === 'marketplace' && o.id === String(m.id)
                    );
                    return (
                      <button
                        key={`m-${m.id}`}
                        type='button'
                        onMouseEnter={() => setActiveIndex(index)}
                        onClick={() => activateOption(index)}
                        className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                          activeIndex === index
                            ? 'bg-primary-50 dark:bg-primary-900/20'
                            : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                        }`}
                        role='option'
                        aria-selected={activeIndex === index}
                      >
                        <span className='flex items-center justify-between gap-2'>
                          <span className='flex items-center gap-2 min-w-0'>
                            <Store
                              className='h-3.5 w-3.5 text-success-500 flex-shrink-0'
                              aria-hidden='true'
                            />
                            <span className='text-sm font-medium text-gray-900 dark:text-gray-100 truncate'>
                              {m.name}
                            </span>
                          </span>
                          <span className='text-xs text-gray-500 dark:text-gray-400 flex-shrink-0'>
                            ★ {(m.stars || 0).toLocaleString()}
                          </span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}

              {pluginMatches.length > 0 && (
                <div className='px-3 pb-1 pt-1 border-t border-gray-100 dark:border-gray-700'>
                  <p className='text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1 mt-1 flex items-center'>
                    <Package className='h-3 w-3 mr-1' /> Plugins
                  </p>
                  {pluginMatches.map((p) => {
                    const index = options.findIndex((o) => o.kind === 'plugin' && o.id === p.id);
                    return (
                      <button
                        key={`p-${p.id}`}
                        type='button'
                        onMouseEnter={() => setActiveIndex(index)}
                        onClick={() => activateOption(index)}
                        className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                          activeIndex === index
                            ? 'bg-primary-50 dark:bg-primary-900/20'
                            : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                        }`}
                        role='option'
                        aria-selected={activeIndex === index}
                      >
                        <span className='flex items-center justify-between gap-2'>
                          <span className='flex items-center gap-2 min-w-0'>
                            <Package
                              className='h-3.5 w-3.5 text-primary-500 flex-shrink-0'
                              aria-hidden='true'
                            />
                            <span className='text-sm font-medium text-gray-900 dark:text-gray-100 truncate'>
                              {p.name}
                            </span>
                          </span>
                          <span className='text-xs text-gray-500 dark:text-gray-400 flex-shrink-0 truncate'>
                            {p.marketplaceName}
                          </span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}

              {!showNoResults && (
                <div className='px-3 pb-2 pt-2 border-t border-gray-100 dark:border-gray-700 flex flex-col gap-1'>
                  {totals.marketplaces > 0 && (
                    <Link
                      href={`${marketplacesHref}?q=${encodeURIComponent(query.trim())}`}
                      onClick={() => {
                        rememberRecent(query.trim());
                        setOpen(false);
                      }}
                      className='text-sm text-primary-600 dark:text-primary-400 hover:underline flex items-center'
                    >
                      <CornerDownLeft className='h-3 w-3 mr-1.5' />
                      See all {totals.marketplaces} marketplace result
                      {totals.marketplaces === 1 ? '' : 's'}
                    </Link>
                  )}
                  {totals.plugins > 0 && (
                    <Link
                      href={`${pluginsHref}?q=${encodeURIComponent(query.trim())}`}
                      onClick={() => {
                        rememberRecent(query.trim());
                        setOpen(false);
                      }}
                      className='text-sm text-primary-600 dark:text-primary-400 hover:underline flex items-center'
                    >
                      <CornerDownLeft className='h-3 w-3 mr-1.5' />
                      See all {totals.plugins} plugin result{totals.plugins === 1 ? '' : 's'}
                    </Link>
                  )}
                </div>
              )}
            </div>
          )}

          {showNoResults && (
            <div className='p-4 text-center text-sm text-gray-500 dark:text-gray-400'>
              No matches for &quot;{query.trim()}&quot; — try a shorter keyword.
            </div>
          )}
        </div>
      )}

      {validationError && (
        <p className='mt-2 text-sm text-red-600 dark:text-red-400'>{validationError}</p>
      )}

      {/* Trending chips: real topics; clicking fills the combobox and shows matches */}
      {trending.length > 0 && (
        <div className='mt-4 sm:mt-5 flex flex-wrap gap-2 justify-center'>
          <span className='text-sm text-gray-600 dark:text-gray-400 font-medium self-center'>
            Trending topics:
          </span>
          {trending.map((tag) => (
            <button
              key={tag}
              type='button'
              onClick={() => {
                setQuery(tag);
                setDebounced(tag);
                setActiveIndex(-1);
                setOpen(true);
                inputRef.current?.focus();
              }}
              className='badge badge-secondary hover:border-primary-300 dark:hover:border-primary-600 hover:text-primary-700 dark:hover:text-primary-300 transition-all cursor-pointer'
              aria-label={`Search for ${tag}`}
            >
              {tag}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default SearchCombobox;
