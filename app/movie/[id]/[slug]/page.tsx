'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Star, Play, X, ChevronDown, ChevronUp, Info, Check } from 'lucide-react';
import Image from 'next/image';
import { useAppContext } from '../../../../lib/context/AppContext';
import { useWatchHistory } from '../../../../lib/hooks/useWatchHistory';
import { useWatchedEpisodes } from '../../../../lib/hooks/useWatchedEpisodes';
import { getSimilarMovies } from '../../../../lib/recommendations';
import type { TMDBMovie } from '../../../../types/tmdb';
import { cn } from '../../../../lib/utils';
import { AdsterraNativeBanner, openAdsterraDirectLink } from '../../../../components/Adsterra';
import {
  VIDEO_SERVERS,
  SUBTITLE_LANGUAGES,
  DEFAULT_SERVER,
  DEFAULT_LANG,
  getServer,
} from '../../../../lib/videoServers';

// Grants the embed only what a video player genuinely needs. The privileges left OUT
// are the point: without `allow-popups` the provider cannot open popunder ads, and
// without `allow-top-navigation` it cannot redirect the whole tab. This cannot remove
// banner/overlay ads painted inside the player — those are same-origin to the provider
// and unreachable from here.
const PLAYER_SANDBOX =
  'allow-scripts allow-same-origin allow-presentation allow-forms allow-fullscreen';

const IMG_URL = 'https://image.tmdb.org/t/p/original';
const THUMB_URL = 'https://image.tmdb.org/t/p/w500';

export default function MovieDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  const slug = params?.slug as string;
  const { genres } = useAppContext();
  const { addToHistory } = useWatchHistory();
  const { isWatched, markWatched, toggleWatched } = useWatchedEpisodes();

  // Ad frequency: every Nth playback interaction (Play/Refresh, server switch, episode
  // switch) opens an Adsterra Direct Link. A ref, not state, so counting never triggers
  // a re-render. Must be called straight from the click handler to keep the user gesture
  // the popup blocker requires.
  const AD_EVERY = 3;
  const playbackInteractions = React.useRef(0);
  const registerPlaybackAdInteraction = React.useCallback(() => {
    playbackInteractions.current += 1;
    if (playbackInteractions.current % AD_EVERY === 0) {
      openAdsterraDirectLink();
    }
  }, []);

  const [movie, setMovie] = useState<TMDBMovie | any>(null);
  const [server, setServer] = useState(DEFAULT_SERVER);
  const [lang, setLang] = useState(DEFAULT_LANG);

  // Popup-blocking is applied automatically per provider rather than exposed as a
  // toggle: users had no way to know what "Block provider popups" meant, and most
  // providers detect the sandbox and refuse to play, so a manual switch mostly
  // produced a broken player. `sandboxTolerant` records which ones actually work.
  const sandboxed = getServer(server).sandboxTolerant;
  const [embedUrl, setEmbedUrl] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedSeason, setSelectedSeason] = useState(1);
  const [selectedEpisode, setSelectedEpisode] = useState(1);
  const [isDescExpanded, setIsDescExpanded] = useState(false);
  const [similarMovies, setSimilarMovies] = useState<TMDBMovie[]>([]);
  const [showUpNext, setShowUpNext] = useState(false);

  // Live per-server reachability, keyed by server id. 'checking' while a probe is in
  // flight; 'up'/'down' once /api/video-health reports back. Empty until the movie loads.
  type ServerStatus = 'up' | 'down' | 'checking';
  const [serverHealth, setServerHealth] = useState<Record<string, ServerStatus>>({});
  const serverNumber = (sid: string) => VIDEO_SERVERS.findIndex((s) => s.id === sid) + 1;

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
            genre_ids: data.genres ? data.genres.map((g: any) => g.id) : data.genre_ids || [],
          };

          const currentGenre = normalizedMovie.genre_ids?.[0];
          // Get Vivamax or the first company found
          const vivamax = data.production_companies?.find((c: any) =>
            c.name?.toLowerCase().includes('vivamax')
          );
          const studioId = vivamax ? vivamax.id : data.production_companies?.[0]?.id;

          let endpoint = slug?.includes('tv') ? '/api/tv/collection' : '/api/movies/collection';

          const fetchPool = async () => {
            try {
              // Parallel fetch: general + same genre + same studio
              const [generalRes, genreRes, studioRes] = await Promise.all([
                fetch(endpoint).then((res) => res.json()),
                currentGenre
                  ? fetch(`/api/movies/genre/${currentGenre}`).then((res) => res.json())
                  : Promise.resolve({ results: [] }),
                studioId
                  ? fetch(`/api/movies/studio/${studioId}`).then((res) => res.json())
                  : Promise.resolve({ results: [] }),
              ]);

              // Normalize studio results
              const normalizedStudioResults = (studioRes.results || []).map((m: any) => ({
                ...m,
                production_companies: [
                  { id: studioId, name: vivamax?.name || data.production_companies?.[0]?.name },
                ],
              }));

              const combinedResults = [
                ...normalizedStudioResults, // Put studio results FIRST in the combined array
                ...(genreRes.results || []),
                ...(generalRes.results || []),
              ];

              const uniquePool = Array.from(
                new Map(combinedResults.map((item) => [item.id, item])).values()
              );

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

  // Probe every provider once the movie is known, so the server picker can mark dead
  // servers and default to a working one. Host-level reachability barely moves with
  // season/episode, so we key on the movie id only and keep the outbound probes rare.
  const healthReqId = React.useRef(0);
  const runHealthCheck = React.useCallback(() => {
    if (!movie) return;
    const type = movie.first_air_date ? 'tv' : 'movie';
    const reqId = ++healthReqId.current;

    setServerHealth(Object.fromEntries(VIDEO_SERVERS.map((s) => [s.id, 'checking'])));

    fetch(
      `/api/video-health/${type}/${movie.id}?season=${selectedSeason}&episode=${selectedEpisode}`
    )
      .then((r) => r.json())
      .then((data) => {
        // Ignore a stale probe that a newer re-check has superseded.
        if (reqId !== healthReqId.current || !data?.servers) return;
        setServerHealth(data.servers);
        // If the current pick is dead, silently switch to the first reachable server so
        // the default the user lands on actually plays. Never overrides a manual pick
        // mid-playback — the probe resolves before anyone hits play.
        if (!isPlaying && data.servers[server] === 'down') {
          const firstUp = VIDEO_SERVERS.find((s) => data.servers[s.id] === 'up');
          if (firstUp) setServer(firstUp.id);
        }
      })
      .catch(() => {
        if (reqId === healthReqId.current) setServerHealth({});
      });
  }, [movie, selectedSeason, selectedEpisode, isPlaying, server]);

  useEffect(() => {
    // Auto-probe once per title; manual re-checks go through the button in Stream Settings.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    runHealthCheck();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [movie?.id]);

  const isCheckingHealth = Object.values(serverHealth).some((v) => v === 'checking');
  const allServersDown =
    Object.keys(serverHealth).length > 0 &&
    Object.values(serverHealth).every((status) => status === 'down');

  const loadVideoSource = async (
    selectedServer: string,
    selectedLang: string = lang,
    sNum: number = selectedSeason,
    eNum: number = selectedEpisode
  ) => {
    if (!movie) return;
    setIsLoading(true);
    setError(null);

    try {
      const type = movie.first_air_date ? 'tv' : 'movie';
      const res = await fetch(
        `/api/video-sources/${type}/${movie.id}?server=${selectedServer}&lang=${selectedLang}&season=${sNum}&episode=${eNum}`
      );
      if (!res.ok) throw new Error('Failed to fetch video source');
      const data = await res.json();

      if (data.embedURL) {
        setEmbedUrl(data.embedURL);
        addToHistory(movie);
        // Playing an episode counts as watching it. Movies have no episode grid, so
        // this only applies to TV. Idempotent, so re-loads (server/lang change) are fine.
        if (type === 'tv') markWatched(movie.id, sNum, eNum);
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
  const handlePlay = (sNum: number = selectedSeason, eNum: number = selectedEpisode) => {
    setIsPlaying(true);
    loadVideoSource(server, lang, sNum, eNum);
  };

  const handleServerChange = (newServer: string) => {
    setServer(newServer);
    if (isPlaying) {
      loadVideoSource(newServer, lang);
    }
  };

  const handleLangChange = (newLang: string) => {
    setLang(newLang);
    if (isPlaying) {
      loadVideoSource(server, newLang);
    }
  };

  const handleClosePlayer = () => {
    setIsPlaying(false);
    setEmbedUrl('');
    setShowUpNext(false);
  };

  // Loading state
  if (isLoading && !movie) {
    return (
      <div className="min-h-screen bg-netflix-black flex items-center justify-center">
        <div className="netflix-loader">
          <div className="netflix-logo">
            <div className="middle-bar" />
          </div>
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
      className="h-screen w-screen bg-[#0F1015] overflow-hidden flex flex-col font-sans"
    >
      {/* Steam Deck Top Header Bar */}
      <div className="bg-[#12141A] border-b-4 border-black px-3 md:px-6 py-2.5 flex items-center justify-between z-50 shrink-0 shadow-[0_4px_0_0_rgba(0,0,0,1)]">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => router.back()}
            className="px-3 py-1 bg-[#1A9FFF] text-black font-black text-xs uppercase tracking-wider border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-white hover:-translate-y-0.5 transition-all flex items-center space-x-1"
          >
            <span className="bg-black text-[#1A9FFF] text-[10px] px-1 py-0.5 font-mono">B</span>
            <ArrowLeft className="w-3.5 h-3.5 stroke-[3]" />
            <span className="hidden sm:inline">BACK</span>
          </button>

          <div className="flex items-center space-x-2">
            <span className="bg-black text-[#66C0F4] font-black text-xs px-2.5 py-1 border-2 border-black uppercase tracking-wider shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              🎮 SAGE HD PLAYER
            </span>
            <span className="hidden md:inline-block bg-[#107C10] text-white font-black text-[10px] px-2 py-0.5 border border-black uppercase font-mono">
              60 FPS • 1080P
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {isPlaying && (
            <button
              onClick={() => {
                registerPlaybackAdInteraction();
                loadVideoSource(server, lang);
              }}
              className="px-2.5 py-1 bg-[#FFE600] text-black font-black text-xs border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-black hover:text-[#FFE600] transition-all flex items-center space-x-1"
            >
              <span className="bg-black text-[#FFE600] text-[10px] px-1 py-0.5 font-mono">A</span>
              <span className="text-[10px] uppercase">REFRESH</span>
            </button>
          )}

          <button
            onClick={() => router.push('/')}
            className="px-2.5 py-1 bg-white text-black font-black text-xs border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-[#FF3366] hover:text-white transition-all text-[10px] uppercase"
          >
            SAGE HOME
          </button>
        </div>
      </div>

      {/* Main Content: Player (Left/Top) + Details Sidebar (Right/Bottom) */}
      <div className="flex-1 flex flex-col md:flex-row h-full overflow-hidden">
        {/* Left/Top Section: Steam Deck Video Player Stage */}
        <div className="relative bg-black h-[45vh] md:h-full flex-1 md:min-w-0 border-b-4 md:border-b-0 md:border-r-4 border-black">
          {isPlaying ? (
            <>
              {isLoading && (
                <div className="absolute inset-0 z-10 bg-[#0F1015]/95 flex flex-col items-center justify-center border-4 border-black p-6">
                  <div className="w-12 h-12 border-4 border-black border-t-[#1A9FFF] rounded-none animate-spin mb-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]" />
                  <p className="font-black text-xs uppercase tracking-widest text-[#1A9FFF] bg-black px-3 py-1 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                    CONNECTING STREAM SERVER...
                  </p>
                </div>
              )}

              {error && (
                <div className="absolute inset-0 z-20 bg-[#0F1015]/95 flex flex-col items-center justify-center text-center p-6">
                  <p className="text-xs font-black text-red-500 mb-4 bg-black p-3 border-2 border-black uppercase tracking-wider">
                    {error}
                  </p>
                  <button
                    onClick={() => {
                      setError(null);
                      setIsPlaying(false);
                    }}
                    className="bg-[#1A9FFF] hover:bg-[#FFE600] text-black font-black px-6 py-2.5 border-3 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition text-xs uppercase"
                  >
                    SELECT ANOTHER SERVER
                  </button>
                </div>
              )}

              {embedUrl && (
                <iframe
                  key={`${embedUrl}|${sandboxed}`}
                  src={embedUrl}
                  className="w-full h-full border-none"
                  allow="autoplay; fullscreen *; encrypted-media; picture-in-picture"
                  allowFullScreen
                  referrerPolicy="origin"
                  sandbox={sandboxed ? PLAYER_SANDBOX : undefined}
                />
              )}

              <button
                onClick={handleClosePlayer}
                className="absolute top-3 right-3 z-30 bg-[#FF3366] text-white font-black text-xs p-2 border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:bg-black transition active:scale-95"
              >
                <X className="w-4 h-4 stroke-[3]" />
              </button>
            </>
          ) : (
            <div className="absolute inset-0">
              {backdropPath ? (
                <Image
                  src={`${IMG_URL}${backdropPath}`}
                  alt={title}
                  fill
                  className="object-cover opacity-75"
                  priority
                  sizes="100vw"
                />
              ) : (
                <div className="w-full h-full bg-[#12141A]" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-[#0F1015] via-black/40 to-transparent" />

              {allServersDown ? (
                <div className="absolute inset-0 bg-[#0F1015]/95 border-4 border-black p-6 flex flex-col items-center justify-center text-center z-30 font-sans">
                  <h3 className="text-base md:text-xl font-black uppercase text-white tracking-tight mb-2 bg-[#FF3366] text-white px-4 py-2 border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                    ⚠️ TITLE NOT AVAILABLE YET ON STREAM SERVERS
                  </h3>
                  <p className="text-xs md:text-sm font-bold text-zinc-200 max-w-md bg-black p-4 border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] mb-4 leading-relaxed">
                    {releaseDate
                      ? `"${title}" has an official air/release date of ${releaseDate}. Servers have indexed the listing, but digital stream files have not been uploaded by providers yet.`
                      : `Streaming servers are currently indexing "${title}". Please try selecting another title or check back shortly!`}
                  </p>
                  <button
                    onClick={() => router.push('/')}
                    className="bg-[#1A9FFF] hover:bg-[#FFE600] text-black font-black px-6 py-3 border-3 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-xs uppercase tracking-wider transition-all hover:-translate-y-0.5"
                  >
                    🎮 BROWSE OTHER WORKING MOVIES
                  </button>
                </div>
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center z-10 p-4">
                  <button
                    onClick={() => handlePlay()}
                    className="group flex flex-col items-center gap-3 active:scale-95 transition-transform"
                  >
                    <div className="w-20 h-20 md:w-24 md:h-24 bg-[#1A9FFF] text-black border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center group-hover:bg-[#FFE600] group-hover:-translate-y-1 transition-all duration-200">
                      <Play className="w-10 h-10 md:w-12 md:h-12 fill-current ml-1" />
                    </div>
                    <span className="bg-black text-[#1A9FFF] font-black text-sm md:text-lg tracking-wider px-4 py-1.5 border-3 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] group-hover:text-[#FFE600] transition-colors uppercase">
                      [A] LAUNCH STREAM
                    </span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right/Bottom Section: Steam Deck Mobile-First Control Panel */}
        <div className="relative bg-[#0F1015] flex flex-col h-[55vh] md:h-full md:w-[420px] lg:w-[480px] xl:w-[520px] shrink-0 min-h-0">
          <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar flex flex-col">
            <div className="p-4 md:p-6 flex flex-col gap-5">
              {/* Header Meta Info */}
              <div className="flex gap-4 items-start bg-black p-4 border-3 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                {posterPath && (
                  <div className="relative w-20 h-28 border-2 border-black shrink-0 overflow-hidden shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                    <Image
                      src={`${THUMB_URL}${posterPath}`}
                      alt={title}
                      fill
                      className="object-cover"
                      sizes="80px"
                    />
                  </div>
                )}

                <div className="flex-1 min-w-0 flex flex-col justify-between">
                  <div>
                    <h1 className="text-base md:text-lg font-black uppercase text-white tracking-tight line-clamp-2 mb-1.5">
                      {title}
                    </h1>
                    <div className="flex flex-wrap items-center gap-1.5 mb-2">
                      <span className="bg-[#FFE600] text-black px-2 py-0.5 border border-black text-[10px] font-black flex items-center gap-1">
                        <Star className="w-3 h-3 fill-current" /> {voteAverage}
                      </span>
                      <span className="bg-[#1A9FFF] text-black px-2 py-0.5 border border-black text-[10px] font-black uppercase">
                        {movie.first_air_date ? 'TV SERIES' : 'MOVIE'}
                      </span>
                      <span className="bg-[#107C10] text-white px-2 py-0.5 border border-black text-[10px] font-black font-mono">
                        1080P
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      registerPlaybackAdInteraction();
                      handlePlay();
                    }}
                    disabled={isLoading}
                    className="w-full bg-[#1A9FFF] hover:bg-[#FFE600] text-black font-black text-xs py-2.5 px-3 border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center gap-1.5 hover:-translate-y-0.5 transition-all disabled:opacity-50 uppercase tracking-wider"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    <span>{isPlaying ? '[A] REFRESH STREAM' : '[A] WATCH NOW FREE'}</span>
                  </button>
                </div>
              </div>

              {/* Steam Deck Server Picker Bar (Mobile First) */}
              <div className="bg-black p-4 border-3 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] space-y-3">
                <div className="flex items-center justify-between border-b-2 border-zinc-800 pb-2">
                  <span className="text-xs font-black uppercase text-[#66C0F4] tracking-wider flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 bg-[#107C10] border border-black inline-block" />
                    STREAMING SERVERS
                  </span>
                  <button
                    type="button"
                    onClick={runHealthCheck}
                    disabled={isCheckingHealth}
                    className="text-[10px] font-black uppercase bg-zinc-800 text-zinc-300 px-2 py-0.5 border border-black hover:bg-[#1A9FFF] hover:text-black transition-colors"
                  >
                    {isCheckingHealth ? 'PINGING…' : 'RE-PING'}
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {VIDEO_SERVERS.map((s, i) => {
                    const st = serverHealth[s.id];
                    const isSelected = server === s.id;

                    return (
                      <button
                        key={s.id}
                        onClick={() => {
                          registerPlaybackAdInteraction();
                          handleServerChange(s.id);
                        }}
                        className={cn(
                          'p-2 text-left border-2 border-black text-xs font-black transition-all flex flex-col justify-between',
                          isSelected
                            ? 'bg-[#1A9FFF] text-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]'
                            : 'bg-[#12141A] text-zinc-300 hover:bg-zinc-800 hover:text-white'
                        )}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-mono text-[10px]">DRIVE 0{i + 1}</span>
                          <span
                            className={cn(
                              'text-[9px] font-mono px-1 py-0.2 border border-black',
                              st === 'down'
                                ? 'bg-red-600 text-white'
                                : st === 'checking'
                                  ? 'bg-yellow-400 text-black'
                                  : 'bg-[#107C10] text-white'
                            )}
                          >
                            {st === 'down' ? 'OFFLINE' : st === 'checking' ? 'PINGING' : 'ONLINE'}
                          </span>
                        </div>
                        <span className="truncate uppercase text-[11px]">{s.id}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* TV Series Season & Episode Picker */}
              {(movie.first_air_date || movie.number_of_seasons) && (
                <div className="flex flex-col gap-3 p-4 bg-gray-900/60 rounded-2xl border border-gray-800/80 shadow-xl">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-black text-gray-200 uppercase tracking-wider flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-netflix-red animate-pulse" />
                      EPISODE SELECTOR
                    </span>
                    <span className="text-[11px] font-bold text-netflix-red">
                      Season {selectedSeason} of{' '}
                      {movie.number_of_seasons || movie.seasons?.length || 1}
                    </span>
                  </div>

                  {/* Season Dropdown */}
                  <div className="relative">
                    <select
                      value={selectedSeason}
                      onChange={(e) => {
                        const s = parseInt(e.target.value, 10);
                        setSelectedSeason(s);
                        setSelectedEpisode(1);
                        if (isPlaying) loadVideoSource(server, lang, s, 1);
                      }}
                      className="w-full bg-netflix-black text-white text-xs font-bold border border-gray-700 rounded-xl px-3 py-2 outline-none focus:border-netflix-red transition-all appearance-none cursor-pointer"
                    >
                      {Array.from(
                        { length: movie.number_of_seasons || movie.seasons?.length || 1 },
                        (_, i) => i + 1
                      ).map((sNum) => (
                        <option key={sNum} value={sNum}>
                          Season {sNum}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 bottom-2.5 w-4 h-4 text-gray-400 pointer-events-none" />
                  </div>

                  {/* Horizontal Episode Scroll Chips. Watched episodes carry a green check
                    badge; tap the badge to toggle watched without playing, or just play
                    (which auto-marks it). */}
                  <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
                    {Array.from(
                      {
                        length:
                          movie.seasons?.find((s: any) => s.season_number === selectedSeason)
                            ?.episode_count || 24,
                      },
                      (_, i) => i + 1
                    ).map((ep) => {
                      const watched = isWatched(movie.id, selectedSeason, ep);
                      const selected = selectedEpisode === ep;
                      return (
                        <button
                          key={ep}
                          onClick={() => {
                            registerPlaybackAdInteraction();
                            setSelectedEpisode(ep);
                            if (isPlaying) {
                              loadVideoSource(server, lang, selectedSeason, ep);
                            } else {
                              handlePlay(selectedSeason, ep);
                            }
                          }}
                          className={cn(
                            'px-3.5 py-2 rounded-xl text-xs font-black transition-all shrink-0 border flex items-center gap-1.5',
                            selected
                              ? 'bg-netflix-red text-white border-netflix-red shadow-lg shadow-red-900/40'
                              : watched
                                ? 'bg-netflix-black text-gray-300 border-emerald-700/60 hover:border-emerald-500'
                                : 'bg-netflix-black text-gray-400 border-gray-800 hover:border-gray-600 hover:text-white'
                          )}
                        >
                          <span>E{ep}</span>
                          <span
                            role="button"
                            aria-label={
                              watched
                                ? `Mark episode ${ep} as unwatched`
                                : `Mark episode ${ep} as watched`
                            }
                            title={watched ? 'Watched — tap to unmark' : 'Mark as watched'}
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleWatched(movie.id, selectedSeason, ep);
                            }}
                            className={cn(
                              'flex h-4 w-4 shrink-0 items-center justify-center rounded-full border transition-colors',
                              watched
                                ? 'border-emerald-400 bg-emerald-500 text-white'
                                : selected
                                  ? 'border-white/60 text-transparent hover:text-white/80'
                                  : 'border-gray-600 text-transparent hover:text-gray-300'
                            )}
                          >
                            <Check className="h-2.5 w-2.5" strokeWidth={3.5} />
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Stream Settings Accordion */}
              <details className="group bg-zinc-900 rounded-2xl border border-zinc-800 overflow-hidden shadow-md">
                <summary className="flex items-center justify-between p-3.5 text-xs font-bold text-gray-400 cursor-pointer select-none hover:text-white transition-colors">
                  <span className="flex items-center gap-2">
                    <span
                      className={cn(
                        'w-2 h-2 rounded-full',
                        serverHealth[server] === 'down'
                          ? 'bg-red-500'
                          : serverHealth[server] === 'checking'
                            ? 'bg-amber-400 animate-pulse'
                            : 'bg-emerald-400'
                      )}
                    />
                    STREAM SETTINGS (Server {serverNumber(server)})
                  </span>
                  <ChevronDown className="w-4 h-4 transition-transform group-open:rotate-180 text-gray-500" />
                </summary>
                <div className="p-4 pt-1 flex flex-col gap-3 border-t border-gray-800/60">
                  <div className="relative">
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[10px] text-gray-500 font-bold uppercase block">
                        Streaming Server
                      </label>
                      <button
                        type="button"
                        onClick={runHealthCheck}
                        disabled={isCheckingHealth}
                        className="text-[10px] font-bold uppercase text-gray-500 hover:text-white transition-colors disabled:opacity-40 disabled:cursor-default"
                      >
                        {isCheckingHealth ? 'Checking…' : 'Re-check'}
                      </button>
                    </div>
                    <select
                      value={server}
                      onChange={(e) => {
                        registerPlaybackAdInteraction();
                        handleServerChange(e.target.value);
                      }}
                      className="w-full bg-netflix-black text-white text-xs border border-gray-700 rounded-lg px-3 py-2 outline-none focus:border-netflix-red transition-all appearance-none cursor-pointer"
                    >
                      {VIDEO_SERVERS.map((s, i) => {
                        const st = serverHealth[s.id];
                        const tag =
                          st === 'down'
                            ? ' — Offline'
                            : st === 'checking'
                              ? ' — Checking…'
                              : st === 'up'
                                ? ' — Online'
                                : '';
                        return (
                          <option key={s.id} value={s.id}>
                            Server {i + 1}
                            {tag}
                          </option>
                        );
                      })}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 bottom-2.5 h-4 w-4 text-gray-500" />
                  </div>

                  <div className="relative">
                    <label className="text-[10px] text-gray-500 font-bold uppercase mb-1 block">
                      Subtitle Language
                    </label>
                    <select
                      value={lang}
                      onChange={(e) => handleLangChange(e.target.value)}
                      disabled={!getServer(server).supportsLang}
                      className="w-full bg-netflix-black text-white text-xs border border-gray-700 rounded-lg px-3 py-2 outline-none focus:border-netflix-red transition-all appearance-none cursor-pointer disabled:opacity-40"
                    >
                      {SUBTITLE_LANGUAGES.map((l) => (
                        <option key={l.code} value={l.code}>
                          {l.label}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 bottom-2.5 w-4 h-4 text-gray-500 pointer-events-none" />
                  </div>
                </div>
              </details>

              {/* Ad slot directly beneath the play control. Gated on a stream actually
                being live (playing, has an embed URL, no error) so we never show an ad
                against a broken player. It sits below the button and is never layered
                over it — the play button must stay a play button, not an ad surface. */}
              {isPlaying && embedUrl && !error && (
                <AdsterraNativeBanner className="ad-native-compact rounded-xl overflow-hidden" />
              )}

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

                <div
                  className={cn(
                    'text-gray-300 leading-relaxed text-sm transition-all duration-300',
                    !isDescExpanded && 'line-clamp-4 md:line-clamp-none'
                  )}
                >
                  {overview}
                </div>

                {/* Similar Movies Section (Embedded below description) */}
                <div className="mt-4 border-t border-gray-800 pt-6">
                  <h4 className="text-[10px] font-black uppercase text-netflix-red mb-4 tracking-widest flex items-center gap-2">
                    <Play className="w-3 h-3 fill-current" /> More From{' '}
                    {movie.production_companies?.[0]?.name || 'Similar Titles'}
                  </h4>
                  {similarMovies.length > 0 ? (
                    <div className="grid grid-cols-2 gap-3">
                      {similarMovies.map((m) => {
                        // Check if it's from the same studio for debugging/visual confirmation
                        const isSameStudio = m.production_companies?.some((c) =>
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
                            <div
                              className={cn(
                                'relative aspect-[2/3] rounded-md overflow-hidden border transition-all',
                                isSameStudio
                                  ? 'border-netflix-red/50 shadow-[0_0_10px_rgba(229,9,20,0.2)]'
                                  : 'border-gray-800 group-hover:border-netflix-red'
                              )}
                            >
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
                                <div className="absolute top-1 right-1 bg-netflix-red text-[8px] font-black px-1 rounded shadow-lg">
                                  STUDIO
                                </div>
                              )}
                            </div>
                            <p
                              className={cn(
                                'text-[10px] font-bold mt-1.5 line-clamp-1 transition-colors',
                                isSameStudio
                                  ? 'text-netflix-red'
                                  : 'text-gray-300 group-hover:text-netflix-red'
                              )}
                            >
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
                      {movie.genres?.map((g: { id: number; name: string }) => (
                        <span
                          key={g.id}
                          className="text-[10px] font-bold text-gray-300 bg-gray-800/50 px-2 py-1 rounded border border-gray-700"
                        >
                          {g.name}
                        </span>
                      ))}
                    </div>
                  </div>

                  {movie.production_companies && movie.production_companies.length > 0 && (
                    <div>
                      <h4 className="text-[10px] font-black uppercase text-gray-500 mb-2">
                        Studios
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {movie.production_companies.slice(0, 3).map((c: any) => (
                          <div
                            key={c.id}
                            className="flex items-center gap-2 bg-gray-900/80 px-2.5 py-1.5 rounded-lg border border-gray-800"
                          >
                            {c.logo_path ? (
                              <img
                                src={`https://image.tmdb.org/t/p/w200${c.logo_path}`}
                                alt={c.name}
                                className="h-5 max-w-[80px] object-contain filter invert brightness-200"
                                onError={(e) => {
                                  (e.target as HTMLElement).style.display = 'none';
                                }}
                              />
                            ) : (
                              <div className="w-2 h-2 rounded-full bg-netflix-red" />
                            )}
                            <span className="text-xs text-gray-300 font-bold">{c.name}</span>
                          </div>
                        ))}
                      </div>
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

          {/* Browse Up Next trigger — floats over the details panel, never the player */}
          {isPlaying && embedUrl && similarMovies.length > 0 && (
            <button
              onClick={() => setShowUpNext(!showUpNext)}
              className={cn(
                'absolute bottom-4 right-4 z-30 bg-black/60 hover:bg-netflix-red text-white text-[10px] font-black py-2 px-4 rounded-full transition-all border border-white/20 backdrop-blur-md flex items-center gap-2',
                showUpNext
                  ? 'opacity-0 translate-y-10 pointer-events-none'
                  : 'opacity-100 translate-y-0'
              )}
            >
              <Info className="w-3 h-3" /> BROWSE UP NEXT
            </button>
          )}

          {/* Up Next Gallery — covers the details panel only, leaving the video untouched */}
          <AnimatePresence>
            {isPlaying && showUpNext && similarMovies.length > 0 && (
              <motion.div
                key="up-next-overlay"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="absolute inset-0 z-40 bg-black/90 backdrop-blur-sm flex flex-col justify-end p-5 md:p-6"
              >
                <div className="mb-4 flex items-center justify-between gap-2">
                  <h3 className="text-white font-black uppercase tracking-tighter text-base md:text-lg flex items-center gap-2 min-w-0">
                    <Play className="w-4 h-4 text-netflix-red fill-current shrink-0" />
                    <span className="truncate">
                      Up Next: More From {movie.production_companies?.[0]?.name || 'the Studio'}
                    </span>
                  </h3>
                  <button
                    onClick={() => setShowUpNext(false)}
                    className="bg-white/10 hover:bg-white/20 p-2 rounded-full text-white transition-colors shrink-0"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="flex gap-4 overflow-x-auto no-scrollbar pb-4 -mx-2 px-2 scroll-smooth">
                  {similarMovies.slice(0, 6).map((m) => (
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
                      className="relative min-w-[110px] md:min-w-[130px] aspect-[2/3] rounded-lg overflow-hidden border-2 border-transparent hover:border-netflix-red transition-all cursor-pointer group/card shrink-0 shadow-2xl"
                    >
                      <Image
                        src={`${THUMB_URL}${m.poster_path}`}
                        alt={m.title || m.name || ''}
                        fill
                        className="object-cover group-hover/card:scale-110 transition-transform duration-500"
                        sizes="130px"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent opacity-60" />
                      <div className="absolute bottom-0 left-0 right-0 p-3">
                        <p className="text-white text-xs font-black line-clamp-1 group-hover/card:text-netflix-red">
                          {m.title || m.name}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-yellow-500 text-[10px] font-black flex items-center">
                            <Star className="w-2 h-2 fill-current mr-0.5" />{' '}
                            {m.vote_average?.toFixed(1)}
                          </span>
                          <span className="text-gray-400 text-[10px]">
                            {m.release_date?.split('-')[0] || m.first_air_date?.split('-')[0]}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}
