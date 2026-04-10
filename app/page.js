'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { Search, Play, Info, ChevronLeft, ChevronRight, X, Star, UserCheck, Download, PlayCircle, ArrowLeft, Bell, Gift, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import Navbar from '../components/Navbar';
import SearchModal from '../components/SearchModal';
import MovieDetailModal from '../components/MovieDetailModal';

// Helper for tailwind classes
function cn(...inputs) {
  return twMerge(clsx(inputs));
}

const IMG_URL = 'https://image.tmdb.org/t/p/original';
const THUMB_URL = 'https://image.tmdb.org/t/p/w500';

export default function Home() {
  const [trendingMovies, setTrendingMovies] = useState([]);
  const [trendingTV, setTrendingTV] = useState([]);
  const [anime, setAnime] = useState([]);
  const [actionMovies, setActionMovies] = useState([]);
  const [bannerMovie, setBannerMovie] = useState(null);
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isScrolled, setIsScrolled] = useState(false);
  const [genres, setGenres] = useState({});
  const [selectedGenre, setSelectedGenre] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const bannerIntervalRef = useRef(null);

  // Initial fetch
  useEffect(() => {
    const init = async () => {
      try {
        const [movieRes, tvRes, animeRes, genreRes, actionRes] = await Promise.all([
          fetch('/api/movies/collection').then(res => res.ok ? res.json() : {}).catch(() => ({})),
          fetch('/api/tv/collection').then(res => res.ok ? res.json() : {}).catch(() => ({})),
          fetch('/api/anime/collection').then(res => res.ok ? res.json() : {}).catch(() => ({})),
          fetch('/api/genres').then(res => res.ok ? res.json() : {}).catch(() => ({})),
          fetch('/api/movies/genre/28').then(res => res.ok ? res.json() : {}).catch(() => ({}))
        ]);

        const movies = movieRes.results || [];
        setTrendingMovies(movies);
        setTrendingTV(tvRes.results || []);
        setAnime(animeRes.results || []);
        setActionMovies(actionRes.results || []);
        
        const genreMap = {};
        genreRes.genres?.forEach(g => genreMap[g.id] = g.name);
        setGenres(genreMap);

        if (movies.length > 0) {
          setBannerMovie(movies[0]);
          
          // Start banner rotation
          let index = 0;
          bannerIntervalRef.current = setInterval(() => {
            index = (index + 1) % Math.min(movies.length, 10);
            setBannerMovie(movies[index]);
          }, 5000);
        }
      } catch (error) {
        console.error('Error initializing app:', error);
      } finally {
        setIsLoading(false);
      }
    };
    init();

    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (bannerIntervalRef.current) clearInterval(bannerIntervalRef.current);
    };
  }, []);

  // Genre filtering logic
  useEffect(() => {
    if (!selectedGenre) {
      // Re-fetch trending movies if genre is cleared
      fetch('/api/movies/collection')
        .then(res => res.json())
        .then(data => setTrendingMovies(data.results || []));
      return;
    }

    const fetchByGenre = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/movies/genre/${selectedGenre}`);
        const data = await res.json();
        setTrendingMovies(data.results || []);
        
        // Scroll to movies section after genre is updated
        const moviesSection = document.getElementById('movies');
        if (moviesSection) {
          window.scrollTo({
            top: moviesSection.offsetTop - 100,
            behavior: 'smooth'
          });
        }
      } catch (error) {
        console.error('Error fetching by genre:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchByGenre();
  }, [selectedGenre]);

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
    <div className="relative min-h-screen bg-netflix-black overflow-x-hidden">
      {/* Full Page Loader */}
      <AnimatePresence>
        {isLoading && (
          <motion.div 
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="fixed inset-0 z-[100] bg-netflix-black flex flex-col items-center justify-center"
          >
            <div className="netflix-loader scale-150">
              <div className="netflix-logo">
                <div className="middle-bar"></div>
              </div>
            </div>
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="mt-12 text-xl font-bold tracking-widest text-white uppercase"
            >
              Preparing your experience
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navbar */}
      <Navbar onSearchClick={() => setIsSearchOpen(true)} genres={genres} />

      {/* Hero Banner */}
      {bannerMovie && (
        <div className="relative h-[80vh] w-full">
          <div className="absolute inset-0">
            <Image 
              src={`${IMG_URL}${bannerMovie.backdrop_path}`}
              alt={bannerMovie.title || bannerMovie.name}
              fill
              className="object-cover"
              priority
            />
            <div className="absolute inset-0 banner-gradient" />
          </div>
          <div className="absolute inset-x-0 bottom-0 px-4 md:px-16 py-10 md:py-20 z-10">
            <h1 className="text-4xl md:text-6xl font-bold mb-4 max-w-2xl">
              {bannerMovie.title || bannerMovie.name}
            </h1>
            <p className="text-lg text-gray-200 max-w-xl mb-6 line-clamp-3 md:line-clamp-none">
              {bannerMovie.overview}
            </p>
            <div className="flex flex-wrap gap-3 mt-6">
              <button 
                onClick={() => setSelectedMovie(bannerMovie)}
                className="bg-white text-black hover:bg-opacity-80 px-8 py-3 rounded-md flex items-center font-bold transition"
              >
                <Play className="w-5 h-5 mr-2 fill-current" /> Play
              </button>
              <button 
                onClick={() => setSelectedMovie(bannerMovie)}
                className="bg-gray-500/60 hover:bg-gray-600/80 text-white px-8 py-3 rounded-md flex items-center font-bold transition"
              >
                <Info className="w-5 h-5 mr-2" /> More Info
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rows */}
      <div className="px-4 md:px-12 -mt-12 relative z-20 pb-20">
        <MovieRow title={selectedGenre ? `${genres[selectedGenre] || ''} Movies` : "Trending Movies"} items={trendingMovies} onSelect={setSelectedMovie} id="movies" />
        <MovieRow title="Action Movies" items={actionMovies} onSelect={setSelectedMovie} id="action" />
        <MovieRow title="Popular TV Shows" items={trendingTV} onSelect={setSelectedMovie} id="tv" />
        <MovieRow title="Anime Collection" items={anime} onSelect={setSelectedMovie} id="anime" />
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

      {/* Footer */}
      <footer className="mt-16 py-8 border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 md:px-12">
          <p className="text-center text-gray-500 text-sm">&copy; 2025 Sage Movies - Free Movies, TV Shows & Anime Streaming. All rights reserved.</p>
          <div className="flex justify-center mt-4 space-x-6">
            <a href="#" className="text-gray-500 hover:text-gray-300 text-sm transition">Disclaimer</a>
            <a href="#" className="text-gray-500 hover:text-gray-300 text-sm transition">About Us</a>
            <a href="#" className="text-gray-500 hover:text-gray-300 text-sm transition">Contact Us</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

function MovieRow({ title, items, onSelect, id }) {
  const rowRef = useRef(null);

  const scroll = (direction) => {
    if (rowRef.current) {
      const { scrollLeft, clientWidth } = rowRef.current;
      const scrollTo = direction === 'left' ? scrollLeft - clientWidth : scrollLeft + clientWidth;
      rowRef.current.scrollTo({ left: scrollTo, behavior: 'smooth' });
    }
  };

  return (
    <section id={id} className="mb-8 group">
      <h2 className="text-xl md:text-2xl font-bold mb-4 group-hover:text-netflix-red transition-colors">
        {title}
      </h2>
      <div className="relative">
        <button 
          onClick={() => scroll('left')}
          className="absolute left-0 top-0 bottom-0 z-10 bg-black/50 hover:bg-black/80 w-10 opacity-0 group-hover:opacity-100 transition flex items-center justify-center"
        >
          <ChevronLeft className="w-8 h-8" />
        </button>
        <div 
          ref={rowRef}
          className="flex space-x-2 overflow-x-auto no-scrollbar scroll-smooth pb-4"
        >
          {items.map((item) => (
            <div 
              key={item.id}
              onClick={() => onSelect(item)}
              className="relative min-w-[140px] md:min-w-[200px] h-[210px] md:h-[300px] cursor-pointer transition-transform duration-300 hover:scale-110 hover:z-30 poster-hover group/poster"
            >
              <Image 
                src={`${THUMB_URL}${item.poster_path}`}
                alt={item.title || item.name}
                fill
                className="rounded-md object-cover"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-netflix-red/20 opacity-0 group-hover/poster:opacity-100 transition-opacity rounded-md flex items-center justify-center">
                <Play className="w-10 h-10 text-white fill-current opacity-0 group-hover/poster:opacity-100 transition-opacity" />
              </div>
            </div>
          ))}
        </div>
        <button 
          onClick={() => scroll('right')}
          className="absolute right-0 top-0 bottom-0 z-10 bg-black/50 hover:bg-black/80 w-10 opacity-0 group-hover:opacity-100 transition flex items-center justify-center"
        >
          <ChevronRight className="w-8 h-8" />
        </button>
      </div>
    </section>
  );
}
