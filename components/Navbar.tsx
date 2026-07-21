'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useRouter, usePathname } from 'next/navigation';
import { Search, ChevronDown, History, Trash2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { useScroll } from '../lib/hooks/useScroll';
import { useAppContext } from '../lib/context/AppContext';
import { useWatchHistory } from '../lib/hooks/useWatchHistory';
import { scrollToSection } from '../lib/utils/scrollToSection';

interface NavbarProps {
  onSearchClick: () => void;
}

// TMDB genre id for "Family" — what the Kids link filters to.
const FAMILY_GENRE_ID = 10751;

// Homepage row ids, as passed to <MovieRow id="...">.
const SECTIONS = [
  { id: 'tv', label: 'TV Shows' },
  { id: 'movies', label: 'Movies' },
  { id: 'action', label: 'Action' },
  { id: 'anime', label: 'Anime' },
];

export default function Navbar({ onSearchClick }: NavbarProps) {
  const isScrolled = useScroll(50);
  const { genres } = useAppContext();
  const { history, clearHistory } = useWatchHistory();
  const router = useRouter();
  const pathname = usePathname();
  const [isMobileBrowseOpen, setIsMobileBrowseOpen] = useState(false);

  /**
   * Jump to a homepage row. When we're already on `/` the row exists, so scroll
   * directly; otherwise navigate with the hash and let the homepage scroll once its
   * data has rendered (see the hash effect in app/page.tsx) — the sections don't
   * exist until the fetches resolve, so a plain <a href="/#tv"> lands at the top.
   */
  const goToSection = (id: string) => {
    setIsMobileBrowseOpen(false);
    if (pathname === '/') {
      scrollToSection(id);
    } else {
      router.push(`/#${id}`);
    }
  };

  return (
    <nav
      className={cn(
        'fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-3 md:px-8 py-2 md:py-3 transition-all duration-700',
        isScrolled ? 'bg-netflix-black shadow-2xl' : 'bg-gradient-to-b from-black/80 to-transparent'
      )}
    >
      <div className="flex items-center space-x-2 md:space-x-6">
        <h1
          onClick={() => router.push('/')}
          className="text-netflix-red text-xl md:text-2xl font-extrabold tracking-tighter cursor-pointer hover:scale-105 transition-transform"
        >
          SAGE
        </h1>

        <div className="hidden lg:flex items-center space-x-4">
          <button
            onClick={() => router.push('/')}
            className="text-xs font-bold text-white hover:text-gray-300 transition-colors"
          >
            Home
          </button>
          {SECTIONS.map((s) => (
            <button
              key={s.id}
              onClick={() => goToSection(s.id)}
              className="text-xs font-medium text-gray-200 hover:text-white transition-colors"
            >
              {s.label}
            </button>
          ))}

          <div className="relative group ml-2">
            <button className="flex items-center text-xs font-medium text-gray-200 hover:text-white transition-colors">
              Browse Genres{' '}
              <ChevronDown className="w-3 h-3 ml-1 group-hover:rotate-180 transition-transform duration-300" />
            </button>
            <div className="absolute top-full left-0 pt-2 w-48 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300">
              <div className="bg-netflix-black border border-gray-800 rounded shadow-2xl py-2 max-h-80 overflow-y-auto">
                {Object.entries(genres).map(([id, name]) => (
                  <button
                    key={id}
                    onClick={() => router.push(`/genre/${id}`)}
                    className="w-full text-left px-4 py-2 text-xs text-gray-300 hover:bg-gray-800 hover:text-white transition-colors block"
                  >
                    {name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Mobile browse — click-toggled, since hover menus don't open on touch. */}
        <div className="lg:hidden relative">
          <button
            onClick={() => setIsMobileBrowseOpen((v) => !v)}
            className="flex items-center text-xs font-bold text-white"
          >
            Browse
            <ChevronDown
              className={cn(
                'w-3 h-3 ml-1 transition-transform duration-300',
                isMobileBrowseOpen && 'rotate-180'
              )}
            />
          </button>
          {isMobileBrowseOpen && (
            <div className="absolute top-full left-0 mt-2 w-52 bg-netflix-black border border-gray-800 rounded shadow-2xl py-2 max-h-[70vh] overflow-y-auto">
              {SECTIONS.map((s) => (
                <button
                  key={s.id}
                  onClick={() => goToSection(s.id)}
                  className="w-full text-left px-4 py-2 text-xs font-bold text-white hover:bg-gray-800 transition-colors"
                >
                  {s.label}
                </button>
              ))}
              <div className="border-t border-gray-800 my-1" />
              {Object.entries(genres).map(([id, name]) => (
                <button
                  key={id}
                  onClick={() => {
                    setIsMobileBrowseOpen(false);
                    router.push(`/genre/${id}`);
                  }}
                  className="w-full text-left px-4 py-2 text-xs text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
                >
                  {name}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center space-x-2 md:space-x-4">
        <button
          onClick={onSearchClick}
          className="text-white hover:scale-110 transition-transform p-1"
        >
          <Search className="w-4 h-4 md:w-5 md:h-5" />
        </button>

        <button
          onClick={() => router.push(`/genre/${FAMILY_GENRE_ID}`)}
          className="hidden sm:block text-xs font-medium text-gray-200 hover:text-white transition-colors"
        >
          Kids
        </button>

        <div className="group relative">
          <div className="w-7 h-7 md:w-8 md:h-8 rounded cursor-pointer overflow-hidden border-2 border-transparent hover:border-white transition-colors">
            <Image
              src="https://ui-avatars.com/api/?name=Sage&background=222&color=fff&rounded=false&size=36"
              alt="Profile"
              width={36}
              height={36}
              className="object-cover"
            />
          </div>
          <div className="absolute top-full right-0 pt-2 w-48 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300">
            <div className="bg-netflix-black border border-gray-800 rounded shadow-2xl py-2">
              <button
                onClick={() => goToSection('history')}
                className="w-full flex items-center gap-2 text-left px-4 py-2 text-xs text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
              >
                <History className="w-3 h-3" /> Continue Watching
              </button>
              <button
                onClick={clearHistory}
                disabled={history.length === 0}
                className="w-full flex items-center gap-2 text-left px-4 py-2 text-xs text-gray-300 hover:bg-gray-800 hover:text-white transition-colors border-t border-gray-800 mt-1 disabled:opacity-40 disabled:hover:bg-transparent"
              >
                <Trash2 className="w-3 h-3" /> Clear History ({history.length})
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
