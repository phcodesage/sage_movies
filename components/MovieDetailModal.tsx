'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, Star, Play } from 'lucide-react';
import Image from 'next/image';
import type { TMDBMovie } from '../types/tmdb';
import SmartVideoPlayer from './SmartVideoPlayer';
import { DEFAULT_SERVER, VIDEO_SERVERS } from '../lib/videoServers';

const IMG_URL = 'https://image.tmdb.org/t/p/original';

interface MovieDetailModalProps {
  movie: TMDBMovie;
  onClose: () => void;
  genres: Record<number, string>;
}

export default function MovieDetailModal({ movie, onClose, genres }: MovieDetailModalProps) {
  const router = useRouter();
  const [server, setServer] = useState(DEFAULT_SERVER);
  const [embedUrl, setEmbedUrl] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const handlePlay = () => {
    const slug = (movie.title || movie.name || '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    const mediaType = movie.media_type || (movie.first_air_date ? 'tv' : 'movie');
    onClose();
    router.push(`/movie/${movie.id}/${mediaType}-${slug}`);
  };

  useEffect(() => {
    const fetchSource = async () => {
      setIsLoading(true);
      try {
        const type = movie.media_type || (movie.first_air_date ? 'tv' : 'movie');
        const res = await fetch(`/api/video-sources/${type}/${movie.id}?server=${server}`);
        if (!res.ok) throw new Error('Failed to fetch source');
        const data = await res.json();
        setEmbedUrl(data.embedURL || '');
      } catch (err) {
        console.error('Video source error:', err);
        setEmbedUrl('');
      } finally {
        setIsLoading(false);
      }
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
            
            {!isLoading && !embedUrl && (
              <div className="absolute inset-0 z-10 bg-black/80 flex flex-col items-center justify-center text-center p-6">
                <p className="text-xl font-bold text-gray-300">Video Source Not Available</p>
                <p className="text-gray-500 mt-2">Please try selecting a different server from the dropdown menu.</p>
              </div>
            )}

            {embedUrl && (
              <SmartVideoPlayer
                src={embedUrl}
                title={movie.title || movie.name || 'Video Player'}
                poster={movie.backdrop_path ? `${IMG_URL}${movie.backdrop_path}` : undefined}
                className="h-full w-full rounded-none shadow-none ring-0"
              />
            )}
          </div>

          <div className="w-full md:w-[30%] flex flex-col gap-6">
            <div className="relative w-full aspect-[2/3] rounded-xl overflow-hidden shadow-2xl">
              <Image src={`${IMG_URL}${movie.poster_path || ''}`} alt={movie.title || movie.name || 'Movie Poster'} fill className="object-cover" sizes="(max-width: 768px) 100vw, 30vw" />
            </div>

            {/* Play Now Button */}
            <button
              onClick={handlePlay}
              className="w-full bg-netflix-red hover:bg-red-700 text-white font-bold py-3 rounded flex items-center justify-center transition transform hover:scale-[1.02]"
            >
              <Play className="w-5 h-5 mr-2 fill-current" /> PLAY NOW
            </button>

            <div className="bg-netflix-dark p-4 rounded-lg">
              <label className="block text-neutral-300 mb-2 font-medium">Change Server:</label>
              <select
                value={server}
                onChange={(e) => setServer(e.target.value)}
                className="w-full bg-black text-white border border-gray-700 rounded px-3 py-2 focus:ring-1 focus:ring-netflix-red"
              >
                {VIDEO_SERVERS.map((videoServer) => (
                  <option key={videoServer.id} value={videoServer.id}>
                    {videoServer.label}
                  </option>
                ))}
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
