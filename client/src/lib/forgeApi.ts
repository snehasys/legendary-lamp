/**
 * Manus Forge API Client
 * Calls Yahoo Finance data through the Manus Forge API proxy.
 * Includes rate limiting, retry logic, and sequential batching to avoid 429 errors.
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
const CACHE_TTL = 5 * 60_000; // 5 minutes cache for GH Pages (no server-side cache)

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

// Rate limiting: sequential queue with delay between requests
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 350; // ms between requests

async function waitForRateLimit(): Promise<void> {
  const now = Date.now();
  const elapsed = now - lastRequestTime;
  if (elapsed < MIN_REQUEST_INTERVAL) {
    await new Promise((r) => setTimeout(r, MIN_REQUEST_INTERVAL - elapsed));
  }
  lastRequestTime = Date.now();
}

// Request queue for serialization
let requestQueue: Promise<void> = Promise.resolve();

function enqueue<T>(fn: () => Promise<T>): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    requestQueue = requestQueue.then(async () => {
      try {
        const result = await fn();
        resolve(result);
      } catch (e) {
        reject(e);
      }
    });
  });
}

/**
 * Call the Manus Forge Data API with rate limiting and retry
 */
export async function callForgeApi(
  apiId: string,
  query: Record<string, unknown>
): Promise<any> {
  const cacheKey = `${apiId}:${JSON.stringify(query)}`;
  const cached = getCached<any>(cacheKey);
  if (cached) return cached;

  // Enqueue the request to ensure sequential execution
  return enqueue(async () => {
    // Double-check cache (another queued request might have populated it)
    const cached2 = getCached<any>(cacheKey);
    if (cached2) return cached2;

    await waitForRateLimit();

    const url = `${FORGE_API_URL}/webdevtoken.v1.WebDevService/CallApi`;

    // Retry logic with exponential backoff
    let lastError: Error | null = null;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const response = await fetch(url, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${FORGE_API_KEY}`,
            "Content-Type": "application/json",
            "connect-protocol-version": "1",
          },
          body: JSON.stringify({ apiId, query }),
        });

        if (response.status === 429) {
          // Rate limited - wait longer and retry
          const backoff = (attempt + 1) * 2000;
          await new Promise((r) => setTimeout(r, backoff));
          lastError = new Error(`Rate limited (429) on attempt ${attempt + 1}`);
          continue;
        }

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
      } catch (e: any) {
        lastError = e;
        if (attempt < 2) {
          const backoff = (attempt + 1) * 1000;
          await new Promise((r) => setTimeout(r, backoff));
        }
      }
    }

    throw lastError || new Error(`Failed to fetch ${apiId} after 3 attempts`);
  });
}

/**
 * Check if the Forge API is configured
 */
export function isForgeConfigured(): boolean {
  return !!FORGE_API_KEY && FORGE_API_KEY.length > 0;
}
