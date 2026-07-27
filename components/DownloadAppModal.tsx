'use client';

import React from 'react';
import { Smartphone, Download, X, CheckCircle2, ShieldCheck, Zap } from 'lucide-react';

interface DownloadAppModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function DownloadAppModal({ isOpen, onClose }: DownloadAppModalProps) {
  if (!isOpen) return null;

  const downloadUrl =
    process.env.NEXT_PUBLIC_ANDROID_APK_URL ||
    'https://shrinkme.click/wRTWJwKz';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md transition-all animate-fadeIn">
      <div className="relative w-full max-w-md bg-[#141419] border border-white/10 rounded-2xl shadow-2xl overflow-hidden p-6 text-white">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-full text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Icon */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-netflix-red/20 border border-netflix-red/40 flex items-center justify-center text-netflix-red shrink-0 shadow-lg">
            <Smartphone className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-extrabold text-white tracking-tight">
              Get SageMovies for Android
            </h3>
            <p className="text-xs text-gray-400">Official Native Release Build • Version 1.0.0</p>
          </div>
        </div>

        {/* App Features List */}
        <div className="space-y-2.5 my-5 bg-black/40 border border-white/5 rounded-xl p-3.5 text-xs text-gray-300">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>13 Studio Brand Hubs (Netflix, Disney+, Marvel, etc.)</span>
          </div>
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Automated Active Server Pre-Checks & Auto Fallback</span>
          </div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-blue-400 shrink-0" />
            <span>Zero Ads • Fast 60fps Native Streaming</span>
          </div>
        </div>

        {/* Download Action Button */}
        <a
          href={downloadUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={onClose}
          className="flex items-center justify-center gap-2 w-full py-3 px-4 bg-netflix-red hover:bg-red-700 active:scale-98 text-white font-extrabold text-sm rounded-xl transition-all shadow-xl shadow-netflix-red/20 group"
        >
          <Download className="w-4 h-4 group-hover:translate-y-0.5 transition-transform" />
          <span>Download Android APK</span>
        </a>

        <p className="text-[10px] text-center text-gray-500 mt-3">
          Compatible with Android 7.0+ (ARM64 / x86_64)
        </p>
      </div>
    </div>
  );
}
