import { Link } from "wouter";
import { TrendingUp, BarChart2, DollarSign, Activity } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { STOCK_SCREENS, type StockScreen } from "@/lib/screenEngine";

export default function Screens() {
  const categories: { title: string; icon: React.ReactNode; description: string; filter: StockScreen["category"] }[] = [
    {
      title: "Technical Screens",
      icon: <Activity className="w-4 h-4 text-primary" />,
      description: "Screens based on technical indicators like moving averages, RSI, and MACD crossovers",
      filter: "technical",
    },
    {
      title: "Momentum Screens",
      icon: <TrendingUp className="w-4 h-4 text-primary" />,
      description: "Identify stocks with strong price momentum, breakouts, and trend strength",
      filter: "momentum",
    },
    {
      title: "Volume Screens",
      icon: <BarChart2 className="w-4 h-4 text-primary" />,
      description: "Detect unusual volume activity that may signal institutional buying or selling",
      filter: "volume",
    },
    {
      title: "Value & Contrarian",
      icon: <DollarSign className="w-4 h-4 text-primary" />,
      description: "Find potentially undervalued stocks near support levels or oversold conditions",
      filter: "value",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 container py-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="font-display font-bold text-2xl">Stock Screens</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Real-time technical screens powered by Yahoo Finance data. Screening {STOCK_SCREENS[0] ? "top 50 US stocks" : ""} by market cap.
            </p>
          </div>
        </div>

        {/* Info Banner */}
        <div className="border border-primary/20 bg-primary/5 rounded-xl p-4 mb-8">
          <p className="text-sm text-foreground">
            <span className="font-semibold">Live Screening:</span> All screens fetch real-time price data from Yahoo Finance and calculate technical indicators on the fly.
            Results are cached for 10 minutes to reduce API calls. The universe includes 50 of the largest US stocks by market cap.
          </p>
        </div>

        {/* Categorized Screens */}
        <div className="space-y-10">
          {categories.map(({ title, icon, description, filter }) => {
            const screens = STOCK_SCREENS.filter(s => s.category === filter);
            if (screens.length === 0) return null;
            return (
              <section key={filter}>
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
                      <h3 className="font-display font-medium text-sm group-hover:text-primary transition-colors flex items-center gap-2">
                        <span className="text-base">{screen.icon}</span>
                        {screen.name}
                        <span className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity ml-auto">›</span>
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
            );
          })}
        </div>

        {/* All Screens Grid */}
        <section className="mt-12">
          <h2 className="font-display font-semibold text-lg mb-4">All Screens ({STOCK_SCREENS.length})</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {STOCK_SCREENS.map((screen) => (
              <Link
                key={screen.id}
                href={`/screen/${screen.id}`}
                className="group border border-border rounded-lg p-4 hover:border-primary/30 hover:shadow-sm transition-all"
              >
                <h3 className="font-display font-medium text-sm group-hover:text-primary transition-colors flex items-center gap-2">
                  <span className="text-base">{screen.icon}</span>
                  {screen.name}
                </h3>
                <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2 leading-relaxed">
                  {screen.description}
                </p>
              </Link>
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
