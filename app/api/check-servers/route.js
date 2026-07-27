import { NextResponse } from 'next/server';
import { VIDEO_SERVERS } from '../../../lib/videoServers';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type') || 'movie';
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'ID parameter required' }, { status: 400 });
  }

  const checks = await Promise.allSettled(
    VIDEO_SERVERS.map(async (server) => {
      const url = server.build(type, id, { season: 1, episode: 1 });
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 2500);

        const res = await fetch(url, {
          method: 'HEAD',
          headers: { 'User-Agent': 'Mozilla/5.0' },
          signal: controller.signal,
        });
        clearTimeout(timeout);

        // Status 200, 301, 302, 308 indicate server is up
        const isWorking = res.status >= 200 && res.status < 400;
        return { id: server.id, isWorking };
      } catch (err) {
        return { id: server.id, isWorking: false };
      }
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

  return NextResponse.json({
    status: serverStatus,
    bestServer: firstWorkingServer || VIDEO_SERVERS[0].id,
  });
}
