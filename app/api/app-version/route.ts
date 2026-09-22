import { NextResponse } from 'next/server';

export async function GET() {
  // Cloudflare R2 serves the APK through a Worker, keeping it out of Netlify.
  const defaultApkUrl =
    'https://sagemovies-downloads.rechceltoledo.workers.dev/sagemovies-latest.apk';
  const configuredApkUrl = process.env.NEXT_PUBLIC_ANDROID_APK_URL?.trim();
  const apkUrl = configuredApkUrl?.startsWith('https://')
    ? configuredApkUrl
    : defaultApkUrl;

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
