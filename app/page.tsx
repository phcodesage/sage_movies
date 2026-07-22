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

  // Initial fetch
  useEffect(() => {
    const init = async () => {
      try {
        const [movieRes, tvRes, animeRes, actionRes, ...serviceRes] = await Promise.all([
          fetch('/api/movies/collection')
            .then((res) => (res.ok ? res.json() : { results: [] }))
            .catch(() => ({ results: [] })),
          fetch('/api/tv/collection')
            .then((res) => (res.ok ? res.json() : { results: [] }))
            .catch(() => ({ results: [] })),
          fetch('/api/anime/collection')
            .then((res) => (res.ok ? res.json() : { results: [] }))
            .catch(() => ({ results: [] })),
          fetch('/api/movies/genre/28')
            .then((res) => (res.ok ? res.json() : { results: [] }))
            .catch(() => ({ results: [] })),
          ...STREAMING_SERVICES.map((s) =>
            fetch(`/api/movies/provider/${s.id}`)
              .then((res) => (res.ok ? res.json() : { results: [] }))
              .catch(() => ({ results: [] }))
          ),
        ]);

        const movies = (movieRes as any).results || [];
        setTrendingMovies(movies);
        setTrendingTV((tvRes as any).results || []);
        setAnime((animeRes as any).results || []);
        setActionMovies((actionRes as any).results || []);

        const services: Record<number, TMDBMovie[]> = {};
        STREAMING_SERVICES.forEach((s, i) => {
          services[s.id] = (serviceRes[i] as any).results || [];
        });
        setServiceRows(services);

        // Flatten all for recommendation pool
        const all = [
          ...movies,
          ...((tvRes as any).results || []),
          ...((animeRes as any).results || []),
          ...((actionRes as any).results || []),
          ...Object.values(services).flat(),
        ];
        const unique = Array.from(new Map(all.map((item) => [item.id, item])).values());
        setAllFetchedData(unique);

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

    return () => {
      if (bannerIntervalRef.current) clearInterval(bannerIntervalRef.current);
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

      {/* Hero Banner */}
      {isLoading ? (
        <BannerSkeleton />
      ) : bannerMovie ? (
        <div className="relative h-[60vh] md:h-[70vh] w-full">
          <div className="absolute inset-0">
            <Image
              src={`${IMG_URL}${bannerMovie.backdrop_path}`}
              alt={bannerMovie.title || bannerMovie.name || ''}
              fill
              className="object-cover"
              priority
              sizes="100vw"
            />
            <div className="absolute inset-0 banner-gradient" />
          </div>
          <div className="absolute inset-x-0 bottom-0 px-3 md:px-8 py-6 md:py-10 z-10">
            <h1 className="text-2xl md:text-4xl font-bold mb-2 md:mb-3 max-w-2xl">
              {bannerMovie.title || bannerMovie.name}
            </h1>
            <p className="text-sm md:text-base text-gray-200 max-w-xl mb-3 md:mb-4 line-clamp-2 md:line-clamp-3">
              {bannerMovie.overview}
            </p>
            <div className="flex flex-wrap gap-2 md:gap-3">
              <button
                onClick={() => handlePlayClick(bannerMovie)}
                className="bg-white text-black hover:bg-opacity-80 px-4 md:px-6 py-2 md:py-3 rounded text-sm md:text-base font-bold flex items-center transition"
              >
                <Play className="w-4 h-4 md:w-5 md:h-5 mr-1 md:mr-2 fill-current" /> Play
              </button>
              <button
                onClick={() => setSelectedMovie(bannerMovie)}
                className="bg-gray-500/60 hover:bg-gray-600/80 text-white px-4 md:px-6 py-2 md:py-3 rounded text-sm md:text-base font-bold flex items-center transition"
              >
                <Info className="w-4 h-4 md:w-5 md:h-5 mr-1 md:mr-2" /> More Info
              </button>
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
                (serviceRows[s.id]?.length ?? 0) > 0 && (
                  <MovieRow
                    key={s.id}
                    title={`${s.name} Movies`}
                    items={serviceRows[s.id]}
                    id={s.rowId}
                    onSeeAll={() =>
                      setSeeAllData({
                        title: `${s.name} Movies`,
                        items: serviceRows[s.id],
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
