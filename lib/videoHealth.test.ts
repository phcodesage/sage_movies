import { afterEach, describe, expect, it, vi } from 'vitest';
import { classifyProviderResponse, probeProvider } from './videoHealth';

const url = 'https://provider.example/embed/movie/550';
afterEach(() => vi.unstubAllGlobals());

describe('advisory provider health', () => {
  it('does not reject a working shell containing error strings in JavaScript', async () => {
    const response = new Response(
      '<script>const errors = ["404", "not available", "not found"];</script>'
    );
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response));
    expect(await probeProvider(url)).toBe('up');
  });
  it.each([401, 403, 429])('treats probe restriction %s as unknown', (status) => {
    expect(classifyProviderResponse(new Response(null, { status }), url)).toBe('unknown');
  });
  it.each([404, 410, 502])('reports HTTP failure %s', (status) => {
    expect(classifyProviderResponse(new Response(null, { status }), url)).toBe('down');
  });
  it('recognizes responses which forbid embedding', () => {
    expect(
      classifyProviderResponse(
        new Response(null, { headers: { 'x-frame-options': 'SAMEORIGIN' } }),
        url
      )
    ).toBe('down');
  });
  it('recognizes a redirect from an embed to the provider home page', () => {
    const response = new Response('homepage');
    Object.defineProperty(response, 'url', { value: 'https://provider.example/' });
    expect(classifyProviderResponse(response, url)).toBe('down');
  });
  it('does not turn a server-side connection failure into a playback block', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('fetch failed')));
    expect(await probeProvider(url)).toBe('unknown');
  });
});
