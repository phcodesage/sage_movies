import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    latest_version: '1.4.5',
    version_code: 21,
    download_url:
      'https://pub-bd093e291a8941608e8a6fe70c3aca53.r2.dev/sagemovies-v1.4.5.apk',
    direct_apk_url:
      'https://pub-bd093e291a8941608e8a6fe70c3aca53.r2.dev/sagemovies-v1.4.5.apk',
    release_notes:
      '• Official v1.4.5 Release\n• Immersive sticky fullscreen mode for Android virtual navigation bar\n• Virtual nav buttons no longer obscure video player controls & settings\n• Material Design 3 solid UI & pill chips across web & mobile',
    force_update: false,
  });
}
