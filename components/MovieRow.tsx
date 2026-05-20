'use client';

import React, { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Play, ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import type { TMDBMovie } from '../types/tmdb';
import PreviewCard from './PreviewCard';

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
  const [previewPos, setPreviewPos] = useState({ x: 0, y: 0 });
  const hoverTimeout = useRef<NodeJS.Timeout | null>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (rowRef.current) {
      const { scrollLeft, clientWidth } = rowRef.current;
      const scrollTo = direction === 'left' ? scrollLeft - clientWidth : scrollLeft + clientWidth;
      rowRef.current.scrollTo({ left: scrollTo, behavior: 'smooth' });
    }
  };

  const handleMovieClick = (item: TMDBMovie) => {
    const slug = (item.title || item.name || '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    const mediaType = item.media_type || (item.first_air_date ? 'tv' : 'movie');
    router.push(`/movie/${item.id}/${mediaType}-${slug}`);
  };

  const handleMouseEnter = (item: TMDBMovie, e: React.MouseEvent) => {
    if (hoverTimeout.current) clearTimeout(hoverTimeout.current);
    
    const rect = e.currentTarget.getBoundingClientRect();
    setPreviewPos({ x: rect.left + rect.width / 2, y: rect.top });
    
    hoverTimeout.current = setTimeout(() => {
      setHoveredMovie(item);
    }, 600); // 600ms delay before showing preview
  };

  const handleMouseLeave = () => {
    if (hoverTimeout.current) clearTimeout(hoverTimeout.current);
    setHoveredMovie(null);
  };

  return (
    <section id={id} className="mb-6 group">
      <div className="flex items-center justify-between mb-3 px-1">
        <h2 className="text-lg md:text-xl font-bold group-hover:text-netflix-red transition-colors">
          {title}
        </h2>
        {onSeeAll && items.length > 5 && (
          <button
            onClick={onSeeAll}
            className="text-netflix-red text-xs font-bold flex items-center hover:underline"
          >
            Explore All <ArrowRight className="w-3 h-3 ml-1" />
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
          {items.map((item) => (
            <div
              key={item.id}
              onClick={() => handleMovieClick(item)}
              onMouseEnter={(e) => handleMouseEnter(item, e)}
              onMouseLeave={handleMouseLeave}
              className="relative min-w-[100px] md:min-w-[140px] h-[150px] md:h-[210px] cursor-pointer transition-transform duration-300 hover:scale-105 hover:z-30 poster-hover group/poster shrink-0"
            >
              <Image
                src={`${THUMB_URL}${item.poster_path}`}
                alt={item.title || item.name || ''}
                fill
                className="rounded-md object-cover"
                loading="lazy"
                sizes="(max-width: 768px) 100px, 140px"
              />
              <div className="absolute inset-0 bg-netflix-red/20 opacity-0 group-hover/poster:opacity-100 transition-opacity rounded-md flex items-center justify-center">
                <Play className="w-8 h-8 text-white fill-current opacity-0 group-hover/poster:opacity-100 transition-opacity" />
              </div>
            </div>
          ))}
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
