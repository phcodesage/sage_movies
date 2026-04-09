import { NextResponse } from 'next/server';

export async function GET(request, { params }) {
  const resolvedParams = await params;
  const { type, id } = resolvedParams;
  const { searchParams } = new URL(request.url);
  const server = searchParams.get('server') || 'vidsrc.cc';

  if (!type || !id || !['movie', 'tv'].includes(type)) {
    return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 });
  }

  let embedURL = "";
  
  switch(server) {
    case "vidsrc.cc":
      embedURL = `https://vidsrc.cc/v2/embed/${type}/${id}`;
      break;
    case "vidsrc.me":
      embedURL = `https://vidsrc.net/embed/${type}/?tmdb=${id}`;
      break;
    case "vidsrc.pro":
      embedURL = `https://vidsrc.pro/embed/${type}/${id}`;
      break;
    case "embedsu":
      embedURL = `https://embed.su/embed/${type}/${id}`;
      break;
    case "2embed":
      embedURL = `https://www.2embed.cc/embed/${type}/${id}`;
      break;
    case "moviesapi":
      embedURL = `https://moviesapi.club/movie/${id}`;
      break;
    case "superembed":
      embedURL = `https://multiembed.mov/?video_id=${id}&tmdb=1`;
      break;
    case "player.videasy.net":
    default:
      const mediaType = type === 'tv' ? 'show' : 'movie';
      embedURL = `https://player.videasy.net/embed/${mediaType}/${id}?ads_behavior=background&popup_mode=quiet`;
      break;
  }

  return NextResponse.json({ embedURL });
}
