import { NextResponse } from 'next/server';
import { VIDEO_SERVERS, DEFAULT_LANG } from '../../../../../lib/videoServers';

export const revalidate = 0;

const PROBE_TIMEOUT_MS = 6000;

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

async function probe(url, serverId, type, id, season, episode) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), PROBE_TIMEOUT_MS);
  try {
    // VidSrc deep check via nextgencloudfabric
    if (serverId === 'vidsrc.xyz' || serverId === 'vidsrc.pm' || serverId === 'vidsrc.icu') {
      const vidsrcUrl =
        type === 'tv'
          ? `https://nextgencloudfabric.com/embed/tv/${id}/${season}/${episode}`
          : `https://nextgencloudfabric.com/embed/movie/${id}`;

      const vidsrcRes = await fetch(vidsrcUrl, {
        method: 'GET',
        redirect: 'follow',
        signal: controller.signal,
        headers: { 'User-Agent': UA, Accept: 'text/html,application/xhtml+xml,*/*' },
      });

      if (vidsrcRes.ok) {
        const vidsrcText = await vidsrcRes.text();
        const vidsrcLower = vidsrcText.toLowerCase();
        if (
          vidsrcLower.includes('404 - not found') ||
          vidsrcLower.includes('error-code">404')
        ) {
          return 'down';
        }
      }
    }

    // 2Embed specific deep probe
    if (serverId === '2embed') {
      const innerUrl =
        type === 'tv'
          ? `https://streamsrcs.2embed.cc/${id}/${season}/${episode}`
          : `https://streamsrcs.2embed.cc/${id}`;

      const innerRes = await fetch(innerUrl, {
        method: 'GET',
        redirect: 'follow',
        signal: controller.signal,
        headers: { 'User-Agent': UA, Accept: 'text/html,application/xhtml+xml,*/*' },
      });

      if (innerRes.ok) {
        const innerText = await innerRes.text();
        const innerLower = innerText.toLowerCase();
        if (
          innerLower.includes('2embed - stream movies') ||
          innerLower.includes('movie embed code') ||
          innerLower.includes('biggest library to embed')
        ) {
          return 'down';
        }
      }
    }

    const res = await fetch(url, {
      method: 'GET',
      redirect: 'follow',
      signal: controller.signal,
      headers: { 'User-Agent': UA, Accept: 'text/html,application/xhtml+xml,*/*' },
    });

    if (!res.ok) return 'down';

    const text = await res.text();
    const lower = text.toLowerCase();

    // Catch catalog missing signatures inside 200 OK provider shells
    if (
      lower.includes("couldn't find") ||
      lower.includes('couldnt find') ||
      lower.includes('could not find') ||
      lower.includes('cannot find') ||
      lower.includes('searched through our providers') ||
      lower.includes('not host the media') ||
      lower.includes('content unavailable') ||
      lower.includes('video not found') ||
      lower.includes('something went wrong') ||
      lower.includes('file not found') ||
      lower.includes('media not found') ||
      lower.includes('not available') ||
      lower.includes('2embed - stream movies') ||
      lower.includes('404 - not found') ||
      lower.includes('error-code">404') ||
      lower.includes('/lander') ||
      lower.includes('location.href="/lander"') ||
      lower.includes('window.location.href="/lander"')
    ) {
      return 'down';
    }

    return 'up';
  } catch {
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
      return [s.id, await probe(url, s.id, type, id, season, episode)];
    })
  );

  return NextResponse.json(
    { servers: Object.fromEntries(entries) },
    { headers: { 'Cache-Control': 'no-store' } }
  );
}
