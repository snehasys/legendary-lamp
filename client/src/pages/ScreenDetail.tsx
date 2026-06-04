import { Link, useParams } from "wouter";
import { ArrowUpRight, ArrowDownRight, Download, Bell } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { prebuiltScreens, stocks, formatMarketCap } from "@/lib/stockData";

export default function ScreenDetail() {
  const params = useParams<{ id: string }>();
  const screen = prebuiltScreens.find(s => s.id === params.id);

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

  const matchedStocks = screen.stocks
    .map(sym => stocks.find(s => s.symbol === sym))
    .filter(Boolean) as typeof stocks;

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
            <h1 className="font-display font-bold text-2xl mb-2">{screen.name}</h1>
            <p className="text-muted-foreground text-sm max-w-2xl">{screen.description}</p>
            <span className="inline-block mt-3 text-xs uppercase tracking-wider font-medium text-primary/70 bg-primary/5 px-2.5 py-1 rounded">
              {screen.category}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-1.5 border border-border px-3 py-2 rounded-lg text-sm hover:bg-accent transition-colors">
              <Bell className="w-4 h-4" /> Set Alert
            </button>
            <button className="flex items-center gap-1.5 border border-border px-3 py-2 rounded-lg text-sm hover:bg-accent transition-colors">
              <Download className="w-4 h-4" /> Export
            </button>
          </div>
        </div>

        {/* Query Display */}
        <div className="border border-border rounded-xl p-4 mb-6 bg-muted/30">
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2 font-medium">Screen Query</p>
          <code className="text-sm font-mono text-foreground">
            {screen.category === "Growth" && "Revenue growth > 20% AND Profit growth > 30% AND Market Cap > $10B"}
            {screen.category === "Value" && "P/E < 15 AND Dividend Yield > 2% AND ROCE > 15%"}
            {screen.category === "Dividends" && "Dividend Yield > 2% AND Consecutive Dividend Years > 25 AND Payout Ratio < 75%"}
            {screen.category === "Technical" && "Price > 50 DMA AND Price > 200 DMA AND Volume > Average Volume * 1.5"}
            {screen.category === "Quality" && "ROCE > 30% AND ROE > 20% AND Debt/Equity < 0.5"}
            {screen.category === "Formula" && "Earnings Yield > 8% AND ROIC > 25% ORDER BY Combined Rank ASC"}
          </code>
        </div>

        {/* Results Count */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">{matchedStocks.length}</span> stocks match this screen
          </p>
          <button className="text-xs text-primary hover:underline">Edit Columns</button>
        </div>

        {/* Results Table */}
        <div className="border border-border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr className="bg-muted/30">
                  <th>S.No.</th>
                  <th>Name</th>
                  <th className="numeric">CMP $</th>
                  <th className="numeric">Change %</th>
                  <th className="numeric">P/E</th>
                  <th className="numeric">Market Cap</th>
                  <th className="numeric">Div Yld %</th>
                  <th className="numeric">ROCE %</th>
                  <th className="numeric">ROE %</th>
                  <th className="numeric">Rev Growth %</th>
                  <th className="numeric">Profit Growth %</th>
                </tr>
              </thead>
              <tbody>
                {matchedStocks.map((stock, i) => (
                  <tr key={stock.symbol}>
                    <td className="text-muted-foreground">{i + 1}.</td>
                    <td>
                      <Link href={`/company/${stock.symbol}`} className="hover:text-primary transition-colors">
                        <span className="font-medium">{stock.name}</span>
                        <span className="text-xs text-muted-foreground ml-1.5">{stock.symbol}</span>
                      </Link>
                    </td>
                    <td className="numeric">{stock.price.toFixed(2)}</td>
                    <td className="numeric">
                      <span className={`flex items-center justify-end gap-0.5 ${stock.changePercent >= 0 ? "gain" : "loss"}`}>
                        {stock.changePercent >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                        {Math.abs(stock.changePercent).toFixed(2)}%
                      </span>
                    </td>
                    <td className="numeric">{stock.pe.toFixed(1)}</td>
                    <td className="numeric">{formatMarketCap(stock.marketCap)}</td>
                    <td className="numeric">{stock.dividendYield.toFixed(2)}</td>
                    <td className="numeric">{stock.roce.toFixed(1)}</td>
                    <td className="numeric">{stock.roe.toFixed(1)}</td>
                    <td className="numeric">
                      <span className={stock.revenueGrowth >= 0 ? "gain" : "loss"}>
                        {stock.revenueGrowth > 0 ? "+" : ""}{stock.revenueGrowth}%
                      </span>
                    </td>
                    <td className="numeric">
                      <span className={stock.profitGrowth >= 0 ? "gain" : "loss"}>
                        {stock.profitGrowth > 0 ? "+" : ""}{stock.profitGrowth}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Median Row */}
        <div className="border border-border rounded-xl mt-4 p-4 bg-muted/20">
          <div className="flex items-center gap-6 text-sm">
            <span className="font-medium">Median Values:</span>
            <span className="text-muted-foreground">P/E: <span className="font-mono">{(matchedStocks.reduce((a, s) => a + s.pe, 0) / matchedStocks.length).toFixed(1)}</span></span>
            <span className="text-muted-foreground">ROCE: <span className="font-mono">{(matchedStocks.reduce((a, s) => a + s.roce, 0) / matchedStocks.length).toFixed(1)}%</span></span>
            <span className="text-muted-foreground">Div Yld: <span className="font-mono">{(matchedStocks.reduce((a, s) => a + s.dividendYield, 0) / matchedStocks.length).toFixed(2)}%</span></span>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
