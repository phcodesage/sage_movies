import { NextResponse } from 'next/server';

export async function GET() {
  const apiKey = process.env.TMDB_API_KEY;
  const results = [];
  const animationGenreId = 16;

  try {
    for (let page = 1; page <= 2; page++) {
      const response = await fetch(
        `https://api.themoviedb.org/3/discover/tv?api_key=${apiKey}&with_genres=${animationGenreId}&sort_by=popularity.desc&page=${page}`,
        { next: { revalidate: 3600 } }
      );
      const data = await response.json();
      if (data.results) {
        data.results.forEach(item => item.media_type = 'tv');
        results.push(...data.results);
      }
    }
    
    for (let page = 1; page <= 1; page++) {
      const response = await fetch(
        `https://api.themoviedb.org/3/discover/movie?api_key=${apiKey}&with_genres=${animationGenreId}&sort_by=popularity.desc&page=${page}`,
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
    
    return NextResponse.json({ results: uniqueResults.slice(0, 20) });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch anime collection' }, { status: 500 });
  }
}
