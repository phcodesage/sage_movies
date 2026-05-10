import { NextResponse } from 'next/server';

export const revalidate = 1800; // Revalidate every 30 minutes
export const dynamic = 'force-dynamic';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1');
  const apiKey = process.env.TMDB_API_KEY;
  const results = [];
  const romanceGenreId = 10749;

  try {
    const startTmdbPage = (page - 1) * 2 + 1;
    
    const promises = [];
    for (let i = 0; i < 2; i++) {
      const tmdbPage = startTmdbPage + i;
      promises.push(
        fetch(
          `https://api.themoviedb.org/3/discover/movie?api_key=${apiKey}&with_genres=${romanceGenreId}&sort_by=popularity.desc&page=${tmdbPage}`,
          { next: { revalidate: 1800 } }
        ).then(res => res.json())
      );
    }
    
    const responses = await Promise.all(promises);
    responses.forEach(data => {
      if (data.results) {
        data.results.forEach(item => item.media_type = 'movie');
        results.push(...data.results);
      }
    });

    const uniqueResults = Array.from(new Map(results.map(item => [item.id, item])).values());
    uniqueResults.sort((a, b) => b.popularity - a.popularity);

    return NextResponse.json(
      { 
        results: uniqueResults,
        page: page,
        hasMore: page < 50
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=1800, stale-while-revalidate=3600',
          'CDN-Cache-Control': 'public, s-maxage=1800, stale-while-revalidate=3600',
        },
      }
    );
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch TV collection' }, { status: 500 });
  }
}
