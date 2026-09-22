import { NextResponse } from 'next/server';

export const revalidate = 3600;
export const dynamic = 'force-dynamic';

export async function GET(request, { params }) {
  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1');
  const apiKey = process.env.TMDB_API_KEY;
  const results = [];

  try {
    const startTmdbPage = (page - 1) * 2 + 1;

    const responses = await Promise.all(
      [0, 1].map((offset) => {
        const tmdbPage = startTmdbPage + offset;
        return fetch(
          `https://api.themoviedb.org/3/discover/movie?api_key=${apiKey}&with_genres=${id}&sort_by=popularity.desc&page=${tmdbPage}`,
          { next: { revalidate: 3600 } }
        ).then((response) => response.json());
      })
    );

    responses.forEach((data) => {
      if (data.results) {
        data.results.forEach((item) => (item.media_type = 'movie'));
        results.push(...data.results);
      }
    });
    
    const uniqueResults = Array.from(new Map(results.map(item => [item.id, item])).values());
    uniqueResults.sort((a, b) => b.popularity - a.popularity);
    
    return NextResponse.json(
      {
        results: uniqueResults,
        page: page,
        hasMore: page < 50,
      },
      {
        headers: {
          'Cache-Control': 'public, max-age=300, s-maxage=3600, stale-while-revalidate=7200',
          'CDN-Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
          'Netlify-Vary': 'query',
        },
      }
    );
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch movies by genre' }, { status: 500 });
  }
}
