import { useState, useEffect, useMemo } from "react";
import { useParams, Link } from "wouter";
import { ArrowUpRight, ArrowDownRight, Loader2, AlertCircle, Plus, Check, Building2, ExternalLink, TrendingUp, TrendingDown, Minus } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { getStockChart, type ChartData } from "@/lib/yahooFinance";
import { isInWatchlist as checkWatchlist, addToWatchlist as addWL, removeFromWatchlist as removeWL } from "@/lib/watchlist";
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

export default function Company() {
  const params = useParams<{ symbol: string }>();
  const upperSymbol = (params.symbol || "").toUpperCase();
  const [chartRange, setChartRange] = useState("1y");
  const [chartInterval, setChartInterval] = useState("1d");

  const [chartData, setChartData] = useState<ChartData | null>(null);
  const [chartLoading, setChartLoading] = useState(true);
  const [chartError, setChartError] = useState(false);

  const [inWatchlist, setInWatchlist] = useState(false);

  useEffect(() => {
    setInWatchlist(checkWatchlist(upperSymbol));
  }, [upperSymbol]);

  useEffect(() => {
    if (!upperSymbol) return;
    setChartLoading(true);
    setChartError(false);
    getStockChart(upperSymbol, chartInterval, chartRange)
      .then((data) => { setChartData(data); setChartLoading(false); })
      .catch(() => { setChartError(true); setChartLoading(false); });
  }, [upperSymbol, chartInterval, chartRange]);

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
        open: chartData.open[i],
        high: chartData.high[i],
        low: chartData.low[i],
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
          <span className="text-foreground font-medium">{upperSymbol}</span>
        </nav>

        {/* Company Header */}
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold">{meta?.longName || meta?.shortName || upperSymbol}</h1>
            <div className="flex items-center gap-3 mt-1.5 text-sm text-muted-foreground flex-wrap">
              {meta?.exchangeName && <span>{meta.exchangeName}: {upperSymbol}</span>}
            </div>
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
