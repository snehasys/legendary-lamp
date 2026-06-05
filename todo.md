# US Stock Screener - TODO

## Phase 7: Server-Side API Proxy + Live Stock Screens
- [x] Add Vite dev server plugin to proxy Yahoo Finance API calls via Manus Data API
- [x] Add Express production server proxy route for Yahoo Finance API
- [x] Create client-side dataApi.ts helper that calls the local proxy
- [x] Create yahooFinance.ts with live data functions (chart, insights, holders, profile, sec_filing)
- [x] Implement real-time stock screening engine with technical indicators
- [x] Add screens: 52-Week High Breakout, Golden Crossover, High Volume Breakout, RSI Oversold
- [x] Add screens: Strong Momentum, Bullish EMA Crossover, Near 52-Week Low, Top Gainers/Losers, Darvas Box, RSI Overbought
- [x] Update ScreenDetail page to show live screening results
- [x] Update Company page to use live data from API proxy
- [ ] Push all code to GitHub

## Phase 8: Bug Fixes - API Error Handling & Rate Limiting
- [x] Fix proxy returning HTTP 200 for API errors (now returns 400 for error responses)
- [x] Fix client caching error responses (callDataApi now throws on errors, doesn't cache)
- [x] Fix rate limiting by switching to sequential API calls with delays
- [x] Company page now loads progressively (chart first, then other data)
- [x] Screen engine fetches stocks sequentially with 400ms delay between requests
