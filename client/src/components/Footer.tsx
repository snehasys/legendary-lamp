import { Link } from "wouter";

export default function Footer() {
  return (
    <footer className="border-t border-border bg-muted/20 mt-auto">
      <div className="container py-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-baseline gap-0.5 mb-3">
              <span className="font-bold text-lg tracking-tight">screener</span>
              <span className="text-primary font-bold text-lg">.us</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Real-time stock analysis and screening tool for NYSE &amp; NASDAQ investors. Powered by Yahoo Finance data.
            </p>
          </div>

          {/* Product */}
          <div>
            <h4 className="font-semibold text-sm mb-3">Product</h4>
            <ul className="space-y-2">
              <li><Link href="/screens" className="text-sm text-muted-foreground hover:text-primary transition-colors">Stock Screens</Link></li>
              <li><Link href="/query" className="text-sm text-muted-foreground hover:text-primary transition-colors">Custom Screen</Link></li>
              <li><Link href="/compare" className="text-sm text-muted-foreground hover:text-primary transition-colors">Compare Stocks</Link></li>
              <li><Link href="/watchlist" className="text-sm text-muted-foreground hover:text-primary transition-colors">Watchlist</Link></li>
            </ul>
          </div>

          {/* Popular Stocks */}
          <div>
            <h4 className="font-semibold text-sm mb-3">Popular</h4>
            <ul className="space-y-2">
              <li><Link href="/company/AAPL" className="text-sm text-muted-foreground hover:text-primary transition-colors">Apple (AAPL)</Link></li>
              <li><Link href="/company/MSFT" className="text-sm text-muted-foreground hover:text-primary transition-colors">Microsoft (MSFT)</Link></li>
              <li><Link href="/company/GOOGL" className="text-sm text-muted-foreground hover:text-primary transition-colors">Alphabet (GOOGL)</Link></li>
              <li><Link href="/company/NVDA" className="text-sm text-muted-foreground hover:text-primary transition-colors">NVIDIA (NVDA)</Link></li>
            </ul>
          </div>

          {/* Data Source */}
          <div>
            <h4 className="font-semibold text-sm mb-3">Data</h4>
            <ul className="space-y-2">
              <li className="text-sm text-muted-foreground">Source: Yahoo Finance</li>
              <li className="text-sm text-muted-foreground">Prices may be delayed</li>
              <li className="text-sm text-muted-foreground">Not financial advice</li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-border mt-8 pt-6">
          <p className="text-xs text-muted-foreground text-center">
            All market data provided by Yahoo Finance. Prices may be delayed up to 15 minutes. For informational purposes only — not financial advice.
          </p>
        </div>
      </div>
    </footer>
  );
}
