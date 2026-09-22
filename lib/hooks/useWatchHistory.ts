import { useState, useEffect } from 'react';
import type { TMDBMovie } from '../../types/tmdb';

const STORAGE_KEY = 'sage_movies_watch_history';
const MAX_HISTORY = 20;

export function useWatchHistory() {
  const [history, setHistory] = useState<TMDBMovie[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          // Hydrate the device's history after SSR.
          // eslint-disable-next-line react-hooks/set-state-in-effect
          setHistory(
            parsed.filter((item) => item && typeof item.id === 'number').slice(0, MAX_HISTORY)
          );
        }
      }
    } catch {
      /* Private browsing can deny access to storage. */
    }
  }, []);

  const persist = (items: TMDBMovie[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      /* Playback must work even when storage is full or disabled. */
    }
  };

  const addToHistory = (movie: TMDBMovie) => {
    setHistory((prev) => {
      // Remove existing entry if it exists
      const type = movie.media_type || (movie.first_air_date ? 'tv' : 'movie');
      const filtered = prev.filter(
        (m) => m.id !== movie.id || (m.media_type || (m.first_air_date ? 'tv' : 'movie')) !== type
      );
      // Add new entry to the beginning
      const updated = [movie, ...filtered].slice(0, MAX_HISTORY);
      persist(updated);
      return updated;
    });
  };

  const removeFromHistory = (movieId: number) => {
    setHistory((prev) => {
      const updated = prev.filter((m) => m.id !== movieId);
      persist(updated);
      return updated;
    });
  };

  const clearHistory = () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* Clear in memory regardless. */
    }
    setHistory([]);
  };

  return { history, addToHistory, removeFromHistory, clearHistory };
}
