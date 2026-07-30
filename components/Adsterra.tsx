'use client';

import { useEffect, useRef } from 'react';
import { useAppContext } from '../lib/context/AppContext';

/**
 * Adsterra ad units for sagemovies.netlify.app (Adsterra site 5928166).
 *
 * Values come from the dashboard (Websites -> site -> GET CODE) and are per-unit:
 * each has its own pl* subdomain, path and container id. They cannot be derived or
 * guessed — re-copy from the dashboard if a unit is recreated.
 *
 *   Social Bar    unit 30369698 (SocialBar_1)
 *   Native Banner unit 30369699 (NativeBanner_1)
 *
 * The scripts are appended imperatively via document.createElement rather than as a
 * JSX <script> tag, because React 18 does not execute <script> elements it renders
 * on the client. `next/script` would also work; this way keeps the injection, the
 * cleanup and the double-mount guard visible in one place.
 *
 * Gated on NEXT_PUBLIC_ADSTERRA_ENABLED and user's app download status.
 */

const ENABLED = process.env.NEXT_PUBLIC_ADSTERRA_ENABLED === 'true';

// Adsterra "Direct Link" (a.k.a. smartlink) — a plain URL that renders an ad/offer when
// opened. Copy it from the dashboard (same as the other units, it can't be guessed) and
// set it in the BUILD env; NEXT_PUBLIC_* is inlined at build time. Left empty it stays
// inert, so nothing opens until a real link is pasted in.
const DIRECT_LINK = process.env.NEXT_PUBLIC_ADSTERRA_DIRECT_LINK ?? '';

/**
 * Helper to check if user has downloaded the Android app.
 * When downloaded, all ads on the site are disabled.
 */
function isAppDownloaded(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem('sagemovies_app_downloaded') === 'true';
}

/**
 * Opens the Adsterra Direct Link in a new tab. MUST be called synchronously inside a
 * real user gesture (a click handler) or the browser's popup blocker will swallow it.
 * No-op (returns false) when ads are disabled, app is downloaded, or no link is configured.
 */
export function openAdsterraDirectLink(): boolean {
  if (!ENABLED || !DIRECT_LINK || isAppDownloaded()) return false;
  try {
    window.open(DIRECT_LINK, '_blank', 'noopener,noreferrer');
    return true;
  } catch {
    return false;
  }
}

const SOCIAL_BAR_SRC =
  'https://pl30470197.effectivecpmnetwork.com/e3/96/62/e396627c978253460574b0e8b00bb87a.js';

const NATIVE_BANNER_SRC =
  'https://pl30470198.effectivecpmnetwork.com/7abdf4c8f0cb2b40ae9d9f5fece86bd7/invoke.js';
const NATIVE_BANNER_CONTAINER_ID = 'container-7abdf4c8f0cb2b40ae9d9f5fece86bd7';

const GLOBAL_LAYOUT_AD_SRC =
  'https://regaincocoa.com/0b/05/3c/0b053ca6d8fa77c3cd61797ebae4b7bb.js';

/** Append a vendor script once, and remove it on unmount. */
function useAdScript(src: string, enabled: boolean, parent?: React.RefObject<HTMLElement | null>) {
  useEffect(() => {
    if (!enabled) return;
    // Guard against double-injection under React strict mode / remounts.
    if (document.querySelector(`script[src="${src}"]`)) return;

    const el = document.createElement('script');
    el.src = src;
    el.async = true;
    el.setAttribute('data-cfasync', 'false');
    (parent?.current ?? document.body).appendChild(el);

    return () => {
      el.remove();
    };
  }, [src, enabled, parent]);
}

export function AdsterraSocialBar() {
  const { hasDownloadedApp } = useAppContext();
  const active = ENABLED && !hasDownloadedApp && !isAppDownloaded();

  useAdScript(SOCIAL_BAR_SRC, active);
  return null;
}

export function AdsterraGlobalScript() {
  const { hasDownloadedApp } = useAppContext();
  const active = ENABLED && !hasDownloadedApp && !isAppDownloaded();

  useAdScript(GLOBAL_LAYOUT_AD_SRC, active);
  return null;
}

/**
 * Only ONE instance may be mounted at a time: the container id is fixed by Adsterra
 * and invoke.js resolves it by id, so two live instances would collide. Rendering it
 * on separate routes is fine.
 */
export function AdsterraNativeBanner({ className = 'px-4 md:px-12 my-6' }: { className?: string }) {
  const { hasDownloadedApp } = useAppContext();
  const active = ENABLED && !hasDownloadedApp && !isAppDownloaded();
  const hostRef = useRef<HTMLDivElement>(null);

  useAdScript(NATIVE_BANNER_SRC, active, hostRef);

  if (!active) return null;

  return (
    <div ref={hostRef} className={className}>
      <div id={NATIVE_BANNER_CONTAINER_ID} />
    </div>
  );
}
