import { NextResponse } from 'next/server';

export const revalidate = 1800; // Revalidate every 30 minutes
export const dynamic = 'force-dynamic';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1');
  const apiKey = process.env.TMDB_API_KEY;
  const results = [];

  try {
    // Determine which TMDB pages to fetch based on the requested 'page'
    // Each request from our frontend 'page' will fetch 2 TMDB pages to provide ~40 items
    const startTmdbPage = (page - 1) * 2 + 1;
    
    const popularPromises = [];
    for (let i = 0; i < 2; i++) {
      const tmdbPage = startTmdbPage + i;
      popularPromises.push(
        fetch(
          `https://api.themoviedb.org/3/movie/popular?api_key=${apiKey}&page=${tmdbPage}`,
          { next: { revalidate: 1800 } }
        ).then(res => res.json())
      );
    }

    const popularResponses = await Promise.all(popularPromises);
    popularResponses.forEach(popularData => {
      if (popularData.results) {
        popularData.results.forEach(item => item.media_type = 'movie');
        results.push(...popularData.results);
      }
    });

    const uniqueResults = Array.from(new Map(results.map(item => [item.id, item])).values());
    uniqueResults.sort((a, b) => b.popularity - a.popularity);

    return NextResponse.json(
      { 
        results: uniqueResults,
        page: page,
        hasMore: page < 50 // Cap at 50 pages or ~2000 items
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=1800, stale-while-revalidate=3600',
          'CDN-Cache-Control': 'public, s-maxage=1800, stale-while-revalidate=3600',
        },
      }
    );
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch movie collection' }, { status: 500 });
  }
}
