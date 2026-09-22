// @vitest-environment node
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { describe, expect, it, vi } from 'vitest';

function worker() {
  const handlers: Record<string, (event: any) => void> = {};
  const cached = new Response('offline page');
  const fetch = vi.fn().mockRejectedValue(new TypeError('Offline'));
  const cache = {
    addAll: vi.fn().mockResolvedValue(undefined),
    match: vi.fn(),
    put: vi.fn(),
    keys: vi.fn().mockResolvedValue([]),
  };
  const caches = {
    open: vi.fn().mockResolvedValue(cache),
    match: vi.fn().mockResolvedValue(cached),
    keys: vi.fn().mockResolvedValue(['sage-pwa-v0', 'unrelated-cache']),
    delete: vi.fn().mockResolvedValue(true),
  };
  const self = {
    location: { origin: 'https://sage.test' },
    clients: { claim: vi.fn() },
    skipWaiting: vi.fn(),
    addEventListener: (name: string, callback: (event: any) => void) => {
      handlers[name] = callback;
    },
  };
  vm.runInNewContext(readFileSync(new URL('../public/sw.js', import.meta.url), 'utf8'), {
    self,
    caches,
    fetch,
    URL,
    Response,
  });
  return { handlers, caches, cache, self, fetch };
}

describe('PWA cache safety', () => {
  it('serves the offline page when a document navigation fails', async () => {
    const { handlers } = worker();
    let response: Promise<Response> | undefined;
    handlers.fetch({
      request: {
        url: 'https://sage.test/movie/550/movie-fight-club',
        method: 'GET',
        mode: 'navigate',
      },
      respondWith: (value: Promise<Response>) => {
        response = value;
      },
    });
    expect(await (await response!).text()).toBe('offline page');
  });
  it.each([
    'https://sage.test/api/movie/550',
    'https://sage.test/?_rsc=123',
    'https://provider.example/movie/550',
    'https://sage.test/video.mp4',
  ])('does not intercept %s', (url) => {
    const { handlers } = worker();
    const respondWith = vi.fn();
    handlers.fetch({ request: { url, method: 'GET', mode: 'cors' }, respondWith });
    expect(respondWith).not.toHaveBeenCalled();
  });
  it('only removes its own outdated caches', async () => {
    const { handlers, caches } = worker();
    let done: Promise<void> | undefined;
    handlers.activate({
      waitUntil: (value: Promise<void>) => {
        done = value;
      },
    });
    await done;
    expect(caches.delete).toHaveBeenCalledExactlyOnceWith('sage-pwa-v0');
  });
  it('waits for a user-triggered update before skipping the waiting state', () => {
    const { handlers, self } = worker();
    expect(self.skipWaiting).not.toHaveBeenCalled();
    handlers.message({ data: { type: 'SKIP_WAITING' } });
    expect(self.skipWaiting).toHaveBeenCalledOnce();
  });
});
