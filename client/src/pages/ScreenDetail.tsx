import { useState, useEffect, useMemo } from "react";
import { useParams, Link } from "wouter";
import { ArrowUpRight, ArrowDownRight, Loader2, AlertCircle, ArrowLeft } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { getMultipleQuotes, type StockQuote } from "@/lib/yahooFinance";

// Screen definitions with their stock symbols
const screenDefinitions: Record<string, { name: string; description: string; symbols: string[]; sortBy: "changePercent" | "volume" | "price"; sortOrder: "desc" | "asc" }> = {
  "large-cap": {
    name: "Top 10 by Market Cap",
    description: "The largest companies by market capitalization on NYSE & NASDAQ.",
    symbols: ["AAPL", "MSFT", "GOOGL", "AMZN", "NVDA", "META", "TSLA", "BRK-B", "JPM", "V"],
    sortBy: "price",
    sortOrder: "desc",
  },
  "top-gainers": {
    name: "Top Gainers Today",
    description: "Stocks with the highest percentage gains in today's session.",
    symbols: ["AAPL", "MSFT", "GOOGL", "AMZN", "NVDA", "META", "TSLA", "JPM", "V", "UNH", "HD", "PG", "MA", "DIS", "NFLX", "AMD", "CRM", "AVGO", "COST", "ADBE"],
    sortBy: "changePercent",
    sortOrder: "desc",
  },
  "top-losers": {
    name: "Top Losers Today",
    description: "Stocks with the biggest percentage drops in today's session.",
    symbols: ["AAPL", "MSFT", "GOOGL", "AMZN", "NVDA", "META", "TSLA", "JPM", "V", "UNH", "HD", "PG", "MA", "DIS", "NFLX", "AMD", "CRM", "AVGO", "COST", "ADBE"],
    sortBy: "changePercent",
    sortOrder: "asc",
  },
  "high-volume": {
    name: "High Volume",
    description: "Most actively traded stocks by volume today.",
    symbols: ["AAPL", "MSFT", "NVDA", "TSLA", "AMD", "AMZN", "META", "INTC", "BAC", "PLTR", "SOFI", "NIO", "RIVN", "COIN", "SNAP", "UBER", "SQ", "GOOGL", "HOOD", "LCID"],
    sortBy: "volume",
    sortOrder: "desc",
  },
  "52w-high": {
    name: "Near 52-Week High",
    description: "Stocks trading close to their 52-week high price.",
    symbols: ["AAPL", "MSFT", "GOOGL", "AMZN", "NVDA", "META", "AVGO", "COST", "CRM", "NOW", "PANW", "CRWD", "NFLX", "LIN", "ISRG", "VRTX", "SNPS", "KLAC", "CDNS", "BKNG"],
    sortBy: "price",
    sortOrder: "desc",
  },
  "52w-low": {
    name: "Near 52-Week Low",
    description: "Stocks trading close to their 52-week low price.",
    symbols: ["INTC", "VZ", "T", "PFE", "BMY", "MMM", "NIO", "LCID", "RIVN", "SNAP", "LYFT", "HOOD", "RBLX", "U", "ROKU", "SNOW", "PINS", "COIN", "SOFI", "DASH"],
    sortBy: "price",
    sortOrder: "asc",
  },
  "tech-mega-cap": {
    name: "Tech Mega Caps",
    description: "The largest technology companies (FAANG+).",
    symbols: ["AAPL", "MSFT", "GOOGL", "AMZN", "NVDA", "META", "TSLA", "AVGO", "ORCL", "CRM"],
    sortBy: "price",
    sortOrder: "desc",
  },
  "semiconductor": {
    name: "Semiconductors",
    description: "Major semiconductor and chip companies.",
    symbols: ["NVDA", "AVGO", "AMD", "INTC", "QCOM", "TXN", "ADI", "MU", "LRCX", "KLAC", "MRVL", "CDNS", "SNPS"],
    sortBy: "changePercent",
    sortOrder: "desc",
  },
  "cloud-saas": {
    name: "Cloud & SaaS",
    description: "Leading cloud computing and SaaS companies.",
    symbols: ["CRM", "NOW", "SNOW", "DDOG", "NET", "CRWD", "ZS", "TEAM", "WDAY", "PANW", "FTNT", "SHOP", "ADBE"],
    sortBy: "changePercent",
    sortOrder: "desc",
  },
  "blue-chip": {
    name: "Blue Chip Stocks",
    description: "Established, financially stable large-cap companies.",
    symbols: ["AAPL", "MSFT", "JPM", "JNJ", "V", "UNH", "PG", "HD", "MA", "KO", "PEP", "MRK", "ABT", "COST", "LIN"],
    sortBy: "price",
    sortOrder: "desc",
  },
  "financial-sector": {
    name: "Financial Sector",
    description: "Major banks, insurance, and financial services companies.",
    symbols: ["JPM", "BAC", "V", "MA", "GS", "MS", "AXP", "BLK", "SCHW", "C"],
    sortBy: "changePercent",
    sortOrder: "desc",
  },
  "healthcare": {
    name: "Healthcare & Pharma",
    description: "Leading healthcare, pharmaceutical, and biotech companies.",
    symbols: ["UNH", "JNJ", "PFE", "MRK", "ABT", "AMGN", "GILD", "ISRG", "SYK", "ZTS", "VRTX", "REGN", "MDT", "BMY"],
    sortBy: "changePercent",
    sortOrder: "desc",
  },
  "ev-companies": {
    name: "EV & Clean Energy",
    description: "Electric vehicle and clean energy companies.",
    symbols: ["TSLA", "RIVN", "LCID", "NIO", "F", "GM", "NEE", "ENPH", "FSLR", "PLUG"],
    sortBy: "changePercent",
    sortOrder: "desc",
  },
  "fintech": {
    name: "Fintech & Digital",
    description: "Financial technology and digital payment companies.",
    symbols: ["SQ", "PYPL", "COIN", "SOFI", "HOOD", "AFRM", "UPST", "NU", "MELI", "SHOP"],
    sortBy: "changePercent",
    sortOrder: "desc",
  },
  "social-media": {
    name: "Social & Media",
    description: "Social media, streaming, and digital media companies.",
    symbols: ["META", "NFLX", "DIS", "SNAP", "PINS", "RBLX", "ROKU", "TTD", "SPOT", "ABNB"],
    sortBy: "changePercent",
    sortOrder: "desc",
  },
};

function formatVol(num: number | undefined | null): string {
  if (num == null || isNaN(num)) return "N/A";
  if (Math.abs(num) >= 1e9) return (num / 1e9).toFixed(2) + "B";
  if (Math.abs(num) >= 1e6) return (num / 1e6).toFixed(2) + "M";
  if (Math.abs(num) >= 1e3) return (num / 1e3).toFixed(1) + "K";
  return num.toString();
}

export default function ScreenDetail() {
  const params = useParams<{ id: string }>();
  const screenId = params.id || "";
  const screen = screenDefinitions[screenId];

  const [rawQuotes, setRawQuotes] = useState<StockQuote[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!screen) return;
    setIsLoading(true);
    setError(false);
    getMultipleQuotes(screen.symbols)
      .then((data) => {
        // Sort the data
        const sorted = [...data].sort((a, b) => {
          let aVal = 0, bVal = 0;
          if (screen.sortBy === "changePercent") { aVal = a.changePercent; bVal = b.changePercent; }
          else if (screen.sortBy === "volume") { aVal = a.regularMarketVolume; bVal = b.regularMarketVolume; }
          else { aVal = a.regularMarketPrice; bVal = b.regularMarketPrice; }
          return screen.sortOrder === "desc" ? bVal - aVal : aVal - bVal;
        });
        setRawQuotes(sorted);
        setIsLoading(false);
      })
      .catch(() => { setError(true); setIsLoading(false); });
  }, [screenId]);

  // Filter results based on screen type
  const quotes = useMemo(() => {
    if (screenId === "top-gainers") {
      return rawQuotes.filter(q => q.changePercent > 0);
    }
    if (screenId === "top-losers") {
      return rawQuotes.filter(q => q.changePercent < 0);
    }
    return rawQuotes;
  }, [rawQuotes, screenId]);

  if (!screen) {
    return (
      <div className="min-h-screen flex flex-col bg-background text-foreground">
        <Header />
        <main className="flex-1 container py-20 text-center">
          <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Screen Not Found</h2>
          <p className="text-muted-foreground mb-6">The screen "{screenId}" does not exist.</p>
          <Link href="/screens" className="text-primary hover:underline">← Back to Screens</Link>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Header />

      <main className="flex-1 container py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <Link href="/" className="hover:text-foreground transition-colors">Home</Link>
          <span>/</span>
          <Link href="/screens" className="hover:text-foreground transition-colors">Screens</Link>
          <span>/</span>
          <span className="text-foreground font-medium">{screen.name}</span>
        </nav>

        {/* Header */}
        <div className="mb-6">
          <Link href="/screens" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-3">
            <ArrowLeft className="w-4 h-4" />
            Back to Screens
          </Link>
          <h1 className="text-2xl font-bold">{screen.name}</h1>
          <p className="text-sm text-muted-foreground mt-1">{screen.description}</p>
        </div>

        {/* Results Table */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary mb-3" />
            <p className="text-sm text-muted-foreground">Fetching real-time data from Yahoo Finance...</p>
            <p className="text-xs text-muted-foreground mt-1">Loading {screen.symbols.length} stocks</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-20">
            <AlertCircle className="w-10 h-10 text-destructive mb-3" />
            <p className="text-sm font-medium text-destructive">Failed to load screen data</p>
            <p className="text-xs text-muted-foreground mt-1">Yahoo Finance data may be temporarily unavailable. Please try again later.</p>
          </div>
        ) : quotes && quotes.length > 0 ? (
          <>
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">{quotes.length}</span> stocks loaded with real-time data
              </p>
            </div>
            <div className="border border-border rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/30 border-b border-border">
                    <tr>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground">#</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground">Symbol</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground">Name</th>
                      <th className="text-right py-3 px-4 text-xs font-semibold text-muted-foreground">Price</th>
                      <th className="text-right py-3 px-4 text-xs font-semibold text-muted-foreground">Change</th>
                      <th className="text-right py-3 px-4 text-xs font-semibold text-muted-foreground">% Change</th>
                      <th className="text-right py-3 px-4 text-xs font-semibold text-muted-foreground">Volume</th>
                      <th className="text-right py-3 px-4 text-xs font-semibold text-muted-foreground">Day High</th>
                      <th className="text-right py-3 px-4 text-xs font-semibold text-muted-foreground">Day Low</th>
                    </tr>
                  </thead>
                  <tbody>
                    {quotes.map((quote, i) => {
                      const isPositive = quote.change >= 0;
                      return (
                        <tr key={quote.symbol} className="border-b border-border last:border-0 hover:bg-accent/30 transition-colors">
                          <td className="py-3 px-4 text-xs text-muted-foreground">{i + 1}</td>
                          <td className="py-3 px-4">
                            <Link href={`/company/${quote.symbol}`} className="font-semibold text-primary hover:underline">
                              {quote.symbol}
                            </Link>
                          </td>
                          <td className="py-3 px-4 text-muted-foreground max-w-[200px] truncate">
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
                          <td className="py-3 px-4 text-right font-mono text-xs">
                            {quote.regularMarketDayHigh != null ? `$${quote.regularMarketDayHigh.toFixed(2)}` : "N/A"}
                          </td>
                          <td className="py-3 px-4 text-right font-mono text-xs">
                            {quote.regularMarketDayLow != null ? `$${quote.regularMarketDayLow.toFixed(2)}` : "N/A"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-20">
            <AlertCircle className="w-8 h-8 text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground">No data returned for this screen.</p>
          </div>
        )}

        {/* Attribution */}
        <div className="text-center mt-8">
          <p className="text-xs text-muted-foreground">
            Data sourced from Yahoo Finance in real-time. Prices may be delayed up to 15 minutes. Not financial advice.
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
}
