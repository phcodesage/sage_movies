// Simple in-memory request cache to prevent duplicate API calls
const requestCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 5000; // 5 seconds

export function getCachedRequest(key: string): any | null {
  const cached = requestCache.get(key);
  if (!cached) return null;

  const { data, timestamp } = cached;
  const isExpired = Date.now() - timestamp > CACHE_TTL;

  if (isExpired) {
    requestCache.delete(key);
    return null;
  }

  return data;
}

export function setCachedRequest(key: string, data: any): void {
  requestCache.set(key, {
    data,
    timestamp: Date.now(),
  });
}

export function clearCache(): void {
  requestCache.clear();
}

// Auto-cleanup expired entries periodically
if (typeof window !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, value] of requestCache.entries()) {
      if (now - value.timestamp > CACHE_TTL) {
        requestCache.delete(key);
      }
    }
  }, CACHE_TTL);
}
