import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    latest_version: '1.0.2',
    version_code: 3,
    download_url: 'https://link-center.net/7848832/gBVDxSZ1rUTX',
    direct_apk_url:
      'https://pub-bd093e291a8941608e8a6fe70c3aca53.r2.dev/sagemovies-v1.0.0.apk',
    release_notes:
      '• Version 1.0.2 Wireless Release\n• Added 13 major studio brand hubs\n• Custom SageMovies App Launcher Icon\n• Instant 60fps streaming & active server checks',
    force_update: false,
  });
}
