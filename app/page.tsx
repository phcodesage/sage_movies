'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { Play, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useScroll } from '../lib/hooks/useScroll';
import { useSearch } from '../lib/hooks/useSearch';
import { useWatchHistory } from '../lib/hooks/useWatchHistory';
import { useAppContext } from '../lib/context/AppContext';
import { getRecommendedMovies, getSimilarMovies } from '../lib/recommendations';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import Navbar from '../components/Navbar';
import MovieRow from '../components/MovieRow';
import { MovieRowSkeleton, BannerSkeleton } from '../components/LoadingSkeleton';
import { AdsterraNativeBanner } from '../components/Adsterra';
import ServiceBottomNav from '../components/ServiceBottomNav';
import { STREAMING_SERVICES } from '../lib/streamingServices';
import { scrollToSection } from '../lib/utils/scrollToSection';
import type { TMDBMovie } from '../types/tmdb';

const SeeAllModal = dynamic(() => import('../components/SeeAllModal'), {
  loading: () => <div className="fixed inset-0 bg-netflix-black z-[100]" />,
  ssr: false,
});

// Lazy load modals for better initial load performance
const SearchModal = dynamic(() => import('../components/SearchModal'), {
  loading: () => <div className="fixed inset-0 bg-netflix-black z-50" />,
  ssr: false,
});

const MovieDetailModal = dynamic(() => import('../components/MovieDetailModal'), {
  loading: () => <div className="fixed inset-0 bg-black/95 z-50" />,
  ssr: false,
});

const IMG_URL = 'https://image.tmdb.org/t/p/original';

export default function Home() {
  const [trendingMovies, setTrendingMovies] = useState<TMDBMovie[]>([]);
  const [trendingTV, setTrendingTV] = useState<TMDBMovie[]>([]);
  const [anime, setAnime] = useState<TMDBMovie[]>([]);
  const [actionMovies, setActionMovies] = useState<TMDBMovie[]>([]);
  const [latestMovies, setLatestMovies] = useState<TMDBMovie[]>([]);
  const [topRatedMovies, setTopRatedMovies] = useState<TMDBMovie[]>([]);
  const [bannerTrailerKey, setBannerTrailerKey] = useState<string | null>(null);
  const [isHoveringBanner, setIsHoveringBanner] = useState(false);
  const isHoveringBannerRef = useRef(false);
  const [serviceRows, setServiceRows] = useState<Record<number, TMDBMovie[]>>({});
  const [bannerMovie, setBannerMovie] = useState<TMDBMovie | null>(null);
  const [selectedMovie, setSelectedMovie] = useState<TMDBMovie | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [selectedGenre, setSelectedGenre] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [seeAllData, setSeeAllData] = useState<{
    title: string;
    items: TMDBMovie[];
    category: string;
  } | null>(null);
  const [recommended, setRecommended] = useState<TMDBMovie[]>([]);
  const [lastWatchedSimilar, setLastWatchedSimilar] = useState<{
    movie: TMDBMovie;
    similar: TMDBMovie[];
  } | null>(null);
  const [allFetchedData, setAllFetchedData] = useState<TMDBMovie[]>([]);
  const bannerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const isScrolled = useScroll(50);
  const {
    query: searchQuery,
    setQuery: setSearchQuery,
    results: searchResults,
    isSearching,
  } = useSearch(500);
  const { history: watchHistory } = useWatchHistory();
  const { genres } = useAppContext();
  const router = useRouter();

  useEffect(() => {
    isHoveringBannerRef.current = isHoveringBanner;
  }, [isHoveringBanner]);

  useEffect(() => {
    // Trailer lookups and YouTube playback are expensive. Loading them only after a
    // deliberate hover keeps the first paint focused on the poster artwork and stops
    // the rotating banner from issuing a new detail request every six seconds.
    if (!bannerMovie || !isHoveringBanner) return;

    let cancelled = false;
    const type = bannerMovie.first_air_date ? 'tv' : 'movie';
    fetch(`/api/movie/${bannerMovie.id}?type=${type}&v=2`)
      .then((res) => res.json())
      .then((data) => {
        if (cancelled || !data.videos?.results) return;
        const trailer = data.videos.results.find(
          (video: { type?: string; site?: string }) =>
            video.type === 'Trailer' && video.site === 'YouTube'
        );
        setBannerTrailerKey(trailer?.key ?? null);
      })
      .catch(() => {
        if (!cancelled) setBannerTrailerKey(null);
      });

    return () => {
      cancelled = true;
    };
  }, [bannerMovie, isHoveringBanner]);

  // Compute recommendations
  useEffect(() => {
    if (watchHistory.length > 0 && allFetchedData.length > 0) {
      const recommendations = getRecommendedMovies(watchHistory, allFetchedData, 20);
      setRecommended(recommendations);

      // Also compute "Because you watched [Last Movie]"
      const lastMovie = watchHistory[0];
      const similarToLast = getSimilarMovies(lastMovie, allFetchedData, 15);
      if (similarToLast.length > 0) {
        setLastWatchedSimilar({ movie: lastMovie, similar: similarToLast });
      }
    }
  }, [watchHistory, allFetchedData]);

  const handlePlayClick = (movie: TMDBMovie) => {
    const slug = (movie.title || movie.name || '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    const mediaType = movie.media_type || (movie.first_air_date ? 'tv' : 'movie');
    router.push(`/movie/${movie.id}/${mediaType}-${slug}`);
  };

  // Fetch the shelves people see first, then defer provider shelves until the page is
  // usable. The old request fan-out loaded 19 API routes (and about 32 TMDB requests)
  // before removing the full-page loader.
  useEffect(() => {
    let cancelled = false;
    let serviceLoadTimer: ReturnType<typeof setTimeout> | null = null;

    const toUniqueMovies = (items: TMDBMovie[]) =>
      Array.from(new Map(items.map((item) => [item.id, item])).values());

    const loadServiceRows = async () => {
      const serviceResults = await Promise.all(
        STREAMING_SERVICES.map((service) => {
          const endpoint = service.isCompany
            ? `/api/movies/studio/${service.id}`
            : `/api/movies/provider/${service.id}`;

          return fetch(endpoint)
            .then((res) => res.json())
            .catch(() => ({ results: [] }));
        })
      );

      if (cancelled) return;

      const services: Record<string | number, TMDBMovie[]> = {};
      STREAMING_SERVICES.forEach((service, index) => {
        services[service.id] = serviceResults[index]?.results || [];
      });
      setServiceRows(services);
      setAllFetchedData((current) =>
        toUniqueMovies([...current, ...Object.values(services).flat()])
      );
    };

    async function loadData() {
      try {
        setIsLoading(true);

        const [movieRes, tvRes, animeRes, actionRes, latestRes, topRatedRes] = await Promise.all([
          fetch('/api/movies/collection').then((res) => res.json()),
          fetch('/api/tv/collection').then((res) => res.json()),
          fetch('/api/anime/collection').then((res) => res.json()),
          fetch('/api/movies/genre/28').then((res) => res.json()),
          fetch('/api/movies/latest').then((res) => res.json()),
          fetch('/api/movies/top-rated').then((res) => res.json()),
        ]);

        if (cancelled) return;

        const movies = (movieRes as any).results || [];
        setTrendingMovies(movies);
        setTrendingTV((tvRes as any).results || []);
        setAnime((animeRes as any).results || []);
        setActionMovies((actionRes as any).results || []);
        setLatestMovies((latestRes as any).results || []);
        setTopRatedMovies((topRatedRes as any).results || []);

        // Flatten all for recommendation pool
        const all = [
          ...movies,
          ...((tvRes as any).results || []),
          ...((animeRes as any).results || []),
          ...((actionRes as any).results || []),
          ...((latestRes as any).results || []),
          ...((topRatedRes as any).results || []),
        ];
        setAllFetchedData(toUniqueMovies(all));

        if (movies.length > 0) {
          setBannerMovie(movies[0]);

          // Start banner rotation
          let index = 0;
          bannerIntervalRef.current = setInterval(() => {
            // If hovering, pause rotation
            if (isHoveringBannerRef.current) return;
            index = (index + 1) % Math.min(movies.length, 10);
            setBannerMovie(movies[index]);
          }, 6000);
        }

        // Let the browser paint and respond to input before loading the lower shelves.
        serviceLoadTimer = setTimeout(() => {
          void loadServiceRows();
        }, 1200);
      } catch (error) {
        if (!cancelled) console.error('Error initializing app:', error);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    loadData();

    return () => {
      cancelled = true;
      if (bannerIntervalRef.current) clearInterval(bannerIntervalRef.current);
      if (serviceLoadTimer) clearTimeout(serviceLoadTimer);
    };
  }, []);

  // Honour a #section hash once the rows exist. Arriving at /#tv from another page
  // renders an empty shell first — the sections only mount after the fetches resolve,
  // so the browser's native hash jump finds nothing and leaves you at the top.
  useEffect(() => {
    if (isLoading) return;
    const id = window.location.hash.slice(1);
    if (!id) return;

    const frame = requestAnimationFrame(() => scrollToSection(id));
    return () => cancelAnimationFrame(frame);
  }, [isLoading]);

  // Genre filtering logic
  useEffect(() => {
    if (!selectedGenre) {
      // Re-fetch trending movies if genre is cleared
      fetch('/api/movies/collection')
        .then((res) => res.json())
        .then((data) => setTrendingMovies(data.results || []));
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
            behavior: 'smooth',
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

  return (
    // overflow-x-clip, not -hidden: `hidden` would make this a scroll container and
    // break programmatic scrolling (see the note in globals.css).
    <div className="relative min-h-screen bg-netflix-black overflow-x-clip">
      {/* Full Page Loader */}
      <AnimatePresence>
        {isLoading && (
          <motion.div
            // `key` lets AnimatePresence track this child — without it the exit
            // animation never completed and the overlay stayed mounted at opacity 0,
            // invisibly swallowing every click on the page (the navbar included).
            key="page-loader"
            initial={{ opacity: 1 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            // Nothing here is interactive, so it must never intercept pointer events —
            // a stuck overlay would otherwise make the entire site unclickable.
            className="fixed inset-0 z-[100] bg-netflix-black flex flex-col items-center justify-center pointer-events-none"
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
      <Navbar onSearchClick={() => setIsSearchOpen(true)} />

      {/* Hero Banner (Xbox Game Pass Stage + Neo-Brutalism) */}
      {isLoading ? (
        <BannerSkeleton />
      ) : bannerMovie ? (
        <div className="relative pt-20 md:pt-24 pb-4 px-4 md:px-8 w-full max-w-7xl mx-auto font-sans">
          <div 
            className="relative bg-black border-4 border-black shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] overflow-hidden"
            onMouseEnter={() => setIsHoveringBanner(true)}
            onMouseLeave={() => {
              setIsHoveringBanner(false);
              setBannerTrailerKey(null);
            }}
          >
            {/* Backdrop Image */}
            <div className={`relative h-[60vh] md:h-[68vh] w-full transition-opacity duration-1000 ${bannerTrailerKey ? 'opacity-0' : 'opacity-100'}`}>
              <Image
                src={`${IMG_URL}${bannerMovie.backdrop_path || bannerMovie.poster_path}`}
                alt={bannerMovie.title || bannerMovie.name || ''}
                fill
                className="object-cover opacity-85"
                priority
                sizes="100vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
            </div>

            {/* Trailer Video */}
            {bannerTrailerKey && (
              <div className="absolute inset-0 z-0 pointer-events-none w-full h-[60vh] md:h-[68vh] overflow-hidden">
                <iframe
                  src={`https://www.youtube-nocookie.com/embed/${bannerTrailerKey}?autoplay=1&mute=1&controls=0&modestbranding=1&rel=0&playsinline=1&start=4`}
                  allow="autoplay; encrypted-media"
                  className="w-full h-full border-none transform scale-[1.35] origin-center opacity-85"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
              </div>
            )}

            {/* Xbox Console Banner Details Overlay */}
            <div className="absolute inset-x-0 bottom-0 p-5 md:p-10 z-10 space-y-4">
              <div className="flex items-center space-x-2">
                <span className="bg-[#107C10] text-white font-black text-xs uppercase tracking-wider px-3 py-1 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                  🎮 FEATURED TITLE
                </span>
                <span className="bg-[#FFE600] text-black font-black text-xs uppercase tracking-wider px-3 py-1 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                  4K ULTRA HD
                </span>
              </div>

              <h1 className="text-3xl md:text-6xl font-black uppercase text-white tracking-tighter max-w-3xl drop-shadow-[3px_3px_0_rgba(0,0,0,1)]">
                {bannerMovie.title || bannerMovie.name}
              </h1>

              <p className="text-xs md:text-base font-bold text-zinc-200 max-w-2xl line-clamp-3 bg-black/80 p-3.5 border-3 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                {bannerMovie.overview}
              </p>

              {/* Xbox Action Buttons */}
              <div className="flex flex-wrap gap-3 pt-1">
                <button
                  onClick={() => handlePlayClick(bannerMovie)}
                  className="bg-[#107C10] hover:bg-[#FFE600] hover:text-black text-white px-6 md:px-8 py-3.5 border-3 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-xs md:text-sm font-black uppercase tracking-wider flex items-center space-x-2 hover:-translate-y-0.5 transition-all"
                >
                  <span className="bg-black text-[#FFE600] text-[10px] px-1.5 py-0.5 font-mono border border-black">A</span>
                  <Play className="w-4 h-4 fill-current" />
                  <span>START STREAM</span>
                </button>

                <button
                  onClick={() => handlePlayClick(bannerMovie)}
                  className="bg-white hover:bg-[#00E5FF] text-black px-6 md:px-8 py-3.5 border-3 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-xs md:text-sm font-black uppercase tracking-wider flex items-center space-x-2 hover:-translate-y-0.5 transition-all"
                >
                  <span className="bg-black text-white text-[10px] px-1.5 py-0.5 font-mono border border-black">X</span>
                  <Info className="w-4 h-4" />
                  <span>DETAILS</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* Rows — extra bottom padding keeps the last row clear of the fixed bottom nav */}
      <div className="px-2 md:px-6 -mt-6 md:-mt-8 relative z-20 pb-28 md:pb-24">
        {isLoading ? (
          <>
            <MovieRowSkeleton />
            <MovieRowSkeleton />
            <MovieRowSkeleton />
            <MovieRowSkeleton />
          </>
        ) : (
          <>
            {recommended.length > 0 && (
              <MovieRow
                title="Special Recommendations for You"
                items={recommended}
                id="recommended"
                onSeeAll={() =>
                  setSeeAllData({
                    title: 'Recommended for You',
                    items: recommended,
                    category: 'history',
                  })
                }
              />
            )}
            {lastWatchedSimilar && (
              <MovieRow
                title={`Because you watched ${lastWatchedSimilar.movie.title || lastWatchedSimilar.movie.name}`}
                items={lastWatchedSimilar.similar}
                id="because-watched"
                onSeeAll={() =>
                  setSeeAllData({
                    title: `More Like ${lastWatchedSimilar.movie.title || lastWatchedSimilar.movie.name}`,
                    items: lastWatchedSimilar.similar,
                    category: 'history',
                  })
                }
              />
            )}
            {watchHistory.length > 0 && (
              <MovieRow
                title="Resume Watching"
                items={watchHistory}
                id="history"
                onSeeAll={() =>
                  setSeeAllData({
                    title: 'Resume Watching',
                    items: watchHistory,
                    category: 'history',
                  })
                }
              />
            )}
            {latestMovies.length > 0 && (
              <MovieRow
                title="Latest Releases"
                items={latestMovies}
                id="latest"
                onSeeAll={() =>
                  setSeeAllData({
                    title: 'Latest Releases',
                    items: latestMovies,
                    category: 'latest',
                  })
                }
              />
            )}
            <MovieRow
              title={
                selectedGenre
                  ? `${genres[parseInt(selectedGenre)] || ''} Movies`
                  : 'Trending Movies'
              }
              items={trendingMovies}
              id="movies"
              onSeeAll={() =>
                setSeeAllData({
                  title: selectedGenre
                    ? `${genres[parseInt(selectedGenre)] || ''} Movies`
                    : 'Trending Movies',
                  items: trendingMovies,
                  category: selectedGenre || 'trending_movies',
                })
              }
            />
            <MovieRow
              title="Action Movies"
              items={actionMovies}
              id="action"
              onSeeAll={() =>
                setSeeAllData({ title: 'Action Movies', items: actionMovies, category: '28' })
              }
            />
            {topRatedMovies.length > 0 && (
              <MovieRow
                title="Top Rated Movies"
                items={topRatedMovies}
                id="top-rated"
                onSeeAll={() =>
                  setSeeAllData({
                    title: 'Top Rated Movies',
                    items: topRatedMovies,
                    category: 'top_rated',
                  })
                }
              />
            )}
            {/* Native banner sits between rows so it reads as another content shelf
                rather than an interruption. Move it if it underperforms here. */}
            <AdsterraNativeBanner />
            <MovieRow
              title="Popular TV Shows"
              items={trendingTV}
              id="tv"
              onSeeAll={() =>
                setSeeAllData({
                  title: 'Popular TV Shows',
                  items: trendingTV,
                  category: 'trending_tv',
                })
              }
            />
            {STREAMING_SERVICES.map(
              (s) =>
                (serviceRows[s.id as any]?.length ?? 0) > 0 && (
                  <MovieRow
                    key={s.id}
                    title={`${s.name} Movies`}
                    items={serviceRows[s.id as any]}
                    id={s.rowId}
                    onSeeAll={() =>
                      setSeeAllData({
                        title: `${s.name} Movies`,
                        items: serviceRows[s.id as any],
                        category: `provider_${s.id}`,
                      })
                    }
                  />
                )
            )}
            <MovieRow
              title="Anime Collection"
              items={anime}
              id="anime"
              onSeeAll={() =>
                setSeeAllData({ title: 'Anime Collection', items: anime, category: 'anime' })
              }
            />
          </>
        )}
      </div>

      {/* Bottom nav: quick jump to each streaming service's shelf */}
      {!isLoading && <ServiceBottomNav />}

      {/* Modals */}
      <AnimatePresence>
        {seeAllData && (
          <SeeAllModal
            title={seeAllData.title}
            items={seeAllData.items}
            category={seeAllData.category}
            onClose={() => setSeeAllData(null)}
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
        {selectedMovie && (
          <MovieDetailModal
            movie={selectedMovie}
            onClose={() => setSelectedMovie(null)}
            genres={genres}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
