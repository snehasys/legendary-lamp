# Screener.in Popular Stock Screens

## Page 1 Screens:
1. **FII Buying** - FII buying activity
2. **The Bull Cartel** - Companies with good quarterly growth, tracking latest quarterly results
3. **Low on 10 year average earnings** - Graham-style valuation using 10-year average earnings
4. **Magic Formula** - Based on Joel Greenblatt's Magic Formula (high ROIC + low EV/EBIT)
5. **Growth Stocks** - High growth at reasonable price, G Factor score out of 10
6. **Highest Dividend Yield Shares** - Consistently paying dividends, sorted by highest yield
7. **Companies creating new high** - Current price around 52-week high
8. **Golden Crossover** - When 50 DMA moves above 200 DMA from below
9. **Capacity expansion** - Fixed assets doubled over 3 years or increased 50% in 1 year
10. **Piotroski Scan** - Piotroski score of 9 (profitability, leverage, operating efficiency)
11. **High Growth High RoE Low PE** - Undervalued companies
12. **Loss to Profit Companies** - Turnaround companies (quarterly loss to profit)
13. **Debt reduction** - Companies reducing debt while expanding
14. **Benjamin Graham and Warren Buffett** - Rigorous value filter
15. **Coffee Can Portfolio** - Based on Saurabh Mukherjee's book
16. **Price Volume Action** - Weekly volumes increased 5x+ with positive price movement
17. **Darvas Scan** - Within 10% of 52W High, 100% above 52W Low, Volume > 100000, Price > 10
18. **Bluest of Blue Chips** - Large caps with solid profit growth, high ROE, attractive valuations
19. **Value Stocks** - High OPM, ROCE, Low D/E
20. **RSI - Oversold Stocks** - RSI less than 30
21. **Quarterly Growers** - Q0>Q1>Q2>Q3 (sequential quarterly growth)
22. **Multibagger Stocks** - High potential stocks
23. **Top 100 stocks** - Top 100 by some criteria
24. **Breakout stocks** - Within 10% of 52W High, 100% above 52W Low, Volume > 100000, Price > 10

## Key Patterns:
- Price-based: 52W High/Low proximity, Darvas, Breakout, Golden Crossover
- Volume-based: Price Volume Action, high volume
- Technical: RSI oversold, Golden Crossover, DMA
- Fundamental: PE, ROE, ROCE, OPM, Debt/Equity, Dividend Yield, Piotroski
- Growth: Quarterly growth, revenue growth, profit growth
- Value: Magic Formula, Graham, Low PE + High Growth

## Darvas Scan Query Syntax:
```
100*((High price - Current price)/High price) < 10 AND 
100*((High price - Current price)/High price) > 0 AND 
100*(Current price / Low price -1) > 100 AND 
Current price > 10 AND 
Volume > 100000
```

This translates to:
- Within 10% of 52W High (down from high < 10%)
- Not at the exact high (down > 0%)
- At least 100% above 52W Low
- Price > $10
- Volume > 100,000

## Result Columns Available:
- S.No., Name, CMP (Current Market Price), P/E, Market Cap, Div Yield %, 
- NP Qtr (Net Profit latest quarter), Qtr Profit Var %, 
- Sales Qtr, Qtr Sales Var %, ROCE %, 
- 52W High, 52W Low, Down %

## Golden Crossover Query:
```
DMA 50 > DMA 200 AND DMA 50 previous day < DMA 200 previous day
```
This means: 50-day moving average crossed above 200-day moving average TODAY.
Requires: historical price data to calculate DMAs.

## Screener.in Architecture (from open-source codebase):
- Frontend: React + query builder with typeahead
- Backend API: `/api/screens/popular/`, `/api/screens/{id}/`, `/api/screens/query/`
- Query syntax: Natural language field names (e.g., "Market capitalization", "Price to earning", "Return on capital employed")
- Operators: `>`, `<`, `=`, `AND`
- The backend does all the heavy lifting - it parses the query, filters the database, and returns paginated results
- The frontend just displays results in a table with sortable columns

## Key Insight for Our Implementation:
Since we DON'T have a database of all US stocks with fundamental data, we need to:
1. Use a pre-defined universe of stocks (S&P 500, NASDAQ 100, etc.)
2. Fetch data from Yahoo Finance API for each stock in the universe
3. Apply filters client-side or cache the data

## Available Data from Yahoo Finance Forge API:
- Price data: current price, 52W high, 52W low, volume, day high/low, prev close
- Technical: support, resistance, short/mid/long-term outlook
- Company: sector, industry, employees, description
- Insider: holder names, shares, transactions
- Scoring: innovativeness, hiring, sustainability, insider sentiments, earnings reports, dividends

## NOT Available:
- PE ratio, PB ratio, EPS, market cap, revenue, profit margins
- Financial statements (income, balance sheet, cash flow)
- DMA (50-day, 200-day moving averages) - but CAN be calculated from chart data
- Dividend yield (not directly, but can be inferred)
- ROE, ROCE, OPM, debt/equity

## FEASIBLE Screens (using available data):
1. **52W High Breakout** (Darvas-style) - Within X% of 52W high, far above 52W low
2. **52W Low Bounce** - Stocks near 52W low that are bouncing
3. **High Volume Movers** - Stocks with unusually high volume
4. **Top Gainers Today** - Already have this
5. **Top Losers Today** - Already have this
6. **Golden Crossover** - CAN calculate from chart data (50 DMA vs 200 DMA)
7. **RSI Oversold** - CAN calculate RSI from chart data
8. **RSI Overbought** - CAN calculate RSI from chart data
9. **Bullish Technical Outlook** - From insights API (short/mid/long term outlook)
10. **Undervalued (Fair Value)** - From insights API (valuation vs fair value)
11. **Strong Buy Consensus** - From insights API (analyst recommendation)
12. **High Innovation Score** - From insights API (company scoring)
13. **Insider Buying** - From holders API (recent insider purchases)
