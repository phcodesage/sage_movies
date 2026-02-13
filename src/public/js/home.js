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

// Keyboard navigation support
document.addEventListener('keydown', function(e) {
  // ESC key to close modals
  if (e.key === 'Escape') {
    const searchModal = document.getElementById('search-modal');
    const movieDetail = document.getElementById('movie-detail');
    
    if (searchModal && !searchModal.classList.contains('hidden')) {
      closeSearchModal();
    } else if (movieDetail && !movieDetail.classList.contains('hidden')) {
      closeMovieDetail();
    }
  }
  
  // Enter key to trigger search button
  if (e.key === 'Enter' && e.target.id === 'search-input') {
    e.preventDefault();
    searchTMDB();
  }
  
  // Tab navigation enhancement
  if (e.key === 'Tab') {
    // Handle carousel navigation with arrow keys when focused
    const activeElement = document.activeElement;
    if (activeElement.classList.contains('carousel-btn')) {
      if (e.shiftKey && e.key === 'Tab') {
        // Shift+Tab behavior
        e.preventDefault();
      }
    }
  }
  
  // Arrow key navigation for carousels
  if (['ArrowLeft', 'ArrowRight'].includes(e.key)) {
    const activeElement = document.activeElement;
    if (activeElement.classList.contains('carousel-btn')) {
      e.preventDefault();
      if (e.key === 'ArrowLeft') {
        activeElement.previousElementSibling?.click();
      } else {
        activeElement.nextElementSibling?.click();
      }
    }
  }
});

// Focus management for modals
function trapFocus(element) {
  const focusableElements = element.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );
  const firstElement = focusableElements[0];
  const lastElement = focusableElements[focusableElements.length - 1];
  
  element.addEventListener('keydown', function(e) {
    if (e.key === 'Tab') {
      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          lastElement.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === lastElement) {
          firstElement.focus();
          e.preventDefault();
        }
      }
    }
  });
  
  // Focus the first element when modal opens
  setTimeout(() => firstElement?.focus(), 100);
}

// --- Continue Watching (localStorage) ---
function getContinueWatching() {
  try {
    const raw = localStorage.getItem(CW_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch (e) {
    return [];
  }
}

function saveToContinueWatching(item) {
  if (!item || !item.id) return;
  const list = getContinueWatching();
  const now = Date.now();
  // Normalize minimal fields required for rendering
  const record = {
    id: item.id,
    title: item.title || item.name || 'Unknown Title',
    poster_path: item.poster_path || null,
    backdrop_path: item.backdrop_path || null,
    media_type: item.media_type || (item.first_air_date ? 'tv' : 'movie'),
    lastWatched: now
  };
  const idx = list.findIndex(x => x.id === record.id);
  if (idx >= 0) {
    list[idx] = { ...list[idx], ...record, lastWatched: now };
  } else {
    list.unshift(record);
  }
  // Keep at most 20
  const trimmed = list
    .sort((a, b) => (b.lastWatched || 0) - (a.lastWatched || 0))
    .slice(0, 20);
  try {
    localStorage.setItem(CW_KEY, JSON.stringify(trimmed));
  } catch (e) {
    // ignore quota errors
  }
}

function renderContinueWatching() {
  const section = document.getElementById('continue');
  const container = document.getElementById('continue-list');
  if (!section || !container) return;
  const items = getContinueWatching();
  if (!items || items.length === 0) {
    section.classList.add('hidden');
    container.innerHTML = '';
    return;
  }
  section.classList.remove('hidden');
  container.innerHTML = '';
  items.forEach(item => {
    if (!item.poster_path) return;
    const img = document.createElement('img');
    img.src = `${IMG_URL}${item.poster_path}`;
    img.alt = item.title || 'Unknown Title';
    img.className = 'w-36 md:w-44 rounded-lg shadow-lg cursor-pointer transition-all duration-300 movie-card';
    img.onclick = () => {
      // Reopen details using saved minimal record
      showDetails({
        id: item.id,
        title: item.title,
        name: item.title,
        poster_path: item.poster_path,
        backdrop_path: item.backdrop_path,
        media_type: item.media_type
      });
    };
    container.appendChild(img);
  });
  animatePosters();
}

// Global variables
const IMG_URL = 'https://image.tmdb.org/t/p/original';
let currentItem;
let allMovies = [];
let bannerMovie = null;
const DEFAULT_TITLE = document.title || 'Sage Movies';
const CW_KEY = 'sage_movies_continue';
let isNavigatingFromURL = false;

// Store movie collections globally for popup access
window.movieCollections = {
  movies: [],
  tvShows: [],
  anime: [],
  continueWatching: []
};

function slugify(text) {
  return (text || '')
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
}

// Show movie details in fullscreen view
function showDetails(item) {
  // Store current item for server switching
  currentItem = item;
  
  // Track movie view
  if (typeof trackMovieView === 'function') {
    trackMovieView(item.id, item.title || item.name);
  }
  
  // Save to Continue Watching
  try {
    saveToContinueWatching(item);
    // Re-render Continue Watching section
    renderContinueWatching();
  } catch (e) {
    console.error('Error saving continue watching:', e);
  }
  // Update page title for better history discoverability
  try {
    const title = currentItem.title || currentItem.name;
    if (title) document.title = `${title} - Sage Movies`;
  } catch (_) {}
  // Push URL for deep-linking (unless we are already handling a URL navigation)
  try {
    if (!isNavigatingFromURL) {
      const type = currentItem.media_type === 'tv' ? 'tv' : 'movie';
      const title = currentItem.title || currentItem.name || 'watch';
      const path = `/watch/${type}/${currentItem.id}-${slugify(title)}`;
      history.pushState({ type, id: currentItem.id, title }, '', path);
    }
  } catch (_) {}
  
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
    
    // Track video play when source is set
    if (typeof trackMoviePlay === 'function') {
      trackMoviePlay(currentItem.id, currentItem.title || currentItem.name);
    }
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
  // Return to home URL if we were on a /watch route (replace to avoid extra entries)
  try {
    if (location.pathname.startsWith('/watch/')) {
      history.replaceState({}, '', '/');
    }
  } catch (_) {}
  // Restore default title
  try { document.title = DEFAULT_TITLE; } catch (_) {}
}

// Open search modal
function openSearchModal() {
  const searchModal = document.getElementById('search-modal');
  const searchInput = document.getElementById('search-input');
  
  // Show the modal by removing hidden class and adding flex display
  searchModal.classList.remove('hidden');
  searchModal.classList.add('flex');
  
  // Trap focus within modal
  trapFocus(searchModal);
  
  // Prevent background scrolling
  document.body.classList.add('overflow-hidden');
  
  console.log('Search modal opened');
}

// Close search modal
function closeSearchModal() {
  const searchModal = document.getElementById('search-modal');
  const searchInput = document.getElementById('search-input');
  const searchResults = document.getElementById('search-results');
  
  // Clear search input and results
  searchInput.value = '';
  searchResults.innerHTML = '';
  
  // Hide the modal
  searchModal.classList.add('hidden');
  searchModal.classList.remove('flex');
  
  // Restore background scrolling
  document.body.classList.remove('overflow-hidden');
  
  // Return focus to search button
  const searchButton = document.getElementById('search-button');
  searchButton?.focus();
  
  console.log('Search modal closed');
}

// Search TMDB
async function searchTMDB() {
  const query = document.getElementById('search-input').value;
  const searchResults = document.getElementById('search-results');
  const resultsCount = document.getElementById('results-count');
  
  if (!query) {
    searchResults.innerHTML = '';
    resultsCount.classList.add('hidden');
    return;
  }
  
  // Show loading skeleton
  searchResults.innerHTML = '';
  resultsCount.classList.add('hidden');
  
  // Add loading indicator
  for (let i = 0; i < 10; i++) {
    const skeletonItem = document.createElement('div');
    skeletonItem.className = 'search-result-item skeleton-item';
    skeletonItem.innerHTML = `
      <div class="skeleton-loader w-full h-[150px] rounded bg-gray-800 animate-pulse"></div>
      <div class="skeleton-loader w-3/4 h-4 mt-2 rounded bg-gray-800 animate-pulse"></div>
    `;
    searchResults.appendChild(skeletonItem);
  }
  
  // Check cache first
  const cacheKey = `sage_movies_search_${query.toLowerCase()}`;
  const cachedResults = localStorage.getItem(cacheKey);
  let data = null;
  
  if (cachedResults) {
    try {
      const parsed = JSON.parse(cachedResults);
      // Cache search results for 1 hour
      if (parsed.timestamp && (Date.now() - parsed.timestamp < 60 * 60 * 1000)) {
        console.log(`[CACHE] Using cached search results for: ${query}`);
        data = parsed.data;
      }
    } catch (e) {
      console.error('Error parsing cached search results:', e);
    }
  }
  
  try {
    // Only fetch if we don't have cached data
    if (!data) {
      const res = await fetch(`/api/search?query=${encodeURIComponent(query)}`);
      data = await res.json();
      
      // Cache the search results
      if (data.results && data.results.length > 0) {
        try {
          localStorage.setItem(cacheKey, JSON.stringify({
            timestamp: Date.now(),
            data: data
          }));
          console.log(`[CACHE] Saved search results for: ${query}`);
        } catch (e) {
          console.error('Error caching search results:', e);
        }
      }
    }
    
    searchResults.innerHTML = '';
    
    if (data.results && data.results.length > 0) {
      // Update results count
      resultsCount.textContent = `Search Results (${data.results.length})`;
      resultsCount.classList.remove('hidden');
      // Group results by relevance category
      const exactMatches = data.results.filter(item => item.relevance_score === 100);
      const startsWithMatches = data.results.filter(item => item.relevance_score === 90);
      const containsWordMatches = data.results.filter(item => item.relevance_score === 80);
      const containsMatches = data.results.filter(item => item.relevance_score === 70);
      const otherMatches = data.results.filter(item => item.relevance_score === 50);
      
      // Function to create result items
      const createResultItems = (items, isExactMatch = false) => {
        items.forEach(item => {
          const resultItem = document.createElement('div');
          resultItem.className = 'search-result-item';
          if (isExactMatch) {
            resultItem.classList.add('exact-match');
          }
          
          const title = item.title || item.name || 'Unknown Title';
          const posterPath = item.poster_path 
            ? `https://image.tmdb.org/t/p/w200${item.poster_path}`
            : 'https://via.placeholder.com/200x300?text=No+Image';
          
          resultItem.innerHTML = `
            <div class="relative group cursor-pointer">
              <img src="${posterPath}" alt="${title}" class="w-full h-auto rounded transition-all duration-300 group-hover:opacity-75">
              <div class="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black to-transparent">
                <h3 class="text-sm font-semibold truncate">${title}</h3>
                <div class="flex items-center text-xs text-gray-400">
                  <span>${item.media_type === 'movie' ? 'Movie' : 'TV'}</span>
                  ${item.vote_average ? `<span class="ml-2">★ ${item.vote_average.toFixed(1)}</span>` : ''}
                  ${item.release_date || item.first_air_date ? 
                    `<span class="ml-2">${new Date(item.release_date || item.first_air_date).getFullYear()}</span>` : ''}
                </div>
              </div>
            </div>
          `;
          
          resultItem.addEventListener('click', () => {
            // Close the search modal
            closeSearchModal();
            // Show movie details
            showDetails(item);
          });
          
          searchResults.appendChild(resultItem);
        });
      };
      
      // Add section headers and results for each relevance category
      if (exactMatches.length > 0) {
        const header = document.createElement('h3');
        header.className = 'text-netflix-red font-bold text-lg px-2 py-1';
        header.textContent = 'Exact Matches';
        searchResults.appendChild(header);
        createResultItems(exactMatches, true);
      }
      
      if (startsWithMatches.length > 0) {
        const header = document.createElement('h3');
        header.className = 'text-white font-bold text-lg px-2 py-1 mt-2';
        header.textContent = 'Starts With';
        searchResults.appendChild(header);
        createResultItems(startsWithMatches);
      }
      
      // Combine the rest of the results
      const otherResults = [...containsWordMatches, ...containsMatches, ...otherMatches];
      if (otherResults.length > 0) {
        const header = document.createElement('h3');
        header.className = 'text-white font-bold text-lg px-2 py-1 mt-2';
        header.textContent = 'Related Results';
        searchResults.appendChild(header);
        createResultItems(otherResults);
      }
    } else {
      searchResults.innerHTML = `
        <div class="col-span-full text-center py-8">
          <div class="text-gray-400 mb-4">No results found for "${query}"</div>
          <div class="text-sm text-gray-500">Try a different search term or check out our suggestions above.</div>
        </div>
      `;
      resultsCount.classList.add('hidden');
    }
  } catch (error) {
    console.error('Error searching:', error);
    searchResults.innerHTML = '<p class="text-center py-4 text-gray-400">Error searching. Please try again.</p>';
  }
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
function setupCarousel(listId, leftBtnId, rightBtnId, sliderId) {
  const list = document.getElementById(listId);
  const leftBtn = document.getElementById(leftBtnId);
  const rightBtn = document.getElementById(rightBtnId);
  const slider = document.getElementById(sliderId);
  
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
  
  // Update slider position on scroll
  function updateSliderPosition() {
    if (!slider) return;
    
    // Calculate scroll percentage
    const scrollableWidth = list.scrollWidth - list.clientWidth;
    if (scrollableWidth <= 0) return;
    
    const scrollPercentage = (list.scrollLeft / scrollableWidth) * 100;
    slider.style.width = `${scrollPercentage}%`;
  }
  
  // Listen for scroll events
  list.addEventListener('scroll', updateSliderPosition);
  
  // Initial update
  setTimeout(updateSliderPosition, 500);
  
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
  setupCarousel('movies-list', 'movies-left-btn', 'movies-right-btn', 'movies-slider');
  setupCarousel('tvshows-list', 'tvshows-left-btn', 'tvshows-right-btn', 'tvshows-slider');
  setupCarousel('anime-list', 'anime-left-btn', 'anime-right-btn', 'anime-slider');
  setupCarousel('continue-list', 'continue-left-btn', 'continue-right-btn', 'continue-slider');
}

document.addEventListener('DOMContentLoaded', setupAllCarousels);

// Display banner with movie info
function displayBanner(item) {
  bannerMovie = item;
  
  // Create a fade-in effect
  const banner = document.getElementById('banner');
  banner.classList.add('opacity-0');
  
  // Set the new background image
  setTimeout(() => {
    banner.style.backgroundImage = `url(${IMG_URL}${item.backdrop_path})`;
    document.getElementById('banner-title').textContent = item.title || item.name;
    banner.classList.remove('opacity-0');
  }, 300);
}

// Auto-rotating banner functionality
let bannerRotationInterval;
let currentBannerIndex = 0;
let bannerMovies = [];

function startBannerRotation(movies) {
  // Store movies for rotation
  bannerMovies = movies.filter(movie => movie.backdrop_path);
  
  // Clear any existing interval
  if (bannerRotationInterval) {
    clearInterval(bannerRotationInterval);
  }
  
  // Set initial banner
  if (bannerMovies.length > 0) {
    currentBannerIndex = 0;
    displayBanner(bannerMovies[currentBannerIndex]);
  }
  
  // Set up rotation interval (every 5 seconds)
  bannerRotationInterval = setInterval(() => {
    currentBannerIndex = (currentBannerIndex + 1) % bannerMovies.length;
    displayBanner(bannerMovies[currentBannerIndex]);
  }, 5000);
}

// Stop banner rotation (e.g., when showing movie details)
function stopBannerRotation() {
  if (bannerRotationInterval) {
    clearInterval(bannerRotationInterval);
  }
}

// Banner play button
document.addEventListener('DOMContentLoaded', () => {
  const playBtn = document.querySelector('.banner-btn.play');
  if (playBtn) {
    playBtn.onclick = () => {
      if (bannerMovie) {
        stopBannerRotation(); // Stop rotation when showing details
        showDetails(bannerMovie);
      }
    };
  }
  
  // Add transition to banner
  const banner = document.getElementById('banner');
  if (banner) {
    banner.classList.add('transition-opacity', 'duration-300');
  }

  // Clear history button handler
  const clearBtn = document.getElementById('continue-clear');
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      try {
        localStorage.removeItem(CW_KEY);
      } catch (_) {}
      renderContinueWatching();
    });
  }

  // Handle initial deep link
  handleInitialURL();

  // Handle back/forward
  window.addEventListener('popstate', () => {
    handlePopState();
  });
});

// Display movies/shows in a container
function displayList(items, containerId, isFiltered = false) {
  const container = document.getElementById(containerId);
  const countSpan = document.getElementById('movies-count');
  const noMoviesMsg = document.getElementById('no-movies-message');
  
  // Limit to 20 items for faster loading
  const limitedItems = items.slice(0, 20);
  
  // Store in global collections for popup access
  if (containerId === 'movies-list') {
    window.movieCollections.movies = limitedItems;
    if (countSpan) countSpan.textContent = `(${limitedItems.length})`;
    if (noMoviesMsg) {
      if (limitedItems.length === 0 && isFiltered) {
        noMoviesMsg.classList.remove('hidden');
        noMoviesMsg.textContent = 'No movies found for this genre.';
      } else {
        noMoviesMsg.classList.add('hidden');
        noMoviesMsg.textContent = '';
      }
    }
  } else if (containerId === 'tvshows-list') {
    window.movieCollections.tvShows = limitedItems;
  } else if (containerId === 'anime-list') {
    window.movieCollections.anime = limitedItems;
  } else if (containerId === 'continue-list') {
    window.movieCollections.continueWatching = limitedItems;
  }
  
  container.innerHTML = '';
  
  // Use limited items instead of all items
  limitedItems.forEach(item => {
    if (!item.poster_path) return;
    
    const img = document.createElement('img');
    img.src = `${IMG_URL}${item.poster_path}`;
    img.alt = item.title || item.name;
    img.className = 'w-36 md:w-44 rounded-lg shadow-lg cursor-pointer transition-all duration-300 movie-card';
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
    
    // Safety check for genres data
    if (!data || !data.genres || !Array.isArray(data.genres)) {
      console.warn('Invalid genres data received:', data);
      return;
    }
    
    // Store genres globally
    window.SAGE_MOVIES_CONFIG = window.SAGE_MOVIES_CONFIG || {};
    window.SAGE_MOVIES_CONFIG.GENRES = {};
    data.genres.forEach(g => { window.SAGE_MOVIES_CONFIG.GENRES[g.id] = g.name; });
    
    // Populate genre dropdown
    const genreSelect = document.getElementById('genre-select');
    if (genreSelect) {
      data.genres.forEach(genre => {
        const option = document.createElement('option');
        option.value = genre.id;
        option.textContent = genre.name;
        genreSelect.appendChild(option);
      });
    }
  } catch (error) {
    console.error('Error fetching genres:', error);
  }
}

// Fetch movies by genre
async function fetchMoviesByGenre(genreId) {
  try {
    const loadingElement = document.createElement('div');
    loadingElement.className = 'text-center py-8';
    loadingElement.innerHTML = '<div class="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-netflix-red"></div><p class="mt-2 text-gray-400">Loading movies...</p>';
    
    const container = document.getElementById('movies-list');
    container.innerHTML = '';
    container.appendChild(loadingElement);
    
    // Use the dedicated genre API endpoint
    const res = await fetch(`/api/movies/genre/${genreId}`);
    const data = await res.json();
    
    if (data.results && data.results.length > 0) {
      // Update global movies for this genre
      allMovies = data.results;
      displayList(data.results, 'movies-list');
    } else {
      container.innerHTML = '<p class="text-center py-8 text-gray-400">No movies found for this genre.</p>';
    }
  } catch (error) {
    console.error('Error fetching movies by genre:', error);
    const container = document.getElementById('movies-list');
    container.innerHTML = '<p class="text-center py-8 text-gray-400">Error loading movies. Please try again.</p>';
  }
}

// Filter movies by genre
function filterByGenre() {
  const genreId = document.getElementById('genre-select').value;
  
  if (genreId && genreId !== "") {
    // Fetch movies for this genre
    fetchMoviesByGenre(genreId);
  } else {
    // Reset to trending movies
    displayList(allMovies, 'movies-list');
  }
  
  // Update section title
  const genreName = genreId ? window.SAGE_MOVIES_CONFIG.GENRES[genreId] : 'Trending';
  document.querySelector('#movies h2').innerHTML = `${genreName} Movies <span id="movies-count" class="text-sm text-netflix-red font-normal"></span>`;
  
  // Scroll to movies section with proper offset for fixed header
  setTimeout(() => {
    const moviesSection = document.getElementById('movies');
    const headerHeight = document.querySelector('.navbar').offsetHeight;
    const yOffset = -headerHeight - 20; // Additional 20px buffer
    const y = moviesSection.getBoundingClientRect().top + window.pageYOffset + yOffset;
    
    window.scrollTo({
      top: y,
      behavior: 'smooth'
    });
  }, 100); // Small delay to ensure DOM is updated
}

// Fetch trending items with caching
async function fetchTrending(type, containerId) {
  try {
    const container = document.getElementById(containerId);
    const cacheKey = `sage_movies_${type}_cache`;
    const cacheTTL = 30 * 60 * 1000; // 30 minutes in milliseconds
    
    // Check if we have cached data that's still valid
    const cachedData = localStorage.getItem(cacheKey);
    let data = null;
    
    if (cachedData) {
      try {
        const parsed = JSON.parse(cachedData);
        // Check if the cache is still valid (not expired)
        if (parsed.timestamp && (Date.now() - parsed.timestamp < cacheTTL)) {
          console.log(`[CACHE] Using cached data for ${type}`);
          data = parsed.data;
        } else {
          console.log(`[CACHE] Cache expired for ${type}`);
        }
      } catch (e) {
        console.error('Error parsing cached data:', e);
      }
    }
    
    // Show loading skeleton if we don't have cached data
    if (!data) {
      container.innerHTML = '';
      for (let i = 0; i < 10; i++) {
        const skeleton = document.createElement('div');
        skeleton.className = 'skeleton-loader min-w-[150px] h-[225px] rounded bg-gray-800 animate-pulse';
        container.appendChild(skeleton);
      }
    }
    
    // If we don't have valid cached data, fetch from server
    if (!data) {
      // Use the collection endpoints for more comprehensive results
      let endpoint = '';
      if (type === 'movie') {
        endpoint = '/api/movies/collection';
      } else if (type === 'tv') {
        endpoint = '/api/tv/collection';
      } else if (type === 'anime') {
        endpoint = '/api/anime/collection';
      } else {
        endpoint = `/api/trending/${type}`;
      }
      
      const res = await fetch(endpoint);
      data = await res.json();
      
      // Cache the new data
      if (data.results && data.results.length > 0) {
        try {
          localStorage.setItem(cacheKey, JSON.stringify({
            timestamp: Date.now(),
            data: data
          }));
          console.log(`[CACHE] Saved new data for ${type}`);
        } catch (e) {
          console.error('Error caching data:', e);
        }
      }
    }
    
    if (data.results && data.results.length > 0) {
      if (type === 'movie') {
        // Store all movies globally for filtering
        allMovies = data.results;
      }
      
      displayList(data.results, containerId);
      
      // Update count display
      const countElement = document.getElementById(`${type}-count`);
      if (countElement) {
        countElement.textContent = `(${data.results.length})`;
      }
    } else {
      container.innerHTML = '<p class="text-center py-8 text-gray-400">No items found.</p>';
    }
  } catch (error) {
    console.error(`Error fetching ${type}:`, error);
    const container = document.getElementById(containerId);
    container.innerHTML = '<p class="text-center py-8 text-gray-400">Error loading content. Please try again.</p>';
  }
}

// Initialize the app
async function init() {
  // Show the page loader
  const pageLoader = document.getElementById('page-loader');
  
  // Track loading status
  let loadingTasks = 0;
  let completedTasks = 0;
  
  function trackTask() {
    loadingTasks++;
    return () => {
      completedTasks++;
      // Check if all tasks are complete
      if (completedTasks >= loadingTasks) {
        // Hide the loader with a fade effect
        if (pageLoader) {
          pageLoader.style.transition = 'opacity 0.5s ease';
          pageLoader.style.opacity = '0';
          setTimeout(() => {
            pageLoader.style.display = 'none';
          }, 500);
        }
      }
    };
  }
  
  try {
    // Fetch genres first
    const genresTask = trackTask();
    await fetchGenres().then(() => {
      genresTask();
    }).catch(() => {
      genresTask(); // Still mark task as complete even if it fails
    });
    
    // Fetch all content in parallel but track each one
    // Render Continue Watching immediately from localStorage
    const cwTask = trackTask();
    try { renderContinueWatching(); } finally { cwTask(); }

    const moviesTask = trackTask();
    fetchTrending('movie', 'movies-list')
      .then(() => {
        if (allMovies.length > 0) {
          startBannerRotation(allMovies);
        }
        moviesTask();
      })
      .catch(() => moviesTask());
    
    const showsTask = trackTask();
    fetchTrending('tv', 'tvshows-list')
      .then(() => showsTask())
      .catch(() => showsTask());
    
    const animeTask = trackTask();
    fetchTrending('anime', 'anime-list')
      .then(() => animeTask())
      .catch(() => animeTask());
    
  } catch (error) {
    console.error('Error initializing app:', error);
    
    // Hide loader even if there's an error
    if (pageLoader) {
      pageLoader.style.display = 'none';
    }
  }
}

// Start the app
init();

// --- Console Popup Functions ---
let popupTimeout;

function showConsolePopup(movieData, element) {
  console.log('showConsolePopup called with:', movieData, element);
  
  // Clear any existing timeout
  if (popupTimeout) clearTimeout(popupTimeout);
  
  const popup = document.getElementById('console-popup');
  console.log('Popup element found:', popup);
  
  if (!popup || !movieData) {
    console.log('Popup or movieData missing');
    return;
  }
  
  // Populate popup with movie data
  document.getElementById('console-title').textContent = movieData.title || movieData.name || 'Unknown Title';
  
  const rating = movieData.vote_average || 0;
  document.getElementById('console-rating').innerHTML = `
    <i class="fas fa-star"></i>
    <span>${rating.toFixed(1)}</span>
  `;
  
  const posterPath = movieData.poster_path ? `${IMG_URL}${movieData.poster_path}` : '';
  document.getElementById('console-poster').src = posterPath;
  document.getElementById('console-poster').alt = movieData.title || movieData.name;
  
  document.getElementById('console-description').textContent = movieData.overview || 'No description available.';
  
  // Set metadata
  const year = movieData.release_date ? new Date(movieData.release_date).getFullYear() : 
               movieData.first_air_date ? new Date(movieData.first_air_date).getFullYear() : 'N/A';
  document.getElementById('console-year').textContent = year;
  
  // Get genres
  let genres = [];
  if (movieData.genre_ids && window.SAGE_MOVIES_CONFIG && window.SAGE_MOVIES_CONFIG.GENRES) {
    genres = movieData.genre_ids.map(id => window.SAGE_MOVIES_CONFIG.GENRES[id]).filter(Boolean);
  } else if (movieData.genres && Array.isArray(movieData.genres)) {
    genres = movieData.genres.map(g => g.name);
  }
  document.getElementById('console-genres').textContent = genres.length ? genres.join(', ') : 'N/A';
  
  // Set runtime (if available)
  const runtime = movieData.runtime ? `${movieData.runtime} min` : 'N/A';
  document.getElementById('console-runtime').textContent = runtime;
  
  // Position popup near the hovered element
  const rect = element.getBoundingClientRect();
  const popupRect = popup.getBoundingClientRect();
  
  // Show popup with slight delay for better UX
  popupTimeout = setTimeout(() => {
    popup.classList.add('show');
  }, 300);
  
  // Store movie data for watch button
  popup.currentMovie = movieData;
}

function hideConsolePopup() {
  if (popupTimeout) clearTimeout(popupTimeout);
  const popup = document.getElementById('console-popup');
  if (popup) {
    popup.classList.remove('show');
    popup.currentMovie = null;
  }
}

// --- Settings Panel Functions ---
function toggleSettingsPanel() {
  const panel = document.getElementById('settings-panel');
  const isOpen = !panel.classList.contains('translate-x-full');
  
  if (isOpen) {
    panel.classList.add('translate-x-full');
    document.body.classList.remove('overflow-hidden');
  } else {
    panel.classList.remove('translate-x-full');
    document.body.classList.add('overflow-hidden');
    // Load current settings
    loadSettings();
  }
}

function loadSettings() {
  // Load saved settings or use defaults
  const settings = JSON.parse(localStorage.getItem('sage_movies_settings') || '{}');
  
  // Dark mode
  const darkModeToggle = document.getElementById('dark-mode-toggle');
  if (darkModeToggle) {
    darkModeToggle.checked = settings.darkMode !== false; // Default to true
  }
  
  // Reduce motion
  const reduceMotionToggle = document.getElementById('reduce-motion-toggle');
  if (reduceMotionToggle) {
    reduceMotionToggle.checked = settings.reduceMotion || false;
  }
  
  // Text size
  const textSizeSelect = document.getElementById('text-size-select');
  if (textSizeSelect) {
    textSizeSelect.value = settings.textSize || 'medium';
  }
  
  // Poster size
  const posterSizeSelect = document.getElementById('poster-size-select');
  if (posterSizeSelect) {
    posterSizeSelect.value = settings.posterSize || 'normal';
  }
  
  // Autoplay
  const autoplayToggle = document.getElementById('autoplay-toggle');
  if (autoplayToggle) {
    autoplayToggle.checked = settings.autoplay || false;
  }
  
  // Preferred server
  const preferredServer = document.getElementById('preferred-server');
  if (preferredServer) {
    preferredServer.value = settings.preferredServer || 'vidsrc.cc';
  }
  
  applySettings(settings);
}

function saveSettings() {
  const settings = {
    darkMode: document.getElementById('dark-mode-toggle')?.checked ?? true,
    reduceMotion: document.getElementById('reduce-motion-toggle')?.checked ?? false,
    textSize: document.getElementById('text-size-select')?.value ?? 'medium',
    posterSize: document.getElementById('poster-size-select')?.value ?? 'normal',
    autoplay: document.getElementById('autoplay-toggle')?.checked ?? false,
    preferredServer: document.getElementById('preferred-server')?.value ?? 'vidsrc.cc'
  };
  
  localStorage.setItem('sage_movies_settings', JSON.stringify(settings));
  applySettings(settings);
}

function applySettings(settings) {
  // Apply dark mode
  if (settings.darkMode !== false) {
    document.documentElement.classList.remove('light-theme');
  } else {
    document.documentElement.classList.add('light-theme');
  }
  
  // Apply reduced motion
  if (settings.reduceMotion) {
    document.documentElement.classList.add('reduce-motion');
  } else {
    document.documentElement.classList.remove('reduce-motion');
  }
  
  // Apply text size
  document.documentElement.className = document.documentElement.className
    .replace(/text-size-\w+/g, '');
  if (settings.textSize && settings.textSize !== 'medium') {
    document.documentElement.classList.add(`text-size-${settings.textSize}`);
  }
  
  // Apply poster size
  const posterClasses = ['poster-compact', 'poster-normal', 'poster-large'];
  document.querySelectorAll('.list img, .movie-card').forEach(el => {
    el.classList.remove(...posterClasses);
    if (settings.posterSize && settings.posterSize !== 'normal') {
      el.classList.add(`poster-${settings.posterSize}`);
    }
  });
  
  // Update server preference in detail view
  if (settings.preferredServer && currentItem) {
    const serverSelect = document.getElementById('server-select');
    if (serverSelect) {
      serverSelect.value = settings.preferredServer;
      changeServer();
    }
  }
}

function clearCache() {
  // Clear localStorage except settings
  const settings = localStorage.getItem('sage_movies_settings');
  const continueWatching = localStorage.getItem('sage_movies_continue');
  
  localStorage.clear();
  
  if (settings) localStorage.setItem('sage_movies_settings', settings);
  if (continueWatching) localStorage.setItem('sage_movies_continue', continueWatching);
  
  alert('Cache cleared successfully!');
}

function resetSettings() {
  if (confirm('Are you sure you want to reset all settings to default?')) {
    localStorage.removeItem('sage_movies_settings');
    loadSettings();
    alert('Settings reset to default!');
  }
}

// Event listeners for console popup
document.addEventListener('DOMContentLoaded', function() {
  // Add mouseenter/mouseleave events to all movie cards
  document.addEventListener('mouseover', function(e) {
    // Check if hovering over a movie card
    const targetElement = e.target;
    let card = null;
    let img = null;
    
    // Handle both direct image hover and card hover
    if (targetElement.classList && targetElement.classList.contains('movie-card')) {
      // Direct hover on image with movie-card class
      card = targetElement.closest('.list') ? targetElement : null;
      img = targetElement;
    } else if (targetElement.closest('.movie-card') && targetElement.closest('.list')) {
      // Hover on card container
      card = targetElement.closest('.movie-card');
      img = card.querySelector('img');
    }
    
    // Debug logging
    console.log('Target element:', targetElement);
    console.log('Card found:', card);
    console.log('Image found:', img);
    console.log('Image alt:', img ? img.alt : 'No image');
    console.log('Global collections:', window.movieCollections);
    console.log('All movies:', allMovies);
    
    if (card && img && img.alt) {
      // Find the movie data from the global arrays
      let movieData = null;
      
      // Search in all movie arrays
      const allMovieArrays = [allMovies, ...Object.values(window.movieCollections || {})];
      
      outerLoop: for (const movieArray of allMovieArrays) {
        if (Array.isArray(movieArray)) {
          for (const movie of movieArray) {
            if ((movie.title || movie.name) === img.alt) {
              movieData = movie;
              break outerLoop;
            }
          }
        }
      }
      
      console.log('Found movie data:', movieData);
      
      if (movieData) {
        showConsolePopup(movieData, card);
      } else {
        console.log('No movie data found for:', img.alt);
      }
    }
  });
  
  document.addEventListener('mouseout', function(e) {
    // Hide popup when mouse leaves movie cards
    if (!e.target.closest('.movie-card') && !e.target.closest('#console-popup')) {
      hideConsolePopup();
    }
  });
  
  // Close popup when clicking close button
  const closeBtn = document.getElementById('console-close-btn');
  if (closeBtn) {
    closeBtn.addEventListener('click', hideConsolePopup);
  }
  
  // Watch button functionality
  const watchBtn = document.getElementById('console-watch-btn');
  if (watchBtn) {
    watchBtn.addEventListener('click', function() {
      const popup = document.getElementById('console-popup');
      if (popup.currentMovie) {
        showDetails(popup.currentMovie);
        hideConsolePopup();
      }
    });
  }
  
  // Close popup when clicking outside
  document.addEventListener('click', function(e) {
    const popup = document.getElementById('console-popup');
    if (popup && popup.classList.contains('show') && 
        !e.target.closest('#console-popup') && 
        !e.target.closest('.movie-card')) {
      hideConsolePopup();
    }
  });
});

// Event listeners for settings changes
document.addEventListener('DOMContentLoaded', function() {
  // Add event listeners to all settings controls
  const settingsControls = [
    'dark-mode-toggle',
    'reduce-motion-toggle',
    'text-size-select',
    'poster-size-select',
    'autoplay-toggle',
    'preferred-server'
  ];
  
  settingsControls.forEach(id => {
    const element = document.getElementById(id);
    if (element) {
      // For checkboxes (toggle switches), listen to change event
      if (element.type === 'checkbox') {
        element.addEventListener('change', function() {
          saveSettings();
          // Provide visual feedback for toggle switches
          const slider = this.nextElementSibling;
          if (slider && slider.classList.contains('toggle-slider')) {
            if (this.checked) {
              slider.style.boxShadow = 'inset 0 2px 4px rgba(0, 0, 0, 0.2), 0 0 10px rgba(229, 9, 20, 0.3)';
            } else {
              slider.style.boxShadow = 'inset 0 2px 4px rgba(0, 0, 0, 0.3), 0 1px 2px rgba(255, 255, 255, 0.05)';
            }
          }
        });
      } else {
        // For selects and other inputs
        element.addEventListener('change', saveSettings);
      }
    }
  });
  
  // Load settings on page load
  loadSettings();
});

// --- Deep linking helpers ---
function parseWatchPath(pathname) {
  // Expecting /watch/:type/:id-slug
  const m = pathname.match(/^\/watch\/(movie|tv)\/(\d+)(?:-[a-z0-9-]+)?$/);
  if (!m) return null;
  return { type: m[1], id: m[2] };
}

async function handleInitialURL() {
  const parsed = parseWatchPath(location.pathname);
  if (!parsed) return;
  try {
    isNavigatingFromURL = true;
    const res = await fetch(`/api/details/${parsed.type}/${parsed.id}`);
    const item = await res.json();
    if (item && item.id) {
      showDetails(item);
      // Set title explicitly on initial navigation
      try {
        const t = item.title || item.name;
        if (t) document.title = `${t} - Sage Movies`;
      } catch (_) {}
    }
  } catch (e) {
    console.error('Failed to load item from URL:', e);
  } finally {
    isNavigatingFromURL = false;
  }
}

async function handlePopState() {
  const parsed = parseWatchPath(location.pathname);
  if (parsed) {
    try {
      isNavigatingFromURL = true;
      const res = await fetch(`/api/details/${parsed.type}/${parsed.id}`);
      const item = await res.json();
      if (item && item.id) {
        showDetails(item);
        // Update title for history entry
        try {
          const t = item.title || item.name;
          if (t) document.title = `${t} - Sage Movies`;
        } catch (_) {}
      }
    } catch (e) {
      console.error('Failed to load item from URL (popstate):', e);
    } finally {
      isNavigatingFromURL = false;
    }
  } else {
    // Not a watch route; ensure detail is closed
    const detail = document.getElementById('movie-detail');
    if (detail && !detail.classList.contains('hidden')) {
      closeMovieDetail();
    }
    // Restore default title when navigating home
    try { document.title = DEFAULT_TITLE; } catch (_) {}
  }
}
