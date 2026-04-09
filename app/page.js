'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { Search, Play, Info, ChevronLeft, ChevronRight, X, Star, UserCheck, Download, PlayCircle, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

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
  const [bannerMovie, setBannerMovie] = useState(null);
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isScrolled, setIsScrolled] = useState(false);
  const [genres, setGenres] = useState({});
  const [selectedGenre, setSelectedGenre] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Initial fetch
  useEffect(() => {
    const init = async () => {
      try {
        const [movieRes, tvRes, animeRes, genreRes] = await Promise.all([
          fetch('/api/movies/collection').then(res => res.json()),
          fetch('/api/tv/collection').then(res => res.json()),
          fetch('/api/anime/collection').then(res => res.json()),
          fetch('/api/genres').then(res => res.json())
        ]);

        setTrendingMovies(movieRes.results || []);
        setTrendingTV(tvRes.results || []);
        setAnime(animeRes.results || []);
        
        const genreMap = {};
        genreRes.genres?.forEach(g => genreMap[g.id] = g.name);
        setGenres(genreMap);

        if (movieRes.results?.[0]) {
          setBannerMovie(movieRes.results[0]);
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
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Search logic
  useEffect(() => {
    const delayDebounce = setTimeout(async () => {
      if (searchQuery) {
        const res = await fetch(`/api/search?query=${encodeURIComponent(searchQuery)}`);
        const data = await res.json();
        setSearchResults(data.results || []);
      } else {
        setSearchResults([]);
      }
    }, 500);
    return () => clearTimeout(delayDebounce);
  }, [searchQuery]);

  return (
    <div className="relative min-h-screen bg-netflix-black overflow-x-hidden">
      {/* Navbar */}
      <nav className={cn(
        "fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-4 md:px-12 py-4 transition-all duration-300",
        isScrolled ? "bg-netflix-black shadow-lg" : "bg-transparent"
      )}>
        <div className="flex items-center">
          <h1 className="text-netflix-red text-3xl font-bold mr-8 cursor-pointer">SAGE</h1>
          <div className="hidden md:flex space-x-6">
            <a href="#" className="text-sm font-medium hover:text-gray-300">Home</a>
            <a href="#movies" className="text-sm font-medium hover:text-gray-300">Movies</a>
            <a href="#tv" className="text-sm font-medium hover:text-gray-300">TV Shows</a>
            <a href="#anime" className="text-sm font-medium hover:text-gray-300">Anime</a>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <div className="relative">
            <select 
              value={selectedGenre}
              onChange={(e) => setSelectedGenre(e.target.value)}
              className="bg-black/50 text-white text-sm rounded-md border border-netflix-red px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-netflix-red"
            >
              <option value="">All Genres</option>
              {Object.entries(genres).map(([id, name]) => (
                <option key={id} value={id}>{name}</option>
              ))}
            </select>
          </div>
          <button onClick={() => setIsSearchOpen(true)} className="text-white hover:text-netflix-red">
            <Search className="w-6 h-6" />
          </button>
          <div className="w-8 h-8 rounded-md overflow-hidden bg-gray-800">
            <Image 
              src="https://ui-avatars.com/api/?name=Sage&background=222&color=fff&rounded=true&size=32" 
              alt="Profile" 
              width={32} 
              height={32} 
            />
          </div>
        </div>
      </nav>

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
        <MovieRow title="Trending Movies" items={trendingMovies} onSelect={setSelectedMovie} id="movies" />
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
              className="relative min-w-[140px] md:min-w-[200px] h-[210px] md:h-[300px] cursor-pointer transition-transform duration-300 hover:scale-110 hover:z-30"
            >
              <Image 
                src={`${THUMB_URL}${item.poster_path}`}
                alt={item.title || item.name}
                fill
                className="rounded-md object-cover"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-netflix-red/20 opacity-0 hover:opacity-100 transition-opacity rounded-md" />
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

function MovieDetailModal({ movie, onClose, genres }) {
  const [server, setServer] = useState('vidsrc.cc');
  const [embedUrl, setEmbedUrl] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [showOverlay, setShowOverlay] = useState(true);

  useEffect(() => {
    const fetchSource = async () => {
      setIsLoading(true);
      const type = movie.media_type || (movie.first_air_date ? 'tv' : 'movie');
      const res = await fetch(`/api/video-sources/${type}/${movie.id}?server=${server}`);
      const data = await res.json();
      setEmbedUrl(data.embedURL);
      setIsLoading(false);
    };
    fetchSource();
  }, [movie, server]);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/95 overflow-y-auto"
    >
      <button 
        onClick={onClose}
        className="fixed top-5 left-5 z-[60] bg-black/60 text-white rounded-full p-2 hover:bg-netflix-red transition"
      >
        <ArrowLeft className="w-6 h-6" />
      </button>

      <div className="w-full max-w-7xl mx-auto px-4 md:px-8 py-16">
        <div className="mb-6 text-center md:text-left">
          <h2 className="text-3xl sm:text-4xl md:text-6xl font-extrabold mb-4 leading-tight">
            {movie.title || movie.name}
          </h2>
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-sm md:text-base">
            <span className="text-yellow-400 font-semibold flex items-center">
              <Star className="w-4 h-4 mr-1 fill-current" /> {movie.vote_average?.toFixed(1)}
            </span>
            <span className="text-neutral-400">
              {movie.genre_ids?.map(id => genres[id]).filter(Boolean).join(', ')}
            </span>
            <span className="text-neutral-400">
              {movie.release_date || movie.first_air_date}
            </span>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-8 mb-8">
          <div className="w-full md:w-[70%] aspect-video bg-black rounded-lg overflow-hidden shadow-2xl relative">
            {isLoading && (
              <div className="absolute inset-0 z-10 bg-black/80 flex flex-col items-center justify-center">
                <div className="netflix-loader">
                  <div className="netflix-logo"><div className="middle-bar" /></div>
                </div>
                <p className="mt-4 font-bold">Loading Player...</p>
              </div>
            )}
            
            {showOverlay && !isLoading && (
              <div className="absolute inset-0 z-20 bg-black/90 flex flex-col items-center justify-center text-center p-6">
                <h3 className="text-2xl font-bold mb-4">Verification Required</h3>
                <p className="text-gray-400 mb-6 max-w-md">To unlock high-speed streaming and remove ads, please complete a quick verification.</p>
                <div className="flex flex-col gap-4 w-full max-w-xs">
                  <button 
                    onClick={() => setShowOverlay(false)}
                    className="bg-netflix-red hover:bg-red-700 text-white font-bold py-3 px-6 rounded-md transition flex items-center justify-center"
                  >
                    <UserCheck className="w-5 h-5 mr-2" /> Verify You're Human
                  </button>
                  <button onClick={() => setShowOverlay(false)} className="text-sm text-gray-500 hover:text-white underline">
                    Continue to Player (with ads)
                  </button>
                </div>
              </div>
            )}

            {embedUrl && <iframe src={embedUrl} className="w-full h-full" allowFullScreen allow="autoplay; fullscreen" />}
          </div>

          <div className="w-full md:w-[30%] flex flex-col gap-6">
            <div className="relative w-full aspect-[2/3] rounded-xl overflow-hidden shadow-2xl">
              <Image src={`${IMG_URL}${movie.poster_path}`} alt="Poster" fill className="object-cover" />
            </div>

            <div className="flex flex-col gap-3">
              <a href="#" target="_blank" className="w-full bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-600 hover:to-orange-700 text-white font-bold py-3 rounded flex items-center justify-center transition">
                <PlayCircle className="w-5 h-5 mr-2" /> WATCH IN FULL HD
              </a>
              <a href="#" target="_blank" className="w-full bg-netflix-dark hover:bg-gray-800 text-white font-bold py-3 rounded border border-gray-700 flex items-center justify-center transition">
                <Download className="w-5 h-5 mr-2" /> DOWNLOAD MOVIE
              </a>
            </div>

            <div className="bg-netflix-dark p-4 rounded-lg">
              <label className="block text-neutral-300 mb-2 font-medium">Change Server:</label>
              <select 
                value={server}
                onChange={(e) => setServer(e.target.value)}
                className="w-full bg-black text-white border border-gray-700 rounded px-3 py-2 focus:ring-1 focus:ring-netflix-red"
              >
                <option value="vidsrc.cc">Vidsrc.cc (Primary)</option>
                <option value="vidsrc.me">Vidsrc.me (Backup)</option>
                <option value="player.videasy.net">Videasy</option>
                <option value="vidsrc.pro">Vidsrc.pro</option>
                <option value="embedsu">Embedsu</option>
              </select>
            </div>
          </div>
        </div>

        <div className="bg-netflix-dark/50 p-8 rounded-xl">
          <h3 className="text-2xl font-bold mb-4">Overview</h3>
          <p className="text-lg text-neutral-300 leading-relaxed max-w-4xl">
            {movie.overview}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

function SearchModal({ onClose, query, setQuery, results, onSelectMovie }) {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/95 flex flex-col items-center pt-20 px-4"
    >
      <button onClick={onClose} className="absolute top-5 right-5 text-gray-400 hover:text-white transition">
        <X className="w-8 h-8" />
      </button>
      
      <div className="w-full max-w-2xl mx-auto mb-8">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-6 h-6" />
          <input 
            autoFocus
            type="text" 
            placeholder="Search for movies, TV shows, anime..." 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-gray-800 text-white text-xl border border-gray-700 rounded-md pl-14 pr-4 py-4 focus:ring-2 focus:ring-netflix-red outline-none transition"
          />
        </div>
      </div>

      <div className="w-full max-w-6xl overflow-y-auto no-scrollbar pb-20">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {results.map((item) => (
            <div 
              key={item.id}
              onClick={() => onSelectMovie(item)}
              className="relative aspect-[2/3] cursor-pointer transition hover:scale-105"
            >
              <Image 
                src={item.poster_path ? `${THUMB_URL}${item.poster_path}` : 'https://via.placeholder.com/500x750?text=No+Image'}
                alt={item.title || item.name}
                fill
                className="rounded-md object-cover"
              />
              <div className="absolute inset-0 bg-black/60 opacity-0 hover:opacity-100 transition p-4 flex flex-col justify-end">
                <h4 className="font-bold text-sm">{item.title || item.name}</h4>
                <div className="flex items-center text-xs text-gray-400 mt-1">
                  <Star className="w-3 h-3 mr-1 fill-current text-yellow-500" />
                  {item.vote_average?.toFixed(1)}
                  <span className="ml-2">{item.release_date?.split('-')[0] || item.first_air_date?.split('-')[0]}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
        {query && results.length === 0 && (
          <p className="text-center text-gray-500 mt-20 text-xl">No results found for "{query}"</p>
        )}
      </div>
    </motion.div>
  );
}
