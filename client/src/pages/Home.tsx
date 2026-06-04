import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Search, TrendingUp, TrendingDown, BarChart3, ArrowUpRight, ArrowDownRight, Loader2, AlertCircle } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { trpc } from "@/lib/trpc";

export default function Home() {
  const [, navigate] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");

  // Live market data from Yahoo Finance
  const { data: indices, isLoading: indicesLoading, error: indicesError } = trpc.stocks.marketIndices.useQuery(undefined, {
    staleTime: 60_000,
    refetchInterval: 120_000,
  });

  const { data: movers, isLoading: moversLoading, error: moversError } = trpc.stocks.topMovers.useQuery(
    { count: 5 },
    { staleTime: 60_000, refetchInterval: 120_000 }
  );

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    const q = searchQuery.trim().toUpperCase();
    if (q.length > 0) {
      navigate(`/company/${q}`);
      setSearchQuery("");
    }
  }

  const indexNames: Record<string, string> = {
    "^GSPC": "S&P 500",
    "^IXIC": "NASDAQ",
    "^DJI": "DOW 30",
    "^RUT": "Russell 2000",
  };

  const popularSymbols = ["AAPL", "MSFT", "GOOGL", "AMZN", "NVDA", "META", "TSLA", "JPM", "V", "JNJ", "NFLX"];

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Header />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden border-b border-border">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.02] via-transparent to-primary/[0.03] pointer-events-none" />
          <div className="container py-16 md:py-24 relative">
            <div className="max-w-2xl mx-auto text-center">
              <div className="flex items-baseline justify-center gap-0.5 mb-3">
                <span className="font-bold text-4xl md:text-5xl tracking-tight">screener</span>
                <span className="text-primary font-bold text-4xl md:text-5xl">.us</span>
              </div>
              <p className="text-muted-foreground text-base md:text-lg mb-8">
                Real-time stock analysis and screening for NYSE &amp; NASDAQ investors.
              </p>

              {/* Search Bar */}
              <form onSubmit={handleSearchSubmit} className="relative max-w-xl mx-auto">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Enter stock symbol (e.g. AAPL, MSFT, GOOGL)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-6 py-4 text-base bg-background border-2 border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 shadow-sm transition-all"
                />
              </form>

              {/* Quick Links */}
              <div className="mt-6 flex flex-wrap justify-center gap-x-3 gap-y-1">
                <span className="text-sm text-muted-foreground">Popular:</span>
                {popularSymbols.map((sym) => (
                  <Link
                    key={sym}
                    href={`/company/${sym}`}
                    className="text-sm text-primary/80 hover:text-primary hover:underline transition-colors"
                  >
                    {sym}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Market Indices Bar */}
        <section className="border-b border-border bg-muted/30">
          <div className="container py-3">
            {indicesLoading ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">Loading market data...</span>
              </div>
            ) : indicesError ? (
              <div className="flex items-center gap-2 text-destructive">
                <AlertCircle className="w-4 h-4" />
                <span className="text-sm">Unable to load market indices</span>
              </div>
            ) : (
              <div className="flex items-center gap-6 overflow-x-auto">
                {indices?.map((idx) => (
                  <div key={idx.symbol} className="flex items-center gap-2 shrink-0">
                    <span className="text-xs font-medium text-muted-foreground">
                      {indexNames[idx.symbol] || idx.shortName}
                    </span>
                    <span className="text-sm font-mono font-medium">
                      {idx.regularMarketPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                    <span className={`text-xs font-mono ${idx.changePercent >= 0 ? "text-gain" : "text-loss"}`}>
                      {idx.changePercent >= 0 ? "+" : ""}{idx.changePercent.toFixed(2)}%
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Market Overview */}
        <section className="container py-10">
          {moversLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              <span className="ml-3 text-muted-foreground">Loading market data from Yahoo Finance...</span>
            </div>
          ) : moversError ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <AlertCircle className="w-8 h-8 text-destructive mb-3" />
              <h3 className="font-semibold text-lg mb-1">Unable to load market data</h3>
              <p className="text-sm text-muted-foreground max-w-md">
                Real-time data from Yahoo Finance is temporarily unavailable. Please try again later.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Top Gainers */}
              <div className="border border-border rounded-xl p-5">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp className="w-4 h-4 text-gain" />
                  <h3 className="font-semibold text-sm">Top Gainers</h3>
                  <span className="text-xs text-muted-foreground ml-auto">Live data</span>
                </div>
                <div className="space-y-2">
                  {movers?.gainers.map((stock) => (
                    <Link
                      key={stock.symbol}
                      href={`/company/${stock.symbol}`}
                      className="flex items-center justify-between hover:bg-accent/50 -mx-2 px-2 py-2 rounded transition-colors"
                    >
                      <div>
                        <span className="text-sm font-medium">{stock.symbol}</span>
                        <span className="text-xs text-muted-foreground ml-2 hidden sm:inline">
                          {stock.shortName}
                        </span>
                      </div>
                      <div className="text-right flex items-center gap-3">
                        <span className="text-sm font-mono">${stock.regularMarketPrice.toFixed(2)}</span>
                        <span className="text-gain text-xs font-mono flex items-center gap-0.5">
                          <ArrowUpRight className="w-3 h-3" />
                          +{stock.changePercent.toFixed(2)}%
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>

              {/* Top Losers */}
              <div className="border border-border rounded-xl p-5">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingDown className="w-4 h-4 text-loss" />
                  <h3 className="font-semibold text-sm">Top Losers</h3>
                  <span className="text-xs text-muted-foreground ml-auto">Live data</span>
                </div>
                <div className="space-y-2">
                  {movers?.losers.map((stock) => (
                    <Link
                      key={stock.symbol}
                      href={`/company/${stock.symbol}`}
                      className="flex items-center justify-between hover:bg-accent/50 -mx-2 px-2 py-2 rounded transition-colors"
                    >
                      <div>
                        <span className="text-sm font-medium">{stock.symbol}</span>
                        <span className="text-xs text-muted-foreground ml-2 hidden sm:inline">
                          {stock.shortName}
                        </span>
                      </div>
                      <div className="text-right flex items-center gap-3">
                        <span className="text-sm font-mono">${stock.regularMarketPrice.toFixed(2)}</span>
                        <span className="text-loss text-xs font-mono flex items-center gap-0.5">
                          <ArrowDownRight className="w-3 h-3" />
                          {stock.changePercent.toFixed(2)}%
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Popular Screens */}
          <div className="mt-10">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-semibold text-lg">Popular Screens</h3>
              <Link href="/screens" className="text-sm text-primary hover:underline">View all screens →</Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { name: "Top 10 by Market Cap", desc: "The largest companies by market capitalization on NYSE & NASDAQ.", id: "large-cap" },
                { name: "Top Gainers Today", desc: "Stocks with the highest percentage gains in today's session.", id: "top-gainers" },
                { name: "Top Losers Today", desc: "Stocks with the biggest percentage drops in today's session.", id: "top-losers" },
                { name: "High Volume", desc: "Most actively traded stocks by volume today.", id: "high-volume" },
                { name: "Near 52-Week High", desc: "Stocks trading close to their 52-week high price.", id: "52w-high" },
                { name: "Near 52-Week Low", desc: "Stocks trading close to their 52-week low price.", id: "52w-low" },
              ].map((screen) => (
                <Link
                  key={screen.id}
                  href={`/screen/${screen.id}`}
                  className="group border border-border rounded-lg p-4 hover:border-primary/30 hover:shadow-sm transition-all"
                >
                  <h4 className="font-medium text-sm group-hover:text-primary transition-colors">{screen.name} ›</h4>
                  <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2 leading-relaxed">{screen.desc}</p>
                </Link>
              ))}
            </div>
          </div>

          {/* Data Source Attribution */}
          <div className="mt-10 text-center">
            <p className="text-xs text-muted-foreground">
              All market data provided by Yahoo Finance. Prices may be delayed. Data is for informational purposes only.
            </p>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
