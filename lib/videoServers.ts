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

// VidCore is the default because it is the only provider that plays with the popup
// sandbox enabled — and vidsrc.to, the previous default, served no stream at all.
export const DEFAULT_SERVER = 'vidcore';
export const DEFAULT_LANG = 'en';

export const VIDEO_SERVERS: VideoServer[] = [
  {
    id: 'vidsrc.to',
    label: 'Vidsrc.to (Primary)',
    supportsLang: true,
    sandboxTolerant: false, // no stream for the probe title either way
    build: (type, id, { lang }) =>
      `https://vidsrc.to/embed/${type}/${id}${lang ? `?ds_lang=${lang}` : ''}`,
  },
  {
    id: 'vidsrc.me',
    label: 'Vidsrc.me (Backup)',
    supportsLang: true,
    sandboxTolerant: false, // blank 'media unavailable' under sandbox
    build: (type, id, { lang }) =>
      `https://vidsrc.me/embed/${type}?tmdb=${id}${lang ? `&ds_lang=${lang}` : ''}`,
  },
  {
    id: 'vidcore',
    label: 'VidCore (Multi-subtitle)',
    supportsLang: true,
    sandboxTolerant: true, // only provider that plays sandboxed
    build: (type, id, { lang, season = 1, episode = 1 }) => {
      const path = type === 'tv' ? `tv/${id}/${season}/${episode}` : `movie/${id}`;
      return `https://vidcore.org/embed/${path}${lang ? `?sub=${lang}` : ''}`;
    },
  },
  {
    id: 'vidlink',
    label: 'VidLink (Ad-light)',
    supportsLang: false,
    sandboxTolerant: false, // shows 'Please Disable Sandbox'
    build: (type, id, { season = 1, episode = 1 }) =>
      type === 'tv'
        ? `https://vidlink.pro/tv/${id}/${season}/${episode}`
        : `https://vidlink.pro/movie/${id}`,
  },
  {
    id: 'vidsrc.su',
    label: 'Vidsrc.su (Stable)',
    supportsLang: false,
    sandboxTolerant: false, // shows 'Restricted Embed Detected'
    build: (type, id) => `https://vidsrc.su/embed/${type}/${id}`,
  },
  {
    id: 'superembed',
    label: 'SuperEmbed (Multi)',
    supportsLang: false,
    sandboxTolerant: false, // shows 'Sandboxing is not allowed!'
    build: (type, id) => `https://multiembed.mov/?video_id=${id}&tmdb=1`,
  },
  {
    id: '2embed',
    label: '2Embed (Mirror)',
    supportsLang: false,
    sandboxTolerant: false, // shows 'Sandbox Detected'
    build: (type, id, { season = 1, episode = 1 }) =>
      type === 'tv'
        ? `https://www.2embed.cc/embedtv/${id}&s=${season}&e=${episode}`
        : `https://www.2embed.cc/embed/${id}`,
  },
  {
    id: 'player.videasy.net',
    label: 'Videasy (Alternative)',
    supportsLang: false,
    sandboxTolerant: false, // shows 'Iframe Sandbox Detected'
    build: (type, id, { season, episode }) => {
      // Videasy is /{type}/{id}, NOT /embed/{type}/{id} — the latter 404s.
      const path =
        type === 'tv' && season && episode ? `tv/${id}/${season}/${episode}` : `${type}/${id}`;
      return `https://player.videasy.net/${path}?ads_behavior=background&popup_mode=quiet`;
    },
  },
];

export function getServer(id?: string | null): VideoServer {
  return (
    VIDEO_SERVERS.find((s) => s.id === id) ??
    VIDEO_SERVERS.find((s) => s.id === DEFAULT_SERVER) ??
    VIDEO_SERVERS[0]
  );
}
