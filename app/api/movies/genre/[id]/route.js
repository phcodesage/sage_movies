import { NextResponse } from 'next/server';

export async function GET(request, { params }) {
  const { id } = params;
  const apiKey = process.env.TMDB_API_KEY;
  const results = [];

  try {
    for (let page = 1; page <= 3; page++) {
      const response = await fetch(
        `https://api.themoviedb.org/3/discover/movie?api_key=${apiKey}&with_genres=${id}&sort_by=popularity.desc&page=${page}`,
        { next: { revalidate: 3600 } }
      );
      const data = await response.json();
      if (data.results) {
        data.results.forEach(item => item.media_type = 'movie');
        results.push(...data.results);
      }
    }
    
    const uniqueResults = Array.from(new Map(results.map(item => [item.id, item])).values());
    uniqueResults.sort((a, b) => b.popularity - a.popularity);
    
    return NextResponse.json({ results: uniqueResults });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch movies by genre' }, { status: 500 });
  }
}
