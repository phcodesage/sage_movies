'use client';

import { useState, useEffect, use } from 'react';
import Image from 'next/image';
import { Star, Play, ChevronLeft, ArrowLeft, Search, Bell, Gift, ChevronDown, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import Navbar from '../../../components/Navbar';
import SearchModal from '../../../components/SearchModal';
import MovieDetailModal from '../../../components/MovieDetailModal';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

const IMG_URL = 'https://image.tmdb.org/t/p/original';
const THUMB_URL = 'https://image.tmdb.org/t/p/w500';

export default function GenrePage({ params }) {
  const resolvedParams = use(params);
  const id = resolvedParams.id;
  
  const [movies, setMovies] = useState([]);
  const [genreName, setGenreName] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isScrolled, setIsScrolled] = useState(false);
  const [genres, setGenres] = useState({});
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    if (!id) return;

    const fetchGenreData = async () => {
      setIsLoading(true);
      try {
        const [genreRes, moviesRes] = await Promise.all([
          fetch('/api/genres').then(res => res.json()),
          fetch(`/api/movies/genre/${id}`).then(res => res.json())
        ]);

        const genreMap = {};
        let currentGenreName = 'Genre';

        if (genreRes.genres) {
          genreRes.genres.forEach(g => {
            genreMap[g.id] = g.name;
            if (g.id.toString() === id) {
              currentGenreName = g.name;
            }
          });
        }
        
        setGenreName(currentGenreName);
        setGenres(genreMap);
        setMovies(moviesRes.results || []);
      } catch (error) {
        console.error('Error fetching genre data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchGenreData();
  }, [id]);

  // Search logic
  useEffect(() => {
    if (!searchQuery) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const delayDebounce = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?query=${encodeURIComponent(searchQuery)}`);
        const data = await res.json();
        setSearchResults(data.results || []);
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setIsSearching(false);
      }
    }, 500);
    return () => clearTimeout(delayDebounce);
  }, [searchQuery]);

  return (
    <div className="min-h-screen bg-netflix-black text-white">
      {/* Navbar */}
      <Navbar onSearchClick={() => setIsSearchOpen(true)} genres={genres} />

      <div className="pt-32 px-4 md:px-14 pb-20">
        <header className="mb-10">
          <h1 className="text-4xl md:text-6xl font-extrabold mb-4 border-l-8 border-netflix-red pl-6">
            {genreName || 'Genre'} <span className="text-netflix-red">Movies</span>
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl">
            Exploring the best in {genreName?.toLowerCase()} cinema. Discover top-rated titles and hidden gems.
          </p>
        </header>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-40">
            <div className="netflix-loader scale-150">
              <div className="netflix-logo"><div className="middle-bar"></div></div>
            </div>
          </div>
        ) : movies.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-8">
            {movies.map((item) => (
              <div 
                key={item.id}
                onClick={() => setSelectedMovie(item)}
                className="flex flex-col gap-3 cursor-pointer group transition-all duration-300"
              >
                <div className="relative aspect-[2/3] w-full overflow-hidden rounded-lg shadow-2xl group-hover:scale-105 transition-transform duration-300">
                  <Image 
                    src={item.poster_path ? `${THUMB_URL}${item.poster_path}` : 'https://via.placeholder.com/500x750?text=No+Image'}
                    alt={item.title || item.name}
                    fill
                    className="object-cover group-hover:brightness-50 transition-all duration-300"
                  />
                  <div className="absolute inset-0 bg-netflix-red/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Play className="w-12 h-12 text-white fill-current transform scale-0 group-hover:scale-100 transition-transform duration-300" />
                  </div>
                </div>
                <div>
                  <h4 className="font-bold text-sm line-clamp-2 leading-tight group-hover:text-netflix-red transition-colors">
                    {item.title || item.name}
                  </h4>
                  <div className="flex items-center text-xs text-gray-500 mt-2">
                    <Star className="w-3 h-3 mr-1 fill-current text-yellow-500" />
                    {item.vote_average?.toFixed(1)}
                    <span className="mx-2">•</span>
                    {item.release_date?.split('-')[0]}
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
            onSelectMovie={(m) => {
              setSelectedMovie(m);
              setIsSearchOpen(false);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
