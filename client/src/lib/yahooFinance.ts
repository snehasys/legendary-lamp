/**
 * Yahoo Finance Data Service (via Manus Forge API)
 * All data comes from real Yahoo Finance APIs proxied through Manus Forge.
 * Works for ALL US stock symbols.
 */
import { callForgeApi } from "./forgeApi";

// ============ Types ============

export interface StockQuote {
  symbol: string;
  shortName: string;
  longName: string;
  regularMarketPrice: number;
  change: number;
  changePercent: number;
  regularMarketVolume: number;
  regularMarketDayHigh: number;
  regularMarketDayLow: number;
  fiftyTwoWeekHigh: number;
  fiftyTwoWeekLow: number;
  previousClose: number;
  exchange: string;
  marketCap: number;
}

export interface ChartData {
  timestamps: number[];
  close: number[];
  volume: number[];
  open: number[];
  high: number[];
  low: number[];
  meta: {
    regularMarketPrice: number;
    chartPreviousClose: number;
    regularMarketDayHigh: number;
    regularMarketDayLow: number;
    fiftyTwoWeekHigh: number;
    fiftyTwoWeekLow: number;
    regularMarketVolume: number;
    regularMarketOpen: number;
    longName: string;
    shortName: string;
    exchangeName: string;
    currency: string;
  };
}

export interface MarketIndex {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
}

export interface StockProfile {
  address: string;
  city: string;
  state: string;
  country: string;
  phone: string;
  website: string;
  industry: string;
  sector: string;
  longBusinessSummary: string;
  fullTimeEmployees: number;
  companyOfficers: Array<{
    name: string;
    title: string;
    age?: number;
    totalPay?: number;
  }>;
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
    shortTermOutlook: { direction: string; score: number; scoreDescription: string };
    intermediateTermOutlook: { direction: string; score: number; scoreDescription: string };
    longTermOutlook: { direction: string; score: number; scoreDescription: string };
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
  secReports: Array<{ id: string; type: string; title: string; filedDate: string }>;
  sigDevs: Array<{ headline: string; date: string }>;
}

export interface InsiderHolder {
  name: string;
  relation: string;
  transactionDescription: string;
  latestTransDate: string;
  positionDirect: number | null;
  positionDirectDate: string;
}

// ============ Data Fetchers ============

/**
 * Get chart data for a stock symbol
 */
export async function getStockChart(
  symbol: string,
  interval: string = "1d",
  range: string = "1y"
): Promise<ChartData> {
  const response = await callForgeApi("YahooFinance/get_stock_chart", {
    symbol,
    region: "US",
    interval,
    range,
    includeAdjustedClose: "true",
    events: "div,split",
  });

  if (!response?.chart?.result?.[0]) {
    throw new Error(`No chart data available for ${symbol}`);
  }

  const result = response.chart.result[0];
  const meta = result.meta;
  const timestamps = result.timestamp || [];
  const quote = result.indicators?.quote?.[0] || {};

  return {
    timestamps,
    close: (quote.close || []).map((v: number | null) => v ?? 0),
    volume: (quote.volume || []).map((v: number | null) => v ?? 0),
    open: (quote.open || []).map((v: number | null) => v ?? 0),
    high: (quote.high || []).map((v: number | null) => v ?? 0),
    low: (quote.low || []).map((v: number | null) => v ?? 0),
    meta: {
      regularMarketPrice: meta.regularMarketPrice ?? 0,
      chartPreviousClose: meta.chartPreviousClose ?? 0,
      regularMarketDayHigh: meta.regularMarketDayHigh ?? 0,
      regularMarketDayLow: meta.regularMarketDayLow ?? 0,
      fiftyTwoWeekHigh: meta.fiftyTwoWeekHigh ?? 0,
      fiftyTwoWeekLow: meta.fiftyTwoWeekLow ?? 0,
      regularMarketVolume: meta.regularMarketVolume ?? 0,
      regularMarketOpen: meta.regularMarketOpen ?? 0,
      longName: meta.longName || meta.shortName || symbol,
      shortName: meta.shortName || symbol,
      exchangeName: meta.exchangeName || "NASDAQ",
      currency: meta.currency || "USD",
    },
  };
}

/**
 * Get a single stock quote (uses chart endpoint for meta data)
 */
export async function getQuote(symbol: string): Promise<StockQuote> {
  const chart = await getStockChart(symbol, "1d", "5d");
  const meta = chart.meta;
  const prevClose = meta.chartPreviousClose;
  const price = meta.regularMarketPrice;
  const change = price - prevClose;
  const changePercent = prevClose > 0 ? (change / prevClose) * 100 : 0;

  return {
    symbol: symbol.toUpperCase(),
    shortName: meta.shortName,
    longName: meta.longName,
    regularMarketPrice: price,
    change,
    changePercent,
    regularMarketVolume: meta.regularMarketVolume,
    regularMarketDayHigh: meta.regularMarketDayHigh,
    regularMarketDayLow: meta.regularMarketDayLow,
    fiftyTwoWeekHigh: meta.fiftyTwoWeekHigh,
    fiftyTwoWeekLow: meta.fiftyTwoWeekLow,
    previousClose: prevClose,
    exchange: meta.exchangeName,
    marketCap: 0, // Not available from chart endpoint
  };
}

/**
 * Get multiple stock quotes in parallel
 */
export async function getMultipleQuotes(symbols: string[]): Promise<StockQuote[]> {
  const results = await Promise.allSettled(
    symbols.map((s) => getQuote(s))
  );
  return results
    .filter((r): r is PromiseFulfilledResult<StockQuote> => r.status === "fulfilled")
    .map((r) => r.value);
}

/**
 * Get company profile
 */
export async function getStockProfile(symbol: string): Promise<StockProfile> {
  const response = await callForgeApi("YahooFinance/get_stock_profile", {
    symbol,
    region: "US",
  });

  if (!response?.quoteSummary?.result?.[0]?.summaryProfile) {
    throw new Error(`No profile data available for ${symbol}`);
  }

  const profile = response.quoteSummary.result[0].summaryProfile;

  return {
    address: profile.address1 || "",
    city: profile.city || "",
    state: profile.state || "",
    country: profile.country || "",
    phone: profile.phone || "",
    website: profile.website || "",
    industry: profile.industryDisp || profile.industry || "",
    sector: profile.sectorDisp || profile.sector || "",
    longBusinessSummary: profile.longBusinessSummary || "",
    fullTimeEmployees: profile.fullTimeEmployees || 0,
    companyOfficers: (profile.companyOfficers || []).map((o: any) => ({
      name: o.name || "",
      title: o.title || "",
      age: o.age,
      totalPay: o.totalPay?.raw,
    })),
  };
}

/**
 * Get stock insights (technical analysis, valuation, recommendations)
 */
export async function getStockInsights(symbol: string): Promise<StockInsights> {
  const response = await callForgeApi("YahooFinance/get_stock_insights", {
    symbol,
    region: "US",
  });

  if (!response?.finance?.result) {
    throw new Error(`No insights data available for ${symbol}`);
  }

  const result = response.finance.result;
  const inst = result.instrumentInfo || {};

  return {
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
}

/**
 * Get insider holders data
 */
export async function getStockHolders(symbol: string): Promise<InsiderHolder[]> {
  const response = await callForgeApi("YahooFinance/get_stock_holders", {
    symbol,
    region: "US",
  });

  if (!response?.quoteSummary?.result?.[0]?.insiderHolders) {
    throw new Error(`No holders data available for ${symbol}`);
  }

  const holders = response.quoteSummary.result[0].insiderHolders.holders || [];

  return holders.map((h: any) => ({
    name: h.name || "",
    relation: h.relation || "",
    transactionDescription: h.transactionDescription || "",
    latestTransDate: h.latestTransDate?.fmt || "",
    positionDirect: h.positionDirect?.raw ?? null,
    positionDirectDate: h.positionDirectDate?.fmt || "",
  }));
}

/**
 * Get market indices data
 */
export async function getMarketIndices(): Promise<MarketIndex[]> {
  const indexSymbols = ["^GSPC", "^IXIC", "^DJI", "^RUT"];
  const indexNames: Record<string, string> = {
    "^GSPC": "S&P 500",
    "^IXIC": "NASDAQ",
    "^DJI": "DOW 30",
    "^RUT": "Russell 2000",
  };

  try {
    const results = await Promise.allSettled(
      indexSymbols.map(async (sym) => {
        const chart = await getStockChart(sym, "1d", "5d");
        const meta = chart.meta;
        const prevClose = meta.chartPreviousClose;
        const price = meta.regularMarketPrice;
        const change = price - prevClose;
        const changePercent = prevClose > 0 ? (change / prevClose) * 100 : 0;
        return {
          symbol: sym,
          name: indexNames[sym] || sym,
          price,
          change,
          changePercent,
        };
      })
    );
    return results
      .filter((r): r is PromiseFulfilledResult<MarketIndex> => r.status === "fulfilled")
      .map((r) => r.value);
  } catch {
    return [];
  }
}

/**
 * Get top movers (gainers and losers)
 */
export async function getTopMovers(count: number = 5): Promise<{ gainers: StockQuote[]; losers: StockQuote[] }> {
  // Use a subset for speed
  const subset = STOCK_SYMBOLS.slice(0, 30);
  const quotes = await getMultipleQuotes(subset);
  const sorted = [...quotes].sort((a, b) => b.changePercent - a.changePercent);
  return {
    gainers: sorted.filter((q) => q.changePercent > 0).slice(0, count),
    losers: sorted
      .filter((q) => q.changePercent < 0)
      .sort((a, b) => a.changePercent - b.changePercent)
      .slice(0, count),
  };
}

// ============ Formatting Utilities ============

export function formatLargeNumber(num: number | null | undefined): string {
  if (num == null || isNaN(num)) return "—";
  const abs = Math.abs(num);
  const sign = num < 0 ? "-" : "";
  if (abs >= 1e12) return sign + (abs / 1e12).toFixed(2) + "T";
  if (abs >= 1e9) return sign + (abs / 1e9).toFixed(2) + "B";
  if (abs >= 1e6) return sign + (abs / 1e6).toFixed(2) + "M";
  if (abs >= 1e3) return sign + (abs / 1e3).toFixed(2) + "K";
  return sign + abs.toFixed(2);
}

export function formatPercent(num: number | null | undefined): string {
  if (num == null || isNaN(num)) return "—";
  return (num >= 0 ? "+" : "") + num.toFixed(2) + "%";
}

export function formatMarketCap(num: number | null | undefined): string {
  return formatLargeNumber(num);
}

// ============ Stock Universe ============

export const STOCK_SYMBOLS = [
  "AAPL", "MSFT", "GOOGL", "AMZN", "NVDA", "META", "TSLA", "BRK-B", "JPM", "V",
  "JNJ", "WMT", "MA", "PG", "UNH", "HD", "DIS", "NFLX", "ADBE", "CRM",
  "PYPL", "INTC", "CSCO", "PEP", "KO", "NKE", "MRK", "ABT", "TMO", "AVGO",
  "COST", "ORCL", "ACN", "MCD", "LLY", "DHR", "TXN", "NEE", "UPS", "PM",
  "BMY", "QCOM", "HON", "AMGN", "IBM", "GE", "CAT", "BA", "GS", "MMM",
];

export const SECTOR_MAP: Record<string, string> = {
  AAPL: "Technology", MSFT: "Technology", GOOGL: "Technology", AMZN: "Consumer Cyclical",
  NVDA: "Technology", META: "Technology", TSLA: "Consumer Cyclical", "BRK-B": "Financial Services",
  JPM: "Financial Services", V: "Financial Services", JNJ: "Healthcare", WMT: "Consumer Defensive",
  MA: "Financial Services", PG: "Consumer Defensive", UNH: "Healthcare", HD: "Consumer Cyclical",
  DIS: "Communication Services", NFLX: "Communication Services", ADBE: "Technology", CRM: "Technology",
  PYPL: "Financial Services", INTC: "Technology", CSCO: "Technology", PEP: "Consumer Defensive",
  KO: "Consumer Defensive", NKE: "Consumer Cyclical", MRK: "Healthcare", ABT: "Healthcare",
  TMO: "Healthcare", AVGO: "Technology", COST: "Consumer Defensive", ORCL: "Technology",
  ACN: "Technology", MCD: "Consumer Cyclical", LLY: "Healthcare", DHR: "Healthcare",
  TXN: "Technology", NEE: "Utilities", UPS: "Industrials", PM: "Consumer Defensive",
  BMY: "Healthcare", QCOM: "Technology", HON: "Industrials", AMGN: "Healthcare",
  IBM: "Technology", GE: "Industrials", CAT: "Industrials", BA: "Industrials",
  GS: "Financial Services", MMM: "Industrials",
};

export const SECTORS = [
  "Technology", "Financial Services", "Healthcare", "Consumer Cyclical",
  "Consumer Defensive", "Communication Services", "Industrials", "Utilities",
];

export function getSymbolsBySector(sector: string): string[] {
  return Object.entries(SECTOR_MAP)
    .filter(([, s]) => s === sector)
    .map(([sym]) => sym);
}

// Aliases for backward compatibility
export const MAJOR_US_STOCKS = STOCK_SYMBOLS;
export const getStockQuote = getQuote;

/**
 * Search stocks by name or symbol (client-side filter from known universe)
 */
export function searchStocks(query: string): { symbol: string; name: string }[] {
  const q = query.toLowerCase();
  return STOCK_SYMBOLS
    .filter((s) => s.toLowerCase().includes(q))
    .map((s) => ({ symbol: s, name: s }));
}
