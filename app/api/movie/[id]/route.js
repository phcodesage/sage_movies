import { NextResponse } from 'next/server';

export async function GET(request, { params }) {
  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const mediaType = searchParams.get('type') || 'movie';
  const apiKey = process.env.TMDB_API_KEY;

  if (!apiKey) {
    return NextResponse.json({ error: 'API key not configured' }, { status: 500 });
  }

  try {
    const response = await fetch(
      `https://api.themoviedb.org/3/${mediaType}/${id}?api_key=${apiKey}&append_to_response=production_companies`,
      { next: { revalidate: 3600 } }
    );
    const data = await response.json();

    if (data.success === false) {
      return NextResponse.json(
        { error: data.status_message || 'Movie not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
        // Netlify's CDN cache key ignores query strings unless told otherwise.
        // Without this, a cached ?type=movie response gets served for ?type=tv
        // whenever a movie and TV show share the same numeric TMDB id.
        'Netlify-Vary': 'query',
      },
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch movie details' }, { status: 500 });
  }
}
