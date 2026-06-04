import { useState } from "react";
import { Link } from "wouter";
import { Play, Save, RotateCcw, ArrowUpRight, ArrowDownRight, HelpCircle } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { stocks, formatMarketCap, Stock } from "@/lib/stockData";

interface Condition {
  id: number;
  metric: string;
  operator: string;
  value: string;
}

const availableMetrics = [
  { value: "marketCap", label: "Market Cap ($B)", type: "number" },
  { value: "pe", label: "P/E Ratio", type: "number" },
  { value: "roe", label: "ROE %", type: "number" },
  { value: "roce", label: "ROCE %", type: "number" },
  { value: "dividendYield", label: "Dividend Yield %", type: "number" },
  { value: "debtToEquity", label: "Debt/Equity", type: "number" },
  { value: "currentRatio", label: "Current Ratio", type: "number" },
  { value: "beta", label: "Beta", type: "number" },
  { value: "revenueGrowth", label: "Revenue Growth %", type: "number" },
  { value: "profitGrowth", label: "Profit Growth %", type: "number" },
  { value: "eps", label: "EPS $", type: "number" },
  { value: "price", label: "Price $", type: "number" },
  { value: "changePercent", label: "Day Change %", type: "number" },
  { value: "bookValue", label: "Book Value $", type: "number" },
  { value: "sector", label: "Sector", type: "text" },
  { value: "exchange", label: "Exchange", type: "text" },
];

const operators = [
  { value: ">", label: ">" },
  { value: ">=", label: ">=" },
  { value: "<", label: "<" },
  { value: "<=", label: "<=" },
  { value: "=", label: "=" },
];

export default function QueryBuilder() {
  const [conditions, setConditions] = useState<Condition[]>([
    { id: 1, metric: "marketCap", operator: ">", value: "100" },
    { id: 2, metric: "roe", operator: ">", value: "20" },
  ]);
  const [results, setResults] = useState<Stock[]>([]);
  const [hasRun, setHasRun] = useState(false);
  const [sortBy, setSortBy] = useState<string>("marketCap");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  let nextId = conditions.length > 0 ? Math.max(...conditions.map(c => c.id)) + 1 : 1;

  function addCondition() {
    setConditions([...conditions, { id: nextId, metric: "pe", operator: "<", value: "30" }]);
  }

  function removeCondition(id: number) {
    setConditions(conditions.filter(c => c.id !== id));
  }

  function updateCondition(id: number, field: keyof Condition, value: string) {
    setConditions(conditions.map(c => c.id === id ? { ...c, [field]: value } : c));
  }

  function runQuery() {
    let filtered = [...stocks];

    for (const cond of conditions) {
      if (!cond.value) continue;

      filtered = filtered.filter(stock => {
        let stockVal: number | string;

        if (cond.metric === "marketCap") {
          stockVal = (stock as any)[cond.metric] / 1000; // Convert to billions
        } else if (cond.metric === "sector" || cond.metric === "exchange") {
          stockVal = (stock as any)[cond.metric] as string;
          return stockVal.toLowerCase().includes(cond.value.toLowerCase());
        } else {
          stockVal = (stock as any)[cond.metric] as number;
        }

        const numVal = Number(cond.value);
        switch (cond.operator) {
          case ">": return (stockVal as number) > numVal;
          case ">=": return (stockVal as number) >= numVal;
          case "<": return (stockVal as number) < numVal;
          case "<=": return (stockVal as number) <= numVal;
          case "=": return (stockVal as number) === numVal;
          default: return true;
        }
      });
    }

    // Sort results
    filtered.sort((a, b) => {
      const aVal = (a as any)[sortBy] as number;
      const bVal = (b as any)[sortBy] as number;
      return sortDir === "desc" ? bVal - aVal : aVal - bVal;
    });

    setResults(filtered);
    setHasRun(true);
  }

  function resetQuery() {
    setConditions([{ id: 1, metric: "marketCap", operator: ">", value: "100" }]);
    setResults([]);
    setHasRun(false);
  }

  // Generate query string for display
  const queryString = conditions
    .filter(c => c.value)
    .map(c => {
      const metricLabel = availableMetrics.find(m => m.value === c.metric)?.label || c.metric;
      return `${metricLabel} ${c.operator} ${c.value}`;
    })
    .join(" AND ");

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 container py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-display font-bold text-2xl">Custom Stock Screen</h1>
            <p className="text-sm text-muted-foreground mt-1">Build your own screening criteria to find stocks.</p>
          </div>
          <Link href="/screens" className="text-sm text-primary hover:underline">← Back to Screens</Link>
        </div>

        {/* Query Builder */}
        <div className="border border-border rounded-xl p-5 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-semibold text-sm flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-muted-foreground" />
              Screening Criteria
            </h3>
            <div className="flex items-center gap-2">
              <button
                onClick={resetQuery}
                className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground px-3 py-1.5 border border-border rounded-lg transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Reset
              </button>
              <button
                className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground px-3 py-1.5 border border-border rounded-lg transition-colors"
              >
                <Save className="w-3.5 h-3.5" /> Save Screen
              </button>
            </div>
          </div>

          {/* Conditions */}
          <div className="space-y-3">
            {conditions.map((cond, i) => (
              <div key={cond.id} className="flex items-center gap-2 flex-wrap">
                {i > 0 && <span className="text-xs font-medium text-primary bg-primary/5 px-2 py-0.5 rounded">AND</span>}
                <select
                  value={cond.metric}
                  onChange={(e) => updateCondition(cond.id, "metric", e.target.value)}
                  className="px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  {availableMetrics.map(m => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>
                <select
                  value={cond.operator}
                  onChange={(e) => updateCondition(cond.id, "operator", e.target.value)}
                  className="px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 w-16"
                >
                  {operators.map(op => (
                    <option key={op.value} value={op.value}>{op.label}</option>
                  ))}
                </select>
                <input
                  type="text"
                  value={cond.value}
                  onChange={(e) => updateCondition(cond.id, "value", e.target.value)}
                  className="px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 w-24 font-mono"
                  placeholder="Value"
                />
                {conditions.length > 1 && (
                  <button
                    onClick={() => removeCondition(cond.id)}
                    className="text-xs text-muted-foreground hover:text-destructive transition-colors px-2 py-1"
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
          </div>

          <div className="flex items-center gap-3 mt-4">
            <button
              onClick={addCondition}
              className="text-sm text-primary hover:underline"
            >
              + Add condition
            </button>
          </div>

          {/* Query Preview */}
          {queryString && (
            <div className="mt-4 p-3 bg-muted/30 rounded-lg">
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Query Preview</p>
              <code className="text-sm font-mono">{queryString}</code>
            </div>
          )}

          {/* Run Button */}
          <div className="mt-5 flex items-center gap-3">
            <button
              onClick={runQuery}
              className="flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
            >
              <Play className="w-4 h-4" /> RUN SCREEN
            </button>
            {hasRun && (
              <span className="text-sm text-muted-foreground">
                Found <span className="font-medium text-foreground">{results.length}</span> matching stocks
              </span>
            )}
          </div>
        </div>

        {/* Results */}
        {hasRun && (
          <div className="border border-border rounded-xl overflow-hidden">
            {results.length > 0 ? (
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
                      <th className="numeric">ROE %</th>
                      <th className="numeric">ROCE %</th>
                      <th className="numeric">Div Yld %</th>
                      <th className="numeric">D/E</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.map((stock, i) => (
                      <tr key={stock.symbol}>
                        <td className="text-muted-foreground">{i + 1}.</td>
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
                        <td className="numeric">{stock.debtToEquity.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-8 text-center">
                <p className="text-muted-foreground">No stocks match your criteria. Try adjusting the conditions.</p>
              </div>
            )}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
