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

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// API proxy routes to protect API key
app.get('/api/trending/:type', async (req, res) => {
  try {
    const { type } = req.params;
    const response = await fetch(
      `https://api.themoviedb.org/3/trending/${type}/week?api_key=${process.env.TMDB_API_KEY}`
    );
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Error fetching trending data:', error);
    res.status(500).json({ error: 'Failed to fetch data' });
  }
});

app.get('/api/genres', async (req, res) => {
  try {
    const response = await fetch(
      `https://api.themoviedb.org/3/genre/movie/list?api_key=${process.env.TMDB_API_KEY}`
    );
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Error fetching genres:', error);
    res.status(500).json({ error: 'Failed to fetch genres' });
  }
});

app.get('/api/search', async (req, res) => {
  try {
    const { query } = req.query;
    const response = await fetch(
      `https://api.themoviedb.org/3/search/multi?api_key=${process.env.TMDB_API_KEY}&query=${query}`
    );
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Error searching:', error);
    res.status(500).json({ error: 'Failed to search' });
  }
});

// Video sources proxy
app.get('/api/video-sources/:type/:id', async (req, res) => {
  try {
    const { type, id } = req.params;
    const { server } = req.query;
    
    // Return the video source information
    // This is just the URL structure, not the actual video content
    let embedURL = "";
    
    if (server === "vidsrc.cc") {
      embedURL = `https://vidsrc.cc/v2/embed/${type}/${id}`;
    } else if (server === "vidsrc.me") {
      embedURL = `https://vidsrc.net/embed/${type}/?tmdb=${id}`;
    } else if (server === "player.videasy.net") {
      embedURL = `https://player.videasy.net/${type}/${id}`;
    }
    
    res.json({ embedURL });
  } catch (error) {
    console.error('Error getting video sources:', error);
    res.status(500).json({ error: 'Failed to get video sources' });
  }
});

// Serve the main app for any other route
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
