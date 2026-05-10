'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import type { TMDBGenre } from '../../types/tmdb';
import type { ReactNode } from 'react';

interface AppContextType {
  genres: Record<number, string>;
  isLoadingGenres: boolean;
  refreshGenres: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

interface AppProviderProps {
  children: ReactNode;
}

export function AppProvider({ children }: AppProviderProps) {
  const [genres, setGenres] = useState<Record<number, string>>({});
  const [isLoadingGenres, setIsLoadingGenres] = useState(true);

  const fetchGenres = async () => {
    setIsLoadingGenres(true);
    try {
      const res = await fetch('/api/genres');
      const data = await res.json();

      const genreMap: Record<number, string> = {};
      if (data.genres) {
        data.genres.forEach((g: TMDBGenre) => {
          genreMap[g.id] = g.name;
        });
      }
      setGenres(genreMap);
    } catch (error) {
      console.error('Error fetching genres:', error);
    } finally {
      setIsLoadingGenres(false);
    }
  };

  useEffect(() => {
    fetchGenres();
  }, []);

  const refreshGenres = async () => {
    await fetchGenres();
  };

  return (
    <AppContext.Provider value={{ genres, isLoadingGenres, refreshGenres }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}