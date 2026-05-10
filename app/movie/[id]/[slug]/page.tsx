'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, Star, Play, X, ChevronDown, ChevronUp, Info } from 'lucide-react';
import Image from 'next/image';
import { useAppContext } from '../../../../lib/context/AppContext';
import { useWatchHistory } from '../../../../lib/hooks/useWatchHistory';
import type { TMDBMovie } from '../../../../types/tmdb';
import { cn } from '../../../../lib/utils';

const IMG_URL = 'https://image.tmdb.org/t/p/original';
const THUMB_URL = 'https://image.tmdb.org/t/p/w500';

export default function MovieDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  const slug = params?.slug as string;
  const { genres } = useAppContext();
  const { addToHistory } = useWatchHistory();

  const [movie, setMovie] = useState<TMDBMovie | any>(null);
  const [server, setServer] = useState('vidsrc.cc');
  const [embedUrl, setEmbedUrl] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDescExpanded, setIsDescExpanded] = useState(false);

  // Fetch movie details from our API
  useEffect(() => {
    const fetchMovieDetails = async () => {
      try {
        const mediaType = slug?.includes('tv') ? 'tv' : 'movie';
        const res = await fetch(`/api/movie/${id}?type=${mediaType}`);
        const data = await res.json();

        if (data.error) {
          setError(data.error);
          setMovie(null);
        } else {
          setMovie(data);
          setError(null);
        }
      } catch (err) {
        setError('Failed to load movie details');
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      fetchMovieDetails();
    }
  }, [id, slug]);

  // Fetch video source when user clicks play
  const handlePlay = async () => {
    if (!movie) return;
    setIsPlaying(true);
    setIsLoading(true);
    setError(null);

    try {
      const type = movie.first_air_date ? 'tv' : 'movie';
      const res = await fetch(`/api/video-sources/${type}/${movie.id}?server=${server}`);
      if (!res.ok) throw new Error('Failed to fetch video source');
      const data = await res.json();

      if (data.embedURL) {
        setEmbedUrl(data.embedURL);
        addToHistory(movie);
      } else {
        setError('Video source not available for this server. Try another server.');
        setIsPlaying(false);
      }
    } catch (err) {
      setError('Failed to load video. Please try a different server.');
      setIsPlaying(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClosePlayer = () => {
    setIsPlaying(false);
    setEmbedUrl('');
  };

  // Loading state
  if (isLoading && !movie) {
    return (
      <div className="min-h-screen bg-netflix-black flex items-center justify-center">
        <div className="netflix-loader">
          <div className="netflix-logo"><div className="middle-bar" /></div>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !movie) {
    return (
      <div className="min-h-screen bg-netflix-black flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-xl text-red-400 mb-4">{error}</p>
          <button
            onClick={() => router.back()}
            className="bg-netflix-red hover:bg-red-700 text-white font-bold py-2 px-6 rounded transition"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (!movie) return null;

  const title = movie.title || movie.name || 'Unknown Movie';
  const overview = movie.overview || 'No description available.';
  const backdropPath = movie.backdrop_path;
  const posterPath = movie.poster_path;
  const voteAverage = movie.vote_average?.toFixed(1) || 'N/A';
  const releaseDate = movie.release_date || movie.first_air_date;
  const genreNames = movie.genres?.map((g: any) => g.name).join(', ') || '';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="h-screen w-screen bg-netflix-black overflow-hidden flex flex-col"
    >
      {/* Back Button */}
      <button
        onClick={() => router.back()}
        className="fixed top-4 left-4 z-[60] bg-black/60 text-white rounded-full p-2 hover:bg-netflix-red transition-all active:scale-90"
      >
        <ArrowLeft className="w-5 h-5 md:w-6 md:h-6" />
      </button>

      {/* Main Content: Player (Top) + Details (Bottom) */}
      <div className="flex-1 flex flex-col md:flex-row h-full">
        
        {/* Left/Top Section: Player Area */}
        <div className={cn(
          "relative transition-all duration-500 bg-black",
          isPlaying 
            ? "h-[40vh] md:h-full md:flex-[2.5]" 
            : "h-[45vh] md:h-full md:flex-[3]"
        )}>
          {isPlaying ? (
            <>
              {isLoading && (
                <div className="absolute inset-0 z-10 bg-black/80 flex flex-col items-center justify-center">
                  <div className="netflix-loader scale-75 md:scale-100">
                    <div className="netflix-logo"><div className="middle-bar" /></div>
                  </div>
                  <p className="mt-4 font-bold text-sm">Loading Player...</p>
                </div>
              )}

              {error && (
                <div className="absolute inset-0 z-20 bg-black/90 flex flex-col items-center justify-center text-center p-6">
                  <p className="text-base font-bold text-red-400 mb-4">{error}</p>
                  <button
                    onClick={() => { setError(null); setIsPlaying(false); }}
                    className="bg-netflix-red hover:bg-red-700 text-white font-bold py-2 px-6 rounded-md transition text-sm"
                  >
                    Try Again
                  </button>
                </div>
              )}

              {embedUrl && (
                <iframe
                  src={embedUrl}
                  className="w-full h-full border-none"
                  allowFullScreen
                  allow="autoplay; fullscreen"
                />
              )}

              <button
                onClick={handleClosePlayer}
                className="absolute top-4 right-4 z-30 bg-black/60 text-white rounded-full p-2 hover:bg-red-600 transition active:scale-90"
              >
                <X className="w-4 h-4 md:w-5 md:h-5" />
              </button>
            </>
          ) : (
            <div className="absolute inset-0">
              {backdropPath ? (
                <Image
                  src={`${IMG_URL}${backdropPath}`}
                  alt={title}
                  fill
                  className="object-cover"
                  priority
                  sizes="100vw"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-netflix-dark to-black" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-netflix-black via-black/30 to-black/10" />

              <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
                <button
                  onClick={handlePlay}
                  className="group flex flex-col items-center gap-4 active:scale-95 transition-transform"
                >
                  <div className="w-20 h-20 md:w-28 md:h-28 rounded-full bg-white/20 backdrop-blur-sm border-2 border-white/80 flex items-center justify-center group-hover:bg-netflix-red group-hover:border-netflix-red transition-all duration-300 group-hover:scale-110 shadow-2xl">
                    <Play className="w-10 h-10 md:w-14 md:h-14 text-white fill-current ml-1" />
                  </div>
                  <span className="text-white font-bold text-lg md:text-2xl tracking-wide group-hover:text-netflix-red transition-colors drop-shadow-lg uppercase italic">
                    Play Now
                  </span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right/Bottom Section: Details Sidebar (Desktop) or Scrollable Info (Mobile) */}
        <div className={cn(
          "bg-netflix-black border-t md:border-t-0 md:border-l border-gray-800 flex flex-col transition-all duration-500 overflow-y-auto no-scrollbar",
          isPlaying ? "h-[60vh] md:h-full md:flex-1" : "h-[55vh] md:h-full md:flex-1 lg:max-w-md"
        )}>
          {/* Main Info Padding Wrapper */}
          <div className="p-5 md:p-8 flex flex-col gap-6">
            
            {/* Header: Title & Meta */}
            <div className="flex flex-col gap-4">
              <div className="flex gap-4 items-start">
                {/* Compact Poster */}
                {posterPath && (
                  <div className="relative w-20 h-28 md:w-24 md:h-36 rounded shadow-xl overflow-hidden shrink-0 border border-gray-800">
                    <Image
                      src={`${THUMB_URL}${posterPath}`}
                      alt={title}
                      fill
                      className="object-cover"
                      sizes="96px"
                    />
                  </div>
                )}
                <div className="flex-1">
                  <h1 className="text-2xl md:text-3xl font-black leading-tight tracking-tight text-white mb-2">{title}</h1>
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="flex items-center text-yellow-500 font-black text-sm">
                      <Star className="w-4 h-4 mr-1 fill-current" /> {voteAverage}
                    </span>
                    <span className="text-gray-400 text-sm font-bold">{releaseDate?.split('-')[0]}</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <span className="bg-netflix-red text-white px-2 py-0.5 rounded text-[10px] font-black uppercase">
                  {movie.first_air_date ? 'TV Series' : 'Movie'}
                </span>
                <span className="bg-gray-800 text-gray-300 px-2 py-0.5 rounded text-[10px] font-bold">
                  HD / 4K
                </span>
              </div>
            </div>

            {/* Server Controls - Compacted */}
            <div className="flex flex-col gap-3 p-4 bg-gray-900/50 rounded-xl border border-gray-800">
              <div className="relative">
                <label className="text-[10px] text-gray-500 font-bold uppercase mb-1.5 block">Streaming Server</label>
                <select
                  value={server}
                  onChange={(e) => setServer(e.target.value)}
                  className="w-full bg-netflix-black text-white text-sm border border-gray-700 rounded-lg px-3 py-2.5 outline-none focus:border-netflix-red transition-all appearance-none cursor-pointer"
                >
                  <option value="vidsrc.cc">Vidsrc.cc (HD)</option>
                  <option value="vidsrc.me">Vidsrc.me (Fast)</option>
                  <option value="player.videasy.net">Videasy (Multi)</option>
                  <option value="vidsrc.pro">Vidsrc.pro (Global)</option>
                  <option value="embedsu">Embedsu (Mirror)</option>
                </select>
                <ChevronDown className="absolute right-3 bottom-3 w-4 h-4 text-gray-500 pointer-events-none" />
              </div>
              
              <button
                onClick={handlePlay}
                disabled={isPlaying && !error}
                className="w-full bg-white text-black text-sm font-black py-3 rounded-lg hover:bg-netflix-red hover:text-white transition-all active:scale-95 disabled:opacity-50 uppercase tracking-wider"
              >
                {isPlaying ? 'Refresh Stream' : 'Start Watching'}
              </button>
            </div>

            {/* Storyline Section */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
                  <Info className="w-4 h-4" /> Storyline
                </h3>
                {/* Reveal toggle for mobile/small screens */}
                <button 
                  onClick={() => setIsDescExpanded(!isDescExpanded)}
                  className="md:hidden text-netflix-red text-[10px] font-black uppercase tracking-tight"
                >
                  {isDescExpanded ? 'Less' : 'More'}
                </button>
              </div>
              
              <div className={cn(
                "text-gray-300 leading-relaxed text-sm transition-all duration-300",
                !isDescExpanded && "line-clamp-4 md:line-clamp-none"
              )}>
                {overview}
              </div>
            </div>

            {/* Additional Info Section */}
            <div className="flex flex-col gap-4 border-t border-gray-800 pt-6 mt-2">
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <h4 className="text-[10px] font-black uppercase text-gray-500 mb-2">Genres</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {movie.genres?.map((g: any) => (
                      <span key={g.id} className="text-[10px] font-bold text-gray-300 bg-gray-800/50 px-2 py-1 rounded border border-gray-700">
                        {g.name}
                      </span>
                    ))}
                  </div>
                </div>
                
                {movie.production_companies && movie.production_companies.length > 0 && (
                  <div>
                    <h4 className="text-[10px] font-black uppercase text-gray-500 mb-2">Studios</h4>
                    <p className="text-xs text-gray-400 font-medium">{movie.production_companies.slice(0, 2).map((c: any) => c.name).join(', ')}</p>
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* Bottom Banner/Quick Disclaimer */}
          <div className="mt-auto p-6 text-center border-t border-gray-800/50 bg-black/20">
            <p className="text-[9px] text-gray-600 font-bold uppercase tracking-widest">
              Enjoy high-quality streaming on Sage Movies
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
