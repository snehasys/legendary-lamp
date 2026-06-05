import { useState, useEffect, useCallback } from "react";
import { Link, useParams } from "wouter";
import { ArrowUpRight, ArrowDownRight, RefreshCw, Loader2 } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { getScreenById, type ScreenResult } from "@/lib/screenEngine";

export default function ScreenDetail() {
  const params = useParams<{ id: string }>();
  const screen = getScreenById(params.id || "");

  const [results, setResults] = useState<ScreenResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const runScreen = useCallback(async () => {
    if (!screen) return;
    setLoading(true);
    setError(null);
    try {
      const data = await screen.run();
      setResults(data);
      setLastUpdated(new Date());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to run screen");
    } finally {
      setLoading(false);
    }
  }, [screen]);

  useEffect(() => {
    runScreen();
  }, [runScreen]);

  if (!screen) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 container py-16 text-center">
          <h1 className="font-display font-bold text-2xl mb-4">Screen Not Found</h1>
          <p className="text-muted-foreground">This screen does not exist.</p>
          <Link href="/screens" className="text-primary hover:underline mt-4 inline-block">← Back to Screens</Link>
        </main>
        <Footer />
      </div>
    );
  }

  // Get the metric columns from the first result
  const metricKeys = results.length > 0 ? Object.keys(results[0].metrics) : [];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 container py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <Link href="/screens" className="hover:text-primary transition-colors">Screens</Link>
          <span>/</span>
          <span className="text-foreground">{screen.name}</span>
        </div>

        {/* Screen Header */}
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-8">
          <div>
            <h1 className="font-display font-bold text-2xl mb-2 flex items-center gap-2">
              <span className="text-2xl">{screen.icon}</span>
              {screen.name}
            </h1>
            <p className="text-muted-foreground text-sm max-w-2xl">{screen.description}</p>
            <span className="inline-block mt-3 text-xs uppercase tracking-wider font-medium text-primary/70 bg-primary/5 px-2.5 py-1 rounded">
              {screen.category}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={runScreen}
              disabled={loading}
              className="flex items-center gap-1.5 border border-border px-3 py-2 rounded-lg text-sm hover:bg-accent transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* Status Bar */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <p className="text-sm text-muted-foreground">
              {loading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Scanning 50 stocks...
                </span>
              ) : (
                <>
                  <span className="font-medium text-foreground">{results.length}</span> stocks match this screen
                </>
              )}
            </p>
            {lastUpdated && !loading && (
              <p className="text-xs text-muted-foreground">
                Updated: {lastUpdated.toLocaleTimeString()}
              </p>
            )}
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="border border-destructive/30 bg-destructive/5 rounded-xl p-4 mb-6">
            <p className="text-sm text-destructive">{error}</p>
            <button onClick={runScreen} className="text-sm text-primary hover:underline mt-2">Try again</button>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="border border-border rounded-xl p-12 text-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
            <p className="text-sm text-muted-foreground">
              Fetching real-time data and calculating indicators for 50 stocks...
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              This may take 10-30 seconds on first load. Results are cached for 10 minutes.
            </p>
          </div>
        )}

        {/* Results Table */}
        {!loading && results.length > 0 && (
          <div className="border border-border rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr className="bg-muted/30">
                    <th className="w-12">S.No.</th>
                    <th>Name</th>
                    <th className="numeric">Price $</th>
                    <th className="numeric">Change %</th>
                    <th className="numeric">52W High</th>
                    <th className="numeric">52W Low</th>
                    {metricKeys.map((key) => (
                      <th key={key} className="numeric">{key}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {results.map((stock, i) => (
                    <tr key={stock.symbol}>
                      <td className="text-muted-foreground">{i + 1}.</td>
                      <td>
                        <Link href={`/company/${stock.symbol}`} className="hover:text-primary transition-colors">
                          <span className="font-medium">{stock.name}</span>
                          <span className="text-xs text-muted-foreground ml-1.5">{stock.symbol}</span>
                        </Link>
                      </td>
                      <td className="numeric font-mono">{stock.price.toFixed(2)}</td>
                      <td className="numeric">
                        <span className={`flex items-center justify-end gap-0.5 ${stock.changePercent >= 0 ? "gain" : "loss"}`}>
                          {stock.changePercent >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                          {Math.abs(stock.changePercent).toFixed(2)}%
                        </span>
                      </td>
                      <td className="numeric font-mono">{stock.high52w.toFixed(2)}</td>
                      <td className="numeric font-mono">{stock.low52w.toFixed(2)}</td>
                      {metricKeys.map((key) => (
                        <td key={key} className="numeric font-mono text-xs">
                          {stock.metrics[key] ?? "—"}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && results.length === 0 && (
          <div className="border border-border rounded-xl p-12 text-center">
            <p className="text-sm text-muted-foreground mb-2">
              No stocks currently match this screen's criteria.
            </p>
            <p className="text-xs text-muted-foreground">
              This is normal — technical screens are time-sensitive and may have zero matches on some days.
            </p>
          </div>
        )}

        {/* Screen Info */}
        <div className="border border-border rounded-xl mt-6 p-5 bg-muted/20">
          <h3 className="font-display font-semibold text-sm mb-2">About This Screen</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">{screen.description}</p>
          <div className="mt-3 flex flex-wrap gap-4 text-xs text-muted-foreground">
            <span>Universe: Top 50 US stocks by market cap</span>
            <span>Data: Yahoo Finance (real-time)</span>
            <span>Cache: 10 minutes</span>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
