/**
 * Manus Forge API Client
 * Calls Yahoo Finance data through the Manus Forge API proxy.
 * CORS is enabled for *.manus.space origins.
 * 
 * Available endpoints:
 * - YahooFinance/get_stock_chart: OHLCV chart data + meta (price, 52w, volume)
 * - YahooFinance/get_stock_profile: Company profile (sector, industry, description)
 * - YahooFinance/get_stock_insights: Technical analysis, valuation, recommendations
 * - YahooFinance/get_stock_holders: Insider holders data
 */

const FORGE_API_URL = import.meta.env.VITE_FORGE_API_URL || "https://forge.manus.ai";
const FORGE_API_KEY = import.meta.env.VITE_FORGE_API_KEY || "";

// Simple in-memory cache
const cache = new Map<string, { data: unknown; timestamp: number }>();
const CACHE_TTL = 60_000; // 1 minute

function getCached<T>(key: string): T | null {
  const entry = cache.get(key);
  if (entry && Date.now() - entry.timestamp < CACHE_TTL) {
    return entry.data as T;
  }
  cache.delete(key);
  return null;
}

function setCache(key: string, data: unknown): void {
  cache.set(key, { data, timestamp: Date.now() });
  if (cache.size > 300) {
    const oldest = Array.from(cache.entries())
      .sort((a, b) => a[1].timestamp - b[1].timestamp);
    for (let i = 0; i < 50; i++) {
      cache.delete(oldest[i][0]);
    }
  }
}

/**
 * Call the Manus Forge Data API
 */
export async function callForgeApi(
  apiId: string,
  query: Record<string, unknown>
): Promise<any> {
  const cacheKey = `${apiId}:${JSON.stringify(query)}`;
  const cached = getCached<any>(cacheKey);
  if (cached) return cached;

  const url = `${FORGE_API_URL}/webdevtoken.v1.WebDevService/CallApi`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${FORGE_API_KEY}`,
      "Content-Type": "application/json",
      "connect-protocol-version": "1",
    },
    body: JSON.stringify({ apiId, query }),
  });

  if (!response.ok) {
    throw new Error(`Forge API error: ${response.status} ${response.statusText}`);
  }

  const envelope = await response.json();

  if (!envelope.jsonData) {
    throw new Error(`Forge API returned no data for ${apiId}`);
  }

  const data = JSON.parse(envelope.jsonData);
  setCache(cacheKey, data);
  return data;
}

/**
 * Check if the Forge API is configured
 */
export function isForgeConfigured(): boolean {
  return !!FORGE_API_KEY && FORGE_API_KEY.length > 0;
}
