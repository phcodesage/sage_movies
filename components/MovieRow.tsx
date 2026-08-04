'use client';

import React, { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Play, ChevronLeft, ChevronRight, ArrowRight, Star } from 'lucide-react';
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
    <section id={id} className="relative my-8 px-4 md:px-8 group font-sans">
      {/* Xbox Console Section Header */}
      <div className="flex items-center justify-between mb-4 border-b-4 border-black pb-2">
        <div className="flex items-center space-x-2">
          <span className="w-4 h-4 bg-[#107C10] border-2 border-black inline-block" />
          <h3 className="text-base md:text-xl font-black tracking-tighter text-white uppercase bg-black px-3 py-1 border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
            🎮 {title}
          </h3>
        </div>

        {onSeeAll && (
          <button
            onClick={onSeeAll}
            className="flex items-center space-x-1.5 text-xs font-black uppercase tracking-wider bg-[#FFE600] text-black px-3.5 py-1.5 border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:bg-black hover:text-[#FFE600] hover:-translate-y-0.5 transition-all"
          >
            <span>ALL TILES</span>
            <ArrowRight className="w-4 h-4 stroke-[3]" />
          </button>
        )}
      </div>

      {/* Row Container with Scroll Buttons */}
      <div className="relative">
        <button
          onClick={() => scroll('left')}
          className="absolute -left-3 top-1/2 -translate-y-1/2 z-30 bg-[#FFE600] text-black border-3 border-black p-2.5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] opacity-0 group-hover:opacity-100 hover:scale-110 active:translate-x-0.5 active:translate-y-0.5 transition-all"
        >
          <ChevronLeft className="w-6 h-6 stroke-[3]" />
        </button>

        <div
          ref={rowRef}
          className="flex space-x-4 overflow-x-auto no-scrollbar scroll-smooth py-3 px-1"
        >
          {items.map((item) => {
            const studio = getStudioInfo(item.production_companies);
            const rating = item.vote_average ? item.vote_average.toFixed(1) : '8.0';

            return (
              <div
                key={item.id}
                onClick={() => handleMovieClick(item)}
                onMouseEnter={(e) => handleMouseEnter(item, e)}
                onMouseLeave={handleMouseLeave}
                className="min-w-[120px] md:min-w-[170px] cursor-pointer group/poster shrink-0"
              >
                {/* Xbox Game Tile Box (Neo-Brutalism) */}
                <div className="relative h-[180px] md:h-[250px] bg-black border-4 border-black shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] group-hover/poster:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] group-hover/poster:-translate-x-1 group-hover/poster:-translate-y-1 transition-all duration-200 overflow-hidden">
                  <Image
                    src={`${THUMB_URL}${item.poster_path}`}
                    alt={item.title || item.name || ''}
                    fill
                    className="object-cover"
                    loading="lazy"
                    sizes="(max-width: 768px) 120px, 170px"
                  />

                  {/* Top Xbox Tag Badge */}
                  <div className="absolute top-2 left-2 z-20 bg-black text-[#FFE600] text-[9px] font-black uppercase px-2 py-0.5 border border-black font-mono">
                    4K HDR
                  </div>

                  {/* Rating Tag */}
                  <div className="absolute top-2 right-2 z-20 bg-[#107C10] text-white text-[9px] font-black uppercase px-1.5 py-0.5 border border-black flex items-center space-x-0.5">
                    <Star className="w-2.5 h-2.5 fill-current" />
                    <span>{rating}</span>
                  </div>

                  {/* Bottom Hover Play Banner */}
                  <div className="absolute inset-x-0 bottom-0 bg-black/90 border-t-3 border-black p-2 flex items-center justify-between text-white opacity-0 group-hover/poster:opacity-100 transition-opacity">
                    <span className="text-[10px] font-black uppercase tracking-wider text-[#FFE600] truncate">
                      {item.title || item.name}
                    </span>
                    <span className="bg-[#FF3366] text-white text-[9px] font-black px-1.5 py-0.5 border border-black shrink-0">
                      [A] PLAY
                    </span>
                  </div>
                </div>

                {/* Card Title Label */}
                <p className="mt-2 text-xs font-black text-white uppercase tracking-tight truncate group-hover/poster:text-[#FFE600] transition-colors">
                  {item.title || item.name}
                </p>
              </div>
            );
          })}
        </div>

        <button
          onClick={() => scroll('right')}
          className="absolute -right-3 top-1/2 -translate-y-1/2 z-30 bg-[#FFE600] text-black border-3 border-black p-2.5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] opacity-0 group-hover:opacity-100 hover:scale-110 active:translate-x-0.5 active:translate-y-0.5 transition-all"
        >
          <ChevronRight className="w-6 h-6 stroke-[3]" />
        </button>
      </div>

      {/* Hover Preview Card */}
      {hoveredMovie && (
        <PreviewCard
          movie={hoveredMovie}
          position={previewPos}
          isVisible={Boolean(hoveredMovie)}
          onClose={() => setHoveredMovie(null)}
          onPlay={() => handleMovieClick(hoveredMovie)}
        />
      )}
    </section>
  );
}
