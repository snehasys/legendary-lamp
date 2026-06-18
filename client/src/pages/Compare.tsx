import { useState, useEffect } from "react";
import { Link } from "wouter";
import { ArrowUpRight, ArrowDownRight, Loader2, AlertCircle, Plus, X, GitCompare, Search } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { getMultipleQuotes, type StockQuote } from "@/lib/yahooFinance";

function formatVol(num: number | undefined | null): string {
  if (num == null || isNaN(num)) return "N/A";
  if (Math.abs(num) >= 1e9) return (num / 1e9).toFixed(2) + "B";
  if (Math.abs(num) >= 1e6) return (num / 1e6).toFixed(2) + "M";
  if (Math.abs(num) >= 1e3) return (num / 1e3).toFixed(1) + "K";
  return num.toString();
}

export default function Compare() {
  const [symbols, setSymbols] = useState<string[]>(["AAPL", "MSFT", "GOOGL"]);
  const [newSymbol, setNewSymbol] = useState("");
  const [quotes, setQuotes] = useState<StockQuote[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (symbols.length === 0) { setQuotes([]); setIsLoading(false); return; }
    setIsLoading(true);
    setError(false);
    getMultipleQuotes(symbols)
      .then((data) => {
        setQuotes(data.sort((a, b) => b.regularMarketPrice - a.regularMarketPrice));
        setIsLoading(false);
      })
      .catch(() => { setError(true); setIsLoading(false); });
  }, [symbols]);

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    const sym = newSymbol.trim().toUpperCase();
    if (sym && !symbols.includes(sym) && symbols.length < 10) {
      setSymbols([...symbols, sym]);
    }
    setNewSymbol("");
  }

  function removeSymbol(sym: string) {
    setSymbols(symbols.filter(s => s !== sym));
  }

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Header />

      <main className="flex-1 container py-8">
        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <GitCompare className="w-6 h-6 text-primary" />
            Compare Stocks
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Compare up to 10 stocks side by side with real-time Yahoo Finance data.
          </p>
        </div>

        {/* Add Symbol Form */}
        <form onSubmit={handleAdd} className="flex gap-2 mb-4 max-w-md">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={newSymbol}
              onChange={(e) => setNewSymbol(e.target.value)}
              placeholder="Add stock symbol..."
              className="w-full pl-10 pr-4 py-2.5 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 font-mono"
            />
          </div>
          <button
            type="submit"
            disabled={!newSymbol.trim() || symbols.length >= 10}
            className="flex items-center gap-1.5 bg-primary text-primary-foreground px-4 py-2.5 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            <Plus className="w-4 h-4" />
            Add
          </button>
        </form>

        {/* Symbol Tags */}
        <div className="flex flex-wrap gap-2 mb-6">
          {symbols.map(sym => (
            <span key={sym} className="inline-flex items-center gap-1 bg-muted px-3 py-1.5 rounded-lg text-sm font-mono">
              {sym}
              <button
                onClick={() => removeSymbol(sym)}
                className="ml-1 text-muted-foreground hover:text-destructive transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </span>
          ))}
          {symbols.length < 10 && (
            <span className="text-xs text-muted-foreground self-center">
              ({10 - symbols.length} more slots available)
            </span>
          )}
        </div>

        {/* Content */}
        {symbols.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 border border-dashed border-border rounded-xl">
            <GitCompare className="w-12 h-12 text-muted-foreground/30 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Add stocks to compare</h3>
            <p className="text-sm text-muted-foreground mb-4 text-center max-w-md">
              Enter stock symbols above to compare their real-time market data side by side.
            </p>
          </div>
        ) : isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary mb-3" />
            <p className="text-sm text-muted-foreground">Fetching real-time comparison data...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-20">
            <AlertCircle className="w-10 h-10 text-destructive mb-3" />
            <p className="text-sm font-medium text-destructive">Failed to load comparison data</p>
            <p className="text-xs text-muted-foreground mt-1">Yahoo Finance data may be temporarily unavailable.</p>
          </div>
        ) : quotes && quotes.length > 0 ? (
          <>
            {/* Comparison Table */}
            <div className="border border-border rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/30 border-b border-border">
                    <tr>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground sticky left-0 bg-muted/30 z-10">Metric</th>
                      {quotes.map(q => (
                        <th key={q.symbol} className="text-right py-3 px-4 text-xs font-semibold text-primary min-w-[130px]">
                          <Link href={`/company/${q.symbol}`} className="hover:underline">
                            {q.symbol}
                          </Link>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-border">
                      <td className="py-3 px-4 text-xs font-medium text-muted-foreground sticky left-0 bg-background z-10">Name</td>
                      {quotes.map(q => (
                        <td key={q.symbol} className="py-3 px-4 text-right text-xs">{q.shortName || "N/A"}</td>
                      ))}
                    </tr>
                    <tr className="border-b border-border bg-muted/10">
                      <td className="py-3 px-4 text-xs font-medium text-muted-foreground sticky left-0 bg-muted/10 z-10">Price</td>
                      {quotes.map(q => (
                        <td key={q.symbol} className="py-3 px-4 text-right font-mono font-medium">${q.regularMarketPrice.toFixed(2)}</td>
                      ))}
                    </tr>
                    <tr className="border-b border-border">
                      <td className="py-3 px-4 text-xs font-medium text-muted-foreground sticky left-0 bg-background z-10">Change</td>
                      {quotes.map(q => (
                        <td key={q.symbol} className={`py-3 px-4 text-right font-mono text-xs ${q.change >= 0 ? "text-[oklch(0.55_0.17_155)]" : "text-[oklch(0.55_0.22_25)]"}`}>
                          <span className="inline-flex items-center gap-0.5 justify-end">
                            {q.change >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                            {q.change >= 0 ? "+" : ""}{q.change.toFixed(2)}
                          </span>
                        </td>
                      ))}
                    </tr>
                    <tr className="border-b border-border bg-muted/10">
                      <td className="py-3 px-4 text-xs font-medium text-muted-foreground sticky left-0 bg-muted/10 z-10">% Change</td>
                      {quotes.map(q => (
                        <td key={q.symbol} className={`py-3 px-4 text-right font-mono text-xs font-medium ${q.changePercent >= 0 ? "text-[oklch(0.55_0.17_155)]" : "text-[oklch(0.55_0.22_25)]"}`}>
                          {q.changePercent >= 0 ? "+" : ""}{q.changePercent.toFixed(2)}%
                        </td>
                      ))}
                    </tr>
                    <tr className="border-b border-border">
                      <td className="py-3 px-4 text-xs font-medium text-muted-foreground sticky left-0 bg-background z-10">Volume</td>
                      {quotes.map(q => (
                        <td key={q.symbol} className="py-3 px-4 text-right font-mono text-xs">{formatVol(q.regularMarketVolume)}</td>
                      ))}
                    </tr>
                    <tr className="border-b border-border bg-muted/10">
                      <td className="py-3 px-4 text-xs font-medium text-muted-foreground sticky left-0 bg-muted/10 z-10">Day High</td>
                      {quotes.map(q => (
                        <td key={q.symbol} className="py-3 px-4 text-right font-mono text-xs">
                          {q.regularMarketDayHigh != null ? `$${q.regularMarketDayHigh.toFixed(2)}` : "N/A"}
                        </td>
                      ))}
                    </tr>
                    <tr className="border-b border-border">
                      <td className="py-3 px-4 text-xs font-medium text-muted-foreground sticky left-0 bg-background z-10">Day Low</td>
                      {quotes.map(q => (
                        <td key={q.symbol} className="py-3 px-4 text-right font-mono text-xs">
                          {q.regularMarketDayLow != null ? `$${q.regularMarketDayLow.toFixed(2)}` : "N/A"}
                        </td>
                      ))}
                    </tr>
                    <tr className="border-b border-border bg-muted/10">
                      <td className="py-3 px-4 text-xs font-medium text-muted-foreground sticky left-0 bg-muted/10 z-10">52W High</td>
                      {quotes.map(q => (
                        <td key={q.symbol} className="py-3 px-4 text-right font-mono text-xs">
                          {q.fiftyTwoWeekHigh != null ? `$${q.fiftyTwoWeekHigh.toFixed(2)}` : "N/A"}
                        </td>
                      ))}
                    </tr>
                    <tr className="border-b border-border">
                      <td className="py-3 px-4 text-xs font-medium text-muted-foreground sticky left-0 bg-background z-10">52W Low</td>
                      {quotes.map(q => (
                        <td key={q.symbol} className="py-3 px-4 text-right font-mono text-xs">
                          {q.fiftyTwoWeekLow != null ? `$${q.fiftyTwoWeekLow.toFixed(2)}` : "N/A"}
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="py-3 px-4 text-xs font-medium text-muted-foreground sticky left-0 bg-background z-10">Prev Close</td>
                      {quotes.map(q => (
                        <td key={q.symbol} className="py-3 px-4 text-right font-mono text-xs">
                          {q.previousClose != null ? `$${q.previousClose.toFixed(2)}` : "N/A"}
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Performance Comparison */}
            <div className="mt-6 border border-border rounded-xl p-5">
              <h3 className="font-semibold text-sm mb-4">Today's Performance</h3>
              <div className="space-y-3">
                {[...quotes].sort((a, b) => b.changePercent - a.changePercent).map(q => {
                  const maxAbsChange = Math.max(...quotes.map(x => Math.abs(x.changePercent)), 0.01);
                  const barWidth = Math.min(Math.abs(q.changePercent) / maxAbsChange * 100, 100);
                  const isPositive = q.changePercent >= 0;
                  return (
                    <div key={q.symbol} className="flex items-center gap-3">
                      <Link href={`/company/${q.symbol}`} className="w-16 text-sm font-mono font-medium text-primary hover:underline">
                        {q.symbol}
                      </Link>
                      <div className="flex-1 h-6 bg-muted/30 rounded overflow-hidden relative">
                        <div
                          className={`h-full rounded transition-all ${isPositive ? "bg-[oklch(0.55_0.17_155)]/20" : "bg-[oklch(0.55_0.22_25)]/20"}`}
                          style={{ width: `${barWidth}%` }}
                        />
                      </div>
                      <span className={`w-20 text-right font-mono text-xs font-medium ${isPositive ? "text-[oklch(0.55_0.17_155)]" : "text-[oklch(0.55_0.22_25)]"}`}>
                        {isPositive ? "+" : ""}{q.changePercent.toFixed(2)}%
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-20">
            <AlertCircle className="w-8 h-8 text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground">No data returned. Check that the symbols are valid.</p>
          </div>
        )}

        {/* Attribution */}
        <div className="text-center mt-8">
          <p className="text-xs text-muted-foreground">
            All data sourced from Yahoo Finance in real-time. Prices may be delayed up to 15 minutes.
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
}
