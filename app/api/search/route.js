import { NextResponse } from 'next/server';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('query');
  const apiKey = process.env.TMDB_API_KEY;

  if (!query) {
    return NextResponse.json({ error: 'Query parameter is required' }, { status: 400 });
  }

  try {
    const results = [];
    
    // Search movies
    for (let page = 1; page <= 2; page++) {
      const response = await fetch(
        `https://api.themoviedb.org/3/search/movie?api_key=${apiKey}&query=${encodeURIComponent(query)}&page=${page}`
      );
      const data = await response.json();
      if (data.results) {
        data.results.forEach(item => {
          item.media_type = 'movie';
          item.relevance_score = calculateRelevance(item.title, query);
        });
        results.push(...data.results);
      }
    }
    
    // Search TV shows
    const tvResponse = await fetch(
      `https://api.themoviedb.org/3/search/tv?api_key=${apiKey}&query=${encodeURIComponent(query)}`
    );
    const tvData = await tvResponse.json();
    if (tvData.results) {
      tvData.results.forEach(item => {
        item.media_type = 'tv';
        item.relevance_score = calculateRelevance(item.name || '', query);
      });
      results.push(...tvData.results);
    }
    
    const uniqueResults = Array.from(new Map(results.map(item => [item.id, item])).values());
    uniqueResults.sort((a, b) => {
      if (b.relevance_score !== a.relevance_score) return b.relevance_score - a.relevance_score;
      return b.popularity - a.popularity;
    });
    
    return NextResponse.json({ results: uniqueResults });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to search TMDB' }, { status: 500 });
  }
}

function calculateRelevance(title, query) {
  const t = title.toLowerCase();
  const q = query.toLowerCase();
  if (t === q) return 100;
  if (t.startsWith(q)) return 90;
  if (new RegExp(`\\b${q}\\b`, 'i').test(t)) return 80;
  if (t.includes(q)) return 70;
  return 50;
}
