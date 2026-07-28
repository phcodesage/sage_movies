import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    latest_version: '1.0.9',
    version_code: 10,
    download_url:
      'https://pub-bd093e291a8941608e8a6fe70c3aca53.r2.dev/sagemovies-v1.0.9.apk',
    direct_apk_url:
      'https://pub-bd093e291a8941608e8a6fe70c3aca53.r2.dev/sagemovies-v1.0.9.apk',
    release_notes:
      '• High-Speed Server Infrastructure Upgrades\n• Adaptable Dynamic Typography & Layout Enhancements\n• Smooth Pull-to-Refresh Gesture Support\n• Performance & Streaming Stability Improvements',
    force_update: false,
  });
}
