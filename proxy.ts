import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Backend abuse lock: the /api/* routes spend TMDB quota and provider probes,
// so only browsers already on this site may call them. A request is ours when
// its Origin (or Referer fallback) host matches the host serving the app.
// Header-less calls are rejected outside development (curl, scrapers); the
// site's own fetches always carry Origin/Referer. Keys stay server-side in
// route handlers — nothing here is a substitute for rotating leaked secrets.
export function proxy(request: NextRequest) {
  if (!request.nextUrl.pathname.startsWith('/api/')) return NextResponse.next();

  const host = request.headers.get('host') || request.nextUrl.host;
  const source = request.headers.get('origin') || request.headers.get('referer');

  if (source) {
    try {
      if (host && new URL(source).host === host) return NextResponse.next();
    } catch {
      // Malformed Origin/Referer: fall through to forbidden.
    }
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  if (process.env.NODE_ENV === 'development') return NextResponse.next();
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}

export const config = {
  matcher: '/api/:path*',
};
