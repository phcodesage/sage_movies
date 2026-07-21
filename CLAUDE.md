# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Stack

Next.js 16 (App Router) + React 18, TypeScript, Tailwind CSS, Framer Motion. Package manager: **npm**. A TMDB-backed Netflix-style streaming UI; no database, auth, or server-side state — `app/api/*` routes are thin proxies to the TMDB API.

## Commands

- `npm run dev` — dev server (port 3000)
- `npm run build` / `npm start` — production build / serve
- `npm run lint` — ESLint (flat config, `eslint-config-next/core-web-vitals`)
- `npm run format` — Prettier (config in `.prettierrc.json`); a PostToolUse hook also auto-formats edited files
- `npm test` — Vitest (jsdom, globals on); `npm run test:watch` for watch mode
  - Single file: `npx vitest run lib/recommendations.test.ts`
  - Single case: `npx vitest run -t "name of the test"`
- `npm run clean` — removes `.next` and `dist/`

## Env

Required at runtime (see `.env.example`): `TMDB_API_KEY` — a TMDB v3 key. Without it every `app/api/*` route returns 500 and the UI renders empty rows.

`TMDB_BASE_URL` / `TMDB_IMG_URL` are declared in `.env.example` but **nothing reads them** — routes hardcode `https://api.themoviedb.org/3` and components hardcode `https://image.tmdb.org/t/p/original` (and `/w500` for thumbnails). Changing an env value alone will not move the endpoints.

`.env` is gitignored; `.env.production` is committed but holds no secret (API key is commented out and supplied by the deployment env).

## Architecture

**Everything is client-rendered.** `app/page.tsx`, `app/genre/[id]/page.tsx`, and `app/movie/[id]/[slug]/page.tsx` are all `'use client'`; they `fetch()` the local `/api/*` proxies from the browser. The only server-side code is the API routes. There is no server data layer to extend — new data means a new proxy route plus a client fetch.

**Data flow:** browser → `/api/*` (route reads `TMDB_API_KEY`, calls TMDB, normalizes/dedupes/sorts) → component state. Routes often fetch several TMDB pages in parallel, tag items with `media_type`, dedupe by `id` through `new Map(...)`, and sort by `popularity`.

**State lives in three places, all client-side:**

- `lib/context/AppContext.tsx` — genre id→name map, fetched once at layout mount from `/api/genres`. Consume via `useAppContext()`; the provider wraps everything in `app/layout.tsx`.
- `lib/hooks/useWatchHistory.ts` — last 20 watched titles in `localStorage` under `sage_movies_watch_history`.
- `lib/utils/requestCache.ts` — module-level Map with a ~5s TTL used by `useSearch` to dedupe in-flight/repeat client fetches. Route through `getCachedRequest`/`setCachedRequest` rather than adding parallel fetch logic.

**Recommendations** (`lib/recommendations.ts`) are computed purely on the client from watch history against the pool of items already fetched into `app/page.tsx` state (`allFetchedData`) — no TMDB "similar" endpoint is involved. Scoring is a weighted sum (genre overlap, studio match, genre frequency, media type, rating); this is the one module with unit tests.

**Routing:** detail URLs are `/movie/{tmdbId}/{mediaType}-{slug}`, e.g. `/movie/550/movie-fight-club`. The page infers movie vs. TV from whether the slug segment contains `tv` — keep that prefix when constructing links.

## Conventions

- Path alias `@/*` → repo root is configured (tsconfig + vitest), but app code consistently uses **relative imports** (`../../lib/utils`). Match the surrounding file.
- **API routes are `.js`, not `.ts`** (under `app/api/`), even though components/lib are TypeScript.
- API proxy routes set ISR caching via `export const revalidate` (1800s collections, 300s search, 86400s genres) plus matching `Cache-Control`/`CDN-Cache-Control` headers. Follow `app/api/movies/collection/route.js`. See `/add-api-route`.
- In Next 16, `params` is a Promise — `await params` in dynamic route handlers (see `app/api/video-sources/[type]/[id]/route.js`).
- Heavy modals (`SearchModal`, `MovieDetailModal`, `SeeAllModal`) are `next/dynamic` with `ssr: false` and a placeholder `loading` shell — keep new modals on that pattern.
- Tailwind theme extends a `netflix` palette (`netflix-black`, `netflix-red`, `netflix-dark`, `netflix-gray`); use those tokens over raw hex.

## Gotchas

- **Video embeds break often.** Sources live in the `switch(server)` in `app/api/video-sources/[type]/[id]/route.js`; the default fallback is `player.videasy.net`. When a provider 522s or shows a frame-option error, swap/add a case there rather than touching the player UI. The `<select>` of server options in `app/movie/[id]/[slug]/page.tsx` (~line 410) is a hardcoded duplicate of that list — update both. See `/fix-video-source`.
- **Ads:** the network is **Adsterra** (PopAds was removed in favour of it — don't reintroduce a second popunder network, vendors forbid running two on one page). Units live in `components/Adsterra.tsx`: `AdsterraSocialBar` (script only, mounted in `app/layout.tsx`) and `AdsterraNativeBanner` (script **plus** a container `<div>` whose id must match Adsterra's exactly or it silently renders nothing; slotted between rows in `app/page.tsx`). Both are gated on `NEXT_PUBLIC_ADSTERRA_ENABLED` and are inert until the per-unit codes are pasted in — those cannot be generated, each unit gets its own subdomain/path/id from the dashboard. `NEXT_PUBLIC_*` is inlined at **build** time, so the flag must be set in the Netlify build env. Keep `public/ads.txt` in sync; its Adsterra line is still a placeholder.
- The player iframe is sandboxed (`PLAYER_SANDBOX` in the movie page) to withhold `allow-popups`/`allow-top-navigation`, which blocks the providers' popunders. Ads _painted inside_ the player are cross-origin and cannot be removed — don't accept tasks premised on stripping them.
- **Every remaining provider detects the sandbox and refuses to play** (verified in-browser — Videasy says "Iframe Sandbox Detected", 2Embed "Sandbox Detected", SuperEmbed "Sandboxing is not allowed!"). `sandboxTolerant` is therefore `false` across the board, so no embed is currently sandboxed and provider popunders do fire. Re-test in a real browser before flipping one to `true`.
- **The server list is a measured result, not a preference.** `DEFAULT_SERVER` and the ordering in `lib/videoServers.ts` come from loading every provider against the 5 newest now-playing releases and scoring actual playback (2026-07-22: Videasy/2Embed/SuperEmbed 5/5, Vidsrc.me 4/5; dropped vidsrc.su 0/5, vidsrc.to 0/5 behind a gambling ad wall, VidCore 1/5, VidLink 2/5). SuperEmbed is deliberately _not_ the default despite scoring 5/5 — it served an adult "video chat" interstitial. Re-run the bake-off before reordering; availability shifts constantly. `getServer()` falls back to the default for unknown ids, so removing a provider can't break saved state.
- The iframe is keyed on `` `${embedUrl}|${blockProviderPopups}` `` on purpose: changing `sandbox` on a live iframe has no effect until the element remounts, so without the key the "Block provider popups" toggle silently does nothing mid-playback.
- `sw.js` at the repo root is a third-party ad-network service worker (Monetag, domain `3nbf4.com`) that is **never registered** anywhere — dead code, and a different network from Adsterra. Excluded from ESLint and Prettier. Don't refactor it.
- **Use `overflow-x: clip`, never `overflow-x: hidden`, on `body` or the page wrapper.** `hidden` makes the element a scroll container, which silently kills every programmatic scroll on the page — `window.scrollTo()` and `scrollIntoView()` both do nothing while wheel scrolling still works, so it looks like your click handler is broken. Section jumps go through `lib/utils/scrollToSection.ts`, which also re-asserts the target a few times because lazy-loading posters resize the document mid-animation and Chrome cancels the scroll.
- **A `motion.div` inside `AnimatePresence` needs a `key`.** The full-page loader in `app/page.tsx` lacked one, so its exit animation never completed and it stayed mounted at `opacity: 0` — an invisible full-screen `z-[100]` overlay that swallowed every click on the site, navbar included. It also carries `pointer-events-none` as a guard. If UI stops responding to clicks, check `document.elementFromPoint()` before debugging the handler.
- `old_assets/` and `dist/` are stale/build output, excluded from lint and tests. `README.md` is empty; `OPTIMIZATION_TASKS.md` is a scratch TODO list, not a spec.
- Git workflow: committing directly to `main` is fine for this repo. Only commit/push when asked.
