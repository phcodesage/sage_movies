'use client';

import React, { useEffect, useRef } from 'react';

interface AdsterraBannerProps {
  className?: string;
}

export default function AdsterraBanner({ className = '' }: AdsterraBannerProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Clear previous ad content if any
    containerRef.current.innerHTML = '';

    // Create container div required by Adsterra Native Banner
    const adContainer = document.createElement('div');
    adContainer.id = 'container-7abdf4c8f0cb2b40ae9d9f5fece86bd7';

    // Create Adsterra invoke script
    const invokeScript = document.createElement('script');
    invokeScript.async = true;
    invokeScript.setAttribute('data-cfasync', 'false');
    invokeScript.src =
      'https://pl30470198.effectivecpmnetwork.com/7abdf4c8f0cb2b40ae9d9f5fece86bd7/invoke.js';

    containerRef.current.appendChild(adContainer);
    containerRef.current.appendChild(invokeScript);
  }, []);

  return (
    <div className={`w-full overflow-hidden rounded-xl bg-black/40 border border-white/10 p-2 ${className}`}>
      <div className="flex items-center justify-between mb-1.5 px-1">
        <span className="text-[9px] uppercase tracking-wider font-extrabold px-1.5 py-0.5 rounded bg-netflix-red/20 text-netflix-red border border-netflix-red/30">
          SPONSORED AD
        </span>
      </div>
      <div
        ref={containerRef}
        className="w-full flex items-center justify-center min-h-[100px] overflow-hidden"
      />
    </div>
  );
}
