'use client';

import Image from 'next/image';
import { Search, Play, X, Star } from 'lucide-react';
import { motion } from 'framer-motion';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

const THUMB_URL = 'https://image.tmdb.org/t/p/w500';

export default function SearchModal({ onClose, query, setQuery, results, isSearching, onSelectMovie }) {
  // Common platforms for "Quick Explore"
  const platforms = [
    { name: 'Vivamax', icon: '🇵🇭' },
    { name: 'Netflix', icon: '🔴' },
    { name: 'HBO', icon: '📺' },
    { name: 'Disney', icon: '🏰' },
    { name: 'Amazon', icon: '📦' },
    { name: 'Apple', icon: '🍎' }
  ];

  // Group results for better organization
  const platformMatches = results.filter(m => m.relevance_score === 110);
  const exactMatches = results.filter(m => m.relevance_score === 100);
  const startsWithMatches = results.filter(m => m.relevance_score === 90);
  const otherMatches = results.filter(m => m.relevance_score < 90);

  const renderSection = (title, items, isHighPriority = false) => {
    if (items.length === 0) return null;
    return (
      <div className="mb-10 w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
        <h3 className={cn("text-xl font-bold mb-6 px-2 border-l-4 transition-colors", isHighPriority ? "border-netflix-red text-netflix-red" : "border-gray-500 text-white")}>
          {title}
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6 px-2">
          {items.map((item) => (
            <div 
              key={`${item.id}-${item.media_type || 'any'}`}
              onClick={() => onSelectMovie(item)}
              className="flex flex-col gap-2 cursor-pointer transition-all duration-300 hover:scale-105 group"
            >
              <div className="relative aspect-[2/3] w-full overflow-hidden rounded-md shadow-2xl">
                <Image 
                  src={item.poster_path ? `${THUMB_URL}${item.poster_path}` : 'https://via.placeholder.com/500x750?text=No+Image'}
                  alt={item.title || item.name}
                  fill
                  className="object-cover group-hover:brightness-50 transition-all duration-300"
                />
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
                  <span>{item.release_date?.split('-')[0] || item.first_air_date?.split('-')[0] || 'N/A'}</span>
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
      <button onClick={onClose} className="absolute top-5 right-5 text-gray-400 hover:text-white transition-colors bg-gray-800/50 p-2 rounded-full">
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
            className="w-full bg-[#222] text-white text-xl border-2 border-transparent focus:border-netflix-red rounded-xl pl-14 pr-4 py-4 outline-none transition-all shadow-2xl"
          />
          {isSearching && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2">
              <div className="w-6 h-6 border-2 border-netflix-red border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </div>
        
        {/* Quick Links for Platforms */}
        {!query && (
          <div className="mt-6 animate-in fade-in zoom-in-95 duration-500">
            <p className="text-gray-500 text-sm mb-3">Popular Platforms:</p>
            <div className="flex flex-wrap gap-2">
              {platforms.map(p => (
                <button 
                  key={p.name}
                  onClick={() => setQuery(p.name)}
                  className="bg-[#333] hover:bg-netflix-red text-white px-4 py-2 rounded-full text-sm transition font-medium flex items-center"
                >
                  <span className="mr-2">{p.icon}</span> {p.name}
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

        {query && (
          <>
            {renderSection("Originating Platform Matches", platformMatches, true)}
            {renderSection("Exact Matches", exactMatches, true)}
            {renderSection("Starts With", startsWithMatches)}
            {renderSection("Related Results", otherMatches)}
            
            {!isSearching && results.length === 0 && (
              <div className="flex flex-col items-center justify-center mt-20 opacity-50">
                <Search className="w-16 h-16 mb-4" />
                <p className="text-xl">No results found for "{query}"</p>
                <p className="text-sm mt-2">Try searching for a platform like "Vivamax" or "Netflix"</p>
              </div>
            )}
          </>
        )}
      </div>
    </motion.div>
  );
}
