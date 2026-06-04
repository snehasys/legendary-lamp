import { Link } from "wouter";

export default function Footer() {
  return (
    <footer className="border-t border-border bg-muted/20 mt-auto">
      <div className="container py-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-baseline gap-0.5 mb-3">
              <span className="font-display font-bold text-lg tracking-tight">screener</span>
              <span className="text-primary font-display font-bold text-lg">.us</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Free stock analysis and screening tool for NYSE & NASDAQ investors. Fundamental data, financial statements, and peer comparison.
            </p>
            <p className="text-xs text-muted-foreground mt-4">
              © 2024–2026. All rights reserved.
            </p>
          </div>

          {/* Product */}
          <div>
            <h4 className="font-display font-semibold text-sm mb-3">Product</h4>
            <ul className="space-y-2">
              <li><Link href="/screens" className="text-sm text-muted-foreground hover:text-primary transition-colors">Stock Screens</Link></li>
              <li><Link href="/query" className="text-sm text-muted-foreground hover:text-primary transition-colors">Custom Screen</Link></li>
              <li><Link href="/compare" className="text-sm text-muted-foreground hover:text-primary transition-colors">Compare Stocks</Link></li>
              <li><Link href="/watchlist" className="text-sm text-muted-foreground hover:text-primary transition-colors">Watchlist</Link></li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="font-display font-semibold text-sm mb-3">Resources</h4>
            <ul className="space-y-2">
              <li><Link href="/sector/Technology" className="text-sm text-muted-foreground hover:text-primary transition-colors">Technology Stocks</Link></li>
              <li><Link href="/sector/Healthcare" className="text-sm text-muted-foreground hover:text-primary transition-colors">Healthcare Stocks</Link></li>
              <li><Link href="/sector/Financial%20Services" className="text-sm text-muted-foreground hover:text-primary transition-colors">Financial Stocks</Link></li>
              <li><Link href="/sector/Energy" className="text-sm text-muted-foreground hover:text-primary transition-colors">Energy Stocks</Link></li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-display font-semibold text-sm mb-3">Company</h4>
            <ul className="space-y-2">
              <li><a href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">About Us</a></li>
              <li><a href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">Contact</a></li>
              <li><a href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">Terms of Service</a></li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-border mt-8 pt-6">
          <p className="text-xs text-muted-foreground text-center">
            Data provided for informational purposes only. Not financial advice. Market data may be delayed.
          </p>
        </div>
      </div>
    </footer>
  );
}
