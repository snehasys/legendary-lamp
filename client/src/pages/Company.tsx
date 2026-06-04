import { useState, useMemo } from "react";
import { useParams, Link } from "wouter";
import { ArrowUpRight, ArrowDownRight, Loader2, AlertCircle, Plus, Check, Building2, Users, FileText, ExternalLink, TrendingUp, TrendingDown, Minus } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, CartesianGrid } from "recharts";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

function formatNumber(num: number | undefined | null): string {
  if (num == null || isNaN(num)) return "N/A";
  if (Math.abs(num) >= 1e12) return "$" + (num / 1e12).toFixed(2) + "T";
  if (Math.abs(num) >= 1e9) return "$" + (num / 1e9).toFixed(2) + "B";
  if (Math.abs(num) >= 1e6) return "$" + (num / 1e6).toFixed(2) + "M";
  if (Math.abs(num) >= 1e3) return "$" + (num / 1e3).toFixed(1) + "K";
  return "$" + num.toFixed(2);
}

function formatVol(num: number | undefined | null): string {
  if (num == null || isNaN(num)) return "N/A";
  if (Math.abs(num) >= 1e9) return (num / 1e9).toFixed(2) + "B";
  if (Math.abs(num) >= 1e6) return (num / 1e6).toFixed(2) + "M";
  if (Math.abs(num) >= 1e3) return (num / 1e3).toFixed(1) + "K";
  return num.toString();
}

export default function Company() {
  const params = useParams<{ symbol: string }>();
  const upperSymbol = (params.symbol || "").toUpperCase();
  const { isAuthenticated } = useAuth();
  const [chartRange, setChartRange] = useState("1y");
  const [chartInterval, setChartInterval] = useState("1d");
  const utils = trpc.useUtils();

  // Stable query inputs
  const chartInput = useMemo(() => ({ symbol: upperSymbol, interval: chartInterval, range: chartRange }), [upperSymbol, chartInterval, chartRange]);
  const symbolInput = useMemo(() => ({ symbol: upperSymbol }), [upperSymbol]);

  // Fetch real data from Yahoo Finance via tRPC
  const { data: chartData, isLoading: chartLoading, error: chartError } = trpc.stocks.chart.useQuery(
    chartInput,
    { staleTime: 60_000, enabled: !!upperSymbol, retry: 1 }
  );

  const { data: profile, isLoading: profileLoading, error: profileError } = trpc.stocks.profile.useQuery(
    symbolInput,
    { staleTime: 300_000, enabled: !!upperSymbol, retry: 1 }
  );

  const { data: insights, isLoading: insightsLoading, error: insightsError } = trpc.stocks.insights.useQuery(
    symbolInput,
    { staleTime: 300_000, enabled: !!upperSymbol, retry: 1 }
  );

  const { data: holders, isLoading: holdersLoading, error: holdersError } = trpc.stocks.holders.useQuery(
    symbolInput,
    { staleTime: 300_000, enabled: !!upperSymbol, retry: 1 }
  );

  // Watchlist
  const { data: watchlistItems } = trpc.watchlist.list.useQuery(undefined, { enabled: isAuthenticated });
  const addToWatchlist = trpc.watchlist.add.useMutation({
    onSuccess: () => { toast.success(`${upperSymbol} added to watchlist`); utils.watchlist.list.invalidate(); },
    onError: (e) => toast.error(e.message || "Failed to add to watchlist"),
  });
  const removeFromWatchlist = trpc.watchlist.remove.useMutation({
    onSuccess: () => { toast.success(`${upperSymbol} removed from watchlist`); utils.watchlist.list.invalidate(); },
    onError: (e) => toast.error(e.message || "Failed to remove from watchlist"),
  });
  const isInWatchlist = watchlistItems?.some((w) => w.symbol === upperSymbol);

  // Process chart data for Recharts
  const priceChartData = useMemo(() => {
    if (!chartData?.dataPoints) return [];
    return chartData.dataPoints
      .filter(d => d.close != null)
      .map((d) => ({
        date: new Date(d.timestamp * 1000).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "2-digit" }),
        timestamp: d.timestamp,
        price: d.close,
        volume: d.volume || 0,
        open: d.open,
        high: d.high,
        low: d.low,
      }));
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
          {profile?.sector && (
            <>
              <span className="hover:text-foreground transition-colors">{profile.sector}</span>
              <span>/</span>
            </>
          )}
          <span className="text-foreground font-medium">{upperSymbol}</span>
        </nav>

        {/* Company Header */}
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-6">
          <div>
            {profileLoading ? (
              <div className="flex items-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                <span className="text-muted-foreground text-sm">Loading company info...</span>
              </div>
            ) : (
              <div>
                <h1 className="text-2xl font-bold">{profile?.longBusinessSummary ? (meta?.longName || meta?.shortName || upperSymbol) : (meta?.longName || meta?.shortName || upperSymbol)}</h1>
                <div className="flex items-center gap-3 mt-1.5 text-sm text-muted-foreground flex-wrap">
                  {meta?.exchangeName && <span>{meta.exchangeName}: {upperSymbol}</span>}
                  {profile?.sector && (
                    <span className="flex items-center gap-1">
                      <Building2 className="w-3.5 h-3.5" />
                      {profile.sector}
                    </span>
                  )}
                  {profile?.industry && <span>• {profile.industry}</span>}
                  {profile?.website && (
                    <a href={profile.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-primary hover:underline">
                      <ExternalLink className="w-3 h-3" />
                      Website
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-4">
            {/* Price */}
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

            {/* Watchlist Button */}
            {isAuthenticated && (
              <Button
                variant={isInWatchlist ? "secondary" : "outline"}
                size="sm"
                onClick={() => {
                  if (isInWatchlist) removeFromWatchlist.mutate({ symbol: upperSymbol });
                  else addToWatchlist.mutate({ symbol: upperSymbol });
                }}
                disabled={addToWatchlist.isPending || removeFromWatchlist.isPending}
              >
                {isInWatchlist ? <Check className="w-4 h-4 mr-1" /> : <Plus className="w-4 h-4 mr-1" />}
                {isInWatchlist ? "Watching" : "Watch"}
              </Button>
            )}
          </div>
        </div>

        {/* Key Metrics from Chart Meta */}
        {meta && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
            {[
              { label: "Day High", value: meta.regularMarketDayHigh ? `$${meta.regularMarketDayHigh.toFixed(2)}` : "N/A" },
              { label: "Day Low", value: meta.regularMarketDayLow ? `$${meta.regularMarketDayLow.toFixed(2)}` : "N/A" },
              { label: "52W High", value: meta.fiftyTwoWeekHigh ? `$${meta.fiftyTwoWeekHigh.toFixed(2)}` : "N/A" },
              { label: "52W Low", value: meta.fiftyTwoWeekLow ? `$${meta.fiftyTwoWeekLow.toFixed(2)}` : "N/A" },
              { label: "Volume", value: meta.regularMarketVolume ? formatVol(meta.regularMarketVolume) : "N/A" },
              { label: "Prev Close", value: prevClose ? `$${prevClose.toFixed(2)}` : "N/A" },
            ].map((item) => (
              <div key={item.label} className="border border-border rounded-lg p-3">
                <p className="text-xs text-muted-foreground">{item.label}</p>
                <p className="text-sm font-mono font-medium mt-0.5">{item.value}</p>
              </div>
            ))}
          </div>
        )}

        {/* Price Chart */}
        <div className="border border-border rounded-xl p-5 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <h3 className="font-semibold">Price Chart</h3>
            <div className="flex items-center gap-1 flex-wrap">
              {rangeOptions.map((opt) => (
                <button
                  key={opt.range}
                  onClick={() => { setChartRange(opt.range); setChartInterval(opt.interval); }}
                  className={`px-2.5 py-1 text-xs font-medium rounded transition-colors ${
                    chartRange === opt.range
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {chartLoading ? (
            <div className="flex items-center justify-center h-72">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              <span className="ml-2 text-sm text-muted-foreground">Loading chart data from Yahoo Finance...</span>
            </div>
          ) : chartError ? (
            <div className="flex flex-col items-center justify-center h-72">
              <AlertCircle className="w-10 h-10 text-destructive mb-3" />
              <p className="text-sm font-medium text-destructive">Unable to load chart data for {upperSymbol}</p>
              <p className="text-xs text-muted-foreground mt-1">The symbol may be invalid or Yahoo Finance data is temporarily unavailable.</p>
            </div>
          ) : priceChartData.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-72">
              <AlertCircle className="w-8 h-8 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">No chart data available for this time range.</p>
            </div>
          ) : (
            <>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={priceChartData} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
                    <defs>
                      <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={isPositive ? "oklch(0.55 0.17 155)" : "oklch(0.55 0.22 25)"} stopOpacity={0.2} />
                        <stop offset="95%" stopColor={isPositive ? "oklch(0.55 0.17 155)" : "oklch(0.55 0.22 25)"} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.92 0.003 260)" vertical={false} />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                    <YAxis domain={["auto", "auto"]} tick={{ fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v}`} />
                    <Tooltip
                      contentStyle={{ borderRadius: "8px", border: "1px solid var(--border)", background: "var(--popover)", fontSize: 12 }}
                      formatter={(value: number) => [`$${value.toFixed(2)}`, "Price"]}
                    />
                    <Area
                      type="monotone"
                      dataKey="price"
                      stroke={isPositive ? "oklch(0.45 0.15 155)" : "oklch(0.45 0.20 25)"}
                      fill="url(#priceGradient)"
                      strokeWidth={1.5}
                      dot={false}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              {/* Volume */}
              <div className="h-16 mt-1">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={priceChartData.filter((_, i) => i % Math.max(1, Math.floor(priceChartData.length / 60)) === 0)} margin={{ top: 0, right: 5, bottom: 0, left: 5 }}>
                    <Bar dataKey="volume" fill="oklch(0.55 0.17 155 / 0.25)" radius={[1, 1, 0, 0]} />
                    <XAxis dataKey="date" hide />
                    <YAxis hide />
                    <Tooltip contentStyle={{ fontSize: 11, borderRadius: 6 }} formatter={(value: number) => [formatVol(value), "Volume"]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </>
          )}
        </div>

        {/* Tabs: About, Technical Insights, Holders, SEC Filings */}
        <Tabs defaultValue="about" className="mb-6">
          <TabsList className="flex-wrap">
            <TabsTrigger value="about">About</TabsTrigger>
            <TabsTrigger value="technicals">Technical Insights</TabsTrigger>
            <TabsTrigger value="holders">Insider Holdings</TabsTrigger>
            <TabsTrigger value="filings">SEC Filings</TabsTrigger>
          </TabsList>

          {/* About Tab */}
          <TabsContent value="about" className="mt-4">
            {profileLoading ? (
              <div className="flex items-center gap-2 py-8 justify-center">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span className="text-muted-foreground">Loading company profile from Yahoo Finance...</span>
              </div>
            ) : profileError ? (
              <div className="flex flex-col items-center gap-2 py-8 text-destructive">
                <AlertCircle className="w-6 h-6" />
                <p className="text-sm font-medium">Unable to load company profile</p>
                <p className="text-xs text-muted-foreground">Yahoo Finance may not have profile data for {upperSymbol}.</p>
              </div>
            ) : profile ? (
              <div className="space-y-4">
                {profile.longBusinessSummary && (
                  <div className="border border-border rounded-lg p-5">
                    <h4 className="font-semibold text-sm mb-2">Company Description</h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">{profile.longBusinessSummary}</p>
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="border border-border rounded-lg p-5">
                    <h4 className="font-semibold text-sm mb-3">Company Details</h4>
                    <dl className="space-y-2.5">
                      {profile.sector && <div className="flex justify-between"><dt className="text-sm text-muted-foreground">Sector</dt><dd className="text-sm font-medium">{profile.sector}</dd></div>}
                      {profile.industry && <div className="flex justify-between"><dt className="text-sm text-muted-foreground">Industry</dt><dd className="text-sm font-medium">{profile.industry}</dd></div>}
                      {profile.country && <div className="flex justify-between"><dt className="text-sm text-muted-foreground">Country</dt><dd className="text-sm font-medium">{profile.country}</dd></div>}
                      {profile.state && <div className="flex justify-between"><dt className="text-sm text-muted-foreground">State</dt><dd className="text-sm font-medium">{profile.state}</dd></div>}
                      {profile.city && <div className="flex justify-between"><dt className="text-sm text-muted-foreground">City</dt><dd className="text-sm font-medium">{profile.city}</dd></div>}
                      {profile.fullTimeEmployees > 0 && <div className="flex justify-between"><dt className="text-sm text-muted-foreground">Employees</dt><dd className="text-sm font-medium">{profile.fullTimeEmployees.toLocaleString()}</dd></div>}
                      {profile.phone && <div className="flex justify-between"><dt className="text-sm text-muted-foreground">Phone</dt><dd className="text-sm font-medium">{profile.phone}</dd></div>}
                      {profile.website && (
                        <div className="flex justify-between">
                          <dt className="text-sm text-muted-foreground">Website</dt>
                          <dd><a href={profile.website} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline flex items-center gap-1">{new URL(profile.website).hostname} <ExternalLink className="w-3 h-3" /></a></dd>
                        </div>
                      )}
                    </dl>
                  </div>
                  {profile.companyOfficers && profile.companyOfficers.length > 0 && (
                    <div className="border border-border rounded-lg p-5">
                      <h4 className="font-semibold text-sm mb-3">Key Officers</h4>
                      <div className="space-y-2.5">
                        {profile.companyOfficers.slice(0, 6).map((officer, i) => (
                          <div key={i} className="flex justify-between items-start gap-2">
                            <span className="text-sm font-medium">{officer.name}</span>
                            <span className="text-xs text-muted-foreground text-right max-w-[50%]">{officer.title}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="py-8 text-center text-muted-foreground">
                <p>No profile data available for {upperSymbol}.</p>
              </div>
            )}
          </TabsContent>

          {/* Technical Insights Tab */}
          <TabsContent value="technicals" className="mt-4">
            {insightsLoading ? (
              <div className="flex items-center gap-2 py-8 justify-center">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span className="text-muted-foreground">Loading technical insights...</span>
              </div>
            ) : insightsError ? (
              <div className="flex flex-col items-center gap-2 py-8 text-destructive">
                <AlertCircle className="w-6 h-6" />
                <p className="text-sm font-medium">Unable to load insights data</p>
                <p className="text-xs text-muted-foreground">Yahoo Finance insights may not be available for {upperSymbol}.</p>
              </div>
            ) : insights ? (
              <div className="space-y-4">
                {/* Recommendation */}
                {insights.recommendation && (
                  <div className="border border-border rounded-lg p-5">
                    <h4 className="font-semibold text-sm mb-3">Analyst Recommendation</h4>
                    <div className="flex items-center gap-6">
                      <div className={`px-4 py-2 rounded-lg text-sm font-semibold ${
                        insights.recommendation.rating?.toLowerCase().includes("buy")
                          ? "bg-[oklch(0.55_0.17_155/0.1)] text-[oklch(0.45_0.17_155)]"
                          : insights.recommendation.rating?.toLowerCase().includes("sell")
                          ? "bg-[oklch(0.55_0.22_25/0.1)] text-[oklch(0.45_0.22_25)]"
                          : "bg-muted text-muted-foreground"
                      }`}>
                        {insights.recommendation.rating || "N/A"}
                      </div>
                      {insights.recommendation.targetPrice != null && (
                        <div>
                          <p className="text-xs text-muted-foreground">Target Price</p>
                          <p className="text-lg font-mono font-semibold">${insights.recommendation.targetPrice.toFixed(2)}</p>
                        </div>
                      )}
                      {insights.recommendation.provider && (
                        <div>
                          <p className="text-xs text-muted-foreground">Provider</p>
                          <p className="text-sm">{insights.recommendation.provider}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Technical Outlook */}
                {insights.technicalEvents && (
                  <div className="border border-border rounded-lg p-5">
                    <h4 className="font-semibold text-sm mb-3">Technical Outlook</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {[
                        { label: "Short Term", data: insights.technicalEvents.shortTermOutlook },
                        { label: "Intermediate Term", data: insights.technicalEvents.intermediateTermOutlook },
                        { label: "Long Term", data: insights.technicalEvents.longTermOutlook },
                      ].map((term) => (
                        <div key={term.label} className="border border-border rounded-lg p-4 text-center">
                          <p className="text-xs text-muted-foreground mb-2">{term.label}</p>
                          <div className="flex items-center justify-center gap-1.5 mb-1">
                            {term.data.direction === "up" ? (
                              <TrendingUp className="w-5 h-5 text-[oklch(0.55_0.17_155)]" />
                            ) : term.data.direction === "down" ? (
                              <TrendingDown className="w-5 h-5 text-[oklch(0.55_0.22_25)]" />
                            ) : (
                              <Minus className="w-5 h-5 text-muted-foreground" />
                            )}
                            <span className={`text-sm font-semibold capitalize ${
                              term.data.direction === "up" ? "text-[oklch(0.55_0.17_155)]" :
                              term.data.direction === "down" ? "text-[oklch(0.55_0.22_25)]" : ""
                            }`}>
                              {term.data.direction || "Neutral"}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground">{term.data.scoreDescription || `Score: ${term.data.score}`}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Key Technicals */}
                {insights.keyTechnicals && (
                  <div className="border border-border rounded-lg p-5">
                    <h4 className="font-semibold text-sm mb-3">Key Technical Levels</h4>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground">Support</p>
                        <p className="text-lg font-mono font-medium text-[oklch(0.55_0.17_155)]">
                          {insights.keyTechnicals.support != null ? `$${insights.keyTechnicals.support.toFixed(2)}` : "N/A"}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground">Resistance</p>
                        <p className="text-lg font-mono font-medium text-[oklch(0.55_0.22_25)]">
                          {insights.keyTechnicals.resistance != null ? `$${insights.keyTechnicals.resistance.toFixed(2)}` : "N/A"}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground">Stop Loss</p>
                        <p className="text-lg font-mono font-medium">
                          {insights.keyTechnicals.stopLoss != null ? `$${insights.keyTechnicals.stopLoss.toFixed(2)}` : "N/A"}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Valuation */}
                {insights.valuation && (
                  <div className="border border-border rounded-lg p-5">
                    <h4 className="font-semibold text-sm mb-3">Valuation</h4>
                    <div className="space-y-2">
                      {insights.valuation.description && <p className="text-sm text-muted-foreground">{insights.valuation.description}</p>}
                      <div className="flex gap-4 flex-wrap">
                        {insights.valuation.discount && (
                          <div className="text-sm"><span className="text-muted-foreground">Discount: </span><span className="font-medium">{insights.valuation.discount}</span></div>
                        )}
                        {insights.valuation.relativeValue && (
                          <div className="text-sm"><span className="text-muted-foreground">Relative Value: </span><span className="font-medium">{insights.valuation.relativeValue}</span></div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Significant Developments */}
                {insights.sigDevs && insights.sigDevs.length > 0 && (
                  <div className="border border-border rounded-lg p-5">
                    <h4 className="font-semibold text-sm mb-3">Significant Developments</h4>
                    <div className="space-y-2">
                      {insights.sigDevs.slice(0, 8).map((dev, i) => (
                        <div key={i} className="flex items-start justify-between gap-4 py-2 border-b border-border last:border-0">
                          <p className="text-sm">{dev.headline}</p>
                          <span className="text-xs text-muted-foreground shrink-0">{dev.date}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="py-8 text-center text-muted-foreground">
                <p>No technical insights available for {upperSymbol}.</p>
              </div>
            )}
          </TabsContent>

          {/* Holders Tab */}
          <TabsContent value="holders" className="mt-4">
            {holdersLoading ? (
              <div className="flex items-center gap-2 py-8 justify-center">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span className="text-muted-foreground">Loading insider holdings from Yahoo Finance...</span>
              </div>
            ) : holdersError ? (
              <div className="flex flex-col items-center gap-2 py-8 text-destructive">
                <AlertCircle className="w-6 h-6" />
                <p className="text-sm font-medium">Unable to load holders data</p>
                <p className="text-xs text-muted-foreground">Insider holdings data may not be available for {upperSymbol}.</p>
              </div>
            ) : holders && holders.length > 0 ? (
              <div className="border border-border rounded-lg p-5">
                <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Insider Holdings
                </h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-2 text-xs text-muted-foreground font-medium">Name</th>
                        <th className="text-left py-2 text-xs text-muted-foreground font-medium">Relation</th>
                        <th className="text-left py-2 text-xs text-muted-foreground font-medium">Transaction</th>
                        <th className="text-right py-2 text-xs text-muted-foreground font-medium">Shares Held</th>
                        <th className="text-right py-2 text-xs text-muted-foreground font-medium">Last Transaction</th>
                      </tr>
                    </thead>
                    <tbody>
                      {holders.map((h, i) => (
                        <tr key={i} className="border-b border-border last:border-0 hover:bg-accent/30 transition-colors">
                          <td className="py-2.5 font-medium">{h.name}</td>
                          <td className="py-2.5 text-muted-foreground">{h.relation}</td>
                          <td className="py-2.5 text-muted-foreground">{h.transactionDescription}</td>
                          <td className="py-2.5 text-right font-mono">{h.positionDirect != null ? h.positionDirect.toLocaleString() : "N/A"}</td>
                          <td className="py-2.5 text-right text-muted-foreground">{h.latestTransDate || "N/A"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="py-8 text-center text-muted-foreground">
                <p>No insider holdings data available for {upperSymbol}.</p>
              </div>
            )}
          </TabsContent>

          {/* SEC Filings Tab */}
          <TabsContent value="filings" className="mt-4">
            {insightsLoading ? (
              <div className="flex items-center gap-2 py-8 justify-center">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span className="text-muted-foreground">Loading SEC filings...</span>
              </div>
            ) : insights?.secReports && insights.secReports.length > 0 ? (
              <div className="border border-border rounded-lg p-5">
                <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  SEC Filings
                </h4>
                <div className="space-y-1">
                  {insights.secReports.map((filing, i) => (
                    <div key={i} className="flex items-center justify-between py-2.5 border-b border-border last:border-0 hover:bg-accent/30 transition-colors rounded px-2 -mx-2">
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-mono bg-muted px-2 py-0.5 rounded font-medium">{filing.type}</span>
                        <span className="text-sm">{filing.title}</span>
                      </div>
                      <span className="text-xs text-muted-foreground shrink-0 ml-4">{filing.filedDate}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="py-8 text-center text-muted-foreground">
                <p>No SEC filings data available for {upperSymbol}.</p>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Data Attribution */}
        <div className="text-center mt-8 pb-4">
          <p className="text-xs text-muted-foreground">
            All data sourced from Yahoo Finance in real-time. Prices may be delayed up to 15 minutes. Not financial advice.
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
}
