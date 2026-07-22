import { NextResponse } from 'next/server';

export const revalidate = 1800; // Revalidate every 30 minutes
export const dynamic = 'force-dynamic';

// Movies available on a given streaming service, via TMDB discover's
// with_watch_providers. `id` is a TMDB watch-provider id (Netflix 8,
// Amazon Prime Video 9, Disney+ 337, Apple TV+ 350) — region-scoped,
// so a watch_region is required for results to come back at all.
export async function GET(request, { params }) {
  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1');
  const apiKey = process.env.TMDB_API_KEY;

  if (!apiKey) {
    return NextResponse.json({ error: 'API key not configured' }, { status: 500 });
  }

  if (!/^\d+$/.test(id) || isNaN(page) || page < 1) {
    return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 });
  }

  const results = [];

  try {
    // Each frontend page = 2 TMDB pages (~40 items), same as the collection routes
    const startTmdbPage = (page - 1) * 2 + 1;

    const promises = [];
    for (let i = 0; i < 2; i++) {
      const tmdbPage = startTmdbPage + i;
      promises.push(
        fetch(
          `https://api.themoviedb.org/3/discover/movie?api_key=${apiKey}&with_watch_providers=${id}&watch_region=US&sort_by=popularity.desc&page=${tmdbPage}`,
          { next: { revalidate: 1800 } }
        ).then((res) => res.json())
      );
    }

    const responses = await Promise.all(promises);
    responses.forEach((data) => {
      if (data.results) {
        data.results.forEach((item) => (item.media_type = 'movie'));
        results.push(...data.results);
      }
    });

    const uniqueResults = Array.from(new Map(results.map((item) => [item.id, item])).values());
    uniqueResults.sort((a, b) => b.popularity - a.popularity);

    const totalPages = responses[0]?.total_pages || 1;

    return NextResponse.json(
      {
        results: uniqueResults,
        page: page,
        hasMore: startTmdbPage + 1 < totalPages,
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=1800, stale-while-revalidate=3600',
          'CDN-Cache-Control': 'public, s-maxage=1800, stale-while-revalidate=3600',
        },
      }
    );
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch movies by provider' }, { status: 500 });
  }
}
