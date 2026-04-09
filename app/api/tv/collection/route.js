import { NextResponse } from 'next/server';

export async function GET(request) {
  const apiKey = process.env.TMDB_API_KEY;
  const results = [];
  const romanceGenreId = 10749;

  try {
    for (let currentPage = 1; currentPage <= 3; currentPage++) {
      const popularResponse = await fetch(
        `https://api.themoviedb.org/3/discover/movie?api_key=${apiKey}&with_genres=${romanceGenreId}&sort_by=popularity.desc&page=${currentPage}`,
        { next: { revalidate: 3600 } }
      );
      const popularData = await popularResponse.json();
      if (popularData.results) {
        popularData.results.forEach(item => item.media_type = 'movie');
        results.push(...popularData.results);
      }
    }
    
    const uniqueResults = Array.from(new Map(results.map(item => [item.id, item])).values());
    uniqueResults.sort((a, b) => b.popularity - a.popularity);
    
    return NextResponse.json({ results: uniqueResults.slice(0, 20) });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch TV collection' }, { status: 500 });
  }
}
