import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Search, TrendingUp, ArrowUpRight, ArrowDownRight, BarChart3, Activity } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { stocks, searchStocks, Stock, formatMarketCap, sectors } from "@/lib/stockData";

const marketIndices = [
  { name: "S&P 500", value: "5,432.78", change: "+0.82%", positive: true },
  { name: "NASDAQ", value: "17,891.45", change: "+1.14%", positive: true },
  { name: "DOW 30", value: "39,156.23", change: "-0.12%", positive: false },
  { name: "Russell 2000", value: "2,087.34", change: "+0.45%", positive: true },
];

export default function Home() {
  const [, navigate] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Stock[]>([]);

  function handleSearch(q: string) {
    setSearchQuery(q);
    if (q.length >= 1) {
      setSearchResults(searchStocks(q).slice(0, 6));
    } else {
      setSearchResults([]);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (searchResults.length > 0) {
      navigate(`/company/${searchResults[0].symbol}`);
      setSearchQuery("");
      setSearchResults([]);
    }
  }

  const trendingStocks = stocks.slice(0, 11);
  const topGainers = [...stocks].sort((a, b) => b.changePercent - a.changePercent).slice(0, 5);
  const topLosers = [...stocks].sort((a, b) => a.changePercent - b.changePercent).slice(0, 5);
  const largestByMarketCap = [...stocks].sort((a, b) => b.marketCap - a.marketCap).slice(0, 5);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      {/* Hero Section */}
      <main className="flex-1">
        <section className="relative overflow-hidden border-b border-border">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.02] via-transparent to-primary/[0.03] pointer-events-none" />
          <div className="container py-16 md:py-24 relative">
            <div className="max-w-2xl mx-auto text-center">
              <div className="flex items-baseline justify-center gap-1 mb-3">
                <span className="font-display font-bold text-4xl md:text-5xl tracking-tight">screener</span>
                <span className="text-primary font-display font-bold text-4xl md:text-5xl">.us</span>
              </div>
              <p className="text-muted-foreground text-base md:text-lg mb-8">
                Stock analysis and screening tool for NYSE & NASDAQ investors.
              </p>

              {/* Search Bar */}
              <form onSubmit={handleSubmit} className="relative max-w-xl mx-auto">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="search"
                  placeholder="Search for a company..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="w-full pl-12 pr-6 py-4 text-base bg-background border-2 border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 shadow-sm transition-all"
                />
                {searchResults.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-popover border border-border rounded-xl shadow-xl z-50 overflow-hidden">
                    {searchResults.map((stock) => (
                      <Link
                        key={stock.symbol}
                        href={`/company/${stock.symbol}`}
                        className="flex items-center justify-between px-5 py-3 hover:bg-accent transition-colors"
                        onClick={() => { setSearchQuery(""); setSearchResults([]); }}
                      >
                        <div>
                          <span className="font-medium">{stock.name}</span>
                          <span className="text-sm text-muted-foreground ml-2">{stock.exchange}: {stock.symbol}</span>
                        </div>
                        <span className={`font-mono text-sm ${stock.change >= 0 ? "gain" : "loss"}`}>
                          ${stock.price.toFixed(2)}
                        </span>
                      </Link>
                    ))}
                  </div>
                )}
              </form>

              {/* Quick Links */}
              <div className="mt-6 flex flex-wrap justify-center gap-x-3 gap-y-1">
                <span className="text-sm text-muted-foreground">Or analyse:</span>
                {trendingStocks.map((stock) => (
                  <Link
                    key={stock.symbol}
                    href={`/company/${stock.symbol}`}
                    className="text-sm text-primary/80 hover:text-primary hover:underline transition-colors"
                  >
                    {stock.symbol}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Market Indices Bar */}
        <section className="border-b border-border bg-muted/20">
          <div className="container py-3">
            <div className="flex items-center gap-6 overflow-x-auto">
              {marketIndices.map((idx) => (
                <div key={idx.name} className="flex items-center gap-2 shrink-0">
                  <span className="text-xs font-medium text-muted-foreground">{idx.name}</span>
                  <span className="text-sm font-mono font-medium">{idx.value}</span>
                  <span className={`text-xs font-mono ${idx.positive ? "gain" : "loss"}`}>{idx.change}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Market Overview */}
        <section className="container py-10">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Top Gainers */}
            <div className="border border-border rounded-xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-4 h-4 text-[oklch(0.72_0.19_155)]" />
                <h3 className="font-display font-semibold text-sm">Top Gainers</h3>
              </div>
              <div className="space-y-3">
                {topGainers.map((stock) => (
                  <Link
                    key={stock.symbol}
                    href={`/company/${stock.symbol}`}
                    className="flex items-center justify-between hover:bg-accent/50 -mx-2 px-2 py-1.5 rounded transition-colors"
                  >
                    <div>
                      <span className="text-sm font-medium">{stock.symbol}</span>
                      <span className="text-xs text-muted-foreground ml-1.5 hidden sm:inline">{stock.name.split(" ")[0]}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-mono">${stock.price.toFixed(2)}</span>
                      <span className="gain text-xs font-mono ml-2 flex items-center gap-0.5 inline-flex">
                        <ArrowUpRight className="w-3 h-3" />
                        {stock.changePercent.toFixed(2)}%
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* Top Losers */}
            <div className="border border-border rounded-xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <Activity className="w-4 h-4 text-[oklch(0.63_0.24_25)]" />
                <h3 className="font-display font-semibold text-sm">Top Losers</h3>
              </div>
              <div className="space-y-3">
                {topLosers.map((stock) => (
                  <Link
                    key={stock.symbol}
                    href={`/company/${stock.symbol}`}
                    className="flex items-center justify-between hover:bg-accent/50 -mx-2 px-2 py-1.5 rounded transition-colors"
                  >
                    <div>
                      <span className="text-sm font-medium">{stock.symbol}</span>
                      <span className="text-xs text-muted-foreground ml-1.5 hidden sm:inline">{stock.name.split(" ")[0]}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-mono">${stock.price.toFixed(2)}</span>
                      <span className="loss text-xs font-mono ml-2 flex items-center gap-0.5 inline-flex">
                        <ArrowDownRight className="w-3 h-3" />
                        {Math.abs(stock.changePercent).toFixed(2)}%
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* Largest by Market Cap */}
            <div className="border border-border rounded-xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <BarChart3 className="w-4 h-4 text-primary" />
                <h3 className="font-display font-semibold text-sm">Largest by Market Cap</h3>
              </div>
              <div className="space-y-3">
                {largestByMarketCap.map((stock) => (
                  <Link
                    key={stock.symbol}
                    href={`/company/${stock.symbol}`}
                    className="flex items-center justify-between hover:bg-accent/50 -mx-2 px-2 py-1.5 rounded transition-colors"
                  >
                    <div>
                      <span className="text-sm font-medium">{stock.symbol}</span>
                      <span className="text-xs text-muted-foreground ml-1.5 hidden sm:inline">{stock.name.split(" ")[0]}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-mono text-muted-foreground">{formatMarketCap(stock.marketCap)}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* Popular Screens */}
          <div className="mt-10">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-display font-semibold text-lg">Popular Screens</h3>
              <Link href="/screens" className="text-sm text-primary hover:underline">View all screens →</Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { name: "High Growth Stocks", desc: "Companies with revenue growth above 20% and profit growth above 30%.", id: "high-growth" },
                { name: "Dividend Aristocrats", desc: "Companies with 25+ consecutive years of dividend increases.", id: "dividend-kings" },
                { name: "Magic Formula", desc: "Based on Joel Greenblatt's formula combining earnings yield and ROIC.", id: "magic-formula" },
                { name: "Momentum Leaders", desc: "Stocks within 10% of 52-week high with above-average volume.", id: "momentum" },
                { name: "Low P/E Ratio", desc: "Profitable companies trading below the market average P/E.", id: "low-pe" },
                { name: "Piotroski F-Score 9", desc: "Companies with perfect financial health score across 9 criteria.", id: "piotroski" },
              ].map((screen) => (
                <Link
                  key={screen.id}
                  href={`/screen/${screen.id}`}
                  className="group border border-border rounded-lg p-4 hover:border-primary/30 hover:shadow-sm transition-all"
                >
                  <h4 className="font-display font-medium text-sm group-hover:text-primary transition-colors">{screen.name} ›</h4>
                  <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2 leading-relaxed">{screen.desc}</p>
                </Link>
              ))}
            </div>
          </div>

          {/* Browse Sectors */}
          <div className="mt-10">
            <h3 className="font-display font-semibold text-lg mb-5">Browse Sectors</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {sectors.map((sector) => (
                <Link
                  key={sector}
                  href={`/sector/${encodeURIComponent(sector)}`}
                  className="border border-border rounded-lg px-3 py-3 text-center hover:border-primary/30 hover:bg-primary/[0.02] transition-all group"
                >
                  <span className="text-xs font-medium text-muted-foreground group-hover:text-primary transition-colors">{sector}</span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
