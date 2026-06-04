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
