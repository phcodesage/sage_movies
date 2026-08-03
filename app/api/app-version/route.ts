import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    latest_version: '1.4.7',
    version_code: 23,
    download_url:
      'https://github.com/phcodesage/sage-movies-app/releases/download/v1.4.7/sagemovies-v1.4.7.apk',
    direct_apk_url:
      'https://sagemovies.netlify.app/sagemovies-latest.apk',
    release_notes:
      '• Fixed APK download link with high-speed GitHub & Netlify CDN mirrors\n• Fixed fullscreen stream black screen on mobile\n• Ads restored\n• Much faster downloads: HLS segments now download in parallel\n• Tap the badge on any episode to toggle watched',
    force_update: false,
  });
}
