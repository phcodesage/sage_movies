'use client';

import React, { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Star, Play, Search } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import { useSearch } from '../../../lib/hooks/useSearch';
import { useAppContext } from '../../../lib/context/AppContext';
import dynamic from 'next/dynamic';
import Navbar from '../../../components/Navbar';
import { MovieGridSkeleton } from '../../../components/LoadingSkeleton';
import type { TMDBMovie } from '../../../types/tmdb';

// Lazy load modals for better initial load performance
const SearchModal = dynamic(() => import('../../../components/SearchModal'), {
  loading: () => <div className="fixed inset-0 bg-netflix-black z-50" />,
  ssr: false
});

const MovieDetailModal = dynamic(() => import('../../../components/MovieDetailModal'), {
  loading: () => <div className="fixed inset-0 bg-black/95 z-50" />,
  ssr: false
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
        const moviesRes = await fetch(`/api/movies/genre/${id}`).then(res => res.json());

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
    <div className="min-h-screen bg-netflix-black text-white">
      {/* Navbar */}
      <Navbar onSearchClick={() => setIsSearchOpen(true)} />

      <div className="pt-20 md:pt-24 px-3 md:px-6 pb-16">
        <header className="mb-6">
          <h1 className="text-2xl md:text-4xl font-extrabold mb-2 border-l-4 md:border-l-8 border-netflix-red pl-4 md:pl-6">
            {genreName || 'Genre'} <span className="text-netflix-red">Movies</span>
          </h1>
          <p className="text-gray-400 text-sm md:text-base max-w-2xl">
            Exploring the best in {genreName?.toLowerCase()} cinema. Discover top-rated titles and hidden gems.
          </p>
        </header>

        {isLoading ? (
          <MovieGridSkeleton />
        ) : movies.length > 0 ? (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-3">
            {movies.map((item) => (
              <div
                key={item.id}
                onClick={() => handlePlayClick(item)}
                className="flex flex-col gap-2 cursor-pointer group transition-all duration-300"
              >
                <div className="relative aspect-[2/3] w-full overflow-hidden rounded-md shadow-lg group-hover:scale-105 transition-transform duration-300">
                  <Image
                    src={item.poster_path ? `${THUMB_URL}${item.poster_path}` : 'https://via.placeholder.com/500x750?text=No+Image'}
                    alt={item.title || item.name || ''}
                    fill
                    className="object-cover group-hover:brightness-50 transition-all duration-300"
                    sizes="(max-width: 640px) 33vw, (max-width: 768px) 25vw, (max-width: 1024px) 20vw, 14vw"
                  />
                  <div className="absolute inset-0 bg-netflix-red/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Play className="w-8 h-8 text-white fill-current transform scale-0 group-hover:scale-100 transition-transform duration-300" />
                  </div>
                </div>
                <div>
                  <h4 className="font-bold text-xs line-clamp-2 leading-tight group-hover:text-netflix-red transition-colors">
                    {item.title || item.name}
                  </h4>
                  <div className="flex items-center text-[10px] text-gray-500 mt-1">
                    <Star className="w-3 h-3 mr-1 fill-current text-yellow-500" />
                    {item.vote_average?.toFixed(1)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-40 opacity-50">
            <Search className="w-16 h-16 mb-4" />
            <p className="text-2xl font-bold">No movies found</p>
            <p className="text-gray-400 mt-2">We couldn't find any movies for this genre right now.</p>
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
