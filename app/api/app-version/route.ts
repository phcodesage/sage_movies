import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    latest_version: '1.3.2',
    version_code: 15,
    download_url:
      'https://pub-bd093e291a8941608e8a6fe70c3aca53.r2.dev/sagemovies-v1.3.2.apk',
    direct_apk_url:
      'https://pub-bd093e291a8941608e8a6fe70c3aca53.r2.dev/sagemovies-v1.3.2.apk',
    release_notes:
      '• Instant In-App Update Notifications & Periodic Auto-Checks\n• Update Badge on App Bar & Left Navigation Drawer',
    force_update: false,
  });
}
