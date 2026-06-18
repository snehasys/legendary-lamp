import { useState, useRef, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Search, Moon, Sun, ChevronDown, Menu, X } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";

export default function Header() {
  const [, navigate] = useLocation();
  const [location] = useLocation();
  const { theme, toggleTheme } = useTheme();
  const [searchQuery, setSearchQuery] = useState("");
  const [showTools, setShowTools] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);
  const toolsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (toolsRef.current && !toolsRef.current.contains(e.target as Node)) {
        setShowTools(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    const q = searchQuery.trim().toUpperCase();
    if (q.length > 0) {
      navigate(`/company/${q}`);
      setSearchQuery("");
    }
  }

  return (
    <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
      <div className="container flex items-center h-14 gap-4">
        {/* Logo */}
        <Link href="/" className="flex items-baseline gap-0.5 shrink-0">
          <span className="font-bold text-lg tracking-tight text-foreground">screener</span>
          <span className="text-primary font-bold text-lg">.us</span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-1 ml-4">
          <Link href="/" className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${location === "/" ? "text-primary bg-primary/5" : "text-muted-foreground hover:text-foreground"}`}>
            Home
          </Link>
          <Link href="/screens" className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${location === "/screens" || location.startsWith("/screen/") ? "text-primary bg-primary/5" : "text-muted-foreground hover:text-foreground"}`}>
            Screens
          </Link>
          <div className="relative" ref={toolsRef}>
            <button
              onClick={() => setShowTools(!showTools)}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors flex items-center gap-1 ${
                ["/watchlist", "/compare", "/query"].includes(location)
                  ? "text-primary bg-primary/5"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Tools <ChevronDown className={`w-3 h-3 transition-transform ${showTools ? "rotate-180" : ""}`} />
            </button>
            {showTools && (
              <div className="absolute top-full left-0 mt-1 w-52 bg-popover text-popover-foreground border border-border rounded-lg shadow-lg py-1 z-50">
                <Link
                  href="/query"
                  className="block px-4 py-2.5 text-sm hover:bg-accent transition-colors"
                  onClick={() => setShowTools(false)}
                >
                  <span className="font-medium">Custom Screen</span>
                  <p className="text-xs text-muted-foreground mt-0.5">Build your own query</p>
                </Link>
                <Link
                  href="/compare"
                  className="block px-4 py-2.5 text-sm hover:bg-accent transition-colors"
                  onClick={() => setShowTools(false)}
                >
                  <span className="font-medium">Compare Stocks</span>
                  <p className="text-xs text-muted-foreground mt-0.5">Side-by-side analysis</p>
                </Link>
                <Link
                  href="/watchlist"
                  className="block px-4 py-2.5 text-sm hover:bg-accent transition-colors"
                  onClick={() => setShowTools(false)}
                >
                  <span className="font-medium">Watchlist</span>
                  <p className="text-xs text-muted-foreground mt-0.5">Track your stocks</p>
                </Link>
              </div>
            )}
          </div>
        </nav>

        {/* Search */}
        <div className="flex-1 max-w-md mx-auto relative">
          <form onSubmit={handleSearchSubmit} className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Enter stock symbol (e.g. AAPL, MSFT)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm bg-muted/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all"
            />
          </form>
        </div>

        {/* Right actions */}
        <div className="hidden md:flex items-center gap-2">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-md hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
            title={theme === "dark" ? "Switch to light" : "Switch to dark"}
          >
            {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>

        {/* Mobile menu toggle */}
        <button className="md:hidden p-2" onClick={() => setMobileMenu(!mobileMenu)}>
          {mobileMenu ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileMenu && (
        <div className="md:hidden border-t border-border bg-background p-4 space-y-2">
          <Link href="/" className="block text-sm font-medium py-2 px-2 rounded hover:bg-accent" onClick={() => setMobileMenu(false)}>Home</Link>
          <Link href="/screens" className="block text-sm font-medium py-2 px-2 rounded hover:bg-accent" onClick={() => setMobileMenu(false)}>Screens</Link>
          <Link href="/query" className="block text-sm font-medium py-2 px-2 rounded hover:bg-accent" onClick={() => setMobileMenu(false)}>Custom Screen</Link>
          <Link href="/compare" className="block text-sm font-medium py-2 px-2 rounded hover:bg-accent" onClick={() => setMobileMenu(false)}>Compare</Link>
          <Link href="/watchlist" className="block text-sm font-medium py-2 px-2 rounded hover:bg-accent" onClick={() => setMobileMenu(false)}>Watchlist</Link>
          <div className="flex items-center gap-2 pt-3 border-t border-border">
            <button onClick={toggleTheme} className="p-2 rounded-md hover:bg-accent">
              {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
