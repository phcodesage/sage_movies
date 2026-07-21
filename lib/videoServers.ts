// Single source of truth for video embed providers.
// The API route (app/api/video-sources/[type]/[id]/route.js) builds URLs from this,
// and the player UI renders its server/language selects from it — keep both reading
// from here rather than hardcoding a second list.

export type MediaType = 'movie' | 'tv';

export interface VideoServer {
  id: string;
  label: string;
  /** Provider accepts a default-subtitle-language code in its URL. */
  supportsLang: boolean;
  /**
   * Provider still plays inside a sandboxed iframe. Verified by hand in Chrome on
   * 2026-07-21 — do NOT assume, re-test. Nearly every provider actively detects the
   * sandbox attribute and refuses to play, because withholding `allow-popups` kills
   * their popunder revenue.
   */
  sandboxTolerant: boolean;
  /** Provider only serves movies. */
  movieOnly?: boolean;
  build: (type: MediaType, id: string, opts: EmbedOptions) => string;
}

export interface EmbedOptions {
  /** ISO 639-1 code, e.g. 'en', 'es', 'tl'. */
  lang?: string;
  season?: number;
  episode?: number;
}

// No embed provider exposes *audio track* selection over the URL — the audio tracks
// available are whatever the underlying stream ships with, chosen inside the player.
// What can be pre-selected is the default subtitle language, which is what `lang` sets.
export const SUBTITLE_LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Spanish' },
  { code: 'fr', label: 'French' },
  { code: 'de', label: 'German' },
  { code: 'it', label: 'Italian' },
  { code: 'pt', label: 'Portuguese' },
  { code: 'tl', label: 'Tagalog' },
  { code: 'ja', label: 'Japanese' },
  { code: 'ko', label: 'Korean' },
  { code: 'zh', label: 'Chinese' },
  { code: 'hi', label: 'Hindi' },
  { code: 'ar', label: 'Arabic' },
];

// Default and ordering come from a measured bake-off, not vibes. On 2026-07-22 all
// providers were loaded against the 5 newest now-playing releases (TMDB 1318621,
// 1368337, 1491920, 1108427, 1645603) and scored on whether the title actually came
// up. Re-run that test before changing this — availability shifts constantly.
//
//   videasy    5/5   clean player, no interstitial seen
//   2embed     5/5   clean player
//   superembed 5/5   reliable BUT served an adult "video chat" interstitial on one
//                    title; kept as a backup, deliberately not the default
//   vidsrc.me  4/5   missing Kung Fu Soccer
//
// Dropped: vidsrc.su (0/5, blank every time), vidsrc.to (0/5, always behind a
// gambling ad wall), vidcore (1/5), vidlink (2/5).
export const DEFAULT_SERVER = 'player.videasy.net';
export const DEFAULT_LANG = 'en';

export const VIDEO_SERVERS: VideoServer[] = [
  {
    id: 'player.videasy.net',
    label: 'Videasy (Recommended)',
    supportsLang: false,
    sandboxTolerant: false, // shows 'Iframe Sandbox Detected'
    build: (type, id, { season, episode }) => {
      // Videasy is /{type}/{id}, NOT /embed/{type}/{id} — the latter 404s.
      const path =
        type === 'tv' && season && episode ? `tv/${id}/${season}/${episode}` : `${type}/${id}`;
      return `https://player.videasy.net/${path}?ads_behavior=background&popup_mode=quiet`;
    },
  },
  {
    id: '2embed',
    label: '2Embed (Reliable)',
    supportsLang: false,
    sandboxTolerant: false, // shows 'Sandbox Detected'
    build: (type, id, { season = 1, episode = 1 }) =>
      type === 'tv'
        ? `https://www.2embed.cc/embedtv/${id}&s=${season}&e=${episode}`
        : `https://www.2embed.cc/embed/${id}`,
  },
  {
    id: 'vidsrc.me',
    label: 'Vidsrc.me (Subtitles)',
    supportsLang: true,
    sandboxTolerant: false, // blank 'media unavailable' under sandbox
    build: (type, id, { lang }) =>
      `https://vidsrc.me/embed/${type}?tmdb=${id}${lang ? `&ds_lang=${lang}` : ''}`,
  },
  {
    id: 'superembed',
    label: 'SuperEmbed (Backup)',
    supportsLang: false,
    sandboxTolerant: false, // shows 'Sandboxing is not allowed!'
    build: (type, id) => `https://multiembed.mov/?video_id=${id}&tmdb=1`,
  },
];

export function getServer(id?: string | null): VideoServer {
  return (
    VIDEO_SERVERS.find((s) => s.id === id) ??
    VIDEO_SERVERS.find((s) => s.id === DEFAULT_SERVER) ??
    VIDEO_SERVERS[0]
  );
}
