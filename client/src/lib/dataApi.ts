/**
 * Client-side helper to call Yahoo Finance APIs via the server-side proxy.
 * The proxy at /api/data forwards requests to the Manus Data API.
 */

const API_ENDPOINT = "/api/data";

// Simple in-memory cache with TTL
const cache = new Map<string, { data: unknown; expiry: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export async function callDataApi<T = unknown>(
  apiId: string,
  query: Record<string, unknown>
): Promise<T> {
  const cacheKey = `${apiId}:${JSON.stringify(query)}`;
  const cached = cache.get(cacheKey);
  if (cached && cached.expiry > Date.now()) {
    return cached.data as T;
  }

  const resp = await fetch(API_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ apiId, query }),
  });

  if (!resp.ok) {
    // Remove any stale cache entry for this key
    cache.delete(cacheKey);
    const errText = await resp.text();
    throw new Error(`API call failed (${resp.status}): ${errText}`);
  }

  const data = await resp.json();

  // Check for API-level errors in the response body
  if (data && typeof data === "object" && "code" in data && data.code) {
    cache.delete(cacheKey);
    throw new Error(`API error (${data.code}): ${data.message || "Unknown error"}`);
  }

  cache.set(cacheKey, { data, expiry: Date.now() + CACHE_TTL });
  return data as T;
}

export function clearCache() {
  cache.clear();
}
