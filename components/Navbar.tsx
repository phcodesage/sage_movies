'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { useRouter, usePathname } from 'next/navigation';
import { Search, ChevronDown, History, Trash2, Smartphone, Menu, X } from 'lucide-react';
import { cn } from '../lib/utils';
import { useScroll } from '../lib/hooks/useScroll';
import { useAppContext } from '../lib/context/AppContext';
import { useWatchHistory } from '../lib/hooks/useWatchHistory';
import { scrollToSection } from '../lib/utils/scrollToSection';
const DownloadAppModal = dynamic(() => import('./DownloadAppModal'), { ssr: false });

interface NavbarProps {
  onSearchClick: () => void;
}

const SECTIONS = [
  { id: 'movies', label: 'Movies', keyHint: 'LB' },
  { id: 'tv', label: 'TV Series', keyHint: 'RB' },
  { id: 'action', label: 'Action', keyHint: 'X' },
  { id: 'anime', label: 'Anime', keyHint: 'Y' },
];

export default function Navbar({ onSearchClick }: NavbarProps) {
  const isScrolled = useScroll(50);
  const { genres } = useAppContext();
  const { history, clearHistory } = useWatchHistory();
  const router = useRouter();
  const pathname = usePathname();
  const [isMobileBrowseOpen, setIsMobileBrowseOpen] = useState(false);
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);

  const goToSection = (id: string) => {
    setIsMobileBrowseOpen(false);
    if (pathname === '/') {
      scrollToSection(id);
    } else {
      router.push(`/#${id}`);
    }
  };

  return (
    <>
      <nav
        className={cn(
          'safe-top fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-3 md:px-8 py-3 transition-all border-b-4 border-black font-sans',
          isScrolled
            ? 'bg-[#0F1015] shadow-[0_6px_0_0_rgba(0,0,0,1)]'
            : 'bg-[#0F1015]/95 backdrop-blur-md'
        )}
      >
        {/* Left Side: Xbox Brand Logo & Dashboard Nav Tabs */}
        <div className="flex items-center space-x-3 md:space-x-6">
          <div
            onClick={() => router.push('/')}
            className="flex items-center space-x-2 cursor-pointer group"
          >
            <img
              src="/icons/icon.svg"
              alt="Sage Movies"
              width={44}
              height={44}
              className="w-11 h-11 md:w-10 md:h-10 md:border-3 md:border-black md:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] group-hover:-translate-y-0.5 transition-all"
            />
            {/* Wordmark is desktop/tablet only — mobile shows the logo alone */}
            <h1 className="hidden md:block text-white text-xl md:text-2xl font-black tracking-tighter uppercase">
              <span>SAGE</span>
              <span className="bg-[#FFE600] text-black px-1.5 py-0.5 ml-1 border-2 border-black">
                MOVIES
              </span>
            </h1>
          </div>

          {/* Desktop Tab Links */}
          <div className="hidden lg:flex items-center space-x-3">
            <button
              onClick={() => router.push('/')}
              className="px-3.5 py-1.5 text-xs font-black uppercase tracking-wider bg-[#107C10] text-white border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 transition-all"
            >
              HOME
            </button>

            {SECTIONS.map((s) => (
              <button
                key={s.id}
                onClick={() => goToSection(s.id)}
                className="px-3 py-1.5 text-xs font-black uppercase tracking-wider bg-white hover:bg-[#FFE600] text-black border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 transition-all flex items-center space-x-1.5"
              >
                <span className="bg-black text-white text-[10px] px-1 py-0.5 rounded-none font-mono">
                  {s.keyHint}
                </span>
                <span>{s.label}</span>
              </button>
            ))}

            {/* Genre Dropdown */}
            <div className="relative group">
              <button className="px-3 py-1.5 text-xs font-black uppercase tracking-wider bg-white hover:bg-[#00E5FF] text-black border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 transition-all flex items-center space-x-1">
                <span>GENRES</span>
                <ChevronDown className="w-3.5 h-3.5 stroke-[3] group-hover:rotate-180 transition-transform" />
              </button>
              <div className="absolute top-full left-0 pt-2 w-52 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                <div className="bg-white border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] py-2 max-h-80 overflow-y-auto font-bold">
                  {Object.entries(genres).map(([id, name]) => (
                    <button
                      key={id}
                      onClick={() => router.push(`/genre/${id}`)}
                      className="w-full text-left px-4 py-2 text-xs text-black hover:bg-[#FFE600] border-b border-black/20 uppercase tracking-wider font-extrabold block"
                    >
                      🎮 {name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Xbox Controller Actions (Search, Download App, History) */}
        <div className="flex items-center space-x-2 md:space-x-3">
          {/* Search — the one action kept beside the logo on mobile */}
          <button
            onClick={onSearchClick}
            aria-label="Search"
            className="md:hidden w-11 h-11 bg-[#FFE600] text-black border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center active:translate-y-0.5 transition-all"
          >
            <Search className="w-5 h-5 stroke-[3]" />
          </button>

          {/* Mobile menu — everything else lives in the panel below */}
          <button
            onClick={() => setIsMobileBrowseOpen((open) => !open)}
            aria-expanded={isMobileBrowseOpen}
            aria-label="Browse sections and genres"
            className="lg:hidden w-11 h-11 bg-white text-black border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center active:translate-y-0.5 transition-all"
          >
            {isMobileBrowseOpen ? (
              <X className="w-5 h-5 stroke-[3]" />
            ) : (
              <Menu className="w-5 h-5 stroke-[3]" />
            )}
          </button>

          {/* APK Download Button — mobile gets it inside the menu panel */}
          <button
            onClick={() => setIsDownloadModalOpen(true)}
            aria-label="Get app"
            className="hidden md:flex min-h-[44px] px-3 py-1.5 bg-[#FF3366] text-white border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:bg-black hover:text-[#FF3366] text-xs font-black uppercase tracking-wider items-center space-x-1.5 hover:-translate-y-0.5 transition-all"
          >
            <Smartphone className="w-4 h-4 stroke-[3]" />
            <span className="hidden sm:inline">GET APP</span>
          </button>

          {/* Search Button */}
          <button
            onClick={onSearchClick}
            aria-label="Search"
            className="hidden md:flex min-h-[44px] px-3 py-1.5 bg-[#FFE600] text-black border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:bg-black hover:text-[#FFE600] text-xs font-black uppercase tracking-wider items-center space-x-1.5 hover:-translate-y-0.5 transition-all"
          >
            <span className="hidden sm:inline bg-black text-[#FFE600] text-[10px] px-1 py-0.5 font-mono">
              Y
            </span>
            <Search className="w-4 h-4 stroke-[3]" />
            <span className="hidden sm:inline">SEARCH</span>
          </button>

          {/* Watch History Drawer — desktop hover; mobile lives in the menu panel */}
          {history.length > 0 && (
            <div className="relative group hidden md:block">
              <button
                aria-label="Watch history"
                className="px-3 py-1.5 bg-[#00E5FF] text-black border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] text-xs font-black uppercase tracking-wider flex items-center space-x-1 hover:-translate-y-0.5 transition-all"
              >
                <History className="w-4 h-4 stroke-[3]" />
                <span className="hidden sm:inline bg-black text-white text-[10px] px-1.5 py-0.5 rounded-none">
                  {history.length}
                </span>
              </button>

              <div className="absolute right-0 top-full pt-2 w-80 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                <div className="bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-4 space-y-3">
                  <div className="flex items-center justify-between border-b-3 border-black pb-2">
                    <span className="text-xs font-black uppercase tracking-wider text-black">
                      RECENT REPLAY LOG
                    </span>
                    <button
                      onClick={clearHistory}
                      className="text-[10px] font-black text-red-600 hover:text-black uppercase flex items-center space-x-1"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>CLEAR</span>
                    </button>
                  </div>

                  <div className="max-h-64 overflow-y-auto space-y-2">
                    {history.slice(0, 5).map((item) => (
                      <div
                        key={item.id}
                        onClick={() => {
                          const slug = (item.title || item.name || '')
                            .toLowerCase()
                            .replace(/[^a-z0-9]+/g, '-')
                            .replace(/(^-|-$)/g, '');
                          const mediaType =
                            item.media_type || (item.first_air_date ? 'tv' : 'movie');
                          router.push(`/movie/${item.id}/${mediaType}-${slug}`);
                        }}
                        className="flex items-center space-x-3 p-2 bg-yellow-100 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-[#FFE600] cursor-pointer transition-colors"
                      >
                        {item.poster_path && (
                          <img
                            src={`https://image.tmdb.org/t/p/w92${item.poster_path}`}
                            alt={item.title || item.name}
                            className="w-10 h-14 object-cover border-2 border-black shrink-0"
                          />
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-black text-black truncate uppercase">
                            {item.title || item.name}
                          </p>
                          <p className="text-[10px] font-bold text-zinc-700 uppercase">
                            {item.media_type === 'tv' ? 'TV SERIES' : 'MOVIE'}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
        {/* Mobile Browse Panel */}
        {isMobileBrowseOpen && (
          <div className="lg:hidden absolute top-full inset-x-0 bg-[#0F1015] border-b-4 border-black shadow-[0_6px_0_0_rgba(0,0,0,1)] px-3 py-3 max-h-[70dvh] overflow-y-auto">
            <div className="grid grid-cols-2 gap-2 mb-3">
              <button
                onClick={() => {
                  setIsMobileBrowseOpen(false);
                  router.push('/');
                }}
                className="min-h-[44px] px-3 py-2 text-xs font-black uppercase tracking-wider bg-[#107C10] text-white border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]"
              >
                Home
              </button>
              {SECTIONS.map((s) => (
                <button
                  key={s.id}
                  onClick={() => goToSection(s.id)}
                  className="min-h-[44px] px-3 py-2 text-xs font-black uppercase tracking-wider bg-white text-black border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]"
                >
                  {s.label}
                </button>
              ))}
            </div>
            <button
              onClick={() => {
                setIsMobileBrowseOpen(false);
                setIsDownloadModalOpen(true);
              }}
              className="md:hidden w-full min-h-[44px] mb-3 px-3 py-2 text-xs font-black uppercase tracking-wider bg-[#FF3366] text-white border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center gap-1.5"
            >
              <Smartphone className="w-4 h-4 stroke-[3]" />
              Get App
            </button>
            <p className="text-[10px] font-black uppercase tracking-wider text-zinc-400 mb-2">Genres</p>
            <div className="flex flex-wrap gap-1.5">
              {Object.entries(genres).map(([id, name]) => (
                <button
                  key={id}
                  onClick={() => {
                    setIsMobileBrowseOpen(false);
                    router.push(`/genre/${id}`);
                  }}
                  className="min-h-[40px] px-2.5 py-1.5 text-[11px] font-extrabold uppercase tracking-wider bg-zinc-800 text-white border border-black"
                >
                  {name}
                </button>
              ))}
            </div>
            {history.length > 0 && (
              <>
                <div className="flex items-center justify-between mt-4 mb-2">
                  <p className="text-[10px] font-black uppercase tracking-wider text-zinc-400">
                    Continue Watching
                  </p>
                  <button
                    onClick={clearHistory}
                    className="text-[10px] font-black text-red-400 uppercase flex items-center gap-1 min-h-[32px]"
                  >
                    <Trash2 className="w-3 h-3" /> Clear
                  </button>
                </div>
                <div className="flex flex-col gap-1.5">
                  {history.slice(0, 5).map((item) => (
                    <button
                      key={`${item.media_type || ''}:${item.id}`}
                      onClick={() => {
                        const slug = (item.title || item.name || '')
                          .toLowerCase()
                          .replace(/[^a-z0-9]+/g, '-')
                          .replace(/(^-|-$)/g, '');
                        const mediaType =
                          item.media_type || (item.first_air_date ? 'tv' : 'movie');
                        setIsMobileBrowseOpen(false);
                        router.push(`/movie/${item.id}/${mediaType}-${slug}`);
                      }}
                      className="flex items-center gap-3 min-h-[44px] px-2 py-1.5 bg-zinc-800 border border-black text-left"
                    >
                      {item.poster_path && (
                        <img
                          src={`https://image.tmdb.org/t/p/w92${item.poster_path}`}
                          alt=""
                          className="w-8 h-11 object-cover border border-black shrink-0"
                        />
                      )}
                      <span className="min-w-0">
                        <span className="block text-xs font-black text-white truncate uppercase">
                          {item.title || item.name}
                        </span>
                        <span className="block text-[10px] font-bold text-zinc-400 uppercase">
                          {item.media_type === 'tv' ? 'TV Series' : 'Movie'}
                        </span>
                      </span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </nav>

      {/* APK Download Modal */}
      {isDownloadModalOpen && (
        <DownloadAppModal
          isOpen={isDownloadModalOpen}
          onClose={() => setIsDownloadModalOpen(false)}
        />
      )}
    </>
  );
}
