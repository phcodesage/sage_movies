// Single source of truth for video embed providers.
// The API route (app/api/video-sources/[type]/[id]/route.js) builds URLs from this,
// and the player UI renders its server/language selects from it.

export type MediaType = 'movie' | 'tv';

export interface VideoServer {
  id: string;
  label: string;
  supportsLang: boolean;
  sandboxTolerant: boolean;
  movieOnly?: boolean;
  build: (type: MediaType, id: string, opts: EmbedOptions) => string;
}

export interface EmbedOptions {
  lang?: string;
  season?: number;
  episode?: number;
}

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

export const DEFAULT_SERVER = 'player.videasy.to';
export const DEFAULT_LANG = 'en';

export const VIDEO_SERVERS: VideoServer[] = [
  {
    id: 'player.videasy.to',
    label: 'Videasy (Recommended)',
    supportsLang: false,
    sandboxTolerant: false,
    build: (type, id, { season, episode }) => {
      const path =
        type === 'tv' && season && episode ? `tv/${id}/${season}/${episode}` : `${type}/${id}`;
      return `https://player.videasy.to/${path}?ads_behavior=background&popup_mode=quiet`;
    },
  },
  {
    id: 'vidsrc.xyz',
    label: 'VidSrc (Fast 1080p)',
    supportsLang: true,
    sandboxTolerant: false,
    build: (type, id, { season = 1, episode = 1, lang }) => {
      const path = type === 'tv' ? `tv/${id}/${season}/${episode}` : `movie/${id}`;
      return `https://vidsrc.xyz/embed/${path}${lang ? `?ds_lang=${lang}` : ''}`;
    },
  },
  {
    id: 'vidsrc.icu',
    label: 'VidSrc ICU (Multi-Server)',
    supportsLang: true,
    sandboxTolerant: false,
    build: (type, id, { season = 1, episode = 1 }) =>
      type === 'tv'
        ? `https://vidsrc.icu/embed/tv/${id}/${season}/${episode}`
        : `https://vidsrc.icu/embed/movie/${id}`,
  },
  {
    id: 'vidsrc.pm',
    label: 'VidSrc VIP (HD)',
    supportsLang: true,
    sandboxTolerant: false,
    build: (type, id, { season = 1, episode = 1 }) =>
      type === 'tv'
        ? `https://vidsrc.pm/embed/tv/${id}/${season}/${episode}`
        : `https://vidsrc.pm/embed/movie/${id}`,
  },
  {
    id: '2embed',
    label: '2Embed (Reliable)',
    supportsLang: false,
    sandboxTolerant: false,
    build: (type, id, { season = 1, episode = 1 }) =>
      type === 'tv'
        ? `https://www.2embed.cc/embedtv/${id}&s=${season}&e=${episode}`
        : `https://www.2embed.cc/embed/${id}`,
  },
  {
    id: 'superembed',
    label: 'SuperEmbed (Backup)',
    supportsLang: false,
    sandboxTolerant: false,
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
