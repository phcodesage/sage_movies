'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

interface InstallPrompt extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const PWAContext = createContext({
  canInstall: false,
  installed: false,
  isIOS: false,
  isAndroid: false,
  install: async () => {},
});

export const usePWA = () => useContext(PWAContext);

export default function PWAProvider({ children }: { children: ReactNode }) {
  const [prompt, setPrompt] = useState<InstallPrompt | null>(null);
  const [installed, setInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [offline, setOffline] = useState(false);
  const [waiting, setWaiting] = useState<ServiceWorker | null>(null);

  useEffect(() => {
    const displayMode = window.matchMedia('(display-mode: standalone)');
    const syncInstalled = () =>
      setInstalled(
        displayMode.matches ||
          Boolean((navigator as Navigator & { standalone?: boolean }).standalone)
      );
    const syncOnline = () => setOffline(!navigator.onLine);
    const beforeInstall = (event: Event) => {
      event.preventDefault();
      setPrompt(event as InstallPrompt);
    };
    const didInstall = () => {
      setInstalled(true);
      setPrompt(null);
    };
    const syncCapabilities = () => {
      syncInstalled();
      syncOnline();
      setIsIOS(
        /iPad|iPhone|iPod/.test(navigator.userAgent) ||
          (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
      );
      setIsAndroid(/Android/i.test(navigator.userAgent));
    };
    // Browser capabilities are external state and are unavailable during SSR.
    syncCapabilities();
    displayMode.addEventListener('change', syncInstalled);
    window.addEventListener('online', syncOnline);
    window.addEventListener('offline', syncOnline);
    window.addEventListener('beforeinstallprompt', beforeInstall);
    window.addEventListener('appinstalled', didInstall);

    let disposed = false;
    const register = async () => {
      if (process.env.NODE_ENV !== 'production' || !('serviceWorker' in navigator)) return;
      try {
        const registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/',
          updateViaCache: 'none',
        });
        if (disposed) return;
        if (registration.waiting) setWaiting(registration.waiting);
        registration.addEventListener('updatefound', () => {
          const worker = registration.installing;
          worker?.addEventListener('statechange', () => {
            if (!disposed && worker.state === 'installed' && navigator.serviceWorker.controller) {
              setWaiting(registration.waiting);
            }
          });
        });
      } catch (error) {
        console.warn('Offline support could not be started', error);
      }
    };
    if (document.readyState === 'complete') void register();
    else window.addEventListener('load', register, { once: true });

    return () => {
      disposed = true;
      displayMode.removeEventListener('change', syncInstalled);
      window.removeEventListener('online', syncOnline);
      window.removeEventListener('offline', syncOnline);
      window.removeEventListener('beforeinstallprompt', beforeInstall);
      window.removeEventListener('appinstalled', didInstall);
      window.removeEventListener('load', register);
    };
  }, []);

  const install = async () => {
    if (!prompt) return;
    try {
      await prompt.prompt();
      await prompt.userChoice;
    } finally {
      setPrompt(null);
    }
  };

  const update = () => {
    navigator.serviceWorker.addEventListener('controllerchange', () => window.location.reload(), {
      once: true,
    });
    waiting?.postMessage({ type: 'SKIP_WAITING' });
  };

  return (
    <PWAContext.Provider
      value={{ canInstall: Boolean(prompt), installed, isIOS, isAndroid, install }}
    >
      {children}
      {(offline || waiting) && (
        <div
          role="status"
          className="fixed inset-x-4 bottom-24 z-[110] mx-auto max-w-md rounded-xl border border-zinc-700 bg-zinc-950 p-4 text-sm shadow-xl"
        >
          {offline ? (
            'You’re offline. Reconnect to browse and play videos.'
          ) : (
            <div className="flex items-center justify-between gap-4">
              <span>An app update is ready.</span>
              <button
                onClick={update}
                className="rounded bg-yellow-400 px-3 py-2 font-bold text-black"
              >
                Reload
              </button>
            </div>
          )}
        </div>
      )}
    </PWAContext.Provider>
  );
}
