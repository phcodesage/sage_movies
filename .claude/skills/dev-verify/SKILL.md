---
name: dev-verify
description: Start the sage_movies dev server and verify a change renders correctly in the browser or via API. Use after editing a page, component, or API route to confirm it works.
---

Start the app and confirm a change actually works. This is additive to the bundled `/run` and `/verify` skills — it adds this project's specifics.

1. **Env check:** ensure `.env` has `TMDB_API_KEY` set (most pages and all `app/api` routes 500 without it). If missing, tell the user — copy from `.env.example`.
2. **Start:** run `npm run dev` in the background (default port 3000). Wait for "Ready" / the compiled message before hitting it.
3. **Verify, depending on what changed:**
   - **API route:** `curl -s "http://localhost:3000/api/<path>?page=1"` and confirm JSON `results` (not an `error`/500). For dynamic routes, supply a real TMDB id.
   - **Page/component:** load the relevant URL in a browser (use the playwright skill if installed) and confirm it renders without console/hydration errors. For the player, load a movie detail page and confirm the iframe loads.
4. **Lint** the changed files: `npm run lint`.
5. Report what you observed (status codes, screenshots, errors). Stop the dev server when done unless the user wants it kept running.
