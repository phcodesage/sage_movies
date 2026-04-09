// Client-side Analytics Tracking

class AnalyticsTracker {
  constructor() {
    this.sessionId = this.generateSessionId();
    this.pageStartTime = Date.now();
    this.trackedEvents = new Set();
    
    // Initialize tracking
    this.initTracking();
  }

  generateSessionId() {
    // Generate a unique session ID
    return 'sess_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  async trackEvent(eventType, eventData = {}) {
    try {
      const payload = {
        eventType,
        eventData: {
          ...eventData,
          url: window.location.href,
          referrer: document.referrer,
          title: document.title
        },
        sessionId: this.sessionId,
        timestamp: new Date().toISOString()
      };

      // Send to server
      await fetch('/api/analytics/track', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      console.log(`[ANALYTICS] Tracked: ${eventType}`, eventData);
    } catch (error) {
      console.error('Analytics tracking failed:', error);
    }
  }

  initTracking() {
    // Track page view
    this.trackPageView();

    // Track clicks
    this.trackClicks();

    // Track scrolls
    this.trackScrollDepth();

    // Track time on page
    this.trackTimeOnPage();

    // Track form interactions
    this.trackFormInteractions();

    // Track video plays (for movie details)
    this.trackVideoPlays();

    // Track search usage
    this.trackSearchUsage();
  }

  trackPageView() {
    // Track initial page view
    this.trackEvent('page_view', {
      page: window.location.pathname,
      search: window.location.search
    });

    // Track page views on SPA navigation
    let lastPath = window.location.pathname;
    setInterval(() => {
      if (window.location.pathname !== lastPath) {
        lastPath = window.location.pathname;
        this.trackEvent('page_view', {
          page: window.location.pathname,
          search: window.location.search
        });
      }
    }, 1000);
  }

  trackClicks() {
    document.addEventListener('click', (e) => {
      const target = e.target;
      const elementInfo = this.getElementInfo(target);
      
      this.trackEvent('click', {
        element: elementInfo.selector,
        elementType: elementInfo.type,
        text: elementInfo.text,
        contentId: elementInfo.contentId
      });
    });
  }

  trackScrollDepth() {
    let maxScrollDepth = 0;
    let scrollTimer;

    window.addEventListener('scroll', () => {
      const scrollPercent = Math.round(
        (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100
      );

      if (scrollPercent > maxScrollDepth) {
        maxScrollDepth = scrollPercent;

        // Track significant scroll milestones
        const milestones = [25, 50, 75, 90, 100];
        for (const milestone of milestones) {
          if (maxScrollDepth >= milestone && !this.trackedEvents.has(`scroll_${milestone}`)) {
            this.trackedEvents.add(`scroll_${milestone}`);
            this.trackEvent('scroll_depth', {
              depth: milestone,
              maxDepth: maxScrollDepth
            });
            break;
          }
        }
      }

      // Reset timer on scroll
      clearTimeout(scrollTimer);
      scrollTimer = setTimeout(() => {
        this.trackEvent('scroll_end', {
          finalDepth: maxScrollDepth
        });
      }, 3000);
    });
  }

  trackTimeOnPage() {
    // Track time spent every 30 seconds
    setInterval(() => {
      const timeSpent = Math.floor((Date.now() - this.pageStartTime) / 1000);
      this.trackEvent('time_spent', {
        seconds: timeSpent
      });
    }, 30000);

    // Track when user leaves the page
    window.addEventListener('beforeunload', () => {
      const timeSpent = Math.floor((Date.now() - this.pageStartTime) / 1000);
      this.trackEvent('page_exit', {
        timeOnPage: timeSpent,
        exitType: 'beforeunload'
      });
    });

    // Track page visibility changes
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        const timeSpent = Math.floor((Date.now() - this.pageStartTime) / 1000);
        this.trackEvent('page_hidden', {
          timeOnPage: timeSpent
        });
      } else {
        this.pageStartTime = Date.now(); // Reset timer when page becomes visible
        this.trackEvent('page_visible');
      }
    });
  }

  trackFormInteractions() {
    document.addEventListener('focus', (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') {
        this.trackEvent('form_focus', {
          fieldName: e.target.name || e.target.id || e.target.type,
          fieldType: e.target.type
        });
      }
    }, true);

    document.addEventListener('submit', (e) => {
      if (e.target.tagName === 'FORM') {
        this.trackEvent('form_submit', {
          formId: e.target.id,
          formName: e.target.name
        });
      }
    }, true);
  }

  trackVideoPlays() {
    // Track video interactions in movie detail view
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === 1) { // Element node
            const videos = node.querySelectorAll ? node.querySelectorAll('video, iframe') : [];
            videos.forEach(video => {
              this.attachVideoListeners(video);
            });
          }
        });
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    // Attach to existing videos
    document.querySelectorAll('video, iframe').forEach(video => {
      this.attachVideoListeners(video);
    });
  }

  attachVideoListeners(video) {
    video.addEventListener('play', () => {
      this.trackEvent('video_play', {
        videoSrc: video.src || video.querySelector('source')?.src,
        currentTime: video.currentTime
      });
    });

    video.addEventListener('pause', () => {
      this.trackEvent('video_pause', {
        videoSrc: video.src || video.querySelector('source')?.src,
        currentTime: video.currentTime
      });
    });

    video.addEventListener('ended', () => {
      this.trackEvent('video_complete', {
        videoSrc: video.src || video.querySelector('source')?.src
      });
    });
  }

  trackSearchUsage() {
    // Track search interactions
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
      let searchTimer;
      
      searchInput.addEventListener('input', (e) => {
        clearTimeout(searchTimer);
        searchTimer = setTimeout(() => {
          if (e.target.value.trim()) {
            this.trackEvent('search_input', {
              queryLength: e.target.value.length,
              queryPreview: e.target.value.substring(0, 50)
            });
          }
        }, 500);
      });

      searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          this.trackEvent('search_submit', {
            query: e.target.value
          });
        }
      });
    }
  }

  getElementInfo(element) {
    const info = {
      selector: '',
      type: element.tagName.toLowerCase(),
      text: element.textContent?.trim().substring(0, 50) || '',
      contentId: null
    };

    // Generate CSS selector
    if (element.id) {
      info.selector = `#${element.id}`;
    } else if (element.className) {
      info.selector = `.${element.className.split(' ')[0]}`;
    } else {
      info.selector = element.tagName.toLowerCase();
    }

    // Extract content ID for movie cards
    if (element.classList?.contains('movie-card') || element.closest('.movie-card')) {
      const card = element.classList.contains('movie-card') ? element : element.closest('.movie-card');
      const img = card.querySelector('img');
      if (img && img.alt) {
        // Try to find the movie ID from the global data
        const movieTitle = img.alt;
        info.contentId = this.findMovieIdByTitle(movieTitle);
      }
    }

    return info;
  }

  findMovieIdByTitle(title) {
    // Look for movie ID in global collections
    const collections = window.movieCollections || {};
    
    for (const collection of Object.values(collections)) {
      if (Array.isArray(collection)) {
        const movie = collection.find(m => (m.title || m.name) === title);
        if (movie) return movie.id;
      }
    }
    
    // Check allMovies array
    if (window.allMovies) {
      const movie = window.allMovies.find(m => (m.title || m.name) === title);
      if (movie) return movie.id;
    }
    
    return null;
  }

  // Public methods for manual tracking
  trackCustomEvent(eventName, data) {
    this.trackEvent(eventName, data);
  }

  trackMovieView(movieId, movieTitle) {
    this.trackEvent('movie_view', {
      contentId: movieId,
      title: movieTitle
    });
  }

  trackMoviePlay(movieId, movieTitle) {
    this.trackEvent('movie_play', {
      contentId: movieId,
      title: movieTitle
    });
  }
}

// Initialize tracker when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  window.analyticsTracker = new AnalyticsTracker();
});

// Export for manual usage
window.trackCustomEvent = function(eventName, data) {
  if (window.analyticsTracker) {
    window.analyticsTracker.trackCustomEvent(eventName, data);
  }
};

window.trackMovieView = function(movieId, movieTitle) {
  if (window.analyticsTracker) {
    window.analyticsTracker.trackMovieView(movieId, movieTitle);
  }
};

window.trackMoviePlay = function(movieId, movieTitle) {
  if (window.analyticsTracker) {
    window.analyticsTracker.trackMoviePlay(movieId, movieTitle);
  }
};