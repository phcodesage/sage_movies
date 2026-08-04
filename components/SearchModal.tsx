'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Search, Play, X, Star, Film } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '../lib/utils';
import { SEARCH_BRANDS, matchSearchBrand } from '../lib/streamingServices';
import type { TMDBMovie } from '../types/tmdb';

const THUMB_URL = 'https://image.tmdb.org/t/p/w500';
const LOGO_URL = 'https://image.tmdb.org/t/p/w92';

interface SearchModalProps {
  onClose: () => void;
  query: string;
  setQuery: (query: string) => void;
  results: TMDBMovie[];
  isSearching: boolean;
}

export default function SearchModal({
  onClose,
  query,
  setQuery,
  results,
  isSearching,
}: SearchModalProps) {
  const router = useRouter();

  const brand = query ? matchSearchBrand(query) : undefined;
  const [titleModeFor, setTitleModeFor] = useState<string | null>(null);
  const showTitleResults = !brand || titleModeFor === brand.key;

  const handleMovieClick = (movie: TMDBMovie) => {
    const slug = (movie.title || movie.name || '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    const mediaType = movie.media_type || (movie.first_air_date ? 'tv' : 'movie');
    router.push(`/movie/${movie.id}/${mediaType}-${slug}`);
    onClose();
  };

  const renderSection = (title: string, items: TMDBMovie[], isHighPriority = false) => {
    if (items.length === 0) return null;
    return (
      <div className="mb-10 w-full font-sans">
        <div className="flex items-center space-x-2 mb-4 border-b-4 border-black pb-2">
          <span className="w-3.5 h-3.5 bg-[#107C10] border border-black inline-block" />
          <h3 className="text-base md:text-xl font-black tracking-tight text-white uppercase bg-black px-3 py-1 border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
            🎮 {title}
          </h3>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {items.map((item) => (
            <div
              key={`${item.id}-${item.media_type || 'any'}`}
              onClick={() => handleMovieClick(item)}
              className="flex flex-col cursor-pointer group"
            >
              <div className="relative aspect-[2/3] w-full bg-black border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] group-hover:shadow-[7px_7px_0px_0px_rgba(0,0,0,1)] group-hover:-translate-x-1 group-hover:-translate-y-1 transition-all duration-200 overflow-hidden">
                {item.poster_path ? (
                  <Image
                    src={`${THUMB_URL}${item.poster_path}`}
                    alt={item.title || item.name || ''}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 16vw"
                  />
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-zinc-600 bg-zinc-900">
                    <Film className="w-8 h-8" />
                    <span className="text-[10px] font-black uppercase">NO IMAGE</span>
                  </div>
                )}

                <div className="absolute top-2 left-2 z-20 bg-black text-[#FFE600] text-[9px] font-black uppercase px-1.5 py-0.5 border border-black font-mono">
                  4K HDR
                </div>

                <div className="absolute top-2 right-2 z-20 bg-[#107C10] text-white text-[9px] font-black uppercase px-1.5 py-0.5 border border-black flex items-center space-x-0.5">
                  <Star className="w-2.5 h-2.5 fill-current" />
                  <span>{item.vote_average ? item.vote_average.toFixed(1) : '8.0'}</span>
                </div>

                <div className="absolute inset-x-0 bottom-0 bg-black/90 border-t-3 border-black p-2 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-[10px] font-black uppercase text-[#FFE600] truncate">
                    {item.title || item.name}
                  </span>
                  <span className="bg-[#FF3366] text-white text-[9px] font-black px-1.5 py-0.5 border border-black shrink-0">
                    [A] PLAY
                  </span>
                </div>
              </div>
              <div className="mt-2">
                <h4 className="font-black text-xs uppercase text-white truncate group-hover:text-[#FFE600] transition-colors">
                  {item.title || item.name}
                </h4>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-[#0F1015]/95 backdrop-blur-md flex flex-col items-center pt-16 md:pt-20 px-4 font-sans"
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 bg-[#FF3366] text-white font-black text-xs p-2.5 border-3 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:bg-black transition active:scale-95"
      >
        <X className="w-6 h-6 stroke-[3]" />
      </button>

      <div className="w-full max-w-3xl mx-auto mb-8">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-black w-6 h-6 stroke-[3]" />
          <input
            autoFocus
            type="text"
            placeholder="SEARCH MOVIES, TV SHOWS, PLATFORMS..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-[#FFE600] text-black text-base md:text-lg font-black uppercase border-4 border-black focus:bg-white focus:text-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] pl-14 pr-24 py-4 outline-none transition-all placeholder:text-black/60"
          />
          <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
            {isSearching && (
              <div className="w-6 h-6 border-3 border-black border-t-[#1A9FFF] rounded-none animate-spin" />
            )}
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="bg-black text-white p-1.5 border border-black hover:bg-[#FF3366] transition-colors"
              >
                <X className="w-4 h-4 stroke-[3]" />
              </button>
            )}
          </div>
        </div>

        {/* Quick Links for Platforms */}
        {!query && (
          <div className="mt-6">
            <p className="text-zinc-400 text-xs font-black uppercase mb-3 tracking-wider">
              🎮 POPULAR PLATFORM TILES:
            </p>
            <div className="flex flex-wrap gap-2">
              {SEARCH_BRANDS.map((b) => (
                <button
                  key={b.key}
                  onClick={() => setQuery(b.label)}
                  className="bg-black text-white hover:bg-[#FFE600] hover:text-black px-3 py-1.5 border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] text-xs font-black uppercase tracking-wider flex items-center gap-2 hover:-translate-y-0.5 transition-all"
                >
                  <span className="relative w-5 h-5 rounded-none overflow-hidden shrink-0 border border-black">
                    <Image
                      src={`${LOGO_URL}${b.logoPath}`}
                      alt={b.label}
                      fill
                      className="object-cover"
                      sizes="20px"
                    />
                  </span>
                  {b.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="w-full max-w-7xl overflow-y-auto pr-2 no-scrollbar pb-32">
        {!query && (
          <div className="flex flex-col items-center justify-center mt-12 bg-black border-4 border-black p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] max-w-lg mx-auto text-center">
            <Search className="w-16 h-16 mb-4 text-[#1A9FFF] stroke-[3]" />
            <h3 className="text-xl font-black uppercase tracking-tight text-white mb-2">
              SEARCH SAGE MOVIES
            </h3>
            <p className="text-xs font-bold text-zinc-400">
              Type a movie title, TV series, or platform (e.g. Netflix, Vivamax, HBO Max)
            </p>
          </div>
        )}

        {query && results.length > 0 && (
          renderSection('SEARCH RESULTS', results, true)
        )}
      </div>
    </motion.div>
  );
}
