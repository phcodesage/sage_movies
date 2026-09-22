export type ServerHealth = 'up' | 'down' | 'unknown';

// Reachability is advisory: HTML can contain error messages inside a working
// player's JS bundle. It cannot prove whether a particular movie will play.
export function classifyProviderResponse(response: Response, requestedUrl: string): ServerHealth {
  if ([401, 403, 429].includes(response.status)) return 'unknown';
  if (!response.ok) return 'down';
  const framePolicy = response.headers.get('x-frame-options')?.toLowerCase();
  if (framePolicy === 'deny' || framePolicy === 'sameorigin') return 'down';
  const finalUrl = new URL(response.url || requestedUrl);
  const original = new URL(requestedUrl);
  if (
    finalUrl.pathname.startsWith('/lander') ||
    (original.pathname.startsWith('/embed/') && finalUrl.pathname === '/')
  )
    return 'down';
  return 'up';
}

export async function probeProvider(url: string): Promise<ServerHealth> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 5000);
  try {
    const response = await fetch(url, {
      redirect: 'follow',
      signal: controller.signal,
      cache: 'no-store',
      headers: { Accept: 'text/html' },
    });
    const status = classifyProviderResponse(response, url);
    await response.body?.cancel();
    return status;
  } catch {
    // Server-side DNS, regional restrictions and timeouts need not affect a browser.
    return 'unknown';
  } finally {
    clearTimeout(timer);
  }
}
