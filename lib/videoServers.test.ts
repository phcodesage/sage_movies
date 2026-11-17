import { describe, expect, it } from 'vitest';
import {
  DEFAULT_SERVER,
  getServer,
  getServers,
  mediaTypeFromSlug,
  parseEpisodeNumber,
  storedServerOrDefault,
} from './videoServers';
import { GET as videoSource } from '../app/api/video-sources/[type]/[id]/route';

describe('playback routing', () => {
  it('only treats the explicit TV prefix as a TV route', () => {
    expect(mediaTypeFromSlug('movie-edtv')).toBe('movie');
    expect(mediaTypeFromSlug('tv-breaking-bad')).toBe('tv');
  });

  it.each([
    'vidsrc.to',
    'player.videasy.to',
    'vidsrc.in',
    'vidsrc.pm',
    '2embed',
  ])('replaces retired provider %s with the default', (id) => {
    expect(getServer(id).id).toBe(DEFAULT_SERVER);
  });

  it.each([
    ['embed.vidrift.net', 'https://embed.vidrift.net/embed/movie/550', 'https://embed.vidrift.net/embed/tv/1399/2/3'],
    ['vidlink.pro', 'https://vidlink.pro/movie/550', 'https://vidlink.pro/tv/1399/2/3'],
    ['vidfast.pro', 'https://vidfast.pro/movie/550', 'https://vidfast.pro/tv/1399/2/3'],
    ['embedwave.cc', 'https://embedwave.cc/embed/movie/550', 'https://embedwave.cc/embed/tv/1399/2/3'],
    ['vidspark.to', 'https://vidspark.to/movie/550', 'https://vidspark.to/tv/1399/2/3'],
  ])('builds %s embed URLs from the TMDB id', (id, movieUrl, tvUrl) => {
    expect(getServer(id).build('movie', '550', {})).toBe(movieUrl);
    expect(getServer(id).build('tv', '1399', { season: 2, episode: 3 })).toBe(tvUrl);
  });

  it('resolves a stored server preference, falling back when retired', () => {
    expect(storedServerOrDefault('vidfast.pro', 'movie')).toBe('vidfast.pro');
    expect(storedServerOrDefault('vidsrc.in', 'movie')).toBe(DEFAULT_SERVER);
    expect(storedServerOrDefault(null, 'movie')).toBe(DEFAULT_SERVER);
    expect(storedServerOrDefault('superembed', 'tv')).toBe(DEFAULT_SERVER);
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
