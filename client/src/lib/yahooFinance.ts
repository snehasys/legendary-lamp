/**
 * Yahoo Finance data layer - fetches live stock data via the Manus Data API proxy.
 * Available endpoints: get_stock_chart, get_stock_insights, get_stock_holders,
 * get_stock_profile, get_stock_sec_filing
 */

import { callDataApi } from "./dataApi";

// ============================================================================
// Types
// ============================================================================

export interface StockQuote {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  previousClose: number;
  dayHigh: number;
  dayLow: number;
  high52w: number;
  low52w: number;
  volume: number;
  exchange: string;
  currency: string;
}

export interface PricePoint {
  date: string;
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface StockInsights {
  recommendation: {
    rating: string;
    targetPrice: number | null;
  } | null;
  technicalOutlook: {
    shortTerm: { direction: string; score: number; scoreDescription: string } | null;
    midTerm: { direction: string; score: number; scoreDescription: string } | null;
    longTerm: { direction: string; score: number; scoreDescription: string } | null;
  };
  keyTechnicals: {
    support: number | null;
    resistance: number | null;
    stopLoss: number | null;
  };
  valuation: {
    description: string;
    discount: string;
    relativeValue: string;
    provider: string;
  } | null;
  companyScores: {
    innovativeness: number;
    hiring: number;
    sustainability: number;
    insiderSentiments: number;
    dividends: number;
  } | null;
  significantDevelopments: Array<{
    headline: string;
    date: string;
  }>;
  secReports: Array<{
    title: string;
    provider: string;
    summary: string;
  }>;
}

export interface StockProfile {
  name: string;
  sector: string;
  industry: string;
  description: string;
  website: string;
  employees: number | null;
  address: string;
  officers: Array<{
    name: string;
    title: string;
    age: number | null;
  }>;
}

export interface InsiderHolder {
  name: string;
  relation: string;
  transactionDescription: string;
  latestTransDate: string;
  positionDirect: number | null;
  positionDirectDate: string | null;
}

export interface SecFiling {
  date: string;
  type: string;
  title: string;
  edgarUrl: string;
}

// ============================================================================
// API Functions
// ============================================================================

/**
 * Fetch stock chart data (price, volume, 52W range, etc.)
 */
export async function getStockChart(
  symbol: string,
  interval: string = "1d",
  range: string = "1y"
): Promise<{ quote: StockQuote; prices: PricePoint[] } | null> {
  try {
    const response = await callDataApi<{
      chart: {
        result: Array<{
          meta: Record<string, unknown>;
          timestamp: number[];
          indicators: {
            quote: Array<{
              open: (number | null)[];
              high: (number | null)[];
              low: (number | null)[];
              close: (number | null)[];
              volume: (number | null)[];
            }>;
          };
        }>;
      };
    }>("YahooFinance/get_stock_chart", {
      symbol,
      interval,
      range,
      region: "US",
      includeAdjustedClose: "true",
    });

    const result = response?.chart?.result?.[0];
    if (!result) return null;

    const meta = result.meta;
    const prevClose = (meta.chartPreviousClose as number) || (meta.previousClose as number) || 0;
    const currentPrice = meta.regularMarketPrice as number;

    const quote: StockQuote = {
      symbol: meta.symbol as string,
      name: (meta.longName as string) || (meta.shortName as string) || symbol,
      price: currentPrice,
      change: currentPrice - prevClose,
      changePercent: prevClose ? ((currentPrice - prevClose) / prevClose) * 100 : 0,
      previousClose: prevClose,
      dayHigh: (meta.regularMarketDayHigh as number) || 0,
      dayLow: (meta.regularMarketDayLow as number) || 0,
      high52w: (meta.fiftyTwoWeekHigh as number) || 0,
      low52w: (meta.fiftyTwoWeekLow as number) || 0,
      volume: (meta.regularMarketVolume as number) || 0,
      exchange: (meta.exchangeName as string) || "",
      currency: (meta.currency as string) || "USD",
    };

    const timestamps = result.timestamp || [];
    const ohlcv = result.indicators?.quote?.[0] || { open: [], high: [], low: [], close: [], volume: [] };
    const prices: PricePoint[] = [];

    for (let i = 0; i < timestamps.length; i++) {
      const c = ohlcv.close?.[i];
      if (c == null) continue;
      prices.push({
        date: new Date(timestamps[i] * 1000).toISOString().split("T")[0],
        timestamp: timestamps[i],
        open: ohlcv.open?.[i] ?? c,
        high: ohlcv.high?.[i] ?? c,
        low: ohlcv.low?.[i] ?? c,
        close: c,
        volume: ohlcv.volume?.[i] ?? 0,
      });
    }

    return { quote, prices };
  } catch (e) {
    console.error(`Failed to fetch chart for ${symbol}:`, e);
    return null;
  }
}

/**
 * Fetch stock insights (technical analysis, valuation, recommendations)
 */
export async function getStockInsights(symbol: string): Promise<StockInsights | null> {
  try {
    const response = await callDataApi<{
      finance: {
        result: {
          instrumentInfo?: {
            recommendation?: { rating?: string; targetPrice?: number };
            technicalEvents?: {
              shortTermOutlook?: { direction?: string; score?: number; scoreDescription?: string };
              intermediateTermOutlook?: { direction?: string; score?: number; scoreDescription?: string };
              longTermOutlook?: { direction?: string; score?: number; scoreDescription?: string };
            };
            keyTechnicals?: { support?: number; resistance?: number; stopLoss?: number };
            valuation?: { description?: string; discount?: string; relativeValue?: string; provider?: string };
          };
          companySnapshot?: {
            company?: Record<string, number>;
          };
          sigDevs?: Array<{ headline?: string; date?: string }>;
          reports?: Array<{ reportTitle?: string; provider?: string; reportSummary?: string }>;
        };
      };
    }>("YahooFinance/get_stock_insights", { symbol });

    const result = response?.finance?.result;
    if (!result) return null;

    const inst = result.instrumentInfo;
    const snapshot = result.companySnapshot;

    return {
      recommendation: inst?.recommendation
        ? { rating: inst.recommendation.rating || "N/A", targetPrice: inst.recommendation.targetPrice || null }
        : null,
      technicalOutlook: {
        shortTerm: inst?.technicalEvents?.shortTermOutlook
          ? { direction: inst.technicalEvents.shortTermOutlook.direction || "neutral", score: inst.technicalEvents.shortTermOutlook.score || 0, scoreDescription: inst.technicalEvents.shortTermOutlook.scoreDescription || "" }
          : null,
        midTerm: inst?.technicalEvents?.intermediateTermOutlook
          ? { direction: inst.technicalEvents.intermediateTermOutlook.direction || "neutral", score: inst.technicalEvents.intermediateTermOutlook.score || 0, scoreDescription: inst.technicalEvents.intermediateTermOutlook.scoreDescription || "" }
          : null,
        longTerm: inst?.technicalEvents?.longTermOutlook
          ? { direction: inst.technicalEvents.longTermOutlook.direction || "neutral", score: inst.technicalEvents.longTermOutlook.score || 0, scoreDescription: inst.technicalEvents.longTermOutlook.scoreDescription || "" }
          : null,
      },
      keyTechnicals: {
        support: inst?.keyTechnicals?.support || null,
        resistance: inst?.keyTechnicals?.resistance || null,
        stopLoss: inst?.keyTechnicals?.stopLoss || null,
      },
      valuation: inst?.valuation
        ? { description: inst.valuation.description || "", discount: inst.valuation.discount || "", relativeValue: inst.valuation.relativeValue || "", provider: inst.valuation.provider || "" }
        : null,
      companyScores: snapshot?.company
        ? { innovativeness: snapshot.company.innovativeness ?? 0, hiring: snapshot.company.hiring ?? 0, sustainability: snapshot.company.sustainability ?? 0, insiderSentiments: snapshot.company.insiderSentiments ?? 0, dividends: snapshot.company.dividends ?? 0 }
        : null,
      significantDevelopments: (result.sigDevs || []).map((d) => ({ headline: d.headline || "", date: d.date || "" })),
      secReports: (result.reports || []).map((r) => ({ title: r.reportTitle || "", provider: r.provider || "", summary: r.reportSummary || "" })),
    };
  } catch (e) {
    console.error(`Failed to fetch insights for ${symbol}:`, e);
    return null;
  }
}

/**
 * Fetch stock profile (company info, officers)
 */
export async function getStockProfile(symbol: string): Promise<StockProfile | null> {
  try {
    const response = await callDataApi<{
      quoteSummary: {
        result: Array<{
          assetProfile?: {
            longBusinessSummary?: string;
            website?: string;
            sector?: string;
            industry?: string;
            fullTimeEmployees?: number;
            address1?: string;
            city?: string;
            state?: string;
            country?: string;
            companyOfficers?: Array<{ name?: string; title?: string; age?: number }>;
          };
          quoteType?: { longName?: string; shortName?: string };
        }>;
      };
    }>("YahooFinance/get_stock_profile", { symbol });

    const result = response?.quoteSummary?.result?.[0];
    if (!result?.assetProfile) return null;

    const profile = result.assetProfile;
    return {
      name: result.quoteType?.longName || result.quoteType?.shortName || symbol,
      sector: profile.sector || "N/A",
      industry: profile.industry || "N/A",
      description: profile.longBusinessSummary || "",
      website: profile.website || "",
      employees: profile.fullTimeEmployees || null,
      address: [profile.address1, profile.city, profile.state, profile.country].filter(Boolean).join(", "),
      officers: (profile.companyOfficers || []).slice(0, 10).map((o) => ({ name: o.name || "N/A", title: o.title || "N/A", age: o.age || null })),
    };
  } catch (e) {
    console.error(`Failed to fetch profile for ${symbol}:`, e);
    return null;
  }
}

/**
 * Fetch insider holders
 */
export async function getStockHolders(symbol: string): Promise<InsiderHolder[]> {
  try {
    const response = await callDataApi<{
      quoteSummary: {
        result: Array<{
          insiderHolders?: {
            holders?: Array<{
              name?: string;
              relation?: string;
              transactionDescription?: string;
              latestTransDate?: { fmt?: string };
              positionDirect?: { raw?: number };
              positionDirectDate?: { fmt?: string };
            }>;
          };
        }>;
      };
    }>("YahooFinance/get_stock_holders", { symbol });

    const holders = response?.quoteSummary?.result?.[0]?.insiderHolders?.holders;
    if (!holders) return [];

    return holders.map((h) => ({
      name: h.name || "N/A",
      relation: h.relation || "N/A",
      transactionDescription: h.transactionDescription || "N/A",
      latestTransDate: h.latestTransDate?.fmt || "N/A",
      positionDirect: h.positionDirect?.raw || null,
      positionDirectDate: h.positionDirectDate?.fmt || null,
    }));
  } catch (e) {
    console.error(`Failed to fetch holders for ${symbol}:`, e);
    return [];
  }
}

/**
 * Fetch SEC filings
 */
export async function getSecFilings(symbol: string): Promise<SecFiling[]> {
  try {
    const response = await callDataApi<{
      quoteSummary: {
        result: Array<{
          secFilings?: {
            filings?: Array<{ date?: string; type?: string; title?: string; edgarUrl?: string }>;
          };
        }>;
      };
    }>("YahooFinance/get_stock_sec_filing", { symbol });

    const filings = response?.quoteSummary?.result?.[0]?.secFilings?.filings;
    if (!filings) return [];

    return filings.slice(0, 20).map((f) => ({ date: f.date || "", type: f.type || "", title: f.title || "", edgarUrl: f.edgarUrl || "" }));
  } catch (e) {
    console.error(`Failed to fetch SEC filings for ${symbol}:`, e);
    return [];
  }
}

// ============================================================================
// Technical Indicator Calculations
// ============================================================================

/** Calculate Simple Moving Average (SMA) */
export function calculateSMA(prices: number[], period: number): number[] {
  const sma: number[] = [];
  for (let i = 0; i < prices.length; i++) {
    if (i < period - 1) {
      sma.push(NaN);
    } else {
      const slice = prices.slice(i - period + 1, i + 1);
      sma.push(slice.reduce((a, b) => a + b, 0) / period);
    }
  }
  return sma;
}

/** Calculate Exponential Moving Average (EMA) */
export function calculateEMA(prices: number[], period: number): number[] {
  const ema: number[] = [];
  const multiplier = 2 / (period + 1);
  let sum = 0;
  for (let i = 0; i < period; i++) {
    sum += prices[i];
    ema.push(NaN);
  }
  ema[period - 1] = sum / period;
  for (let i = period; i < prices.length; i++) {
    ema.push((prices[i] - ema[i - 1]) * multiplier + ema[i - 1]);
  }
  return ema;
}

/** Calculate RSI (Relative Strength Index) */
export function calculateRSI(prices: number[], period: number = 14): number[] {
  const rsi: number[] = [];
  const gains: number[] = [];
  const losses: number[] = [];

  for (let i = 1; i < prices.length; i++) {
    const diff = prices[i] - prices[i - 1];
    gains.push(diff > 0 ? diff : 0);
    losses.push(diff < 0 ? -diff : 0);
  }

  for (let i = 0; i < period; i++) rsi.push(NaN);

  let avgGain = gains.slice(0, period).reduce((a, b) => a + b, 0) / period;
  let avgLoss = losses.slice(0, period).reduce((a, b) => a + b, 0) / period;
  rsi.push(avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss));

  for (let i = period; i < gains.length; i++) {
    avgGain = (avgGain * (period - 1) + gains[i]) / period;
    avgLoss = (avgLoss * (period - 1) + losses[i]) / period;
    rsi.push(avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss));
  }
  return rsi;
}

/** Calculate MACD */
export function calculateMACD(prices: number[], fast = 12, slow = 26, signal = 9) {
  const emaFast = calculateEMA(prices, fast);
  const emaSlow = calculateEMA(prices, slow);
  const macdLine: number[] = [];
  for (let i = 0; i < prices.length; i++) {
    if (isNaN(emaFast[i]) || isNaN(emaSlow[i])) {
      macdLine.push(NaN);
    } else {
      macdLine.push(emaFast[i] - emaSlow[i]);
    }
  }
  const validMacd = macdLine.filter((v) => !isNaN(v));
  const signalLine = calculateEMA(validMacd, signal);
  return { macdLine, signalLine };
}

// ============================================================================
// Stock Universe (Top 50 US stocks by market cap)
// ============================================================================

export const STOCK_UNIVERSE = [
  "AAPL", "MSFT", "GOOGL", "AMZN", "NVDA", "META", "TSLA", "JPM", "V", "JNJ",
  "WMT", "XOM", "UNH", "MA", "PG", "HD", "BAC", "KO", "AVGO", "LLY",
  "NFLX", "CRM", "ORCL", "ADBE", "AMD", "INTC", "DIS", "PFE", "COST", "GS",
  "CVX", "MRK", "ABBV", "TMO", "CSCO", "PEP", "ABT", "MCD", "ACN", "NKE",
  "QCOM", "TXN", "NEE", "LOW", "UPS", "CAT", "HON", "IBM", "GE", "BA",
];
