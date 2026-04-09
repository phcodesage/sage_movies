import { NextResponse } from 'next/server';

export async function GET() {
  const apiKey = process.env.TMDB_API_KEY;
  try {
    const response = await fetch(
      `https://api.themoviedb.org/3/genre/movie/list?api_key=${apiKey}`,
      { next: { revalidate: 86400 } } // Cache for 24 hours
    );
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch genres' }, { status: 500 });
  }
}
