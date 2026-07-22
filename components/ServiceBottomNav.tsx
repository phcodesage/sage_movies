'use client';

import React from 'react';
import Image from 'next/image';
import { STREAMING_SERVICES } from '../lib/streamingServices';
import { scrollToSection } from '../lib/utils/scrollToSection';

const LOGO_URL = 'https://image.tmdb.org/t/p/w92';

/**
 * Fixed bottom nav with one tab per streaming service — a fast jump to each
 * service's shelf of box-office hits. Mobile shows icon + tiny label stacked;
 * desktop shows a horizontal pill. Scrolling goes through scrollToSection so
 * lazy-loading posters can't cancel the jump mid-animation.
 */
export default function ServiceBottomNav() {
  return (
    <nav
      aria-label="Streaming services"
      className="fixed bottom-0 inset-x-0 z-40 bg-netflix-black/90 backdrop-blur-md border-t border-gray-800 pb-[env(safe-area-inset-bottom)]"
    >
      <div className="flex items-stretch justify-center gap-1 md:gap-4 px-2 py-1.5 md:py-2">
        {STREAMING_SERVICES.map((s) => (
          <button
            key={s.id}
            onClick={() => scrollToSection(s.rowId)}
            className="group flex flex-col md:flex-row items-center gap-0.5 md:gap-2.5 px-3 md:px-4 py-1 md:py-1.5 rounded-xl hover:bg-white/10 transition-colors active:scale-95"
          >
            <span className="relative w-8 h-8 md:w-9 md:h-9 rounded-lg overflow-hidden border border-gray-700 group-hover:border-netflix-red transition-colors shrink-0">
              <Image
                src={`${LOGO_URL}${s.logoPath}`}
                alt={s.name}
                fill
                className="object-cover"
                sizes="36px"
              />
            </span>
            <span className="text-[9px] md:text-xs font-bold text-gray-400 group-hover:text-white transition-colors whitespace-nowrap">
              {s.shortName}
            </span>
          </button>
        ))}
      </div>
    </nav>
  );
}
