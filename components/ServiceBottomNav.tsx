'use client';

import React from 'react';
import { STREAMING_SERVICES } from '../lib/streamingServices';
import { scrollToSection } from '../lib/utils/scrollToSection';

const LOGO_URL = 'https://image.tmdb.org/t/p/w92';

export default function ServiceBottomNav() {
  return (
    <nav
      aria-label="Streaming services"
      className="fixed bottom-0 inset-x-0 z-40 bg-zinc-950 border-t border-zinc-800 pb-[env(safe-area-inset-bottom)] shadow-2xl"
    >
      <div className="flex items-center justify-start md:justify-center gap-1.5 md:gap-3 px-3 py-1.5 md:py-2 overflow-x-auto no-scrollbar scroll-smooth">
        {STREAMING_SERVICES.map((s) => {
          const logoSrc = s.logoPath.startsWith('http')
            ? s.logoPath
            : `${LOGO_URL}${s.logoPath}`;

          return (
            <button
              key={s.id}
              onClick={() => scrollToSection(s.rowId)}
              className="group flex flex-col md:flex-row items-center gap-1 md:gap-2 px-2.5 md:px-3.5 py-1 rounded-xl hover:bg-zinc-800 transition-colors shrink-0 active:scale-95"
            >
              <span className="relative w-7 h-7 md:w-8 md:h-8 rounded-lg overflow-hidden border border-zinc-800 group-hover:border-netflix-red transition-colors shrink-0 bg-zinc-900 flex items-center justify-center p-0.5 shadow-sm">
                <img
                  src={logoSrc}
                  alt={s.name}
                  className="w-full h-full object-contain rounded"
                  onError={(e) => {
                    (e.target as HTMLElement).style.opacity = '0.5';
                  }}
                />
              </span>
              <span className="text-[10px] md:text-xs font-bold text-gray-300 group-hover:text-white transition-colors whitespace-nowrap">
                {s.shortName}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
