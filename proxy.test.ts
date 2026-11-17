// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { NextRequest } from 'next/server';
import { proxy } from './proxy';

const api = (headers: Record<string, string> = {}) =>
  new NextRequest('http://localhost:3000/api/movies/collection', { headers });

describe('API origin lock', () => {
  it('allows requests from the site itself', () => {
    expect(proxy(api({ origin: 'http://localhost:3000' })).status).toBe(200);
    expect(proxy(api({ referer: 'http://localhost:3000/movie/550/x' })).status).toBe(200);
  });

  it('rejects other sites embedding the backend', () => {
    expect(proxy(api({ origin: 'https://evil.example' })).status).toBe(403);
    expect(proxy(api({ referer: 'https://evil.example/page' })).status).toBe(403);
  });

  it('rejects header-less calls outside development', () => {
    expect(proxy(api()).status).toBe(403);
  });

  it('leaves pages alone', () => {
    const page = new NextRequest('http://localhost:3000/movie/550/x', {
      headers: { origin: 'https://evil.example' },
    });
    expect(proxy(page).status).toBe(200);
  });
});
