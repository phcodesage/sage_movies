// --- Netflix Style Animations and UI Enhancements ---
// Navbar background on scroll
window.addEventListener('scroll', function() {
  const navbar = document.querySelector('.navbar');
  if (window.scrollY > 50) {
    navbar.classList.add('navbar-scrolled');
  } else {
    navbar.classList.remove('navbar-scrolled');
  }
});

// Global variables
const IMG_URL = 'https://image.tmdb.org/t/p/original';
let currentItem;
let allMovies = [];
let bannerMovie = null;

// Show movie details in fullscreen view
function showDetails(item) {
  // Store current item for server switching
  currentItem = item;
  
  // Hide main UI
  document.body.classList.add('overflow-hidden');
  document.getElementById('movie-detail').classList.remove('hidden');
  document.getElementById('movie-detail').classList.add('flex');

  // Populate detail section
  document.getElementById('detail-title').textContent = item.title || item.name;
  document.getElementById('detail-description').textContent = item.overview || '';
  document.getElementById('detail-rating').textContent = item.vote_average ? `★ ${item.vote_average.toFixed(1)}` : '';
  document.getElementById('detail-release').textContent = item.release_date ? `Released: ${item.release_date}` : '';
  document.getElementById('detail-poster').src = item.poster_path ? `${IMG_URL}${item.poster_path}` : '';

  // Genres
  let genres = [];
  if (item.genre_ids && window.SAGE_MOVIES_CONFIG && window.SAGE_MOVIES_CONFIG.GENRES) {
    genres = item.genre_ids.map(id => window.SAGE_MOVIES_CONFIG.GENRES[id]).filter(Boolean);
  } else if (item.genres && Array.isArray(item.genres)) {
    genres = item.genres.map(g => g.name);
  }
  document.getElementById('detail-genres').textContent = genres.length ? genres.join(', ') : '';

  // Set media type if not present
  if (!item.media_type) {
    // Try to determine media type from context
    if (item.first_air_date) {
      item.media_type = 'tv';
    } else if (item.release_date) {
      item.media_type = 'movie';
    } else {
      item.media_type = 'movie'; // Default to movie
    }
  }
  
  // Change server (this will set the video URL)
  changeServer();
}

// Change video server
async function changeServer() {
  const server = document.getElementById('server-select').value;
  const type = currentItem.media_type === "tv" ? "tv" : "movie";
  
  try {
    // Get embed URL from our server
    const response = await fetch(`/api/video-sources/${type}/${currentItem.id}?server=${server}`);
    const data = await response.json();
    
    // Set the iframe source
    document.getElementById('detail-video').src = data.embedURL;
  } catch (error) {
    console.error('Error changing server:', error);
  }
}

// Close movie detail view
function closeMovieDetail() {
  document.body.classList.remove('overflow-hidden');
  document.getElementById('movie-detail').classList.add('hidden');
  document.getElementById('movie-detail').classList.remove('flex');
  document.getElementById('detail-video').src = '';
}

// Show search modal with fade animation
function openSearchModal() {
  const modal = document.getElementById('search-modal');
  modal.style.display = 'flex';
  setTimeout(() => modal.classList.add('show'), 10);
  document.getElementById('search-input').focus();
}

// Close search modal
function closeSearchModal() {
  const modal = document.getElementById('search-modal');
  modal.classList.remove('show');
  setTimeout(() => {
    modal.style.display = 'none';
    document.getElementById('search-results').innerHTML = '';
    document.getElementById('search-loading').classList.add('hidden');
    document.getElementById('search-no-results').classList.add('hidden');
    document.getElementById('search-input').value = '';
  }, 300);
}

// --- Enhanced: Animate posters on load ---
function animatePosters() {
  document.querySelectorAll('.list img').forEach((img, idx) => {
    img.style.opacity = '0';
    img.style.animationDelay = (0.1 + idx * 0.07) + 's';
    img.classList.add('animated-poster');
  });
}

// --- Carousel Logic for All Lists ---
function setupCarousel(listId, leftBtnId, rightBtnId) {
  const list = document.getElementById(listId);
  const leftBtn = document.getElementById(leftBtnId);
  const rightBtn = document.getElementById(rightBtnId);
  
  if (!list || !leftBtn || !rightBtn) return;
  
  let itemWidth = 220; // Default poster width + margin
  
  function updateScrollAmount() {
    const firstImg = list.querySelector('img');
    if (firstImg) {
      itemWidth = firstImg.offsetWidth + 20;
    }
  }
  
  leftBtn.onclick = () => {
    updateScrollAmount();
    list.scrollLeft -= itemWidth * 3;
  };
  
  rightBtn.onclick = () => {
    updateScrollAmount();
    list.scrollLeft += itemWidth * 3;
  };
  
  // Disable mouse wheel horizontal scroll
  list.addEventListener('wheel', (e) => {
    if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
      e.preventDefault();
    }
  }, { passive: false });
  
  // Also disable touch horizontal scroll
  list.addEventListener('touchmove', (e) => {
    if (e.touches.length === 1) {
      e.preventDefault();
    }
  }, { passive: false });
}

// Initialize all carousels
function setupAllCarousels() {
  setupCarousel('movies-list', 'movies-left-btn', 'movies-right-btn');
  setupCarousel('tvshows-list', 'tvshows-left-btn', 'tvshows-right-btn');
  setupCarousel('anime-list', 'anime-left-btn', 'anime-right-btn');
}

document.addEventListener('DOMContentLoaded', setupAllCarousels);

// Display banner with movie info
function displayBanner(item) {
  bannerMovie = item;
  document.getElementById('banner').style.backgroundImage = `url(${IMG_URL}${item.backdrop_path})`;
  document.getElementById('banner-title').textContent = item.title || item.name;
}

// Banner play button
document.addEventListener('DOMContentLoaded', () => {
  const playBtn = document.querySelector('.banner-btn.play');
  if (playBtn) {
    playBtn.onclick = () => {
      if (bannerMovie) showDetails(bannerMovie);
    };
  }
});

// Display movies/shows in a container
function displayList(items, containerId, isFiltered = false) {
  const container = document.getElementById(containerId);
  const countSpan = document.getElementById('movies-count');
  const noMoviesMsg = document.getElementById('no-movies-message');
  
  if (containerId === 'movies-list') {
    if (countSpan) countSpan.textContent = `(${items.length})`;
    if (noMoviesMsg) {
      if (items.length === 0 && isFiltered) {
        noMoviesMsg.classList.remove('hidden');
        noMoviesMsg.textContent = 'No movies found for this genre.';
      } else {
        noMoviesMsg.classList.add('hidden');
        noMoviesMsg.textContent = '';
      }
    }
  }
  
  container.innerHTML = '';
  items.forEach(item => {
    if (!item.poster_path) return;
    
    const img = document.createElement('img');
    img.src = `${IMG_URL}${item.poster_path}`;
    img.alt = item.title || item.name;
    img.className = 'w-36 md:w-44 rounded-md shadow-lg cursor-pointer transition-all duration-300 hover:scale-110';
    img.onclick = () => showDetails(item);
    container.appendChild(img);
  });
  
  animatePosters();
}

// --- Genre Filter Functionality ---
async function fetchGenres() {
  try {
    const res = await fetch('/api/genres');
    const data = await res.json();
    
    // Store genres globally
    window.SAGE_MOVIES_CONFIG = window.SAGE_MOVIES_CONFIG || {};
    window.SAGE_MOVIES_CONFIG.GENRES = {};
    data.genres.forEach(g => { window.SAGE_MOVIES_CONFIG.GENRES[g.id] = g.name; });
    
    // Populate genre dropdown
    const genreSelect = document.getElementById('genre-select');
    data.genres.forEach(genre => {
      const option = document.createElement('option');
      option.value = genre.id;
      option.textContent = genre.name;
      genreSelect.appendChild(option);
    });
  } catch (error) {
    console.error('Error fetching genres:', error);
  }
}

// Filter movies by genre
function filterByGenre() {
  const genreId = document.getElementById('genre-select').value;
  let filtered = allMovies;
  
  if (genreId && genreId !== "") {
    filtered = allMovies.filter(movie => movie.genre_ids && movie.genre_ids.includes(Number(genreId)));
  }
  
  displayList(filtered, 'movies-list', genreId !== "");
}

// Search TMDB
async function searchTMDB() {
  const query = document.getElementById('search-input').value;
  const resultsContainer = document.getElementById('search-results');
  const loadingElement = document.getElementById('search-loading');
  const noResultsElement = document.getElementById('search-no-results');
  
  // Clear previous results
  resultsContainer.innerHTML = '';
  
  // Hide no results message
  noResultsElement.classList.add('hidden');
  
  // If empty query, hide everything and return
  if (!query.trim()) {
    loadingElement.classList.add('hidden');
    return;
  }
  
  // Show loading skeleton
  loadingElement.classList.remove('hidden');
  resultsContainer.classList.add('hidden');
  
  try {
    // Add a small delay to show loading state (min 500ms)
    const startTime = Date.now();
    const res = await fetch(`/api/search?query=${encodeURIComponent(query)}`);
    const data = await res.json();
    
    // Ensure loading shows for at least 500ms for better UX
    const elapsedTime = Date.now() - startTime;
    if (elapsedTime < 500) {
      await new Promise(resolve => setTimeout(resolve, 500 - elapsedTime));
    }
    
    // Hide loading skeleton
    loadingElement.classList.add('hidden');
    resultsContainer.classList.remove('hidden');
    
    // Check if we have results
    if (!data.results || data.results.length === 0 || !data.results.some(item => item.poster_path)) {
      noResultsElement.classList.remove('hidden');
      return;
    }
    
    // Display results
    data.results.forEach(item => {
      if (!item.title && !item.name) return;
      
      // Create result card container
      const card = document.createElement('div');
      card.className = 'flex flex-col';
      
      // Create skeleton placeholder that will be replaced by image
      const skeletonDiv = document.createElement('div');
      skeletonDiv.className = 'bg-gray-700 rounded-md aspect-[2/3] w-full animate-pulse';
      
      // Create image that will replace skeleton when loaded
      const img = document.createElement('img');
      img.src = item.poster_path ? `${IMG_URL}${item.poster_path}` : '';
      img.alt = item.title || item.name;
      img.className = 'w-full rounded-md shadow-lg cursor-pointer transition-all duration-300 hover:scale-105 hidden';
      
      // Add title below the image
      const title = document.createElement('p');
      title.className = 'text-sm mt-2 text-white truncate';
      title.textContent = item.title || item.name;
      
      // Handle image load
      img.onload = () => {
        skeletonDiv.remove();
        img.classList.remove('hidden');
      };
      
      // Handle image error
      img.onerror = () => {
        // Keep skeleton but remove animation
        skeletonDiv.classList.remove('animate-pulse');
        skeletonDiv.classList.add('bg-gray-800');
        
        // Add a placeholder icon
        const iconDiv = document.createElement('div');
        iconDiv.className = 'flex items-center justify-center h-full';
        iconDiv.innerHTML = '<i class="fas fa-film text-gray-600 text-3xl"></i>';
        skeletonDiv.appendChild(iconDiv);
      };
      
      // Set click handler for the entire card
      card.onclick = () => {
        closeSearchModal();
        showDetails(item);
      };
      
      // Add elements to card
      card.appendChild(skeletonDiv);
      card.appendChild(img);
      card.appendChild(title);
      
      // Add card to results container
      resultsContainer.appendChild(card);
    });
  } catch (error) {
    console.error('Error searching:', error);
    loadingElement.classList.add('hidden');
    resultsContainer.classList.remove('hidden');
    noResultsElement.classList.remove('hidden');
  }
}

// Fetch trending movies
async function fetchTrending(type) {
  try {
    const res = await fetch(`/api/trending/${type}`);
    const data = await res.json();
    return data.results;
  } catch (error) {
    console.error(`Error fetching trending ${type}:`, error);
    return [];
  }
}

// Fetch trending anime (TV shows with anime genre)
async function fetchTrendingAnime() {
  try {
    let allResults = [];
    const res = await fetch('/api/trending/tv');
    const data = await res.json();
    
    // Filter for Japanese language and animation genre (16)
    const filtered = data.results.filter(item =>
      item.original_language === 'ja' && item.genre_ids && item.genre_ids.includes(16)
    );
    
    return filtered;
  } catch (error) {
    console.error('Error fetching anime:', error);
    return [];
  }
}

// Initialize the app
async function init() {
  try {
    await fetchGenres();
    
    const movies = await fetchTrending('movie');
    allMovies = movies;
    
    const tvShows = await fetchTrending('tv');
    const anime = await fetchTrendingAnime();
    
    if (movies.length > 0) {
      displayBanner(movies[Math.floor(Math.random() * movies.length)]);
    }
    
    displayList(movies, 'movies-list');
    displayList(tvShows, 'tvshows-list');
    displayList(anime, 'anime-list');
  } catch (error) {
    console.error('Error initializing app:', error);
  }
}

// Start the app
init();
