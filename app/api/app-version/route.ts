import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    latest_version: '1.5.0',
    version_code: 25,
    download_url: 'https://sagemovies.netlify.app/downloads/sagemovies-v1.5.0.apk',
    direct_apk_url: 'https://sagemovies.netlify.app/downloads/sagemovies-v1.5.0.apk',
    release_notes:
      "• Mark episodes as watched — a green check tracks what you've seen\n• Much faster downloads: HLS segments now download in parallel\n• Tap the badge on any episode to toggle watched",
    force_update: false,
  });
}
