import { NextResponse } from 'next/server';

export const revalidate = 1800; // Revalidate every 30 minutes
export const dynamic = 'force-dynamic';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1');
  const apiKey = process.env.TMDB_API_KEY;
  const results = [];
  const animationGenreId = 16;

  try {
    const startTmdbPage = (page - 1) * 2 + 1;

    const tvPromises = [];
    for (let i = 0; i < 2; i++) {
      const tmdbPage = startTmdbPage + i;
      tvPromises.push(
        fetch(
          `https://api.themoviedb.org/3/discover/tv?api_key=${apiKey}&with_genres=${animationGenreId}&sort_by=popularity.desc&page=${tmdbPage}`,
          { next: { revalidate: 1800 } }
        ).then(res => res.json())
      );
    }
    const tvResponses = await Promise.all(tvPromises);
    tvResponses.forEach(data => {
      if (data.results) {
        data.results.forEach(item => item.media_type = 'tv');
        results.push(...data.results);
      }
    });

    const moviePromises = [];
    for (let i = 0; i < 1; i++) {
      const tmdbPage = startTmdbPage + i;
      moviePromises.push(
        fetch(
          `https://api.themoviedb.org/3/discover/movie?api_key=${apiKey}&with_genres=${animationGenreId}&sort_by=popularity.desc&page=${tmdbPage}`,
          { next: { revalidate: 1800 } }
        ).then(res => res.json())
      );
    }
    const movieResponses = await Promise.all(moviePromises);
    movieResponses.forEach(data => {
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
          // Netlify's CDN cache key ignores query strings unless told otherwise,
          // which served one ?page's response for every page. Netlify-Vary opts in.
          'Netlify-Vary': 'query',
        },
      }
    );
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch anime collection' }, { status: 500 });
  }
}
