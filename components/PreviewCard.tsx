'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Play, Star, Volume2, VolumeX, Info, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { TMDBMovie } from '../types/tmdb';
import { cn } from '../lib/utils';

const IMG_URL = 'https://image.tmdb.org/t/p/original';

interface PreviewCardProps {
  movie: TMDBMovie;
  isVisible: boolean;
  position: { x: number; y: number };
  onClose: () => void;
  onPlay: (movie: TMDBMovie) => void;
}

export default function PreviewCard({ movie, isVisible, position, onClose, onPlay }: PreviewCardProps) {
  const [isMuted, setIsMuted] = useState(true);
  const [embedUrl, setEmbedUrl] = useState('');
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (isVisible && movie) {
      // Small delay before loading the preview to save bandwidth
      const timer = setTimeout(() => {
        const type = movie.first_air_date ? 'tv' : 'movie';
        // Use a fast server for preview
        setEmbedUrl(`https://vidsrc.to/embed/${type}/${movie.id}?autoplay=1&mute=1`);
      }, 500);

      const readyTimer = setTimeout(() => setIsReady(true), 1500);
      
      return () => {
        clearTimeout(timer);
        clearTimeout(readyTimer);
        setEmbedUrl('');
        setIsReady(false);
      };
    }
  }, [isVisible, movie]);

  if (!movie) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8 }}
          className="fixed z-[100] w-[300px] md:w-[350px] bg-netflix-dark rounded-lg shadow-[0_0_40px_rgba(0,0,0,0.8)] overflow-hidden border border-gray-800"
          style={{ 
            left: Math.min(Math.max(20, position.x - 175), window.innerWidth - 370), 
            top: Math.min(Math.max(20, position.y - 200), window.innerHeight - 450)
          }}
          onMouseLeave={onClose}
        >
          {/* Preview Area */}
          <div className="relative aspect-video bg-black">
            {embedUrl && (
              <iframe
                src={embedUrl}
                className={cn(
                  "w-full h-full border-none transition-opacity duration-500",
                  isReady ? "opacity-100" : "opacity-0"
                )}
                allow="autoplay"
              />
            )}
            
            {/* Fallback/Loading Backdrop */}
            <div className={cn(
              "absolute inset-0 transition-opacity duration-500",
              isReady ? "opacity-0 pointer-events-none" : "opacity-100"
            )}>
              <Image 
                src={`${IMG_URL}${movie.backdrop_path || movie.poster_path}`}
                alt={movie.title || movie.name || ''}
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                <div className="w-10 h-10 border-2 border-netflix-red border-t-transparent rounded-full animate-spin" />
              </div>
            </div>

            <div className="absolute top-2 right-2 flex gap-2">
              <button 
                onClick={() => setIsMuted(!isMuted)}
                className="p-1.5 bg-black/50 hover:bg-black/80 rounded-full text-white transition-colors"
              >
                {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Info Area */}
          <div className="p-4 flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <button 
                onClick={() => onPlay(movie)}
                className="w-10 h-10 bg-white hover:bg-gray-200 text-black rounded-full flex items-center justify-center transition-colors active:scale-90"
              >
                <Play className="w-5 h-5 fill-current ml-1" />
              </button>
              <button className="w-10 h-10 border-2 border-gray-500 hover:border-white rounded-full flex items-center justify-center text-white transition-colors">
                <Plus className="w-5 h-5" />
              </button>
              <div className="ml-auto">
                <button className="w-10 h-10 border-2 border-gray-500 hover:border-white rounded-full flex items-center justify-center text-white transition-colors">
                  <Info className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex flex-col">
              <h4 className="text-white font-black text-lg line-clamp-1">{movie.title || movie.name}</h4>
              <div className="flex items-center gap-2 mt-1 text-sm">
                <span className="text-green-500 font-bold">{(movie.vote_average * 10).toFixed(0)}% Match</span>
                <span className="text-gray-400 font-bold">{movie.release_date?.split('-')[0] || movie.first_air_date?.split('-')[0]}</span>
                <span className="border border-gray-600 px-1 rounded text-[10px] text-gray-400 font-bold">HD</span>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {movie.genre_ids?.slice(0, 3).map((id) => (
                <span key={id} className="text-[10px] text-gray-300 font-medium">
                  • Genre {id}
                </span>
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
