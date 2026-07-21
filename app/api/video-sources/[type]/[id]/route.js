import { NextResponse } from 'next/server';
import { getServer, DEFAULT_LANG, SUBTITLE_LANGUAGES } from '../../../../../lib/videoServers';

export async function GET(request, { params }) {
  const resolvedParams = await params;
  const { type, id } = resolvedParams;
  const { searchParams } = new URL(request.url);

  if (!type || !id || !['movie', 'tv'].includes(type)) {
    return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 });
  }

  const server = getServer(searchParams.get('server'));

  const requestedLang = searchParams.get('lang') || DEFAULT_LANG;
  const lang = SUBTITLE_LANGUAGES.some((l) => l.code === requestedLang)
    ? requestedLang
    : DEFAULT_LANG;

  const season = parseInt(searchParams.get('season') || '1', 10) || 1;
  const episode = parseInt(searchParams.get('episode') || '1', 10) || 1;

  const embedURL = server.build(type, id, {
    lang: server.supportsLang ? lang : undefined,
    season,
    episode,
  });

  return NextResponse.json({
    embedURL,
    server: server.id,
    // The UI reads this to tell the user when the language picker has no effect
    // on the provider they selected.
    langApplied: server.supportsLang ? lang : null,
  });
}
