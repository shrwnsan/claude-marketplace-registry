import React, { useState, useEffect, useRef } from 'react';
import { Search, Filter, X, Clock } from 'lucide-react';
import { validateSearchQuery, ValidationResult } from '@/utils/security';
import { useAnalytics } from '../../utils/analytics/hooks';

interface SearchBarProps {
  onSearch: (query: string) => void;
  onFilterClick?: () => void;
  placeholder?: string;
  /** Real, data-derived chips shown under the input (e.g. top marketplace topics). */
  trending?: string[];
  /** Hide the trending row entirely (e.g. when the page renders its own filters). */
  showTrending?: boolean;
  ariaLabel?: string;
  className?: string;
}

const SearchBar: React.FC<SearchBarProps> = ({
  onSearch,
  onFilterClick,
  placeholder = 'Search…',
  trending = [],
  showTrending = true,
  ariaLabel,
  className = '',
}) => {
  const [query, setQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [validationError, setValidationError] = useState<string>('');
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { trackSearch } = useAnalytics();

  // Load recent searches from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('claude-marketplace-recent-searches');
      if (stored) setRecentSearches(JSON.parse(stored));
    } catch (error) {
      console.error('Failed to parse recent searches:', error);
    }
  }, []);

  const matchingRecent =
    query.length >= 2
      ? recentSearches.filter((s) => s.toLowerCase().includes(query.toLowerCase())).slice(0, 4)
      : recentSearches.slice(0, 4);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const performSearch = (searchQuery: string) => {
    if (!searchQuery.trim()) return;
    const validation: ValidationResult = validateSearchQuery(searchQuery.trim());
    if (!validation.isValid) {
      setValidationError(validation.errors[0] || 'Invalid search query');
      return;
    }
    const sanitizedQuery = validation.sanitized || searchQuery.trim();
    setValidationError('');

    const updatedRecent = [
      sanitizedQuery,
      ...recentSearches.filter((item) => item !== sanitizedQuery),
    ].slice(0, 5);
    setRecentSearches(updatedRecent);
    try {
      localStorage.setItem('claude-marketplace-recent-searches', JSON.stringify(updatedRecent));
    } catch {
      /* storage unavailable */
    }

    trackSearch(sanitizedQuery, 0);
    onSearch(sanitizedQuery);
    setShowSuggestions(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    performSearch(query);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuery = e.target.value;
    setQuery(newQuery);
    if (validationError) setValidationError('');

    if (newQuery.length === 0 || newQuery.length >= 2) {
      const validation: ValidationResult = validateSearchQuery(newQuery.trim());
      if (newQuery.length === 0 || validation.isValid) {
        onSearch(validation.sanitized || newQuery.trim());
      }
    }
  };

  const clearQuery = () => {
    setQuery('');
    onSearch('');
    inputRef.current?.focus();
  };

  return (
    <div className={`w-full max-w-3xl mx-auto ${className}`} ref={searchRef}>
      <form onSubmit={handleSubmit} className='relative'>
        {/* Unified input cluster: flex layout keeps icon/buttons aligned at every width */}
        <div className='flex items-stretch w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl shadow-sm hover:shadow-md focus-within:ring-2 focus-within:ring-primary-500 dark:focus-within:ring-primary-400 focus-within:border-primary-500 transition-all'>
          {/* Search icon */}
          <div className='flex items-center pl-3 sm:pl-4 pointer-events-none'>
            <Search className='h-5 w-5 text-gray-400 dark:text-gray-500' aria-hidden='true' />
          </div>

          {/* Search input */}
          <input
            ref={inputRef}
            type='text'
            name='search'
            id='search'
            value={query}
            onChange={handleInputChange}
            onFocus={() => setShowSuggestions(true)}
            className='block flex-1 min-w-0 px-3 py-3 text-base bg-transparent border-0 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-0'
            placeholder={placeholder}
            autoComplete='off'
            aria-label={ariaLabel || placeholder}
            role='combobox'
            aria-expanded={showSuggestions}
            aria-haspopup='listbox'
          />

          {/* Clear button */}
          {query && (
            <button
              type='button'
              onClick={clearQuery}
              className='flex items-center px-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors'
              aria-label='Clear search'
            >
              <X className='h-4 w-4' />
            </button>
          )}

          {/* Filter button */}
          {onFilterClick && (
            <>
              <div className='flex items-center py-2 pl-1' aria-hidden='true'>
                <div className='h-6 w-px bg-gray-200 dark:bg-gray-600' />
              </div>
              <div className='flex items-center pr-2 pl-1'>
                <button
                  type='button'
                  onClick={() => onFilterClick()}
                  className='p-2 text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors rounded-lg'
                  aria-label='Toggle filters'
                >
                  <Filter className='h-5 w-5' />
                </button>
              </div>
            </>
          )}
        </div>

        {/* Validation error */}
        {validationError && (
          <div className='absolute z-50 w-full mt-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg shadow-sm'>
            <p className='text-sm text-red-600 dark:text-red-400 flex items-center'>
              <X className='h-4 w-4 mr-2' />
              {validationError}
            </p>
          </div>
        )}

        {/* Recent-search suggestions (only real, user-typed history) */}
        {showSuggestions && !validationError && matchingRecent.length > 0 && (
          <div className='absolute z-50 w-full mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg dark:shadow-gray-900/50 animate-slide-in'>
            <div className='p-3'>
              <h3 className='text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 flex items-center justify-between'>
                <span className='flex items-center'>
                  <Clock className='h-3 w-3 mr-1' />
                  Recent searches
                </span>
                <button
                  type='button'
                  onClick={() => {
                    setRecentSearches([]);
                    localStorage.removeItem('claude-marketplace-recent-searches');
                  }}
                  className='text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 normal-case tracking-normal'
                  aria-label='Clear recent searches'
                >
                  Clear
                </button>
              </h3>
              <div className='space-y-1' role='listbox'>
                {matchingRecent.map((suggestion) => (
                  <button
                    key={suggestion}
                    type='button'
                    onClick={() => {
                      setQuery(suggestion);
                      performSearch(suggestion);
                      inputRef.current?.focus();
                    }}
                    className='w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors flex items-center group'
                    role='option'
                    aria-selected={false}
                  >
                    <Clock className='h-3 w-3 mr-2 text-gray-400 group-hover:text-primary-500' />
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </form>

      {/* Trending chips — real data passed in by the page */}
      {showTrending && trending.length > 0 && (
        <div className='mt-4 sm:mt-5 flex flex-wrap gap-2 justify-center'>
          <span className='text-sm text-gray-600 dark:text-gray-400 font-medium self-center'>
            Trending topics:
          </span>
          {trending.map((tag) => (
            <button
              key={tag}
              onClick={() => {
                setQuery(tag);
                performSearch(tag);
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

export default SearchBar;
