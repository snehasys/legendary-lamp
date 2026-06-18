import { describe, it, expect } from "vitest";

describe("Forge API Key Validation", () => {
  it("should successfully call Yahoo Finance chart API via Forge", async () => {
    const forgeApiUrl = process.env.VITE_FORGE_API_URL || "https://forge.manus.ai";
    const forgeApiKey = process.env.VITE_FORGE_API_KEY;

    expect(forgeApiKey).toBeDefined();
    expect(forgeApiKey!.length).toBeGreaterThan(0);

    const response = await fetch(
      `${forgeApiUrl}/webdevtoken.v1.WebDevService/CallApi`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${forgeApiKey}`,
          "Content-Type": "application/json",
          "connect-protocol-version": "1",
        },
        body: JSON.stringify({
          apiId: "YahooFinance/get_stock_chart",
          query: { symbol: "AAPL", region: "US", interval: "1d", range: "5d" },
        }),
      }
    );

    expect(response.ok).toBe(true);

    const data = await response.json();
    expect(data).toHaveProperty("jsonData");

    const parsed = JSON.parse(data.jsonData);
    expect(parsed).toHaveProperty("chart");
    expect(parsed.chart.result).toHaveLength(1);
    expect(parsed.chart.result[0].meta.symbol).toBe("AAPL");
    expect(parsed.chart.result[0].meta.regularMarketPrice).toBeGreaterThan(0);
  });

  it("should work for non-AAPL symbols (MSFT)", async () => {
    const forgeApiUrl = process.env.VITE_FORGE_API_URL || "https://forge.manus.ai";
    const forgeApiKey = process.env.VITE_FORGE_API_KEY;

    const response = await fetch(
      `${forgeApiUrl}/webdevtoken.v1.WebDevService/CallApi`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${forgeApiKey}`,
          "Content-Type": "application/json",
          "connect-protocol-version": "1",
        },
        body: JSON.stringify({
          apiId: "YahooFinance/get_stock_chart",
          query: { symbol: "MSFT", region: "US", interval: "1d", range: "5d" },
        }),
      }
    );

    expect(response.ok).toBe(true);

    const data = await response.json();
    expect(data).toHaveProperty("jsonData");

    const parsed = JSON.parse(data.jsonData);
    expect(parsed.chart.result[0].meta.symbol).toBe("MSFT");
    expect(parsed.chart.result[0].meta.regularMarketPrice).toBeGreaterThan(0);
  });
});
