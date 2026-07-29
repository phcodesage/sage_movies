'use client';

import React from 'react';

interface AdsterraBannerProps {
  className?: string;
}

export default function AdsterraBanner({ className = '' }: AdsterraBannerProps) {
  const iframeHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { background: transparent; color: #fff; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; display: flex; flex-direction: column; justify-content: center; align-items: center; min-height: 130px; text-align: center; overflow: hidden; padding: 8px; }
          .promo-title { font-size: 13px; font-weight: 800; color: #ffffff; margin-bottom: 4px; }
          .promo-desc { font-size: 11px; color: #a1a1aa; line-height: 1.4; }
        </style>
      </head>
      <body>
        <div id="container-7abdf4c8f0cb2b40ae9d9f5fece86bd7">
          <div class="promo-title">SageMovies Premium HD Streaming</div>
          <div class="promo-desc">Enjoy zero-lag 1080p playback, offline downloads, and active server failover across all your devices.</div>
        </div>
        <script async="async" data-cfasync="false" src="https://pl30470198.effectivecpmnetwork.com/7abdf4c8f0cb2b40ae9d9f5fece86bd7/invoke.js"></script>
      </body>
    </html>
  `;

  return (
    <div className={`w-full overflow-hidden rounded-xl bg-zinc-900 border border-zinc-800 p-2 shadow-lg ${className}`}>
      <div className="flex items-center justify-between mb-1.5 px-1">
        <span className="text-[9px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded-full bg-netflix-red text-white shadow-sm">
          SPONSORED AD
        </span>
      </div>
      <div className="w-full flex items-center justify-center min-h-[130px]">
        <iframe
          srcDoc={iframeHtml}
          title="Sponsored Ad"
          className="w-full h-[140px] border-0 rounded-lg overflow-hidden bg-transparent"
          sandbox="allow-scripts allow-same-origin allow-popups allow-forms allow-popups-to-escape-sandbox"
        />
      </div>
    </div>
  );
}
