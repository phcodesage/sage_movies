import './globals.css';
import React, { ReactNode } from 'react';
import { Metadata } from 'next';
import ErrorBoundary from '../components/ErrorBoundary';
import { AppProvider } from '../lib/context/AppContext';
import { WebVitals } from '../components/WebVitals';
import { AdsterraSocialBar } from '../components/Adsterra';
import { WebSiteStructuredData, OrganizationStructuredData } from '../components/StructuredData';

export const metadata: Metadata = {
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
    google: 'your-google-verification-code',
  },
};

interface RootLayoutProps {
  children: ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en" className="scroll-smooth">
      <head>
        <link
          rel="icon"
          href="https://ui-avatars.com/api/?name=SM&background=e50914&color=fff&rounded=true&size=32"
          type="image/png"
        />
        <WebSiteStructuredData />
        <OrganizationStructuredData />
      </head>
      <body className="bg-netflix-black text-white min-h-screen font-sans">
        <ErrorBoundary>
          <AppProvider>
            <WebVitals />
            {children}
            <AdsterraSocialBar />
          </AppProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
