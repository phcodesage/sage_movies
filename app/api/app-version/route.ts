import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    latest_version: '1.4.2',
    version_code: 18,
    download_url:
      'https://pub-bd093e291a8941608e8a6fe70c3aca53.r2.dev/sagemovies-v1.4.2.apk',
    direct_apk_url:
      'https://pub-bd093e291a8941608e8a6fe70c3aca53.r2.dev/sagemovies-v1.4.2.apk',
    release_notes:
      '• Updated metadata badges across Web & Mobile to clean Material Design 3 solid pill chips\n• Replaced dark outlined boxed buttons with vibrant solid Material M3 badges\n• Enhanced contrast and typography',
    force_update: false,
  });
}
