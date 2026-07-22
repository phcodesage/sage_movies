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
