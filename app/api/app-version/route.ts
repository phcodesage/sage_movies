import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    latest_version: '1.1.0',
    version_code: 11,
    download_url:
      'https://pub-bd093e291a8941608e8a6fe70c3aca53.r2.dev/sagemovies-v1.1.0.apk',
    direct_apk_url:
      'https://pub-bd093e291a8941608e8a6fe70c3aca53.r2.dev/sagemovies-v1.1.0.apk',
    release_notes:
      '• Instant Preloading Engine: Zero-delay startup on slow & offline connections\n• Enhanced Persistent Data Caching\n• UI & Stream Stability Optimizations',
    force_update: false,
  });
}
