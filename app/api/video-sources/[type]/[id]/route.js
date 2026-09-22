import { NextResponse } from 'next/server';
import {
  getServer,
  DEFAULT_LANG,
  SUBTITLE_LANGUAGES,
  parseEpisodeNumber,
} from '../../../../../lib/videoServers';

export async function GET(request, { params }) {
  const resolvedParams = await params;
  const { type, id } = resolvedParams;
  const { searchParams } = new URL(request.url);

  if (!type || !id || !['movie', 'tv'].includes(type) || !/^\d+$/.test(id)) {
    return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 });
  }

  const server = getServer(searchParams.get('server'), type);

  const requestedLang = searchParams.get('lang') || DEFAULT_LANG;
  const lang = SUBTITLE_LANGUAGES.some((l) => l.code === requestedLang)
    ? requestedLang
    : DEFAULT_LANG;

  const season = parseEpisodeNumber(searchParams.get('season'));
  const episode = parseEpisodeNumber(searchParams.get('episode'));
  if (season === null || episode === null) {
    return NextResponse.json({ error: 'Invalid season or episode' }, { status: 400 });
  }

  const embedURL = server.build(type, id, {
    lang: server.supportsLang ? lang : undefined,
    season,
    episode,
  });

  return NextResponse.json(
    {
      embedURL,
      server: server.id,
      // The UI reads this to tell the user when the language picker has no effect
      // on the provider they selected.
      langApplied: server.supportsLang ? lang : null,
    },
    {
      headers: {
        'Cache-Control': 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=172800',
        'CDN-Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=172800',
        'Netlify-Vary': 'query',
      },
    }
  );
}
