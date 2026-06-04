import { describe, it, expect, vi, beforeEach } from "vitest";

/**
 * Tests for the financial data layer.
 * Since the actual API calls require the Forge API key and network access,
 * we test the data transformation and utility functions.
 */

// Mock the forgeApi module
vi.mock("../client/src/lib/forgeApi", () => ({
  callForgeApi: vi.fn(),
}));

describe("Financial Data Utilities", () => {
  describe("formatCurrency", () => {
    // Import dynamically to allow mocking
    let formatCurrency: (value: number | null | undefined, compact?: boolean) => string;

    beforeEach(async () => {
      const mod = await import("../client/src/lib/financialData");
      formatCurrency = mod.formatCurrency;
    });

    it("should return dash for null values", () => {
      expect(formatCurrency(null)).toBe("—");
      expect(formatCurrency(undefined)).toBe("—");
    });

    it("should format trillions correctly", () => {
      expect(formatCurrency(3.5e12)).toBe("$3.50T");
    });

    it("should format billions correctly", () => {
      expect(formatCurrency(2.8e9)).toBe("$2.80B");
    });

    it("should format millions correctly", () => {
      expect(formatCurrency(450e6)).toBe("$450.00M");
    });

    it("should format thousands correctly", () => {
      expect(formatCurrency(5000)).toBe("$5.0K");
    });

    it("should format small numbers correctly", () => {
      expect(formatCurrency(42.5)).toBe("$42.50");
    });

    it("should handle negative values", () => {
      expect(formatCurrency(-2.5e9)).toBe("-$2.50B");
    });
  });

  describe("formatPercent", () => {
    let formatPercent: (value: number | null | undefined, decimals?: number) => string;

    beforeEach(async () => {
      const mod = await import("../client/src/lib/financialData");
      formatPercent = mod.formatPercent;
    });

    it("should return dash for null values", () => {
      expect(formatPercent(null)).toBe("—");
      expect(formatPercent(undefined)).toBe("—");
    });

    it("should format positive percentages with + sign", () => {
      expect(formatPercent(15.5)).toBe("+15.50%");
    });

    it("should format negative percentages", () => {
      expect(formatPercent(-3.2)).toBe("-3.20%");
    });

    it("should respect decimal places parameter", () => {
      expect(formatPercent(12.345, 1)).toBe("+12.3%");
    });
  });

  describe("formatNumber", () => {
    let formatNumber: (value: number | null | undefined, decimals?: number) => string;

    beforeEach(async () => {
      const mod = await import("../client/src/lib/financialData");
      formatNumber = mod.formatNumber;
    });

    it("should return dash for null values", () => {
      expect(formatNumber(null)).toBe("—");
      expect(formatNumber(undefined)).toBe("—");
    });

    it("should format billions", () => {
      expect(formatNumber(1.5e9)).toBe("1.50B");
    });

    it("should format millions", () => {
      expect(formatNumber(250e6)).toBe("250.00M");
    });

    it("should format small numbers", () => {
      expect(formatNumber(42.567)).toBe("42.57");
    });
  });

  describe("getPeers", () => {
    let getPeers: (symbol: string, limit?: number) => string[];

    beforeEach(async () => {
      const mod = await import("../client/src/lib/financialData");
      getPeers = mod.getPeers;
    });

    it("should return peers for known symbols", () => {
      const peers = getPeers("AAPL");
      expect(peers.length).toBeGreaterThan(0);
      expect(peers).not.toContain("AAPL"); // Should not include itself
    });

    it("should return empty array for unknown symbols", () => {
      const peers = getPeers("UNKNOWN_SYMBOL_XYZ");
      expect(peers).toEqual([]);
    });

    it("should respect the limit parameter", () => {
      const peers = getPeers("AAPL", 3);
      expect(peers.length).toBeLessThanOrEqual(3);
    });

    it("should be case-insensitive", () => {
      const peers1 = getPeers("aapl");
      const peers2 = getPeers("AAPL");
      expect(peers1).toEqual(peers2);
    });
  });

  describe("getSymbolSector", () => {
    let getSymbolSector: (symbol: string) => string | null;

    beforeEach(async () => {
      const mod = await import("../client/src/lib/financialData");
      getSymbolSector = mod.getSymbolSector;
    });

    it("should return sector for known symbols", () => {
      expect(getSymbolSector("AAPL")).toBe("Technology");
      expect(getSymbolSector("JPM")).toBe("Financial Services");
    });

    it("should return null for unknown symbols", () => {
      expect(getSymbolSector("UNKNOWN_XYZ")).toBeNull();
    });
  });
});

describe("Yahoo Finance Data Layer", () => {
  describe("Data structure validation", () => {
    it("should export all required types", async () => {
      const mod = await import("../client/src/lib/financialData");
      expect(mod.getCompanyFacts).toBeDefined();
      expect(mod.getSecFilings).toBeDefined();
      expect(mod.extractIncomeStatement).toBeDefined();
      expect(mod.extractBalanceSheet).toBeDefined();
      expect(mod.extractCashFlow).toBeDefined();
      expect(mod.calculateRatios).toBeDefined();
      expect(mod.getPeers).toBeDefined();
      expect(mod.formatCurrency).toBeDefined();
      expect(mod.formatPercent).toBeDefined();
      expect(mod.formatNumber).toBeDefined();
    });
  });

  describe("extractIncomeStatement", () => {
    let extractIncomeStatement: any;

    beforeEach(async () => {
      const mod = await import("../client/src/lib/financialData");
      extractIncomeStatement = mod.extractIncomeStatement;
    });

    it("should return empty array when no data", () => {
      const facts = {
        entityName: "TEST",
        cik: "",
        _incomeAnnual: [],
        _incomeQuarterly: [],
        _balanceAnnual: [],
        _balanceQuarterly: [],
        _cashFlowAnnual: [],
        _cashFlowQuarterly: [],
        _ratios: null,
        _companyScores: null,
        _sectorScores: null,
        _sectorName: null,
      };
      expect(extractIncomeStatement(facts)).toEqual([]);
    });

    it("should respect the period parameter", () => {
      const facts = {
        entityName: "TEST",
        cik: "",
        _incomeAnnual: [{ period: "2023", revenue: 100, costOfRevenue: null, grossProfit: null, operatingExpenses: null, operatingIncome: null, netIncome: null, eps: null, epsDiluted: null, ebitda: null }],
        _incomeQuarterly: [{ period: "Q1 2024", revenue: 25, costOfRevenue: null, grossProfit: null, operatingExpenses: null, operatingIncome: null, netIncome: null, eps: null, epsDiluted: null, ebitda: null }],
        _balanceAnnual: [],
        _balanceQuarterly: [],
        _cashFlowAnnual: [],
        _cashFlowQuarterly: [],
        _ratios: null,
        _companyScores: null,
        _sectorScores: null,
        _sectorName: null,
      };
      const annual = extractIncomeStatement(facts, "annual");
      expect(annual[0].period).toBe("2023");
      const quarterly = extractIncomeStatement(facts, "quarterly");
      expect(quarterly[0].period).toBe("Q1 2024");
    });
  });

  describe("calculateRatios", () => {
    let calculateRatios: any;

    beforeEach(async () => {
      const mod = await import("../client/src/lib/financialData");
      calculateRatios = mod.calculateRatios;
    });

    it("should return null ratios from facts (API doesn't provide financial ratios)", () => {
      const facts = {
        entityName: "TEST",
        cik: "",
        _incomeAnnual: [],
        _incomeQuarterly: [],
        _balanceAnnual: [],
        _balanceQuarterly: [],
        _cashFlowAnnual: [],
        _cashFlowQuarterly: [],
        _ratios: {
          peRatio: null,
          forwardPE: null,
          pegRatio: null,
          pbRatio: null,
          priceToSales: null,
          evToRevenue: null,
          evToEbitda: null,
          grossMargin: null,
          operatingMargin: null,
          netMargin: null,
          returnOnEquity: null,
          returnOnAssets: null,
          debtToEquity: null,
          currentRatio: null,
          marketCap: null,
          enterpriseValue: null,
          sharesOutstanding: null,
          insiderOwnership: null,
          institutionalOwnership: null,
          revenueGrowth: null,
          earningsGrowth: null,
          dividendYield: null,
          epsGrowth: null,
        },
        _companyScores: null,
        _sectorScores: null,
        _sectorName: null,
      };
      const result = calculateRatios(facts, 150);
      expect(result).not.toBeNull();
      // All values should be null since API doesn't provide them
      expect(result!.peRatio).toBeNull();
      expect(result!.forwardPE).toBeNull();
    });
  });
});
