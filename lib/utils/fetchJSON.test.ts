import { afterEach, expect, it, vi } from 'vitest';
import { fetchJSON } from './fetchJSON';

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

function pendingFetch() {
  vi.stubGlobal(
    'fetch',
    vi.fn(
      (_url, options) =>
        new Promise((_resolve, reject) => {
          options.signal.addEventListener('abort', () =>
            reject(new DOMException('Aborted', 'AbortError'))
          );
        })
    )
  );
}

it('cancels a slow request without relying on AbortSignal.any', async () => {
  vi.useFakeTimers();
  pendingFetch();
  const request = fetchJSON('/api/movies', {}, 1000);
  const assertion = expect(request).rejects.toMatchObject({ name: 'AbortError' });
  await vi.advanceTimersByTimeAsync(1000);
  await assertion;
});

it('honors cancellation when the user navigates away or changes a search', async () => {
  pendingFetch();
  const controller = new AbortController();
  const request = fetchJSON('/api/movies', { signal: controller.signal });
  controller.abort();
  await expect(request).rejects.toMatchObject({ name: 'AbortError' });
});
