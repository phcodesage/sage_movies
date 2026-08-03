import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    latest_version: '1.4.7',
    version_code: 23,
    download_url:
      'https://pub-bd093e291a8941608e8a6fe70c3aca53.r2.dev/sagemovies-v1.4.7.apk',
    direct_apk_url:
      'https://pub-bd093e291a8941608e8a6fe70c3aca53.r2.dev/sagemovies-v1.4.7.apk',
    release_notes:
      '• Fixed Cloudflare R2 download links\n• Fixed fullscreen stream black screen on mobile\n• Ads restored',
    force_update: false,
  });
}
