'use client';

import React, { useEffect, useRef } from 'react';

interface AdsterraBannerProps {
  adKey?: string;
  format?: '300x250' | '468x60' | '728x90';
  className?: string;
}

export default function AdsterraBanner({
  adKey = process.env.NEXT_PUBLIC_ADSTERRA_KEY || '',
  format = '300x250',
  className = '',
}: AdsterraBannerProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!adKey || !containerRef.current) return;

    // Clear previous ad content if any
    containerRef.current.innerHTML = '';

    const width = format === '300x250' ? 300 : format === '468x60' ? 468 : 728;
    const height = format === '300x250' ? 250 : format === '468x60' ? 60 : 90;

    const confScript = document.createElement('script');
    confScript.type = 'text/javascript';
    confScript.text = `
      atOptions = {
        'key' : '${adKey}',
        'format' : 'iframe',
        'height' : ${height},
        'width' : ${width},
        'params' : {}
      };
    `;

    const invokeScript = document.createElement('script');
    invokeScript.type = 'text/javascript';
    invokeScript.src = `//www.topcreativeformat.com/${adKey}/invoke.js`;

    containerRef.current.appendChild(confScript);
    containerRef.current.appendChild(invokeScript);
  }, [adKey, format]);

  if (!adKey) {
    return (
      <div className={`p-4 rounded-xl bg-gradient-to-br from-netflix-red/20 via-black/60 to-purple-900/20 border border-netflix-red/30 text-left ${className}`}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded bg-netflix-red/30 text-netflix-red border border-netflix-red/40">
            FEATURED SPONSOR
          </span>
        </div>
        <h4 className="text-sm font-bold text-white mb-1">
          SageMovies Ultra Fast Streaming
        </h4>
        <p className="text-xs text-gray-300 leading-relaxed">
          Enjoy zero-lag 1080p playback, offline downloads, and active server failover across all your devices.
        </p>
      </div>
    );
  }

  return (
    <div className={`flex items-center justify-center my-2 ${className}`}>
      <div ref={containerRef} className="overflow-hidden rounded-xl border border-white/10" />
    </div>
  );
}
