import './globals.css';
import React, { ReactNode } from 'react';
import { Metadata, Viewport } from 'next';
import PWAProvider from '../components/PWAProvider';
import ErrorBoundary from '../components/ErrorBoundary';
import MaintenancePage from '../components/MaintenancePage';
import { AppProvider } from '../lib/context/AppContext';
import { WebVitals } from '../components/WebVitals';
import { AdsterraSocialBar, AdsterraGlobalScript } from '../components/Adsterra';
import { WebSiteStructuredData, OrganizationStructuredData } from '../components/StructuredData';

export const metadata: Metadata = {
  applicationName: 'Sage Movies',
  manifest: '/manifest.json',
  appleWebApp: { capable: true, title: 'Sage Movies', statusBarStyle: 'black-translucent' },
  other: { 'apple-mobile-web-app-capable': 'yes' },
  icons: {
    icon: [{ url: '/icons/icon-192.png', type: 'image/png', sizes: '192x192' }],
    apple: [{ url: '/icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },
  title: {
    default: 'Sage Movies - Free Movies, TV Shows & Anime Streaming',
    template: '%s | Sage Movies',
  },
  description:
    'Watch free movies, TV shows and anime online. Stream trending movies, 123movies alternatives, movies for kids and popular TV series without registration.',
  keywords:
    'free movies, 123movies, trending movies, movies for kids, anime streaming, TV shows online, watch movies free, streaming site',
  authors: [{ name: 'Sage Movies' }],
  creator: 'Sage Movies',
  publisher: 'Sage Movies',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://sagemovies.com'),
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://sagemovies.com',
    title: 'Sage Movies - Free Movies, TV Shows & Anime Streaming',
    description:
      'Watch free movies, TV shows and anime online. Stream trending movies, 123movies alternatives, movies for kids and popular TV series without registration.',
    siteName: 'Sage Movies',
    images: [
      {
        url: 'https://image.tmdb.org/t/p/original/9Gtg2DzBhmYamXBS1hKAhiwbBKS.jpg',
        width: 1200,
        height: 630,
        alt: 'Sage Movies',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Sage Movies - Free Movies, TV Shows & Anime Streaming',
    description:
      'Watch free movies, TV shows and anime online. Stream trending movies, 123movies alternatives, movies for kids and popular TV series without registration.',
    images: ['https://image.tmdb.org/t/p/original/9Gtg2DzBhmYamXBS1hKAhiwbBKS.jpg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: '-cVK8xZN3jhxarvzrneYEp17LO25Wni6d0KWRSaZvI4',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#0f1015',
};

interface RootLayoutProps {
  children: ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  const isMaintenanceMode = process.env.NEXT_PUBLIC_MAINTENANCE_MODE === 'true';

  return (
    <html lang="en" className="scroll-smooth">
      <head>
        <link rel="preconnect" href="https://image.tmdb.org" />
        <WebSiteStructuredData />
        <OrganizationStructuredData />
      </head>
      <body className="bg-netflix-black text-white min-h-screen font-sans">
        <ErrorBoundary>
          <AppProvider>
            <PWAProvider>
              <WebVitals />
              {isMaintenanceMode ? <MaintenancePage /> : children}
              <AdsterraSocialBar />
              <AdsterraGlobalScript />
            </PWAProvider>
          </AppProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
