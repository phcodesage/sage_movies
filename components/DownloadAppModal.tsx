'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Smartphone, Download, X, CheckCircle2, Zap, Star, Film } from 'lucide-react';
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
    tagline: 'STREAM IN 4K ULTRA HD',
  },
  {
    title: 'Moana 2',
    poster: 'https://image.tmdb.org/t/p/w500/a26cQPRhJPX6GbWfQkZBDhRj0x5.jpg',
    studio: 'DISNEY+',
    rating: '8.7',
    tagline: 'TRENDING FAMILY HITS',
  },
  {
    title: 'Gladiator II',
    poster: 'https://image.tmdb.org/t/p/w500/2cxhvwyEwRlysAmRH4iodkvo0zE.jpg',
    studio: 'PARAMOUNT+',
    rating: '8.6',
    tagline: 'INSTANT 60FPS PLAYBACK',
  },
  {
    title: 'Stranger Things 5',
    poster: 'https://image.tmdb.org/t/p/w500/49WJfeN0moxb9IPfGn8AIqMGskD.jpg',
    studio: 'NETFLIX',
    rating: '9.1',
    tagline: 'EXCLUSIVE SERIES & MOVIES',
  },
];

export default function DownloadAppModal({ isOpen, onClose }: DownloadAppModalProps) {
  const { markAppDownloaded, hasDownloadedApp } = useAppContext();
  const [isCountingDown, setIsCountingDown] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const [hasStartedDownload, setHasStartedDownload] = useState(false);
  const [showcaseMovie, setShowcaseMovie] = useState(FEATURED_SHOWCASE_MOVIES[0]);

  const downloadUrl =
    process.env.NEXT_PUBLIC_ANDROID_APK_URL || '/sagemovies-latest.apk';

  useEffect(() => {
    if (isOpen) {
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-4 bg-black/90 backdrop-blur-md font-sans">
      <div className="relative w-full max-w-2xl bg-[#0F1015] border-4 border-black shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] overflow-hidden text-white grid grid-cols-1 md:grid-cols-12">
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-3 right-3 z-30 bg-[#FF3366] text-white p-1.5 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-black transition-all"
        >
          <X className="w-5 h-5 stroke-[3]" />
        </button>

        {/* LEFT COLUMN: Showcase Poster */}
        <div className="relative md:col-span-5 hidden sm:flex flex-col justify-end p-5 overflow-hidden group min-h-[220px] md:min-h-full border-b-4 md:border-b-0 md:border-r-4 border-black">
          <Image
            src={showcaseMovie.poster}
            alt={showcaseMovie.title}
            fill
            className="object-cover object-center opacity-80"
            unoptimized
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />

          <div className="absolute top-3 left-3 z-10 flex flex-wrap gap-1.5">
            <span className="text-[9px] font-black px-2 py-0.5 bg-[#FF3366] text-white uppercase tracking-wider border border-black">
              {showcaseMovie.studio}
            </span>
            <span className="text-[9px] font-black px-2 py-0.5 bg-[#FFE600] text-black border border-black flex items-center gap-0.5">
              <Star className="w-2.5 h-2.5 fill-current" />
              {showcaseMovie.rating}
            </span>
          </div>

          <div className="relative z-10 pt-16">
            <p className="text-[10px] uppercase font-black text-[#FFE600] tracking-wider">
              {showcaseMovie.tagline}
            </p>
            <h4 className="text-base font-black uppercase text-white leading-tight">
              {showcaseMovie.title}
            </h4>
          </div>
        </div>

        {/* RIGHT COLUMN: Download Action */}
        <div className="md:col-span-7 p-5 md:p-6 flex flex-col justify-between">
          {!isCountingDown ? (
            <>
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-11 h-11 bg-[#FF3366] text-white border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center shrink-0 font-black">
                    <Smartphone className="w-6 h-6 stroke-[3]" />
                  </div>
                  <div>
                    <h3 className="text-base md:text-lg font-black uppercase text-white tracking-tight">
                      GET SAGEMOVIES APK
                    </h3>
                    <p className="text-[11px] font-bold text-zinc-400">
                      Official Android App • v1.4.7
                    </p>
                  </div>
                </div>

                {hasDownloadedApp && (
                  <div className="mb-3 p-2.5 bg-[#107C10] text-white border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-xs font-black uppercase flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>Ad-Free Mobile Mode Enabled!</span>
                  </div>
                )}

                <div className="space-y-2 my-4 bg-black border-3 border-black p-3.5 text-xs font-bold text-zinc-200 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#107C10] shrink-0" />
                    <span>13 Studio Hubs (Netflix, Disney+, Vivamax)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-[#FFE600] shrink-0" />
                    <span>6 Fast 1080p Streaming Servers</span>
                  </div>
                </div>
              </div>

              <button
                onClick={handleStartDownloadFlow}
                className="w-full bg-[#FF3366] hover:bg-[#FFE600] hover:text-black text-white font-black py-3 px-4 border-3 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-xs md:text-sm uppercase tracking-wider flex items-center justify-center gap-2 hover:-translate-y-0.5 transition-all"
              >
                <Download className="w-4 h-4 stroke-[3]" />
                <span>DOWNLOAD ANDROID APK</span>
              </button>
            </>
          ) : (
            <div className="py-8 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 bg-[#FFE600] text-black border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center font-black text-2xl mb-4">
                {countdown}
              </div>
              <h4 className="text-base font-black uppercase text-white mb-1">
                PREPARING APK DOWNLOAD...
              </h4>
              <p className="text-xs font-bold text-zinc-400 mb-4">
                Your download will start automatically in a moment.
              </p>
              <div className="w-full max-w-xs border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                <AdsterraBanner />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
