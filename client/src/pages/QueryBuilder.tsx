import { useState, useMemo } from "react";
import { Link } from "wouter";
import { ArrowUpRight, ArrowDownRight, Loader2, AlertCircle, Play, Plus, Trash2, Filter, RotateCcw } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { getMultipleQuotes, MAJOR_US_STOCKS, type StockQuote } from "@/lib/yahooFinance";

interface FilterCondition {
  id: string;
  field: string;
  operator: string;
  value: string;
}

const FILTER_FIELDS = [
  { value: "changePercent", label: "% Change" },
  { value: "price", label: "Price ($)" },
  { value: "volume", label: "Volume" },
  { value: "dayHigh", label: "Day High ($)" },
  { value: "dayLow", label: "Day Low ($)" },
  { value: "52wHigh", label: "52W High ($)" },
  { value: "52wLow", label: "52W Low ($)" },
];

const OPERATORS = [
  { value: "gt", label: ">" },
  { value: "gte", label: ">=" },
  { value: "lt", label: "<" },
  { value: "lte", label: "<=" },
  { value: "eq", label: "=" },
];

function formatVol(num: number | undefined | null): string {
  if (num == null || isNaN(num)) return "N/A";
  if (Math.abs(num) >= 1e9) return (num / 1e9).toFixed(2) + "B";
  if (Math.abs(num) >= 1e6) return (num / 1e6).toFixed(2) + "M";
  if (Math.abs(num) >= 1e3) return (num / 1e3).toFixed(1) + "K";
  return num.toString();
}

export default function QueryBuilder() {
  const [filters, setFilters] = useState<FilterCondition[]>([
    { id: "1", field: "changePercent", operator: "gt", value: "2" },
  ]);
  const [runQuery, setRunQuery] = useState(false);
  const [sortBy, setSortBy] = useState<"price" | "change" | "changePercent" | "volume">("changePercent");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [allQuotes, setAllQuotes] = useState<StockQuote[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(false);

  // Apply client-side filters to the real data
  const filteredResults = useMemo(() => {
    if (!allQuotes.length) return [];
    const filtered = allQuotes.filter(q => {
      return filters.every(f => {
        const val = parseFloat(f.value);
        if (isNaN(val)) return true;

        let fieldVal: number;
        switch (f.field) {
          case "changePercent": fieldVal = q.changePercent; break;
          case "price": fieldVal = q.regularMarketPrice; break;
          case "volume": fieldVal = q.regularMarketVolume; break;
          case "dayHigh": fieldVal = q.regularMarketDayHigh; break;
          case "dayLow": fieldVal = q.regularMarketDayLow; break;
          case "52wHigh": fieldVal = q.fiftyTwoWeekHigh; break;
          case "52wLow": fieldVal = q.fiftyTwoWeekLow; break;
          default: return true;
        }

        switch (f.operator) {
          case "gt": return fieldVal > val;
          case "gte": return fieldVal >= val;
          case "lt": return fieldVal < val;
          case "lte": return fieldVal <= val;
          case "eq": return Math.abs(fieldVal - val) < 0.01;
          default: return true;
        }
      });
    });

    // Sort
    filtered.sort((a, b) => {
      let aVal: number, bVal: number;
      switch (sortBy) {
        case "price": aVal = a.regularMarketPrice; bVal = b.regularMarketPrice; break;
        case "change": aVal = a.change; bVal = b.change; break;
        case "changePercent": aVal = a.changePercent; bVal = b.changePercent; break;
        case "volume": aVal = a.regularMarketVolume; bVal = b.regularMarketVolume; break;
        default: aVal = a.changePercent; bVal = b.changePercent;
      }
      return sortOrder === "desc" ? bVal - aVal : aVal - bVal;
    });

    return filtered;
  }, [allQuotes, filters, sortBy, sortOrder]);

  function addFilter() {
    setFilters([...filters, {
      id: Date.now().toString(),
      field: "price",
      operator: "gt",
      value: "0",
    }]);
  }

  function removeFilter(id: string) {
    setFilters(filters.filter(f => f.id !== id));
  }

  function updateFilter(id: string, key: keyof FilterCondition, value: string) {
    setFilters(filters.map(f => f.id === id ? { ...f, [key]: value } : f));
  }

  async function handleRun() {
    setRunQuery(true);
    setIsLoading(true);
    setError(false);
    try {
      const quotes = await getMultipleQuotes(MAJOR_US_STOCKS);
      setAllQuotes(quotes);
    } catch {
      setError(true);
    } finally {
      setIsLoading(false);
    }
  }

  function handleReset() {
    setFilters([{ id: "1", field: "changePercent", operator: "gt", value: "2" }]);
    setRunQuery(false);
    setAllQuotes([]);
  }

  // Generate query string for display
  const queryString = filters
    .filter(f => f.value)
    .map(f => {
      const fieldLabel = FILTER_FIELDS.find(ff => ff.value === f.field)?.label || f.field;
      const opLabel = OPERATORS.find(o => o.value === f.operator)?.label || f.operator;
      return `${fieldLabel} ${opLabel} ${f.value}`;
    })
    .join(" AND ");

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Header />

      <main className="flex-1 container py-8">
        {/* Page Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Filter className="w-6 h-6 text-primary" />
              Custom Stock Screen
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Build custom filters to screen {MAJOR_US_STOCKS.length} major NYSE & NASDAQ stocks using real-time Yahoo Finance data.
            </p>
          </div>
          <Link href="/screens" className="text-sm text-primary hover:underline">
            ← Back to Screens
          </Link>
        </div>

        {/* Filter Builder */}
        <div className="border border-border rounded-xl p-5 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-sm">Filter Conditions</h3>
            <div className="flex items-center gap-2">
              <button
                onClick={handleReset}
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground px-3 py-1.5 border border-border rounded-lg transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Reset
              </button>
              <button
                onClick={addFilter}
                className="flex items-center gap-1.5 text-xs text-primary hover:underline px-3 py-1.5 border border-border rounded-lg"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Filter
              </button>
            </div>
          </div>

          <div className="space-y-3">
            {filters.map((filter, i) => (
              <div key={filter.id} className="flex items-center gap-2 flex-wrap">
                {i > 0 && <span className="text-xs font-medium text-primary bg-primary/5 px-2 py-0.5 rounded">AND</span>}
                <select
                  value={filter.field}
                  onChange={(e) => updateFilter(filter.id, "field", e.target.value)}
                  className="bg-muted border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  {FILTER_FIELDS.map(f => (
                    <option key={f.value} value={f.value}>{f.label}</option>
                  ))}
                </select>

                <select
                  value={filter.operator}
                  onChange={(e) => updateFilter(filter.id, "operator", e.target.value)}
                  className="bg-muted border border-border rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/20 w-16"
                >
                  {OPERATORS.map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>

                <input
                  type="number"
                  step="any"
                  value={filter.value}
                  onChange={(e) => updateFilter(filter.id, "value", e.target.value)}
                  className="w-28 bg-muted border border-border rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/20"
                />

                {filters.length > 1 && (
                  <button
                    onClick={() => removeFilter(filter.id)}
                    className="p-2 text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Sort Options */}
          <div className="flex items-center gap-3 mt-4 pt-4 border-t border-border">
            <span className="text-xs text-muted-foreground">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-muted border border-border rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="changePercent">% Change</option>
              <option value="price">Price</option>
              <option value="volume">Volume</option>
              <option value="change">Change ($)</option>
            </select>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as any)}
              className="bg-muted border border-border rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="desc">Descending</option>
              <option value="asc">Ascending</option>
            </select>
          </div>

          {/* Query Preview */}
          {queryString && (
            <div className="mt-4 p-3 bg-muted/30 rounded-lg">
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Query Preview</p>
              <code className="text-sm font-mono">{queryString}</code>
            </div>
          )}

          {/* Run Button */}
          <div className="mt-5">
            <button
              onClick={handleRun}
              disabled={isLoading}
              className="flex items-center gap-2 bg-primary text-primary-foreground px-6 py-2.5 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Play className="w-4 h-4" />
              )}
              RUN SCREEN
            </button>
          </div>
        </div>

        {/* Results */}
        {!runQuery ? (
          <div className="flex flex-col items-center justify-center py-16 border border-dashed border-border rounded-xl">
            <Filter className="w-12 h-12 text-muted-foreground/30 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Set your filters and run</h3>
            <p className="text-sm text-muted-foreground text-center max-w-md">
              Configure filter conditions above, then click "Run Screen" to fetch real-time data from Yahoo Finance and apply your filters.
            </p>
          </div>
        ) : isLoading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-primary mb-3" />
            <p className="text-sm text-muted-foreground">Fetching real-time data for {MAJOR_US_STOCKS.length} stocks...</p>
            <p className="text-xs text-muted-foreground mt-1">This may take a moment as we query Yahoo Finance for each stock.</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-16">
            <AlertCircle className="w-10 h-10 text-destructive mb-3" />
            <p className="text-sm font-medium text-destructive">Failed to fetch stock data</p>
            <p className="text-xs text-muted-foreground mt-1">Yahoo Finance API may be temporarily unavailable. Try again later.</p>
          </div>
        ) : (
          <>
            {/* Results Header */}
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">{filteredResults.length}</span> stocks match your filters
                (out of {allQuotes.length} fetched)
              </p>
            </div>

            {filteredResults.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 border border-dashed border-border rounded-xl">
                <AlertCircle className="w-8 h-8 text-muted-foreground mb-3" />
                <p className="text-sm text-muted-foreground">No stocks match your filter criteria.</p>
                <p className="text-xs text-muted-foreground mt-1">Try adjusting your filter values.</p>
              </div>
            ) : (
              <div className="border border-border rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/30 border-b border-border">
                      <tr>
                        <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground">S.No.</th>
                        <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground">Symbol</th>
                        <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground">Name</th>
                        <th className="text-right py-3 px-4 text-xs font-semibold text-muted-foreground">Price</th>
                        <th className="text-right py-3 px-4 text-xs font-semibold text-muted-foreground">Change</th>
                        <th className="text-right py-3 px-4 text-xs font-semibold text-muted-foreground">% Change</th>
                        <th className="text-right py-3 px-4 text-xs font-semibold text-muted-foreground">Volume</th>
                        <th className="text-right py-3 px-4 text-xs font-semibold text-muted-foreground">Day High</th>
                        <th className="text-right py-3 px-4 text-xs font-semibold text-muted-foreground">Day Low</th>
                        <th className="text-right py-3 px-4 text-xs font-semibold text-muted-foreground">52W High</th>
                        <th className="text-right py-3 px-4 text-xs font-semibold text-muted-foreground">52W Low</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredResults.map((q, idx) => (
                        <tr key={q.symbol} className={`border-b border-border hover:bg-accent/30 transition-colors ${idx % 2 === 0 ? "" : "bg-muted/10"}`}>
                          <td className="py-3 px-4 text-xs text-muted-foreground">{idx + 1}.</td>
                          <td className="py-3 px-4">
                            <Link href={`/company/${q.symbol}`} className="font-mono font-medium text-primary hover:underline">
                              {q.symbol}
                            </Link>
                          </td>
                          <td className="py-3 px-4 text-xs text-muted-foreground max-w-[200px] truncate">
                            {q.shortName}
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-medium">
                            ${q.regularMarketPrice.toFixed(2)}
                          </td>
                          <td className={`py-3 px-4 text-right font-mono text-xs ${q.change >= 0 ? "text-[oklch(0.55_0.17_155)]" : "text-[oklch(0.55_0.22_25)]"}`}>
                            <span className="inline-flex items-center gap-0.5 justify-end">
                              {q.change >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                              {q.change >= 0 ? "+" : ""}{q.change.toFixed(2)}
                            </span>
                          </td>
                          <td className={`py-3 px-4 text-right font-mono text-xs font-medium ${q.changePercent >= 0 ? "text-[oklch(0.55_0.17_155)]" : "text-[oklch(0.55_0.22_25)]"}`}>
                            {q.changePercent >= 0 ? "+" : ""}{q.changePercent.toFixed(2)}%
                          </td>
                          <td className="py-3 px-4 text-right font-mono text-xs">{formatVol(q.regularMarketVolume)}</td>
                          <td className="py-3 px-4 text-right font-mono text-xs">${q.regularMarketDayHigh.toFixed(2)}</td>
                          <td className="py-3 px-4 text-right font-mono text-xs">${q.regularMarketDayLow.toFixed(2)}</td>
                          <td className="py-3 px-4 text-right font-mono text-xs">${q.fiftyTwoWeekHigh.toFixed(2)}</td>
                          <td className="py-3 px-4 text-right font-mono text-xs">${q.fiftyTwoWeekLow.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}

        {/* Attribution */}
        <div className="text-center mt-8">
          <p className="text-xs text-muted-foreground">
            All data sourced from Yahoo Finance in real-time. Prices may be delayed up to 15 minutes.
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
}
