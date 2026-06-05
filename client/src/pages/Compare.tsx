import { useState, useMemo } from "react";
import { Link } from "wouter";
import { Plus, X, ArrowUpRight, ArrowDownRight } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { stocks, searchStocks, formatMarketCap, Stock } from "@/lib/stockData";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend } from "recharts";

export default function Compare() {
  const [selectedSymbols, setSelectedSymbols] = useState<string[]>(["AAPL", "MSFT", "GOOGL"]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Stock[]>([]);

  const selectedStocks = useMemo(() =>
    selectedSymbols.map(sym => stocks.find(s => s.symbol === sym)).filter(Boolean) as Stock[],
    [selectedSymbols]
  );

  function handleSearch(q: string) {
    setSearchQuery(q);
    if (q.length >= 1) {
      setSearchResults(searchStocks(q).filter(s => !selectedSymbols.includes(s.symbol)).slice(0, 5));
    } else {
      setSearchResults([]);
    }
  }

  function addStock(symbol: string) {
    if (!selectedSymbols.includes(symbol) && selectedSymbols.length < 5) {
      setSelectedSymbols([...selectedSymbols, symbol]);
    }
    setSearchQuery("");
    setSearchResults([]);
  }

  function removeStock(symbol: string) {
    setSelectedSymbols(selectedSymbols.filter(s => s !== symbol));
  }

  const COLORS = ["#2563eb", "#16a34a", "#d97706", "#7c3aed", "#dc2626"];

  const comparisonMetrics = [
    { key: "pe", label: "P/E Ratio", format: (v: number) => v.toFixed(1) },
    { key: "roe", label: "ROE %", format: (v: number) => v.toFixed(1) + "%" },
    { key: "roce", label: "ROCE %", format: (v: number) => v.toFixed(1) + "%" },
    { key: "dividendYield", label: "Dividend Yield %", format: (v: number) => v.toFixed(2) + "%" },
    { key: "debtToEquity", label: "Debt/Equity", format: (v: number) => v.toFixed(2) },
    { key: "currentRatio", label: "Current Ratio", format: (v: number) => v.toFixed(2) },
    { key: "beta", label: "Beta", format: (v: number) => v.toFixed(2) },
    { key: "revenueGrowth", label: "Revenue Growth %", format: (v: number) => v + "%" },
    { key: "profitGrowth", label: "Profit Growth %", format: (v: number) => v + "%" },
    { key: "eps", label: "EPS $", format: (v: number) => "$" + v.toFixed(2) },
    { key: "bookValue", label: "Book Value $", format: (v: number) => "$" + v.toFixed(2) },
  ];

  // Radar chart data (normalized)
  const radarData = useMemo(() => {
    if (selectedStocks.length === 0) return [];
    const metrics = ["ROE", "ROCE", "Growth", "Yield", "Value"];
    return metrics.map((metric) => {
      const entry: Record<string, string | number> = { metric };
      selectedStocks.forEach((stock) => {
        switch (metric) {
          case "ROE": entry[stock.symbol] = Math.min(stock.roe, 100); break;
          case "ROCE": entry[stock.symbol] = Math.min(stock.roce, 100); break;
          case "Growth": entry[stock.symbol] = Math.max(0, Math.min(stock.revenueGrowth, 100)); break;
          case "Yield": entry[stock.symbol] = stock.dividendYield * 20; break;
          case "Value": entry[stock.symbol] = Math.max(0, 100 - stock.pe); break;
        }
      });
      return entry;
    });
  }, [selectedStocks]);

  // Bar chart data for market cap comparison
  const marketCapData = useMemo(() =>
    selectedStocks.map(s => ({ name: s.symbol, marketCap: s.marketCap })),
    [selectedStocks]
  );

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 container py-8">
        <h1 className="font-display font-bold text-2xl mb-2">Compare Stocks</h1>
        <p className="text-sm text-muted-foreground mb-6">Side-by-side comparison of up to 5 stocks.</p>

        {/* Stock Selection */}
        <div className="flex flex-wrap items-center gap-2 mb-8">
          {selectedStocks.map((stock, i) => (
            <div
              key={stock.symbol}
              className="flex items-center gap-2 border border-border rounded-lg px-3 py-2"
              style={{ borderLeftColor: COLORS[i], borderLeftWidth: 3 }}
            >
              <Link href={`/company/${stock.symbol}`} className="text-sm font-medium hover:text-primary transition-colors">
                {stock.symbol}
              </Link>
              <span className="text-xs text-muted-foreground">${stock.price.toFixed(2)}</span>
              <button onClick={() => removeStock(stock.symbol)} className="p-0.5 hover:bg-accent rounded">
                <X className="w-3 h-3 text-muted-foreground" />
              </button>
            </div>
          ))}
          {selectedSymbols.length < 5 && (
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="+ Add stock"
                className="px-3 py-2 text-sm border border-dashed border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 w-36"
              />
              {searchResults.length > 0 && (
                <div className="absolute top-full left-0 mt-1 w-56 bg-popover border border-border rounded-lg shadow-xl z-50 overflow-hidden">
                  {searchResults.map((stock) => (
                    <button
                      key={stock.symbol}
                      onClick={() => addStock(stock.symbol)}
                      className="flex items-center justify-between w-full px-4 py-2.5 hover:bg-accent transition-colors text-left"
                    >
                      <span className="text-sm">{stock.symbol} - {stock.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {selectedStocks.length >= 2 && (
          <>
            {/* Price & Change Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-8">
              {selectedStocks.map((stock, i) => (
                <div key={stock.symbol} className="border border-border rounded-xl p-4" style={{ borderTopColor: COLORS[i], borderTopWidth: 3 }}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-display font-semibold text-sm">{stock.symbol}</span>
                    <span className={`text-xs flex items-center gap-0.5 ${stock.changePercent >= 0 ? "gain" : "loss"}`}>
                      {stock.changePercent >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                      {Math.abs(stock.changePercent).toFixed(2)}%
                    </span>
                  </div>
                  <p className="font-mono font-semibold text-lg">${stock.price.toFixed(2)}</p>
                  <p className="text-xs text-muted-foreground mt-1">{formatMarketCap(stock.marketCap)}</p>
                </div>
              ))}
            </div>

            {/* Comparison Table */}
            <div className="border border-border rounded-xl overflow-hidden mb-8">
              <div className="overflow-x-auto">
                <table className="data-table">
                  <thead>
                    <tr className="bg-muted/30">
                      <th>Metric</th>
                      {selectedStocks.map((stock, i) => (
                        <th key={stock.symbol} className="numeric">
                          <span style={{ color: COLORS[i] }}>{stock.symbol}</span>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="font-medium">Market Cap</td>
                      {selectedStocks.map(s => <td key={s.symbol} className="numeric">{formatMarketCap(s.marketCap)}</td>)}
                    </tr>
                    <tr>
                      <td className="font-medium">Current Price</td>
                      {selectedStocks.map(s => <td key={s.symbol} className="numeric">${s.price.toFixed(2)}</td>)}
                    </tr>
                    <tr>
                      <td className="font-medium">52W High / Low</td>
                      {selectedStocks.map(s => <td key={s.symbol} className="numeric">${s.high52w} / ${s.low52w}</td>)}
                    </tr>
                    {comparisonMetrics.map(metric => (
                      <tr key={metric.key}>
                        <td className="font-medium">{metric.label}</td>
                        {selectedStocks.map(s => {
                          const val = (s as any)[metric.key] as number;
                          // Highlight best value
                          const allVals = selectedStocks.map(st => (st as any)[metric.key] as number);
                          const isBest = metric.key === "debtToEquity" || metric.key === "pe"
                            ? val === Math.min(...allVals.filter(v => v > 0))
                            : val === Math.max(...allVals);
                          return (
                            <td key={s.symbol} className={`numeric ${isBest ? "font-semibold gain" : ""}`}>
                              {metric.format(val)}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                    <tr>
                      <td className="font-medium">Sector</td>
                      {selectedStocks.map(s => <td key={s.symbol} className="numeric text-xs">{s.sector}</td>)}
                    </tr>
                    <tr>
                      <td className="font-medium">Exchange</td>
                      {selectedStocks.map(s => <td key={s.symbol} className="numeric">{s.exchange}</td>)}
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* Radar Chart */}
              <div className="border border-border rounded-xl p-5">
                <h3 className="font-display font-semibold text-sm mb-4">Performance Radar</h3>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={radarData}>
                      <PolarGrid stroke="oklch(0.92 0.003 260)" />
                      <PolarAngleAxis dataKey="metric" tick={{ fontSize: 11 }} />
                      <PolarRadiusAxis tick={{ fontSize: 9 }} />
                      {selectedStocks.map((stock, i) => (
                        <Radar
                          key={stock.symbol}
                          name={stock.symbol}
                          dataKey={stock.symbol}
                          stroke={COLORS[i]}
                          fill={COLORS[i]}
                          fillOpacity={0.1}
                          strokeWidth={2}
                        />
                      ))}
                      <Legend />
                      <Tooltip />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Market Cap Bar Chart */}
              <div className="border border-border rounded-xl p-5">
                <h3 className="font-display font-semibold text-sm mb-4">Market Cap Comparison</h3>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={marketCapData} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.92 0.003 260)" vertical={false} />
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `$${(v / 1e3).toFixed(0)}B`} axisLine={false} tickLine={false} />
                      <Tooltip formatter={(value: number) => formatMarketCap(value)} />
                      <Bar dataKey="marketCap" radius={[4, 4, 0, 0]}>
                        {marketCapData.map((_, i) => (
                          <rect key={i} fill={COLORS[i]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </>
        )}

        {selectedStocks.length < 2 && (
          <div className="border border-border rounded-xl p-12 text-center">
            <h3 className="font-display font-semibold text-lg mb-2">Select at least 2 stocks to compare</h3>
            <p className="text-sm text-muted-foreground">Use the search above to add stocks for comparison.</p>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
