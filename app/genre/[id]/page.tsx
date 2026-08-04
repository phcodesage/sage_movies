'use client';

import React, { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Star, Play, Search, Film } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import { useSearch } from '../../../lib/hooks/useSearch';
import { useAppContext } from '../../../lib/context/AppContext';
import dynamic from 'next/dynamic';
import Navbar from '../../../components/Navbar';
import { MovieGridSkeleton } from '../../../components/LoadingSkeleton';
import type { TMDBMovie } from '../../../types/tmdb';

const SearchModal = dynamic(() => import('../../../components/SearchModal'), {
  loading: () => <div className="fixed inset-0 bg-[#0F1015] z-50" />,
  ssr: false,
});

const MovieDetailModal = dynamic(() => import('../../../components/MovieDetailModal'), {
  loading: () => <div className="fixed inset-0 bg-black/95 z-50" />,
  ssr: false,
});

const THUMB_URL = 'https://image.tmdb.org/t/p/w500';

interface GenrePageProps {
  params: Promise<{ id: string }>;
}

export default function GenrePage({ params }: GenrePageProps) {
  const resolvedParams = use(params);
  const id = resolvedParams.id;

  const [movies, setMovies] = useState<TMDBMovie[]>([]);
  const [genreName, setGenreName] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMovie, setSelectedMovie] = useState<TMDBMovie | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const { query: searchQuery, setQuery: setSearchQuery, results: searchResults, isSearching } = useSearch(500);
  const { genres } = useAppContext();
  const router = useRouter();

  const handlePlayClick = (movie: TMDBMovie) => {
    const slug = (movie.title || movie.name || '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    const mediaType = movie.media_type || (movie.first_air_date ? 'tv' : 'movie');
    router.push(`/movie/${movie.id}/${mediaType}-${slug}`);
  };

  useEffect(() => {
    if (!id) return;

    const fetchGenreData = async () => {
      setIsLoading(true);
      try {
        const moviesRes = await fetch(`/api/movies/genre/${id}`).then((res) => res.json());

        let currentGenreName = 'Genre';
        const numericId = parseInt(id);
        if (genres[numericId]) {
          currentGenreName = genres[numericId];
        }

        setGenreName(currentGenreName);
        setMovies(moviesRes.results || []);
      } catch (error) {
        console.error('Error fetching genre data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchGenreData();
  }, [id, genres]);

  return (
    <div className="min-h-screen bg-[#0F1015] text-white font-sans">
      {/* Navbar */}
      <Navbar onSearchClick={() => setIsSearchOpen(true)} />

      <div className="pt-24 md:pt-28 px-4 md:px-8 pb-20 max-w-7xl mx-auto">
        {/* Console Header */}
        <header className="mb-8 border-b-4 border-black pb-4">
          <div className="flex items-center space-x-3 mb-2">
            <span className="bg-[#107C10] text-white text-xs font-black px-2.5 py-1 border-2 border-black uppercase font-mono shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              CATALOG SEARCH
            </span>
            <span className="bg-[#FFE600] text-black text-xs font-black px-2.5 py-1 border-2 border-black uppercase tracking-wider shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              SAGE MOVIES
            </span>
          </div>

          <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tighter text-white">
            🎮 {genreName || 'Genre'} <span className="bg-[#FFE600] text-black px-2 py-0.5 border-3 border-black">COLLECTION</span>
          </h1>
          <p className="text-zinc-300 text-xs md:text-base font-bold max-w-2xl mt-3 bg-black p-3 border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
            Stream the best in {genreName?.toLowerCase()} titles in 1080p HD.
          </p>
        </header>

        {isLoading ? (
          <MovieGridSkeleton />
        ) : movies.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {movies.map((item) => (
              <div
                key={item.id}
                onClick={() => handlePlayClick(item)}
                className="cursor-pointer group flex flex-col"
              >
                <div className="relative aspect-[2/3] w-full bg-black border-4 border-black shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] group-hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] group-hover:-translate-x-1 group-hover:-translate-y-1 transition-all duration-200 overflow-hidden">
                  {item.poster_path ? (
                    <Image
                      src={`${THUMB_URL}${item.poster_path}`}
                      alt={item.title || item.name || ''}
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 50vw, 25vw"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-zinc-900">
                      <Film className="w-10 h-10 text-zinc-600" />
                    </div>
                  )}

                  <div className="absolute top-2 left-2 z-20 bg-black text-[#FFE600] text-[9px] font-black uppercase px-2 py-0.5 border border-black font-mono">
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

                <p className="mt-2 text-xs font-black text-white uppercase tracking-tight truncate group-hover:text-[#FFE600] transition-colors">
                  {item.title || item.name}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-24 bg-black border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] text-center p-6">
            <Search className="w-16 h-16 mb-4 text-[#FFE600] stroke-[3]" />
            <h3 className="text-xl font-black uppercase tracking-tight text-white mb-2">
              NO TITLES FOUND
            </h3>
            <p className="text-xs font-bold text-zinc-400 max-w-md">
              We couldn't find any titles for this category right now.
            </p>
          </div>
        )}
      </div>

      {/* Modals */}
      <AnimatePresence>
        {selectedMovie && (
          <MovieDetailModal
            movie={selectedMovie}
            onClose={() => setSelectedMovie(null)}
            genres={genres}
          />
        )}
        {isSearchOpen && (
          <SearchModal
            onClose={() => setIsSearchOpen(false)}
            query={searchQuery}
            setQuery={setSearchQuery}
            results={searchResults}
            isSearching={isSearching}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
