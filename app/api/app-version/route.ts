import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    latest_version: '1.4.0',
    version_code: 16,
    download_url:
      'https://pub-bd093e291a8941608e8a6fe70c3aca53.r2.dev/sagemovies-v1.4.0.apk',
    direct_apk_url:
      'https://pub-bd093e291a8941608e8a6fe70c3aca53.r2.dev/sagemovies-v1.4.0.apk',
    release_notes:
      '• TV Series Seasons & Episodes Picker (Support for all seasons & episodes on Mobile & Web!)\n• Removed problematic native fullscreen button',
    force_update: false,
  });
}
