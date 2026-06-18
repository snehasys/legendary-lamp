import { useState } from "react";
import { Link } from "wouter";
import { Plus, Filter, BarChart3, TrendingUp, DollarSign, Activity, Zap, Target, BarChart2 } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const prebuiltScreens = [
  {
    category: "Growth",
    icon: TrendingUp,
    color: "text-[oklch(0.55_0.17_155)]",
    screens: [
      { id: "top-market-cap", name: "Top 10 by Market Cap", desc: "The largest companies by market capitalization on NYSE & NASDAQ." },
      { id: "top-gainers", name: "Top Gainers Today", desc: "Stocks with the highest percentage gains in today's session." },
      { id: "top-losers", name: "Top Losers Today", desc: "Stocks with the biggest percentage drops in today's session." },
    ],
  },
  {
    category: "Volume & Momentum",
    icon: Activity,
    color: "text-[oklch(0.55_0.20_260)]",
    screens: [
      { id: "high-volume", name: "High Volume", desc: "Most actively traded stocks by volume today." },
      { id: "near-52w-high", name: "Near 52-Week High", desc: "Stocks trading close to their 52-week high price." },
      { id: "near-52w-low", name: "Near 52-Week Low", desc: "Stocks trading close to their 52-week low price." },
    ],
  },
  {
    category: "Technology",
    icon: Zap,
    color: "text-[oklch(0.55_0.22_280)]",
    screens: [
      { id: "tech-mega-cap", name: "Tech Mega Caps", desc: "The largest technology companies (FAANG+)." },
      { id: "semiconductor", name: "Semiconductors", desc: "Major semiconductor and chip companies." },
      { id: "cloud-saas", name: "Cloud & SaaS", desc: "Leading cloud computing and SaaS companies." },
    ],
  },
  {
    category: "Value & Income",
    icon: DollarSign,
    color: "text-[oklch(0.55_0.17_80)]",
    screens: [
      { id: "blue-chip", name: "Blue Chip Stocks", desc: "Established, financially stable large-cap companies." },
      { id: "financial-sector", name: "Financial Sector", desc: "Major banks, insurance, and financial services companies." },
      { id: "healthcare", name: "Healthcare & Pharma", desc: "Leading healthcare, pharmaceutical, and biotech companies." },
    ],
  },
  {
    category: "Speculative & Growth",
    icon: Target,
    color: "text-[oklch(0.55_0.22_25)]",
    screens: [
      { id: "ev-companies", name: "EV & Clean Energy", desc: "Electric vehicle and clean energy companies." },
      { id: "fintech", name: "Fintech & Digital", desc: "Financial technology and digital payment companies." },
      { id: "social-media", name: "Social & Media", desc: "Social media, streaming, and digital media companies." },
    ],
  },
];

const sectors = [
  "Technology", "Healthcare", "Financial Services", "Consumer Cyclical",
  "Communication Services", "Industrials", "Consumer Defensive",
  "Energy", "Utilities", "Real Estate", "Basic Materials",
];

export default function Screens() {
  const [screenQuery, setScreenQuery] = useState("");

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Header />
      <main className="flex-1 container py-8">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <BarChart3 className="w-6 h-6 text-primary" />
              Stock Screens
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Pre-built screens powered by real-time Yahoo Finance data.
            </p>
          </div>
          <Link href="/query" className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2.5 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity">
            <Filter className="w-4 h-4" />
            Custom Query Builder
          </Link>
        </div>

        {/* Custom Screen Query Builder */}
        <div className="border border-border rounded-xl p-5 mb-8 bg-muted/20">
          <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-primary" />
            Quick Screen Query
          </h3>
          <p className="text-xs text-muted-foreground mb-3">
            Enter a stock symbol to look up, or use the <Link href="/query" className="text-primary hover:underline">Query Builder</Link> for advanced screening.
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              value={screenQuery}
              onChange={(e) => setScreenQuery(e.target.value)}
              placeholder="Enter stock symbol (e.g., AAPL, MSFT, TSLA)..."
              className="flex-1 px-4 py-2.5 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 font-mono"
            />
            <Link
              href={screenQuery.trim() ? `/company/${screenQuery.trim().toUpperCase()}` : "/query"}
              className="bg-primary text-primary-foreground px-5 py-2.5 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity shrink-0 flex items-center"
            >
              Go
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_260px] gap-8">
          {/* Main Content */}
          <div className="space-y-10">
            {prebuiltScreens.map((category) => (
              <section key={category.category}>
                <div className="flex items-center gap-2 mb-3">
                  <category.icon className={`w-5 h-5 ${category.color}`} />
                  <h2 className="text-lg font-semibold">{category.category}</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {category.screens.map((screen) => (
                    <Link
                      key={screen.id}
                      href={`/screen/${screen.id}`}
                      className="group border border-border rounded-xl p-5 hover:border-primary/30 hover:shadow-md transition-all"
                    >
                      <h3 className="font-semibold text-sm group-hover:text-primary transition-colors">
                        {screen.name} ›
                      </h3>
                      <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                        {screen.desc}
                      </p>
                    </Link>
                  ))}
                </div>
              </section>
            ))}
          </div>

          {/* Sidebar - Browse Sectors */}
          <aside className="hidden lg:block">
            <div className="sticky top-20 border border-border rounded-xl p-5">
              <h3 className="font-semibold text-sm mb-4">Browse by Sector</h3>
              <ul className="space-y-0.5">
                {sectors.map((sector) => (
                  <li key={sector}>
                    <Link
                      href={`/sector/${encodeURIComponent(sector)}`}
                      className="block text-sm text-muted-foreground hover:text-primary hover:bg-primary/5 px-2 py-1.5 rounded transition-colors"
                    >
                      {sector}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        </div>

        {/* Info Banner */}
        <div className="mt-10 border border-border rounded-xl p-6 bg-muted/20">
          <h3 className="font-semibold text-sm mb-2">About Stock Screens</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            All screens fetch real-time data from Yahoo Finance. Results are based on current market prices and may be delayed up to 15 minutes.
            No fabricated or artificial data is ever displayed.
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
}
