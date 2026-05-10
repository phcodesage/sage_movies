import { useState, useEffect } from 'react';
import type { TMDBMovie } from '../../types/tmdb';

const STORAGE_KEY = 'sage_movies_watch_history';
const MAX_HISTORY = 20;

export function useWatchHistory() {
  const [history, setHistory] = useState<TMDBMovie[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setHistory(JSON.parse(stored));
      } catch (e) {
        console.error('Failed to parse watch history', e);
      }
    }
  }, []);

  const addToHistory = (movie: TMDBMovie) => {
    setHistory((prev) => {
      // Remove existing entry if it exists
      const filtered = prev.filter((m) => m.id !== movie.id);
      // Add new entry to the beginning
      const updated = [movie, ...filtered].slice(0, MAX_HISTORY);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  const removeFromHistory = (movieId: number) => {
    setHistory((prev) => {
      const updated = prev.filter((m) => m.id !== movieId);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  const clearHistory = () => {
    localStorage.removeItem(STORAGE_KEY);
    setHistory([]);
  };

  return { history, addToHistory, removeFromHistory, clearHistory };
}
