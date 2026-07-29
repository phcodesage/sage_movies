'use client';

import React, { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Play, ChevronLeft, ChevronRight, ArrowRight, Film } from 'lucide-react';
import type { TMDBMovie } from '../types/tmdb';
import PreviewCard from './PreviewCard';

import { getStudioInfo } from '../lib/studioLogos';

const THUMB_URL = 'https://image.tmdb.org/t/p/w500';

interface MovieRowProps {
  title: string;
  items: TMDBMovie[];
  id: string;
  onSeeAll?: () => void;
}

export default function MovieRow({ title, items, id, onSeeAll }: MovieRowProps) {
  const rowRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const [hoveredMovie, setHoveredMovie] = useState<TMDBMovie | null>(null);
  const [cardPosition, setCardPosition] = useState({ top: 0, left: 0 });
  const hoverTimer = useRef<NodeJS.Timeout | null>(null);

  const handleMovieClick = (movie: TMDBMovie) => {
    const slug = (movie.title || movie.name || '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    const mediaType = movie.media_type || (movie.first_air_date ? 'tv' : 'movie');
    router.push(`/movie/${movie.id}/${mediaType}-${slug}`);
  };

  const handleMouseEnter = (movie: TMDBMovie, event: React.MouseEvent<HTMLDivElement>) => {
    const target = event.currentTarget;
    hoverTimer.current = setTimeout(() => {
      const rect = target.getBoundingClientRect();
      setCardPosition({
        top: rect.top,
        left: rect.left,
      });
      setHoveredMovie(movie);
    }, 500);
  };

  const handleMouseLeave = () => {
    if (hoverTimer.current) {
      clearTimeout(hoverTimer.current);
    }
  };

  const scroll = (direction: 'left' | 'right') => {
    if (rowRef.current) {
      const { scrollLeft, clientWidth } = rowRef.current;
      const scrollAmount = direction === 'left' ? scrollLeft - clientWidth : scrollLeft + clientWidth;
      rowRef.current.scrollTo({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const previewPos = { x: cardPosition.left + 70, y: cardPosition.top };

  return (
    <section id={id} className="relative my-6 px-4 md:px-8 group">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm md:text-lg font-black tracking-wider text-gray-200 uppercase">
          {title}
        </h3>
        {onSeeAll && (
          <button
            onClick={onSeeAll}
            className="flex items-center text-xs font-bold text-gray-400 hover:text-netflix-red transition-colors group/btn"
          >
            <span>See All</span>
            <ArrowRight className="w-3.5 h-3.5 ml-1 transition-transform group-hover/btn:translate-x-1" />
          </button>
        )}
      </div>

      <div className="relative">
        <button
          onClick={() => scroll('left')}
          className="absolute left-0 top-0 bottom-0 z-10 bg-black/50 hover:bg-black/80 w-8 opacity-0 group-hover:opacity-100 transition flex items-center justify-center"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <div
          ref={rowRef}
          className="flex space-x-2 overflow-x-auto no-scrollbar scroll-smooth pb-2"
        >
          {items.map((item) => {
            const studio = getStudioInfo(item.production_companies);
            return (
              <div
                key={item.id}
                onClick={() => handleMovieClick(item)}
                onMouseEnter={(e) => handleMouseEnter(item, e)}
                onMouseLeave={handleMouseLeave}
                className="min-w-[100px] md:min-w-[140px] cursor-pointer group/poster shrink-0"
              >
                <div className="relative h-[150px] md:h-[210px] transition-transform duration-300 group-hover/poster:scale-105 group-hover/poster:z-30 poster-hover">
                  <Image
                    src={`${THUMB_URL}${item.poster_path}`}
                    alt={item.title || item.name || ''}
                    fill
                    className="rounded-md object-cover"
                    loading="lazy"
                    sizes="(max-width: 768px) 100px, 140px"
                  />
                  {studio && (
                    <div className="absolute top-1.5 right-1.5 z-20 flex items-center gap-1 bg-zinc-900 px-2 py-0.5 rounded-full shadow-lg border border-zinc-800">
                      {studio.iconUrl ? (
                        <img
                          src={studio.iconUrl}
                          alt={studio.name}
                          className="w-3.5 h-3.5 object-contain rounded"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                      ) : (
                        <Film className="w-3 h-3 text-netflix-red" />
                      )}
                      <span className="text-[9px] font-black text-white uppercase tracking-tight line-clamp-1 max-w-[65px]">
                        {studio.name}
                      </span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-netflix-red/20 opacity-0 group-hover/poster:opacity-100 transition-opacity rounded-md flex items-center justify-center">
                    <Play className="w-8 h-8 text-white fill-current opacity-0 group-hover/poster:opacity-100 transition-opacity" />
                  </div>
                </div>
                <h4 className="mt-1.5 font-bold text-[11px] md:text-xs line-clamp-2 leading-tight text-gray-300 group-hover/poster:text-netflix-red transition-colors">
                  {item.title || item.name}
                </h4>
              </div>
            );
          })}
        </div>
        <button
          onClick={() => scroll('right')}
          className="absolute right-0 top-0 bottom-0 z-10 bg-black/50 hover:bg-black/80 w-8 opacity-0 group-hover:opacity-100 transition flex items-center justify-center"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      </div>

      <PreviewCard
        movie={hoveredMovie as TMDBMovie}
        isVisible={!!hoveredMovie}
        position={previewPos}
        onClose={() => setHoveredMovie(null)}
        onPlay={handleMovieClick}
      />
    </section>
  );
}
