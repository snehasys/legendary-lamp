import { useState, useMemo } from "react";
import { Link, useParams } from "wouter";
import { ExternalLink, Download, Plus, ArrowUpRight, ArrowDownRight, ChevronRight, FileText, Calendar } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import {
  stocks, getPeers, getFinancialData, getBalanceSheetData, getCashFlowData,
  getQuarterlyData, getRatioData, getShareholdingData, getPriceHistory,
  formatMarketCap, formatLargeNumber
} from "@/lib/stockData";
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell
} from "recharts";

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center py-1.5">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-mono font-medium">{value}</span>
    </div>
  );
}

export default function Company() {
  const params = useParams<{ symbol: string }>();
  const symbol = params.symbol?.toUpperCase() || "";
  const stock = stocks.find(s => s.symbol === symbol);
  const [activeTab, setActiveTab] = useState("chart");
  const [chartPeriod, setChartPeriod] = useState("1Y");
  const [chartType, setChartType] = useState<"price" | "pe">("price");

  const peers = useMemo(() => stock ? getPeers(symbol) : [], [symbol]);
  const financials = useMemo(() => getFinancialData(symbol), [symbol]);
  const balanceSheet = useMemo(() => getBalanceSheetData(symbol), [symbol]);
  const cashFlow = useMemo(() => getCashFlowData(symbol), [symbol]);
  const quarterly = useMemo(() => getQuarterlyData(symbol), [symbol]);
  const ratios = useMemo(() => getRatioData(symbol), [symbol]);
  const shareholding = useMemo(() => getShareholdingData(symbol), [symbol]);
  const priceHistory = useMemo(() => getPriceHistory(symbol, chartPeriod), [symbol, chartPeriod]);

  if (!stock) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 container py-16 text-center">
          <h1 className="font-display font-bold text-2xl mb-4">Company Not Found</h1>
          <p className="text-muted-foreground">The symbol "{symbol}" was not found in our database.</p>
          <Link href="/" className="text-primary hover:underline mt-4 inline-block">← Back to Home</Link>
        </main>
        <Footer />
      </div>
    );
  }

  const tabs = [
    { id: "chart", label: "Chart" },
    { id: "analysis", label: "Analysis" },
    { id: "peers", label: "Peers" },
    { id: "quarters", label: "Quarters" },
    { id: "pnl", label: "Profit & Loss" },
    { id: "balance", label: "Balance Sheet" },
    { id: "cashflow", label: "Cash Flow" },
    { id: "ratios", label: "Ratios" },
    { id: "investors", label: "Investors" },
    { id: "documents", label: "Documents" },
  ];

  const periods = ["1M", "6M", "1Y", "3Y", "5Y", "Max"];
  const COLORS = ["#16a34a", "#2563eb", "#d97706", "#7c3aed"];

  // Generate mock documents
  const documents = [
    { type: "10-K", title: "Annual Report 2024", date: "Feb 2025", url: "#" },
    { type: "10-Q", title: "Quarterly Report Q1 2025", date: "May 2025", url: "#" },
    { type: "10-Q", title: "Quarterly Report Q4 2024", date: "Jan 2025", url: "#" },
    { type: "10-Q", title: "Quarterly Report Q3 2024", date: "Oct 2024", url: "#" },
    { type: "8-K", title: "Current Report - Earnings", date: "Apr 2025", url: "#" },
    { type: "DEF 14A", title: "Proxy Statement 2025", date: "Mar 2025", url: "#" },
    { type: "10-K", title: "Annual Report 2023", date: "Feb 2024", url: "#" },
    { type: "10-Q", title: "Quarterly Report Q2 2024", date: "Jul 2024", url: "#" },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      {/* Sub-navigation */}
      <div className="border-b border-border bg-background sticky top-14 z-40">
        <div className="container">
          <div className="flex items-center gap-1 overflow-x-auto py-2 scrollbar-hide">
            <span className="text-sm font-medium text-foreground px-2 py-1 shrink-0">
              {stock.name}
            </span>
            <span className="text-border mx-1">|</span>
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`text-sm px-2.5 py-1 rounded shrink-0 transition-colors ${
                  activeTab === tab.id
                    ? "text-primary font-medium bg-primary/5"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <main className="flex-1 container py-6">
        {/* Company Header */}
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-6">
          <div>
            <h1 className="font-display font-bold text-2xl">{stock.name}</h1>
            <div className="flex items-center gap-3 mt-2">
              <span className="text-2xl font-mono font-semibold">${stock.price.toFixed(2)}</span>
              <span className={`flex items-center gap-0.5 text-sm font-medium ${stock.change >= 0 ? "gain" : "loss"}`}>
                {stock.change >= 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                {stock.change >= 0 ? "+" : ""}{stock.change.toFixed(2)} ({stock.changePercent.toFixed(2)}%)
              </span>
              <span className="text-xs text-muted-foreground">04 Jun - close price</span>
            </div>
            <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
              <a href="#" className="flex items-center gap-1 hover:text-primary transition-colors">
                <ExternalLink className="w-3 h-3" /> Website
              </a>
              <span>{stock.exchange}: {stock.symbol}</span>
              <Link href={`/sector/${encodeURIComponent(stock.sector)}`} className="hover:text-primary transition-colors">
                {stock.sector}
              </Link>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-1.5 border border-border px-3 py-2 rounded-lg text-sm hover:bg-accent transition-colors">
              <Download className="w-4 h-4" /> EXPORT TO EXCEL
            </button>
            <button className="flex items-center gap-1.5 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity">
              <Plus className="w-4 h-4" /> FOLLOW
            </button>
          </div>
        </div>

        {/* Key Metrics + About */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 mb-8">
          <div className="border border-border rounded-xl p-5">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-x-8 gap-y-0">
              <MetricCard label="Market Cap" value={formatMarketCap(stock.marketCap)} />
              <MetricCard label="Current Price" value={`$${stock.price.toFixed(2)}`} />
              <MetricCard label="High / Low" value={`$${stock.high52w} / $${stock.low52w}`} />
              <MetricCard label="Stock P/E" value={stock.pe.toFixed(1)} />
              <MetricCard label="Book Value" value={`$${stock.bookValue.toFixed(2)}`} />
              <MetricCard label="Dividend Yield" value={`${stock.dividendYield.toFixed(2)}%`} />
              <MetricCard label="ROCE" value={`${stock.roce.toFixed(1)}%`} />
              <MetricCard label="ROE" value={`${stock.roe.toFixed(1)}%`} />
              <MetricCard label="EPS (TTM)" value={`$${stock.eps.toFixed(2)}`} />
              <MetricCard label="Debt/Equity" value={stock.debtToEquity.toFixed(2)} />
              <MetricCard label="Current Ratio" value={stock.currentRatio.toFixed(2)} />
              <MetricCard label="Beta" value={stock.beta.toFixed(2)} />
            </div>
          </div>
          <div className="space-y-4">
            <div className="border border-border rounded-xl p-5">
              <h3 className="font-display font-semibold text-sm mb-2 uppercase tracking-wide">About</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{stock.about}</p>
            </div>
            <div className="border border-border rounded-xl p-5">
              <h3 className="font-display font-semibold text-sm mb-2 uppercase tracking-wide">Key Points</h3>
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Sector</span>
                  <Link href={`/sector/${encodeURIComponent(stock.sector)}`} className="text-primary hover:underline">{stock.sector}</Link>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Industry</span>
                  <span>{stock.industry}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Exchange</span>
                  <span>{stock.exchange}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Revenue Growth</span>
                  <span className={stock.revenueGrowth >= 0 ? "gain" : "loss"}>{stock.revenueGrowth}%</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Profit Growth</span>
                  <span className={stock.profitGrowth >= 0 ? "gain" : "loss"}>{stock.profitGrowth}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Price Chart */}
        {(activeTab === "chart" || activeTab === "analysis") && (
          <section className="mb-8 border border-border rounded-xl p-5" id="chart">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <h2 className="font-display font-semibold">Price Chart</h2>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1">
                  {periods.map((p) => (
                    <button
                      key={p}
                      onClick={() => setChartPeriod(p)}
                      className={`px-2.5 py-1 text-xs rounded transition-colors ${
                        chartPeriod === p ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent"
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-1 border-l border-border pl-3">
                  <button
                    onClick={() => setChartType("price")}
                    className={`px-2.5 py-1 text-xs rounded transition-colors ${chartType === "price" ? "bg-accent font-medium" : "text-muted-foreground"}`}
                  >
                    Price
                  </button>
                  <button
                    onClick={() => setChartType("pe")}
                    className={`px-2.5 py-1 text-xs rounded transition-colors ${chartType === "pe" ? "bg-accent font-medium" : "text-muted-foreground"}`}
                  >
                    PE Ratio
                  </button>
                </div>
              </div>
            </div>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={priceHistory} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
                  <defs>
                    <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="oklch(0.72 0.19 155)" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="oklch(0.72 0.19 155)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.92 0.003 260)" vertical={false} />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 10, fill: "oklch(0.5 0.02 260)" }}
                    tickFormatter={(d) => new Date(d).toLocaleDateString("en-US", { month: "short", year: "2-digit" })}
                    interval="preserveStartEnd"
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: "oklch(0.5 0.02 260)" }}
                    domain={["auto", "auto"]}
                    tickFormatter={(v) => `$${v}`}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid oklch(0.92 0.003 260)", boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }}
                    formatter={(value: number) => [`$${value.toFixed(2)}`, "Price"]}
                    labelFormatter={(label) => new Date(label).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                  />
                  <Area type="monotone" dataKey="price" stroke="oklch(0.45 0.12 155)" fill="url(#priceGradient)" strokeWidth={1.5} dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            {/* Volume Chart */}
            <div className="h-[60px] mt-1">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={priceHistory.filter((_, i) => i % 4 === 0)} margin={{ top: 0, right: 5, bottom: 0, left: 5 }}>
                  <Bar dataKey="volume" fill="oklch(0.72 0.19 155 / 0.25)" radius={[1, 1, 0, 0]} />
                  <XAxis dataKey="date" hide />
                  <YAxis hide />
                  <Tooltip
                    contentStyle={{ fontSize: 11, borderRadius: 6 }}
                    formatter={(value: number) => [formatLargeNumber(value), "Volume"]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
              <label className="flex items-center gap-1.5">
                <input type="checkbox" defaultChecked className="rounded border-border" /> Price
              </label>
              <label className="flex items-center gap-1.5">
                <input type="checkbox" className="rounded border-border" /> 50 DMA
              </label>
              <label className="flex items-center gap-1.5">
                <input type="checkbox" className="rounded border-border" /> 200 DMA
              </label>
              <label className="flex items-center gap-1.5">
                <input type="checkbox" defaultChecked className="rounded border-border" /> Volume
              </label>
            </div>
          </section>
        )}

        {/* Pros & Cons */}
        {(activeTab === "analysis" || activeTab === "chart") && (
          <section className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border border-border rounded-xl p-5">
              <h3 className="font-display font-semibold text-sm mb-3 uppercase tracking-wide">Pros</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                {stock.roe > 20 && <li className="flex gap-2"><span className="gain font-medium">✓</span> Strong ROE of {stock.roe.toFixed(1)}% indicates efficient use of shareholder equity.</li>}
                {stock.revenueGrowth > 10 && <li className="flex gap-2"><span className="gain font-medium">✓</span> Revenue growth of {stock.revenueGrowth}% exceeds industry average.</li>}
                {stock.currentRatio > 1.5 && <li className="flex gap-2"><span className="gain font-medium">✓</span> Healthy current ratio of {stock.currentRatio.toFixed(2)} indicates good liquidity.</li>}
                {stock.dividendYield > 1 && <li className="flex gap-2"><span className="gain font-medium">✓</span> Consistent dividend payer with {stock.dividendYield.toFixed(2)}% yield.</li>}
                {stock.roce > 25 && <li className="flex gap-2"><span className="gain font-medium">✓</span> Excellent ROCE of {stock.roce.toFixed(1)}% shows efficient capital allocation.</li>}
                {stock.profitGrowth > 15 && <li className="flex gap-2"><span className="gain font-medium">✓</span> Profit growth of {stock.profitGrowth}% demonstrates strong earnings momentum.</li>}
              </ul>
            </div>
            <div className="border border-border rounded-xl p-5">
              <h3 className="font-display font-semibold text-sm mb-3 uppercase tracking-wide">Cons</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                {stock.pe > 40 && <li className="flex gap-2"><span className="loss font-medium">✗</span> High P/E ratio of {stock.pe.toFixed(1)} suggests stock may be overvalued.</li>}
                {stock.debtToEquity > 1.5 && <li className="flex gap-2"><span className="loss font-medium">✗</span> High debt-to-equity ratio of {stock.debtToEquity.toFixed(2)} indicates leverage risk.</li>}
                {stock.dividendYield === 0 && <li className="flex gap-2"><span className="loss font-medium">✗</span> Company does not pay dividends to shareholders.</li>}
                {stock.profitGrowth < 0 && <li className="flex gap-2"><span className="loss font-medium">✗</span> Declining profits with {stock.profitGrowth}% growth rate.</li>}
                {stock.beta > 1.5 && <li className="flex gap-2"><span className="loss font-medium">✗</span> High beta of {stock.beta.toFixed(2)} indicates above-average volatility.</li>}
                {stock.currentRatio < 1 && <li className="flex gap-2"><span className="loss font-medium">✗</span> Current ratio below 1 ({stock.currentRatio.toFixed(2)}) may indicate liquidity concerns.</li>}
              </ul>
            </div>
            <p className="text-xs text-muted-foreground col-span-full italic">* The pros and cons are machine generated based on financial metrics.</p>
          </section>
        )}

        {/* Peer Comparison */}
        {(activeTab === "peers" || activeTab === "analysis") && (
          <section className="mb-8 border border-border rounded-xl p-5" id="peers">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-display font-semibold">Peer Comparison</h2>
                <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                  <Link href={`/sector/${encodeURIComponent(stock.sector)}`} className="hover:text-primary">{stock.sector}</Link>
                  <ChevronRight className="w-3 h-3" />
                  <span>{stock.industry}</span>
                </div>
              </div>
              <button className="text-xs text-primary hover:underline">Edit Columns</button>
            </div>
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>S.No.</th>
                    <th>Name</th>
                    <th className="numeric">CMP $</th>
                    <th className="numeric">P/E</th>
                    <th className="numeric">Mar Cap</th>
                    <th className="numeric">Div Yld %</th>
                    <th className="numeric">ROCE %</th>
                    <th className="numeric">ROE %</th>
                    <th className="numeric">D/E</th>
                    <th className="numeric">Rev Growth %</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="bg-primary/[0.03]">
                    <td>1.</td>
                    <td><span className="font-medium">{stock.name}</span></td>
                    <td className="numeric">{stock.price.toFixed(2)}</td>
                    <td className="numeric">{stock.pe.toFixed(1)}</td>
                    <td className="numeric">{formatMarketCap(stock.marketCap)}</td>
                    <td className="numeric">{stock.dividendYield.toFixed(2)}</td>
                    <td className="numeric">{stock.roce.toFixed(1)}</td>
                    <td className="numeric">{stock.roe.toFixed(1)}</td>
                    <td className="numeric">{stock.debtToEquity.toFixed(2)}</td>
                    <td className="numeric"><span className={stock.revenueGrowth >= 0 ? "gain" : "loss"}>{stock.revenueGrowth}%</span></td>
                  </tr>
                  {peers.map((peer, i) => (
                    <tr key={peer.symbol}>
                      <td>{i + 2}.</td>
                      <td><Link href={`/company/${peer.symbol}`} className="hover:text-primary">{peer.name}</Link></td>
                      <td className="numeric">{peer.price.toFixed(2)}</td>
                      <td className="numeric">{peer.pe.toFixed(1)}</td>
                      <td className="numeric">{formatMarketCap(peer.marketCap)}</td>
                      <td className="numeric">{peer.dividendYield.toFixed(2)}</td>
                      <td className="numeric">{peer.roce.toFixed(1)}</td>
                      <td className="numeric">{peer.roe.toFixed(1)}</td>
                      <td className="numeric">{peer.debtToEquity.toFixed(2)}</td>
                      <td className="numeric"><span className={peer.revenueGrowth >= 0 ? "gain" : "loss"}>{peer.revenueGrowth}%</span></td>
                    </tr>
                  ))}
                  {/* Median row */}
                  <tr className="border-t-2 bg-muted/30">
                    <td></td>
                    <td className="font-medium text-muted-foreground">Median</td>
                    <td className="numeric text-muted-foreground">
                      {([stock, ...peers].reduce((a, s) => a + s.price, 0) / (peers.length + 1)).toFixed(2)}
                    </td>
                    <td className="numeric text-muted-foreground">
                      {([stock, ...peers].reduce((a, s) => a + s.pe, 0) / (peers.length + 1)).toFixed(1)}
                    </td>
                    <td className="numeric text-muted-foreground">—</td>
                    <td className="numeric text-muted-foreground">
                      {([stock, ...peers].reduce((a, s) => a + s.dividendYield, 0) / (peers.length + 1)).toFixed(2)}
                    </td>
                    <td className="numeric text-muted-foreground">
                      {([stock, ...peers].reduce((a, s) => a + s.roce, 0) / (peers.length + 1)).toFixed(1)}
                    </td>
                    <td className="numeric text-muted-foreground">
                      {([stock, ...peers].reduce((a, s) => a + s.roe, 0) / (peers.length + 1)).toFixed(1)}
                    </td>
                    <td className="numeric text-muted-foreground">—</td>
                    <td className="numeric text-muted-foreground">—</td>
                  </tr>
                </tbody>
              </table>
            </div>
            {/* Detailed comparison search */}
            <div className="mt-4 flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Detailed Comparison with:</span>
              <input
                type="text"
                placeholder="e.g. MSFT"
                className="px-3 py-1.5 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 w-40"
              />
            </div>
          </section>
        )}

        {/* Quarterly Results */}
        {(activeTab === "quarters" || activeTab === "analysis") && (
          <section className="mb-8 border border-border rounded-xl p-5" id="quarters">
            <h2 className="font-display font-semibold mb-1">Quarterly Results</h2>
            <p className="text-xs text-muted-foreground mb-4">Figures in $ Millions</p>
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th></th>
                    {quarterly.map(q => <th key={q.quarter} className="numeric">{q.quarter}</th>)}
                  </tr>
                </thead>
                <tbody>
                  <tr><td className="font-medium">Revenue</td>{quarterly.map(q => <td key={q.quarter} className="numeric">{formatLargeNumber(q.revenue)}</td>)}</tr>
                  <tr><td className="font-medium">Expenses</td>{quarterly.map(q => <td key={q.quarter} className="numeric">{formatLargeNumber(q.expenses)}</td>)}</tr>
                  <tr><td className="font-medium">Operating Profit</td>{quarterly.map(q => <td key={q.quarter} className="numeric">{formatLargeNumber(q.operatingProfit)}</td>)}</tr>
                  <tr><td className="font-medium">OPM %</td>{quarterly.map(q => <td key={q.quarter} className="numeric">{q.opm}%</td>)}</tr>
                  <tr><td className="font-medium">Other Income</td>{quarterly.map(q => <td key={q.quarter} className="numeric">{formatLargeNumber(q.otherIncome)}</td>)}</tr>
                  <tr><td className="font-medium">Interest</td>{quarterly.map(q => <td key={q.quarter} className="numeric">{formatLargeNumber(q.interest)}</td>)}</tr>
                  <tr><td className="font-medium">Depreciation</td>{quarterly.map(q => <td key={q.quarter} className="numeric">{formatLargeNumber(q.depreciation)}</td>)}</tr>
                  <tr><td className="font-medium">Profit Before Tax</td>{quarterly.map(q => <td key={q.quarter} className="numeric">{formatLargeNumber(q.profitBeforeTax)}</td>)}</tr>
                  <tr><td className="font-medium">Tax %</td>{quarterly.map(q => <td key={q.quarter} className="numeric">{q.taxPercent}%</td>)}</tr>
                  <tr className="font-semibold bg-muted/20"><td className="font-medium">Net Profit</td>{quarterly.map(q => <td key={q.quarter} className="numeric">{formatLargeNumber(q.netProfit)}</td>)}</tr>
                  <tr><td className="font-medium">EPS $</td>{quarterly.map(q => <td key={q.quarter} className="numeric">{q.eps.toFixed(2)}</td>)}</tr>
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* Profit & Loss */}
        {(activeTab === "pnl" || activeTab === "analysis") && (
          <section className="mb-8 border border-border rounded-xl p-5" id="pnl">
            <h2 className="font-display font-semibold mb-1">Profit & Loss</h2>
            <p className="text-xs text-muted-foreground mb-4">Annual Figures in $ Millions</p>
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th></th>
                    {financials.map(f => <th key={f.year} className="numeric">{f.year}</th>)}
                  </tr>
                </thead>
                <tbody>
                  <tr><td className="font-medium">Revenue</td>{financials.map(f => <td key={f.year} className="numeric">{formatLargeNumber(f.revenue)}</td>)}</tr>
                  <tr><td className="font-medium">Expenses</td>{financials.map(f => <td key={f.year} className="numeric">{formatLargeNumber(f.expenses)}</td>)}</tr>
                  <tr><td className="font-medium">Operating Profit</td>{financials.map(f => <td key={f.year} className="numeric">{formatLargeNumber(f.operatingProfit)}</td>)}</tr>
                  <tr><td className="font-medium">OPM %</td>{financials.map(f => <td key={f.year} className="numeric">{f.opm}%</td>)}</tr>
                  <tr><td className="font-medium">Other Income</td>{financials.map(f => <td key={f.year} className="numeric">{formatLargeNumber(f.otherIncome)}</td>)}</tr>
                  <tr><td className="font-medium">Interest</td>{financials.map(f => <td key={f.year} className="numeric">{formatLargeNumber(f.interest)}</td>)}</tr>
                  <tr><td className="font-medium">Depreciation</td>{financials.map(f => <td key={f.year} className="numeric">{formatLargeNumber(f.depreciation)}</td>)}</tr>
                  <tr><td className="font-medium">Profit Before Tax</td>{financials.map(f => <td key={f.year} className="numeric">{formatLargeNumber(f.profitBeforeTax)}</td>)}</tr>
                  <tr><td className="font-medium">Tax %</td>{financials.map(f => <td key={f.year} className="numeric">{f.taxPercent}%</td>)}</tr>
                  <tr className="font-semibold bg-muted/20"><td className="font-medium">Net Profit</td>{financials.map(f => <td key={f.year} className="numeric">{formatLargeNumber(f.netProfit)}</td>)}</tr>
                  <tr><td className="font-medium">EPS $</td>{financials.map(f => <td key={f.year} className="numeric">{f.eps.toFixed(2)}</td>)}</tr>
                </tbody>
              </table>
            </div>
            {/* Revenue & Profit Chart */}
            <div className="mt-6 h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={financials} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.92 0.003 260)" vertical={false} />
                  <XAxis dataKey="year" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => formatLargeNumber(v)} axisLine={false} tickLine={false} />
                  <Tooltip formatter={(value: number) => formatLargeNumber(value)} />
                  <Bar dataKey="revenue" fill="oklch(0.55 0.15 250 / 0.7)" name="Revenue" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="netProfit" fill="oklch(0.72 0.19 155)" name="Net Profit" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>
        )}

        {/* Balance Sheet */}
        {(activeTab === "balance" || activeTab === "analysis") && (
          <section className="mb-8 border border-border rounded-xl p-5" id="balance">
            <h2 className="font-display font-semibold mb-1">Balance Sheet</h2>
            <p className="text-xs text-muted-foreground mb-4">Annual Figures in $ Millions</p>
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th></th>
                    {balanceSheet.map(b => <th key={b.year} className="numeric">{b.year}</th>)}
                  </tr>
                </thead>
                <tbody>
                  <tr><td className="font-medium">Equity Capital</td>{balanceSheet.map(b => <td key={b.year} className="numeric">{formatLargeNumber(b.equity)}</td>)}</tr>
                  <tr><td className="font-medium">Reserves</td>{balanceSheet.map(b => <td key={b.year} className="numeric">{formatLargeNumber(b.reserves)}</td>)}</tr>
                  <tr><td className="font-medium">Borrowings</td>{balanceSheet.map(b => <td key={b.year} className="numeric">{formatLargeNumber(b.borrowings)}</td>)}</tr>
                  <tr><td className="font-medium">Other Liabilities</td>{balanceSheet.map(b => <td key={b.year} className="numeric">{formatLargeNumber(b.otherLiabilities)}</td>)}</tr>
                  <tr className="font-semibold border-t-2 bg-muted/20"><td className="font-medium">Total Liabilities</td>{balanceSheet.map(b => <td key={b.year} className="numeric">{formatLargeNumber(b.totalLiabilities)}</td>)}</tr>
                  <tr><td className="font-medium">Fixed Assets</td>{balanceSheet.map(b => <td key={b.year} className="numeric">{formatLargeNumber(b.fixedAssets)}</td>)}</tr>
                  <tr><td className="font-medium">Investments</td>{balanceSheet.map(b => <td key={b.year} className="numeric">{formatLargeNumber(b.investments)}</td>)}</tr>
                  <tr><td className="font-medium">Other Assets</td>{balanceSheet.map(b => <td key={b.year} className="numeric">{formatLargeNumber(b.otherAssets)}</td>)}</tr>
                  <tr className="font-semibold border-t-2 bg-muted/20"><td className="font-medium">Total Assets</td>{balanceSheet.map(b => <td key={b.year} className="numeric">{formatLargeNumber(b.totalAssets)}</td>)}</tr>
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* Cash Flow */}
        {(activeTab === "cashflow" || activeTab === "analysis") && (
          <section className="mb-8 border border-border rounded-xl p-5" id="cashflow">
            <h2 className="font-display font-semibold mb-1">Cash Flows</h2>
            <p className="text-xs text-muted-foreground mb-4">Annual Figures in $ Millions</p>
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th></th>
                    {cashFlow.map(c => <th key={c.year} className="numeric">{c.year}</th>)}
                  </tr>
                </thead>
                <tbody>
                  <tr><td className="font-medium">Cash from Operating Activity</td>{cashFlow.map(c => <td key={c.year} className="numeric">{formatLargeNumber(c.operatingCashFlow)}</td>)}</tr>
                  <tr><td className="font-medium">Cash from Investing Activity</td>{cashFlow.map(c => <td key={c.year} className={`numeric ${c.investingCashFlow < 0 ? "loss" : ""}`}>{formatLargeNumber(c.investingCashFlow)}</td>)}</tr>
                  <tr><td className="font-medium">Cash from Financing Activity</td>{cashFlow.map(c => <td key={c.year} className={`numeric ${c.financingCashFlow < 0 ? "loss" : ""}`}>{formatLargeNumber(c.financingCashFlow)}</td>)}</tr>
                  <tr className="font-semibold border-t-2 bg-muted/20"><td className="font-medium">Net Cash Flow</td>{cashFlow.map(c => <td key={c.year} className={`numeric ${c.netCashFlow < 0 ? "loss" : "gain"}`}>{formatLargeNumber(c.netCashFlow)}</td>)}</tr>
                  <tr><td className="font-medium">Free Cash Flow</td>{cashFlow.map(c => <td key={c.year} className={`numeric ${c.freeCashFlow < 0 ? "loss" : "gain"}`}>{formatLargeNumber(c.freeCashFlow)}</td>)}</tr>
                </tbody>
              </table>
            </div>
            <div className="mt-6 h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={cashFlow} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.92 0.003 260)" vertical={false} />
                  <XAxis dataKey="year" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => formatLargeNumber(v)} axisLine={false} tickLine={false} />
                  <Tooltip formatter={(value: number) => formatLargeNumber(value)} />
                  <Bar dataKey="operatingCashFlow" fill="oklch(0.72 0.19 155)" name="Operating" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="freeCashFlow" fill="oklch(0.55 0.15 250 / 0.7)" name="Free Cash Flow" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>
        )}

        {/* Ratios */}
        {(activeTab === "ratios" || activeTab === "analysis") && (
          <section className="mb-8 border border-border rounded-xl p-5" id="ratios">
            <h2 className="font-display font-semibold mb-4">Ratios</h2>
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th></th>
                    {ratios.map(r => <th key={r.year} className="numeric">{r.year}</th>)}
                  </tr>
                </thead>
                <tbody>
                  <tr><td className="font-medium">Debtor Days</td>{ratios.map(r => <td key={r.year} className="numeric">{r.debtorDays}</td>)}</tr>
                  <tr><td className="font-medium">Inventory Days</td>{ratios.map(r => <td key={r.year} className="numeric">{r.inventoryDays}</td>)}</tr>
                  <tr><td className="font-medium">Days Payable</td>{ratios.map(r => <td key={r.year} className="numeric">{r.daysPayable}</td>)}</tr>
                  <tr><td className="font-medium">Cash Conversion Cycle</td>{ratios.map(r => <td key={r.year} className="numeric">{r.cashConversionCycle}</td>)}</tr>
                  <tr><td className="font-medium">Working Capital Days</td>{ratios.map(r => <td key={r.year} className="numeric">{r.workingCapitalDays}</td>)}</tr>
                  <tr><td className="font-medium">ROCE %</td>{ratios.map(r => <td key={r.year} className="numeric">{r.roce}%</td>)}</tr>
                  <tr><td className="font-medium">ROE %</td>{ratios.map(r => <td key={r.year} className="numeric">{r.roe}%</td>)}</tr>
                </tbody>
              </table>
            </div>
            <div className="mt-6 h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={ratios} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.92 0.003 260)" vertical={false} />
                  <XAxis dataKey="year" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${v}%`} axisLine={false} tickLine={false} />
                  <Tooltip formatter={(value: number) => `${value}%`} />
                  <Line type="monotone" dataKey="roce" stroke="oklch(0.72 0.19 155)" strokeWidth={2} name="ROCE" dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="roe" stroke="oklch(0.55 0.15 250)" strokeWidth={2} name="ROE" dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </section>
        )}

        {/* Shareholding Pattern */}
        {(activeTab === "investors" || activeTab === "analysis") && (
          <section className="mb-8 border border-border rounded-xl p-5" id="investors">
            <h2 className="font-display font-semibold mb-4">Shareholding Pattern</h2>
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6">
              <div className="overflow-x-auto">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th></th>
                      {shareholding.map(s => <th key={s.quarter} className="numeric">{s.quarter}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    <tr><td className="font-medium">Promoters / Insiders</td>{shareholding.map(s => <td key={s.quarter} className="numeric">{s.promoters}%</td>)}</tr>
                    <tr><td className="font-medium">FIIs / Foreign Institutions</td>{shareholding.map(s => <td key={s.quarter} className="numeric">{s.fii}%</td>)}</tr>
                    <tr><td className="font-medium">DIIs / Domestic Institutions</td>{shareholding.map(s => <td key={s.quarter} className="numeric">{s.dii}%</td>)}</tr>
                    <tr><td className="font-medium">Public / Retail</td>{shareholding.map(s => <td key={s.quarter} className="numeric">{s.public}%</td>)}</tr>
                  </tbody>
                </table>
              </div>
              <div className="flex flex-col items-center">
                <p className="text-xs text-muted-foreground mb-2">Latest: {shareholding[shareholding.length - 1]?.quarter}</p>
                <div className="h-[200px] w-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          { name: "Insiders", value: shareholding[shareholding.length - 1]?.promoters || 0 },
                          { name: "FIIs", value: shareholding[shareholding.length - 1]?.fii || 0 },
                          { name: "DIIs", value: shareholding[shareholding.length - 1]?.dii || 0 },
                          { name: "Public", value: shareholding[shareholding.length - 1]?.public || 0 },
                        ]}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {COLORS.map((color, index) => (
                          <Cell key={`cell-${index}`} fill={color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => `${value}%`} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex flex-wrap gap-3 mt-2 justify-center">
                  {["Insiders", "FIIs", "DIIs", "Public"].map((label, i) => (
                    <div key={label} className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i] }} />
                      <span className="text-xs text-muted-foreground">{label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Documents */}
        {(activeTab === "documents" || activeTab === "analysis") && (
          <section className="mb-8 border border-border rounded-xl p-5" id="documents">
            <h2 className="font-display font-semibold mb-4">SEC Filings & Documents</h2>
            <div className="space-y-2">
              {documents.map((doc, i) => (
                <a
                  key={i}
                  href={doc.url}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-accent/50 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                    <div>
                      <span className="text-sm font-medium group-hover:text-primary transition-colors">{doc.title}</span>
                      <span className="text-xs text-muted-foreground ml-2 bg-muted px-1.5 py-0.5 rounded">{doc.type}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Calendar className="w-3 h-3" />
                    {doc.date}
                  </div>
                </a>
              ))}
            </div>
          </section>
        )}
      </main>

      <Footer />
    </div>
  );
}
