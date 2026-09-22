'use client';

import { useEffect, useRef, useState } from 'react';
import type { StreamingService } from '../lib/streamingServices';
import type { TMDBMovie } from '../types/tmdb';
import MovieRow from './MovieRow';
import { MovieRowSkeleton } from './LoadingSkeleton';
import { fetchJSON } from '../lib/utils/fetchJSON';

export default function ServiceShelf({
  service,
  onSeeAll,
  onLoaded,
}: {
  service: StreamingService;
  onSeeAll: (items: TMDBMovie[]) => void;
  onLoaded: (items: TMDBMovie[]) => void;
}) {
  const container = useRef<HTMLDivElement>(null);
  const [items, setItems] = useState<TMDBMovie[] | null>(null);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    const load = async () => {
      try {
        setError(false);
        const kind = service.isCompany ? 'studio' : 'provider';
        const data = await fetchJSON<{ results?: TMDBMovie[] }>(
          `/api/movies/${kind}/${service.id}`,
          { signal: controller.signal }
        );
        if (controller.signal.aborted) return;
        const results = data.results || [];
        setItems(results);
        onLoaded(results);
      } catch {
        if (!controller.signal.aborted) setError(true);
      }
    };
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          observer.disconnect();
          void load();
        }
      },
      { rootMargin: '400px' }
    );
    if (container.current) observer.observe(container.current);
    return () => {
      observer.disconnect();
      controller.abort();
    };
  }, [service, onLoaded, attempt]);

  return (
    <div ref={container} id={service.rowId} className="min-h-[310px] md:min-h-[385px] scroll-mt-24">
      {items?.length ? (
        <MovieRow
          title={`${service.name} Movies`}
          items={items}
          id={`${service.rowId}-titles`}
          onSeeAll={() => onSeeAll(items)}
        />
      ) : error ? (
        <div className="p-8">
          <p className="mb-3 text-zinc-400">Couldn’t load {service.name}.</p>
          <button
            onClick={() => setAttempt((value) => value + 1)}
            className="rounded bg-zinc-800 px-4 py-2"
          >
            Retry
          </button>
        </div>
      ) : items ? (
        <p className="p-8 text-zinc-400">No titles available for {service.name} right now.</p>
      ) : (
        <div className="p-8">
          <h3 className="mb-4 font-bold">{service.name} Movies</h3>
          <MovieRowSkeleton />
        </div>
      )}
    </div>
  );
}
