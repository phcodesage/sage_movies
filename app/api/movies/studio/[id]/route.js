import { NextResponse } from 'next/server';

export const revalidate = 3600;
export const dynamic = 'force-dynamic';

export async function GET(request, { params }) {
  const { id } = await params;
  const apiKey = process.env.TMDB_API_KEY;

  if (!apiKey) {
    return NextResponse.json({ error: 'API key not configured' }, { status: 500 });
  }

  if (!/^\d+$/.test(id)) {
    return NextResponse.json({ error: 'Invalid studio' }, { status: 400 });
  }

  try {
    // Fetch movies from the same production company
    const response = await fetch(
      `https://api.themoviedb.org/3/discover/movie?api_key=${apiKey}&with_companies=${id}&sort_by=popularity.desc&page=1`,
      { next: { revalidate: 3600 } }
    );
    const data = await response.json();

    if (data.results) {
      data.results.forEach(item => item.media_type = 'movie');
    }

    return NextResponse.json(
      {
        results: data.results || [],
        page: 1,
        hasMore: false,
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
          'CDN-Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
        },
      }
    );
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch movies by studio' }, { status: 500 });
  }
}
