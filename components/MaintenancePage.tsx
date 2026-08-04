'use client';

import React, { useState, useEffect } from 'react';
import { Wrench, RefreshCw, Download, ShieldCheck, Server, Radio, ArrowRight } from 'lucide-react';
import DownloadAppModal from './DownloadAppModal';

export default function MaintenancePage() {
  const [isChecking, setIsChecking] = useState(false);
  const [lastChecked, setLastChecked] = useState<string | null>(null);
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);
  const [autoCheckCountdown, setAutoCheckCountdown] = useState(30);

  useEffect(() => {
    setLastChecked(new Date().toLocaleTimeString());
    const interval = setInterval(() => {
      setAutoCheckCountdown((prev) => {
        if (prev <= 1) {
          handleCheckStatus();
          return 30;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleCheckStatus = async () => {
    setIsChecking(true);
    try {
      const res = await fetch('/api/app-version', { cache: 'no-store' });
      if (res.ok) {
        // If server is back up, reload page
        window.location.reload();
      }
    } catch {
      // Server still under maintenance
    } finally {
      setIsChecking(false);
      setLastChecked(new Date().toLocaleTimeString());
      setAutoCheckCountdown(30);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col justify-between items-center px-4 py-8 selection:bg-red-500 selection:text-white">
      {/* Background Subtle Gradient */}
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-red-900/20 via-zinc-950 to-zinc-950 pointer-events-none" />

      {/* Header Bar */}
      <header className="relative z-10 w-full max-w-5xl flex items-center justify-between py-4 border-b border-zinc-800/80">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-netflix-red flex items-center justify-center font-black text-white text-lg shadow-lg shadow-red-900/40">
            S
          </div>
          <span className="text-xl font-bold tracking-tight text-white">
            Sage<span className="text-netflix-red">Movies</span>
          </span>
        </div>

        <div className="flex items-center space-x-2 bg-amber-500/10 border border-amber-500/30 px-3 py-1.5 rounded-full">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
          </span>
          <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider">
            Scheduled Maintenance
          </span>
        </div>
      </header>

      {/* Main Content Card */}
      <main className="relative z-10 w-full max-w-2xl my-auto py-8">
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 sm:p-10 shadow-2xl space-y-8">
          
          {/* Icon & Title */}
          <div className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 rounded-2xl bg-zinc-800/80 border border-zinc-700/60 flex items-center justify-center text-netflix-red shadow-inner">
              <Wrench className="w-8 h-8 animate-pulse" />
            </div>
            
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              We&apos;re Upgrading Our Streaming Nodes
            </h1>

            <p className="text-zinc-400 text-sm sm:text-base leading-relaxed max-w-lg mx-auto">
              SageMovies servers are currently undergoing scheduled maintenance to upgrade streaming speed and load capacity. Web streaming will return shortly.
            </p>
          </div>

          {/* Infrastructure Status Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <div className="bg-zinc-950/80 border border-zinc-800 rounded-xl p-3.5 flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <Server className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-medium text-zinc-300">Web Player</span>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 uppercase">
                Upgrading
              </span>
            </div>

            <div className="bg-zinc-950/80 border border-zinc-800 rounded-xl p-3.5 flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <Radio className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-medium text-zinc-300">CDN Nodes</span>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 uppercase">
                Online
              </span>
            </div>

            <div className="bg-zinc-950/80 border border-zinc-800 rounded-xl p-3.5 flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-medium text-zinc-300">Android App</span>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 uppercase">
                Active
              </span>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="space-y-3 pt-2">
            {/* Mobile App Download Card */}
            <div className="bg-gradient-to-r from-red-950/40 via-zinc-900 to-zinc-900 border border-netflix-red/30 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center space-x-3 text-left">
                <div className="w-10 h-10 rounded-lg bg-netflix-red/20 border border-netflix-red/40 flex items-center justify-center shrink-0">
                  <Download className="w-5 h-5 text-netflix-red" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Watch via SageMovies Mobile App</h3>
                  <p className="text-xs text-zinc-400">The Android app streams directly and is unaffected by web maintenance.</p>
                </div>
              </div>

              <button
                onClick={() => setIsDownloadModalOpen(true)}
                className="w-full sm:w-auto px-5 py-2.5 rounded-lg bg-netflix-red hover:bg-red-700 text-white text-xs font-bold transition-all shadow-lg shadow-red-900/30 flex items-center justify-center space-x-2 shrink-0"
              >
                <span>Download App</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Check Status Button */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-zinc-400 bg-zinc-950/60 border border-zinc-800/80 rounded-xl p-3.5">
              <div className="flex items-center space-x-2">
                <RefreshCw className={`w-3.5 h-3.5 text-zinc-400 ${isChecking ? 'animate-spin' : ''}`} />
                <span>Auto-refresh in <strong className="text-zinc-200">{autoCheckCountdown}s</strong></span>
                {lastChecked && (
                  <span className="text-zinc-500 hidden sm:inline">• Checked at {lastChecked}</span>
                )}
              </div>

              <button
                onClick={handleCheckStatus}
                disabled={isChecking}
                className="w-full sm:w-auto px-4 py-1.5 rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold transition-colors disabled:opacity-50"
              >
                {isChecking ? 'Checking System...' : 'Refresh Status'}
              </button>
            </div>
          </div>

        </div>
      </main>

      {/* Footer Info */}
      <footer className="relative z-10 w-full max-w-5xl py-4 text-center text-xs text-zinc-500 border-t border-zinc-800/80">
        <p>© {new Date().getFullYear()} SageMovies. Thank you for your patience while we improve our platform.</p>
      </footer>

      {/* APK Download Modal */}
      <DownloadAppModal
        isOpen={isDownloadModalOpen}
        onClose={() => setIsDownloadModalOpen(false)}
      />
    </div>
  );
}
