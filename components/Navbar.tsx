'use client';

import Image from 'next/image';
import { Search, Bell, Gift, ChevronDown } from 'lucide-react';
import { cn } from '../lib/utils';
import { useScroll } from '../lib/hooks/useScroll';
import { useAppContext } from '../lib/context/AppContext';

interface NavbarProps {
  onSearchClick: () => void;
}

export default function Navbar({ onSearchClick }: NavbarProps) {
  const isScrolled = useScroll(50);
  const { genres } = useAppContext();

  return (
    <nav className={cn(
      "fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-3 md:px-8 py-2 md:py-3 transition-all duration-700",
      isScrolled ? "bg-netflix-black shadow-2xl" : "bg-gradient-to-b from-black/80 to-transparent"
    )}>
      <div className="flex items-center space-x-2 md:space-x-6">
        <h1
          onClick={() => window.location.href = '/'}
          className="text-netflix-red text-xl md:text-2xl font-extrabold tracking-tighter cursor-pointer hover:scale-105 transition-transform"
        >
          SAGE
        </h1>

        <div className="hidden lg:flex items-center space-x-4">
          <a href="/" className="text-xs font-bold text-white hover:text-gray-300 transition-colors">Home</a>
          <a href="/#tv" className="text-xs font-medium text-gray-200 hover:text-white transition-colors">TV Shows</a>
          <a href="/#movies" className="text-xs font-medium text-gray-200 hover:text-white transition-colors">Movies</a>
          <a href="/#action" className="text-xs font-medium text-gray-200 hover:text-white transition-colors">Action</a>
          <a href="/#anime" className="text-xs font-medium text-gray-200 hover:text-white transition-colors">Anime</a>
          <a href="#" className="text-xs font-medium text-gray-200 hover:text-white transition-colors">New & Popular</a>

          <div className="relative group ml-2">
            <button className="flex items-center text-xs font-medium text-gray-200 hover:text-white transition-colors">
              Browse Genres <ChevronDown className="w-3 h-3 ml-1 group-hover:rotate-180 transition-transform duration-300" />
            </button>
            <div className="absolute top-full left-0 mt-2 w-48 bg-netflix-black border border-gray-800 rounded shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 py-2">
              <div className="grid grid-cols-1 gap-1">
                {Object.entries(genres).map(([id, name]) => (
                  <a
                    key={id}
                    href={`/genre/${id}`}
                    className="text-left px-4 py-2 text-xs text-gray-300 hover:bg-gray-800 hover:text-white transition-colors block"
                  >
                    {name}
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Browse Trigger */}
        <div className="lg:hidden relative group">
          <button className="flex items-center text-xs font-bold text-white">
            Browse <ChevronDown className="w-3 h-3 ml-1" />
          </button>
        </div>
      </div>

      <div className="flex items-center space-x-2 md:space-x-4">
        <button
          onClick={onSearchClick}
          className="text-white hover:scale-110 transition-transform p-1"
        >
          <Search className="w-4 h-4 md:w-5 md:h-5" />
        </button>

        <a href="#" className="hidden sm:block text-xs font-medium text-gray-200 hover:text-white transition-colors">Kids</a>

        <button className="hidden md:block text-white hover:scale-110 transition-transform p-1">
          <Gift className="w-4 h-4 md:w-5 md:h-5" />
        </button>

        <button className="relative text-white hover:scale-110 transition-transform p-1">
          <Bell className="w-4 h-4 md:w-5 md:h-5" />
          <span className="absolute top-0 right-0 w-2 h-2 bg-netflix-red rounded-full border-2 border-netflix-black"></span>
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
          <div className="absolute top-full right-0 mt-2 w-32 bg-netflix-black border border-gray-800 rounded shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 py-2">
            <button className="w-full text-left px-4 py-2 text-xs text-gray-300 hover:bg-gray-800 hover:text-white transition-colors">Manage Profiles</button>
            <button className="w-full text-left px-4 py-2 text-xs text-gray-300 hover:bg-gray-800 hover:text-white transition-colors border-t border-gray-800 mt-1">Sign Out</button>
          </div>
        </div>
      </div>
    </nav>
  );
}
