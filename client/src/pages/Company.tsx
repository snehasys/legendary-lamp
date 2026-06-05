import { useState, useEffect, useMemo } from "react";
import { Link, useParams } from "wouter";
import { ExternalLink, Download, Plus, ArrowUpRight, ArrowDownRight, ChevronRight, FileText, Calendar, TrendingUp, TrendingDown, Minus, Users, Shield, Lightbulb, Building2, Loader2 } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { stocks, formatLargeNumber } from "@/lib/stockData";
import {
  getStockChart, getStockInsights, getStockProfile, getStockHolders, getSecFilings,
  calculateSMA, calculateRSI, calculateMACD,
  type StockQuote, type PricePoint, type StockInsights, type StockProfile, type InsiderHolder, type SecFiling
} from "@/lib/yahooFinance";
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell
} from "recharts";

// ============================================================================
// Helper Components
// ============================================================================

function MetricCard({ label, value, className = "" }: { label: string; value: string; className?: string }) {
  return (
    <div className="flex justify-between items-center py-1.5">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className={`text-sm font-mono font-medium ${className}`}>{value}</span>
    </div>
  );
}

function LoadingSpinner({ text = "Loading..." }: { text?: string }) {
  return (
    <div className="flex items-center justify-center py-12">
      <Loader2 className="w-5 h-5 animate-spin text-primary mr-2" />
      <span className="text-sm text-muted-foreground">{text}</span>
    </div>
  );
}

function ScoreBar({ label, score, maxScore = 10 }: { label: string; score: number; maxScore?: number }) {
  const pct = Math.min((score / maxScore) * 100, 100);
  const color = pct >= 70 ? "bg-green-500" : pct >= 40 ? "bg-amber-500" : "bg-red-500";
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-muted-foreground w-36 shrink-0">{label}</span>
      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color} transition-all`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-sm font-mono font-medium w-8 text-right">{score.toFixed(1)}</span>
    </div>
  );
}

function DirectionBadge({ direction }: { direction: string }) {
  const isUp = direction?.toLowerCase().includes("up") || direction?.toLowerCase().includes("bull");
  const isDown = direction?.toLowerCase().includes("down") || direction?.toLowerCase().includes("bear");
  if (isUp) return <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-green-500/10 text-green-600"><TrendingUp className="w-3 h-3" /> Bullish</span>;
  if (isDown) return <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-red-500/10 text-red-600"><TrendingDown className="w-3 h-3" /> Bearish</span>;
  return <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600"><Minus className="w-3 h-3" /> Neutral</span>;
}

// ============================================================================
// Main Company Page
// ============================================================================

export default function Company() {
  const params = useParams<{ symbol: string }>();
  const symbol = params.symbol?.toUpperCase() || "";

  // State
  const [activeTab, setActiveTab] = useState("chart");
  const [chartRange, setChartRange] = useState("1y");
  const [loading, setLoading] = useState(true);
  const [quote, setQuote] = useState<StockQuote | null>(null);
  const [prices, setPrices] = useState<PricePoint[]>([]);
  const [insights, setInsights] = useState<StockInsights | null>(null);
  const [profile, setProfile] = useState<StockProfile | null>(null);
  const [holders, setHolders] = useState<InsiderHolder[]>([]);
  const [secFilings, setSecFilings] = useState<SecFiling[]>([]);

  // Fallback to mock data for basic info
  const mockStock = useMemo(() => stocks.find(s => s.symbol === symbol), [symbol]);

  // Fetch live data
  useEffect(() => {
    let cancelled = false;
    const delay = (ms: number) => new Promise(r => setTimeout(r, ms));

    async function fetchData() {
      setLoading(true);
      try {
        // Fetch chart first (most important for display)
        const chartData = await getStockChart(symbol, "1d", chartRange).catch(() => null);
        if (cancelled) return;
        if (chartData) {
          setQuote(chartData.quote);
          setPrices(chartData.prices);
        }
        setLoading(false);

        // Fetch remaining data with small delays to avoid rate limiting
        await delay(300);
        if (cancelled) return;
        const insightsData = await getStockInsights(symbol).catch(() => null);
        if (cancelled) return;
        if (insightsData) setInsights(insightsData);

        await delay(300);
        if (cancelled) return;
        const profileData = await getStockProfile(symbol).catch(() => null);
        if (cancelled) return;
        if (profileData) setProfile(profileData);

        await delay(300);
        if (cancelled) return;
        const holdersData = await getStockHolders(symbol).catch(() => []);
        if (cancelled) return;
        setHolders(holdersData);

        await delay(300);
        if (cancelled) return;
        const filingsData = await getSecFilings(symbol).catch(() => []);
        if (cancelled) return;
        setSecFilings(filingsData);
      } catch (e) {
        console.error("Failed to fetch company data:", e);
        if (!cancelled) setLoading(false);
      }
    }
    fetchData();
    return () => { cancelled = true; };
  }, [symbol, chartRange]);

  // Derived data
  const sma50 = useMemo(() => {
    if (prices.length < 50) return [];
    return calculateSMA(prices.map(p => p.close), 50);
  }, [prices]);

  const sma200 = useMemo(() => {
    if (prices.length < 200) return [];
    return calculateSMA(prices.map(p => p.close), 200);
  }, [prices]);

  const rsiData = useMemo(() => {
    if (prices.length < 15) return [];
    return calculateRSI(prices.map(p => p.close), 14);
  }, [prices]);

  const chartData = useMemo(() => {
    return prices.map((p, i) => ({
      date: p.date,
      price: p.close,
      volume: p.volume,
      sma50: sma50[i] || undefined,
      sma200: sma200[i] || undefined,
      rsi: rsiData[i] || undefined,
    }));
  }, [prices, sma50, sma200, rsiData]);

  const companyName = quote?.name || profile?.name || mockStock?.name || symbol;
  const currentPrice = quote?.price || mockStock?.price || 0;
  const priceChange = quote?.change || mockStock?.change || 0;
  const priceChangePercent = quote?.changePercent || mockStock?.changePercent || 0;

  // Tab definitions
  const tabs = [
    { id: "chart", label: "Chart" },
    { id: "insights", label: "Insights" },
    { id: "peers", label: "Peers" },
    { id: "profile", label: "Company" },
    { id: "holders", label: "Shareholding" },
    { id: "filings", label: "SEC Filings" },
  ];

  const ranges = [
    { id: "1mo", label: "1M" },
    { id: "6mo", label: "6M" },
    { id: "1y", label: "1Y" },
    { id: "2y", label: "2Y" },
    { id: "5y", label: "5Y" },
    { id: "max", label: "Max" },
  ];

  if (!quote && !mockStock && !loading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 container py-16 text-center">
          <h1 className="font-display font-bold text-2xl mb-4">Company Not Found</h1>
          <p className="text-muted-foreground">The symbol "{symbol}" was not found. Try searching for a valid US stock ticker.</p>
          <Link href="/" className="text-primary hover:underline mt-4 inline-block">← Back to Home</Link>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      {/* Sub-navigation */}
      <div className="border-b border-border bg-background sticky top-14 z-40">
        <div className="container">
          <div className="flex items-center gap-1 overflow-x-auto py-2 scrollbar-hide">
            <span className="text-sm font-medium text-foreground px-2 py-1 shrink-0">
              {companyName}
            </span>
            <span className="text-border mx-1">|</span>
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`text-sm px-2.5 py-1 rounded shrink-0 transition-colors ${
                  activeTab === tab.id
                    ? "text-primary font-medium bg-primary/5"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <main className="flex-1 container py-6">
        {/* Company Header */}
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-6">
          <div>
            <h1 className="font-display font-bold text-2xl">{companyName}</h1>
            <div className="flex items-center gap-3 mt-2">
              <span className="text-2xl font-mono font-semibold">${currentPrice.toFixed(2)}</span>
              <span className={`flex items-center gap-0.5 text-sm font-medium ${priceChange >= 0 ? "gain" : "loss"}`}>
                {priceChange >= 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                {priceChange >= 0 ? "+" : ""}{priceChange.toFixed(2)} ({priceChangePercent.toFixed(2)}%)
              </span>
            </div>
            <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
              {profile?.website && (
                <a href={profile.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-primary transition-colors">
                  <ExternalLink className="w-3 h-3" /> Website
                </a>
              )}
              <span>{quote?.exchange || mockStock?.exchange || "NYSE"}: {symbol}</span>
              {(profile?.sector || mockStock?.sector) && (
                <Link href={`/sector/${encodeURIComponent(profile?.sector || mockStock?.sector || "")}`} className="hover:text-primary transition-colors">
                  {profile?.sector || mockStock?.sector}
                </Link>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-1.5 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity">
              <Plus className="w-4 h-4" /> FOLLOW
            </button>
          </div>
        </div>

        {/* Key Metrics */}
        {quote && (
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 mb-8">
            <div className="border border-border rounded-xl p-5">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-x-8 gap-y-0">
                <MetricCard label="Previous Close" value={`$${quote.previousClose.toFixed(2)}`} />
                <MetricCard label="Day Range" value={`$${quote.dayLow.toFixed(2)} - $${quote.dayHigh.toFixed(2)}`} />
                <MetricCard label="52W High" value={`$${quote.high52w.toFixed(2)}`} />
                <MetricCard label="52W Low" value={`$${quote.low52w.toFixed(2)}`} />
                <MetricCard label="Volume" value={formatLargeNumber(quote.volume)} />
                <MetricCard label="52W Range Position" value={`${quote.high52w > quote.low52w ? (((quote.price - quote.low52w) / (quote.high52w - quote.low52w)) * 100).toFixed(0) : "—"}%`} />
                {insights?.keyTechnicals.support && <MetricCard label="Support" value={`$${insights.keyTechnicals.support.toFixed(2)}`} />}
                {insights?.keyTechnicals.resistance && <MetricCard label="Resistance" value={`$${insights.keyTechnicals.resistance.toFixed(2)}`} />}
                {insights?.keyTechnicals.stopLoss && <MetricCard label="Stop Loss" value={`$${insights.keyTechnicals.stopLoss.toFixed(2)}`} />}
              </div>
            </div>
            <div className="space-y-4">
              {profile && (
                <div className="border border-border rounded-xl p-5">
                  <h3 className="font-display font-semibold text-sm mb-2 uppercase tracking-wide">About</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed line-clamp-4">{profile.description || mockStock?.about || "No description available."}</p>
                </div>
              )}
              <div className="border border-border rounded-xl p-5">
                <h3 className="font-display font-semibold text-sm mb-2 uppercase tracking-wide">Key Points</h3>
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Sector</span>
                    <span className="text-primary">{profile?.sector || mockStock?.sector || "N/A"}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Industry</span>
                    <span>{profile?.industry || mockStock?.industry || "N/A"}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Exchange</span>
                    <span>{quote.exchange}</span>
                  </div>
                  {profile?.employees && (
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Employees</span>
                      <span>{profile.employees.toLocaleString()}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {loading && !quote && <LoadingSpinner text="Fetching live market data..." />}

        {/* ================================================================ */}
        {/* CHART TAB */}
        {/* ================================================================ */}
        {activeTab === "chart" && prices.length > 0 && (
          <section className="mb-8 border border-border rounded-xl p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <h2 className="font-display font-semibold">Price Chart</h2>
              <div className="flex items-center gap-1">
                {ranges.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => setChartRange(r.id)}
                    className={`px-2.5 py-1 text-xs rounded transition-colors ${
                      chartRange === r.id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent"
                    }`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
                  <defs>
                    <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="oklch(0.72 0.19 155)" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="oklch(0.72 0.19 155)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.92 0.003 260)" vertical={false} />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 10, fill: "oklch(0.5 0.02 260)" }}
                    tickFormatter={(d) => new Date(d).toLocaleDateString("en-US", { month: "short", year: "2-digit" })}
                    interval="preserveStartEnd"
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: "oklch(0.5 0.02 260)" }}
                    domain={["auto", "auto"]}
                    tickFormatter={(v) => `$${v}`}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid oklch(0.92 0.003 260)", boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }}
                    formatter={(value: number, name: string) => {
                      if (name === "price") return [`$${value.toFixed(2)}`, "Price"];
                      if (name === "sma50") return [`$${value.toFixed(2)}`, "50 DMA"];
                      if (name === "sma200") return [`$${value.toFixed(2)}`, "200 DMA"];
                      return [value, name];
                    }}
                    labelFormatter={(label) => new Date(label).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                  />
                  <Area type="monotone" dataKey="price" stroke="oklch(0.45 0.12 155)" fill="url(#priceGradient)" strokeWidth={1.5} dot={false} />
                  {sma50.length > 0 && <Line type="monotone" dataKey="sma50" stroke="oklch(0.6 0.15 250)" strokeWidth={1} dot={false} strokeDasharray="4 2" />}
                  {sma200.length > 0 && <Line type="monotone" dataKey="sma200" stroke="oklch(0.6 0.15 30)" strokeWidth={1} dot={false} strokeDasharray="4 2" />}
                </AreaChart>
              </ResponsiveContainer>
            </div>
            {/* Volume Chart */}
            <div className="h-[60px] mt-1">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData.filter((_, i) => i % Math.max(1, Math.floor(chartData.length / 80)) === 0)} margin={{ top: 0, right: 5, bottom: 0, left: 5 }}>
                  <Bar dataKey="volume" fill="oklch(0.72 0.19 155 / 0.25)" radius={[1, 1, 0, 0]} />
                  <XAxis dataKey="date" hide />
                  <YAxis hide />
                  <Tooltip
                    contentStyle={{ fontSize: 11, borderRadius: 6 }}
                    formatter={(value: number) => [formatLargeNumber(value), "Volume"]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-[oklch(0.45_0.12_155)] inline-block"></span> Price</span>
              {sma50.length > 0 && <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-[oklch(0.6_0.15_250)] inline-block" style={{ borderTop: "1px dashed" }}></span> 50 DMA</span>}
              {sma200.length > 0 && <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-[oklch(0.6_0.15_30)] inline-block" style={{ borderTop: "1px dashed" }}></span> 200 DMA</span>}
            </div>

            {/* RSI Section */}
            {rsiData.length > 0 && (
              <div className="mt-6 border-t border-border pt-4">
                <h3 className="text-sm font-medium mb-2">RSI (14)</h3>
                <div className="h-[80px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData.slice(-60)} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.92 0.003 260)" vertical={false} />
                      <XAxis dataKey="date" hide />
                      <YAxis domain={[0, 100]} tick={{ fontSize: 9 }} axisLine={false} tickLine={false} ticks={[30, 50, 70]} />
                      <Line type="monotone" dataKey="rsi" stroke="oklch(0.55 0.2 280)" strokeWidth={1.5} dot={false} />
                      {/* Overbought/Oversold lines */}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                  <span>Current RSI: <strong className="text-foreground">{rsiData[rsiData.length - 1]?.toFixed(1) || "—"}</strong></span>
                  <span className="text-green-600">Oversold &lt; 30</span>
                  <span className="text-red-600">Overbought &gt; 70</span>
                </div>
              </div>
            )}
          </section>
        )}

        {/* ================================================================ */}
        {/* INSIGHTS TAB */}
        {/* ================================================================ */}
        {activeTab === "insights" && (
          <section className="mb-8 space-y-6">
            {!insights && loading && <LoadingSpinner text="Loading insights..." />}
            {!insights && !loading && (
              <div className="border border-border rounded-xl p-8 text-center">
                <Lightbulb className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">No insights data available for {symbol}.</p>
              </div>
            )}
            {insights && (
              <>
                {/* Recommendation & Valuation */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {insights.recommendation && (
                    <div className="border border-border rounded-xl p-5">
                      <h3 className="text-sm font-medium text-muted-foreground mb-2">Analyst Recommendation</h3>
                      <div className="text-2xl font-bold capitalize">{insights.recommendation.rating}</div>
                      {insights.recommendation.targetPrice && (
                        <p className="text-sm text-muted-foreground mt-1">Target: ${insights.recommendation.targetPrice.toFixed(2)}</p>
                      )}
                    </div>
                  )}
                  {insights.valuation && (
                    <div className="border border-border rounded-xl p-5">
                      <h3 className="text-sm font-medium text-muted-foreground mb-2">Valuation</h3>
                      <div className="text-lg font-semibold">{insights.valuation.description || "N/A"}</div>
                      {insights.valuation.discount && <p className="text-sm text-muted-foreground mt-1">Discount: {insights.valuation.discount}</p>}
                      {insights.valuation.relativeValue && <p className="text-sm text-muted-foreground">Relative Value: {insights.valuation.relativeValue}</p>}
                    </div>
                  )}
                  <div className="border border-border rounded-xl p-5">
                    <h3 className="text-sm font-medium text-muted-foreground mb-2">Key Technicals</h3>
                    <div className="space-y-1.5">
                      {insights.keyTechnicals.support && <MetricCard label="Support" value={`$${insights.keyTechnicals.support.toFixed(2)}`} />}
                      {insights.keyTechnicals.resistance && <MetricCard label="Resistance" value={`$${insights.keyTechnicals.resistance.toFixed(2)}`} />}
                      {insights.keyTechnicals.stopLoss && <MetricCard label="Stop Loss" value={`$${insights.keyTechnicals.stopLoss.toFixed(2)}`} />}
                    </div>
                  </div>
                </div>

                {/* Technical Outlook */}
                <div className="border border-border rounded-xl p-5">
                  <h3 className="font-display font-semibold mb-4">Technical Outlook</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {insights.technicalOutlook.shortTerm && (
                      <div className="text-center p-4 rounded-lg bg-muted/30">
                        <p className="text-xs text-muted-foreground mb-1">Short Term</p>
                        <DirectionBadge direction={insights.technicalOutlook.shortTerm.direction} />
                        <p className="text-xs text-muted-foreground mt-2">{insights.technicalOutlook.shortTerm.scoreDescription}</p>
                      </div>
                    )}
                    {insights.technicalOutlook.midTerm && (
                      <div className="text-center p-4 rounded-lg bg-muted/30">
                        <p className="text-xs text-muted-foreground mb-1">Mid Term</p>
                        <DirectionBadge direction={insights.technicalOutlook.midTerm.direction} />
                        <p className="text-xs text-muted-foreground mt-2">{insights.technicalOutlook.midTerm.scoreDescription}</p>
                      </div>
                    )}
                    {insights.technicalOutlook.longTerm && (
                      <div className="text-center p-4 rounded-lg bg-muted/30">
                        <p className="text-xs text-muted-foreground mb-1">Long Term</p>
                        <DirectionBadge direction={insights.technicalOutlook.longTerm.direction} />
                        <p className="text-xs text-muted-foreground mt-2">{insights.technicalOutlook.longTerm.scoreDescription}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Company Scores */}
                {insights.companyScores && (
                  <div className="border border-border rounded-xl p-5">
                    <h3 className="font-display font-semibold mb-4">Company Scores</h3>
                    <div className="space-y-3">
                      <ScoreBar label="Innovativeness" score={insights.companyScores.innovativeness} />
                      <ScoreBar label="Hiring Activity" score={insights.companyScores.hiring} />
                      <ScoreBar label="Sustainability" score={insights.companyScores.sustainability} />
                      <ScoreBar label="Insider Sentiments" score={insights.companyScores.insiderSentiments} />
                      <ScoreBar label="Dividends" score={insights.companyScores.dividends} />
                    </div>
                  </div>
                )}

                {/* Significant Developments */}
                {insights.significantDevelopments.length > 0 && (
                  <div className="border border-border rounded-xl p-5">
                    <h3 className="font-display font-semibold mb-4">Significant Developments</h3>
                    <div className="space-y-3">
                      {insights.significantDevelopments.slice(0, 10).map((dev, i) => (
                        <div key={i} className="flex items-start gap-3 py-2 border-b border-border last:border-0">
                          <Calendar className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                          <div>
                            <p className="text-sm">{dev.headline}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">{dev.date}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* SEC Reports from Insights */}
                {insights.secReports.length > 0 && (
                  <div className="border border-border rounded-xl p-5">
                    <h3 className="font-display font-semibold mb-4">Research Reports</h3>
                    <div className="space-y-3">
                      {insights.secReports.slice(0, 5).map((report, i) => (
                        <div key={i} className="p-3 rounded-lg bg-muted/20">
                          <p className="text-sm font-medium">{report.title}</p>
                          <p className="text-xs text-muted-foreground mt-1">{report.provider}</p>
                          {report.summary && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{report.summary}</p>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </section>
        )}

        {/* ================================================================ */}
        {/* PEERS TAB */}
        {/* ================================================================ */}
        {activeTab === "peers" && (
          <section className="mb-8 border border-border rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-display font-semibold">Peer Comparison</h2>
                <p className="text-xs text-muted-foreground mt-1">
                  Comparing {symbol} with sector peers based on live market data
                </p>
              </div>
            </div>
            {mockStock ? (
              <div className="overflow-x-auto">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>S.No.</th>
                      <th>Name</th>
                      <th className="numeric">Price $</th>
                      <th className="numeric">Change %</th>
                      <th className="numeric">52W High</th>
                      <th className="numeric">52W Low</th>
                      <th className="numeric">Volume</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="bg-primary/[0.03]">
                      <td>1.</td>
                      <td><span className="font-medium">{companyName}</span></td>
                      <td className="numeric">{currentPrice.toFixed(2)}</td>
                      <td className="numeric"><span className={priceChangePercent >= 0 ? "gain" : "loss"}>{priceChangePercent.toFixed(2)}%</span></td>
                      <td className="numeric">{quote?.high52w.toFixed(2) || "—"}</td>
                      <td className="numeric">{quote?.low52w.toFixed(2) || "—"}</td>
                      <td className="numeric">{quote ? formatLargeNumber(quote.volume) : "—"}</td>
                    </tr>
                    {stocks
                      .filter(s => s.sector === mockStock.sector && s.symbol !== symbol)
                      .slice(0, 8)
                      .map((peer, i) => (
                        <tr key={peer.symbol}>
                          <td>{i + 2}.</td>
                          <td><Link href={`/company/${peer.symbol}`} className="hover:text-primary">{peer.name}</Link></td>
                          <td className="numeric">{peer.price.toFixed(2)}</td>
                          <td className="numeric"><span className={peer.changePercent >= 0 ? "gain" : "loss"}>{peer.changePercent.toFixed(2)}%</span></td>
                          <td className="numeric">{peer.high52w.toFixed(2)}</td>
                          <td className="numeric">{peer.low52w.toFixed(2)}</td>
                          <td className="numeric">—</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Peer comparison requires sector data. Visit the stock from the home page to see peers.</p>
            )}
          </section>
        )}

        {/* ================================================================ */}
        {/* COMPANY PROFILE TAB */}
        {/* ================================================================ */}
        {activeTab === "profile" && (
          <section className="mb-8 space-y-6">
            {!profile && loading && <LoadingSpinner text="Loading company profile..." />}
            {!profile && !loading && (
              <div className="border border-border rounded-xl p-8 text-center">
                <Building2 className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">No company profile data available for {symbol}.</p>
              </div>
            )}
            {profile && (
              <>
                {/* Business Summary */}
                <div className="border border-border rounded-xl p-5">
                  <h3 className="font-display font-semibold mb-3">Business Summary</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{profile.description}</p>
                </div>

                {/* Company Info Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="border border-border rounded-xl p-5">
                    <h3 className="font-display font-semibold text-sm mb-3 uppercase tracking-wide">Company Information</h3>
                    <div className="space-y-2">
                      <MetricCard label="Sector" value={profile.sector} />
                      <MetricCard label="Industry" value={profile.industry} />
                      {profile.employees && <MetricCard label="Employees" value={profile.employees.toLocaleString()} />}
                      {profile.address && <MetricCard label="Address" value={profile.address} />}
                      {profile.website && (
                        <div className="flex justify-between items-center py-1.5">
                          <span className="text-sm text-muted-foreground">Website</span>
                          <a href={profile.website} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline flex items-center gap-1">
                            {profile.website.replace(/^https?:\/\//, "").replace(/\/$/, "")} <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Officers */}
                  {profile.officers.length > 0 && (
                    <div className="border border-border rounded-xl p-5">
                      <h3 className="font-display font-semibold text-sm mb-3 uppercase tracking-wide">Key Officers</h3>
                      <div className="space-y-2">
                        {profile.officers.slice(0, 6).map((officer, i) => (
                          <div key={i} className="flex justify-between items-center py-1.5 border-b border-border last:border-0">
                            <div>
                              <p className="text-sm font-medium">{officer.name}</p>
                              <p className="text-xs text-muted-foreground">{officer.title}</p>
                            </div>
                            {officer.age && <span className="text-xs text-muted-foreground">Age {officer.age}</span>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </section>
        )}

        {/* ================================================================ */}
        {/* SHAREHOLDING TAB */}
        {/* ================================================================ */}
        {activeTab === "holders" && (
          <section className="mb-8 space-y-6">
            {holders.length === 0 && loading && <LoadingSpinner text="Loading shareholding data..." />}
            {holders.length === 0 && !loading && (
              <div className="border border-border rounded-xl p-8 text-center">
                <Users className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">No insider holder data available for {symbol}.</p>
              </div>
            )}
            {holders.length > 0 && (
              <div className="border border-border rounded-xl p-5">
                <h3 className="font-display font-semibold mb-4">Insider Holders</h3>
                <div className="overflow-x-auto">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Relation</th>
                        <th>Transaction</th>
                        <th className="numeric">Date</th>
                        <th className="numeric">Shares Held</th>
                      </tr>
                    </thead>
                    <tbody>
                      {holders.map((h, i) => (
                        <tr key={i}>
                          <td className="font-medium">{h.name}</td>
                          <td className="text-muted-foreground">{h.relation}</td>
                          <td>{h.transactionDescription}</td>
                          <td className="numeric">{h.latestTransDate}</td>
                          <td className="numeric">{h.positionDirect ? h.positionDirect.toLocaleString() : "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </section>
        )}

        {/* ================================================================ */}
        {/* SEC FILINGS TAB */}
        {/* ================================================================ */}
        {activeTab === "filings" && (
          <section className="mb-8">
            {secFilings.length === 0 && loading && <LoadingSpinner text="Loading SEC filings..." />}
            {secFilings.length === 0 && !loading && (
              <div className="border border-border rounded-xl p-8 text-center">
                <FileText className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">No SEC filings available for {symbol}.</p>
              </div>
            )}
            {secFilings.length > 0 && (
              <div className="border border-border rounded-xl p-5">
                <h3 className="font-display font-semibold mb-4">SEC Filings & Documents</h3>
                <div className="space-y-2">
                  {secFilings.map((filing, i) => (
                    <a
                      key={i}
                      href={filing.edgarUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-3 rounded-lg hover:bg-accent/50 transition-colors group"
                    >
                      <div className="flex items-center gap-3">
                        <FileText className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                        <div>
                          <span className="text-sm font-medium group-hover:text-primary transition-colors">{filing.title}</span>
                          <span className="text-xs text-muted-foreground ml-2 bg-muted px-1.5 py-0.5 rounded">{filing.type}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Calendar className="w-3 h-3" />
                        {filing.date}
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </section>
        )}
      </main>

      <Footer />
    </div>
  );
}
