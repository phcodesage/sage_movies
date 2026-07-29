import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    latest_version: '1.4.8',
    version_code: 24,
    download_url:
      'https://sagemovies.netlify.app/downloads/sagemovies-v1.4.8.apk',
    direct_apk_url:
      'https://sagemovies.netlify.app/downloads/sagemovies-v1.4.8.apk',
    release_notes:
      '• Choose download quality: 720p, 480p, or 360p before saving offline\n• Quality badge shown on downloaded titles\n• Smarter HLS variant selection for faster, smaller downloads',
    force_update: false,
  });
}
