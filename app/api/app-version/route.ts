import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  // Serve the APK from this deployment (public/sagemovies-latest.apk).
  // Cloudflare R2 (*.r2.dev) previously used here is currently unreachable.
  const origin = request.nextUrl.origin;
  const apkUrl = `${origin}/sagemovies-latest.apk`;

  return NextResponse.json({
    latest_version: '1.5.0',
    version_code: 25,
    download_url: apkUrl,
    direct_apk_url: apkUrl,
    release_notes:
      '• Upgraded to Gradle 8.14, AGP 8.11.1, and Kotlin 2.2.20\n• Updated webview_flutter_wkwebview to 3.26.0\n• Fixed broken APK download link & updated dependencies',
    force_update: false,
  });
}
