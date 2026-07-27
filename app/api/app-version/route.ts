import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    latest_version: '1.0.3',
    version_code: 4,
    download_url:
      'https://pub-bd093e291a8941608e8a6fe70c3aca53.r2.dev/sagemovies-v1.0.0.apk',
    direct_apk_url:
      'https://pub-bd093e291a8941608e8a6fe70c3aca53.r2.dev/sagemovies-v1.0.0.apk',
    release_notes:
      '• Centralized Toast Notification System\n• Clean Downloads Manager & Storage Permissions Card\n• In-App Wireless OTA Update Engine',
    force_update: false,
  });
}
