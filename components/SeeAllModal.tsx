'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { Play, Star, X, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import type { TMDBMovie } from '../types/tmdb';

const THUMB_URL = 'https://image.tmdb.org/t/p/w500';

interface SeeAllModalProps {
  title: string;
  items: TMDBMovie[];
  onClose: () => void;
  category?: string; // e.g., 'movies', 'tv', 'anime', or a genre ID
}

export default function SeeAllModal({
  title,
  items: initialItems,
  onClose,
  category,
}: SeeAllModalProps) {
  const router = useRouter();
  const [items, setItems] = useState<TMDBMovie[]>(initialItems);
  const [page, setPage] = useState(1);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const observerTarget = useRef<HTMLDivElement>(null);

  const handleMovieClick = (item: TMDBMovie) => {
    const slug = (item.title || item.name || '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    const mediaType = item.media_type || (item.first_air_date ? 'tv' : 'movie');
    router.push(`/movie/${item.id}/${mediaType}-${slug}`);
    onClose();
  };

  const fetchMore = async () => {
    if (isLoadingMore || !hasMore || !category || category === 'history') return;

    setIsLoadingMore(true);
    try {
      const nextPage = page + 1;
      let url = '';

      if (category === 'trending_movies') url = `/api/movies/collection?page=${nextPage}`;
      else if (category === 'trending_tv') url = `/api/tv/collection?page=${nextPage}`;
      else if (category === 'anime') url = `/api/anime/collection?page=${nextPage}`;
      else if (category.startsWith('provider_'))
        url = `/api/movies/provider/${category.slice('provider_'.length)}?page=${nextPage}`;
      else if (!isNaN(parseInt(category))) url = `/api/movies/genre/${category}?page=${nextPage}`;

      if (!url) {
        setHasMore(false);
        return;
      }

      const res = await fetch(url);
      const data = await res.json();

      if (data.results && data.results.length > 0) {
        setItems((prev) => {
          const newItems = [...prev, ...data.results];
          // Filter duplicates
          return Array.from(new Map(newItems.map((item) => [item.id, item])).values());
        });
        setPage(nextPage);
        setHasMore(data.hasMore);
      } else {
        setHasMore(false);
      }
    } catch (error) {
      console.error('Error fetching more items:', error);
      setHasMore(false);
    } finally {
      setIsLoadingMore(false);
    }
  };

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoadingMore) {
          fetchMore();
        }
      },
      { threshold: 0.1 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => observer.disconnect();
  }, [observerTarget, hasMore, isLoadingMore, page]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-netflix-black flex flex-col"
    >
      <header className="flex items-center justify-between px-4 md:px-8 py-4 bg-netflix-black/80 backdrop-blur-md sticky top-0 z-10 border-b border-gray-800">
        <h2 className="text-xl md:text-3xl font-extrabold text-white">{title}</h2>
        <button onClick={onClose} className="p-2 hover:bg-gray-800 rounded-full transition-colors">
          <X className="w-6 h-6 md:w-8 md:h-8" />
        </button>
      </header>

      <div className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7 gap-4 md:gap-6">
          {items.map((item) => (
            <div
              key={`${item.id}-${item.media_type}`}
              onClick={() => handleMovieClick(item)}
              className="flex flex-col gap-2 cursor-pointer group transition-all duration-300"
            >
              <div className="relative aspect-[2/3] w-full overflow-hidden rounded-md shadow-lg group-hover:scale-105 transition-transform duration-300">
                <Image
                  src={
                    item.poster_path
                      ? `${THUMB_URL}${item.poster_path}`
                      : 'https://via.placeholder.com/500x750?text=No+Image'
                  }
                  alt={item.title || item.name || ''}
                  fill
                  className="object-cover group-hover:brightness-50 transition-all duration-300"
                  sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 14vw"
                />
                <div className="absolute inset-0 bg-netflix-red/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Play className="w-8 h-8 md:w-10 md:h-10 text-white fill-current transform scale-0 group-hover:scale-100 transition-transform duration-300" />
                </div>
              </div>
              <div className="mt-1">
                <h4 className="font-bold text-xs md:text-sm line-clamp-2 leading-tight group-hover:text-netflix-red transition-colors">
                  {item.title || item.name}
                </h4>
                <div className="flex items-center text-[10px] md:text-xs text-gray-500 mt-1 font-medium">
                  <span className="flex items-center text-yellow-500 mr-2">
                    <Star className="w-3 h-3 mr-0.5 fill-current" />
                    {item.vote_average?.toFixed(1) || '0.0'}
                  </span>
                  <span className="bg-gray-800 px-1.5 py-0.5 rounded text-[10px] uppercase mr-2">
                    {item.media_type === 'movie' ? 'Movie' : 'TV'}
                  </span>
                  <span>
                    {item.release_date?.split('-')[0] ||
                      item.first_air_date?.split('-')[0] ||
                      'N/A'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Loading Indicator / Intersection Target */}
        <div
          ref={observerTarget}
          className="py-12 flex flex-col items-center justify-center text-gray-500"
        >
          {isLoadingMore ? (
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-netflix-red" />
              <p className="text-sm font-medium animate-pulse">Loading more magic...</p>
            </div>
          ) : hasMore && category && category !== 'history' ? (
            <div className="h-20" />
          ) : (
            <div className="text-center animate-in fade-in duration-1000">
              <p className="text-lg font-bold text-gray-400">
                You've reached the end of the collection.
              </p>
              <p className="mt-2 italic">New titles are added every day!</p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
