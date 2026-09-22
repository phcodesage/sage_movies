import { NextResponse } from 'next/server';

export const revalidate = 3600; // Revalidate every hour
export const dynamic = 'force-dynamic';

export async function GET(request) {
  const apiKey = process.env.TMDB_API_KEY;

  if (!apiKey) {
    return NextResponse.json({ error: 'API key not configured' }, { status: 500 });
  }

  try {
    const res = await fetch(`https://api.themoviedb.org/3/movie/now_playing?api_key=${apiKey}&page=1`, {
      next: { revalidate: 3600 },
    });
    const data = await res.json();
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, max-age=300, s-maxage=3600, stale-while-revalidate=7200',
        'CDN-Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
      },
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch latest movies' }, { status: 500 });
  }
}
