'use client';

import { useEffect, useRef } from 'react';

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
 * Gated on NEXT_PUBLIC_ADSTERRA_ENABLED. NOTE: NEXT_PUBLIC_* is inlined at BUILD
 * time, so the flag must be set in the build environment (it lives in
 * .env.production for deploys); setting it after a build has no effect.
 */

const ENABLED = process.env.NEXT_PUBLIC_ADSTERRA_ENABLED === 'true';

const SOCIAL_BAR_SRC =
  'https://pl30470197.effectivecpmnetwork.com/e3/96/62/e396627c978253460574b0e8b00bb87a.js';

const NATIVE_BANNER_SRC =
  'https://pl30470198.effectivecpmnetwork.com/7abdf4c8f0cb2b40ae9d9f5fece86bd7/invoke.js';
// Must match Adsterra's id exactly: invoke.js resolves the container by id and, if it
// is missing, renders nothing and logs nothing.
const NATIVE_BANNER_CONTAINER_ID = 'container-7abdf4c8f0cb2b40ae9d9f5fece86bd7';

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
  useAdScript(SOCIAL_BAR_SRC, ENABLED);
  return null;
}

export function AdsterraNativeBanner({ className = '' }: { className?: string }) {
  const hostRef = useRef<HTMLDivElement>(null);
  // Mount the script inside the host so it sits next to the container div, matching
  // the markup Adsterra ships.
  useAdScript(NATIVE_BANNER_SRC, ENABLED, hostRef);

  if (!ENABLED) return null;

  return (
    <div ref={hostRef} className={`px-4 md:px-12 my-6 ${className}`}>
      <div id={NATIVE_BANNER_CONTAINER_ID} />
    </div>
  );
}
