import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    latest_version: '1.0.1',
    version_code: 2,
    download_url: 'https://link-center.net/7848832/gBVDxSZ1rUTX',
    direct_apk_url:
      'https://pub-bd093e291a8941608e8a6fe70c3aca53.r2.dev/sagemovies-v1.0.0.apk',
    release_notes:
      '• Added 13 major studio brand hubs (Netflix, Disney+, Marvel, etc.)\n• Automated server health pre-checks (zero dead streams)\n• Enhanced web-parity search and genre filters',
    force_update: false,
  });
}
