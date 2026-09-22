import { useState, useEffect } from 'react';
import type { TMDBMovie } from '../../types/tmdb';
import { getCachedRequest, setCachedRequest } from '../utils/requestCache';
import { fetchJSON } from '../utils/fetchJSON';

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
    if (!query.trim()) return;
    const controller = new AbortController();
    const delayDebounce = setTimeout(async () => {
      try {
        const cacheKey = `search-${query}`;
        const cachedData = getCachedRequest(cacheKey);

        if (cachedData) {
          setResults(cachedData);
          setIsSearching(false);
          return;
        }

        const data = await fetchJSON<{ results?: TMDBMovie[] }>(
          `/api/search?query=${encodeURIComponent(query.trim())}`,
          { signal: controller.signal },
          10000
        );
        if (controller.signal.aborted) return;
        const searchResults = data.results || [];

        setResults(searchResults);
        setCachedRequest(cacheKey, searchResults);
      } catch (error) {
        if (!controller.signal.aborted) console.error('Search error:', error);
      } finally {
        if (!controller.signal.aborted) setIsSearching(false);
      }
    }, debounceMs);
    return () => {
      clearTimeout(delayDebounce);
      controller.abort();
    };
  }, [query, debounceMs]);

  const updateQuery = (value: string) => {
    if (value === query) return;
    setQuery(value);
    setResults([]);
    setIsSearching(Boolean(value.trim()));
  };
  return { query, setQuery: updateQuery, results, isSearching };
}
