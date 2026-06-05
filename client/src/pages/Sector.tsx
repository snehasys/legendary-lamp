import { Link, useParams } from "wouter";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { stocks, sectors, industries, formatMarketCap } from "@/lib/stockData";

export default function Sector() {
  const params = useParams<{ name: string }>();
  const sectorName = decodeURIComponent(params.name || "");
  const sectorStocks = stocks.filter(s => s.sector === sectorName);
  const sectorIndustries = industries[sectorName] || [];

  if (!sectors.includes(sectorName)) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 container py-16 text-center">
          <h1 className="font-display font-bold text-2xl mb-4">Sector Not Found</h1>
          <p className="text-muted-foreground">The sector "{sectorName}" was not found.</p>
          <Link href="/screens" className="text-primary hover:underline mt-4 inline-block">← Back to Screens</Link>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 container py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <Link href="/screens" className="hover:text-primary transition-colors">Screens</Link>
          <span>/</span>
          <span className="text-foreground">{sectorName}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-8">
          {/* Main Content */}
          <div>
            <h1 className="font-display font-bold text-2xl mb-2">{sectorName}</h1>
            <p className="text-muted-foreground text-sm mb-6">
              Browse all NYSE & NASDAQ companies in the {sectorName} sector.
            </p>

            {/* Industries */}
            <div className="flex flex-wrap gap-2 mb-6">
              {sectorIndustries.map((ind) => (
                <span
                  key={ind}
                  className="text-xs bg-muted px-2.5 py-1 rounded-full text-muted-foreground"
                >
                  {ind}
                </span>
              ))}
            </div>

            {/* Stocks Table */}
            {sectorStocks.length > 0 ? (
              <div className="border border-border rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="data-table">
                    <thead>
                      <tr className="bg-muted/30">
                        <th>S.No.</th>
                        <th>Name</th>
                        <th>Industry</th>
                        <th className="numeric">CMP $</th>
                        <th className="numeric">Change %</th>
                        <th className="numeric">P/E</th>
                        <th className="numeric">Market Cap</th>
                        <th className="numeric">ROCE %</th>
                        <th className="numeric">Div Yld %</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sectorStocks.map((stock, i) => (
                        <tr key={stock.symbol}>
                          <td className="text-muted-foreground">{i + 1}.</td>
                          <td>
                            <Link href={`/company/${stock.symbol}`} className="hover:text-primary transition-colors">
                              <span className="font-medium">{stock.name}</span>
                              <span className="text-xs text-muted-foreground ml-1.5">{stock.symbol}</span>
                            </Link>
                          </td>
                          <td className="text-muted-foreground text-xs">{stock.industry}</td>
                          <td className="numeric">{stock.price.toFixed(2)}</td>
                          <td className="numeric">
                            <span className={`flex items-center justify-end gap-0.5 ${stock.changePercent >= 0 ? "gain" : "loss"}`}>
                              {stock.changePercent >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                              {Math.abs(stock.changePercent).toFixed(2)}%
                            </span>
                          </td>
                          <td className="numeric">{stock.pe.toFixed(1)}</td>
                          <td className="numeric">{formatMarketCap(stock.marketCap)}</td>
                          <td className="numeric">{stock.roce.toFixed(1)}</td>
                          <td className="numeric">{stock.dividendYield.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="border border-border rounded-xl p-8 text-center">
                <p className="text-muted-foreground">No stocks found in this sector in our current database.</p>
                <p className="text-xs text-muted-foreground mt-2">Try browsing other sectors or using the search.</p>
              </div>
            )}
          </div>

          {/* Sidebar - All Sectors */}
          <aside className="hidden lg:block">
            <div className="sticky top-20 border border-border rounded-xl p-5">
              <h3 className="font-display font-semibold text-sm mb-4">All Sectors</h3>
              <ul className="space-y-1">
                {sectors.map((sector) => (
                  <li key={sector}>
                    <Link
                      href={`/sector/${encodeURIComponent(sector)}`}
                      className={`block text-sm px-2 py-1.5 rounded transition-colors ${
                        sector === sectorName
                          ? "text-primary bg-primary/5 font-medium"
                          : "text-muted-foreground hover:text-primary hover:bg-primary/5"
                      }`}
                    >
                      {sector}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        </div>
      </main>
      <Footer />
    </div>
  );
}
