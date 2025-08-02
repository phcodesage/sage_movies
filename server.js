import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import fetch from 'node-fetch';

// Initialize environment variables
dotenv.config();

// Set up __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware to log all requests
app.use((req, res, next) => {
  const start = Date.now();
  
  // Log when the request completes
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms`);
  });
  
  next();
});

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// API proxy routes to protect API key
app.get('/api/trending/:type', async (req, res) => {
  try {
    const { type } = req.params;
    const { page = 1 } = req.query;
    
    console.log(`[API] Fetching trending ${type}, page ${page}`);
    
    // Fetch multiple pages and combine results
    const results = [];
    
    // Fetch trending items (page 1 and 2)
    for (let currentPage = 1; currentPage <= 2; currentPage++) {
      const response = await fetch(
        `https://api.themoviedb.org/3/trending/${type}/week?api_key=${process.env.TMDB_API_KEY}&page=${currentPage}`
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
        `https://api.themoviedb.org/3/movie/popular?api_key=${process.env.TMDB_API_KEY}&page=1`
      );
      const popularData = await popularResponse.json();
      if (popularData.results && popularData.results.length > 0) {
        // Add media_type to each item
        popularData.results.forEach(item => item.media_type = 'movie');
        results.push(...popularData.results);
      }
      
      // Fetch top rated movies
      const topRatedResponse = await fetch(
        `https://api.themoviedb.org/3/movie/top_rated?api_key=${process.env.TMDB_API_KEY}&page=1`
      );
      const topRatedData = await topRatedResponse.json();
      if (topRatedData.results && topRatedData.results.length > 0) {
        // Add media_type to each item
        topRatedData.results.forEach(item => item.media_type = 'movie');
        results.push(...topRatedData.results);
      }
    }
    
    // For TV shows, also fetch popular and top_rated
    if (type === 'tv') {
      // Fetch popular TV shows
      const popularResponse = await fetch(
        `https://api.themoviedb.org/3/tv/popular?api_key=${process.env.TMDB_API_KEY}&page=1`
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
    res.json({ results: uniqueResults });
  } catch (error) {
    console.error('Error fetching trending data:', error);
    res.status(500).json({ error: 'Failed to fetch data' });
  }
});

app.get('/api/genres', async (req, res) => {
  try {
    console.log(`[API] Fetching genres list`);
    const response = await fetch(
      `https://api.themoviedb.org/3/genre/movie/list?api_key=${process.env.TMDB_API_KEY}`
    );
    const data = await response.json();
    console.log(`[API] Found ${data.genres?.length || 0} genres`);
    res.json(data);
  } catch (error) {
    console.error('Error fetching genres:', error);
    res.status(500).json({ error: 'Failed to fetch genres' });
  }
});

app.get('/api/movies/genre/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`[API] Fetching movies for genre ID: ${id}`);
    const results = [];
    
    // Fetch multiple pages of movies by genre
    for (let page = 1; page <= 3; page++) {
      const response = await fetch(
        `https://api.themoviedb.org/3/discover/movie?api_key=${process.env.TMDB_API_KEY}&with_genres=${id}&sort_by=popularity.desc&page=${page}`
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
    res.json({ results: uniqueResults });
  } catch (error) {
    console.error('Error fetching movies by genre:', error);
    res.status(500).json({ error: 'Failed to fetch movies by genre' });
  }
});

app.get('/api/search', async (req, res) => {
  try {
    const { query } = req.query;
    
    console.log(`[API] Searching for: "${query}"`);
    
    if (!query) {
      console.log(`[API] Search rejected: Empty query`);
      return res.status(400).json({ error: 'Query parameter is required' });
    }
    
    // Fetch multiple pages of search results
    const results = [];
    
    // Search movies (2 pages)
    for (let page = 1; page <= 2; page++) {
      const movieResponse = await fetch(
        `https://api.themoviedb.org/3/search/movie?api_key=${process.env.TMDB_API_KEY}&query=${encodeURIComponent(query)}&page=${page}`
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
      `https://api.themoviedb.org/3/search/tv?api_key=${process.env.TMDB_API_KEY}&query=${encodeURIComponent(query)}`
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
    res.json({ results: uniqueResults });
  } catch (error) {
    console.error('Error searching TMDB:', error);
    res.status(500).json({ error: 'Failed to search TMDB' });
  }
});

// Video sources proxy
app.get('/api/video-sources/:type/:id', async (req, res) => {
  try {
    const { type, id } = req.params;
    const { server = 'vidsrc.cc' } = req.query;
    
    console.log(`[API] Fetching video sources for ${type} ID: ${id} using server: ${server}`);
    
    // Validate parameters
    if (!type || !id || !['movie', 'tv'].includes(type)) {
      return res.status(400).json({ error: 'Invalid parameters' });
    }
    
    let embedURL = "";
    
    // Multiple reliable server options
    switch(server) {
      case "vidsrc.cc":
        embedURL = `https://vidsrc.cc/v2/embed/${type}/${id}`;
        break;
      case "vidsrc.me":
        embedURL = `https://vidsrc.net/embed/${type}/?tmdb=${id}`;
        break;
      case "vidsrc.pro":
        embedURL = `https://vidsrc.pro/embed/${type}/${id}`;
        break;
      case "embedsu":
        embedURL = `https://embed.su/embed/${type}/${id}`;
        break;
      case "2embed":
        embedURL = `https://www.2embed.cc/embed/${type}/${id}`;
        break;
      case "moviesapi":
        embedURL = `https://moviesapi.club/movie/${id}`;
        break;
      case "superembed":
        embedURL = `https://multiembed.mov/?video_id=${id}&tmdb=1`;
        break;
      case "player.videasy.net":
      default:
        const mediaType = type === 'tv' ? 'show' : 'movie';
        embedURL = `https://player.videasy.net/embed/${mediaType}/${id}`;
        break;
    }
    
    // Add anti-popup parameters where applicable
    if (server === 'player.videasy.net') {
      embedURL += '?ads_behavior=background&popup_mode=quiet';
    }
    
    console.log(`[API] Generated embed URL: ${embedURL}`);
    res.json({ embedURL });
  } catch (error) {
    console.error('Error getting video sources:', error);
    res.status(500).json({ error: 'Failed to get video sources' });
  }
});

// Create a new endpoint for fetching a large collection of movies
app.get('/api/movies/collection', async (req, res) => {
  try {
    const { page = 1 } = req.query;
    console.log(`[API] Fetching movie collection`);
    const results = [];
    
    // Fetch multiple sources to create a comprehensive collection
    
    // 1. Popular movies (5 pages)
    for (let currentPage = 1; currentPage <= 5; currentPage++) {
      const popularResponse = await fetch(
        `https://api.themoviedb.org/3/movie/popular?api_key=${process.env.TMDB_API_KEY}&page=${currentPage}`
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
        `https://api.themoviedb.org/3/movie/top_rated?api_key=${process.env.TMDB_API_KEY}&page=${currentPage}`
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
        `https://api.themoviedb.org/3/movie/now_playing?api_key=${process.env.TMDB_API_KEY}&page=${currentPage}`
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
        `https://api.themoviedb.org/3/movie/upcoming?api_key=${process.env.TMDB_API_KEY}&page=${currentPage}`
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
    res.json({ results: uniqueResults });
  } catch (error) {
    console.error('Error fetching movie collection:', error);
    res.status(500).json({ error: 'Failed to fetch movie collection' });
  }
});

// Create a new endpoint for fetching a large collection of TV shows
app.get('/api/tv/collection', async (req, res) => {
  try {
    const { page = 1 } = req.query;
    console.log(`[API] Fetching TV collection`);
    const results = [];
    
    // 1. Popular TV shows (4 pages)
    for (let currentPage = 1; currentPage <= 4; currentPage++) {
      const popularResponse = await fetch(
        `https://api.themoviedb.org/3/tv/popular?api_key=${process.env.TMDB_API_KEY}&page=${currentPage}`
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
        `https://api.themoviedb.org/3/tv/top_rated?api_key=${process.env.TMDB_API_KEY}&page=${currentPage}`
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
        `https://api.themoviedb.org/3/tv/airing_today?api_key=${process.env.TMDB_API_KEY}&page=${currentPage}`
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
    res.json({ results: uniqueResults });
  } catch (error) {
    console.error('Error fetching TV collection:', error);
    res.status(500).json({ error: 'Failed to fetch TV collection' });
  }
});

// Create a new endpoint for fetching anime (using TV shows with animation genre)
app.get('/api/anime/collection', async (req, res) => {
  try {
    console.log(`[API] Fetching anime collection`);
    const results = [];
    // Animation genre ID is 16
    const animationGenreId = 16;
    
    // Fetch 5 pages of animation TV shows
    for (let currentPage = 1; currentPage <= 5; currentPage++) {
      const response = await fetch(
        `https://api.themoviedb.org/3/discover/tv?api_key=${process.env.TMDB_API_KEY}&with_genres=${animationGenreId}&sort_by=popularity.desc&page=${currentPage}`
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
        `https://api.themoviedb.org/3/discover/movie?api_key=${process.env.TMDB_API_KEY}&with_genres=${animationGenreId}&sort_by=popularity.desc&page=${currentPage}`
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
    res.json({ results: uniqueResults });
  } catch (error) {
    console.error('Error fetching anime collection:', error);
    res.status(500).json({ error: 'Failed to fetch anime collection' });
  }
});

// Video sources endpoint to handle ad configuration
app.get('/api/video-sources/:type/:id', async (req, res) => {
  try {
    const { type, id } = req.params;
    const { server = 'player.videasy.net' } = req.query;
    
    console.log(`[API] Fetching video source for ${type}/${id} using server: ${server}`);
    
    // Validate parameters
    if (!type || !id || !['movie', 'tv'].includes(type)) {
      return res.status(400).json({ error: 'Invalid parameters' });
    }
    
    // Construct embed URL based on server
    let embedURL = '';
    
    if (server === 'player.videasy.net') {
      // Format for player.videasy.net
      const mediaType = type === 'tv' ? 'show' : 'movie';
      embedURL = `https://player.videasy.net/embed/${mediaType}/${id}`;
    } else {
      // Default fallback
      embedURL = `https://player.videasy.net/embed/${type === 'tv' ? 'show' : 'movie'}/${id}`;
    }
    
    // Add ad configuration parameters
    embedURL += '?ads_behavior=background&popup_mode=quiet';
    
    console.log(`[API] Generated embed URL: ${embedURL}`);
    res.json({ embedURL });
  } catch (error) {
    console.error('Error generating video source:', error);
    res.status(500).json({ error: 'Failed to generate video source' });
  }
});

// Serve the main app for any other route
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start the server
app.listen(PORT, () => {
  console.log(`[SERVER] Server started on http://localhost:${PORT}`);
  console.log(`[SERVER] Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`[SERVER] Press Ctrl+C to stop the server`);
});

// Add this new endpoint for server health checking
app.get('/api/server-status', async (req, res) => {
  const servers = [
    { name: 'vidsrc.cc', url: 'https://vidsrc.cc' },
    { name: 'vidsrc.me', url: 'https://vidsrc.net' },
    { name: 'vidsrc.pro', url: 'https://vidsrc.pro' },
    { name: 'embedsu', url: 'https://embed.su' },
    { name: '2embed', url: 'https://www.2embed.cc' },
    { name: 'player.videasy.net', url: 'https://player.videasy.net' }
  ];
  
  const serverStatus = await Promise.allSettled(
    servers.map(async (server) => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        
        const response = await fetch(server.url, {
          method: 'HEAD',
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        return { name: server.name, status: response.ok ? 'online' : 'offline' };
      } catch (error) {
        return { name: server.name, status: 'offline' };
      }
    })
  );
  
  const results = serverStatus.map(result => 
    result.status === 'fulfilled' ? result.value : { name: 'unknown', status: 'error' }
  );
  
  res.json({ servers: results });
});
