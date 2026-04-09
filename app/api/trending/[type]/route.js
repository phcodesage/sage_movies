import { NextResponse } from 'next/server';

export async function GET(request, { params }) {
  const { type } = params;
  const { searchParams } = new URL(request.url);
  const page = searchParams.get('page') || 1;
  const apiKey = process.env.TMDB_API_KEY;

  try {
    const results = [];
    
    // Fetch trending items (page 1 and 2)
    for (let currentPage = 1; currentPage <= 2; currentPage++) {
      const response = await fetch(
        `https://api.themoviedb.org/3/trending/${type}/week?api_key=${apiKey}&page=${currentPage}`,
        { next: { revalidate: 3600 } } // Cache for 1 hour
      );
      const data = await response.json();
      if (data.results && data.results.length > 0) {
        results.push(...data.results);
      }
    }
    
    if (type === 'movie') {
      const popularResponse = await fetch(
        `https://api.themoviedb.org/3/movie/popular?api_key=${apiKey}&page=1`,
        { next: { revalidate: 3600 } }
      );
      const popularData = await popularResponse.json();
      if (popularData.results) {
        popularData.results.forEach(item => item.media_type = 'movie');
        results.push(...popularData.results);
      }
    }
    
    if (type === 'tv') {
      const popularResponse = await fetch(
        `https://api.themoviedb.org/3/tv/popular?api_key=${apiKey}&page=1`,
        { next: { revalidate: 3600 } }
      );
      const popularData = await popularResponse.json();
      if (popularData.results) {
        popularData.results.forEach(item => item.media_type = 'tv');
        results.push(...popularData.results);
      }
    }
    
    const uniqueResults = Array.from(new Map(results.map(item => [item.id, item])).values());
    uniqueResults.sort((a, b) => b.popularity - a.popularity);
    
    return NextResponse.json({ results: uniqueResults });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
  }
}
