import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    latest_version: '1.3.1',
    version_code: 14,
    download_url:
      'https://pub-bd093e291a8941608e8a6fe70c3aca53.r2.dev/sagemovies-v1.3.1.apk',
    direct_apk_url:
      'https://pub-bd093e291a8941608e8a6fe70c3aca53.r2.dev/sagemovies-v1.3.1.apk',
    release_notes:
      '• Automatic Stream Auto-Play & Overlay Bypass (Play button starts video instantly!)\n• Instant Play/Pause Sync across embed frames',
    force_update: false,
  });
}
