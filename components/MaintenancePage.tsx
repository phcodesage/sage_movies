'use client';

import React, { useState, useEffect } from 'react';
import { Wrench, RefreshCw, Download, ShieldCheck, Server, Radio, ArrowRight, AlertOctagon, Check } from 'lucide-react';
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
    <div className="min-h-screen bg-[#FFE600] text-black flex flex-col justify-between items-center px-4 py-8 font-sans selection:bg-black selection:text-[#FFE600]">
      
      {/* Header Bar - Neo Brutalism */}
      <header className="w-full max-w-5xl flex items-center justify-between py-4 border-b-4 border-black">
        <div className="flex items-center space-x-3">
          <div className="w-11 h-11 bg-black text-[#FFE600] border-3 border-black flex items-center justify-center font-black text-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            S
          </div>
          <span className="text-2xl font-black tracking-tighter uppercase text-black">
            Sage<span className="bg-black text-[#FFE600] px-1.5 py-0.5 ml-1">Movies</span>
          </span>
        </div>

        {/* Neo Brutalist Status Pill */}
        <div className="bg-black text-[#FFE600] font-black text-xs sm:text-sm uppercase tracking-wider px-4 py-2 border-3 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center space-x-2">
          <span className="w-3 h-3 bg-red-500 border-2 border-black inline-block animate-ping" />
          <span>MAINTENANCE MODE</span>
        </div>
      </header>

      {/* Main Neo-Brutalist Content Card */}
      <main className="w-full max-w-3xl my-auto py-8">
        <div className="bg-white border-4 border-black rounded-none p-6 sm:p-10 shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] space-y-8">
          
          {/* Header Badge & Title */}
          <div className="text-center space-y-5">
            <div className="inline-flex items-center justify-center bg-[#FF3366] text-white p-5 border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
              <Wrench className="w-10 h-10 stroke-[3]" />
            </div>

            <div className="space-y-3">
              <span className="inline-block bg-[#00E5FF] text-black font-black text-xs sm:text-sm uppercase tracking-widest px-3.5 py-1.5 border-3 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                SYSTEM UPGRADE IN PROGRESS
              </span>
              
              <h1 className="text-4xl sm:text-6xl font-black uppercase text-black tracking-tight leading-none pt-1">
                SERVERS UNDER MAINTENANCE
              </h1>
            </div>

            <p className="text-base sm:text-xl font-bold text-black max-w-xl mx-auto leading-snug bg-yellow-100 border-3 border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              We&apos;re currently upgrading our high-speed streaming infrastructure. Web streaming will be back online shortly!
            </p>
          </div>

          {/* Infrastructure Neo-Brutalist Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div className="bg-[#FFE600] border-4 border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <Server className="w-5 h-5 stroke-[3] text-black" />
                <span className="text-sm font-black uppercase tracking-wider text-black">Web Player</span>
              </div>
              <span className="text-xs font-black bg-black text-[#FFE600] px-2.5 py-1 border-2 border-black uppercase">
                UPGRADING
              </span>
            </div>

            <div className="bg-[#00FF66] border-4 border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <Radio className="w-5 h-5 stroke-[3] text-black" />
                <span className="text-sm font-black uppercase tracking-wider text-black">CDN Nodes</span>
              </div>
              <span className="text-xs font-black bg-black text-[#00FF66] px-2.5 py-1 border-2 border-black uppercase">
                ONLINE
              </span>
            </div>

            <div className="bg-[#00E5FF] border-4 border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <ShieldCheck className="w-5 h-5 stroke-[3] text-black" />
                <span className="text-sm font-black uppercase tracking-wider text-black">Android App</span>
              </div>
              <span className="text-xs font-black bg-black text-[#00E5FF] px-2.5 py-1 border-2 border-black uppercase">
                ACTIVE
              </span>
            </div>
          </div>

          {/* Action CTAs - Neo Brutalism */}
          <div className="space-y-4 pt-2">
            {/* Mobile App Card */}
            <div className="bg-[#FF3366] text-white border-4 border-black p-5 sm:p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex flex-col sm:flex-row items-center justify-between gap-5">
              <div className="flex items-center space-x-4 text-left">
                <div className="w-14 h-14 bg-black text-[#FFE600] border-3 border-black flex items-center justify-center shrink-0 shadow-[3px_3px_0px_0px_rgba(255,255,255,1)]">
                  <Download className="w-7 h-7 stroke-[3]" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-lg sm:text-xl font-black uppercase tracking-tight text-white">
                    WATCH VIA SAGEMOVIES ANDROID APP
                  </h3>
                  <p className="text-xs sm:text-sm font-bold text-yellow-200">
                    The Android APK streams directly & is unaffected by web maintenance.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsDownloadModalOpen(true)}
                className="w-full sm:w-auto px-7 py-4 bg-black hover:bg-yellow-400 hover:text-black text-[#FFE600] font-black text-sm uppercase tracking-wider border-3 border-black shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:translate-x-1 active:translate-y-1 active:shadow-none transition-all flex items-center justify-center space-x-2 shrink-0"
              >
                <span>DOWNLOAD APK</span>
                <ArrowRight className="w-5 h-5 stroke-[3]" />
              </button>
            </div>

            {/* Check Status Bar */}
            <div className="bg-white border-4 border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-col sm:flex-row items-center justify-between gap-4 font-mono text-xs sm:text-sm">
              <div className="flex items-center space-x-3 font-bold">
                <RefreshCw className={`w-5 h-5 text-black stroke-[3] ${isChecking ? 'animate-spin' : ''}`} />
                <span>AUTO-REFRESH IN <strong className="bg-black text-[#FFE600] px-2 py-0.5 font-black">{autoCheckCountdown}S</strong></span>
                {lastChecked && (
                  <span className="text-zinc-600 hidden sm:inline">• CHECKED: {lastChecked}</span>
                )}
              </div>

              <button
                onClick={handleCheckStatus}
                disabled={isChecking}
                className="w-full sm:w-auto px-6 py-2.5 bg-[#00E5FF] hover:bg-black hover:text-[#00E5FF] text-black font-black text-xs sm:text-sm uppercase tracking-wider border-3 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all disabled:opacity-50"
              >
                {isChecking ? 'CHECKING...' : 'REFRESH STATUS'}
              </button>
            </div>
          </div>

        </div>
      </main>

      {/* Footer Info */}
      <footer className="w-full max-w-5xl py-4 text-center text-xs font-black uppercase tracking-wider text-black border-t-4 border-black">
        <p>© {new Date().getFullYear()} SAGEMOVIES • NEO-BRUTALIST MAINTENANCE MODE</p>
      </footer>

      {/* APK Download Modal */}
      <DownloadAppModal
        isOpen={isDownloadModalOpen}
        onClose={() => setIsDownloadModalOpen(false)}
      />
    </div>
  );
}
