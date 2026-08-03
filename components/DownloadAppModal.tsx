'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Smartphone, Download, X, CheckCircle2, ShieldCheck, Zap, Star, ArrowRight, Play, Film, Check } from 'lucide-react';
import AdsterraBanner from './AdsterraBanner';
import { useAppContext } from '../lib/context/AppContext';

interface DownloadAppModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const FEATURED_SHOWCASE_MOVIES = [
  {
    title: 'Deadpool & Wolverine',
    poster: 'https://image.tmdb.org/t/p/w500/8cdWjvZQUExUUTzypqBkZ6yRSuE.jpg',
    studio: 'MARVEL STUDIOS',
    rating: '8.9',
    tagline: 'Stream in 4K Ultra HD on Mobile',
  },
  {
    title: 'Moana 2',
    poster: 'https://image.tmdb.org/t/p/w500/a26cQPRhJPX6GbWfQkZBDhRj0x5.jpg',
    studio: 'DISNEY+',
    rating: '8.7',
    tagline: 'Trending Family Hits',
  },
  {
    title: 'Gladiator II',
    poster: 'https://image.tmdb.org/t/p/w500/2cxhvwyEwRlysAmRH4iodkvo0zE.jpg',
    studio: 'PARAMOUNT+',
    rating: '8.6',
    tagline: 'Instant 60fps Playback',
  },
  {
    title: 'Stranger Things 5',
    poster: 'https://image.tmdb.org/t/p/w500/49WJfeN0moxb9IPfGn8AIqMGskD.jpg',
    studio: 'NETFLIX',
    rating: '9.1',
    tagline: 'Exclusive Series & Movies',
  },
];

export default function DownloadAppModal({ isOpen, onClose }: DownloadAppModalProps) {
  const { markAppDownloaded, hasDownloadedApp } = useAppContext();
  const [isCountingDown, setIsCountingDown] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const [hasStartedDownload, setHasStartedDownload] = useState(false);
  const [showcaseMovie, setShowcaseMovie] = useState(FEATURED_SHOWCASE_MOVIES[0]);

  const downloadUrl =
    process.env.NEXT_PUBLIC_ANDROID_APK_URL ||
    'https://pub-bd093e291a8941608e8a6fe70c3aca53.r2.dev/sagemovies-v1.4.7.apk';

  useEffect(() => {
    if (isOpen) {
      // Pick a random featured movie poster when modal opens
      const randomItem =
        FEATURED_SHOWCASE_MOVIES[
          Math.floor(Math.random() * FEATURED_SHOWCASE_MOVIES.length)
        ];
      setShowcaseMovie(randomItem);
    }
  }, [isOpen]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isCountingDown && countdown > 0) {
      timer = setTimeout(() => setCountdown((prev) => prev - 1), 1000);
    } else if (isCountingDown && countdown === 0 && !hasStartedDownload) {
      setHasStartedDownload(true);
      markAppDownloaded();
      window.location.href = downloadUrl;
    }
    return () => clearTimeout(timer);
  }, [isCountingDown, countdown, hasStartedDownload, downloadUrl, markAppDownloaded]);

  const handleStartDownloadFlow = () => {
    markAppDownloaded();
    setIsCountingDown(true);
    setCountdown(5);
    setHasStartedDownload(false);
  };

  const handleClose = () => {
    setIsCountingDown(false);
    setCountdown(5);
    setHasStartedDownload(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-4 bg-black/90 backdrop-blur-md transition-all animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-zinc-950 border border-zinc-800 rounded-2xl md:rounded-3xl shadow-2xl overflow-hidden text-white grid grid-cols-1 md:grid-cols-12">
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-3 right-3 z-20 p-1.5 rounded-full bg-zinc-900 text-gray-300 hover:text-white hover:bg-zinc-800 transition-colors border border-zinc-700 shadow-md"
        >
          <X className="w-4 h-4" />
        </button>

        {/* LEFT COLUMN: Movie Poster Showcase */}
        <div className="relative md:col-span-5 hidden sm:flex flex-col justify-end p-5 overflow-hidden group min-h-[220px] md:min-h-full">
          {/* Background Poster with Gradient Overlay */}
          <Image
            src={showcaseMovie.poster}
            alt={showcaseMovie.title}
            fill
            className="object-cover object-center group-hover:scale-105 transition-transform duration-700 brightness-90"
            unoptimized
          />
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-transparent to-zinc-950/90 hidden md:block" />

          {/* Top Material 3 Badges */}
          <div className="absolute top-3 left-3 z-10 flex flex-wrap gap-1.5">
            <span className="flex items-center gap-1 text-[9px] font-black px-2.5 py-0.5 rounded-full bg-netflix-red text-white uppercase tracking-wider shadow-md">
              <Film className="w-2.5 h-2.5" />
              {showcaseMovie.studio}
            </span>
            <span className="flex items-center gap-1 text-[9px] font-black px-2.5 py-0.5 rounded-full bg-amber-500 text-black shadow-md">
              <Star className="w-2.5 h-2.5 fill-current" />
              {showcaseMovie.rating}
            </span>
          </div>

          {/* Poster Content Overlay */}
          <div className="relative z-10 pt-16">
            <p className="text-[10px] uppercase font-black text-netflix-red tracking-wider">
              {showcaseMovie.tagline}
            </p>
            <h4 className="text-base font-extrabold text-white leading-tight drop-shadow-md">
              {showcaseMovie.title}
            </h4>
            <div className="flex items-center gap-1.5 text-[10px] text-gray-300 mt-1">
              <Play className="w-3 h-3 text-netflix-red fill-netflix-red" />
              <span>Watch offline on Mobile App</span>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Download Action & Interstitial */}
        <div className="md:col-span-7 p-5 md:p-6 flex flex-col justify-between">
          {!isCountingDown ? (
            <>
              <div>
                {/* Header Icon */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-11 h-11 rounded-xl bg-netflix-red text-white flex items-center justify-center shrink-0 shadow-lg">
                    <Smartphone className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base md:text-lg font-extrabold text-white tracking-tight leading-tight">
                      Get SageMovies for Android
                    </h3>
                    <p className="text-[11px] text-gray-400">
                      Official Build • v1.0.3 <span className="text-emerald-400 font-bold">(1.2k+ downloads)</span>
                    </p>
                  </div>
                </div>

                {hasDownloadedApp && (
                  <div className="mb-3 p-2.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center gap-2 text-xs text-emerald-400 font-bold shadow-inner">
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                    <span>Ad-Free Active! All site ads disabled for easier mobile streaming.</span>
                  </div>
                )}

                {/* Features List */}
                <div className="space-y-2.5 my-4 bg-zinc-900 border border-zinc-800 rounded-xl p-3.5 text-xs text-gray-200 shadow-inner">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>13 Studio Hubs (Netflix, Disney+, Vivamax, etc.)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Zap className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span>Active Server Pre-Checks & Auto Failover</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                    <span>Removes all site ads for a clean mobile experience</span>
                  </div>
                </div>
              </div>

              <div>
                {/* Download Action Button */}
                <button
                  onClick={handleStartDownloadFlow}
                  className="flex items-center justify-center gap-2 w-full py-3 px-4 bg-netflix-red hover:bg-red-700 active:scale-98 text-white font-extrabold text-xs md:text-sm rounded-xl transition-all shadow-xl shadow-netflix-red/20 group"
                >
                  <Download className="w-4 h-4 group-hover:translate-y-0.5 transition-transform" />
                  <span>{hasDownloadedApp ? 'Re-download Android APK' : 'Download Android APK (Remove Ads)'}</span>
                </button>

                <p className="text-[10px] text-center text-gray-500 mt-2.5">
                  Compatible with Android 7.0+ (ARM64 / x86_64)
                </p>
              </div>
            </>
          ) : (
            <div className="text-center py-1 flex flex-col justify-between h-full">
              {/* Adsterra Native Banner Unit (Hidden if app is downloaded) */}
              <AdsterraBanner className="mb-2" />

              {/* Countdown State */}
              <div className="my-2">
                {countdown > 0 ? (
                  <div>
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-netflix-red text-white text-lg font-black mb-1.5 animate-pulse shadow-lg">
                      {countdown}s
                    </div>
                    <p className="text-xs text-gray-300 font-medium">
                      Your APK download will begin automatically...
                    </p>
                    <p className="text-[10px] text-emerald-400 font-bold mt-1">
                      Ad-Free mode will be activated on your browser!
                    </p>
                  </div>
                ) : (
                  <div>
                    <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-1 animate-bounce" />
                    <p className="text-xs md:text-sm font-bold text-white">Download Started!</p>
                    <p className="text-[11px] text-emerald-400 font-bold mt-0.5">
                      Ads removed on site for easier mobile streaming!
                    </p>
                  </div>
                )}
              </div>

              {/* Direct Download Button */}
              <a
                href={downloadUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => markAppDownloaded()}
                className="inline-flex items-center justify-center gap-2 w-full py-2.5 px-4 bg-red-600 hover:bg-red-700 active:scale-98 text-white font-bold text-xs rounded-xl transition-all shadow-md mt-1"
              >
                <span>Download Immediately</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
