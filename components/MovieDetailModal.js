'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Star, PlayCircle, Download, UserCheck } from 'lucide-react';
import Image from 'next/image';

const IMG_URL = 'https://image.tmdb.org/t/p/original';

export default function MovieDetailModal({ movie, onClose, genres }) {
  const [server, setServer] = useState('vidsrc.cc');
  const [embedUrl, setEmbedUrl] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [showOverlay, setShowOverlay] = useState(true);

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
            
            {showOverlay && !isLoading && embedUrl && (
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

            {!isLoading && !embedUrl && (
              <div className="absolute inset-0 z-10 bg-black/80 flex flex-col items-center justify-center text-center p-6">
                <p className="text-xl font-bold text-gray-300">Video Source Not Available</p>
                <p className="text-gray-500 mt-2">Please try selecting a different server from the dropdown menu.</p>
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
