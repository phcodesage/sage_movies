import { NextResponse } from 'next/server';
import { DEFAULT_SERVER, getServers } from '../../../lib/videoServers';
import { probeProvider } from '../../../lib/videoHealth';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type') || 'movie';
  const id = searchParams.get('id');

  if (!id || !/^\d+$/.test(id) || !['movie', 'tv'].includes(type)) {
    return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 });
  }

  const checks = await Promise.allSettled(
    getServers(type).map(async (server) => {
      const url = server.build(type, id, { season: 1, episode: 1 });
      const status = await probeProvider(url);
      return { id: server.id, isWorking: status === 'unknown' ? null : status === 'up' };
    })
  );

  const serverStatus = {};
  let firstWorkingServer = null;

  checks.forEach((result) => {
    if (result.status === 'fulfilled') {
      const { id: sId, isWorking } = result.value;
      serverStatus[sId] = isWorking;
      if (isWorking && !firstWorkingServer) {
        firstWorkingServer = sId;
      }
    }
  });

  return NextResponse.json(
    {
      status: serverStatus,
      bestServer: firstWorkingServer || DEFAULT_SERVER,
    },
    {
      headers: {
        'Cache-Control': 'public, max-age=30, s-maxage=60, stale-while-revalidate=120',
        'CDN-Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
        'Netlify-Vary': 'query',
      },
    }
  );
}
