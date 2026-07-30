import { useState, useEffect, useCallback } from 'react';

// Tracks which TV episodes the user has watched, keyed by `${tvId}:S${season}E${episode}`.
// Purely client-side (localStorage), mirroring useWatchHistory — there is no server-side
// user state in this app. The same key scheme is used by the Flutter app so the concept
// stays consistent across platforms even though the two stores never sync.
const STORAGE_KEY = 'sage_movies_watched_episodes';

function epKey(tvId: number | string, season: number, episode: number): string {
  return `${tvId}:S${season}E${episode}`;
}

export function useWatchedEpisodes() {
  const [watched, setWatched] = useState<Set<string>>(new Set());

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      // Hydrate from localStorage on mount — the store isn't available during SSR.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (stored) setWatched(new Set(JSON.parse(stored) as string[]));
    } catch (e) {
      console.error('Failed to parse watched episodes', e);
    }
  }, []);

  const persist = (next: Set<string>) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([...next]));
    } catch (e) {
      console.error('Failed to save watched episodes', e);
    }
  };

  const isWatched = useCallback(
    (tvId: number | string, season: number, episode: number) =>
      watched.has(epKey(tvId, season, episode)),
    [watched]
  );

  // Idempotent — called on every play, so it must not thrash state when already set.
  const markWatched = useCallback((tvId: number | string, season: number, episode: number) => {
    setWatched((prev) => {
      const k = epKey(tvId, season, episode);
      if (prev.has(k)) return prev;
      const next = new Set(prev);
      next.add(k);
      persist(next);
      return next;
    });
  }, []);

  const toggleWatched = useCallback((tvId: number | string, season: number, episode: number) => {
    setWatched((prev) => {
      const k = epKey(tvId, season, episode);
      const next = new Set(prev);
      if (next.has(k)) next.delete(k);
      else next.add(k);
      persist(next);
      return next;
    });
  }, []);

  return { isWatched, markWatched, toggleWatched };
}
