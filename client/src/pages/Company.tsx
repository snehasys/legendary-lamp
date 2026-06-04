import { useState, useEffect, useMemo } from "react";
import { useParams, Link } from "wouter";
import {
  ArrowUpRight, ArrowDownRight, Loader2, AlertCircle, Plus, Check,
  TrendingUp, TrendingDown, Building2, BarChart3, DollarSign, PieChart,
  Users, FileText, Activity, Lightbulb, Shield, ExternalLink, Globe, Phone, MapPin
} from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import {
  getStockChart, getStockQuote, getMultipleQuotes, getStockProfile, getStockInsights, getStockHolders,
  formatLargeNumber, formatPercent as formatPct,
  type ChartData, type StockQuote, type StockProfile, type StockInsights, type InsiderHolder
} from "@/lib/yahooFinance";
import {
  getCompanyFacts, extractIncomeStatement, extractBalanceSheet, extractCashFlow,
  calculateRatios, getPeers, getSymbolSector, formatCurrency, formatPercent, formatNumber,
  type CompanyFacts, type IncomeStatementRow, type BalanceSheetRow, type CashFlowRow, type KeyRatios
} from "@/lib/financialData";
import { isInWatchlist as checkWatchlist, addToWatchlist as addWL, removeFromWatchlist as removeWL } from "@/lib/watchlist";
import FinancialTable from "@/components/FinancialTable";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, CartesianGrid } from "recharts";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

function formatVol(num: number | undefined | null): string {
  if (num == null || isNaN(num)) return "N/A";
  if (Math.abs(num) >= 1e9) return (num / 1e9).toFixed(2) + "B";
  if (Math.abs(num) >= 1e6) return (num / 1e6).toFixed(2) + "M";
  if (Math.abs(num) >= 1e3) return (num / 1e3).toFixed(1) + "K";
  return num.toString();
}

type TabId = "overview" | "insights" | "quarterly" | "profit-loss" | "balance-sheet" | "cash-flow" | "ratios" | "shareholding" | "peers" | "profile";

const TABS: { id: TabId; label: string; icon: React.ReactNode }[] = [
  { id: "overview", label: "Overview", icon: <Activity className="w-3.5 h-3.5" /> },
  { id: "insights", label: "Insights", icon: <Lightbulb className="w-3.5 h-3.5" /> },
  { id: "quarterly", label: "Quarterly Results", icon: <FileText className="w-3.5 h-3.5" /> },
  { id: "profit-loss", label: "Profit & Loss", icon: <TrendingUp className="w-3.5 h-3.5" /> },
  { id: "balance-sheet", label: "Balance Sheet", icon: <Building2 className="w-3.5 h-3.5" /> },
  { id: "cash-flow", label: "Cash Flow", icon: <DollarSign className="w-3.5 h-3.5" /> },
  { id: "ratios", label: "Ratios", icon: <PieChart className="w-3.5 h-3.5" /> },
  { id: "shareholding", label: "Shareholding", icon: <Shield className="w-3.5 h-3.5" /> },
  { id: "peers", label: "Peer Comparison", icon: <Users className="w-3.5 h-3.5" /> },
  { id: "profile", label: "Company Profile", icon: <Globe className="w-3.5 h-3.5" /> },
];

export default function Company() {
  const params = useParams<{ symbol: string }>();
  const upperSymbol = (params.symbol || "").toUpperCase();
  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const [chartRange, setChartRange] = useState("1y");
  const [chartInterval, setChartInterval] = useState("1d");

  const [chartData, setChartData] = useState<ChartData | null>(null);
  const [chartLoading, setChartLoading] = useState(true);
  const [chartError, setChartError] = useState(false);

  const [facts, setFacts] = useState<CompanyFacts | null>(null);
  const [factsLoading, setFactsLoading] = useState(true);

  const [insights, setInsights] = useState<StockInsights | null>(null);
  const [insightsLoading, setInsightsLoading] = useState(true);

  const [profile, setProfile] = useState<StockProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);

  const [holders, setHolders] = useState<InsiderHolder[]>([]);
  const [holdersLoading, setHoldersLoading] = useState(true);

  const [peerQuotes, setPeerQuotes] = useState<StockQuote[]>([]);
  const [peersLoading, setPeersLoading] = useState(false);

  const [inWatchlist, setInWatchlist] = useState(false);

  useEffect(() => {
    setInWatchlist(checkWatchlist(upperSymbol));
  }, [upperSymbol]);

  // Fetch chart data
  useEffect(() => {
    if (!upperSymbol) return;
    setChartLoading(true);
    setChartError(false);
    getStockChart(upperSymbol, chartInterval, chartRange)
      .then((data) => { setChartData(data); setChartLoading(false); })
      .catch(() => { setChartError(true); setChartLoading(false); });
  }, [upperSymbol, chartInterval, chartRange]);

  // Fetch financial data (ratios from companySnapshot)
  useEffect(() => {
    if (!upperSymbol) return;
    setFactsLoading(true);
    getCompanyFacts(upperSymbol)
      .then((data) => { setFacts(data); setFactsLoading(false); })
      .catch(() => { setFactsLoading(false); });
  }, [upperSymbol]);

  // Fetch insights
  useEffect(() => {
    if (!upperSymbol) return;
    setInsightsLoading(true);
    getStockInsights(upperSymbol)
      .then((data) => { setInsights(data); setInsightsLoading(false); })
      .catch(() => { setInsightsLoading(false); });
  }, [upperSymbol]);

  // Fetch profile
  useEffect(() => {
    if (!upperSymbol) return;
    setProfileLoading(true);
    getStockProfile(upperSymbol)
      .then((data) => { setProfile(data); setProfileLoading(false); })
      .catch(() => { setProfileLoading(false); });
  }, [upperSymbol]);

  // Fetch holders
  useEffect(() => {
    if (!upperSymbol) return;
    setHoldersLoading(true);
    getStockHolders(upperSymbol)
      .then((data) => { setHolders(data); setHoldersLoading(false); })
      .catch(() => { setHoldersLoading(false); });
  }, [upperSymbol]);

  // Fetch peer data when peers tab is active
  useEffect(() => {
    if (activeTab !== "peers" || !upperSymbol) return;
    const peerSymbols = getPeers(upperSymbol, 5);
    if (peerSymbols.length === 0) return;
    setPeersLoading(true);
    getMultipleQuotes([upperSymbol, ...peerSymbols])
      .then((quotes) => { setPeerQuotes(quotes); setPeersLoading(false); })
      .catch(() => setPeersLoading(false));
  }, [activeTab, upperSymbol]);

  // Derived financial data
  const incomeAnnual = useMemo(() => facts ? extractIncomeStatement(facts, "annual", 5) : [], [facts]);
  const incomeQuarterly = useMemo(() => facts ? extractIncomeStatement(facts, "quarterly", 8) : [], [facts]);
  const balanceAnnual = useMemo(() => facts ? extractBalanceSheet(facts, "annual", 5) : [], [facts]);
  const cashFlowAnnual = useMemo(() => facts ? extractCashFlow(facts, "annual", 5) : [], [facts]);
  const ratios = useMemo(() => facts ? calculateRatios(facts, chartData?.meta?.regularMarketPrice ?? null) : null, [facts, chartData]);

  function handleWatchlistToggle() {
    if (inWatchlist) {
      removeWL(upperSymbol);
      setInWatchlist(false);
      toast.success(`${upperSymbol} removed from watchlist`);
    } else {
      addWL(upperSymbol);
      setInWatchlist(true);
      toast.success(`${upperSymbol} added to watchlist`);
    }
  }

  // Process chart data for Recharts
  const priceChartData = useMemo(() => {
    if (!chartData?.timestamps) return [];
    return chartData.timestamps
      .map((ts, i) => ({
        date: new Date(ts * 1000).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "2-digit" }),
        timestamp: ts,
        price: chartData.close[i],
        volume: chartData.volume[i] || 0,
      }))
      .filter(d => d.price != null);
  }, [chartData]);

  const rangeOptions = [
    { label: "1D", range: "1d", interval: "5m" },
    { label: "5D", range: "5d", interval: "15m" },
    { label: "1M", range: "1mo", interval: "1d" },
    { label: "3M", range: "3mo", interval: "1d" },
    { label: "6M", range: "6mo", interval: "1d" },
    { label: "1Y", range: "1y", interval: "1d" },
    { label: "5Y", range: "5y", interval: "1wk" },
    { label: "Max", range: "max", interval: "1mo" },
  ];

  const meta = chartData?.meta;
  const currentPrice = meta?.regularMarketPrice;
  const prevClose = meta?.chartPreviousClose;
  const priceChange = currentPrice != null && prevClose != null ? currentPrice - prevClose : null;
  const priceChangePercent = priceChange != null && prevClose ? (priceChange / prevClose) * 100 : null;
  const isPositive = (priceChange ?? 0) >= 0;

  if (!upperSymbol) {
    return (
      <div className="min-h-screen flex flex-col bg-background text-foreground">
        <Header />
        <main className="flex-1 container py-20 text-center">
          <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">No symbol provided</h2>
          <p className="text-muted-foreground">Please search for a stock symbol to view its details.</p>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Header />

      <main className="flex-1 container py-6">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
          <Link href="/" className="hover:text-foreground transition-colors">Home</Link>
          <span>/</span>
          {(profile?.sector || getSymbolSector(upperSymbol)) && (
            <>
              <Link href={`/sector/${encodeURIComponent(profile?.sector || getSymbolSector(upperSymbol)!)}`} className="hover:text-foreground transition-colors">
                {profile?.sector || getSymbolSector(upperSymbol)}
              </Link>
              <span>/</span>
            </>
          )}
          <span className="text-foreground font-medium">{upperSymbol}</span>
        </nav>

        {/* Company Header */}
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold">{meta?.longName || meta?.shortName || upperSymbol}</h1>
            <div className="flex items-center gap-3 mt-1.5 text-sm text-muted-foreground flex-wrap">
              {meta?.exchangeName && <span>{meta.exchangeName}: {upperSymbol}</span>}
              {(profile?.sector || getSymbolSector(upperSymbol)) && (
                <span className="bg-accent/50 px-2 py-0.5 rounded text-xs">{profile?.sector || getSymbolSector(upperSymbol)}</span>
              )}
              {profile?.industry && (
                <span className="bg-accent/50 px-2 py-0.5 rounded text-xs">{profile.industry}</span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4">
            {chartLoading ? (
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            ) : chartError ? (
              <div className="text-sm text-destructive flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                Price unavailable
              </div>
            ) : currentPrice != null ? (
              <div className="text-right">
                <div className="text-3xl font-bold font-mono">${currentPrice.toFixed(2)}</div>
                {priceChange != null && priceChangePercent != null && (
                  <div className={`flex items-center justify-end gap-1 text-sm font-mono ${isPositive ? "text-[oklch(0.55_0.17_155)]" : "text-[oklch(0.55_0.22_25)]"}`}>
                    {isPositive ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                    {isPositive ? "+" : ""}{priceChange.toFixed(2)} ({isPositive ? "+" : ""}{priceChangePercent.toFixed(2)}%)
                  </div>
                )}
              </div>
            ) : null}

            <Button
              variant={inWatchlist ? "secondary" : "outline"}
              size="sm"
              onClick={handleWatchlistToggle}
            >
              {inWatchlist ? <Check className="w-4 h-4 mr-1" /> : <Plus className="w-4 h-4 mr-1" />}
              {inWatchlist ? "Watching" : "Watch"}
            </Button>
          </div>
        </div>

        {/* Key Metrics */}
        {meta && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
            {[
              { label: "Prev Close", value: meta.chartPreviousClose ? `$${meta.chartPreviousClose.toFixed(2)}` : "N/A" },
              { label: "Day High", value: meta.regularMarketDayHigh ? `$${meta.regularMarketDayHigh.toFixed(2)}` : "N/A" },
              { label: "Day Low", value: meta.regularMarketDayLow ? `$${meta.regularMarketDayLow.toFixed(2)}` : "N/A" },
              { label: "52W High", value: meta.fiftyTwoWeekHigh ? `$${meta.fiftyTwoWeekHigh.toFixed(2)}` : "N/A" },
              { label: "52W Low", value: meta.fiftyTwoWeekLow ? `$${meta.fiftyTwoWeekLow.toFixed(2)}` : "N/A" },
              { label: "Volume", value: meta.regularMarketVolume ? formatVol(meta.regularMarketVolume) : "N/A" },
            ].map((item) => (
              <div key={item.label} className="border border-border rounded-lg p-3">
                <p className="text-xs text-muted-foreground">{item.label}</p>
                <p className="text-sm font-mono font-medium mt-0.5">{item.value}</p>
              </div>
            ))}
          </div>
        )}

        {/* Tabs Navigation */}
        <div className="border-b border-border mb-6 overflow-x-auto">
          <div className="flex gap-0 min-w-max">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="min-h-[400px]">
          {activeTab === "overview" && (
            <OverviewTab
              chartData={chartData}
              chartLoading={chartLoading}
              chartError={chartError}
              priceChartData={priceChartData}
              rangeOptions={rangeOptions}
              chartRange={chartRange}
              setChartRange={setChartRange}
              setChartInterval={setChartInterval}
              isPositive={isPositive}
              ratios={ratios}
              incomeAnnual={incomeAnnual}
              factsLoading={factsLoading}
              upperSymbol={upperSymbol}
              insights={insights}
              profile={profile}
            />
          )}
          {activeTab === "insights" && (
            <InsightsTab insights={insights} loading={insightsLoading} currentPrice={currentPrice ?? null} />
          )}
          {activeTab === "quarterly" && (
            <QuarterlyTab data={incomeQuarterly} loading={factsLoading} />
          )}
          {activeTab === "profit-loss" && (
            <ProfitLossTab data={incomeAnnual} loading={factsLoading} />
          )}
          {activeTab === "balance-sheet" && (
            <BalanceSheetTab data={balanceAnnual} loading={factsLoading} />
          )}
          {activeTab === "cash-flow" && (
            <CashFlowTab data={cashFlowAnnual} loading={factsLoading} />
          )}
          {activeTab === "ratios" && (
            <RatiosTab ratios={ratios} loading={factsLoading} incomeData={incomeAnnual} insights={insights} />
          )}
          {activeTab === "shareholding" && (
            <ShareholdingTab holders={holders} loading={holdersLoading} ratios={ratios} />
          )}
          {activeTab === "peers" && (
            <PeersTab
              symbol={upperSymbol}
              peerQuotes={peerQuotes}
              loading={peersLoading}
              facts={facts}
              currentPrice={currentPrice ?? null}
            />
          )}
          {activeTab === "profile" && (
            <ProfileTab profile={profile} loading={profileLoading} insights={insights} />
          )}
        </div>

        {/* Data Attribution */}
        <div className="text-center mt-8 pb-4 border-t border-border pt-4">
          <p className="text-xs text-muted-foreground">
            Data from Yahoo Finance via Manus Forge API. Updated in real-time. Not financial advice.
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
}

// ============ Overview Tab ============

function OverviewTab({
  chartData, chartLoading, chartError, priceChartData, rangeOptions,
  chartRange, setChartRange, setChartInterval, isPositive, ratios, incomeAnnual, factsLoading, upperSymbol, insights, profile
}: {
  chartData: ChartData | null;
  chartLoading: boolean;
  chartError: boolean;
  priceChartData: { date: string; price: number; volume: number }[];
  rangeOptions: { label: string; range: string; interval: string }[];
  chartRange: string;
  setChartRange: (r: string) => void;
  setChartInterval: (i: string) => void;
  isPositive: boolean;
  ratios: KeyRatios | null;
  incomeAnnual: IncomeStatementRow[];
  factsLoading: boolean;
  upperSymbol: string;
  insights: StockInsights | null;
  profile: StockProfile | null;
}) {
  return (
    <div className="space-y-6">
      {/* Price Chart */}
      <div className="border border-border rounded-xl p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <h3 className="font-semibold">Price Chart</h3>
          <div className="flex gap-1 flex-wrap">
            {rangeOptions.map((opt) => (
              <button
                key={opt.label}
                onClick={() => { setChartRange(opt.range); setChartInterval(opt.interval); }}
                className={`px-2.5 py-1 text-xs rounded-md font-medium transition-colors ${
                  chartRange === opt.range
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:text-foreground"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
        {chartLoading ? (
          <div className="h-64 flex items-center justify-center">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : chartError ? (
          <div className="h-64 flex items-center justify-center text-sm text-muted-foreground">
            <AlertCircle className="w-4 h-4 mr-2" />
            Unable to load chart data
          </div>
        ) : (
          <>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={priceChartData} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
                  <defs>
                    <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={isPositive ? "oklch(0.55 0.17 155)" : "oklch(0.55 0.22 25)"} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={isPositive ? "oklch(0.55 0.17 155)" : "oklch(0.55 0.22 25)"} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} interval="preserveStartEnd" minTickGap={50} />
                  <YAxis domain={["auto", "auto"]} tick={{ fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v}`} />
                  <Tooltip
                    contentStyle={{ borderRadius: "8px", border: "1px solid var(--border)", background: "var(--popover)", fontSize: 12 }}
                    formatter={(value: number) => [`$${value.toFixed(2)}`, "Price"]}
                  />
                  <Area type="monotone" dataKey="price" stroke={isPositive ? "oklch(0.55 0.17 155)" : "oklch(0.55 0.22 25)"} fill="url(#priceGradient)" strokeWidth={1.5} dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="h-20 mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={priceChartData} margin={{ top: 0, right: 5, bottom: 0, left: 5 }}>
                  <XAxis dataKey="date" hide />
                  <YAxis hide />
                  <Tooltip contentStyle={{ borderRadius: 6, border: "1px solid var(--border)", background: "var(--popover)", fontSize: 11 }} formatter={(value: number) => [formatVol(value), "Volume"]} />
                  <Bar dataKey="volume" fill="oklch(0.7 0.05 260 / 0.4)" radius={[1, 1, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </>
        )}
      </div>

      {/* Quick Insights Summary */}
      {insights && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Analyst Recommendation */}
          {insights.recommendation && (
            <div className="border border-border rounded-xl p-4">
              <h4 className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Analyst Rating</h4>
              <div className="flex items-center gap-2">
                <span className={`text-lg font-bold ${
                  insights.recommendation.rating === "BUY" || insights.recommendation.rating === "STRONG_BUY"
                    ? "text-[oklch(0.55_0.17_155)]"
                    : insights.recommendation.rating === "SELL" || insights.recommendation.rating === "STRONG_SELL"
                    ? "text-[oklch(0.55_0.22_25)]"
                    : "text-foreground"
                }`}>
                  {insights.recommendation.rating?.replace("_", " ")}
                </span>
              </div>
              {insights.recommendation.targetPrice && (
                <p className="text-sm text-muted-foreground mt-1">
                  Target: <span className="font-mono font-medium text-foreground">${insights.recommendation.targetPrice.toFixed(2)}</span>
                </p>
              )}
            </div>
          )}

          {/* Valuation */}
          {insights.valuation && (
            <div className="border border-border rounded-xl p-4">
              <h4 className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Valuation</h4>
              <p className="text-sm font-medium">{insights.valuation.relativeValue || "N/A"}</p>
              <p className="text-xs text-muted-foreground mt-1">{insights.valuation.description}</p>
              {insights.valuation.discount && (
                <p className="text-xs text-muted-foreground mt-0.5">Discount: {insights.valuation.discount}</p>
              )}
            </div>
          )}

          {/* Technical Outlook */}
          {insights.technicalEvents && (
            <div className="border border-border rounded-xl p-4">
              <h4 className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Technical Outlook</h4>
              <div className="space-y-1">
                <OutlookBadge label="Short" outlook={insights.technicalEvents.shortTermOutlook} />
                <OutlookBadge label="Mid" outlook={insights.technicalEvents.intermediateTermOutlook} />
                <OutlookBadge label="Long" outlook={insights.technicalEvents.longTermOutlook} />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Price Metrics Summary */}
      {chartData && chartData.meta && (
        <div className="border border-border rounded-xl p-5">
          <h3 className="font-semibold mb-4">Price Metrics</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {[
              { label: "Previous Close", value: chartData.meta.chartPreviousClose ? `$${chartData.meta.chartPreviousClose.toFixed(2)}` : "—" },
              { label: "Open", value: chartData.meta.regularMarketOpen ? `$${chartData.meta.regularMarketOpen.toFixed(2)}` : "—" },
              { label: "Day Range", value: chartData.meta.regularMarketDayLow && chartData.meta.regularMarketDayHigh ? `$${chartData.meta.regularMarketDayLow.toFixed(2)} - $${chartData.meta.regularMarketDayHigh.toFixed(2)}` : "—" },
              { label: "52W Range", value: chartData.meta.fiftyTwoWeekLow && chartData.meta.fiftyTwoWeekHigh ? `$${chartData.meta.fiftyTwoWeekLow.toFixed(2)} - $${chartData.meta.fiftyTwoWeekHigh.toFixed(2)}` : "—" },
              { label: "52W Position", value: chartData.meta.fiftyTwoWeekLow && chartData.meta.fiftyTwoWeekHigh && chartData.meta.regularMarketPrice
                ? `${(((chartData.meta.regularMarketPrice - chartData.meta.fiftyTwoWeekLow) / (chartData.meta.fiftyTwoWeekHigh - chartData.meta.fiftyTwoWeekLow)) * 100).toFixed(0)}%`
                : "—" },
              { label: "Volume", value: chartData.meta.regularMarketVolume ? formatVol(chartData.meta.regularMarketVolume) : "—" },
              ...(insights?.keyTechnicals?.support != null ? [{ label: "Support", value: `$${insights.keyTechnicals.support.toFixed(2)}` }] : []),
              ...(insights?.keyTechnicals?.resistance != null ? [{ label: "Resistance", value: `$${insights.keyTechnicals.resistance.toFixed(2)}` }] : []),
            ].map((item) => (
              <div key={item.label} className="space-y-0.5">
                <p className="text-xs text-muted-foreground">{item.label}</p>
                <p className="text-sm font-mono font-medium">{item.value}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* About the Company */}
      {profile?.longBusinessSummary && (
        <div className="border border-border rounded-xl p-5">
          <h3 className="font-semibold mb-3">About</h3>
          <p className="text-sm text-muted-foreground leading-relaxed line-clamp-4">
            {profile.longBusinessSummary}
          </p>
        </div>
      )}

      {/* Significant Developments */}
      {insights && insights.sigDevs.length > 0 && (
        <div className="border border-border rounded-xl p-5">
          <h3 className="font-semibold mb-3">Recent Developments</h3>
          <div className="space-y-2">
            {insights.sigDevs.slice(0, 5).map((dev, i) => (
              <div key={i} className="flex items-start gap-3 py-2 border-b border-border/50 last:border-0">
                <span className="text-xs text-muted-foreground whitespace-nowrap mt-0.5">{dev.date}</span>
                <p className="text-sm">{dev.headline}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ============ Insights Tab ============

function InsightsTab({ insights, loading, currentPrice }: { insights: StockInsights | null; loading: boolean; currentPrice: number | null }) {
  if (loading) return <LoadingState message="Loading insights..." />;
  if (!insights) return <EmptyState message="No insights data available for this stock." />;

  return (
    <div className="space-y-6">
      {/* Analyst Recommendation */}
      {insights.recommendation && (
        <div className="border border-border rounded-xl p-5">
          <h3 className="font-semibold mb-4">Analyst Recommendation</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Rating</p>
              <p className={`text-2xl font-bold ${
                insights.recommendation.rating === "BUY" || insights.recommendation.rating === "STRONG_BUY"
                  ? "text-[oklch(0.55_0.17_155)]"
                  : insights.recommendation.rating === "SELL" || insights.recommendation.rating === "STRONG_SELL"
                  ? "text-[oklch(0.55_0.22_25)]"
                  : "text-foreground"
              }`}>
                {insights.recommendation.rating?.replace("_", " ") || "N/A"}
              </p>
              <p className="text-xs text-muted-foreground mt-1">Provider: {insights.recommendation.provider}</p>
            </div>
            {insights.recommendation.targetPrice && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">Target Price</p>
                <p className="text-2xl font-bold font-mono">${insights.recommendation.targetPrice.toFixed(2)}</p>
                {currentPrice && (
                  <p className={`text-xs mt-1 ${
                    insights.recommendation.targetPrice > currentPrice
                      ? "text-[oklch(0.55_0.17_155)]"
                      : "text-[oklch(0.55_0.22_25)]"
                  }`}>
                    {insights.recommendation.targetPrice > currentPrice ? "▲" : "▼"}{" "}
                    {Math.abs(((insights.recommendation.targetPrice - currentPrice) / currentPrice) * 100).toFixed(1)}% from current
                  </p>
                )}
              </div>
            )}
            {currentPrice && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">Current Price</p>
                <p className="text-2xl font-bold font-mono">${currentPrice.toFixed(2)}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Valuation */}
      {insights.valuation && (
        <div className="border border-border rounded-xl p-5">
          <h3 className="font-semibold mb-4">Valuation Assessment</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Relative Value</p>
              <p className="text-lg font-semibold">{insights.valuation.relativeValue || "N/A"}</p>
              <p className="text-sm text-muted-foreground mt-2">{insights.valuation.description}</p>
            </div>
            <div>
              {insights.valuation.discount && (
                <div className="mb-3">
                  <p className="text-xs text-muted-foreground mb-1">Discount/Premium</p>
                  <p className="text-lg font-semibold">{insights.valuation.discount}</p>
                </div>
              )}
              <p className="text-xs text-muted-foreground">Provider: {insights.valuation.provider}</p>
            </div>
          </div>
        </div>
      )}

      {/* Technical Analysis */}
      {insights.technicalEvents && (
        <div className="border border-border rounded-xl p-5">
          <h3 className="font-semibold mb-4">Technical Analysis</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <OutlookCard title="Short-Term Outlook" outlook={insights.technicalEvents.shortTermOutlook} />
            <OutlookCard title="Intermediate-Term Outlook" outlook={insights.technicalEvents.intermediateTermOutlook} />
            <OutlookCard title="Long-Term Outlook" outlook={insights.technicalEvents.longTermOutlook} />
          </div>
          <p className="text-xs text-muted-foreground mt-4">
            Sector: {insights.technicalEvents.sector} | Provider: {insights.technicalEvents.provider}
          </p>
        </div>
      )}

      {/* Key Technicals */}
      {insights.keyTechnicals && (
        <div className="border border-border rounded-xl p-5">
          <h3 className="font-semibold mb-4">Key Technical Levels</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-muted/30 rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">Support</p>
              <p className="text-xl font-bold font-mono text-[oklch(0.55_0.17_155)]">
                {insights.keyTechnicals.support != null ? `$${insights.keyTechnicals.support.toFixed(2)}` : "N/A"}
              </p>
            </div>
            <div className="text-center p-4 bg-muted/30 rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">Resistance</p>
              <p className="text-xl font-bold font-mono text-[oklch(0.55_0.22_25)]">
                {insights.keyTechnicals.resistance != null ? `$${insights.keyTechnicals.resistance.toFixed(2)}` : "N/A"}
              </p>
            </div>
            <div className="text-center p-4 bg-muted/30 rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">Stop Loss</p>
              <p className="text-xl font-bold font-mono">
                {insights.keyTechnicals.stopLoss != null ? `$${insights.keyTechnicals.stopLoss.toFixed(2)}` : "N/A"}
              </p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-3">Provider: {insights.keyTechnicals.provider}</p>
        </div>
      )}

      {/* Company Snapshot Scores */}
      {insights.companySnapshot && (
        <div className="border border-border rounded-xl p-5">
          <h3 className="font-semibold mb-4">Company vs Sector Comparison</h3>
          <p className="text-xs text-muted-foreground mb-3">Sector: {insights.companySnapshot.sectorInfo}</p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 px-3 font-medium text-muted-foreground">Metric</th>
                  <th className="text-right py-2 px-3 font-medium text-muted-foreground">Company</th>
                  <th className="text-right py-2 px-3 font-medium text-muted-foreground">Sector</th>
                </tr>
              </thead>
              <tbody>
                {Object.keys(insights.companySnapshot.company || {}).slice(0, 12).map((key) => {
                  const compVal = insights.companySnapshot!.company[key];
                  const sectVal = insights.companySnapshot!.sector[key];
                  if (compVal == null && sectVal == null) return null;
                  return (
                    <tr key={key} className="border-b border-border/50">
                      <td className="py-2 px-3 text-sm capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</td>
                      <td className="text-right py-2 px-3 font-mono text-sm">
                        {typeof compVal === "number" ? (Math.abs(compVal) < 1 ? (compVal * 100).toFixed(1) + "%" : compVal.toFixed(2)) : String(compVal ?? "—")}
                      </td>
                      <td className="text-right py-2 px-3 font-mono text-sm text-muted-foreground">
                        {typeof sectVal === "number" ? (Math.abs(sectVal) < 1 ? (sectVal * 100).toFixed(1) + "%" : sectVal.toFixed(2)) : String(sectVal ?? "—")}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Significant Developments */}
      {insights.sigDevs.length > 0 && (
        <div className="border border-border rounded-xl p-5">
          <h3 className="font-semibold mb-4">Significant Developments</h3>
          <div className="space-y-3">
            {insights.sigDevs.map((dev, i) => (
              <div key={i} className="flex items-start gap-3 py-2 border-b border-border/50 last:border-0">
                <span className="text-xs text-muted-foreground whitespace-nowrap mt-0.5 bg-muted/50 px-2 py-0.5 rounded">{dev.date}</span>
                <p className="text-sm leading-relaxed">{dev.headline}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SEC Reports */}
      {insights.secReports.length > 0 && (
        <div className="border border-border rounded-xl p-5">
          <h3 className="font-semibold mb-4">SEC Filings</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 px-3 font-medium text-muted-foreground">Type</th>
                  <th className="text-left py-2 px-3 font-medium text-muted-foreground">Title</th>
                  <th className="text-left py-2 px-3 font-medium text-muted-foreground">Filed Date</th>
                  <th className="text-right py-2 px-3 font-medium text-muted-foreground">Link</th>
                </tr>
              </thead>
              <tbody>
                {insights.secReports.slice(0, 15).map((report) => (
                  <tr key={report.id} className="border-b border-border/50 hover:bg-accent/30 transition-colors">
                    <td className="py-2 px-3">
                      <span className="bg-accent px-2 py-0.5 rounded text-xs font-medium">{report.type}</span>
                    </td>
                    <td className="py-2 px-3 text-sm max-w-md truncate">{report.title}</td>
                    <td className="py-2 px-3 text-sm text-muted-foreground">{report.filedDate}</td>
                    <td className="text-right py-2 px-3">
                      <a
                        href={`https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&filenum=${report.id}&type=&dateb=&owner=include&count=40`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline inline-flex items-center gap-1 text-xs"
                      >
                        View <ExternalLink className="w-3 h-3" />
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ============ Shareholding Tab ============

function ShareholdingTab({ holders, loading, ratios }: { holders: InsiderHolder[]; loading: boolean; ratios: KeyRatios | null }) {
  if (loading) return <LoadingState message="Loading shareholding data..." />;

  return (
    <div className="space-y-6">
      {/* Ownership Breakdown */}
      {ratios && (ratios.insiderOwnership != null || ratios.institutionalOwnership != null) && (
        <div className="border border-border rounded-xl p-5">
          <h3 className="font-semibold mb-4">Ownership Breakdown</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {ratios.institutionalOwnership != null && (
              <div className="text-center p-4 bg-muted/30 rounded-lg">
                <p className="text-xs text-muted-foreground mb-1">Institutional</p>
                <p className="text-2xl font-bold text-primary">{ratios.institutionalOwnership.toFixed(1)}%</p>
              </div>
            )}
            {ratios.insiderOwnership != null && (
              <div className="text-center p-4 bg-muted/30 rounded-lg">
                <p className="text-xs text-muted-foreground mb-1">Insider</p>
                <p className="text-2xl font-bold text-[oklch(0.55_0.17_155)]">{ratios.insiderOwnership.toFixed(1)}%</p>
              </div>
            )}
            {ratios.insiderOwnership != null && ratios.institutionalOwnership != null && (
              <div className="text-center p-4 bg-muted/30 rounded-lg">
                <p className="text-xs text-muted-foreground mb-1">Public / Other</p>
                <p className="text-2xl font-bold">
                  {Math.max(0, 100 - (ratios.insiderOwnership || 0) - (ratios.institutionalOwnership || 0)).toFixed(1)}%
                </p>
              </div>
            )}
          </div>
          {ratios.sharesOutstanding && (
            <p className="text-xs text-muted-foreground mt-3 text-center">
              Shares Outstanding: {formatLargeNumber(ratios.sharesOutstanding)}
            </p>
          )}
        </div>
      )}

      {/* Insider Holders Table */}
      {holders.length > 0 ? (
        <div className="border border-border rounded-xl p-5">
          <h3 className="font-semibold mb-4">Insider Holders</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2.5 px-3 font-medium text-muted-foreground">Name</th>
                  <th className="text-left py-2.5 px-3 font-medium text-muted-foreground">Relation</th>
                  <th className="text-left py-2.5 px-3 font-medium text-muted-foreground">Transaction</th>
                  <th className="text-right py-2.5 px-3 font-medium text-muted-foreground">Shares Held</th>
                  <th className="text-right py-2.5 px-3 font-medium text-muted-foreground">Last Transaction</th>
                </tr>
              </thead>
              <tbody>
                {holders.map((holder, i) => (
                  <tr key={i} className="border-b border-border/50 hover:bg-accent/30 transition-colors">
                    <td className="py-2 px-3 font-medium">{holder.name}</td>
                    <td className="py-2 px-3 text-muted-foreground text-xs">{holder.relation}</td>
                    <td className="py-2 px-3">
                      <span className={`text-xs px-2 py-0.5 rounded ${
                        holder.transactionDescription?.toLowerCase().includes("sale")
                          ? "bg-[oklch(0.55_0.22_25/0.1)] text-[oklch(0.55_0.22_25)]"
                          : holder.transactionDescription?.toLowerCase().includes("purchase") || holder.transactionDescription?.toLowerCase().includes("acquisition")
                          ? "bg-[oklch(0.55_0.17_155/0.1)] text-[oklch(0.55_0.17_155)]"
                          : "bg-muted text-muted-foreground"
                      }`}>
                        {holder.transactionDescription || "N/A"}
                      </span>
                    </td>
                    <td className="text-right py-2 px-3 font-mono">
                      {holder.positionDirect != null ? formatLargeNumber(holder.positionDirect) : "N/A"}
                    </td>
                    <td className="text-right py-2 px-3 text-muted-foreground text-xs">{holder.latestTransDate || "N/A"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <EmptyState message="No insider holder data available for this stock." />
      )}
    </div>
  );
}

// ============ Company Profile Tab ============

function ProfileTab({ profile, loading, insights }: { profile: StockProfile | null; loading: boolean; insights: StockInsights | null }) {
  if (loading) return <LoadingState message="Loading company profile..." />;
  if (!profile) return <EmptyState message="No company profile data available." />;

  return (
    <div className="space-y-6">
      {/* Business Summary */}
      <div className="border border-border rounded-xl p-5">
        <h3 className="font-semibold mb-3">Business Summary</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">{profile.longBusinessSummary || "No description available."}</p>
      </div>

      {/* Company Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="border border-border rounded-xl p-5">
          <h3 className="font-semibold mb-4">Company Information</h3>
          <div className="space-y-3">
            <InfoRow icon={<Building2 className="w-4 h-4" />} label="Sector" value={profile.sector} />
            <InfoRow icon={<BarChart3 className="w-4 h-4" />} label="Industry" value={profile.industry} />
            <InfoRow icon={<Users className="w-4 h-4" />} label="Employees" value={profile.fullTimeEmployees ? profile.fullTimeEmployees.toLocaleString() : "N/A"} />
            <InfoRow icon={<Globe className="w-4 h-4" />} label="Website" value={profile.website} isLink />
            <InfoRow icon={<Phone className="w-4 h-4" />} label="Phone" value={profile.phone} />
            <InfoRow icon={<MapPin className="w-4 h-4" />} label="Address" value={[profile.address, profile.city, profile.state, profile.country].filter(Boolean).join(", ")} />
          </div>
        </div>

        {/* Key Officers */}
        {profile.companyOfficers.length > 0 && (
          <div className="border border-border rounded-xl p-5">
            <h3 className="font-semibold mb-4">Key Officers</h3>
            <div className="space-y-3">
              {profile.companyOfficers.slice(0, 8).map((officer, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                  <div>
                    <p className="text-sm font-medium">{officer.name}</p>
                    <p className="text-xs text-muted-foreground">{officer.title}</p>
                  </div>
                  {officer.totalPay && (
                    <span className="text-xs font-mono text-muted-foreground">
                      {formatCurrency(officer.totalPay)}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* SEC Filings */}
      {insights && insights.secReports.length > 0 && (
        <div className="border border-border rounded-xl p-5">
          <h3 className="font-semibold mb-4">Recent SEC Filings</h3>
          <div className="space-y-2">
            {insights.secReports.slice(0, 10).map((report) => (
              <div key={report.id} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                <div className="flex items-center gap-3">
                  <span className="bg-accent px-2 py-0.5 rounded text-xs font-medium min-w-[60px] text-center">{report.type}</span>
                  <span className="text-sm truncate max-w-md">{report.title}</span>
                </div>
                <span className="text-xs text-muted-foreground whitespace-nowrap ml-4">{report.filedDate}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ============ Quarterly Results Tab ============

function QuarterlyTab({ data, loading }: { data: IncomeStatementRow[]; loading: boolean }) {
  if (loading) return <LoadingState />;
  if (data.length === 0) return <EmptyState message="Quarterly results are derived from the Yahoo Finance companySnapshot. Detailed quarterly breakdowns require SEC EDGAR data which is not available via browser due to CORS restrictions." />;

  return (
    <div className="border border-border rounded-xl p-5">
      <h3 className="font-semibold mb-4">Quarterly Results</h3>
      <FinancialTable
        headers={data.map(d => d.period)}
        rows={[
          { label: "Revenue", values: data.map(d => d.revenue), bold: true },
          { label: "Cost of Revenue", values: data.map(d => d.costOfRevenue) },
          { label: "Gross Profit", values: data.map(d => d.grossProfit), highlight: true },
          { label: "Operating Expenses", values: data.map(d => d.operatingExpenses) },
          { label: "Operating Income", values: data.map(d => d.operatingIncome), highlight: true },
          { label: "Net Income", values: data.map(d => d.netIncome), bold: true, highlight: true },
          { label: "EPS (Basic)", values: data.map(d => d.eps) },
          { label: "EPS (Diluted)", values: data.map(d => d.epsDiluted) },
        ]}
      />
    </div>
  );
}

// ============ Profit & Loss Tab ============

function ProfitLossTab({ data, loading }: { data: IncomeStatementRow[]; loading: boolean }) {
  if (loading) return <LoadingState />;
  if (data.length === 0) return <EmptyState message="Annual income statement data is derived from Yahoo Finance companySnapshot. Detailed multi-year breakdowns require SEC EDGAR data which is not available via browser due to CORS restrictions." />;

  // Calculate growth rates
  const revenueGrowth = data.map((d, i) => {
    if (i >= data.length - 1 || !d.revenue || !data[i + 1].revenue) return null;
    return ((d.revenue - data[i + 1].revenue!) / Math.abs(data[i + 1].revenue!)) * 100;
  });

  return (
    <div className="space-y-6">
      <div className="border border-border rounded-xl p-5">
        <h3 className="font-semibold mb-4">Profit & Loss Statement (Annual)</h3>
        <FinancialTable
          headers={data.map(d => d.period)}
          rows={[
            { label: "Revenue", values: data.map(d => d.revenue), bold: true },
            { label: "  Revenue Growth %", values: revenueGrowth },
            { label: "Cost of Revenue", values: data.map(d => d.costOfRevenue) },
            { label: "Gross Profit", values: data.map(d => d.grossProfit), highlight: true },
            { label: "Operating Expenses", values: data.map(d => d.operatingExpenses) },
            { label: "Operating Income", values: data.map(d => d.operatingIncome), highlight: true },
            { label: "Net Income", values: data.map(d => d.netIncome), bold: true, highlight: true },
            { label: "EPS (Basic)", values: data.map(d => d.eps) },
            { label: "EPS (Diluted)", values: data.map(d => d.epsDiluted) },
          ]}
        />
      </div>

      {/* Revenue trend chart */}
      {data.length > 1 && (
        <div className="border border-border rounded-xl p-5">
          <h3 className="font-semibold mb-4">Revenue Trend</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={[...data].reverse()} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.92 0.003 260)" vertical={false} />
                <XAxis dataKey="period" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={(v) => formatCurrency(v)} />
                <Tooltip formatter={(value: number) => [formatCurrency(value), "Revenue"]} contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="revenue" fill="oklch(0.55 0.17 250 / 0.7)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}

// ============ Balance Sheet Tab ============

function BalanceSheetTab({ data, loading }: { data: BalanceSheetRow[]; loading: boolean }) {
  if (loading) return <LoadingState />;
  if (data.length === 0) return <EmptyState message="Balance sheet data is not available from the Yahoo Finance API endpoints. This data requires SEC EDGAR XBRL filings which cannot be accessed from the browser due to CORS restrictions." />;

  return (
    <div className="border border-border rounded-xl p-5">
      <h3 className="font-semibold mb-4">Balance Sheet (Annual)</h3>
      <FinancialTable
        headers={data.map(d => d.period)}
        rows={[
          { label: "Total Assets", values: data.map(d => d.totalAssets), bold: true },
          { label: "  Current Assets", values: data.map(d => d.currentAssets) },
          { label: "    Cash & Equivalents", values: data.map(d => d.cash) },
          { label: "    Accounts Receivable", values: data.map(d => d.accountsReceivable) },
          { label: "    Inventory", values: data.map(d => d.inventory) },
          { label: "Total Liabilities", values: data.map(d => d.totalLiabilities), bold: true },
          { label: "  Current Liabilities", values: data.map(d => d.currentLiabilities) },
          { label: "    Accounts Payable", values: data.map(d => d.accountsPayable) },
          { label: "  Long-term Debt", values: data.map(d => d.totalDebt) },
          { label: "Stockholders' Equity", values: data.map(d => d.stockholdersEquity), bold: true, highlight: true },
        ]}
      />
    </div>
  );
}

// ============ Cash Flow Tab ============

function CashFlowTab({ data, loading }: { data: CashFlowRow[]; loading: boolean }) {
  if (loading) return <LoadingState />;
  if (data.length === 0) return <EmptyState message="Cash flow data is not available from the Yahoo Finance API endpoints. This data requires SEC EDGAR XBRL filings which cannot be accessed from the browser due to CORS restrictions." />;

  return (
    <div className="space-y-6">
      <div className="border border-border rounded-xl p-5">
        <h3 className="font-semibold mb-4">Cash Flow Statement (Annual)</h3>
        <FinancialTable
          headers={data.map(d => d.period)}
          rows={[
            { label: "Operating Cash Flow", values: data.map(d => d.operatingCashFlow), bold: true, highlight: true },
            { label: "Capital Expenditure", values: data.map(d => d.capitalExpenditure) },
            { label: "Free Cash Flow", values: data.map(d => d.freeCashFlow), bold: true, highlight: true },
            { label: "Investing Cash Flow", values: data.map(d => d.investingCashFlow) },
            { label: "Financing Cash Flow", values: data.map(d => d.financingCashFlow) },
            { label: "Dividends Paid", values: data.map(d => d.dividendsPaid) },
            { label: "Share Repurchases", values: data.map(d => d.shareRepurchases) },
          ]}
        />
      </div>

      {/* FCF chart */}
      {data.length > 1 && (
        <div className="border border-border rounded-xl p-5">
          <h3 className="font-semibold mb-4">Free Cash Flow Trend</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={[...data].reverse()} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.92 0.003 260)" vertical={false} />
                <XAxis dataKey="period" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={(v) => formatCurrency(v)} />
                <Tooltip formatter={(value: number) => [formatCurrency(value), "Free Cash Flow"]} contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="freeCashFlow" fill="oklch(0.55 0.17 155 / 0.7)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}

// ============ Ratios Tab ============

function RatiosTab({ ratios, loading, incomeData, insights }: { ratios: KeyRatios | null; loading: boolean; incomeData: IncomeStatementRow[]; insights: StockInsights | null }) {
  if (loading) return <LoadingState />;

  const companyScores = insights?.companySnapshot?.company || null;
  const sectorScores = insights?.companySnapshot?.sector || null;

  return (
    <div className="space-y-6">
      {/* Data Availability Notice */}
      <div className="border border-border rounded-xl p-5 bg-muted/20">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-muted-foreground mt-0.5 shrink-0" />
          <div>
            <h3 className="font-semibold text-sm mb-1">Traditional Financial Ratios Not Available</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              P/E, P/B, EV/EBITDA, ROE, and other traditional ratios require premium Yahoo Finance API access. 
              Below are Yahoo Finance's proprietary company scores comparing this stock to its sector peers.
            </p>
          </div>
        </div>
      </div>

      {/* Company Scores with actual values */}
      {companyScores && (
        <div className="border border-border rounded-xl p-5">
          <h3 className="font-semibold mb-4">Company Scoring (vs Sector)</h3>
          <p className="text-xs text-muted-foreground mb-4">Yahoo Finance proprietary scores. Higher values indicate better relative performance. Scores are typically between 0 and 1.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.keys(companyScores).map((key) => {
              const compVal = companyScores[key];
              const sectVal = sectorScores?.[key];
              if (compVal == null) return null;
              const label = key.replace(/([A-Z])/g, ' $1').trim();
              const pct = typeof compVal === 'number' ? Math.min(compVal * 100, 100) : 0;
              const isAboveSector = sectVal != null && typeof compVal === 'number' && typeof sectVal === 'number' && compVal > sectVal;
              return (
                <div key={key} className="border border-border/50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium capitalize">{label}</p>
                    <span className={`text-sm font-bold font-mono ${
                      isAboveSector ? "text-[oklch(0.55_0.17_155)]" : "text-foreground"
                    }`}>
                      {typeof compVal === 'number' ? (compVal * 100).toFixed(0) : String(compVal)}
                    </span>
                  </div>
                  {/* Progress bar */}
                  <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        isAboveSector ? "bg-[oklch(0.55_0.17_155)]" : "bg-primary/60"
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  {sectVal != null && typeof sectVal === 'number' && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Sector avg: {(sectVal * 100).toFixed(0)}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Price-derived metrics that we CAN show */}
      <div className="border border-border rounded-xl p-5">
        <h3 className="font-semibold mb-4">Available Price Metrics</h3>
        <p className="text-xs text-muted-foreground mb-4">These metrics are derived from real-time price data available through the Yahoo Finance chart API.</p>
        <div className="space-y-3">
          {[
            { label: "52-Week High/Low", description: "Available in Overview tab and Key Metrics bar" },
            { label: "Day High/Low", description: "Available in Overview tab and Key Metrics bar" },
            { label: "Volume", description: "Daily trading volume shown in Overview" },
            { label: "Support/Resistance Levels", description: "Technical levels shown in Insights tab" },
            { label: "Analyst Target Price", description: "Consensus target shown in Insights tab" },
            { label: "Fair Value Estimate", description: "Valuation assessment shown in Insights tab" },
          ].map((item) => (
            <div key={item.label} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
              <div>
                <p className="text-sm font-medium">{item.label}</p>
                <p className="text-xs text-muted-foreground">{item.description}</p>
              </div>
              <span className="text-xs text-primary">Available</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============ Peers Tab ============

function PeersTab({
  symbol, peerQuotes, loading, facts, currentPrice
}: {
  symbol: string;
  peerQuotes: StockQuote[];
  loading: boolean;
  facts: CompanyFacts | null;
  currentPrice: number | null;
}) {
  const peerSymbols = useMemo(() => getPeers(symbol, 5), [symbol]);

  if (peerSymbols.length === 0) {
    return <EmptyState message="No peer companies found for this stock in our sector mapping." />;
  }

  if (loading) return <LoadingState />;

  // Get current stock quote from peerQuotes
  const currentQuote = peerQuotes.find(q => q.symbol === symbol);
  const peers = peerQuotes.filter(q => q.symbol !== symbol);

  return (
    <div className="border border-border rounded-xl p-5">
      <h3 className="font-semibold mb-4">Peer Comparison — {getSymbolSector(symbol)}</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-2.5 px-3 font-medium text-muted-foreground">Company</th>
              <th className="text-right py-2.5 px-3 font-medium text-muted-foreground">Price</th>
              <th className="text-right py-2.5 px-3 font-medium text-muted-foreground">Change %</th>
              <th className="text-right py-2.5 px-3 font-medium text-muted-foreground">Day High</th>
              <th className="text-right py-2.5 px-3 font-medium text-muted-foreground">Day Low</th>
              <th className="text-right py-2.5 px-3 font-medium text-muted-foreground">52W High</th>
              <th className="text-right py-2.5 px-3 font-medium text-muted-foreground">52W Low</th>
            </tr>
          </thead>
          <tbody>
            {/* Current stock highlighted */}
            {currentQuote && (
              <tr className="border-b border-border bg-primary/5">
                <td className="py-2 px-3 font-medium">
                  <span className="text-primary">{currentQuote.symbol}</span>
                  <span className="text-xs text-muted-foreground ml-1.5">{currentQuote.shortName}</span>
                </td>
                <td className="text-right py-2 px-3 font-mono">${currentQuote.regularMarketPrice.toFixed(2)}</td>
                <td className={`text-right py-2 px-3 font-mono ${currentQuote.changePercent >= 0 ? "text-[oklch(0.55_0.17_155)]" : "text-[oklch(0.55_0.22_25)]"}`}>
                  {currentQuote.changePercent >= 0 ? "+" : ""}{currentQuote.changePercent.toFixed(2)}%
                </td>
                <td className="text-right py-2 px-3 font-mono">${currentQuote.regularMarketDayHigh.toFixed(2)}</td>
                <td className="text-right py-2 px-3 font-mono">${currentQuote.regularMarketDayLow.toFixed(2)}</td>
                <td className="text-right py-2 px-3 font-mono">${currentQuote.fiftyTwoWeekHigh.toFixed(2)}</td>
                <td className="text-right py-2 px-3 font-mono">${currentQuote.fiftyTwoWeekLow.toFixed(2)}</td>
              </tr>
            )}
            {peers.map((peer) => (
              <tr key={peer.symbol} className="border-b border-border/50 hover:bg-accent/30 transition-colors">
                <td className="py-2 px-3">
                  <Link href={`/company/${peer.symbol}`} className="font-medium hover:text-primary transition-colors">
                    {peer.symbol}
                  </Link>
                  <span className="text-xs text-muted-foreground ml-1.5">{peer.shortName}</span>
                </td>
                <td className="text-right py-2 px-3 font-mono">${peer.regularMarketPrice.toFixed(2)}</td>
                <td className={`text-right py-2 px-3 font-mono ${peer.changePercent >= 0 ? "text-[oklch(0.55_0.17_155)]" : "text-[oklch(0.55_0.22_25)]"}`}>
                  {peer.changePercent >= 0 ? "+" : ""}{peer.changePercent.toFixed(2)}%
                </td>
                <td className="text-right py-2 px-3 font-mono">${peer.regularMarketDayHigh.toFixed(2)}</td>
                <td className="text-right py-2 px-3 font-mono">${peer.regularMarketDayLow.toFixed(2)}</td>
                <td className="text-right py-2 px-3 font-mono">${peer.fiftyTwoWeekHigh.toFixed(2)}</td>
                <td className="text-right py-2 px-3 font-mono">${peer.fiftyTwoWeekLow.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ============ Shared Components ============

function LoadingState({ message }: { message?: string }) {
  return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      <span className="ml-2 text-sm text-muted-foreground">{message || "Loading data..."}</span>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <BarChart3 className="w-10 h-10 text-muted-foreground/50 mb-3" />
      <p className="text-sm text-muted-foreground max-w-md">{message}</p>
    </div>
  );
}

function OutlookBadge({ label, outlook }: { label: string; outlook: { direction: string; score: number; scoreDescription: string } }) {
  const color = outlook.direction === "up"
    ? "text-[oklch(0.55_0.17_155)]"
    : outlook.direction === "down"
    ? "text-[oklch(0.55_0.22_25)]"
    : "text-muted-foreground";

  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="text-muted-foreground w-8">{label}:</span>
      <span className={`font-medium ${color}`}>
        {outlook.direction === "up" ? "▲" : outlook.direction === "down" ? "▼" : "—"} {outlook.scoreDescription}
      </span>
    </div>
  );
}

function OutlookCard({ title, outlook }: { title: string; outlook: { direction: string; score: number; scoreDescription: string } }) {
  const bgColor = outlook.direction === "up"
    ? "bg-[oklch(0.55_0.17_155/0.05)] border-[oklch(0.55_0.17_155/0.2)]"
    : outlook.direction === "down"
    ? "bg-[oklch(0.55_0.22_25/0.05)] border-[oklch(0.55_0.22_25/0.2)]"
    : "bg-muted/30 border-border";

  const textColor = outlook.direction === "up"
    ? "text-[oklch(0.55_0.17_155)]"
    : outlook.direction === "down"
    ? "text-[oklch(0.55_0.22_25)]"
    : "text-muted-foreground";

  return (
    <div className={`border rounded-lg p-4 ${bgColor}`}>
      <p className="text-xs text-muted-foreground mb-2">{title}</p>
      <div className="flex items-center gap-2">
        {outlook.direction === "up" ? (
          <TrendingUp className={`w-5 h-5 ${textColor}`} />
        ) : outlook.direction === "down" ? (
          <TrendingDown className={`w-5 h-5 ${textColor}`} />
        ) : (
          <Activity className={`w-5 h-5 ${textColor}`} />
        )}
        <span className={`font-semibold ${textColor}`}>{outlook.scoreDescription}</span>
      </div>
      <p className="text-xs text-muted-foreground mt-1">Score: {outlook.score}/10</p>
    </div>
  );
}

function InfoRow({ icon, label, value, isLink }: { icon: React.ReactNode; label: string; value: string; isLink?: boolean }) {
  if (!value) return null;
  return (
    <div className="flex items-center gap-3 py-1.5">
      <span className="text-muted-foreground">{icon}</span>
      <span className="text-xs text-muted-foreground min-w-[80px]">{label}</span>
      {isLink ? (
        <a href={value} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline truncate">
          {value}
        </a>
      ) : (
        <span className="text-sm truncate">{value}</span>
      )}
    </div>
  );
}
