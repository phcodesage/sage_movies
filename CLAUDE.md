# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Stack

Next.js 16 (App Router) + React 18, TypeScript, Tailwind CSS, Framer Motion. Package manager: **npm**. A TMDB-backed Netflix-style streaming UI; no database, auth, or server-side state — `app/api/*` routes are thin proxies to the TMDB API.

## Commands

- `npm run dev` — dev server
- `npm run build` / `npm start` — production build / serve
- `npm run lint` — ESLint (flat config, `eslint-config-next/core-web-vitals`)
- `npm run format` — Prettier (config in `.prettierrc.json`); a PostToolUse hook also auto-formats edited files
- `npm run clean` — removes `.next` and `dist/`

## Env

Required at runtime (see `.env.example`):
- `TMDB_API_KEY` — TMDB v3 API key
- `TMDB_BASE_URL` — `https://api.themoviedb.org/3`
- `TMDB_IMG_URL` — `https://image.tmdb.org/t/p/original`

`.env` is gitignored; `.env.production` is committed but holds no secret (API key is commented out and supplied by the deployment env).

## Conventions

- Path alias: `@/*` resolves to the repo root (e.g. `@/lib/requestCache`).
- **API routes are `.js`, not `.ts`** (under `app/api/`), even though components/lib are TypeScript. Match the existing file's extension.
- API proxy routes set ISR caching via `export const revalidate` (1800s for collections, 86400s for genres) plus `Cache-Control`/`CDN-Cache-Control` headers. Follow the pattern in `app/api/movies/collection/route.js`.
- In Next 16, `params` is a Promise — `await params` in dynamic route handlers (see `app/api/video-sources/[type]/[id]/route.js`).
- Client-side fetches go through `lib/requestCache.ts` (request dedup, ~5s TTL) — don't add duplicate fetch logic.
- Most interactive components use `'use client'`; heavy modals are lazy-loaded for performance.

## Gotchas

- **Video embeds break often.** Sources live in the `switch(server)` in `app/api/video-sources/[type]/[id]/route.js`; the default fallback is `player.videasy.net`. When a provider 522s or shows a frame-option error, swap/add a case there rather than touching the player UI. See `/fix-video-source`.
- Git workflow: committing directly to `main` is fine for this repo. Only commit/push when asked.
