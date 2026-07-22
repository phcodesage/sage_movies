import { NextResponse } from 'next/server';

export const revalidate = 300; // Revalidate search results every 5 minutes
export const dynamic = 'force-dynamic';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('query');
  const apiKey = process.env.TMDB_API_KEY;

  if (!query) {
    return NextResponse.json({ error: 'Query parameter is required' }, { status: 400 });
  }

  try {
    const results = [];
    const queryLower = query.toLowerCase();

    // Map common platform names to TMDB IDs. Movies and TV need different
    // filters: `with_networks` only works on discover/tv (discover/movie
    // silently ignores it and returns generic popular titles), so movies use
    // watch-provider ids (`with_watch_providers` + watch_region) instead.
    // Vivamax has no watch-provider entry; its producing company covers both.
    const platformMaps = {
      // Vivamax (149142) OR Viva Films PH (8356) — pipe means OR in discover.
      // (The old mapping, 3161, was actually Odessa Film Studio.)
      vivamax: { company: '149142|8356' },
      netflix: { provider: 8, network: 213 },
      hbo: { provider: 1899, network: 49 },
      disney: { provider: 337, network: 2739 },
      apple: { provider: 350, network: 2552 },
      amazon: { provider: 9, network: 1024 },
    };

    // Variant spellings resolve to the canonical platform key above.
    // Keep in sync with SEARCH_BRANDS aliases in lib/streamingServices.ts.
    const platformAliases = {
      viva: 'vivamax',
      'hbo max': 'hbo',
      max: 'hbo',
      'disney+': 'disney',
      'disney plus': 'disney',
      'apple tv': 'apple',
      'apple tv+': 'apple',
      prime: 'amazon',
      'prime video': 'amazon',
      'amazon prime': 'amazon',
    };
    const normalizedQuery = queryLower.trim().replace(/\s+/g, ' ');
    const platformKey = platformAliases[normalizedQuery] || normalizedQuery;

    // If query matches a platform, fetch from discover API too
    if (platformMaps[platformKey]) {
      const platform = platformMaps[platformKey];
      const movieFilter = platform.company
        ? `with_companies=${platform.company}`
        : `with_watch_providers=${platform.provider}&watch_region=US`;
      const tvFilter = platform.company
        ? `with_companies=${platform.company}`
        : `with_networks=${platform.network}`;

      const discoveryPromises = [];
      // Reduced from 3 pages to 2 pages for faster response
      for (let page = 1; page <= 2; page++) {
        discoveryPromises.push(
          fetch(
            `https://api.themoviedb.org/3/discover/movie?api_key=${apiKey}&${movieFilter}&sort_by=popularity.desc&page=${page}`
          ).then((res) => res.json()),
          fetch(
            `https://api.themoviedb.org/3/discover/tv?api_key=${apiKey}&${tvFilter}&sort_by=popularity.desc&page=${page}`
          ).then((res) => res.json())
        );
      }

      // Also add a general search for the platform name in titles just in case
      discoveryPromises.push(
        fetch(
          `https://api.themoviedb.org/3/search/movie?api_key=${apiKey}&query=${encodeURIComponent(query)}&page=1`
        ).then((res) => res.json())
      );

      const discoveryResults = await Promise.all(discoveryPromises);

      discoveryResults.forEach((data) => {
        if (data.results) {
          data.results.forEach((item) => {
            // Determine media type if possible, discovery returns what you ask for
            // but we'll use a hint from the URL structure or data
            item.media_type = item.title ? 'movie' : 'tv';
            item.relevance_score = 110; // Highest priority for platform discovery
          });
          results.push(...data.results);
        }
      });
    }

    // Search movies (reduced to 2 pages for faster response)
    for (let page = 1; page <= 2; page++) {
      const response = await fetch(
        `https://api.themoviedb.org/3/search/movie?api_key=${apiKey}&query=${encodeURIComponent(query)}&page=${page}`
      );
      const data = await response.json();
      if (data.results) {
        data.results.forEach((item) => {
          item.media_type = 'movie';
          item.relevance_score = calculateRelevance(item.title, query);
        });
        results.push(...data.results);
      }
    }

    // Search TV shows (reduced to 1 page for faster response)
    for (let page = 1; page <= 1; page++) {
      const tvResponse = await fetch(
        `https://api.themoviedb.org/3/search/tv?api_key=${apiKey}&query=${encodeURIComponent(query)}&page=${page}`
      );
      const tvData = await tvResponse.json();
      if (tvData.results) {
        tvData.results.forEach((item) => {
          item.media_type = 'tv';
          item.relevance_score = calculateRelevance(item.name || '', query);
        });
        results.push(...tvData.results);
      }
    }

    const uniqueResults = Array.from(new Map(results.map((item) => [item.id, item])).values());
    uniqueResults.sort((a, b) => {
      if (b.relevance_score !== a.relevance_score) return b.relevance_score - a.relevance_score;
      return b.popularity - a.popularity;
    });

    return NextResponse.json(
      { results: uniqueResults },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
          'CDN-Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        },
      }
    );
  } catch (error) {
    return NextResponse.json({ error: 'Failed to search TMDB' }, { status: 500 });
  }
}

function calculateRelevance(title, query) {
  const t = title.toLowerCase();
  const q = query.toLowerCase();
  if (t === q) return 100;
  if (t.startsWith(q)) return 90;
  if (new RegExp(`\\b${q}\\b`, 'i').test(t)) return 80;
  if (t.includes(q)) return 70;
  return 50;
}
