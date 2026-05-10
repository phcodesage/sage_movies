'use client';

import { useReportWebVitals } from 'next/web-vitals';

export function WebVitals() {
  useReportWebVitals((metric) => {
    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log('[Web Vitals]', metric);
    }

    // Send to analytics service (example)
    // You can replace this with your analytics service
    if (process.env.NODE_ENV === 'production') {
      // Example: Send to Google Analytics, Vercel Analytics, or custom endpoint
      // const body = JSON.stringify(metric);
      // const url = 'https://your-analytics-endpoint.com/vitals';
      // fetch(url, { body, method: 'POST', keepalive: true });
      
      // For now, just log in production for monitoring
      console.log('[Web Vitals]', metric);
    }
  });

  return null;
}
