/**
 * Stock Screening Engine
 * Implements popular stock screens inspired by screener.in
 * Uses real-time Yahoo Finance data via the Manus Data API proxy.
 */

import {
  getStockChart,
  calculateSMA,
  calculateRSI,
  calculateEMA,
  STOCK_UNIVERSE,
  type PricePoint,
  type StockQuote,
} from "./yahooFinance";

// ============================================================================
// Types
// ============================================================================

export interface ScreenResult {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  high52w: number;
  low52w: number;
  // Screen-specific metrics
  metrics: Record<string, number | string | null>;
}

export interface StockScreen {
  id: string;
  name: string;
  description: string;
  category: "technical" | "momentum" | "value" | "volume";
  icon: string;
  run: (universe?: string[]) => Promise<ScreenResult[]>;
}

// ============================================================================
// Helper: Batch fetch chart data with rate limiting
// ============================================================================

interface CachedChartData {
  quote: StockQuote;
  prices: PricePoint[];
  fetchedAt: number;
}

const chartCache = new Map<string, CachedChartData>();
const CHART_CACHE_TTL = 10 * 60 * 1000; // 10 minutes

async function fetchChartBatch(
  symbols: string[],
  range: string = "1y"
): Promise<Map<string, CachedChartData>> {
  const results = new Map<string, CachedChartData>();
  const toFetch: string[] = [];

  // Check cache first
  for (const sym of symbols) {
    const cached = chartCache.get(`${sym}:${range}`);
    if (cached && Date.now() - cached.fetchedAt < CHART_CACHE_TTL) {
      results.set(sym, cached);
    } else {
      toFetch.push(sym);
    }
  }

  // Fetch sequentially with delay to avoid rate limiting (Yahoo Finance has per-second limits)
  for (let i = 0; i < toFetch.length; i++) {
    const sym = toFetch[i];
    try {
      const data = await getStockChart(sym, "1d", range);
      if (data) {
        const cached: CachedChartData = { ...data, fetchedAt: Date.now() };
        chartCache.set(`${sym}:${range}`, cached);
        results.set(sym, cached);
      }
    } catch (e) {
      console.warn(`Failed to fetch ${sym}:`, e);
    }
    // Delay between requests to avoid rate limiting
    if (i < toFetch.length - 1) {
      await new Promise((r) => setTimeout(r, 400));
    }
  }

  return results;
}

// ============================================================================
// Screen Implementations
// ============================================================================

/**
 * 52-Week High Breakout
 * Stocks trading near or at their 52-week high (within 5%)
 * Similar to screener.in's "All time high" screen
 */
async function screen52WeekHigh(universe: string[] = STOCK_UNIVERSE): Promise<ScreenResult[]> {
  const data = await fetchChartBatch(universe, "1y");
  const results: ScreenResult[] = [];

  for (const [symbol, { quote, prices }] of data) {
    if (prices.length < 20) continue;
    const high52w = quote.high52w;
    if (high52w <= 0) continue;

    const distFromHigh = ((high52w - quote.price) / high52w) * 100;
    // Within 5% of 52-week high
    if (distFromHigh <= 5) {
      results.push({
        symbol,
        name: quote.name,
        price: quote.price,
        change: quote.change,
        changePercent: quote.changePercent,
        volume: quote.volume,
        high52w: quote.high52w,
        low52w: quote.low52w,
        metrics: {
          "Distance from 52W High (%)": -distFromHigh.toFixed(2),
          "52W High": high52w.toFixed(2),
          "52W Range %": (((quote.price - quote.low52w) / (high52w - quote.low52w)) * 100).toFixed(1),
        },
      });
    }
  }

  return results.sort((a, b) => {
    const aD = Math.abs(Number(a.metrics["Distance from 52W High (%)"]));
    const bD = Math.abs(Number(b.metrics["Distance from 52W High (%)"]));
    return aD - bD;
  });
}

/**
 * Golden Crossover
 * 50-day SMA crosses above 200-day SMA (bullish signal)
 * Classic screener.in screen
 */
async function screenGoldenCrossover(universe: string[] = STOCK_UNIVERSE): Promise<ScreenResult[]> {
  const data = await fetchChartBatch(universe, "1y");
  const results: ScreenResult[] = [];

  for (const [symbol, { quote, prices }] of data) {
    if (prices.length < 210) continue;

    const closes = prices.map((p) => p.close);
    const sma50 = calculateSMA(closes, 50);
    const sma200 = calculateSMA(closes, 200);

    const len = closes.length;
    const currentSma50 = sma50[len - 1];
    const currentSma200 = sma200[len - 1];
    const prevSma50 = sma50[len - 2];
    const prevSma200 = sma200[len - 2];

    if (isNaN(currentSma50) || isNaN(currentSma200)) continue;

    // Golden cross: SMA50 crossed above SMA200 in last 5 days
    let crossedRecently = false;
    for (let i = Math.max(0, len - 5); i < len; i++) {
      if (i > 0 && !isNaN(sma50[i]) && !isNaN(sma200[i]) && !isNaN(sma50[i - 1]) && !isNaN(sma200[i - 1])) {
        if (sma50[i] > sma200[i] && sma50[i - 1] <= sma200[i - 1]) {
          crossedRecently = true;
          break;
        }
      }
    }

    // Also include stocks where SMA50 is above SMA200 and trending up
    const isBullish = currentSma50 > currentSma200 && currentSma50 > prevSma50;

    if (crossedRecently || isBullish) {
      results.push({
        symbol,
        name: quote.name,
        price: quote.price,
        change: quote.change,
        changePercent: quote.changePercent,
        volume: quote.volume,
        high52w: quote.high52w,
        low52w: quote.low52w,
        metrics: {
          "SMA 50": currentSma50.toFixed(2),
          "SMA 200": currentSma200.toFixed(2),
          "SMA50 > SMA200": crossedRecently ? "Just Crossed ✓" : "Yes",
          "Spread %": (((currentSma50 - currentSma200) / currentSma200) * 100).toFixed(2),
        },
      });
    }
  }

  return results.sort((a, b) => Number(b.metrics["Spread %"]) - Number(a.metrics["Spread %"]));
}

/**
 * RSI Oversold (Value Opportunity)
 * Stocks with RSI below 30 - potentially oversold and due for a bounce
 */
async function screenRSIOversold(universe: string[] = STOCK_UNIVERSE): Promise<ScreenResult[]> {
  const data = await fetchChartBatch(universe, "3mo");
  const results: ScreenResult[] = [];

  for (const [symbol, { quote, prices }] of data) {
    if (prices.length < 20) continue;

    const closes = prices.map((p) => p.close);
    const rsi = calculateRSI(closes, 14);
    const currentRSI = rsi[rsi.length - 1];

    if (isNaN(currentRSI)) continue;

    if (currentRSI < 35) {
      results.push({
        symbol,
        name: quote.name,
        price: quote.price,
        change: quote.change,
        changePercent: quote.changePercent,
        volume: quote.volume,
        high52w: quote.high52w,
        low52w: quote.low52w,
        metrics: {
          RSI: currentRSI.toFixed(1),
          "Signal": currentRSI < 30 ? "Oversold" : "Near Oversold",
          "Price vs 52W Low (%)": (((quote.price - quote.low52w) / quote.low52w) * 100).toFixed(1),
        },
      });
    }
  }

  return results.sort((a, b) => Number(a.metrics["RSI"]) - Number(b.metrics["RSI"]));
}

/**
 * RSI Overbought
 * Stocks with RSI above 70 - potentially overbought
 */
async function screenRSIOverbought(universe: string[] = STOCK_UNIVERSE): Promise<ScreenResult[]> {
  const data = await fetchChartBatch(universe, "3mo");
  const results: ScreenResult[] = [];

  for (const [symbol, { quote, prices }] of data) {
    if (prices.length < 20) continue;

    const closes = prices.map((p) => p.close);
    const rsi = calculateRSI(closes, 14);
    const currentRSI = rsi[rsi.length - 1];

    if (isNaN(currentRSI)) continue;

    if (currentRSI > 65) {
      results.push({
        symbol,
        name: quote.name,
        price: quote.price,
        change: quote.change,
        changePercent: quote.changePercent,
        volume: quote.volume,
        high52w: quote.high52w,
        low52w: quote.low52w,
        metrics: {
          RSI: currentRSI.toFixed(1),
          "Signal": currentRSI > 70 ? "Overbought" : "Near Overbought",
          "Price vs 52W High (%)": (((quote.high52w - quote.price) / quote.high52w) * 100).toFixed(1),
        },
      });
    }
  }

  return results.sort((a, b) => Number(b.metrics["RSI"]) - Number(a.metrics["RSI"]));
}

/**
 * High Volume Breakout
 * Stocks with volume > 2x their 20-day average volume and positive price action
 */
async function screenHighVolume(universe: string[] = STOCK_UNIVERSE): Promise<ScreenResult[]> {
  const data = await fetchChartBatch(universe, "3mo");
  const results: ScreenResult[] = [];

  for (const [symbol, { quote, prices }] of data) {
    if (prices.length < 25) continue;

    const volumes = prices.map((p) => p.volume);
    const avgVolume20 = volumes.slice(-21, -1).reduce((a, b) => a + b, 0) / 20;
    const currentVolume = volumes[volumes.length - 1];

    if (avgVolume20 <= 0) continue;

    const volumeRatio = currentVolume / avgVolume20;

    if (volumeRatio >= 1.5 && quote.changePercent > 0) {
      results.push({
        symbol,
        name: quote.name,
        price: quote.price,
        change: quote.change,
        changePercent: quote.changePercent,
        volume: quote.volume,
        high52w: quote.high52w,
        low52w: quote.low52w,
        metrics: {
          "Volume Ratio": volumeRatio.toFixed(1) + "x",
          "Avg Volume (20d)": Math.round(avgVolume20).toLocaleString(),
          "Today Volume": currentVolume.toLocaleString(),
        },
      });
    }
  }

  return results.sort((a, b) => {
    const aR = parseFloat(String(a.metrics["Volume Ratio"]));
    const bR = parseFloat(String(b.metrics["Volume Ratio"]));
    return bR - aR;
  });
}

/**
 * Strong Momentum (Price above all key SMAs)
 * Price > SMA20 > SMA50 > SMA200 - strong uptrend
 */
async function screenStrongMomentum(universe: string[] = STOCK_UNIVERSE): Promise<ScreenResult[]> {
  const data = await fetchChartBatch(universe, "1y");
  const results: ScreenResult[] = [];

  for (const [symbol, { quote, prices }] of data) {
    if (prices.length < 210) continue;

    const closes = prices.map((p) => p.close);
    const sma20 = calculateSMA(closes, 20);
    const sma50 = calculateSMA(closes, 50);
    const sma200 = calculateSMA(closes, 200);

    const len = closes.length;
    const s20 = sma20[len - 1];
    const s50 = sma50[len - 1];
    const s200 = sma200[len - 1];

    if (isNaN(s20) || isNaN(s50) || isNaN(s200)) continue;

    // Strong momentum: Price > SMA20 > SMA50 > SMA200
    if (quote.price > s20 && s20 > s50 && s50 > s200) {
      results.push({
        symbol,
        name: quote.name,
        price: quote.price,
        change: quote.change,
        changePercent: quote.changePercent,
        volume: quote.volume,
        high52w: quote.high52w,
        low52w: quote.low52w,
        metrics: {
          "SMA 20": s20.toFixed(2),
          "SMA 50": s50.toFixed(2),
          "SMA 200": s200.toFixed(2),
          "Above SMA200 (%)": (((quote.price - s200) / s200) * 100).toFixed(1),
        },
      });
    }
  }

  return results.sort((a, b) => Number(b.metrics["Above SMA200 (%)"]) - Number(a.metrics["Above SMA200 (%)"]));
}

/**
 * Bullish EMA Crossover
 * EMA12 crosses above EMA26 (MACD bullish signal)
 */
async function screenBullishEMA(universe: string[] = STOCK_UNIVERSE): Promise<ScreenResult[]> {
  const data = await fetchChartBatch(universe, "6mo");
  const results: ScreenResult[] = [];

  for (const [symbol, { quote, prices }] of data) {
    if (prices.length < 30) continue;

    const closes = prices.map((p) => p.close);
    const ema12 = calculateEMA(closes, 12);
    const ema26 = calculateEMA(closes, 26);

    const len = closes.length;
    if (isNaN(ema12[len - 1]) || isNaN(ema26[len - 1])) continue;

    // Check for bullish crossover in last 3 days
    let crossedRecently = false;
    for (let i = Math.max(0, len - 3); i < len; i++) {
      if (i > 0 && !isNaN(ema12[i]) && !isNaN(ema26[i]) && !isNaN(ema12[i - 1]) && !isNaN(ema26[i - 1])) {
        if (ema12[i] > ema26[i] && ema12[i - 1] <= ema26[i - 1]) {
          crossedRecently = true;
          break;
        }
      }
    }

    if (crossedRecently) {
      results.push({
        symbol,
        name: quote.name,
        price: quote.price,
        change: quote.change,
        changePercent: quote.changePercent,
        volume: quote.volume,
        high52w: quote.high52w,
        low52w: quote.low52w,
        metrics: {
          "EMA 12": ema12[len - 1].toFixed(2),
          "EMA 26": ema26[len - 1].toFixed(2),
          "Signal": "Bullish Crossover ✓",
          "MACD": (ema12[len - 1] - ema26[len - 1]).toFixed(2),
        },
      });
    }
  }

  return results.sort((a, b) => Number(b.metrics["MACD"]) - Number(a.metrics["MACD"]));
}

/**
 * Near 52-Week Low (Value Hunting)
 * Stocks trading within 10% of their 52-week low
 */
async function screenNear52WeekLow(universe: string[] = STOCK_UNIVERSE): Promise<ScreenResult[]> {
  const data = await fetchChartBatch(universe, "1y");
  const results: ScreenResult[] = [];

  for (const [symbol, { quote }] of data) {
    if (quote.low52w <= 0) continue;

    const distFromLow = ((quote.price - quote.low52w) / quote.low52w) * 100;

    if (distFromLow <= 15) {
      results.push({
        symbol,
        name: quote.name,
        price: quote.price,
        change: quote.change,
        changePercent: quote.changePercent,
        volume: quote.volume,
        high52w: quote.high52w,
        low52w: quote.low52w,
        metrics: {
          "Distance from 52W Low (%)": distFromLow.toFixed(2),
          "52W Low": quote.low52w.toFixed(2),
          "52W Range %": (((quote.price - quote.low52w) / (quote.high52w - quote.low52w)) * 100).toFixed(1),
        },
      });
    }
  }

  return results.sort((a, b) => Number(a.metrics["Distance from 52W Low (%)"]) - Number(b.metrics["Distance from 52W Low (%)"]));
}

/**
 * Darvas Box Breakout
 * Price breaks above the high of the last 20-day consolidation range
 * with above-average volume
 */
async function screenDarvasBreakout(universe: string[] = STOCK_UNIVERSE): Promise<ScreenResult[]> {
  const data = await fetchChartBatch(universe, "3mo");
  const results: ScreenResult[] = [];

  for (const [symbol, { quote, prices }] of data) {
    if (prices.length < 30) continue;

    // Find the Darvas box: highest high in the 20-day period before the last 5 days
    const boxPrices = prices.slice(-25, -5);
    const recentPrices = prices.slice(-5);

    if (boxPrices.length < 15 || recentPrices.length < 3) continue;

    const boxHigh = Math.max(...boxPrices.map((p) => p.high));
    const boxLow = Math.min(...boxPrices.map((p) => p.low));

    // Check if recent price broke above the box high
    const latestClose = recentPrices[recentPrices.length - 1].close;
    const avgVolume = prices.slice(-25, -5).reduce((s, p) => s + p.volume, 0) / 20;
    const latestVolume = recentPrices[recentPrices.length - 1].volume;

    if (latestClose > boxHigh && latestVolume > avgVolume * 1.2) {
      results.push({
        symbol,
        name: quote.name,
        price: quote.price,
        change: quote.change,
        changePercent: quote.changePercent,
        volume: quote.volume,
        high52w: quote.high52w,
        low52w: quote.low52w,
        metrics: {
          "Box High": boxHigh.toFixed(2),
          "Box Low": boxLow.toFixed(2),
          "Breakout %": (((latestClose - boxHigh) / boxHigh) * 100).toFixed(2),
          "Volume vs Avg": (latestVolume / avgVolume).toFixed(1) + "x",
        },
      });
    }
  }

  return results.sort((a, b) => Number(b.metrics["Breakout %"]) - Number(a.metrics["Breakout %"]));
}

/**
 * Top Gainers Today
 * Stocks with the highest positive change today
 */
async function screenTopGainers(universe: string[] = STOCK_UNIVERSE): Promise<ScreenResult[]> {
  const data = await fetchChartBatch(universe, "5d");
  const results: ScreenResult[] = [];

  for (const [symbol, { quote }] of data) {
    if (quote.changePercent > 0) {
      results.push({
        symbol,
        name: quote.name,
        price: quote.price,
        change: quote.change,
        changePercent: quote.changePercent,
        volume: quote.volume,
        high52w: quote.high52w,
        low52w: quote.low52w,
        metrics: {
          "Day Change": quote.change.toFixed(2),
          "Day Change %": quote.changePercent.toFixed(2) + "%",
          "Volume": quote.volume.toLocaleString(),
        },
      });
    }
  }

  return results.sort((a, b) => b.changePercent - a.changePercent);
}

/**
 * Top Losers Today
 * Stocks with the highest negative change today
 */
async function screenTopLosers(universe: string[] = STOCK_UNIVERSE): Promise<ScreenResult[]> {
  const data = await fetchChartBatch(universe, "5d");
  const results: ScreenResult[] = [];

  for (const [symbol, { quote }] of data) {
    if (quote.changePercent < 0) {
      results.push({
        symbol,
        name: quote.name,
        price: quote.price,
        change: quote.change,
        changePercent: quote.changePercent,
        volume: quote.volume,
        high52w: quote.high52w,
        low52w: quote.low52w,
        metrics: {
          "Day Change": quote.change.toFixed(2),
          "Day Change %": quote.changePercent.toFixed(2) + "%",
          "Volume": quote.volume.toLocaleString(),
        },
      });
    }
  }

  return results.sort((a, b) => a.changePercent - b.changePercent);
}

// ============================================================================
// Screen Registry
// ============================================================================

export const STOCK_SCREENS: StockScreen[] = [
  {
    id: "52w-high-breakout",
    name: "52-Week High Breakout",
    description: "Stocks trading within 5% of their 52-week high. These stocks show strong upward momentum and may continue to make new highs.",
    category: "momentum",
    icon: "🚀",
    run: screen52WeekHigh,
  },
  {
    id: "golden-crossover",
    name: "Golden Crossover",
    description: "Stocks where the 50-day SMA is above the 200-day SMA (or recently crossed). This is a classic bullish signal indicating a potential long-term uptrend.",
    category: "technical",
    icon: "✨",
    run: screenGoldenCrossover,
  },
  {
    id: "strong-momentum",
    name: "Strong Momentum",
    description: "Stocks in a strong uptrend where Price > SMA20 > SMA50 > SMA200. All moving averages are aligned bullishly.",
    category: "momentum",
    icon: "📈",
    run: screenStrongMomentum,
  },
  {
    id: "darvas-breakout",
    name: "Darvas Box Breakout",
    description: "Stocks breaking out of a 20-day consolidation range (Darvas Box) with above-average volume. A classic momentum breakout pattern.",
    category: "technical",
    icon: "📦",
    run: screenDarvasBreakout,
  },
  {
    id: "high-volume-breakout",
    name: "High Volume Breakout",
    description: "Stocks with volume 1.5x+ their 20-day average and positive price action. High volume confirms the price move.",
    category: "volume",
    icon: "🔊",
    run: screenHighVolume,
  },
  {
    id: "bullish-ema-crossover",
    name: "Bullish EMA Crossover",
    description: "Stocks where EMA12 just crossed above EMA26 (MACD bullish signal). This indicates short-term momentum turning positive.",
    category: "technical",
    icon: "⚡",
    run: screenBullishEMA,
  },
  {
    id: "rsi-oversold",
    name: "RSI Oversold (Value)",
    description: "Stocks with RSI below 35 - potentially oversold and due for a bounce. Good for contrarian value investors.",
    category: "value",
    icon: "💎",
    run: screenRSIOversold,
  },
  {
    id: "rsi-overbought",
    name: "RSI Overbought",
    description: "Stocks with RSI above 65 - potentially overbought. May indicate strong momentum or a potential pullback.",
    category: "momentum",
    icon: "🔥",
    run: screenRSIOverbought,
  },
  {
    id: "near-52w-low",
    name: "Near 52-Week Low",
    description: "Stocks trading within 15% of their 52-week low. Potential value opportunities for contrarian investors.",
    category: "value",
    icon: "🏷️",
    run: screenNear52WeekLow,
  },
  {
    id: "top-gainers",
    name: "Top Gainers Today",
    description: "Stocks with the highest positive price change today. Shows where the market momentum is flowing.",
    category: "momentum",
    icon: "🟢",
    run: screenTopGainers,
  },
  {
    id: "top-losers",
    name: "Top Losers Today",
    description: "Stocks with the largest decline today. May present buying opportunities or signal further weakness.",
    category: "value",
    icon: "🔴",
    run: screenTopLosers,
  },
];

export function getScreenById(id: string): StockScreen | undefined {
  return STOCK_SCREENS.find((s) => s.id === id);
}
