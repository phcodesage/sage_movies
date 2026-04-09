// Analytics Dashboard JavaScript

class AnalyticsDashboard {
  constructor() {
    this.charts = {};
    this.currentData = null;
    this.isLoading = false;
  }

  async loadAnalytics() {
    if (this.isLoading) return;
    
    this.isLoading = true;
    this.showLoading(true);
    this.hideError();
    
    try {
      const timeRange = document.getElementById('time-range').value;
      const timeParams = this.getTimeParams(timeRange);
      
      const response = await fetch(`/api/analytics/data?startTime=${timeParams.start}&endTime=${timeParams.end}`);
      const result = await response.json();
      
      if (result.success) {
        this.currentData = result.data;
        this.updateDashboard(result.data);
        this.hideLoading();
        this.showSections();
      } else {
        throw new Error(result.error || 'Failed to load analytics data');
      }
    } catch (error) {
      console.error('Error loading analytics:', error);
      this.showError('Failed to load analytics data. Please try again.');
      this.hideLoading();
    } finally {
      this.isLoading = false;
    }
  }

  getTimeParams(range) {
    const now = new Date();
    let start = new Date();
    
    switch (range) {
      case '24h':
        start.setHours(now.getHours() - 24);
        break;
      case '7d':
        start.setDate(now.getDate() - 7);
        break;
      case '30d':
        start.setDate(now.getDate() - 30);
        break;
      case '90d':
        start.setDate(now.getDate() - 90);
        break;
      default:
        start.setDate(now.getDate() - 7);
    }
    
    return {
      start: start.toISOString(),
      end: now.toISOString()
    };
  }

  updateDashboard(data) {
    // Update key metrics
    this.updateMetrics(data);
    
    // Update charts
    this.updateCharts(data);
    
    // Update detailed lists
    this.updateDetailedLists(data);
  }

  updateMetrics(data) {
    document.getElementById('total-visits').textContent = data.totalVisits.toLocaleString();
    document.getElementById('unique-visitors').textContent = data.uniqueVisitors.toLocaleString();
    document.getElementById('conversion-rate').textContent = data.conversionRate.toFixed(1) + '%';
    
    // Calculate average session duration (mock data for now)
    const avgSessionSeconds = Math.floor(Math.random() * 300) + 60; // 1-5 minutes
    const minutes = Math.floor(avgSessionSeconds / 60);
    const seconds = avgSessionSeconds % 60;
    document.getElementById('avg-session').textContent = `${minutes}m ${seconds}s`;
  }

  updateCharts(data) {
    // Traffic Overview Chart
    this.createChart('traffic-chart', {
      type: 'line',
      data: {
        labels: Object.keys(data.dailyActivity).sort(),
        datasets: [{
          label: 'Daily Visits',
          data: Object.values(data.dailyActivity),
          borderColor: '#e50914',
          backgroundColor: 'rgba(229, 9, 20, 0.1)',
          borderWidth: 3,
          tension: 0.4,
          fill: true
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: {
              color: 'rgba(255, 255, 255, 0.1)'
            },
            ticks: {
              color: '#b3b3b3'
            }
          },
          x: {
            grid: {
              color: 'rgba(255, 255, 255, 0.1)'
            },
            ticks: {
              color: '#b3b3b3'
            }
          }
        }
      }
    });

    // Device Distribution Chart
    this.createChart('device-chart', {
      type: 'doughnut',
      data: {
        labels: Object.keys(data.devices),
        datasets: [{
          data: Object.values(data.devices),
          backgroundColor: [
            '#e50914',
            '#00bfff',
            '#00ff88',
            '#ff6b35',
            '#9d4edd'
          ],
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              color: '#b3b3b3',
              padding: 20
            }
          }
        }
      }
    });

    // Browser Distribution Chart
    this.createChart('browser-chart', {
      type: 'bar',
      data: {
        labels: Object.keys(data.browsers),
        datasets: [{
          label: 'Browser Usage',
          data: Object.values(data.browsers),
          backgroundColor: '#e50914',
          borderRadius: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: {
              color: 'rgba(255, 255, 255, 0.1)'
            },
            ticks: {
              color: '#b3b3b3'
            }
          },
          x: {
            grid: {
              display: false
            },
            ticks: {
              color: '#b3b3b3'
            }
          }
        }
      }
    });

    // Operating System Chart
    this.createChart('os-chart', {
      type: 'pie',
      data: {
        labels: Object.keys(data.operatingSystems),
        datasets: [{
          data: Object.values(data.operatingSystems),
          backgroundColor: [
            '#e50914',
            '#00bfff',
            '#00ff88',
            '#ff6b35',
            '#9d4edd'
          ],
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              color: '#b3b3b3',
              padding: 20
            }
          }
        }
      }
    });
  }

  updateDetailedLists(data) {
    // Top Pages
    const topPagesHtml = this.generateMetricList(data.pageViews, 'views');
    document.getElementById('top-pages').innerHTML = topPagesHtml;

    // Top Clicks
    const topClicksHtml = this.generateMetricList(data.clicks, 'clicks');
    document.getElementById('top-clicks').innerHTML = topClicksHtml;

    // Popular Content
    const popularContentHtml = this.generateContentList(data.popularContent);
    document.getElementById('popular-content').innerHTML = popularContentHtml;
  }

  generateMetricList(data, unit) {
    const sortedEntries = Object.entries(data)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5);
    
    if (sortedEntries.length === 0) {
      return '<p class="text-gray-400 text-center py-4">No data available</p>';
    }
    
    return sortedEntries.map(([key, value], index) => `
      <div class="metric-card">
        <div class="flex justify-between items-center">
          <div>
            <div class="metric-value">${key}</div>
            <div class="metric-label">${value} ${unit}</div>
          </div>
          <div class="text-netflix-red font-bold">#${index + 1}</div>
        </div>
      </div>
    `).join('');
  }

  generateContentList(data) {
    const sortedEntries = Object.entries(data)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5);
    
    if (sortedEntries.length === 0) {
      return '<p class="text-gray-400 text-center py-4">No popular content yet</p>';
    }
    
    return sortedEntries.map(([contentId, views], index) => {
      // Mock content titles (in real app, you'd fetch actual titles)
      const titles = {
        '83533': 'Avatar: Fire and Ash',
        '1242898': 'Predator: Badlands',
        '840464': 'Greenland 2: Migration',
        '1368166': 'The Housemaid',
        '1168190': 'The Wrecking Crew'
      };
      
      const title = titles[contentId] || `Movie ${contentId}`;
      
      return `
        <div class="metric-card">
          <div class="flex justify-between items-center">
            <div>
              <div class="metric-value">${title}</div>
              <div class="metric-label">${views} views</div>
            </div>
            <div class="text-netflix-red font-bold">#${index + 1}</div>
          </div>
        </div>
      `;
    }).join('');
  }

  createChart(canvasId, config) {
    const ctx = document.getElementById(canvasId).getContext('2d');
    
    // Destroy existing chart if it exists
    if (this.charts[canvasId]) {
      this.charts[canvasId].destroy();
    }
    
    this.charts[canvasId] = new Chart(ctx, config);
  }

  showLoading(show) {
    const loadingIndicator = document.getElementById('loading-indicator');
    const sections = ['metrics-section', 'charts-section', 'details-section'];
    
    if (show) {
      loadingIndicator.classList.remove('hidden');
      sections.forEach(section => {
        document.getElementById(section).classList.add('hidden');
      });
    } else {
      loadingIndicator.classList.add('hidden');
    }
  }

  hideLoading() {
    this.showLoading(false);
  }

  showSections() {
    ['metrics-section', 'charts-section', 'details-section'].forEach(sectionId => {
      document.getElementById(sectionId).classList.remove('hidden');
    });
  }

  showError(message) {
    document.getElementById('error-message').classList.remove('hidden');
    document.getElementById('error-message').querySelector('p').textContent = message;
  }

  hideError() {
    document.getElementById('error-message').classList.add('hidden');
  }

  // Real-time updates
  startRealTimeUpdates() {
    setInterval(() => {
      if (!document.hidden) {
        this.loadAnalytics();
      }
    }, 30000); // Update every 30 seconds
  }
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  const dashboard = new AnalyticsDashboard();
  window.analyticsDashboard = dashboard;
  
  // Load initial data
  dashboard.loadAnalytics();
  
  // Start real-time updates
  dashboard.startRealTimeUpdates();
  
  // Handle page visibility changes
  document.addEventListener('visibilitychange', function() {
    if (!document.hidden) {
      dashboard.loadAnalytics();
    }
  });
});

// Make loadAnalytics globally accessible
function loadAnalytics() {
  if (window.analyticsDashboard) {
    window.analyticsDashboard.loadAnalytics();
  }
}