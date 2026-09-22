'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import type { TMDBGenre } from '../../types/tmdb';
import type { ReactNode } from 'react';

interface AppContextType {
  genres: Record<number, string>;
  isLoadingGenres: boolean;
  refreshGenres: () => Promise<void>;
  hasDownloadedApp: boolean;
  markAppDownloaded: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

interface AppProviderProps {
  children: ReactNode;
}

export function AppProvider({ children }: AppProviderProps) {
  const [genres, setGenres] = useState<Record<number, string>>({});
  const [isLoadingGenres, setIsLoadingGenres] = useState(true);
  const [hasDownloadedApp, setHasDownloadedApp] = useState<boolean>(false);

  useEffect(() => {
    try {
      const downloaded = localStorage.getItem('sagemovies_app_downloaded') === 'true';
      if (downloaded) {
        // Hydrate the persisted browser preference after SSR.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setHasDownloadedApp(true);
      }
    } catch {
      /* Storage can be disabled by the browser. */
    }
  }, []);

  const markAppDownloaded = () => {
    try {
      localStorage.setItem('sagemovies_app_downloaded', 'true');
    } catch {
      /* Keep the in-memory preference when storage is unavailable. */
    }
    setHasDownloadedApp(true);
  };

  const fetchGenres = async () => {
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
    // Initialize the external genre catalog once after hydration.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchGenres();
  }, []);

  const refreshGenres = async () => {
    setIsLoadingGenres(true);
    await fetchGenres();
  };

  return (
    <AppContext.Provider
      value={{
        genres,
        isLoadingGenres,
        refreshGenres,
        hasDownloadedApp,
        markAppDownloaded,
      }}
    >
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
