import { useState, useEffect, useMemo } from "react";
import { Link } from "wouter";
import { ArrowUpRight, ArrowDownRight, Loader2, AlertCircle, Plus, X, Star, Search } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { trpc } from "@/lib/trpc";

const WATCHLIST_KEY = "screener_us_watchlist";

function getStoredWatchlist(): string[] {
  try {
    const stored = localStorage.getItem(WATCHLIST_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveWatchlist(symbols: string[]) {
  localStorage.setItem(WATCHLIST_KEY, JSON.stringify(symbols));
}

function formatVol(num: number | undefined | null): string {
  if (num == null || isNaN(num)) return "N/A";
  if (Math.abs(num) >= 1e9) return (num / 1e9).toFixed(2) + "B";
  if (Math.abs(num) >= 1e6) return (num / 1e6).toFixed(2) + "M";
  if (Math.abs(num) >= 1e3) return (num / 1e3).toFixed(1) + "K";
  return num.toString();
}

export default function Watchlist() {
  const [watchlist, setWatchlist] = useState<string[]>(getStoredWatchlist);
  const [newSymbol, setNewSymbol] = useState("");

  useEffect(() => {
    saveWatchlist(watchlist);
  }, [watchlist]);

  const queryInput = useMemo(() => ({
    symbols: watchlist,
    sortBy: "changePercent" as const,
    sortOrder: "desc" as const,
  }), [watchlist]);

  const { data: quotes, isLoading, error } = trpc.stocks.screen.useQuery(
    queryInput,
    { enabled: watchlist.length > 0, staleTime: 60_000, retry: 1 }
  );

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    const sym = newSymbol.trim().toUpperCase();
    if (sym && !watchlist.includes(sym)) {
      setWatchlist([...watchlist, sym]);
    }
    setNewSymbol("");
  }

  function removeSymbol(sym: string) {
    setWatchlist(watchlist.filter(s => s !== sym));
  }

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Header />

      <main className="flex-1 container py-8">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Star className="w-6 h-6 text-yellow-500" />
              My Watchlist
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Track your favorite stocks with real-time data. Stored locally in your browser.
            </p>
          </div>
        </div>

        {/* Add Symbol Form */}
        <form onSubmit={handleAdd} className="flex gap-2 mb-6 max-w-md">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={newSymbol}
              onChange={(e) => setNewSymbol(e.target.value)}
              placeholder="Add stock symbol (e.g., AAPL)"
              className="w-full pl-10 pr-4 py-2.5 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 font-mono"
            />
          </div>
          <button
            type="submit"
            disabled={!newSymbol.trim()}
            className="flex items-center gap-1.5 bg-primary text-primary-foreground px-4 py-2.5 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            <Plus className="w-4 h-4" />
            Add
          </button>
        </form>

        {/* Watchlist Tags */}
        {watchlist.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            {watchlist.map(sym => (
              <span key={sym} className="inline-flex items-center gap-1 bg-muted px-3 py-1.5 rounded-lg text-sm font-mono">
                <Link href={`/company/${sym}`} className="hover:text-primary transition-colors">
                  {sym}
                </Link>
                <button
                  onClick={() => removeSymbol(sym)}
                  className="ml-1 text-muted-foreground hover:text-destructive transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </span>
            ))}
          </div>
        )}

        {/* Content */}
        {watchlist.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 border border-dashed border-border rounded-xl">
            <Star className="w-12 h-12 text-muted-foreground/30 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Your watchlist is empty</h3>
            <p className="text-sm text-muted-foreground mb-4 text-center max-w-md">
              Add stock symbols above to track their real-time prices. Your watchlist is stored locally in your browser.
            </p>
            <div className="flex gap-2">
              {["AAPL", "MSFT", "GOOGL", "TSLA", "NVDA"].map(sym => (
                <button
                  key={sym}
                  onClick={() => setWatchlist(prev => [...prev, sym])}
                  className="text-xs bg-muted hover:bg-accent px-3 py-1.5 rounded-lg transition-colors font-mono"
                >
                  + {sym}
                </button>
              ))}
            </div>
          </div>
        ) : isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary mb-3" />
            <p className="text-sm text-muted-foreground">Fetching real-time data for {watchlist.length} stocks...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-20">
            <AlertCircle className="w-10 h-10 text-destructive mb-3" />
            <p className="text-sm font-medium text-destructive">Failed to load watchlist data</p>
            <p className="text-xs text-muted-foreground mt-1">Yahoo Finance data may be temporarily unavailable.</p>
          </div>
        ) : quotes && quotes.length > 0 ? (
          <>
            <div className="border border-border rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/30 border-b border-border">
                    <tr>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground">Symbol</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground">Name</th>
                      <th className="text-right py-3 px-4 text-xs font-semibold text-muted-foreground">Price</th>
                      <th className="text-right py-3 px-4 text-xs font-semibold text-muted-foreground">Change</th>
                      <th className="text-right py-3 px-4 text-xs font-semibold text-muted-foreground">% Change</th>
                      <th className="text-right py-3 px-4 text-xs font-semibold text-muted-foreground">Volume</th>
                      <th className="text-right py-3 px-4 text-xs font-semibold text-muted-foreground">Day Range</th>
                      <th className="text-center py-3 px-4 text-xs font-semibold text-muted-foreground">Remove</th>
                    </tr>
                  </thead>
                  <tbody>
                    {quotes.map((quote) => {
                      const isPositive = quote.change >= 0;
                      return (
                        <tr key={quote.symbol} className="border-b border-border last:border-0 hover:bg-accent/30 transition-colors">
                          <td className="py-3 px-4">
                            <Link href={`/company/${quote.symbol}`} className="font-semibold text-primary hover:underline">
                              {quote.symbol}
                            </Link>
                          </td>
                          <td className="py-3 px-4 text-muted-foreground max-w-[180px] truncate">
                            {quote.shortName || quote.symbol}
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-medium">
                            ${quote.regularMarketPrice.toFixed(2)}
                          </td>
                          <td className={`py-3 px-4 text-right font-mono text-xs ${isPositive ? "text-[oklch(0.55_0.17_155)]" : "text-[oklch(0.55_0.22_25)]"}`}>
                            <span className="inline-flex items-center gap-0.5">
                              {isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                              {isPositive ? "+" : ""}{quote.change.toFixed(2)}
                            </span>
                          </td>
                          <td className={`py-3 px-4 text-right font-mono text-xs font-medium ${isPositive ? "text-[oklch(0.55_0.17_155)]" : "text-[oklch(0.55_0.22_25)]"}`}>
                            {isPositive ? "+" : ""}{quote.changePercent.toFixed(2)}%
                          </td>
                          <td className="py-3 px-4 text-right font-mono text-xs text-muted-foreground">
                            {formatVol(quote.regularMarketVolume)}
                          </td>
                          <td className="py-3 px-4 text-right font-mono text-xs text-muted-foreground">
                            {quote.regularMarketDayLow != null && quote.regularMarketDayHigh != null
                              ? `$${quote.regularMarketDayLow.toFixed(2)} - $${quote.regularMarketDayHigh.toFixed(2)}`
                              : "N/A"}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <button
                              onClick={() => removeSymbol(quote.symbol)}
                              className="text-muted-foreground hover:text-destructive transition-colors"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Summary */}
            <div className="mt-6 grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="border border-border rounded-lg p-4">
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Total Stocks</p>
                <p className="font-bold text-xl mt-1">{quotes.length}</p>
              </div>
              <div className="border border-border rounded-lg p-4">
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Gainers / Losers</p>
                <p className="font-bold text-xl mt-1">
                  <span className="text-[oklch(0.55_0.17_155)]">{quotes.filter(q => q.change >= 0).length}</span>
                  {" / "}
                  <span className="text-[oklch(0.55_0.22_25)]">{quotes.filter(q => q.change < 0).length}</span>
                </p>
              </div>
              <div className="border border-border rounded-lg p-4">
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Avg Change</p>
                <p className={`font-bold text-xl mt-1 ${(quotes.reduce((a, q) => a + q.changePercent, 0) / quotes.length) >= 0 ? "text-[oklch(0.55_0.17_155)]" : "text-[oklch(0.55_0.22_25)]"}`}>
                  {((quotes.reduce((a, q) => a + q.changePercent, 0) / quotes.length)).toFixed(2)}%
                </p>
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-20">
            <AlertCircle className="w-8 h-8 text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground">No data returned for your watchlist symbols. Check that the symbols are valid.</p>
          </div>
        )}

        {/* Attribution */}
        <div className="text-center mt-8">
          <p className="text-xs text-muted-foreground">
            Data sourced from Yahoo Finance in real-time. Prices may be delayed up to 15 minutes.
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
}
