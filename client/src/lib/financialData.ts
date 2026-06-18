/**
 * Financial Data Service using Yahoo Finance via Manus Forge API
 * 
 * Note: The Yahoo Finance endpoints available through Forge API do NOT provide
 * financial statements (income, balance sheet, cash flow) or valuation ratios
 * (PE, PB, EV/EBITDA, etc.). Those require premium API access.
 * 
 * What IS available:
 * - Company scoring (innovativeness, hiring, sustainability, etc.) from insights
 * - SEC filings from get_stock_sec_filing
 * - Technical analysis from insights
 * - Insider holders from get_stock_holders
 * - Price data from get_stock_chart
 */
import { callForgeApi } from "./forgeApi";

// ============ Types ============

export interface IncomeStatementRow {
  period: string;
  revenue: number | null;
  costOfRevenue: number | null;
  grossProfit: number | null;
  operatingExpenses: number | null;
  operatingIncome: number | null;
  netIncome: number | null;
  eps: number | null;
  epsDiluted: number | null;
  ebitda: number | null;
}

export interface BalanceSheetRow {
  period: string;
  totalAssets: number | null;
  currentAssets: number | null;
  cash: number | null;
  accountsReceivable: number | null;
  inventory: number | null;
  totalLiabilities: number | null;
  currentLiabilities: number | null;
  accountsPayable: number | null;
  totalDebt: number | null;
  stockholdersEquity: number | null;
}

export interface CashFlowRow {
  period: string;
  operatingCashFlow: number | null;
  capitalExpenditure: number | null;
  freeCashFlow: number | null;
  investingCashFlow: number | null;
  financingCashFlow: number | null;
  dividendsPaid: number | null;
  shareRepurchases: number | null;
}

export interface KeyRatios {
  peRatio: number | null;
  forwardPE: number | null;
  pegRatio: number | null;
  pbRatio: number | null;
  priceToSales: number | null;
  evToRevenue: number | null;
  evToEbitda: number | null;
  grossMargin: number | null;
  operatingMargin: number | null;
  netMargin: number | null;
  returnOnEquity: number | null;
  returnOnAssets: number | null;
  debtToEquity: number | null;
  currentRatio: number | null;
  marketCap: number | null;
  enterpriseValue: number | null;
  sharesOutstanding: number | null;
  insiderOwnership: number | null;
  institutionalOwnership: number | null;
  revenueGrowth: number | null;
  earningsGrowth: number | null;
  dividendYield: number | null;
  epsGrowth: number | null;
}

export interface CompanyScores {
  innovativeness: number | null;
  hiring: number | null;
  sustainability: number | null;
  insiderSentiments: number | null;
  earningsReports: number | null;
  dividends: number | null;
}

export interface CompanyFacts {
  entityName: string;
  cik: string;
  _incomeAnnual: IncomeStatementRow[];
  _incomeQuarterly: IncomeStatementRow[];
  _balanceAnnual: BalanceSheetRow[];
  _balanceQuarterly: BalanceSheetRow[];
  _cashFlowAnnual: CashFlowRow[];
  _cashFlowQuarterly: CashFlowRow[];
  _ratios: KeyRatios | null;
  _companyScores: CompanyScores | null;
  _sectorScores: CompanyScores | null;
  _sectorName: string | null;
}

export interface SecFiling {
  date: string;
  type: string;
  title: string;
  edgarUrl: string;
  exhibits: { type: string; url: string }[];
}

// ============ Helpers ============

function parseNum(val: any): number | null {
  if (val === null || val === undefined || val === "" || val === "null") return null;
  if (typeof val === "object" && val.raw !== undefined) return parseNum(val.raw);
  const n = Number(val);
  return isNaN(n) ? null : n;
}

// ============ Main Data Fetcher ============

const factsCache = new Map<string, { data: CompanyFacts; timestamp: number }>();
const FACTS_CACHE_TTL = 5 * 60_000; // 5 minutes

export async function getCompanyFacts(symbol: string): Promise<CompanyFacts | null> {
  const cacheKey = symbol.toUpperCase();
  const cached = factsCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < FACTS_CACHE_TTL) {
    return cached.data;
  }

  try {
    // Fetch insights data which includes companySnapshot with scoring data
    const response = await callForgeApi("YahooFinance/get_stock_insights", {
      symbol: cacheKey,
    });
    const insightsResult = response?.finance?.result || {};

    // Extract company scores from companySnapshot
    const snapshot = insightsResult?.companySnapshot || {};
    const companyScores: CompanyScores = {
      innovativeness: parseNum(snapshot?.company?.innovativeness),
      hiring: parseNum(snapshot?.company?.hiring),
      sustainability: parseNum(snapshot?.company?.sustainability),
      insiderSentiments: parseNum(snapshot?.company?.insiderSentiments),
      earningsReports: parseNum(snapshot?.company?.earningsReports),
      dividends: parseNum(snapshot?.company?.dividends),
    };

    const sectorScores: CompanyScores = {
      innovativeness: parseNum(snapshot?.sector?.innovativeness),
      hiring: parseNum(snapshot?.sector?.hiring),
      sustainability: parseNum(snapshot?.sector?.sustainability),
      insiderSentiments: parseNum(snapshot?.sector?.insiderSentiments),
      earningsReports: parseNum(snapshot?.sector?.earningsReports),
      dividends: parseNum(snapshot?.sector?.dividends),
    };

    // Financial ratios are NOT available from the Yahoo Finance API endpoints
    // The companySnapshot only contains scoring data, not financial metrics
    const ratios: KeyRatios = {
      peRatio: null,
      forwardPE: null,
      pegRatio: null,
      pbRatio: null,
      priceToSales: null,
      evToRevenue: null,
      evToEbitda: null,
      grossMargin: null,
      operatingMargin: null,
      netMargin: null,
      returnOnEquity: null,
      returnOnAssets: null,
      debtToEquity: null,
      currentRatio: null,
      marketCap: null,
      enterpriseValue: null,
      sharesOutstanding: null,
      insiderOwnership: null,
      institutionalOwnership: null,
      revenueGrowth: null,
      earningsGrowth: null,
      dividendYield: null,
      epsGrowth: null,
    };

    const result: CompanyFacts = {
      entityName: symbol,
      cik: "",
      _incomeAnnual: [],
      _incomeQuarterly: [],
      _balanceAnnual: [],
      _balanceQuarterly: [],
      _cashFlowAnnual: [],
      _cashFlowQuarterly: [],
      _ratios: ratios,
      _companyScores: companyScores,
      _sectorScores: sectorScores,
      _sectorName: snapshot?.sectorInfo || null,
    };

    factsCache.set(cacheKey, { data: result, timestamp: Date.now() });
    return result;
  } catch {
    return null;
  }
}

// ============ SEC Filings Fetcher ============

const secCache = new Map<string, { data: SecFiling[]; timestamp: number }>();

export async function getSecFilings(symbol: string): Promise<SecFiling[]> {
  const cacheKey = symbol.toUpperCase();
  const cached = secCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < FACTS_CACHE_TTL) {
    return cached.data;
  }

  try {
    const response = await callForgeApi("YahooFinance/get_stock_sec_filing", {
      symbol: cacheKey,
      region: "US",
    });
    const result = response?.quoteSummary?.result?.[0] || {};
    const filings = result?.secFilings?.filings || [];

    const mapped: SecFiling[] = filings.map((f: any) => ({
      date: f.date || "",
      type: f.type || "",
      title: f.title || "",
      edgarUrl: f.edgarUrl || "",
      exhibits: (f.exhibits || []).map((e: any) => ({
        type: e.type || "",
        url: e.url || "",
      })),
    }));

    secCache.set(cacheKey, { data: mapped, timestamp: Date.now() });
    return mapped;
  } catch {
    return [];
  }
}

// ============ Data Extractors ============

export function extractIncomeStatement(facts: CompanyFacts, period: "annual" | "quarterly" = "annual", limit: number = 5): IncomeStatementRow[] {
  const data = period === "quarterly" ? facts._incomeQuarterly : facts._incomeAnnual;
  return data.slice(0, limit);
}

export function extractBalanceSheet(facts: CompanyFacts, period: "annual" | "quarterly" = "annual", limit: number = 5): BalanceSheetRow[] {
  const data = period === "quarterly" ? facts._balanceQuarterly : facts._balanceAnnual;
  return data.slice(0, limit);
}

export function extractCashFlow(facts: CompanyFacts, period: "annual" | "quarterly" = "annual", limit: number = 5): CashFlowRow[] {
  const data = period === "quarterly" ? facts._cashFlowQuarterly : facts._cashFlowAnnual;
  return data.slice(0, limit);
}

export function calculateRatios(facts: CompanyFacts, _currentPrice: number | null): KeyRatios | null {
  return facts._ratios;
}

// ============ Peer Comparison ============

const SECTOR_PEERS: Record<string, string[]> = {
  "Technology": ["AAPL", "MSFT", "GOOGL", "META", "NVDA", "AMD", "INTC", "CRM", "ADBE", "ORCL", "CSCO", "AVGO", "QCOM", "TXN", "IBM"],
  "Consumer Cyclical": ["AMZN", "TSLA", "HD", "NKE", "MCD", "COST", "TJX"],
  "Financial Services": ["JPM", "BAC", "V", "MA", "GS", "MS", "BLK", "AXP", "C"],
  "Healthcare": ["UNH", "JNJ", "PFE", "ABBV", "MRK", "TMO", "ABT", "DHR", "AMGN", "GILD", "ISRG", "VRTX", "REGN", "MDT"],
  "Communication Services": ["GOOGL", "META", "DIS", "NFLX", "CMCSA", "T", "VZ"],
  "Industrials": ["GE", "CAT", "HON", "UPS", "RTX", "BA", "LMT", "DE"],
  "Consumer Defensive": ["PG", "KO", "PEP", "WMT", "PM", "MO", "CL", "MDLZ"],
  "Energy": ["XOM", "CVX", "COP", "SLB", "EOG", "MPC", "PSX"],
  "Utilities": ["NEE", "DUK", "SO", "D", "AEP", "EXC", "SRE"],
};

const SYMBOL_SECTOR: Record<string, string> = {};
for (const [sector, symbols] of Object.entries(SECTOR_PEERS)) {
  for (const s of symbols) {
    SYMBOL_SECTOR[s] = sector;
  }
}

export function getPeers(symbol: string, limit: number = 5): string[] {
  const sector = SYMBOL_SECTOR[symbol.toUpperCase()];
  if (!sector) return [];
  const peers = SECTOR_PEERS[sector] || [];
  return peers.filter((s) => s !== symbol.toUpperCase()).slice(0, limit);
}

export function getSymbolSector(symbol: string): string | null {
  return SYMBOL_SECTOR[symbol.toUpperCase()] || null;
}

// ============ Formatting Utilities ============

export function formatCurrency(value: number | null | undefined, compact: boolean = true): string {
  if (value == null) return "—";
  if (compact) {
    const abs = Math.abs(value);
    const sign = value < 0 ? "-" : "";
    if (abs >= 1e12) return `${sign}$${(abs / 1e12).toFixed(2)}T`;
    if (abs >= 1e9) return `${sign}$${(abs / 1e9).toFixed(2)}B`;
    if (abs >= 1e6) return `${sign}$${(abs / 1e6).toFixed(2)}M`;
    if (abs >= 1e3) return `${sign}$${(abs / 1e3).toFixed(1)}K`;
    return `${sign}$${abs.toFixed(2)}`;
  }
  return `$${value.toLocaleString()}`;
}

export function formatPercent(value: number | null | undefined, decimals: number = 2): string {
  if (value == null) return "—";
  return `${value >= 0 ? "+" : ""}${value.toFixed(decimals)}%`;
}

export function formatNumber(value: number | null | undefined, decimals: number = 2): string {
  if (value == null) return "—";
  const abs = Math.abs(value);
  if (abs >= 1e9) return `${value < 0 ? "-" : ""}${(abs / 1e9).toFixed(decimals)}B`;
  if (abs >= 1e6) return `${value < 0 ? "-" : ""}${(abs / 1e6).toFixed(decimals)}M`;
  return value.toFixed(decimals);
}
