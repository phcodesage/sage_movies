import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  // Serve the APK from this deployment (public/sagemovies-latest.apk).
  // Cloudflare R2 (*.r2.dev) previously used here is currently unreachable.
  const origin = request.nextUrl.origin;
  const apkUrl = `${origin}/sagemovies-latest.apk`;

  return NextResponse.json({
    latest_version: '1.4.7',
    version_code: 23,
    download_url: apkUrl,
    direct_apk_url: apkUrl,
    release_notes:
      '• Fixed broken APK download (moved off Cloudflare R2)\n• Fixed fullscreen stream black screen on mobile\n• Ads restored',
    force_update: false,
  });
}
