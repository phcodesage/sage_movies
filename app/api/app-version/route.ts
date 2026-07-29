import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    latest_version: '1.2.0',
    version_code: 12,
    download_url:
      'https://pub-bd093e291a8941608e8a6fe70c3aca53.r2.dev/sagemovies-v1.2.0.apk',
    direct_apk_url:
      'https://pub-bd093e291a8941608e8a6fe70c3aca53.r2.dev/sagemovies-v1.2.0.apk',
    release_notes:
      '• Offline Disk Image Caching: View poster images & cached movie catalog with 0 network connection!\n• Performance & Memory Cache Enhancements',
    force_update: false,
  });
}
