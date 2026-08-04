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
        window.location.reload();
      }
    } catch {
      // Still under maintenance
    } finally {
      setIsChecking(false);
      setLastChecked(new Date().toLocaleTimeString());
      setAutoCheckCountdown(30);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col justify-between items-center px-4 py-10 selection:bg-red-500 selection:text-white">
      {/* Background Glow */}
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-red-950/30 via-zinc-950 to-zinc-950 pointer-events-none" />

      {/* Header Bar */}
      <header className="relative z-10 w-full max-w-5xl flex items-center justify-between py-4 border-b border-zinc-800/80">
        <div className="flex items-center space-x-3.5">
          <div className="w-10 h-10 rounded-xl bg-netflix-red flex items-center justify-center font-black text-white text-xl shadow-lg shadow-red-900/50">
            S
          </div>
          <span className="text-2xl font-black tracking-tight text-white">
            Sage<span className="text-netflix-red">Movies</span>
          </span>
        </div>

        <div className="flex items-center space-x-2.5 bg-amber-500/15 border border-amber-500/30 px-4 py-2 rounded-full">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500" />
          </span>
          <span className="text-xs sm:text-sm font-extrabold text-amber-400 uppercase tracking-wider">
            Scheduled Maintenance
          </span>
        </div>
      </header>

      {/* Material Design 3 Solid Card */}
      <main className="relative z-10 w-full max-w-3xl my-auto py-10">
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 sm:p-12 shadow-2xl space-y-10">
          
          {/* Header Icon & Typography */}
          <div className="text-center space-y-5">
            <div className="mx-auto w-20 h-20 rounded-2xl bg-zinc-800/90 border border-zinc-700/70 flex items-center justify-center text-netflix-red shadow-lg">
              <Wrench className="w-10 h-10 animate-pulse" />
            </div>
            
            <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight leading-tight">
              We&apos;re Upgrading Our Streaming Nodes
            </h1>

            <p className="text-base sm:text-lg text-zinc-300 font-medium leading-relaxed max-w-xl mx-auto">
              SageMovies servers are currently undergoing scheduled maintenance to upgrade streaming speed and load capacity. Web streaming will return shortly.
            </p>
          </div>

          {/* Infrastructure Status Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-zinc-950/90 border border-zinc-800/90 rounded-2xl p-4 flex items-center justify-between shadow-sm">
              <div className="flex items-center space-x-3">
                <Server className="w-5 h-5 text-amber-400" />
                <span className="text-sm font-bold text-zinc-200">Web Player</span>
              </div>
              <span className="text-xs font-extrabold px-3 py-1 rounded-full bg-amber-500/20 text-amber-400 uppercase tracking-wide">
                Upgrading
              </span>
            </div>

            <div className="bg-zinc-950/90 border border-zinc-800/90 rounded-2xl p-4 flex items-center justify-between shadow-sm">
              <div className="flex items-center space-x-3">
                <Radio className="w-5 h-5 text-emerald-400" />
                <span className="text-sm font-bold text-zinc-200">CDN Nodes</span>
              </div>
              <span className="text-xs font-extrabold px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 uppercase tracking-wide">
                Online
              </span>
            </div>

            <div className="bg-zinc-950/90 border border-zinc-800/90 rounded-2xl p-4 flex items-center justify-between shadow-sm">
              <div className="flex items-center space-x-3">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <span className="text-sm font-bold text-zinc-200">Android App</span>
              </div>
              <span className="text-xs font-extrabold px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 uppercase tracking-wide">
                Active
              </span>
            </div>
          </div>

          {/* Action Cards */}
          <div className="space-y-4">
            {/* Mobile App CTA Card */}
            <div className="bg-gradient-to-r from-red-950/40 via-zinc-900 to-zinc-900 border border-netflix-red/40 rounded-2xl p-5 sm:p-6 flex flex-col sm:flex-row items-center justify-between gap-5 shadow-lg">
              <div className="flex items-center space-x-4 text-left">
                <div className="w-12 h-12 rounded-xl bg-netflix-red/20 border border-netflix-red/50 flex items-center justify-center shrink-0">
                  <Download className="w-6 h-6 text-netflix-red" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base sm:text-lg font-bold text-white">Watch via SageMovies Mobile App</h3>
                  <p className="text-xs sm:text-sm text-zinc-300 leading-normal">
                    The Android app streams directly and is unaffected by web maintenance.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsDownloadModalOpen(true)}
                className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-netflix-red hover:bg-red-700 text-white text-sm font-extrabold transition-all shadow-xl shadow-red-950/50 hover:scale-[1.02] flex items-center justify-center space-x-2.5 shrink-0"
              >
                <span>Download App</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* Check Status Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs sm:text-sm text-zinc-300 bg-zinc-950/80 border border-zinc-800 rounded-2xl p-4">
              <div className="flex items-center space-x-2.5">
                <RefreshCw className={`w-4 h-4 text-zinc-400 ${isChecking ? 'animate-spin' : ''}`} />
                <span>Auto-refreshing in <strong className="text-white font-bold">{autoCheckCountdown}s</strong></span>
                {lastChecked && (
                  <span className="text-zinc-500 hidden sm:inline">• Checked at {lastChecked}</span>
                )}
              </div>

              <button
                onClick={handleCheckStatus}
                disabled={isChecking}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-100 text-xs sm:text-sm font-bold transition-all disabled:opacity-50"
              >
                {isChecking ? 'Checking System...' : 'Refresh Status'}
              </button>
            </div>
          </div>

        </div>
      </main>

      {/* Footer Info */}
      <footer className="relative z-10 w-full max-w-5xl py-4 text-center text-xs sm:text-sm text-zinc-500 border-t border-zinc-800/80">
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
