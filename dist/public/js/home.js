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

// Open search modal
function openSearchModal() {
  const searchModal = document.getElementById('search-modal');
  const searchInput = document.getElementById('search-input');
  
  // Show the modal by removing hidden class and adding flex display
  searchModal.classList.remove('hidden');
  searchModal.classList.add('flex');
  
  // Focus the search input
  setTimeout(() => {
    searchInput.focus();
  }, 100);
  
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
  
  console.log('Search modal closed');
}

// Search TMDB
async function searchTMDB() {
  const query = document.getElementById('search-input').value;
  const searchResults = document.getElementById('search-results');
  const searchModal = document.getElementById('search-modal');
  
  if (!query) {
    searchResults.innerHTML = '';
    searchResults.classList.add('hidden');
    return;
  }
  
  // Show loading skeleton
  searchResults.innerHTML = '';
  searchResults.classList.remove('hidden');
  
  for (let i = 0; i < 8; i++) {
    const skeletonItem = document.createElement('div');
    skeletonItem.className = 'search-result-item skeleton-item';
    skeletonItem.innerHTML = `
      <div class="skeleton-loader w-full h-[150px] rounded bg-gray-800 animate-pulse"></div>
      <div class="skeleton-loader w-3/4 h-4 mt-2 rounded bg-gray-800 animate-pulse"></div>
    `;
    searchResults.appendChild(skeletonItem);
  }
  
  try {
    const res = await fetch(`/api/search?query=${encodeURIComponent(query)}`);
    const data = await res.json();
    
    searchResults.innerHTML = '';
    
    if (data.results && data.results.length > 0) {
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
      searchResults.innerHTML = '<p class="text-center py-4 text-gray-400">No results found.</p>';
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

// Fetch trending items
async function fetchTrending(type, containerId) {
  try {
    const container = document.getElementById(containerId);
    
    // Show loading skeleton
    container.innerHTML = '';
    for (let i = 0; i < 10; i++) {
      const skeleton = document.createElement('div');
      skeleton.className = 'skeleton-loader min-w-[150px] h-[225px] rounded bg-gray-800 animate-pulse';
      container.appendChild(skeleton);
    }
    
    // Use the new collection endpoints for more comprehensive results
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
    const data = await res.json();
    
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
  try {
    await fetchGenres();
    
    await fetchTrending('movie', 'movies-list');
    await fetchTrending('tv', 'tvshows-list');
    await fetchTrending('anime', 'anime-list');
    
    if (allMovies.length > 0) {
      startBannerRotation(allMovies);
    }
  } catch (error) {
    console.error('Error initializing app:', error);
  }
}

// Start the app
init();
