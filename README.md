# Sage Movies

Next.js app with TMDB catalogs, external video embeds, and an installable web app.

Run `npm install`, configure `TMDB_API_KEY` in `.env`, then use `npm run dev`.
For production verification, run `npm run build && npm start`. Service worker
registration is intentionally enabled only in production. Use HTTPS when deployed;
localhost also supports service workers.

## Install and offline support

- Use **Get App** for Android's browser install prompt or iPhone/iPad instructions.
- In Safari, choose **Share → Add to Home Screen**. In Android Chrome, choose
  **Install app** or **Add to Home screen** if the prompt is unavailable.
- The manifest includes regular and maskable 192/512px icons, with a separate
  180px Apple touch icon. Regenerate assets with `node scripts/generate-icons.mjs`.
- `/sw.js` caches the offline page and a bounded set of static app files. It never
  caches API responses, Next.js navigation payloads, external embeds, or videos.
- Videos require an internet connection. Watch history stays in local storage;
  denied/full storage does not prevent playback.
- Worker updates wait until the user chooses **Reload**, avoiding an interruption
  to a playing video. Increment the cache version when changing offline assets.

## Playback and performance

Provider definitions are shared in `lib/videoServers.ts`. The client constructs
embed URLs directly, so refresh/server/episode changes cannot race stale API
responses. Retired provider IDs resolve to the default. SuperEmbed is
offered only for movies until its episode addressing is verified.

Current providers (probed live 2026-11-17 with TMDB 550 / 1399 S1E1; all
returned HTTP 200 with no framing block): VidLink (`vidlink.pro`,
default), VidRift (`embed.vidrift.net`), VidFast (`vidfast.pro`), EmbedWave
(`embedwave.cc`), VidSpark (`vidspark.to`), and SuperEmbed
(`multiembed.mov`, movies only). VidRift's player bot-walls server-side
probes (403, reported `unknown`); browsers load it fine — health stays
advisory for exactly this case. Retired in the same check: Videasy
(`player.videasy.to`, DNS dead; `player.videasy.net` only redirects there),
VidSrc Direct (`vidsrc.in`, NXDOMAIN), VidSrc VIP (`vidsrc.pm`, origin
520 + `SAMEORIGIN`), and 2Embed (wrapper over another backend, retired in
favour of direct players). Probed alive but not wired, as next rotation
spares: AutoEmbed (`player.autoembed.me/embed/{movie,tv}/...`) and
VidSrc buzz (`vidsrc.buzz/embed/{movie,tv}/...`). Re-run the probe before
trusting any of this — embed domains rotate without notice.

Health checks report reachability, not guaranteed playback. JavaScript error
strings, anti-bot responses, and server-side timeouts no longer block the player.
An iframe load event cannot prove a cross-origin video started; **Try next server**
remains available when a title is missing or a provider fails.

The hero loads independently of slower shelves. Studio/provider shelves are
requested near the viewport; their section links exist before loading. Images
use bounded source sizes and longer caching, and preview/install code is loaded
on demand. Search requests cancel when the query changes.

The global popunder script is disabled by default because its click layer can
cover mobile playback controls. Native ad units still follow
`NEXT_PUBLIC_ADSTERRA_ENABLED`. The separate
`NEXT_PUBLIC_ADSTERRA_POPUNDER_ENABLED=true` build flag explicitly opts back in.

## Verification

- `npm test`: provider URL/episode routing, input validation, health classification,
  offline/cache isolation, worker update behavior, and recommendations.
- `npm run lint` and `npm run build`.
- Chromium/Pixel and WebKit/iPhone browser checks cover installation UI, delayed
  shelf rendering, all-down health probes, refresh, server switching, TV episode
  selection, viewport fit, worker registration, and offline assets.
- Chromium offline navigation passes. WebKit fallback is verified by disconnecting
  a local origin: its offline-emulation flag has a
  [known Playwright issue](https://github.com/microsoft/playwright/issues/42775).

Before release, verify home-screen installation on physical iOS/Android devices
over HTTPS. External providers control stream availability, codecs, and their own
ads; successful embed loading is not a guarantee that every title will play.
