---
name: fix-video-source
description: Swap, add, or fix a video embed provider when one breaks (522 errors, frame-option / X-Frame-Options errors, blank player). Use when the movie/TV player won't load.
---

Video embed providers break frequently. All of them live in one place. `$ARGUMENTS` may name the failing or desired provider.

1. Open `app/api/video-sources/[type]/[id]/route.js`. Providers are `case` branches in `switch(server)`; the `default` fallback is `player.videasy.net`.
2. **Diagnose:** identify the failing provider (from `$ARGUMENTS` or by asking which server the user selected). Common failures: 522 (provider down), `X-Frame-Options`/frame-ancestors (provider blocks embedding), or blank iframe.
3. **Fix options:**
   - To **add** a provider: add a new `case "<name>":` returning the correct `embedURL` for `${type}`/`${id}`. Note the URL shape varies per provider (some use `tmdb=${id}`, some `/embed/${type}/${id}`, `superembed` uses `multiembed.mov/?video_id=${id}&tmdb=1`, `moviesapi` is movie-only).
   - To **change the default**, edit the `default:` branch (currently videasy.net with `ads_behavior=background&popup_mode=quiet`).
   - To **retire** a broken provider, remove its `case` and make sure the server-selector UI no longer offers it.
4. The `type` is `'movie'` or `'tv'`; some providers expect `'show'` instead of `'tv'` — translate as videasy.net does.
5. **Verify the new URL embeds** before finishing: it must allow framing (no `X-Frame-Options: DENY`). Use `/dev-verify` and load a movie page, or `curl -sI <embedURL>` to inspect frame headers.

Keep the change confined to this route file — the player UI reads `embedURL` from it and shouldn't need edits.
