import { useState } from "react";
import { Link } from "wouter";
import { Plus, Trash2, ArrowUpRight, ArrowDownRight, Star } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { stocks, formatMarketCap, Stock } from "@/lib/stockData";

export default function Watchlist() {
  const [watchlist, setWatchlist] = useState<string[]>(["AAPL", "MSFT", "GOOGL", "NVDA", "AMZN"]);
  const [addSymbol, setAddSymbol] = useState("");

  const watchlistStocks = watchlist
    .map(sym => stocks.find(s => s.symbol === sym))
    .filter(Boolean) as Stock[];

  function handleAdd() {
    const sym = addSymbol.toUpperCase().trim();
    if (sym && !watchlist.includes(sym) && stocks.find(s => s.symbol === sym)) {
      setWatchlist([...watchlist, sym]);
      setAddSymbol("");
    }
  }

  function handleRemove(sym: string) {
    setWatchlist(watchlist.filter(s => s !== sym));
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 container py-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="font-display font-bold text-2xl">Watchlist</h1>
            <p className="text-sm text-muted-foreground mt-1">Track your favorite stocks in one place.</p>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={addSymbol}
              onChange={(e) => setAddSymbol(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAdd()}
              placeholder="Add symbol (e.g., TSLA)"
              className="px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 w-48"
            />
            <button
              onClick={handleAdd}
              className="flex items-center gap-1.5 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
            >
              <Plus className="w-4 h-4" /> ADD
            </button>
          </div>
        </div>

        {watchlistStocks.length > 0 ? (
          <div className="border border-border rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr className="bg-muted/30">
                    <th></th>
                    <th>Name</th>
                    <th className="numeric">CMP $</th>
                    <th className="numeric">Change %</th>
                    <th className="numeric">P/E</th>
                    <th className="numeric">Market Cap</th>
                    <th className="numeric">ROE %</th>
                    <th className="numeric">ROCE %</th>
                    <th className="numeric">Div Yld %</th>
                    <th className="numeric">52W High</th>
                    <th className="numeric">52W Low</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {watchlistStocks.map((stock) => (
                    <tr key={stock.symbol}>
                      <td><Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" /></td>
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
                      <td className="numeric">{stock.pe.toFixed(1)}</td>
                      <td className="numeric">{formatMarketCap(stock.marketCap)}</td>
                      <td className="numeric">{stock.roe.toFixed(1)}</td>
                      <td className="numeric">{stock.roce.toFixed(1)}</td>
                      <td className="numeric">{stock.dividendYield.toFixed(2)}</td>
                      <td className="numeric">${stock.high52w}</td>
                      <td className="numeric">${stock.low52w}</td>
                      <td>
                        <button
                          onClick={() => handleRemove(stock.symbol)}
                          className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                          title="Remove from watchlist"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="border border-border rounded-xl p-12 text-center">
            <Star className="w-8 h-8 text-muted-foreground/30 mx-auto mb-3" />
            <h3 className="font-display font-semibold text-lg mb-2">Your watchlist is empty</h3>
            <p className="text-sm text-muted-foreground mb-4">Add stocks to track their performance.</p>
          </div>
        )}

        {/* Summary Stats */}
        {watchlistStocks.length > 0 && (
          <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="border border-border rounded-lg p-4">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Total Stocks</p>
              <p className="font-display font-bold text-xl mt-1">{watchlistStocks.length}</p>
            </div>
            <div className="border border-border rounded-lg p-4">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Avg P/E</p>
              <p className="font-display font-bold text-xl mt-1">
                {(watchlistStocks.reduce((a, s) => a + s.pe, 0) / watchlistStocks.length).toFixed(1)}
              </p>
            </div>
            <div className="border border-border rounded-lg p-4">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Avg Div Yield</p>
              <p className="font-display font-bold text-xl mt-1">
                {(watchlistStocks.reduce((a, s) => a + s.dividendYield, 0) / watchlistStocks.length).toFixed(2)}%
              </p>
            </div>
            <div className="border border-border rounded-lg p-4">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Gainers / Losers</p>
              <p className="font-display font-bold text-xl mt-1">
                <span className="gain">{watchlistStocks.filter(s => s.changePercent >= 0).length}</span>
                {" / "}
                <span className="loss">{watchlistStocks.filter(s => s.changePercent < 0).length}</span>
              </p>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
