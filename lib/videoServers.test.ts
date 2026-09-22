import { describe, expect, it } from 'vitest';
import {
  DEFAULT_SERVER,
  getServer,
  getServers,
  mediaTypeFromSlug,
  parseEpisodeNumber,
} from './videoServers';
import { GET as videoSource } from '../app/api/video-sources/[type]/[id]/route';

describe('playback routing', () => {
  it('only treats the explicit TV prefix as a TV route', () => {
    expect(mediaTypeFromSlug('movie-edtv')).toBe('movie');
    expect(mediaTypeFromSlug('tv-breaking-bad')).toBe('tv');
  });

  it('replaces retired providers with the default', () => {
    expect(getServer('vidsrc.to').id).toBe(DEFAULT_SERVER);
  });

  it('builds VidSrc path URLs instead of redirecting query URLs', () => {
    expect(getServer('vidsrc.in').build('movie', '550', {})).toBe(
      'https://vidsrc.in/embed/movie/550'
    );
    expect(getServer('vidsrc.in').build('tv', '1399', { season: 2, episode: 3 })).toBe(
      'https://vidsrc.in/embed/tv/1399/2/3'
    );
  });

  it('only offers episode-aware providers for TV', () => {
    expect(getServers('tv').some((server) => server.movieOnly)).toBe(false);
    for (const server of getServers('tv')) {
      expect(server.build('tv', '1399', { season: 1, episode: 2 })).not.toBe(
        server.build('tv', '1399', { season: 1, episode: 3 })
      );
    }
    expect(getServer('superembed', 'tv').id).toBe(DEFAULT_SERVER);
  });

  it.each(['0', '-1', '1junk', '1.5', '10000', ''])(
    'rejects invalid episode number %s',
    (value) => {
      expect(parseEpisodeNumber(value)).toBeNull();
    }
  );

  it('validates API input and falls back for movie-only providers on TV', async () => {
    const params = Promise.resolve({ type: 'tv', id: '1399' });
    const bad = await videoSource(new Request('https://sage.test/api?season=-1'), { params });
    expect(bad.status).toBe(400);
    const good = await videoSource(
      new Request('https://sage.test/api?server=superembed&season=2&episode=3'),
      { params }
    );
    expect((await good.json()).embedURL).toContain('/tv/1399/2/3');
  });
});
