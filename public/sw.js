/* Only app assets are cached. APIs, player frames and video streams stay on the network. */
const CACHE_PREFIX = 'sage-pwa-';
const CACHE_NAME = `${CACHE_PREFIX}v1`;
const OFFLINE_URL = '/offline.html';
const APP_ASSETS = [OFFLINE_URL, '/icons/icon-192.png', '/icons/icon-512.png'];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_ASSETS)));
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((key) => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME)
      .map((key) => caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin) return;
  if (request.mode === 'navigate') {
    event.respondWith(fetch(request).catch(async () =>
      (await caches.match(OFFLINE_URL)) || Response.error()));
    return;
  }
  // Don't cache Next's RSC responses or HTML: mixing releases can break navigation.
  if (!url.pathname.startsWith('/_next/static/') && !APP_ASSETS.includes(url.pathname)) return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(request);
    if (cached) return cached;
    const response = await fetch(request);
    if (response.ok && response.type === 'basic') {
      const copy = response.clone();
      event.waitUntil((async () => {
        await cache.put(request, copy);
        const keys = await cache.keys();
        const chunks = keys.filter((key) => new URL(key.url).pathname.startsWith('/_next/static/'));
        await Promise.all(chunks.slice(0, Math.max(0, chunks.length - 96)).map((key) => cache.delete(key)));
      })().catch(() => {}));
    }
    return response;
  })());
});
