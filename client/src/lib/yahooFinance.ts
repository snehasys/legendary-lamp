/**
 * Client-side Yahoo Finance data service
 * Uses the v8 chart API through a CORS proxy for browser access
 */

const CORS_PROXIES = [
  "https://corsproxy.io/?",
  "https://api.allorigins.win/raw?url=",
];

const YAHOO_BASE = "https://query2.finance.yahoo.com";

let currentProxyIndex = 0;

async function fetchWithProxy(url: string): Promise<Response> {
  // Try each proxy in order
  for (let i = 0; i < CORS_PROXIES.length; i++) {
    const proxyIndex = (currentProxyIndex + i) % CORS_PROXIES.length;
    const proxyUrl = CORS_PROXIES[proxyIndex] + encodeURIComponent(url);
    try {
      const res = await fetch(proxyUrl, {
        headers: { "User-Agent": "Mozilla/5.0" },
      });
      if (res.ok) {
        currentProxyIndex = proxyIndex;
        return res;
      }
    } catch {
      // Try next proxy
    }
  }
  // Last resort: try direct (may work in some environments)
  return fetch(url);
}

export interface StockQuote {
  symbol: string;
  shortName: string;
  longName: string;
  regularMarketPrice: number;
  regularMarketDayHigh: number;
  regularMarketDayLow: number;
  regularMarketVolume: number;
  change: number;
  changePercent: number;
  fiftyTwoWeekHigh: number;
  fiftyTwoWeekLow: number;
  previousClose: number;
}

export interface ChartData {
  timestamps: number[];
  open: number[];
  high: number[];
  low: number[];
  close: number[];
  volume: number[];
  meta: {
    currency: string;
    symbol: string;
    exchangeName: string;
    longName: string;
    shortName: string;
    regularMarketPrice: number;
    fiftyTwoWeekHigh: number;
    fiftyTwoWeekLow: number;
    regularMarketDayHigh: number;
    regularMarketDayLow: number;
    regularMarketVolume: number;
    chartPreviousClose: number;
  };
}

export interface MarketIndex {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
}

// Cache to avoid excessive API calls
const quoteCache = new Map<string, { data: StockQuote; timestamp: number }>();
const CACHE_TTL = 60_000; // 1 minute

function getCachedQuote(symbol: string): StockQuote | null {
  const cached = quoteCache.get(symbol);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  return null;
}

function setCachedQuote(symbol: string, data: StockQuote): void {
  quoteCache.set(symbol, { data, timestamp: Date.now() });
}

/**
 * Get a stock quote by fetching chart data (v8 endpoint works without auth)
 */
export async function getStockQuote(symbol: string): Promise<StockQuote> {
  const cached = getCachedQuote(symbol);
  if (cached) return cached;

  const url = `${YAHOO_BASE}/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=1d`;
  const res = await fetchWithProxy(url);
  if (!res.ok) throw new Error(`Failed to fetch quote for ${symbol}`);

  const data = await res.json();
  const result = data.chart?.result?.[0];
  if (!result) throw new Error(`No data for ${symbol}`);

  const meta = result.meta;
  const previousClose = meta.chartPreviousClose || meta.previousClose || 0;
  const currentPrice = meta.regularMarketPrice || 0;
  const change = currentPrice - previousClose;
  const changePercent = previousClose > 0 ? (change / previousClose) * 100 : 0;

  const quote: StockQuote = {
    symbol: meta.symbol || symbol,
    shortName: meta.shortName || symbol,
    longName: meta.longName || meta.shortName || symbol,
    regularMarketPrice: currentPrice,
    regularMarketDayHigh: meta.regularMarketDayHigh || 0,
    regularMarketDayLow: meta.regularMarketDayLow || 0,
    regularMarketVolume: meta.regularMarketVolume || 0,
    change,
    changePercent,
    fiftyTwoWeekHigh: meta.fiftyTwoWeekHigh || 0,
    fiftyTwoWeekLow: meta.fiftyTwoWeekLow || 0,
    previousClose,
  };

  setCachedQuote(symbol, quote);
  return quote;
}

/**
 * Get multiple stock quotes in parallel (batched)
 */
export async function getMultipleQuotes(symbols: string[]): Promise<StockQuote[]> {
  // Fetch in parallel with concurrency limit
  const BATCH_SIZE = 5;
  const results: StockQuote[] = [];

  for (let i = 0; i < symbols.length; i += BATCH_SIZE) {
    const batch = symbols.slice(i, i + BATCH_SIZE);
    const batchResults = await Promise.allSettled(
      batch.map((s) => getStockQuote(s))
    );
    for (const r of batchResults) {
      if (r.status === "fulfilled") {
        results.push(r.value);
      }
    }
  }

  return results;
}

/**
 * Get chart data for a symbol
 */
export async function getStockChart(
  symbol: string,
  interval: string = "1d",
  range: string = "1y"
): Promise<ChartData> {
  const url = `${YAHOO_BASE}/v8/finance/chart/${encodeURIComponent(symbol)}?interval=${interval}&range=${range}`;
  const res = await fetchWithProxy(url);
  if (!res.ok) throw new Error(`Failed to fetch chart for ${symbol}`);

  const data = await res.json();
  const result = data.chart?.result?.[0];
  if (!result) throw new Error(`No chart data for ${symbol}`);

  const meta = result.meta;
  const timestamps = result.timestamp || [];
  const quote = result.indicators?.quote?.[0] || {};

  return {
    timestamps,
    open: quote.open || [],
    high: quote.high || [],
    low: quote.low || [],
    close: quote.close || [],
    volume: quote.volume || [],
    meta: {
      currency: meta.currency || "USD",
      symbol: meta.symbol || symbol,
      exchangeName: meta.exchangeName || "",
      longName: meta.longName || meta.shortName || symbol,
      shortName: meta.shortName || symbol,
      regularMarketPrice: meta.regularMarketPrice || 0,
      fiftyTwoWeekHigh: meta.fiftyTwoWeekHigh || 0,
      fiftyTwoWeekLow: meta.fiftyTwoWeekLow || 0,
      regularMarketDayHigh: meta.regularMarketDayHigh || 0,
      regularMarketDayLow: meta.regularMarketDayLow || 0,
      regularMarketVolume: meta.regularMarketVolume || 0,
      chartPreviousClose: meta.chartPreviousClose || 0,
    },
  };
}

/**
 * Get market indices data
 */
export async function getMarketIndices(): Promise<MarketIndex[]> {
  const indices = [
    { symbol: "^GSPC", name: "S&P 500" },
    { symbol: "^DJI", name: "DOW 30" },
    { symbol: "^RUT", name: "Russell 2000" },
  ];

  const results: MarketIndex[] = [];
  for (const idx of indices) {
    try {
      const quote = await getStockQuote(idx.symbol);
      results.push({
        symbol: idx.symbol,
        name: idx.name,
        price: quote.regularMarketPrice,
        change: quote.change,
        changePercent: quote.changePercent,
      });
    } catch {
      // Skip failed indices
    }
  }
  return results;
}

/**
 * Get top movers (gainers and losers) from a set of major stocks
 */
export async function getTopMovers(count: number = 5): Promise<{
  gainers: StockQuote[];
  losers: StockQuote[];
}> {
  const majorStocks = [
    "AAPL", "MSFT", "GOOGL", "AMZN", "NVDA", "META", "TSLA", "JPM", "V",
    "UNH", "HD", "PG", "MA", "DIS", "NFLX", "AMD", "CRM", "AVGO", "COST",
    "ADBE", "BAC", "INTC", "PYPL", "ORCL", "CSCO",
  ];

  const quotes = await getMultipleQuotes(majorStocks);
  const sorted = [...quotes].sort((a, b) => b.changePercent - a.changePercent);

  return {
    gainers: sorted.filter((q) => q.changePercent > 0).slice(0, count),
    losers: sorted
      .filter((q) => q.changePercent < 0)
      .sort((a, b) => a.changePercent - b.changePercent)
      .slice(0, count),
  };
}

// Major US stocks list
export const MAJOR_US_STOCKS = [
  "AAPL", "MSFT", "GOOGL", "AMZN", "NVDA", "META", "TSLA", "BRK-B", "JPM", "V",
  "UNH", "HD", "PG", "MA", "DIS", "NFLX", "AMD", "CRM", "AVGO", "COST",
  "ADBE", "BAC", "INTC", "PYPL", "ORCL", "CSCO", "NKE", "KO", "PEP", "MRK",
  "ABT", "TMO", "DHR", "LIN", "QCOM", "TXN", "NEE", "UPS", "PM", "RTX",
  "HON", "AMGN", "IBM", "GE", "CAT", "ISRG", "VRTX", "REGN", "GILD", "MDT",
];

export const SECTORS = [
  "Technology", "Healthcare", "Financial", "Consumer Cyclical",
  "Communication", "Industrial", "Consumer Defensive", "Energy",
  "Real Estate", "Utilities", "Basic Materials",
];
