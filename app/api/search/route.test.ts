// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest';
import { GET } from './route';

afterEach(() => vi.unstubAllGlobals());

function stubTmdb() {
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string) => {
      const isTv = url.includes('/search/tv');
      return {
        json: async () => ({
          results: [
            isTv
              ? { id: 100, name: 'The Avengers (Test)', popularity: 5 }
              : { id: 100, title: 'The Avengers (Test)', popularity: 9 },
          ],
        }),
      };
    })
  );
}

describe('search route', () => {
  it('does not crash on queries containing regex characters', async () => {
    stubTmdb();
    const res = await GET(
      new Request('https://sage.test/api/search?query=avengers%20(')
    );
    expect(res.status).toBe(200);
  });

  it('keeps a movie and a TV show that share the same TMDB id', async () => {
    stubTmdb();
    const res = await GET(new Request('https://sage.test/api/search?query=avengers'));
    const data = await res.json();
    expect(data.results).toHaveLength(2);
    expect(data.results.map((r: any) => r.media_type).sort()).toEqual(['movie', 'tv']);
  });
});
