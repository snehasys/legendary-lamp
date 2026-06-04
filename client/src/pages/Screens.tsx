import { useState } from "react";
import { Link } from "wouter";
import { Plus, Filter, Search, Zap, BookOpen, TrendingUp, DollarSign, BarChart2 } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { prebuiltScreens, sectors } from "@/lib/stockData";

export default function Screens() {
  const [screenQuery, setScreenQuery] = useState("");

  const categories = [
    {
      title: "Popular Themes",
      icon: <Zap className="w-4 h-4 text-primary" />,
      description: "Popular investing themes for US market investors",
      screens: prebuiltScreens.filter(s => s.category === "Growth" || s.category === "Quality"),
    },
    {
      title: "Popular Formulas",
      icon: <BookOpen className="w-4 h-4 text-primary" />,
      description: "Screening formulas based on famous investing books and strategies",
      screens: prebuiltScreens.filter(s => s.category === "Formula"),
    },
    {
      title: "Price or Volume",
      icon: <TrendingUp className="w-4 h-4 text-primary" />,
      description: "Screens based on price or volume action and technical indicators",
      screens: prebuiltScreens.filter(s => s.category === "Technical"),
    },
    {
      title: "Valuation Screens",
      icon: <DollarSign className="w-4 h-4 text-primary" />,
      description: "Screens based on stock valuations and dividend metrics",
      screens: prebuiltScreens.filter(s => s.category === "Value" || s.category === "Dividends"),
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 container py-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <h1 className="font-display font-bold text-2xl">Stock Screens</h1>
          <Link href="/query" className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity w-fit">
            <Plus className="w-4 h-4" />
            CREATE NEW SCREEN
          </Link>
        </div>

        {/* Custom Screen Query Builder */}
        <div className="border border-border rounded-xl p-5 mb-8 bg-muted/20">
          <h3 className="font-display font-semibold text-sm mb-3 flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-primary" />
            Custom Screen Query
          </h3>
          <p className="text-xs text-muted-foreground mb-3">
            Write your own screening query using financial metrics. Example: <code className="bg-muted px-1 py-0.5 rounded text-xs">Market Cap &gt; 100B AND P/E &lt; 30 AND ROE &gt; 20%</code>
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              value={screenQuery}
              onChange={(e) => setScreenQuery(e.target.value)}
              placeholder="e.g., Revenue growth > 20% AND P/E < 25 AND Dividend Yield > 1%"
              className="flex-1 px-4 py-2.5 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 font-mono"
            />
            <Link href="/query" className="bg-primary text-primary-foreground px-5 py-2.5 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity shrink-0 flex items-center">
              Run Screen
            </Link>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="text-xs text-muted-foreground">Available metrics:</span>
            {["Market Cap", "P/E", "ROE", "ROCE", "Dividend Yield", "Revenue Growth", "EPS", "Debt/Equity", "Beta", "52W High", "Volume"].map(m => (
              <button
                key={m}
                onClick={() => setScreenQuery(prev => prev + (prev ? " AND " : "") + m)}
                className="text-[10px] bg-muted hover:bg-accent px-2 py-0.5 rounded transition-colors"
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_260px] gap-8">
          {/* Main Content */}
          <div className="space-y-10">
            {categories.map(({ title, icon, description, screens }) => (
              <section key={title}>
                <div className="flex items-center gap-2 mb-2">
                  {icon}
                  <h2 className="font-display font-semibold text-lg">{title}</h2>
                </div>
                <p className="text-sm text-muted-foreground mb-4">{description}</p>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                  {screens.map((screen) => (
                    <Link
                      key={screen.id}
                      href={`/screen/${screen.id}`}
                      className="group border border-border rounded-lg p-4 hover:border-primary/30 hover:shadow-sm transition-all"
                    >
                      <h3 className="font-display font-medium text-sm group-hover:text-primary transition-colors flex items-center gap-1">
                        {screen.name}
                        <span className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">›</span>
                      </h3>
                      <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2 leading-relaxed">
                        {screen.description}
                      </p>
                    </Link>
                  ))}
                </div>
              </section>
            ))}

            {/* All Popular Screens */}
            <section>
              <h2 className="font-display font-semibold text-lg mb-4">All Popular Screens</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                {prebuiltScreens.map((screen) => (
                  <Link
                    key={screen.id}
                    href={`/screen/${screen.id}`}
                    className="group border border-border rounded-lg p-4 hover:border-primary/30 hover:shadow-sm transition-all"
                  >
                    <h3 className="font-display font-medium text-sm group-hover:text-primary transition-colors">
                      {screen.name}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2 leading-relaxed">
                      {screen.description}
                    </p>
                    <span className="inline-block mt-2 text-[10px] uppercase tracking-wider font-medium text-primary/70 bg-primary/5 px-2 py-0.5 rounded">
                      {screen.category}
                    </span>
                  </Link>
                ))}
              </div>
            </section>
          </div>

          {/* Sidebar - Browse Sectors */}
          <aside className="hidden lg:block">
            <div className="sticky top-20 border border-border rounded-xl p-5">
              <h3 className="font-display font-semibold text-sm mb-4">Browse Sectors</h3>
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
      </main>
      <Footer />
    </div>
  );
}
