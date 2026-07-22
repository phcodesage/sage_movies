'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Search, Play, X, Star, ArrowRight } from 'lucide-react';
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

  // Brand queries ("netflix", "prime video", …) get a dedicated platform view
  // instead of being mixed into title matches. `titleModeFor` remembers which
  // brand the user opted out of — keyed on the brand so switching to a different
  // brand query automatically returns to platform view, with no effect needed.
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

  // Group results for better organization
  const platformMatches = results.filter((m) => m.relevance_score === 110);
  const exactMatches = results.filter((m) => m.relevance_score === 100);
  const startsWithMatches = results.filter((m) => m.relevance_score === 90);
  const otherMatches = results.filter((m) => (m.relevance_score ?? 0) < 90);

  const renderSection = (title: string, items: TMDBMovie[], isHighPriority = false) => {
    if (items.length === 0) return null;
    return (
      <div className="mb-10 w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
        <h3
          className={cn(
            'text-xl font-bold mb-6 px-2 border-l-4 transition-colors',
            isHighPriority ? 'border-netflix-red text-netflix-red' : 'border-gray-500 text-white'
          )}
        >
          {title}
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6 px-2">
          {items.map((item) => (
            <div
              key={`${item.id}-${item.media_type || 'any'}`}
              onClick={() => handleMovieClick(item)}
              className="flex flex-col gap-2 cursor-pointer transition-all duration-300 hover:scale-105 group"
            >
              <div className="relative aspect-[2/3] w-full overflow-hidden rounded-md shadow-2xl bg-gray-900">
                {/* via.placeholder.com is dead (500s through next/image), so
                    posterless items get a styled box instead of a remote fallback */}
                {item.poster_path ? (
                  <Image
                    src={`${THUMB_URL}${item.poster_path}`}
                    alt={item.title || item.name || ''}
                    fill
                    className="object-cover group-hover:brightness-50 transition-all duration-300"
                    sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 16vw"
                  />
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-gray-600 border border-gray-800 rounded-md">
                    <Search className="w-8 h-8" />
                    <span className="text-[10px] font-bold uppercase">No Image</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-netflix-red/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Play className="w-10 h-10 text-white fill-current transform scale-0 group-hover:scale-100 transition-transform duration-300" />
                </div>
              </div>
              <div className="mt-2">
                <h4 className="font-bold text-sm line-clamp-2 leading-tight group-hover:text-netflix-red transition-colors">
                  {item.title || item.name}
                </h4>
                <div className="flex items-center text-[11px] text-gray-400 mt-1 font-medium">
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
      </div>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-[#141414] flex flex-col items-center pt-20 px-4"
    >
      <button
        onClick={onClose}
        className="absolute top-5 right-5 text-gray-400 hover:text-white transition-colors bg-gray-800/50 p-2 rounded-full"
      >
        <X className="w-8 h-8" />
      </button>

      <div className="w-full max-w-2xl mx-auto mb-10">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-6 h-6" />
          <input
            autoFocus
            type="text"
            placeholder="Search for movies, platforms (e.g. Vivamax)..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-[#222] text-white text-xl border-2 border-transparent focus:border-netflix-red rounded-xl pl-14 pr-24 py-4 outline-none transition-all shadow-2xl"
          />
          {/* Spinner and clear button share the right gutter; the spinner sits inboard
              so the clear button never shifts position mid-search. */}
          <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
            {isSearching && (
              <div className="w-6 h-6 border-2 border-netflix-red border-t-transparent rounded-full animate-spin" />
            )}
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                aria-label="Clear search"
                title="Clear search"
                className="text-gray-400 hover:text-white bg-white/10 hover:bg-white/20 rounded-full p-1.5 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Quick Links for Platforms */}
        {!query && (
          <div className="mt-6 animate-in fade-in zoom-in-95 duration-500">
            <p className="text-gray-500 text-sm mb-3">Popular Platforms:</p>
            <div className="flex flex-wrap gap-2">
              {SEARCH_BRANDS.map((b) => (
                <button
                  key={b.key}
                  onClick={() => setQuery(b.label)}
                  className="bg-[#333] hover:bg-netflix-red text-white pl-1.5 pr-4 py-1.5 rounded-full text-sm transition font-medium flex items-center gap-2"
                >
                  <span className="relative w-7 h-7 rounded-full overflow-hidden shrink-0">
                    <Image
                      src={`${LOGO_URL}${b.logoPath}`}
                      alt={b.label}
                      fill
                      className="object-cover"
                      sizes="28px"
                    />
                  </span>
                  {b.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="w-full max-w-7xl overflow-y-auto pr-2 custom-scrollbar pb-32">
        {!query && (
          <div className="flex flex-col items-center justify-center mt-20 opacity-30">
            <Search className="w-24 h-24 mb-4" />
            <p className="text-2xl font-bold">Discover Your Next Movie</p>
            <p className="text-sm">Search by title, genre, or platform (e.g. Netflix, Vivamax)</p>
          </div>
        )}

        {/* Brand view: the query is a platform, show its catalog — not title matches */}
        {query && brand && !showTitleResults && (
          <>
            <div className="flex flex-wrap items-center justify-between gap-4 mb-8 px-2">
              <div className="flex items-center gap-4">
                <span className="relative w-12 h-12 rounded-xl overflow-hidden border border-gray-700 shrink-0">
                  <Image
                    src={`${LOGO_URL}${brand.logoPath}`}
                    alt={brand.label}
                    fill
                    className="object-cover"
                    sizes="48px"
                  />
                </span>
                <div>
                  <h3 className="text-2xl font-black text-white leading-tight">{brand.label}</h3>
                  <p className="text-xs text-gray-400">Movies & shows from {brand.label}</p>
                </div>
              </div>
              <button
                onClick={() => setTitleModeFor(brand.key)}
                className="flex items-center gap-2 text-sm text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 border border-gray-700 px-4 py-2 rounded-full transition-colors"
              >
                Search &quot;{query}&quot; as a movie title instead{' '}
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {renderSection(`Popular on ${brand.label}`, platformMatches, true)}

            {!isSearching && platformMatches.length === 0 && (
              <div className="flex flex-col items-center justify-center mt-20 opacity-70 gap-4">
                <Search className="w-16 h-16" />
                <p className="text-xl">No {brand.label} catalog results right now</p>
                <button
                  onClick={() => setTitleModeFor(brand.key)}
                  className="text-netflix-red font-bold text-sm hover:underline"
                >
                  Search &quot;{query}&quot; as a movie title instead
                </button>
              </div>
            )}
          </>
        )}

        {/* Title view: regular search; for brand queries a switch back is offered */}
        {query && showTitleResults && (
          <>
            {brand && (
              <button
                onClick={() => setTitleModeFor(null)}
                className="flex items-center gap-2.5 mb-8 mx-2 text-sm text-white bg-white/5 hover:bg-white/10 border border-gray-700 pl-1.5 pr-4 py-1.5 rounded-full transition-colors"
              >
                <span className="relative w-7 h-7 rounded-full overflow-hidden shrink-0">
                  <Image
                    src={`${LOGO_URL}${brand.logoPath}`}
                    alt={brand.label}
                    fill
                    className="object-cover"
                    sizes="28px"
                  />
                </span>
                Show {brand.label} platform results instead
              </button>
            )}

            {!brand && renderSection('Originating Platform Matches', platformMatches, true)}
            {renderSection('Exact Matches', exactMatches, true)}
            {renderSection('Starts With', startsWithMatches)}
            {renderSection('Related Results', otherMatches)}

            {!isSearching && results.length === 0 && (
              <div className="flex flex-col items-center justify-center mt-20 opacity-50">
                <Search className="w-16 h-16 mb-4" />
                <p className="text-xl">No results found for "{query}"</p>
                <p className="text-sm mt-2">
                  Try searching for a platform like "Vivamax" or "Netflix"
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </motion.div>
  );
}
