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
    const queryLower = query.toLowerCase();

    // Map common platform names to TMDB IDs (Companies or Networks)
    const platformMaps = {
      'vivamax': { type: 'company', id: 3161 }, // Viva Films is the primary producer for Vivamax
      'netflix': { type: 'network', id: 213 },
      'hbo': { type: 'network', id: 49 },
      'disney': { type: 'company', id: 2 },
      'apple': { type: 'network', id: 2552 },
      'amazon': { type: 'network', id: 1024 }
    };

    // If query matches a platform, fetch from discover API too
    if (platformMaps[queryLower]) {
      const platform = platformMaps[queryLower];
      const param = platform.type === 'company' ? 'with_companies' : 'with_networks';
      
      const discoveryPromises = [];
      for (let page = 1; page <= 3; page++) {
        discoveryPromises.push(
          fetch(`https://api.themoviedb.org/3/discover/movie?api_key=${apiKey}&${param}=${platform.id}&sort_by=popularity.desc&region=PH&page=${page}`).then(res => res.json()),
          fetch(`https://api.themoviedb.org/3/discover/tv?api_key=${apiKey}&${param}=${platform.id}&sort_by=popularity.desc&page=${page}`).then(res => res.json())
        );
      }
      
      // Also add a general search for the platform name in titles just in case
      discoveryPromises.push(
        fetch(`https://api.themoviedb.org/3/search/movie?api_key=${apiKey}&query=${encodeURIComponent(query)}&page=1`).then(res => res.json())
      );

      const discoveryResults = await Promise.all(discoveryPromises);

      discoveryResults.forEach(data => {
        if (data.results) {
          data.results.forEach(item => {
            // Determine media type if possible, discovery returns what you ask for
            // but we'll use a hint from the URL structure or data
            item.media_type = item.title ? 'movie' : 'tv';
            item.relevance_score = 110; // Highest priority for platform discovery
          });
          results.push(...data.results);
        }
      });
    }
    
    // Search movies (up to 3 pages)
    for (let page = 1; page <= 3; page++) {
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
    
    // Search TV shows (up to 2 pages)
    for (let page = 1; page <= 2; page++) {
      const tvResponse = await fetch(
        `https://api.themoviedb.org/3/search/tv?api_key=${apiKey}&query=${encodeURIComponent(query)}&page=${page}`
      );
      const tvData = await tvResponse.json();
      if (tvData.results) {
        tvData.results.forEach(item => {
          item.media_type = 'tv';
          item.relevance_score = calculateRelevance(item.name || '', query);
        });
        results.push(...tvData.results);
      }
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
