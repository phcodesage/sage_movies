// Middleware for Cloudflare Pages Functions
export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  
  // Log request for debugging
  console.log(`[${new Date().toISOString()}] ${request.method} ${url.pathname}`);
  
  // Handle API requests
  if (url.pathname.startsWith('/api/')) {
    return await handleApiRequest(request, env);
  }
  
  // For non-API requests, pass through to static assets
  return context.next();
}

async function handleApiRequest(request, env) {
  const url = new URL(request.url);
  const path = url.pathname;
  const searchParams = url.searchParams;
  
  // Set CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };
  
  // Handle OPTIONS request for CORS
  if (request.method === 'OPTIONS') {
    return new Response(null, { headers });
  }
  
  try {
    // API key from environment variables
    const TMDB_API_KEY = env.TMDB_API_KEY || '3e1a609b697e9725ddd3c9e89b17d557'; // Fallback for development
    
    // Handle different API endpoints
    if (path.startsWith('/api/trending/')) {
      const type = path.split('/').pop();
      return await handleTrendingRequest(type, searchParams, TMDB_API_KEY, headers);
    } 
    else if (path === '/api/genres') {
      return await handleGenresRequest(TMDB_API_KEY, headers);
    }
    else if (path.startsWith('/api/movies/genre/')) {
      const id = path.split('/').pop();
      return await handleMoviesByGenreRequest(id, TMDB_API_KEY, headers);
    }
    else if (path === '/api/search') {
      const query = searchParams.get('query');
      return await handleSearchRequest(query, TMDB_API_KEY, headers);
    }
    else if (path.startsWith('/api/video/')) {
      const parts = path.split('/');
      const type = parts[parts.length - 2];
      const id = parts[parts.length - 1];
      const server = searchParams.get('server') || 'vidsrc.cc';
      return await handleVideoRequest(type, id, server, headers);
    }
    else if (path === '/api/movies/collection') {
      return await handleMoviesCollectionRequest(TMDB_API_KEY, headers);
    }
    else if (path === '/api/tv/collection') {
      return await handleTvCollectionRequest(TMDB_API_KEY, headers);
    }
    else if (path === '/api/anime/collection') {
      return await handleAnimeCollectionRequest(TMDB_API_KEY, headers);
    }
    
    // If no matching endpoint
    return new Response(JSON.stringify({ error: 'API endpoint not found' }), { 
      status: 404, 
      headers 
    });
    
  } catch (error) {
    console.error('API Error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { 
      status: 500, 
      headers 
    });
  }
}

// Handler functions for each API endpoint
async function handleTrendingRequest(type, searchParams, apiKey, headers) {
  console.log(`[API] Fetching trending ${type}`);
  const page = searchParams.get('page') || 1;
  
  // Fetch multiple pages and combine results
  const results = [];
  
  // Fetch trending items (page 1 and 2)
  for (let currentPage = 1; currentPage <= 2; currentPage++) {
    const response = await fetch(
      `https://api.themoviedb.org/3/trending/${type}/week?api_key=${apiKey}&page=${currentPage}`
    );
    const data = await response.json();
    if (data.results && data.results.length > 0) {
      results.push(...data.results);
    }
  }
  
  // For movies, also fetch popular and top_rated
  if (type === 'movie') {
    // Fetch popular movies
    const popularResponse = await fetch(
      `https://api.themoviedb.org/3/movie/popular?api_key=${apiKey}&page=1`
    );
    const popularData = await popularResponse.json();
    if (popularData.results && popularData.results.length > 0) {
      // Add media_type to each item
      popularData.results.forEach(item => item.media_type = 'movie');
      results.push(...popularData.results);
    }
    
    // Fetch top rated movies
    const topRatedResponse = await fetch(
      `https://api.themoviedb.org/3/movie/top_rated?api_key=${apiKey}&page=1`
    );
    const topRatedData = await topRatedResponse.json();
    if (topRatedData.results && topRatedData.results.length > 0) {
      // Add media_type to each item
      topRatedData.results.forEach(item => item.media_type = 'movie');
      results.push(...topRatedData.results);
    }
  }
  
  // For TV shows, also fetch popular
  if (type === 'tv') {
    // Fetch popular TV shows
    const popularResponse = await fetch(
      `https://api.themoviedb.org/3/tv/popular?api_key=${apiKey}&page=1`
    );
    const popularData = await popularResponse.json();
    if (popularData.results && popularData.results.length > 0) {
      // Add media_type to each item
      popularData.results.forEach(item => item.media_type = 'tv');
      results.push(...popularData.results);
    }
  }
  
  // Remove duplicates based on id
  const uniqueResults = Array.from(new Map(results.map(item => [item.id, item])).values());
  
  // Sort by popularity
  uniqueResults.sort((a, b) => b.popularity - a.popularity);
  
  console.log(`[API] Found ${uniqueResults.length} trending ${type} items`);
  return new Response(JSON.stringify({ results: uniqueResults }), { headers });
}

async function handleGenresRequest(apiKey, headers) {
  console.log(`[API] Fetching genres list`);
  const response = await fetch(
    `https://api.themoviedb.org/3/genre/movie/list?api_key=${apiKey}`
  );
  const data = await response.json();
  console.log(`[API] Found ${data.genres?.length || 0} genres`);
  return new Response(JSON.stringify(data), { headers });
}

async function handleMoviesByGenreRequest(id, apiKey, headers) {
  console.log(`[API] Fetching movies for genre ID: ${id}`);
  const results = [];
  
  // Fetch multiple pages of movies by genre
  for (let page = 1; page <= 3; page++) {
    const response = await fetch(
      `https://api.themoviedb.org/3/discover/movie?api_key=${apiKey}&with_genres=${id}&sort_by=popularity.desc&page=${page}`
    );
    const data = await response.json();
    
    if (data.results && data.results.length > 0) {
      // Add media_type to each item
      data.results.forEach(item => {
        item.media_type = 'movie';
      });
      results.push(...data.results);
    }
  }
  
  // Remove duplicates
  const uniqueResults = Array.from(new Map(results.map(item => [item.id, item])).values());
  
  // Sort by popularity
  uniqueResults.sort((a, b) => b.popularity - a.popularity);
  
  console.log(`[API] Found ${uniqueResults.length} movies for genre ID: ${id}`);
  return new Response(JSON.stringify({ results: uniqueResults }), { headers });
}

async function handleSearchRequest(query, apiKey, headers) {
  console.log(`[API] Searching for: "${query}"`);
  
  if (!query) {
    return new Response(JSON.stringify({ error: 'Query parameter is required' }), { 
      status: 400, 
      headers 
    });
  }
  
  // Fetch multiple pages of search results
  const results = [];
  
  // Search movies (2 pages)
  for (let page = 1; page <= 2; page++) {
    const movieResponse = await fetch(
      `https://api.themoviedb.org/3/search/movie?api_key=${apiKey}&query=${encodeURIComponent(query)}&page=${page}`
    );
    const movieData = await movieResponse.json();
    
    if (movieData.results && movieData.results.length > 0) {
      // Add media_type to each item
      movieData.results.forEach(item => {
        item.media_type = 'movie';
        
        // Add a relevance score based on title match
        const title = item.title.toLowerCase();
        const searchQuery = query.toLowerCase();
        
        // Exact match gets highest score
        if (title === searchQuery) {
          item.relevance_score = 100;
        } 
        // Starts with query gets high score
        else if (title.startsWith(searchQuery)) {
          item.relevance_score = 90;
        }
        // Contains query as a whole word gets medium score
        else if (new RegExp(`\\b${searchQuery}\\b`, 'i').test(title)) {
          item.relevance_score = 80;
        }
        // Contains query gets lower score
        else if (title.includes(searchQuery)) {
          item.relevance_score = 70;
        }
        // Default score based on popularity
        else {
          item.relevance_score = 50;
        }
      });
      results.push(...movieData.results);
    }
  }
  
  // Search TV shows (1 page)
  const tvResponse = await fetch(
    `https://api.themoviedb.org/3/search/tv?api_key=${apiKey}&query=${encodeURIComponent(query)}`
  );
  const tvData = await tvResponse.json();
  
  if (tvData.results && tvData.results.length > 0) {
    // Add media_type to each item
    tvData.results.forEach(item => {
      item.media_type = 'tv';
      
      // Add a relevance score based on title match
      const title = (item.name || '').toLowerCase();
      const searchQuery = query.toLowerCase();
      
      // Exact match gets highest score
      if (title === searchQuery) {
        item.relevance_score = 100;
      } 
      // Starts with query gets high score
      else if (title.startsWith(searchQuery)) {
        item.relevance_score = 90;
      }
      // Contains query as a whole word gets medium score
      else if (new RegExp(`\\b${searchQuery}\\b`, 'i').test(title)) {
        item.relevance_score = 80;
      }
      // Contains query gets lower score
      else if (title.includes(searchQuery)) {
        item.relevance_score = 70;
      }
      // Default score based on popularity
      else {
        item.relevance_score = 50;
      }
    });
    results.push(...tvData.results);
  }
  
  // Remove duplicates
  const uniqueResults = Array.from(new Map(results.map(item => [item.id, item])).values());
  
  // Sort by relevance score first, then by popularity
  uniqueResults.sort((a, b) => {
    // First sort by relevance score
    if (b.relevance_score !== a.relevance_score) {
      return b.relevance_score - a.relevance_score;
    }
    // If relevance scores are equal, sort by popularity
    return b.popularity - a.popularity;
  });
  
  console.log(`[API] Found ${uniqueResults.length} search results for: "${query}"`);
  return new Response(JSON.stringify({ results: uniqueResults }), { headers });
}

async function handleVideoRequest(type, id, server, headers) {
  console.log(`[API] Fetching video sources for ${type} ID: ${id}`);
  
  // Return the video source information
  // This is just the URL structure, not the actual video content
  let embedURL = "";
  
  if (server === 'vidsrc.me') {
    embedURL = `https://vidsrc.me/embed/${type}?tmdb=${id}`;
  } else if (server === 'vidsrc.cc') {
    embedURL = `https://vidsrc.cc/embed/${type}/${id}`;
  } else {
    embedURL = `https://player.videasy.net/${type}/${id}`;
  }
  
  console.log(`[API] Found video source for ${type} ID: ${id}`);
  return new Response(JSON.stringify({ embedURL }), { headers });
}

async function handleMoviesCollectionRequest(apiKey, headers) {
  console.log(`[API] Fetching movie collection`);
  const results = [];
  
  // 1. Popular movies (5 pages)
  for (let currentPage = 1; currentPage <= 5; currentPage++) {
    const popularResponse = await fetch(
      `https://api.themoviedb.org/3/movie/popular?api_key=${apiKey}&page=${currentPage}`
    );
    const popularData = await popularResponse.json();
    
    if (popularData.results && popularData.results.length > 0) {
      popularData.results.forEach(item => {
        item.media_type = 'movie';
      });
      results.push(...popularData.results);
    }
  }
  
  // 2. Top rated movies (3 pages)
  for (let currentPage = 1; currentPage <= 3; currentPage++) {
    const topRatedResponse = await fetch(
      `https://api.themoviedb.org/3/movie/top_rated?api_key=${apiKey}&page=${currentPage}`
    );
    const topRatedData = await topRatedResponse.json();
    
    if (topRatedData.results && topRatedData.results.length > 0) {
      topRatedData.results.forEach(item => {
        item.media_type = 'movie';
      });
      results.push(...topRatedData.results);
    }
  }
  
  // 3. Now playing movies (2 pages)
  for (let currentPage = 1; currentPage <= 2; currentPage++) {
    const nowPlayingResponse = await fetch(
      `https://api.themoviedb.org/3/movie/now_playing?api_key=${apiKey}&page=${currentPage}`
    );
    const nowPlayingData = await nowPlayingResponse.json();
    
    if (nowPlayingData.results && nowPlayingData.results.length > 0) {
      nowPlayingData.results.forEach(item => {
        item.media_type = 'movie';
      });
      results.push(...nowPlayingData.results);
    }
  }
  
  // 4. Upcoming movies (2 pages)
  for (let currentPage = 1; currentPage <= 2; currentPage++) {
    const upcomingResponse = await fetch(
      `https://api.themoviedb.org/3/movie/upcoming?api_key=${apiKey}&page=${currentPage}`
    );
    const upcomingData = await upcomingResponse.json();
    
    if (upcomingData.results && upcomingData.results.length > 0) {
      upcomingData.results.forEach(item => {
        item.media_type = 'movie';
      });
      results.push(...upcomingData.results);
    }
  }
  
  // Remove duplicates based on id
  const uniqueResults = Array.from(new Map(results.map(item => [item.id, item])).values());
  
  // Sort by popularity
  uniqueResults.sort((a, b) => b.popularity - a.popularity);
  
  console.log(`[API] Found ${uniqueResults.length} movies in collection`);
  return new Response(JSON.stringify({ results: uniqueResults }), { headers });
}

async function handleTvCollectionRequest(apiKey, headers) {
  console.log(`[API] Fetching TV collection`);
  const results = [];
  
  // 1. Popular TV shows (4 pages)
  for (let currentPage = 1; currentPage <= 4; currentPage++) {
    const popularResponse = await fetch(
      `https://api.themoviedb.org/3/tv/popular?api_key=${apiKey}&page=${currentPage}`
    );
    const popularData = await popularResponse.json();
    
    if (popularData.results && popularData.results.length > 0) {
      popularData.results.forEach(item => {
        item.media_type = 'tv';
      });
      results.push(...popularData.results);
    }
  }
  
  // 2. Top rated TV shows (3 pages)
  for (let currentPage = 1; currentPage <= 3; currentPage++) {
    const topRatedResponse = await fetch(
      `https://api.themoviedb.org/3/tv/top_rated?api_key=${apiKey}&page=${currentPage}`
    );
    const topRatedData = await topRatedResponse.json();
    
    if (topRatedData.results && topRatedData.results.length > 0) {
      topRatedData.results.forEach(item => {
        item.media_type = 'tv';
      });
      results.push(...topRatedData.results);
    }
  }
  
  // 3. TV shows airing today (2 pages)
  for (let currentPage = 1; currentPage <= 2; currentPage++) {
    const airingResponse = await fetch(
      `https://api.themoviedb.org/3/tv/airing_today?api_key=${apiKey}&page=${currentPage}`
    );
    const airingData = await airingResponse.json();
    
    if (airingData.results && airingData.results.length > 0) {
      airingData.results.forEach(item => {
        item.media_type = 'tv';
      });
      results.push(...airingData.results);
    }
  }
  
  // Remove duplicates based on id
  const uniqueResults = Array.from(new Map(results.map(item => [item.id, item])).values());
  
  // Sort by popularity
  uniqueResults.sort((a, b) => b.popularity - a.popularity);
  
  console.log(`[API] Found ${uniqueResults.length} TV shows in collection`);
  return new Response(JSON.stringify({ results: uniqueResults }), { headers });
}

async function handleAnimeCollectionRequest(apiKey, headers) {
  console.log(`[API] Fetching anime collection`);
  const results = [];
  // Animation genre ID is 16
  const animationGenreId = 16;
  
  // Fetch 5 pages of animation TV shows
  for (let currentPage = 1; currentPage <= 5; currentPage++) {
    const response = await fetch(
      `https://api.themoviedb.org/3/discover/tv?api_key=${apiKey}&with_genres=${animationGenreId}&sort_by=popularity.desc&page=${currentPage}`
    );
    const data = await response.json();
    
    if (data.results && data.results.length > 0) {
      data.results.forEach(item => {
        item.media_type = 'tv';
      });
      results.push(...data.results);
    }
  }
  
  // Also fetch animation movies (2 pages)
  for (let currentPage = 1; currentPage <= 2; currentPage++) {
    const response = await fetch(
      `https://api.themoviedb.org/3/discover/movie?api_key=${apiKey}&with_genres=${animationGenreId}&sort_by=popularity.desc&page=${currentPage}`
    );
    const data = await response.json();
    
    if (data.results && data.results.length > 0) {
      data.results.forEach(item => {
        item.media_type = 'movie';
      });
      results.push(...data.results);
    }
  }
  
  // Remove duplicates based on id
  const uniqueResults = Array.from(new Map(results.map(item => [item.id, item])).values());
  
  // Sort by popularity
  uniqueResults.sort((a, b) => b.popularity - a.popularity);
  
  console.log(`[API] Found ${uniqueResults.length} anime items in collection`);
  return new Response(JSON.stringify({ results: uniqueResults }), { headers });
}
