import { useMemo } from "react";
import { Link, useParams } from "wouter";
import { ArrowUpRight, ArrowDownRight, Loader2, AlertCircle, Building2 } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { trpc } from "@/lib/trpc";

// Sector-to-symbols mapping (real tickers grouped by sector)
const SECTOR_STOCKS: Record<string, string[]> = {
  "Technology": ["AAPL", "MSFT", "GOOGL", "NVDA", "META", "ADBE", "CRM", "INTC", "CSCO", "AVGO", "TXN", "QCOM", "ORCL", "ACN", "AMD", "MU", "LRCX", "SNPS", "KLAC", "CDNS", "MRVL", "PANW", "FTNT", "CRWD", "ZS", "NET", "DDOG", "SNOW", "NOW", "WDAY"],
  "Consumer Cyclical": ["AMZN", "TSLA", "HD", "DIS", "NFLX", "SBUX", "LOW", "TJX", "BKNG", "ABNB", "DASH", "UBER", "LYFT", "RIVN", "NIO"],
  "Financial Services": ["JPM", "V", "MA", "BAC", "GS", "MS", "AXP", "PYPL", "SQ", "COIN", "SOFI", "HOOD", "BLK", "SCHW", "C"],
  "Healthcare": ["JNJ", "UNH", "PFE", "MRK", "ABT", "MDT", "AMGN", "GILD", "ISRG", "SYK", "ZTS", "VRTX", "REGN", "BMY", "LLY", "TMO", "DHR"],
  "Communication Services": ["GOOGL", "META", "DIS", "NFLX", "CMCSA", "VZ", "T", "ROKU", "PINS", "SNAP", "TTD", "RBLX"],
  "Consumer Defensive": ["PG", "KO", "PEP", "COST", "WMT", "MDLZ", "CL", "KHC", "GIS", "MO", "PM"],
  "Industrials": ["HON", "UPS", "GE", "CAT", "DE", "MMM", "LMT", "RTX", "BA", "UNP", "FDX"],
  "Energy": ["XOM", "CVX", "COP", "SLB", "EOG", "MPC", "PSX", "VLO", "OXY", "HAL"],
  "Real Estate": ["AMT", "PLD", "CCI", "EQIX", "SPG", "O", "DLR", "WELL", "PSA"],
  "Utilities": ["NEE", "DUK", "SO", "D", "AEP", "SRE", "EXC", "XEL"],
  "Basic Materials": ["LIN", "APD", "SHW", "ECL", "NEM", "FCX", "DOW", "DD"],
};

function formatVol(num: number | undefined | null): string {
  if (num == null || isNaN(num)) return "N/A";
  if (Math.abs(num) >= 1e9) return (num / 1e9).toFixed(2) + "B";
  if (Math.abs(num) >= 1e6) return (num / 1e6).toFixed(2) + "M";
  if (Math.abs(num) >= 1e3) return (num / 1e3).toFixed(1) + "K";
  return num.toString();
}

export default function Sector() {
  const params = useParams<{ name: string }>();
  const sectorName = decodeURIComponent(params.name || "");

  const symbols = useMemo(() => SECTOR_STOCKS[sectorName] || [], [sectorName]);

  const screenInput = useMemo(() => ({
    symbols,
    sortBy: "changePercent" as const,
    sortOrder: "desc" as const,
  }), [symbols]);

  const { data: quotes, isLoading, error } = trpc.stocks.screen.useQuery(
    screenInput,
    { enabled: symbols.length > 0, staleTime: 60_000, retry: 1 }
  );

  const allSectors = Object.keys(SECTOR_STOCKS);

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Header />

      <main className="flex-1 container py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <Link href="/screens" className="hover:text-primary transition-colors">Screens</Link>
          <span>/</span>
          <span className="text-foreground">{sectorName}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_260px] gap-8">
          {/* Main Content */}
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2 mb-2">
              <Building2 className="w-6 h-6 text-primary" />
              {sectorName || "Sector"}
            </h1>
            <p className="text-sm text-muted-foreground mb-6">
              {symbols.length} stocks in this sector • Real-time data from Yahoo Finance
            </p>

            {/* Content */}
            {symbols.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 border border-dashed border-border rounded-xl">
                <AlertCircle className="w-10 h-10 text-muted-foreground/30 mb-4" />
                <h3 className="text-lg font-semibold mb-2">Sector not found</h3>
                <p className="text-sm text-muted-foreground">
                  The sector "{sectorName}" is not in our database. Try one of the sectors in the sidebar.
                </p>
              </div>
            ) : isLoading ? (
              <div className="flex flex-col items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-primary mb-3" />
                <p className="text-sm text-muted-foreground">Loading real-time data for {sectorName} stocks...</p>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center py-20">
                <AlertCircle className="w-10 h-10 text-destructive mb-3" />
                <p className="text-sm font-medium text-destructive">Failed to load sector data</p>
                <p className="text-xs text-muted-foreground mt-1">Yahoo Finance API may be temporarily unavailable. Please try again.</p>
              </div>
            ) : quotes && quotes.length > 0 ? (
              <div className="border border-border rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/30 border-b border-border">
                      <tr>
                        <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground">S.No.</th>
                        <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground">Symbol</th>
                        <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground">Name</th>
                        <th className="text-right py-3 px-4 text-xs font-semibold text-muted-foreground">Price</th>
                        <th className="text-right py-3 px-4 text-xs font-semibold text-muted-foreground">Change</th>
                        <th className="text-right py-3 px-4 text-xs font-semibold text-muted-foreground">% Change</th>
                        <th className="text-right py-3 px-4 text-xs font-semibold text-muted-foreground">Volume</th>
                        <th className="text-right py-3 px-4 text-xs font-semibold text-muted-foreground">52W High</th>
                        <th className="text-right py-3 px-4 text-xs font-semibold text-muted-foreground">52W Low</th>
                      </tr>
                    </thead>
                    <tbody>
                      {quotes.map((q, idx) => (
                        <tr key={q.symbol} className={`border-b border-border hover:bg-accent/30 transition-colors ${idx % 2 === 0 ? "" : "bg-muted/10"}`}>
                          <td className="py-3 px-4 text-xs text-muted-foreground">{idx + 1}.</td>
                          <td className="py-3 px-4">
                            <Link href={`/company/${q.symbol}`} className="font-mono font-medium text-primary hover:underline">
                              {q.symbol}
                            </Link>
                          </td>
                          <td className="py-3 px-4 text-xs text-muted-foreground max-w-[200px] truncate">
                            {q.shortName}
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-medium">
                            ${q.regularMarketPrice.toFixed(2)}
                          </td>
                          <td className={`py-3 px-4 text-right font-mono text-xs ${q.change >= 0 ? "text-[oklch(0.55_0.17_155)]" : "text-[oklch(0.55_0.22_25)]"}`}>
                            <span className="inline-flex items-center gap-0.5 justify-end">
                              {q.change >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                              {q.change >= 0 ? "+" : ""}{q.change.toFixed(2)}
                            </span>
                          </td>
                          <td className={`py-3 px-4 text-right font-mono text-xs font-medium ${q.changePercent >= 0 ? "text-[oklch(0.55_0.17_155)]" : "text-[oklch(0.55_0.22_25)]"}`}>
                            {q.changePercent >= 0 ? "+" : ""}{q.changePercent.toFixed(2)}%
                          </td>
                          <td className="py-3 px-4 text-right font-mono text-xs">{formatVol(q.regularMarketVolume)}</td>
                          <td className="py-3 px-4 text-right font-mono text-xs">${q.fiftyTwoWeekHigh.toFixed(2)}</td>
                          <td className="py-3 px-4 text-right font-mono text-xs">${q.fiftyTwoWeekLow.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20">
                <AlertCircle className="w-8 h-8 text-muted-foreground mb-3" />
                <p className="text-sm text-muted-foreground">No data returned for this sector.</p>
              </div>
            )}
          </div>

          {/* Sidebar - All Sectors */}
          <aside className="hidden lg:block">
            <div className="sticky top-20 border border-border rounded-xl p-5">
              <h3 className="font-semibold text-sm mb-4">All Sectors</h3>
              <ul className="space-y-1">
                {allSectors.map((sector) => (
                  <li key={sector}>
                    <Link
                      href={`/sector/${encodeURIComponent(sector)}`}
                      className={`block text-sm px-2 py-1.5 rounded transition-colors ${
                        sector === sectorName
                          ? "text-primary bg-primary/5 font-medium"
                          : "text-muted-foreground hover:text-primary hover:bg-primary/5"
                      }`}
                    >
                      {sector}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        </div>

        {/* Attribution */}
        <div className="text-center mt-8">
          <p className="text-xs text-muted-foreground">
            All data sourced from Yahoo Finance in real-time. No fabricated or estimated data is displayed.
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
}
