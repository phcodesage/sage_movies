import { useState, useEffect } from 'react';
import type { TMDBMovie } from '../../types/tmdb';
import { getCachedRequest, setCachedRequest } from '../utils/requestCache';

interface UseSearchReturn {
  query: string;
  setQuery: (query: string) => void;
  results: TMDBMovie[];
  isSearching: boolean;
}

export function useSearch(debounceMs: number = 500): UseSearchReturn {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<TMDBMovie[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    if (!query) {
      setResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const delayDebounce = setTimeout(async () => {
      try {
        const cacheKey = `search-${query}`;
        const cachedData = getCachedRequest(cacheKey);

        if (cachedData) {
          setResults(cachedData);
          setIsSearching(false);
          return;
        }

        const res = await fetch(`/api/search?query=${encodeURIComponent(query)}`);
        const data = await res.json();
        const searchResults = data.results || [];

        setResults(searchResults);
        setCachedRequest(cacheKey, searchResults);
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setIsSearching(false);
      }
    }, debounceMs);
    return () => clearTimeout(delayDebounce);
  }, [query, debounceMs]);

  return { query, setQuery, results, isSearching };
}