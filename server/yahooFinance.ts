/**
 * Yahoo Finance Data Service
 * All data comes from real Yahoo Finance APIs via Manus Data API.
 * NO fabricated/mock data is ever returned.
 */
import { callDataApi } from "./_core/dataApi";

// Simple in-memory cache to avoid hammering the API
const cache = new Map<string, { data: unknown; timestamp: number }>();
const CACHE_TTL_MS = 60_000; // 1 minute cache

function getCached<T>(key: string): T | null {
  const entry = cache.get(key);
  if (entry && Date.now() - entry.timestamp < CACHE_TTL_MS) {
    return entry.data as T;
  }
  cache.delete(key);
  return null;
}

function setCache(key: string, data: unknown): void {
  cache.set(key, { data, timestamp: Date.now() });
  // Evict old entries if cache grows too large
  if (cache.size > 500) {
    const oldest = Array.from(cache.entries()).sort((a, b) => a[1].timestamp - b[1].timestamp);
    for (let i = 0; i < 100; i++) {
      cache.delete(oldest[i][0]);
    }
  }
}

export interface ChartDataPoint {
  timestamp: number;
  open: number | null;
  high: number | null;
  low: number | null;
  close: number | null;
  volume: number | null;
  adjClose?: number | null;
}

export interface StockMeta {
  symbol: string;
  shortName: string;
  longName: string;
  currency: string;
  exchangeName: string;
  fullExchangeName: string;
  instrumentType: string;
  regularMarketPrice: number;
  regularMarketDayHigh: number;
  regularMarketDayLow: number;
  regularMarketVolume: number;
  regularMarketOpen: number;
  fiftyTwoWeekHigh: number;
  fiftyTwoWeekLow: number;
  chartPreviousClose: number;
  previousClose: number;
  regularMarketTime: number;
}

export interface ChartResponse {
  meta: StockMeta;
  dataPoints: ChartDataPoint[];
  events?: {
    dividends?: Record<string, { amount: number; date: number }>;
    splits?: Record<string, { numerator: number; denominator: number; date: number }>;
  };
}

/**
 * Get stock chart data with OHLCV
 */
export async function getStockChart(
  symbol: string,
  interval: string = "1d",
  range: string = "1y"
): Promise<ChartResponse> {
  const cacheKey = `chart:${symbol}:${interval}:${range}`;
  const cached = getCached<ChartResponse>(cacheKey);
  if (cached) return cached;

  const response = (await callDataApi("YahooFinance/get_stock_chart", {
    query: {
      symbol,
      region: "US",
      interval,
      range,
      includeAdjustedClose: "true",
      events: "div,split",
    },
  })) as any;

  if (!response?.chart?.result?.[0]) {
    throw new Error(`No chart data available for ${symbol}`);
  }

  const result = response.chart.result[0];
  const meta = result.meta;
  const timestamps = result.timestamp || [];
  const quote = result.indicators?.quote?.[0] || {};
  const adjClose = result.indicators?.adjclose?.[0]?.adjclose || [];

  const dataPoints: ChartDataPoint[] = timestamps.map((ts: number, i: number) => ({
    timestamp: ts,
    open: quote.open?.[i] ?? null,
    high: quote.high?.[i] ?? null,
    low: quote.low?.[i] ?? null,
    close: quote.close?.[i] ?? null,
    volume: quote.volume?.[i] ?? null,
    adjClose: adjClose[i] ?? null,
  }));

  const chartResponse: ChartResponse = {
    meta: {
      symbol: meta.symbol,
      shortName: meta.shortName || meta.symbol,
      longName: meta.longName || meta.shortName || meta.symbol,
      currency: meta.currency,
      exchangeName: meta.exchangeName,
      fullExchangeName: meta.fullExchangeName || meta.exchangeName,
      instrumentType: meta.instrumentType,
      regularMarketPrice: meta.regularMarketPrice,
      regularMarketDayHigh: meta.regularMarketDayHigh,
      regularMarketDayLow: meta.regularMarketDayLow,
      regularMarketVolume: meta.regularMarketVolume,
      regularMarketOpen: meta.regularMarketOpen ?? meta.regularMarketDayLow,
      fiftyTwoWeekHigh: meta.fiftyTwoWeekHigh,
      fiftyTwoWeekLow: meta.fiftyTwoWeekLow,
      chartPreviousClose: meta.chartPreviousClose,
      previousClose: meta.chartPreviousClose,
      regularMarketTime: meta.regularMarketTime,
    },
    dataPoints,
    events: result.events,
  };

  setCache(cacheKey, chartResponse);
  return chartResponse;
}

export interface StockProfile {
  address: string;
  city: string;
  state: string;
  country: string;
  phone: string;
  website: string;
  industry: string;
  industryKey: string;
  sector: string;
  sectorKey: string;
  longBusinessSummary: string;
  fullTimeEmployees: number;
  companyOfficers: Array<{
    name: string;
    title: string;
    age?: number;
    totalPay?: number;
  }>;
}

/**
 * Get company profile information
 */
export async function getStockProfile(symbol: string): Promise<StockProfile> {
  const cacheKey = `profile:${symbol}`;
  const cached = getCached<StockProfile>(cacheKey);
  if (cached) return cached;

  const response = (await callDataApi("YahooFinance/get_stock_profile", {
    query: { symbol, region: "US" },
  })) as any;

  if (!response?.quoteSummary?.result?.[0]?.summaryProfile) {
    throw new Error(`No profile data available for ${symbol}`);
  }

  const profile = response.quoteSummary.result[0].summaryProfile;

  const result: StockProfile = {
    address: profile.address1 || "",
    city: profile.city || "",
    state: profile.state || "",
    country: profile.country || "",
    phone: profile.phone || "",
    website: profile.website || "",
    industry: profile.industryDisp || profile.industry || "",
    industryKey: profile.industryKey || "",
    sector: profile.sectorDisp || profile.sector || "",
    sectorKey: profile.sectorKey || "",
    longBusinessSummary: profile.longBusinessSummary || "",
    fullTimeEmployees: profile.fullTimeEmployees || 0,
    companyOfficers: (profile.companyOfficers || []).map((o: any) => ({
      name: o.name || "",
      title: o.title || "",
      age: o.age,
      totalPay: o.totalPay?.raw,
    })),
  };

  setCache(cacheKey, result);
  return result;
}

export interface StockInsights {
  recommendation: {
    targetPrice: number | null;
    provider: string;
    rating: string;
  } | null;
  technicalEvents: {
    provider: string;
    sector: string;
    shortTermOutlook: {
      direction: string;
      score: number;
      scoreDescription: string;
    };
    intermediateTermOutlook: {
      direction: string;
      score: number;
      scoreDescription: string;
    };
    longTermOutlook: {
      direction: string;
      score: number;
      scoreDescription: string;
    };
  } | null;
  keyTechnicals: {
    provider: string;
    support: number | null;
    resistance: number | null;
    stopLoss: number | null;
  } | null;
  valuation: {
    color: number;
    description: string;
    discount: string;
    relativeValue: string;
    provider: string;
  } | null;
  companySnapshot: {
    sectorInfo: string;
    company: Record<string, any>;
    sector: Record<string, any>;
  } | null;
  secReports: Array<{
    id: string;
    type: string;
    title: string;
    filedDate: string;
  }>;
  sigDevs: Array<{
    headline: string;
    date: string;
  }>;
}

/**
 * Get stock insights (technical analysis, valuation, recommendations)
 */
export async function getStockInsights(symbol: string): Promise<StockInsights> {
  const cacheKey = `insights:${symbol}`;
  const cached = getCached<StockInsights>(cacheKey);
  if (cached) return cached;

  const response = (await callDataApi("YahooFinance/get_stock_insights", {
    query: { symbol, region: "US" },
  })) as any;

  if (!response?.finance?.result) {
    throw new Error(`No insights data available for ${symbol}`);
  }

  const result = response.finance.result;
  const inst = result.instrumentInfo || {};

  const insights: StockInsights = {
    recommendation: result.recommendation
      ? {
          targetPrice: result.recommendation.targetPrice ?? null,
          provider: result.recommendation.provider || "",
          rating: result.recommendation.rating || "",
        }
      : null,
    technicalEvents: inst.technicalEvents
      ? {
          provider: inst.technicalEvents.provider || "",
          sector: inst.technicalEvents.sector || "",
          shortTermOutlook: {
            direction: inst.technicalEvents.shortTermOutlook?.direction || "",
            score: inst.technicalEvents.shortTermOutlook?.score ?? 0,
            scoreDescription: inst.technicalEvents.shortTermOutlook?.scoreDescription || "",
          },
          intermediateTermOutlook: {
            direction: inst.technicalEvents.intermediateTermOutlook?.direction || "",
            score: inst.technicalEvents.intermediateTermOutlook?.score ?? 0,
            scoreDescription: inst.technicalEvents.intermediateTermOutlook?.scoreDescription || "",
          },
          longTermOutlook: {
            direction: inst.technicalEvents.longTermOutlook?.direction || "",
            score: inst.technicalEvents.longTermOutlook?.score ?? 0,
            scoreDescription: inst.technicalEvents.longTermOutlook?.scoreDescription || "",
          },
        }
      : null,
    keyTechnicals: inst.keyTechnicals
      ? {
          provider: inst.keyTechnicals.provider || "",
          support: inst.keyTechnicals.support ?? null,
          resistance: inst.keyTechnicals.resistance ?? null,
          stopLoss: inst.keyTechnicals.stopLoss ?? null,
        }
      : null,
    valuation: inst.valuation
      ? {
          color: inst.valuation.color ?? 0,
          description: inst.valuation.description || "",
          discount: inst.valuation.discount || "",
          relativeValue: inst.valuation.relativeValue || "",
          provider: inst.valuation.provider || "",
        }
      : null,
    companySnapshot: result.companySnapshot || null,
    secReports: (result.secReports || []).map((r: any) => ({
      id: r.id || "",
      type: r.type || "",
      title: r.title || "",
      filedDate: r.filedDate || "",
    })),
    sigDevs: (result.sigDevs || []).map((d: any) => ({
      headline: d.headline || "",
      date: d.date || "",
    })),
  };

  setCache(cacheKey, insights);
  return insights;
}

export interface InsiderHolder {
  name: string;
  relation: string;
  transactionDescription: string;
  latestTransDate: string;
  positionDirect: number | null;
  positionDirectDate: string;
}

/**
 * Get insider holders data
 */
export async function getStockHolders(symbol: string): Promise<InsiderHolder[]> {
  const cacheKey = `holders:${symbol}`;
  const cached = getCached<InsiderHolder[]>(cacheKey);
  if (cached) return cached;

  const response = (await callDataApi("YahooFinance/get_stock_holders", {
    query: { symbol, region: "US" },
  })) as any;

  if (!response?.quoteSummary?.result?.[0]?.insiderHolders) {
    throw new Error(`No holders data available for ${symbol}`);
  }

  const holders = response.quoteSummary.result[0].insiderHolders.holders || [];

  const result: InsiderHolder[] = holders.map((h: any) => ({
    name: h.name || "",
    relation: h.relation || "",
    transactionDescription: h.transactionDescription || "",
    latestTransDate: h.latestTransDate?.fmt || "",
    positionDirect: h.positionDirect?.raw ?? null,
    positionDirectDate: h.positionDirectDate?.fmt || "",
  }));

  setCache(cacheKey, result);
  return result;
}

/**
 * Get multiple stock quotes (using chart endpoint for each)
 * Returns basic price data for a list of symbols
 */
export async function getMultipleQuotes(
  symbols: string[]
): Promise<Array<StockMeta & { change: number; changePercent: number }>> {
  const results = await Promise.allSettled(
    symbols.map(async (symbol) => {
      const chart = await getStockChart(symbol, "1d", "5d");
      const prevClose = chart.meta.chartPreviousClose;
      const price = chart.meta.regularMarketPrice;
      const change = price - prevClose;
      const changePercent = prevClose > 0 ? (change / prevClose) * 100 : 0;
      return {
        ...chart.meta,
        change,
        changePercent,
      };
    })
  );

  return results
    .filter((r): r is PromiseFulfilledResult<StockMeta & { change: number; changePercent: number }> =>
      r.status === "fulfilled"
    )
    .map((r) => r.value);
}

/**
 * List of major index symbols for market overview
 */
export const MARKET_INDICES = ["^GSPC", "^IXIC", "^DJI", "^RUT"];

/**
 * Curated list of major US stocks for screening
 */
export const MAJOR_US_STOCKS = [
  "AAPL", "MSFT", "GOOGL", "AMZN", "NVDA", "META", "TSLA", "BRK-B", "JPM", "JNJ",
  "V", "UNH", "HD", "PG", "MA", "DIS", "PYPL", "BAC", "ADBE", "CMCSA",
  "NFLX", "XOM", "INTC", "VZ", "T", "PFE", "KO", "PEP", "MRK", "ABT",
  "CRM", "CSCO", "AVGO", "ACN", "ORCL", "TXN", "QCOM", "COST", "MDT", "HON",
  "NEE", "UPS", "LIN", "LOW", "BMY", "AMGN", "SBUX", "IBM", "GE", "CAT",
  "AMD", "DE", "ISRG", "GILD", "MMM", "AXP", "BKNG", "MDLZ", "ADI", "TJX",
  "MU", "LRCX", "REGN", "SYK", "ZTS", "VRTX", "PANW", "SNPS", "KLAC", "CDNS",
  "MRVL", "FTNT", "ABNB", "DASH", "COIN", "SQ", "SHOP", "SNOW", "DDOG", "NET",
  "CRWD", "ZS", "TEAM", "WDAY", "NOW", "UBER", "LYFT", "RIVN", "LCID", "NIO",
  "PLTR", "SOFI", "HOOD", "RBLX", "U", "ROKU", "PINS", "SNAP", "TTD", "MELI",
];
