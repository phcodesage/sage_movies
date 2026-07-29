import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    latest_version: '1.4.1',
    version_code: 17,
    download_url:
      'https://pub-bd093e291a8941608e8a6fe70c3aca53.r2.dev/sagemovies-v1.4.1.apk',
    direct_apk_url:
      'https://pub-bd093e291a8941608e8a6fe70c3aca53.r2.dev/sagemovies-v1.4.1.apk',
    release_notes:
      '• Re-arranged Mobile & Web UI for maximum conversion & instant streaming access\n• Prominent upfront Watch Now CTA and Episode Selector\n• Compact stream settings accordion\n• Cinematic desktop video player stage',
    force_update: false,
  });
}
