import { NextResponse } from 'next/server';
import { getServers, parseEpisodeNumber } from '../../../../../lib/videoServers';
import { probeProvider } from '../../../../../lib/videoHealth';

export const revalidate = 0;

export async function GET(request, { params }) {
  const { type, id } = await params;
  const { searchParams } = new URL(request.url);
  if (!['movie', 'tv'].includes(type) || !/^\d+$/.test(id)) {
    return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 });
  }
  const season = parseEpisodeNumber(searchParams.get('season'));
  const episode = parseEpisodeNumber(searchParams.get('episode'));
  if (season === null || episode === null) {
    return NextResponse.json({ error: 'Invalid season or episode' }, { status: 400 });
  }
  const entries = await Promise.all(
    getServers(type).map(async (server) => [
      server.id,
      await probeProvider(server.build(type, id, { season, episode })),
    ])
  );
  return NextResponse.json(
    { servers: Object.fromEntries(entries) },
    {
      headers: {
        'Cache-Control': 'public, max-age=30, s-maxage=120, stale-while-revalidate=60',
        'CDN-Cache-Control': 'public, s-maxage=120, stale-while-revalidate=60',
        'Netlify-Vary': 'query',
      },
    }
  );
}
