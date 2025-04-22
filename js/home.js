// --- Netflix Style Animations and UI Enhancements ---
// Navbar background on scroll
window.addEventListener('scroll', function() {
  const navbar = document.querySelector('.navbar');
  if (window.scrollY > 50) {
    navbar.classList.add('scrolled');
  } else {
    navbar.classList.remove('scrolled');
  }
});

// Show modal with fade/scale animation
function showDetails(item) {
  currentItem = item;
  document.getElementById('modal-title').textContent = item.title || item.name;
  document.getElementById('modal-description').textContent = item.overview;
  document.getElementById('modal-image').src = `${IMG_URL}${item.poster_path}`;
  document.getElementById('modal-rating').innerHTML = '★'.repeat(Math.round(item.vote_average / 2));
  changeServer();
  const modal = document.getElementById('modal');
  modal.style.display = 'flex';
  setTimeout(() => modal.classList.add('show'), 10);
}

function closeModal() {
  const modal = document.getElementById('modal');
  modal.classList.remove('show');
  setTimeout(() => {
    modal.style.display = 'none';
    document.getElementById('modal-video').src = '';
  }, 300);
}

// Show search modal with fade animation
function openSearchModal() {
  const modal = document.getElementById('search-modal');
  modal.style.display = 'flex';
  setTimeout(() => modal.classList.add('show'), 10);
  document.getElementById('search-input').focus();
}

function closeSearchModal() {
  const modal = document.getElementById('search-modal');
  modal.classList.remove('show');
  setTimeout(() => {
    modal.style.display = 'none';
    document.getElementById('search-results').innerHTML = '';
  }, 300);
}

// Horizontal scroll by mouse wheel for Netflix row effect
function enableHorizontalScroll() {
  document.querySelectorAll('.list').forEach(list => {
    list.addEventListener('wheel', function(e) {
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
        e.preventDefault();
        list.scrollLeft += e.deltaY;
      }
    }, { passive: false });
  });
}

document.addEventListener('DOMContentLoaded', enableHorizontalScroll);

// --- Enhanced: Animate posters on load ---
function animatePosters() {
  document.querySelectorAll('.list img').forEach((img, idx) => {
    img.style.opacity = '0';
    img.style.animationDelay = (0.1 + idx * 0.07) + 's';
    img.classList.add('animated-poster');
  });
}

// --- Carousel Logic for Movies List ---
function setupMoviesCarousel() {
  const list = document.getElementById('movies-list');
  const leftBtn = document.getElementById('movies-left-btn');
  const rightBtn = document.getElementById('movies-right-btn');
  let scrollAmount = 0;
  let itemWidth = 220; // poster width + margin
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

document.addEventListener('DOMContentLoaded', setupMoviesCarousel);

// --- Existing Code ---
// --- Config from config.js ---
const API_KEY = window.SAGE_MOVIES_CONFIG.TMDB_API_KEY;
const BASE_URL = window.SAGE_MOVIES_CONFIG.TMDB_BASE_URL;
const IMG_URL = window.SAGE_MOVIES_CONFIG.TMDB_IMG_URL;

let currentItem;

async function fetchTrending(type) {
  const res = await fetch(`${BASE_URL}/trending/${type}/week?api_key=${API_KEY}`);
  const data = await res.json();
  return data.results;
}

async function fetchTrendingAnime() {
  let allResults = [];
  for (let page = 1; page <= 3; page++) {
    const res = await fetch(`${BASE_URL}/trending/tv/week?api_key=${API_KEY}&page=${page}`);
    const data = await res.json();
    const filtered = data.results.filter(item =>
      item.original_language === 'ja' && item.genre_ids.includes(16)
    );
    allResults = allResults.concat(filtered);
  }
  return allResults;
}

let bannerMovie = null;
document.addEventListener('DOMContentLoaded', () => {
  const playBtn = document.querySelector('.banner-btn.play');
  if (playBtn) {
    playBtn.onclick = () => {
      if (bannerMovie) showDetails(bannerMovie);
    };
  }
});

function displayBanner(item) {
  bannerMovie = item;
  document.getElementById('banner').style.backgroundImage = `url(${IMG_URL}${item.backdrop_path})`;
  document.getElementById('banner-title').textContent = item.title || item.name;
}

function displayList(items, containerId, isFiltered = false) {
  const container = document.getElementById(containerId);
  const countSpan = document.getElementById('movies-count');
  const noMoviesMsg = document.getElementById('no-movies-message');
  if (containerId === 'movies-list') {
    if (countSpan) countSpan.textContent = `(${items.length})`;
    if (noMoviesMsg) {
      if (items.length === 0 && isFiltered) {
        noMoviesMsg.style.display = 'block';
        noMoviesMsg.textContent = 'No movies found for this genre.';
      } else {
        noMoviesMsg.style.display = 'none';
        noMoviesMsg.textContent = '';
      }
    }
  }
  container.innerHTML = '';
  items.forEach(item => {
    const img = document.createElement('img');
    img.src = `${IMG_URL}${item.poster_path}`;
    img.alt = item.title || item.name;
    img.onclick = () => showDetails(item);
    container.appendChild(img);
  });
  animatePosters();
  if (containerId === 'movies-list') setupMoviesCarousel();
}

// --- Genre Filter Functionality ---
let allMovies = [];
let allGenres = [];

async function fetchGenres() {
  const res = await fetch(`${BASE_URL}/genre/movie/list?api_key=${API_KEY}`);
  const data = await res.json();
  allGenres = data.genres;
  const genreSelect = document.getElementById('genre-select');
  data.genres.forEach(genre => {
    const option = document.createElement('option');
    option.value = genre.id;
    option.textContent = genre.name;
    genreSelect.appendChild(option);
  });
}

function filterByGenre() {
  const genreId = document.getElementById('genre-select').value;
  let filtered = allMovies;
  if (genreId && genreId !== "") {
    filtered = allMovies.filter(movie => movie.genre_ids && movie.genre_ids.includes(Number(genreId)));
  }
  displayList(filtered, 'movies-list', genreId !== "");
}

function changeServer() {
  const server = document.getElementById('server').value;
  const type = currentItem.media_type === "movie" ? "movie" : "tv";
  let embedURL = "";
  if (server === "vidsrc.cc") {
    embedURL = `https://vidsrc.cc/v2/embed/${type}/${currentItem.id}`;
  } else if (server === "vidsrc.me") {
    embedURL = `https://vidsrc.net/embed/${type}/?tmdb=${currentItem.id}`;
  } else if (server === "player.videasy.net") {
    embedURL = `https://player.videasy.net/${type}/${currentItem.id}`;
  }
  document.getElementById('modal-video').src = embedURL;
}

async function searchTMDB() {
  const query = document.getElementById('search-input').value;
  if (!query.trim()) {
    document.getElementById('search-results').innerHTML = '';
    return;
  }
  const res = await fetch(`${BASE_URL}/search/multi?api_key=${API_KEY}&query=${query}`);
  const data = await res.json();
  const container = document.getElementById('search-results');
  container.innerHTML = '';
  data.results.forEach(item => {
    if (!item.poster_path) return;
    const img = document.createElement('img');
    img.src = `${IMG_URL}${item.poster_path}`;
    img.alt = item.title || item.name;
    img.onclick = () => {
      closeSearchModal();
      showDetails(item);
    };
    container.appendChild(img);
  });
  animatePosters();
}

async function init() {
  await fetchGenres();
  const movies = await fetchTrending('movie');
  allMovies = movies;
  const tvShows = await fetchTrending('tv');
  const anime = await fetchTrendingAnime();
  displayBanner(movies[Math.floor(Math.random() * movies.length)]);
  displayList(movies, 'movies-list');
  displayList(tvShows, 'tvshows-list');
  displayList(anime, 'anime-list');
}

init();