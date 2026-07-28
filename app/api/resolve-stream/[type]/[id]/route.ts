import { NextResponse } from 'next/server';
import { getServer, DEFAULT_SERVER } from '../../../../../lib/videoServers';
import {
  buildVideasyFallbackEmbedUrl,
  resolveVideasyStream,
  type VideasyMediaType,
} from '../../../../../lib/videasyResolver';

const RESOLVER_FLAG = process.env.ENABLE_VIDEASY_RESOLVER !== 'false';

function parsePositiveInteger(value: string | null, fallback: number) {
  const parsed = Number.parseInt(value ?? '', 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function getFallbackEmbedUrl(type: VideasyMediaType, id: string, season: number, episode: number, serverId?: string | null) {
  const server = getServer(serverId ?? DEFAULT_SERVER);
  return server.build(type, id, {
    season,
    episode,
  });
}

export async function GET(request: Request, { params }: { params: Promise<{ type: string; id: string }> }) {
  const { type, id } = await params;

  if (!id || !['movie', 'tv'].includes(type)) {
    return NextResponse.json({ ok: false, error: 'Invalid parameters' }, { status: 400 });
  }

  const { searchParams } = new URL(request.url);
  const mediaType = type as VideasyMediaType;
  const title = searchParams.get('title')?.trim();
  const serverId = searchParams.get('server') || DEFAULT_SERVER;
  const year = searchParams.get('year');
  const imdbId = searchParams.get('imdbId');
  const season = parsePositiveInteger(searchParams.get('season'), 1);
  const episode = parsePositiveInteger(searchParams.get('episode'), 1);
  const fallbackEmbedUrl = getFallbackEmbedUrl(mediaType, id, season, episode, serverId);

  if (!RESOLVER_FLAG) {
    console.warn('[resolve-stream] Videasy resolver disabled by feature flag');

    return NextResponse.json({
      ok: false,
      error: 'Videasy resolver disabled',
      fallbackEmbedUrl,
    });
  }

  if (!title) {
    return NextResponse.json(
      {
        ok: false,
        error: 'Missing title',
        fallbackEmbedUrl,
      },
      { status: 400 }
    );
  }

  try {
    const resolvedStream = await resolveVideasyStream({
      title,
      mediaType,
      tmdbId: id,
      imdbId,
      year,
      seasonId: season,
      episodeId: episode,
    });

    if (!resolvedStream) {
      console.warn('[resolve-stream] No playable sources returned, using iframe fallback', {
        mediaType,
        id,
        season,
        episode,
      });

      return NextResponse.json({
        ok: false,
        error: 'Resolver returned no playable sources',
        fallbackEmbedUrl,
      });
    }

    return NextResponse.json({
      ok: true,
      streamUrl: resolvedStream.url,
      streamType: resolvedStream.type,
      quality: resolvedStream.quality,
      subtitles: resolvedStream.subtitles ?? [],
      provider: 'videasy-resolver',
      fallbackEmbedUrl,
    });
  } catch (error) {
    console.error('[resolve-stream] Videasy resolver failed', {
      mediaType,
      id,
      season,
      episode,
      error: error instanceof Error ? error.message : String(error),
    });

    return NextResponse.json({
      ok: false,
      error: 'Resolver failed',
      fallbackEmbedUrl,
    });
  }
}
