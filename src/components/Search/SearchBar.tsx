import React, { useState, useEffect, useRef } from 'react';
import { Search, Filter, X, Clock, TrendingUp } from 'lucide-react';
import { validateSearchQuery, ValidationResult } from '@/utils/security';
import { useAnalytics } from '../../utils/analytics/hooks';

interface SearchBarProps {
  onSearch: (query: string) => void;
  onFilterClick: () => void;
  placeholder?: string;
  className?: string;
}

interface SearchSuggestion {
  text: string;
  type: 'recent' | 'popular';
  count?: number;
}

const SearchBar: React.FC<SearchBarProps> = ({
  onSearch,
  onFilterClick,
  placeholder = 'Search plugins, marketplaces...',
  className = '',
}) => {
  const [query, setQuery] = useState('');
  const [_isFocused, setIsFocused] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [validationError, setValidationError] = useState<string>('');
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { trackSearch, trackFilter } = useAnalytics();

  // Popular search suggestions
  const popularSearches = [
    { text: 'code review', count: 1240 },
    { text: 'API documentation', count: 890 },
    { text: 'security testing', count: 756 },
    { text: 'React components', count: 623 },
    { text: 'TypeScript tools', count: 512 },
    { text: 'CI/CD pipeline', count: 445 },
  ];

  // Load recent searches from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('claude-marketplace-recent-searches');
    if (stored) {
      try {
        setRecentSearches(JSON.parse(stored));
      } catch (error) {
        console.error('Failed to parse recent searches:', error);
      }
    }
  }, []);

  // Update suggestions based on query
  useEffect(() => {
    if (query.length >= 2) {
      const filteredRecent = recentSearches
        .filter((search) => search.toLowerCase().includes(query.toLowerCase()))
        .slice(0, 3)
        .map((text) => ({ text, type: 'recent' as const }));

      const filteredPopular = popularSearches
        .filter((search) => search.text.toLowerCase().includes(query.toLowerCase()))
        .slice(0, 3)
        .map(({ text, count }) => ({ text, count, type: 'popular' as const }));

      setSuggestions([...filteredRecent, ...filteredPopular]);
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  }, [query, recentSearches]);

  // Handle click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    performSearch(query);
  };

  const performSearch = (searchQuery: string) => {
    if (searchQuery.trim()) {
      // Validate input before proceeding
      const validation: ValidationResult = validateSearchQuery(searchQuery.trim());

      if (!validation.isValid) {
        setValidationError(validation.errors[0] || 'Invalid search query');
        return;
      }

      // Use sanitized version if available
      const sanitizedQuery = validation.sanitized || searchQuery.trim();

      // Clear any previous validation error
      setValidationError('');

      // Save to recent searches
      const updatedRecent = [
        sanitizedQuery,
        ...recentSearches.filter((item) => item !== sanitizedQuery),
      ].slice(0, 5);

      setRecentSearches(updatedRecent);
      localStorage.setItem('claude-marketplace-recent-searches', JSON.stringify(updatedRecent));

      // Track search with analytics
      // Note: resultCount would be calculated from actual search results
      trackSearch(sanitizedQuery, 0); // This would be updated with actual result count

      onSearch(sanitizedQuery);
      setShowSuggestions(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuery = e.target.value;
    setQuery(newQuery);

    // Clear validation error when user types
    if (validationError) {
      setValidationError('');
    }

    // Trigger search on each keystroke (debounced would be better in production)
    if (newQuery.length === 0 || newQuery.length >= 2) {
      // Only trigger search if the input is valid
      if (newQuery.length === 0) {
        onSearch(newQuery);
      } else {
        const validation: ValidationResult = validateSearchQuery(newQuery.trim());
        if (validation.isValid) {
          const sanitizedQuery = validation.sanitized || newQuery.trim();
          onSearch(sanitizedQuery);
        }
      }
    }
  };

  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    setQuery(suggestion.text);
    performSearch(suggestion.text);
    inputRef.current?.focus();
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem('claude-marketplace-recent-searches');
  };

  const clearQuery = () => {
    setQuery('');
    onSearch('');
    inputRef.current?.focus();
  };

  return (
    <div className={`w-full max-w-4xl mx-auto ${className}`} ref={searchRef}>
      <form onSubmit={handleSubmit} className='relative'>
        <div className='relative group'>
          {/* Search icon */}
          <div className='absolute inset-y-0 left-0 pl-3 sm:pl-4 flex items-center pointer-events-none'>
            <Search
              className='h-5 w-5 text-gray-400 dark:text-gray-500 group-focus-within:text-primary-500 transition-colors'
              aria-hidden='true'
            />
          </div>

          {/* Search input */}
          <input
            ref={inputRef}
            type='text'
            name='search'
            id='search'
            value={query}
            onChange={handleInputChange}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            className='input block w-full pl-10 sm:pl-12 pr-20 sm:pr-24 py-3 sm:py-4 text-base sm:text-lg bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-primary-500 dark:focus:ring-primary-400 rounded-xl shadow-sm hover:shadow-md transition-all'
            placeholder={placeholder}
            autoComplete='off'
            aria-label='Search plugins and marketplaces'
            aria-expanded={showSuggestions}
            aria-haspopup='listbox'
            role='combobox'
          />

          {/* Clear button */}
          {query && (
            <button
              type='button'
              onClick={clearQuery}
              className='absolute inset-y-0 right-16 sm:right-20 flex items-center pr-2 sm:pr-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors'
              aria-label='Clear search'
            >
              <X className='h-4 w-4 sm:h-5 sm:w-5' />
            </button>
          )}

          {/* Filter button */}
          <div className='absolute inset-y-0 right-0 flex items-center pr-2 sm:pr-3'>
            <button
              type='button'
              onClick={() => {
                trackFilter('search-bar', 'open-filters');
                onFilterClick();
              }}
              className='btn-ghost p-2 sm:p-2.5 text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors rounded-lg'
              aria-label='Open filters'
            >
              <Filter className='h-5 w-5' />
            </button>
          </div>
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

        {/* Search suggestions dropdown */}
        {showSuggestions && !validationError && (
          <div className='absolute z-50 w-full mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg dark:shadow-gray-900/50 animate-slide-in'>
            {/* Recent searches */}
            {suggestions.filter((s) => s.type === 'recent').length > 0 && (
              <div className='p-3 border-b border-gray-200 dark:border-gray-700'>
                <div className='flex items-center justify-between mb-2'>
                  <h3 className='text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center'>
                    <Clock className='h-3 w-3 mr-1' />
                    Recent
                  </h3>
                  <button
                    onClick={clearRecentSearches}
                    className='text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors'
                    aria-label='Clear recent searches'
                  >
                    Clear all
                  </button>
                </div>
                <div className='space-y-1'>
                  {suggestions
                    .filter((s) => s.type === 'recent')
                    .map((suggestion, index) => (
                      <button
                        key={`recent-${index}`}
                        type='button'
                        onClick={() => handleSuggestionClick(suggestion)}
                        className='w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors flex items-center group'
                        role='option'
                      >
                        <Clock className='h-3 w-3 mr-2 text-gray-400 group-hover:text-primary-500' />
                        {suggestion.text}
                      </button>
                    ))}
                </div>
              </div>
            )}

            {/* Popular searches */}
            {suggestions.filter((s) => s.type === 'popular').length > 0 && (
              <div className='p-3'>
                <h3 className='text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 flex items-center'>
                  <TrendingUp className='h-3 w-3 mr-1' />
                  Popular
                </h3>
                <div className='space-y-1'>
                  {suggestions
                    .filter((s) => s.type === 'popular')
                    .map((suggestion, index) => (
                      <button
                        key={`popular-${index}`}
                        type='button'
                        onClick={() => handleSuggestionClick(suggestion)}
                        className='w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors flex items-center justify-between group'
                        role='option'
                      >
                        <span className='flex items-center'>
                          <TrendingUp className='h-3 w-3 mr-2 text-gray-400 group-hover:text-primary-500' />
                          {suggestion.text}
                        </span>
                        {suggestion.count && (
                          <span className='text-xs text-gray-500 dark:text-gray-400'>
                            {suggestion.count.toLocaleString()}
                          </span>
                        )}
                      </button>
                    ))}
                </div>
              </div>
            )}

            {/* No results */}
            {suggestions.length === 0 && query.length >= 2 && (
              <div className='p-4 text-center text-sm text-gray-500 dark:text-gray-400'>
                No suggestions found for &quot;{query}&quot;
              </div>
            )}
          </div>
        )}
      </form>

      {/* Quick search tags */}
      <div className='mt-4 sm:mt-6 flex flex-wrap gap-2 justify-center'>
        <span className='text-sm text-gray-600 dark:text-gray-400 font-medium self-center'>
          Trending:
        </span>
        {popularSearches.slice(0, 4).map((tag) => (
          <button
            key={tag.text}
            onClick={() => {
              setQuery(tag.text);
              performSearch(tag.text);
            }}
            className='badge badge-secondary hover:border-primary-300 dark:hover:border-primary-600 hover:text-primary-700 dark:hover:text-primary-300 transition-all cursor-pointer'
            aria-label={`Search for ${tag.text}`}
          >
            {tag.text}
          </button>
        ))}
      </div>
    </div>
  );
};

export default SearchBar;
