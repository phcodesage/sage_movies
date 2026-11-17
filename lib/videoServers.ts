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

export const DEFAULT_SERVER = 'vidlink.pro';
export const DEFAULT_LANG = 'en';

export const VIDEO_SERVERS: VideoServer[] = [
  {
    id: 'vidlink.pro',
    label: 'VidLink (Recommended)',
    supportsLang: false,
    sandboxTolerant: false,
    build: (type, id, { season = 1, episode = 1 }) =>
      type === 'tv'
        ? `https://vidlink.pro/tv/${id}/${season}/${episode}`
        : `https://vidlink.pro/movie/${id}`,
  },
  {
    id: 'embed.vidrift.net',
    label: 'VidRift (HD)',
    supportsLang: false,
    sandboxTolerant: false,
    build: (type, id, { season = 1, episode = 1 }) =>
      type === 'tv'
        ? `https://embed.vidrift.net/embed/tv/${id}/${season}/${episode}`
        : `https://embed.vidrift.net/embed/movie/${id}`,
  },
  {
    id: 'vidfast.pro',
    label: 'VidFast (Fast)',
    supportsLang: false,
    sandboxTolerant: false,
    build: (type, id, { season = 1, episode = 1 }) =>
      type === 'tv'
        ? `https://vidfast.pro/tv/${id}/${season}/${episode}`
        : `https://vidfast.pro/movie/${id}`,
  },
  {
    id: 'embedwave.cc',
    label: 'EmbedWave (No Ads)',
    supportsLang: false,
    sandboxTolerant: false,
    build: (type, id, { season = 1, episode = 1 }) =>
      type === 'tv'
        ? `https://embedwave.cc/embed/tv/${id}/${season}/${episode}`
        : `https://embedwave.cc/embed/movie/${id}`,
  },
  {
    id: 'vidspark.to',
    label: 'VidSpark',
    supportsLang: false,
    sandboxTolerant: false,
    build: (type, id, { season = 1, episode = 1 }) =>
      type === 'tv'
        ? `https://vidspark.to/tv/${id}/${season}/${episode}`
        : `https://vidspark.to/movie/${id}`,
  },
  {
    id: 'superembed',
    label: 'SuperEmbed (Backup)',
    supportsLang: false,
    sandboxTolerant: false,
    movieOnly: true,
    build: (type, id) => `https://multiembed.mov/?video_id=${id}&tmdb=1`,
  },
];

export function getServers(type: MediaType): VideoServer[] {
  return VIDEO_SERVERS.filter((server) => type === 'movie' || !server.movieOnly);
}

export function getServer(id?: string, type: MediaType = 'movie'): VideoServer {
  return getServers(type).find((s) => s.id === id) || VIDEO_SERVERS[0];
}

export function parseEpisodeNumber(value: string | null): number | null {
  if (value === null) return 1;
  return /^[1-9]\d{0,3}$/.test(value) ? Number(value) : null;
}

export function mediaTypeFromSlug(slug: string): MediaType {
  return slug.startsWith('tv-') ? 'tv' : 'movie';
}
