# Project TODO

## Phase 1: Backend API with Real Yahoo Finance Data
- [x] Install dependencies and push database schema
- [x] Create server-side Yahoo Finance data service with caching
- [x] Create tRPC routers for stock data (quotes, charts, search, financials)
- [x] Create tRPC routers for screens/filters

## Phase 2: Database Schema for User State
- [x] Add watchlist table to schema
- [x] Add custom screens table to schema
- [x] Push database migrations

## Phase 3: Frontend - Core Pages with Live Data
- [x] Update index.css with financial terminal design system
- [x] Update index.html with Google Fonts
- [x] Create Header component with search
- [x] Create Footer component
- [x] Create Home page with live market data
- [x] Create Company detail page with live financials
- [x] Create Screens page with prebuilt screens
- [x] Create ScreenDetail page with live filtered results
- [x] Create Sector browsing page
- [x] Create Watchlist page (authenticated)
- [x] Create Compare stocks page
- [x] Create Query Builder page
- [x] Update App.tsx with all routes

## Phase 4: Testing & Deployment
- [x] Write vitest tests for backend API routes
- [x] Verify live data is flowing correctly
- [x] Save checkpoint and export to GitHub
- [x] Fix Top Gainers/Losers screen filtering (only show positive/negative stocks)

## Phase 5: Manus Forge API Integration (Completed)
- [x] Rewrite yahooFinance.ts to use Manus Forge API for all stock data
- [x] Rewrite financialData.ts to use Forge API for financial statements/ratios
- [x] Configure VITE_FORGE_API_KEY and VITE_FORGE_API_URL secrets
- [x] Verify live data works for all symbols (not just AAPL)

## Phase 6: Screener.in-Style Features
- [x] Add Insights tab with technical analysis, valuation, recommendations
- [x] Add Shareholding tab with insider holders data
- [x] Add Company Profile section with business summary and officers
- [x] Add SEC Reports section with recent filings
- [x] Add Significant Developments section
- [x] Enhance Ratios tab with company scoring metrics and data availability notice
- [x] Replace market cap with prev close in key metrics (market cap not available from API)
- [x] Improve peer comparison with price-based metrics
- [x] Add vitest coverage for client data helpers (25 tests passing)
- [x] Validate company detail page end-to-end
- [x] Note: Financial statements NOT available from Yahoo Finance API through Forge - tabs show empty state messages

## Phase 7: Deployment Fix
- [x] Fix deployment: vite build output to dist/public, add server bundling with esbuild
- [x] Fix Express 5 wildcard path syntax (/* to /{*key} and {*path})
- [x] Add missing shared/const.ts exports (COOKIE_NAME, ONE_YEAR_MS, AXIOS_TIMEOUT_MS, etc.)
- [x] Install missing server dependencies (dotenv, express, @aws-sdk, drizzle-kit, etc.)
- [x] Restore correct vite.config.ts with debug collector plugin and proper build output
- [x] Add test and db:push scripts to package.json

## Phase 8: GitHub Pages Fix
- [ ] Build static site with base: "/legendary-lamp/" for GitHub Pages
- [ ] Embed VITE_FORGE_API_KEY and VITE_FORGE_API_URL in the static build
- [ ] Add 404.html for SPA client-side routing on GitHub Pages
- [ ] Deploy updated build to gh-pages branch
- [ ] Test all pages on snehasys.github.io/legendary-lamp/
