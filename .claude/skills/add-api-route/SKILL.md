---
name: add-api-route
description: Scaffold a new TMDB proxy route under app/api/ following this repo's ISR-caching and request-dedup conventions. Use when adding a new movie/TV/anime endpoint backed by the TMDB API.
---

Scaffold a new API proxy route. `$ARGUMENTS` is the route path and purpose (e.g. "movies/upcoming" or "tv/genre/[id]").

Follow the existing conventions exactly:

1. **File:** create `app/api/<path>/route.js` — **`.js`, not `.ts`** (all API routes here are JavaScript).
2. **Reference** `app/api/movies/collection/route.js` (static) or `app/api/video-sources/[type]/[id]/route.js` (dynamic) before writing — match their shape.
3. **Imports & exports:**
   - `import { NextResponse } from 'next/server';`
   - `export const revalidate = 1800;` for collections (30 min) or `86400` for genre/reference data (24 h).
4. **Handler:** `export async function GET(request, { params })`. If the route is dynamic, `const resolved = await params;` first (params is a Promise in Next 16).
5. **TMDB call:** read `process.env.TMDB_API_KEY`; fetch `https://api.themoviedb.org/3/...?api_key=${apiKey}&...` with `{ next: { revalidate: <same> } }`. Tag each item with `media_type` if mixing types, and dedupe by `id` via `new Map(...)` when fetching multiple pages.
6. **Response:** `NextResponse.json(data, { headers: { 'Cache-Control': 'public, s-maxage=<rev>, stale-while-revalidate=<2x>', 'CDN-Cache-Control': '...' } })`. Wrap in try/catch and return `{ error: '...' }` with status 500 on failure.
7. Validate dynamic params and return `{ error: 'Invalid parameters' }` with status 400 when bad.

After writing, suggest running `/dev-verify` to confirm the endpoint returns data.
