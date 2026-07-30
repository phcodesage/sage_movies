import { NextResponse } from 'next/server';
import { VIDEO_SERVERS, DEFAULT_LANG } from '../../../../../lib/videoServers';

// Health is time-sensitive — never cache. We probe each provider's actual embed URL
// server-side and report reachability. This catches the common failure mode (provider
// host down / 522 / blocked / redirected away), which is most of what users hit.
//
// It CANNOT confirm the specific title is in a provider's catalog: providers render the
// "we couldn't find that" verdict in the browser after an internal lookup, so the initial
// HTML is a 200 player shell whether or not the title exists. Reachability is the honest
// signal we can get from the server, and it's enough to steer users off dead providers.
export const revalidate = 0;

const PROBE_TIMEOUT_MS = 6000;

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

async function probe(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), PROBE_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      method: 'GET',
      redirect: 'follow',
      signal: controller.signal,
      headers: { 'User-Agent': UA, Accept: 'text/html,application/xhtml+xml,*/*' },
    });
    // 2xx = reachable and serving. Cloudflare 522s, 5xx, 4xx and hard redirects to an
    // error/ad host all fall through to 'down'.
    return res.ok ? 'up' : 'down';
  } catch {
    // DNS failure, connection refused, or our own abort/timeout.
    return 'down';
  } finally {
    clearTimeout(timer);
  }
}

export async function GET(request, { params }) {
  const { type, id } = await params;
  const { searchParams } = new URL(request.url);

  if (!type || !id || !['movie', 'tv'].includes(type)) {
    return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 });
  }

  const season = parseInt(searchParams.get('season') || '1', 10) || 1;
  const episode = parseInt(searchParams.get('episode') || '1', 10) || 1;

  const entries = await Promise.all(
    VIDEO_SERVERS.map(async (s) => {
      const url = s.build(type, id, {
        lang: s.supportsLang ? DEFAULT_LANG : undefined,
        season,
        episode,
      });
      return [s.id, await probe(url)];
    })
  );

  return NextResponse.json(
    { servers: Object.fromEntries(entries) },
    { headers: { 'Cache-Control': 'no-store' } }
  );
}
