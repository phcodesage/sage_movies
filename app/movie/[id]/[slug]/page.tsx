'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Star, Play, X, ChevronDown, ChevronUp, Info } from 'lucide-react';
import Image from 'next/image';
import { useAppContext } from '../../../../lib/context/AppContext';
import { useWatchHistory } from '../../../../lib/hooks/useWatchHistory';
import { getSimilarMovies } from '../../../../lib/recommendations';
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
  const [server, setServer] = useState('vidsrc.to');
  const [embedUrl, setEmbedUrl] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDescExpanded, setIsDescExpanded] = useState(false);
  const [similarMovies, setSimilarMovies] = useState<TMDBMovie[]>([]);
  const [showUpNext, setShowUpNext] = useState(false);

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
          
          // Fetch similar movies pool
          // IMPORTANT: Normalize genres from API format [{id, name}] to genre_ids [id, id]
          const normalizedMovie = {
            ...data,
            genre_ids: data.genres ? data.genres.map((g: any) => g.id) : data.genre_ids || []
          };
          
          const currentGenre = normalizedMovie.genre_ids?.[0];
          // Get Vivamax or the first company found
          const vivamax = data.production_companies?.find((c: any) => c.name?.toLowerCase().includes('vivamax'));
          const studioId = vivamax ? vivamax.id : data.production_companies?.[0]?.id;
          
          let endpoint = slug?.includes('tv') ? '/api/tv/collection' : '/api/movies/collection';
          
          const fetchPool = async () => {
            try {
              // Parallel fetch: general + same genre + same studio
              const [generalRes, genreRes, studioRes] = await Promise.all([
                fetch(endpoint).then(res => res.json()),
                currentGenre ? fetch(`/api/movies/genre/${currentGenre}`).then(res => res.json()) : Promise.resolve({ results: [] }),
                studioId ? fetch(`/api/movies/studio/${studioId}`).then(res => res.json()) : Promise.resolve({ results: [] })
              ]);
              
              // Normalize studio results
              const normalizedStudioResults = (studioRes.results || []).map((m: any) => ({
                ...m,
                production_companies: [{ id: studioId, name: vivamax?.name || data.production_companies?.[0]?.name }] 
              }));
              
              const combinedResults = [
                ...normalizedStudioResults, // Put studio results FIRST in the combined array
                ...(genreRes.results || []),
                ...(generalRes.results || [])
              ];
              
              const uniquePool = Array.from(new Map(combinedResults.map(item => [item.id, item])).values());
              
              const similar = getSimilarMovies(normalizedMovie, uniquePool, 12);
              setSimilarMovies(similar);
            } catch (err) {
              console.error('Pool fetch error:', err);
            }
          };
          
          fetchPool();
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

  const loadVideoSource = async (selectedServer: string) => {
    if (!movie) return;
    setIsLoading(true);
    setError(null);

    try {
      const type = movie.first_air_date ? 'tv' : 'movie';
      const res = await fetch(`/api/video-sources/${type}/${movie.id}?server=${selectedServer}`);
      if (!res.ok) throw new Error('Failed to fetch video source');
      const data = await res.json();

      if (data.embedURL) {
        setEmbedUrl(data.embedURL);
        addToHistory(movie);
      } else {
        setError('Video source not available for this server. Try another server.');
        if (!isPlaying) setIsPlaying(false);
      }
    } catch (err) {
      setError('Failed to load video. Please try a different server.');
      if (!isPlaying) setIsPlaying(false);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch video source when user clicks play
  const handlePlay = () => {
    setIsPlaying(true);
    loadVideoSource(server);
  };

  const handleServerChange = (newServer: string) => {
    setServer(newServer);
    if (isPlaying) {
      loadVideoSource(newServer);
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
                <div 
                  className="w-full h-full relative group/player"
                  onMouseEnter={() => isPlaying && setShowUpNext(true)}
                  onMouseLeave={() => setShowUpNext(false)}
                >
                  <iframe
                    src={embedUrl}
                    className="w-full h-full border-none"
                    allowFullScreen
                    allow="autoplay; fullscreen"
                  />
                  
                  {/* Up Next / Pause Gallery Overlay */}
                  <AnimatePresence>
                    {showUpNext && similarMovies.length > 0 && (
                      <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        className="absolute inset-0 z-40 bg-black/80 backdrop-blur-sm flex flex-col justify-end p-6 pointer-events-none group-hover/player:pointer-events-auto"
                      >
                        <div className="mb-4 flex items-center justify-between">
                          <h3 className="text-white font-black uppercase tracking-tighter text-lg md:text-2xl flex items-center gap-2">
                            <Play className="w-5 h-5 text-netflix-red fill-current" /> Up Next: More From {movie.production_companies?.[0]?.name || 'the Studio'}
                          </h3>
                          <button 
                            onClick={() => setShowUpNext(false)}
                            className="bg-white/10 hover:bg-white/20 p-2 rounded-full text-white transition-colors"
                          >
                            <X className="w-6 h-6" />
                          </button>
                        </div>
                        
                        <div className="flex gap-4 overflow-x-auto no-scrollbar pb-4 -mx-2 px-2 scroll-smooth">
                          {similarMovies.slice(0, 6).map(m => (
                            <div 
                              key={m.id}
                              onClick={(e) => {
                                e.stopPropagation();
                                const slug = (m.title || m.name || '')
                                  .toLowerCase()
                                  .replace(/[^a-z0-9]+/g, '-')
                                  .replace(/(^-|-$)/g, '');
                                const mediaType = m.media_type || (m.first_air_date ? 'tv' : 'movie');
                                router.push(`/movie/${m.id}/${mediaType}-${slug}`);
                              }}
                              className="relative min-w-[120px] md:min-w-[180px] aspect-[2/3] rounded-lg overflow-hidden border-2 border-transparent hover:border-netflix-red transition-all cursor-pointer group/card shrink-0 shadow-2xl"
                            >
                              <Image 
                                src={`${THUMB_URL}${m.poster_path}`} 
                                alt={m.title || m.name || ''} 
                                fill 
                                className="object-cover group-hover/card:scale-110 transition-transform duration-500"
                                sizes="180px"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent opacity-60" />
                              <div className="absolute bottom-0 left-0 right-0 p-3">
                                <p className="text-white text-xs font-black line-clamp-1 group-hover/card:text-netflix-red">{m.title || m.name}</p>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className="text-yellow-500 text-[10px] font-black flex items-center">
                                    <Star className="w-2 h-2 fill-current mr-0.5" /> {m.vote_average?.toFixed(1)}
                                  </span>
                                  <span className="text-gray-400 text-[10px]">{m.release_date?.split('-')[0] || m.first_air_date?.split('-')[0]}</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Toggle Button for Mobile/Manual trigger */}
                  <button 
                    onClick={() => setShowUpNext(!showUpNext)}
                    className={cn(
                      "absolute bottom-20 left-4 z-50 bg-black/60 hover:bg-netflix-red text-white text-[10px] font-black py-2 px-4 rounded-full transition-all border border-white/20 backdrop-blur-md flex items-center gap-2",
                      showUpNext ? "opacity-0 translate-y-10" : "opacity-100 translate-y-0"
                    )}
                  >
                    <Info className="w-3 h-3" /> BROWSE UP NEXT
                  </button>
                </div>
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
                  onChange={(e) => handleServerChange(e.target.value)}
                  className="w-full bg-netflix-black text-white text-sm border border-gray-700 rounded-lg px-3 py-2.5 outline-none focus:border-netflix-red transition-all appearance-none cursor-pointer"
                >
                  <option value="vidsrc.to">Vidsrc.to (Primary)</option>
                  <option value="vidsrc.me">Vidsrc.me (Backup)</option>
                  <option value="player.videasy.net">Videasy (Multi)</option>
                  <option value="vidsrc.pro">Vidsrc.pro (Global)</option>
                  <option value="embedsu">Embedsu (Mirror)</option>
                  <option value="vidsrc.cc">Vidsrc.cc (Alternative)</option>
                </select>
                <ChevronDown className="absolute right-3 bottom-3 w-4 h-4 text-gray-500 pointer-events-none" />
              </div>
              
              <button
                onClick={handlePlay}
                disabled={isLoading}
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

              {/* Similar Movies Section (Embedded below description) */}
              <div className="mt-4 border-t border-gray-800 pt-6">
                <h4 className="text-[10px] font-black uppercase text-netflix-red mb-4 tracking-widest flex items-center gap-2">
                  <Play className="w-3 h-3 fill-current" /> More From {movie.production_companies?.[0]?.name || 'Similar Titles'}
                </h4>
                {similarMovies.length > 0 ? (
                  <div className="grid grid-cols-2 gap-3">
                    {similarMovies.map(m => {
                      // Check if it's from the same studio for debugging/visual confirmation
                      const isSameStudio = m.production_companies?.some(c => 
                        movie.production_companies?.some((tc: any) => tc.id === c.id)
                      );
                      
                      return (
                        <div 
                          key={m.id}
                          onClick={() => {
                            const slug = (m.title || m.name || '')
                              .toLowerCase()
                              .replace(/[^a-z0-9]+/g, '-')
                              .replace(/(^-|-$)/g, '');
                            const mediaType = m.media_type || (m.first_air_date ? 'tv' : 'movie');
                            router.push(`/movie/${m.id}/${mediaType}-${slug}`);
                          }}
                          className="group cursor-pointer"
                        >
                          <div className={cn(
                            "relative aspect-[2/3] rounded-md overflow-hidden border transition-all",
                            isSameStudio ? "border-netflix-red/50 shadow-[0_0_10px_rgba(229,9,20,0.2)]" : "border-gray-800 group-hover:border-netflix-red"
                          )}>
                            <Image 
                              src={`${THUMB_URL}${m.poster_path}`} 
                              alt={m.title || m.name || ''} 
                              fill 
                              className="object-cover group-hover:scale-110 transition-transform duration-500"
                              sizes="120px"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <Play className="w-6 h-6 text-white fill-current" />
                            </div>
                            {isSameStudio && (
                              <div className="absolute top-1 right-1 bg-netflix-red text-[8px] font-black px-1 rounded shadow-lg">STUDIO</div>
                            )}
                          </div>
                          <p className={cn(
                            "text-[10px] font-bold mt-1.5 line-clamp-1 transition-colors",
                            isSameStudio ? "text-netflix-red" : "text-gray-300 group-hover:text-netflix-red"
                          )}>
                            {m.title || m.name}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-gray-500 italic">Loading similar titles...</p>
                )}
              </div>
            </div>

            {/* Additional Info Section */}
            <div className="flex flex-col gap-4 border-t border-gray-800 pt-6 mt-2">
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <h4 className="text-[10px] font-black uppercase text-gray-500 mb-2">Genres</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {movie.genres?.map((g: {id: number, name: string}) => (
                      <span key={g.id} className="text-[10px] font-bold text-gray-300 bg-gray-800/50 px-2 py-1 rounded border border-gray-700">
                        {g.name}
                      </span>
                    ))}
                  </div>
                </div>
                
                {movie.production_companies && movie.production_companies.length > 0 && (
                  <div>
                    <h4 className="text-[10px] font-black uppercase text-gray-500 mb-2">Studios</h4>
                    <p className="text-xs text-gray-400 font-medium">{movie.production_companies.slice(0, 2).map((c: {name: string}) => c.name).join(', ')}</p>
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
