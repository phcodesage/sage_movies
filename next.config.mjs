/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: '/sw.js',
        headers: [
          { key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' },
          { key: 'Content-Type', value: 'application/javascript; charset=utf-8' },
          { key: 'Service-Worker-Allowed', value: '/' },
          { key: 'Content-Security-Policy', value: "default-src 'self'; script-src 'self'" },
        ],
      },
      {
        source: '/manifest.json',
        headers: [
          { key: 'Content-Type', value: 'application/manifest+json' },
          { key: 'Cache-Control', value: 'public, max-age=3600' },
        ],
      },
    ];
  },
  async redirects() {
    const downloadsOrigin = 'https://sagemovies-downloads.rechceltoledo.workers.dev';

    return [
      {
        source: '/sagemovies-latest.apk',
        destination: `${downloadsOrigin}/sagemovies-latest.apk`,
        permanent: true,
      },
      {
        source: '/sagemovies-v1.4.7.apk',
        destination: `${downloadsOrigin}/sagemovies-v1.4.7.apk`,
        permanent: true,
      },
      {
        source: '/sagemovies-v1.5.0.apk',
        destination: `${downloadsOrigin}/sagemovies-v1.5.0.apk`,
        permanent: true,
      },
      {
        source: '/downloads/sagemovies-v1.4.8.apk',
        destination: `${downloadsOrigin}/sagemovies-v1.4.8.apk`,
        permanent: true,
      },
      {
        source: '/downloads/sagemovies-v1.5.0.apk',
        destination: `${downloadsOrigin}/sagemovies-v1.5.0.apk`,
        permanent: true,
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'image.tmdb.org',
        port: '',
        pathname: '/t/p/**',
      },
      {
        protocol: 'https',
        hostname: 'ui-avatars.com',
        port: '',
        pathname: '/api/**',
      },
      {
        protocol: 'https',
        hostname: 'via.placeholder.com',
        port: '',
        pathname: '/**',
      },
    ],
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 86400,
  },
  compress: true,
  poweredByHeader: false,
  reactStrictMode: true,
  experimental: {
    optimizePackageImports: ['lucide-react', 'framer-motion'],
  },
  allowedDevOrigins: ['192.168.0.100'],
};

export default nextConfig;
