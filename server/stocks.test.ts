import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock the Yahoo Finance data API
vi.mock("./_core/dataApi", () => ({
  callDataApi: vi.fn(async (endpoint: string, params: any) => {
    const symbol = params?.query?.symbol || "AAPL";

    if (endpoint === "YahooFinance/get_stock_chart") {
      return {
        chart: {
          result: [
            {
              meta: {
                symbol,
                shortName: `${symbol} Inc`,
                longName: `${symbol} Inc`,
                currency: "USD",
                exchangeName: "NMS",
                fullExchangeName: "NasdaqGS",
                instrumentType: "EQUITY",
                regularMarketPrice: 195.5,
                regularMarketDayHigh: 197.2,
                regularMarketDayLow: 193.8,
                regularMarketVolume: 45000000,
                regularMarketOpen: 194.0,
                fiftyTwoWeekHigh: 220.0,
                fiftyTwoWeekLow: 150.0,
                chartPreviousClose: 193.0,
                regularMarketTime: 1717459200,
              },
              timestamp: [1717459200, 1717545600],
              indicators: {
                quote: [
                  {
                    open: [194.0, 195.5],
                    high: [197.2, 196.8],
                    low: [193.8, 194.2],
                    close: [195.5, 196.0],
                    volume: [45000000, 42000000],
                  },
                ],
                adjclose: [{ adjclose: [195.5, 196.0] }],
              },
              events: {},
            },
          ],
        },
      };
    }

    if (endpoint === "YahooFinance/get_stock_profile") {
      return {
        quoteSummary: {
          result: [
            {
              summaryProfile: {
                address1: "One Apple Park Way",
                city: "Cupertino",
                state: "CA",
                country: "United States",
                phone: "408-996-1010",
                website: "https://www.apple.com",
                industryDisp: "Consumer Electronics",
                industryKey: "consumer-electronics",
                sectorDisp: "Technology",
                sectorKey: "technology",
                longBusinessSummary: "Apple Inc. designs, manufactures, and markets smartphones...",
                fullTimeEmployees: 164000,
                companyOfficers: [
                  { name: "Tim Cook", title: "CEO", age: 63, totalPay: { raw: 16000000 } },
                ],
              },
            },
          ],
        },
      };
    }

    if (endpoint === "YahooFinance/get_stock_insights") {
      return {
        finance: {
          result: {
            recommendation: {
              targetPrice: 210.0,
              provider: "Argus Research",
              rating: "BUY",
            },
            instrumentInfo: {
              technicalEvents: {
                provider: "Trading Central",
                sector: "Technology",
                shortTermOutlook: { direction: "Bullish", score: 7, scoreDescription: "Bullish" },
                intermediateTermOutlook: { direction: "Bullish", score: 6, scoreDescription: "Bullish" },
                longTermOutlook: { direction: "Bullish", score: 8, scoreDescription: "Bullish" },
              },
              keyTechnicals: {
                provider: "Trading Central",
                support: 185.0,
                resistance: 205.0,
                stopLoss: 180.0,
              },
              valuation: {
                color: 1,
                description: "Near Fair Value",
                discount: "5%",
                relativeValue: "Undervalued",
                provider: "Trading Central",
              },
            },
            companySnapshot: null,
            secReports: [
              { id: "1", type: "10-K", title: "Annual Report", filedDate: "2024-11-01" },
            ],
            sigDevs: [
              { headline: "Apple announces new product", date: "2024-06-01" },
            ],
          },
        },
      };
    }

    if (endpoint === "YahooFinance/get_stock_holders") {
      return {
        quoteSummary: {
          result: [
            {
              insiderHolders: {
                holders: [
                  {
                    name: "Tim Cook",
                    relation: "Chief Executive Officer",
                    transactionDescription: "Sale",
                    latestTransDate: { fmt: "2024-04-01" },
                    positionDirect: { raw: 3280000 },
                    positionDirectDate: { fmt: "2024-04-01" },
                  },
                ],
              },
            },
          ],
        },
      };
    }

    return {};
  }),
}));

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

describe("stocks router", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("stocks.chart returns real chart data with OHLCV points", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.stocks.chart({ symbol: "AAPL", interval: "1d", range: "1y" });

    expect(result).toBeDefined();
    expect(result.meta).toBeDefined();
    expect(result.meta.symbol).toBe("AAPL");
    expect(result.meta.regularMarketPrice).toBe(195.5);
    expect(result.meta.fiftyTwoWeekHigh).toBe(220.0);
    expect(result.meta.fiftyTwoWeekLow).toBe(150.0);
    expect(result.meta.currency).toBe("USD");
    expect(result.dataPoints).toHaveLength(2);
    expect(result.dataPoints[0].open).toBe(194.0);
    expect(result.dataPoints[0].close).toBe(195.5);
    expect(result.dataPoints[0].volume).toBe(45000000);
  });

  it("stocks.profile returns company information", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.stocks.profile({ symbol: "AAPL" });

    expect(result).toBeDefined();
    expect(result.sector).toBe("Technology");
    expect(result.industry).toBe("Consumer Electronics");
    expect(result.website).toBe("https://www.apple.com");
    expect(result.fullTimeEmployees).toBe(164000);
    expect(result.companyOfficers).toHaveLength(1);
    expect(result.companyOfficers[0].name).toBe("Tim Cook");
  });

  it("stocks.insights returns technical analysis and recommendations", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.stocks.insights({ symbol: "AAPL" });

    expect(result).toBeDefined();
    expect(result.recommendation).toBeDefined();
    expect(result.recommendation?.targetPrice).toBe(210.0);
    expect(result.recommendation?.rating).toBe("BUY");
    expect(result.technicalEvents).toBeDefined();
    expect(result.technicalEvents?.shortTermOutlook.direction).toBe("Bullish");
    expect(result.keyTechnicals?.support).toBe(185.0);
    expect(result.keyTechnicals?.resistance).toBe(205.0);
    expect(result.valuation?.relativeValue).toBe("Undervalued");
    expect(result.secReports).toHaveLength(1);
    expect(result.secReports[0].type).toBe("10-K");
  });

  it("stocks.holders returns insider holding data", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.stocks.holders({ symbol: "AAPL" });

    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("Tim Cook");
    expect(result[0].relation).toBe("Chief Executive Officer");
    expect(result[0].positionDirect).toBe(3280000);
  });

  it("stocks.quotes returns price data for multiple symbols", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.stocks.quotes({ symbols: ["AAPL", "MSFT"] });

    expect(result).toHaveLength(2);
    expect(result[0].regularMarketPrice).toBe(195.5);
    expect(result[0].change).toBeCloseTo(2.5);
    expect(result[0].changePercent).toBeCloseTo(1.295, 1);
  });

  it("stocks.topMovers returns gainers and losers", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.stocks.topMovers({ count: 5 });

    expect(result.gainers).toBeDefined();
    expect(result.losers).toBeDefined();
    expect(result.gainers.length).toBeGreaterThan(0);
    expect(result.losers.length).toBeGreaterThan(0);
  });

  it("stocks.majorStocksList returns the curated list of symbols", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.stocks.majorStocksList();

    expect(result.symbols).toBeDefined();
    expect(result.symbols.length).toBeGreaterThan(50);
    expect(result.symbols).toContain("AAPL");
    expect(result.symbols).toContain("MSFT");
    expect(result.symbols).toContain("GOOGL");
  });

  it("stocks.screen returns sorted stock data", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.stocks.screen({
      symbols: ["AAPL", "MSFT", "GOOGL"],
      sortBy: "changePercent",
      sortOrder: "desc",
    });

    expect(result).toHaveLength(3);
    // All should have the same change since mock returns same data
    expect(result[0].changePercent).toBeCloseTo(1.295, 1);
  });

  it("stocks.chart rejects invalid symbol input", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    await expect(
      caller.stocks.chart({ symbol: "", interval: "1d", range: "1y" })
    ).rejects.toThrow();
  });
});
