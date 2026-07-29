import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    latest_version: '1.4.3',
    version_code: 19,
    download_url:
      'https://pub-bd093e291a8941608e8a6fe70c3aca53.r2.dev/sagemovies-v1.4.3.apk',
    direct_apk_url:
      'https://pub-bd093e291a8941608e8a6fe70c3aca53.r2.dev/sagemovies-v1.4.3.apk',
    release_notes:
      '• Fixed top video player stage with clean vertical spacing\n• Title & Material 3 badges section now stays fixed at top and does not scroll away\n• Smooth scrolling for episodes, server settings, and recommendations',
    force_update: false,
  });
}
