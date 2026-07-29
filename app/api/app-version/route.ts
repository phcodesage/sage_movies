import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    latest_version: '1.4.6',
    version_code: 22,
    download_url:
      'https://pub-bd093e291a8941608e8a6fe70c3aca53.r2.dev/sagemovies-v1.4.6.apk',
    direct_apk_url:
      'https://pub-bd093e291a8941608e8a6fe70c3aca53.r2.dev/sagemovies-v1.4.6.apk',
    release_notes:
      '• Zero Popups on Play: Streams now start playing instantly without any ad dialogs or stream settings popping up\n• Immersive sticky fullscreen mode for Android virtual navigation bar\n• Solid Material 3 UI & pill chips across web & mobile',
    force_update: false,
  });
}
