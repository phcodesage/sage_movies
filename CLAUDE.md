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
- **Ads:** the site's own tag is PopAds (site ID 5194452), inlined in `components/PopAds.tsx` and rendered as a plain `<script>` inside `<head>` from `app/layout.tsx`, gated on `NEXT_PUBLIC_POPADS_ENABLED=true`. Three constraints, all deliberate: it is **not** `next/script` (that injects client-side, leaving the tag absent from served HTML so PopAds' Troubleshooter reports it missing); it is **inline, not** `public/popads.js` (that filename is on EasyList and gets adblocked); and `data-cfasync="false"` must survive (Cloudflare Rocket Loader breaks the tag otherwise). The blob is vendor-generated — re-copy it from the dashboard rather than editing it. Keep `public/ads.txt` in sync with whatever networks are live; the PopAds line there is still a placeholder.
- The player iframe is sandboxed (`PLAYER_SANDBOX` in the movie page) to withhold `allow-popups`/`allow-top-navigation`, which blocks the providers' popunders. Ads _painted inside_ the player are cross-origin and cannot be removed — don't accept tasks premised on stripping them.
- **Most providers detect the sandbox and refuse to play** (verified in-browser 2026-07-21 — VidLink says "Please Disable Sandbox", Videasy "Iframe Sandbox Detected", etc.). Only VidCore tolerates it, which is why it is `DEFAULT_SERVER`. Tolerance is tracked per provider as `sandboxTolerant` in `lib/videoServers.ts`; re-test in a real browser before flipping one to `true`.
- The iframe is keyed on `` `${embedUrl}|${blockProviderPopups}` `` on purpose: changing `sandbox` on a live iframe has no effect until the element remounts, so without the key the "Block provider popups" toggle silently does nothing mid-playback.
- `sw.js` at the repo root is a third-party ad-network service worker (Monetag, domain `3nbf4.com`) that is **never registered** anywhere — dead code, and a different network from PopAds. Excluded from ESLint and Prettier. Don't refactor it.
- `old_assets/` and `dist/` are stale/build output, excluded from lint and tests. `README.md` is empty; `OPTIMIZATION_TASKS.md` is a scratch TODO list, not a spec.
- Git workflow: committing directly to `main` is fine for this repo. Only commit/push when asked.
