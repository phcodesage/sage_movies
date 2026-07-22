// Streaming-service shelves shown on the homepage and in the bottom nav.
// Ids are TMDB *watch provider* ids (region-scoped, queried with
// watch_region=US in /api/movies/provider/[id]), not production-company ids.
// logoPath is the provider's official logo served by TMDB — fetched from
// GET /watch/providers/movie?watch_region=US (2026-07-23). If a logo 404s,
// re-run that call and refresh the path.

export interface StreamingService {
  /** TMDB watch-provider id */
  id: number;
  name: string;
  /** Compact label for the bottom nav */
  shortName: string;
  /** DOM id of the homepage row, used for scroll targets and /#hash jumps */
  rowId: string;
  /** TMDB provider logo path, served from image.tmdb.org */
  logoPath: string;
}

// Brands recognized by the search UI. `key` is the canonical term the
// /api/search platform map understands; aliases are normalized user inputs
// that resolve to it. Logos are TMDB provider logos except Vivamax, which has
// no watch-provider entry — its logo comes from TMDB company 149142.
export interface SearchBrand {
  key: string;
  label: string;
  aliases: string[];
  logoPath: string;
}

export const SEARCH_BRANDS: SearchBrand[] = [
  {
    key: 'vivamax',
    label: 'Vivamax',
    aliases: ['vivamax', 'viva'],
    logoPath: '/25oYoXHsfWYlddAzJSBReajN3BM.png',
  },
  {
    key: 'netflix',
    label: 'Netflix',
    aliases: ['netflix'],
    logoPath: '/pbpMk2JmcoNnQwx5JGpXngfoWtp.jpg',
  },
  {
    key: 'hbo',
    label: 'HBO Max',
    aliases: ['hbo', 'hbo max', 'max'],
    logoPath: '/jbe4gVSfRlbPTdESXhEKpornsfu.jpg',
  },
  {
    key: 'disney',
    label: 'Disney+',
    aliases: ['disney', 'disney+', 'disney plus'],
    logoPath: '/97yvRBw1GzX7fXprcF80er19ot.jpg',
  },
  {
    key: 'amazon',
    label: 'Prime Video',
    aliases: ['amazon', 'prime', 'prime video', 'amazon prime'],
    logoPath: '/pvske1MyAoymrs5bguRfVqYiM9a.jpg',
  },
  {
    key: 'apple',
    label: 'Apple TV+',
    aliases: ['apple', 'apple tv', 'apple tv+'],
    logoPath: '/mcbz1LgtErU9p4UdbZ0rG6RTWHX.jpg',
  },
];

/** Case/whitespace-insensitive brand lookup for a raw search query. */
export function matchSearchBrand(query: string): SearchBrand | undefined {
  const q = query.trim().toLowerCase().replace(/\s+/g, ' ');
  return SEARCH_BRANDS.find((b) => b.aliases.includes(q));
}

export const STREAMING_SERVICES: StreamingService[] = [
  {
    id: 337,
    name: 'Disney+',
    shortName: 'Disney+',
    rowId: 'disney',
    logoPath: '/97yvRBw1GzX7fXprcF80er19ot.jpg',
  },
  {
    id: 9,
    name: 'Amazon Prime Video',
    shortName: 'Prime Video',
    rowId: 'amazon',
    logoPath: '/pvske1MyAoymrs5bguRfVqYiM9a.jpg',
  },
  {
    id: 350,
    name: 'Apple TV+',
    shortName: 'Apple TV+',
    rowId: 'apple',
    logoPath: '/mcbz1LgtErU9p4UdbZ0rG6RTWHX.jpg',
  },
];
