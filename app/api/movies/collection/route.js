import { NextResponse } from 'next/server';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const page = searchParams.get('page') || 1;
  const apiKey = process.env.TMDB_API_KEY;
  const results = [];

  try {
    // 1. Popular movies (3 pages)
    for (let currentPage = 1; currentPage <= 3; currentPage++) {
      const popularResponse = await fetch(
        `https://api.themoviedb.org/3/movie/popular?api_key=${apiKey}&page=${currentPage}`,
        { next: { revalidate: 3600 } }
      );
      const popularData = await popularResponse.json();
      if (popularData.results) {
        popularData.results.forEach(item => item.media_type = 'movie');
        results.push(...popularData.results);
      }
    }
    
    // 2. Top rated movies (2 pages)
    for (let currentPage = 1; currentPage <= 2; currentPage++) {
      const topRatedResponse = await fetch(
        `https://api.themoviedb.org/3/movie/top_rated?api_key=${apiKey}&page=${currentPage}`,
        { next: { revalidate: 3600 } }
      );
      const topRatedData = await topRatedResponse.json();
      if (topRatedData.results) {
        topRatedData.results.forEach(item => item.media_type = 'movie');
        results.push(...topRatedData.results);
      }
    }
    
    const uniqueResults = Array.from(new Map(results.map(item => [item.id, item])).values());
    uniqueResults.sort((a, b) => b.popularity - a.popularity);
    
    return NextResponse.json({ results: uniqueResults.slice(0, 20) });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch movie collection' }, { status: 500 });
  }
}
