// Stock data service for US NYSE/NASDAQ stocks
// Uses realistic mock data for demonstration

export interface Stock {
  symbol: string;
  name: string;
  exchange: "NYSE" | "NASDAQ";
  sector: string;
  industry: string;
  price: number;
  change: number;
  changePercent: number;
  marketCap: number;
  pe: number;
  eps: number;
  high52w: number;
  low52w: number;
  volume: number;
  avgVolume: number;
  dividend: number;
  dividendYield: number;
  beta: number;
  roe: number;
  roce: number;
  bookValue: number;
  debtToEquity: number;
  currentRatio: number;
  revenueGrowth: number;
  profitGrowth: number;
  about: string;
}

export interface FinancialData {
  year: string;
  revenue: number;
  expenses: number;
  operatingProfit: number;
  opm: number;
  otherIncome: number;
  interest: number;
  depreciation: number;
  profitBeforeTax: number;
  taxPercent: number;
  netProfit: number;
  eps: number;
}

export interface BalanceSheetData {
  year: string;
  equity: number;
  reserves: number;
  borrowings: number;
  otherLiabilities: number;
  totalLiabilities: number;
  fixedAssets: number;
  investments: number;
  otherAssets: number;
  totalAssets: number;
}

export interface CashFlowData {
  year: string;
  operatingCashFlow: number;
  investingCashFlow: number;
  financingCashFlow: number;
  netCashFlow: number;
  freeCashFlow: number;
}

export interface QuarterlyData {
  quarter: string;
  revenue: number;
  expenses: number;
  operatingProfit: number;
  opm: number;
  otherIncome: number;
  interest: number;
  depreciation: number;
  profitBeforeTax: number;
  taxPercent: number;
  netProfit: number;
  eps: number;
}

export interface RatioData {
  year: string;
  debtorDays: number;
  inventoryDays: number;
  daysPayable: number;
  cashConversionCycle: number;
  workingCapitalDays: number;
  roce: number;
  roe: number;
}

export interface ShareholdingData {
  quarter: string;
  promoters: number;
  fii: number;
  dii: number;
  public: number;
}

export interface PriceHistory {
  date: string;
  price: number;
  volume: number;
  open: number;
  high: number;
  low: number;
}

export interface ScreenResult {
  id: string;
  name: string;
  description: string;
  category: string;
  stocks: string[];
}

export const sectors = [
  "Technology",
  "Healthcare",
  "Financial Services",
  "Consumer Cyclical",
  "Communication Services",
  "Industrials",
  "Consumer Defensive",
  "Energy",
  "Utilities",
  "Real Estate",
  "Basic Materials",
];

export const industries: Record<string, string[]> = {
  "Technology": ["Software", "Semiconductors", "Hardware", "IT Services", "Cloud Computing"],
  "Healthcare": ["Biotechnology", "Pharmaceuticals", "Medical Devices", "Healthcare Services", "Health Insurance"],
  "Financial Services": ["Banks", "Insurance", "Asset Management", "Fintech", "Capital Markets"],
  "Consumer Cyclical": ["E-Commerce", "Automotive", "Restaurants", "Retail", "Travel & Leisure"],
  "Communication Services": ["Internet Content", "Telecom", "Media", "Entertainment", "Advertising"],
  "Industrials": ["Aerospace & Defense", "Construction", "Machinery", "Transportation", "Waste Management"],
  "Consumer Defensive": ["Beverages", "Food Products", "Household Products", "Tobacco", "Discount Stores"],
  "Energy": ["Oil & Gas", "Renewable Energy", "Energy Equipment", "Pipelines", "Coal"],
  "Utilities": ["Electric Utilities", "Gas Utilities", "Water Utilities", "Renewable Utilities", "Multi-Utilities"],
  "Real Estate": ["REITs", "Real Estate Services", "Real Estate Development", "Mortgage Finance", "Property Management"],
  "Basic Materials": ["Chemicals", "Mining", "Steel", "Paper & Forest", "Construction Materials"],
};

export const stocks: Stock[] = [
  {
    symbol: "AAPL", name: "Apple Inc.", exchange: "NASDAQ", sector: "Technology", industry: "Hardware",
    price: 198.45, change: 2.34, changePercent: 1.19, marketCap: 3080000, pe: 32.4, eps: 6.12,
    high52w: 220.20, low52w: 155.98, volume: 54320000, avgVolume: 48500000, dividend: 0.96, dividendYield: 0.48,
    beta: 1.28, roe: 160.9, roce: 56.3, bookValue: 3.95, debtToEquity: 1.87, currentRatio: 0.99,
    revenueGrowth: 8.2, profitGrowth: 12.5,
    about: "Apple Inc. designs, manufactures, and markets smartphones, personal computers, tablets, wearables, and accessories worldwide. The company offers iPhone, Mac, iPad, and wearables, home and accessories."
  },
  {
    symbol: "MSFT", name: "Microsoft Corporation", exchange: "NASDAQ", sector: "Technology", industry: "Software",
    price: 442.57, change: -1.23, changePercent: -0.28, marketCap: 3290000, pe: 37.8, eps: 11.71,
    high52w: 468.35, low52w: 362.90, volume: 22100000, avgVolume: 20800000, dividend: 3.00, dividendYield: 0.68,
    beta: 0.89, roe: 38.5, roce: 32.1, bookValue: 36.12, debtToEquity: 0.42, currentRatio: 1.77,
    revenueGrowth: 15.8, profitGrowth: 20.3,
    about: "Microsoft Corporation develops and supports software, services, devices, and solutions worldwide. The company operates through Productivity and Business Processes, Intelligent Cloud, and More Personal Computing segments."
  },
  {
    symbol: "GOOGL", name: "Alphabet Inc.", exchange: "NASDAQ", sector: "Communication Services", industry: "Internet Content",
    price: 178.92, change: 3.45, changePercent: 1.97, marketCap: 2210000, pe: 25.6, eps: 6.99,
    high52w: 191.75, low52w: 130.67, volume: 28900000, avgVolume: 25600000, dividend: 0.80, dividendYield: 0.45,
    beta: 1.05, roe: 31.2, roce: 28.7, bookValue: 25.18, debtToEquity: 0.11, currentRatio: 2.10,
    revenueGrowth: 14.3, profitGrowth: 28.6,
    about: "Alphabet Inc. offers various products and platforms in the United States, Europe, the Middle East, Africa, the Asia-Pacific, Canada, and Latin America. It operates through Google Services, Google Cloud, and Other Bets segments."
  },
  {
    symbol: "AMZN", name: "Amazon.com Inc.", exchange: "NASDAQ", sector: "Consumer Cyclical", industry: "E-Commerce",
    price: 189.83, change: 1.56, changePercent: 0.83, marketCap: 1980000, pe: 62.3, eps: 3.05,
    high52w: 201.20, low52w: 144.05, volume: 45200000, avgVolume: 42100000, dividend: 0, dividendYield: 0,
    beta: 1.16, roe: 22.8, roce: 14.5, bookValue: 16.89, debtToEquity: 0.59, currentRatio: 1.05,
    revenueGrowth: 12.5, profitGrowth: 95.2,
    about: "Amazon.com, Inc. engages in the retail sale of consumer products, advertising, and subscription services through online and physical stores in North America and internationally."
  },
  {
    symbol: "NVDA", name: "NVIDIA Corporation", exchange: "NASDAQ", sector: "Technology", industry: "Semiconductors",
    price: 131.88, change: 5.67, changePercent: 4.49, marketCap: 3240000, pe: 68.5, eps: 1.92,
    high52w: 152.89, low52w: 75.61, volume: 312000000, avgVolume: 280000000, dividend: 0.04, dividendYield: 0.03,
    beta: 1.68, roe: 115.8, roce: 88.4, bookValue: 2.37, debtToEquity: 0.41, currentRatio: 4.17,
    revenueGrowth: 122.4, profitGrowth: 168.9,
    about: "NVIDIA Corporation provides graphics and compute and networking solutions in the United States, Taiwan, China, Hong Kong, and internationally. The company operates through two segments: Graphics and Compute & Networking."
  },
  {
    symbol: "META", name: "Meta Platforms Inc.", exchange: "NASDAQ", sector: "Communication Services", industry: "Internet Content",
    price: 512.34, change: -4.56, changePercent: -0.88, marketCap: 1310000, pe: 27.8, eps: 18.43,
    high52w: 542.81, low52w: 390.42, volume: 18500000, avgVolume: 16200000, dividend: 2.00, dividendYield: 0.39,
    beta: 1.22, roe: 35.4, roce: 30.8, bookValue: 58.72, debtToEquity: 0.31, currentRatio: 2.68,
    revenueGrowth: 24.7, profitGrowth: 73.1,
    about: "Meta Platforms, Inc. engages in the development of products that enable people to connect and share with friends and family through mobile devices, personal computers, virtual reality headsets, and wearables worldwide."
  },
  {
    symbol: "TSLA", name: "Tesla Inc.", exchange: "NASDAQ", sector: "Consumer Cyclical", industry: "Automotive",
    price: 248.92, change: -8.34, changePercent: -3.24, marketCap: 792000, pe: 78.4, eps: 3.17,
    high52w: 299.29, low52w: 138.80, volume: 98700000, avgVolume: 92300000, dividend: 0, dividendYield: 0,
    beta: 2.31, roe: 21.4, roce: 16.8, bookValue: 16.56, debtToEquity: 0.11, currentRatio: 1.73,
    revenueGrowth: -3.1, profitGrowth: -45.2,
    about: "Tesla, Inc. designs, develops, manufactures, leases, and sells electric vehicles, and energy generation and storage systems in the United States, China, and internationally."
  },
  {
    symbol: "JPM", name: "JPMorgan Chase & Co.", exchange: "NYSE", sector: "Financial Services", industry: "Banks",
    price: 218.45, change: 1.89, changePercent: 0.87, marketCap: 625000, pe: 12.1, eps: 18.05,
    high52w: 232.64, low52w: 172.30, volume: 9800000, avgVolume: 8900000, dividend: 4.60, dividendYield: 2.11,
    beta: 1.12, roe: 17.2, roce: 4.8, bookValue: 110.45, debtToEquity: 1.52, currentRatio: 0.85,
    revenueGrowth: 11.4, profitGrowth: 25.8,
    about: "JPMorgan Chase & Co. operates as a financial services company worldwide. It operates through four segments: Consumer & Community Banking, Corporate & Investment Bank, Commercial Banking, and Asset & Wealth Management."
  },
  {
    symbol: "V", name: "Visa Inc.", exchange: "NYSE", sector: "Financial Services", industry: "Fintech",
    price: 289.67, change: 0.45, changePercent: 0.16, marketCap: 580000, pe: 31.2, eps: 9.28,
    high52w: 310.50, low52w: 252.70, volume: 6500000, avgVolume: 5800000, dividend: 2.08, dividendYield: 0.72,
    beta: 0.94, roe: 47.3, roce: 38.9, bookValue: 21.34, debtToEquity: 1.18, currentRatio: 1.45,
    revenueGrowth: 10.2, profitGrowth: 17.4,
    about: "Visa Inc. operates as a payments technology company worldwide. The company operates VisaNet, a transaction processing network that enables authorization, clearing, and settlement of payment transactions."
  },
  {
    symbol: "JNJ", name: "Johnson & Johnson", exchange: "NYSE", sector: "Healthcare", industry: "Pharmaceuticals",
    price: 155.23, change: -0.67, changePercent: -0.43, marketCap: 374000, pe: 22.8, eps: 6.81,
    high52w: 168.85, low52w: 143.13, volume: 7200000, avgVolume: 6800000, dividend: 4.76, dividendYield: 3.07,
    beta: 0.52, roe: 21.6, roce: 18.4, bookValue: 33.12, debtToEquity: 0.48, currentRatio: 1.17,
    revenueGrowth: 5.3, profitGrowth: 8.1,
    about: "Johnson & Johnson researches, develops, manufactures, and sells various products in the healthcare field worldwide. The company operates through two segments: Innovative Medicine and MedTech."
  },
  {
    symbol: "WMT", name: "Walmart Inc.", exchange: "NYSE", sector: "Consumer Defensive", industry: "Discount Stores",
    price: 67.89, change: 0.23, changePercent: 0.34, marketCap: 545000, pe: 34.5, eps: 1.97,
    high52w: 72.15, low52w: 49.85, volume: 15800000, avgVolume: 14200000, dividend: 0.83, dividendYield: 1.22,
    beta: 0.51, roe: 22.1, roce: 15.3, bookValue: 9.45, debtToEquity: 0.72, currentRatio: 0.83,
    revenueGrowth: 5.7, profitGrowth: 32.8,
    about: "Walmart Inc. engages in the operation of retail, wholesale, and other units worldwide. The company operates through three segments: Walmart U.S., Walmart International, and Sam's Club."
  },
  {
    symbol: "XOM", name: "Exxon Mobil Corporation", exchange: "NYSE", sector: "Energy", industry: "Oil & Gas",
    price: 108.56, change: -1.23, changePercent: -1.12, marketCap: 432000, pe: 13.8, eps: 7.87,
    high52w: 123.75, low52w: 95.77, volume: 14500000, avgVolume: 13200000, dividend: 3.80, dividendYield: 3.50,
    beta: 0.92, roe: 18.9, roce: 15.2, bookValue: 44.56, debtToEquity: 0.21, currentRatio: 1.32,
    revenueGrowth: -2.8, profitGrowth: -15.4,
    about: "Exxon Mobil Corporation explores for and produces crude oil and natural gas in the United States and internationally. It operates through Upstream, Energy Products, Chemical Products, and Specialty Products segments."
  },
  {
    symbol: "UNH", name: "UnitedHealth Group Inc.", exchange: "NYSE", sector: "Healthcare", industry: "Health Insurance",
    price: 487.23, change: 5.67, changePercent: 1.18, marketCap: 448000, pe: 19.5, eps: 24.99,
    high52w: 630.73, low52w: 436.38, volume: 4500000, avgVolume: 3800000, dividend: 7.52, dividendYield: 1.54,
    beta: 0.62, roe: 25.8, roce: 12.4, bookValue: 102.34, debtToEquity: 0.78, currentRatio: 0.76,
    revenueGrowth: 8.6, profitGrowth: 11.2,
    about: "UnitedHealth Group Incorporated operates as a diversified health care company in the United States. It operates through four segments: UnitedHealthcare, Optum Health, Optum Insight, and Optum Rx."
  },
  {
    symbol: "MA", name: "Mastercard Inc.", exchange: "NYSE", sector: "Financial Services", industry: "Fintech",
    price: 478.90, change: 2.34, changePercent: 0.49, marketCap: 445000, pe: 35.6, eps: 13.45,
    high52w: 512.30, low52w: 410.20, volume: 3200000, avgVolume: 2900000, dividend: 2.64, dividendYield: 0.55,
    beta: 1.08, roe: 178.5, roce: 62.3, bookValue: 8.12, debtToEquity: 2.34, currentRatio: 1.22,
    revenueGrowth: 12.8, profitGrowth: 16.9,
    about: "Mastercard Incorporated, a technology company, provides transaction processing and other payment-related products and services in the United States and internationally."
  },
  {
    symbol: "PG", name: "Procter & Gamble Co.", exchange: "NYSE", sector: "Consumer Defensive", industry: "Household Products",
    price: 168.45, change: 0.89, changePercent: 0.53, marketCap: 398000, pe: 27.3, eps: 6.17,
    high52w: 176.90, low52w: 148.56, volume: 6100000, avgVolume: 5600000, dividend: 4.03, dividendYield: 2.39,
    beta: 0.42, roe: 31.2, roce: 22.8, bookValue: 21.45, debtToEquity: 0.68, currentRatio: 0.69,
    revenueGrowth: 2.1, profitGrowth: 5.8,
    about: "The Procter & Gamble Company provides branded consumer packaged goods worldwide. It operates through five segments: Beauty; Grooming; Health Care; Fabric & Home Care; and Baby, Feminine & Family Care."
  },
  {
    symbol: "HD", name: "The Home Depot Inc.", exchange: "NYSE", sector: "Consumer Cyclical", industry: "Retail",
    price: 356.78, change: -2.45, changePercent: -0.68, marketCap: 354000, pe: 24.8, eps: 14.38,
    high52w: 395.60, low52w: 312.40, volume: 4800000, avgVolume: 4200000, dividend: 8.36, dividendYield: 2.34,
    beta: 1.04, roe: 1245.8, roce: 42.5, bookValue: -1.25, debtToEquity: -45.2, currentRatio: 1.35,
    revenueGrowth: 4.2, profitGrowth: 7.8,
    about: "The Home Depot, Inc. operates as a home improvement retailer in the United States and internationally. It sells various building materials, home improvement products, lawn and garden products, and décor products."
  },
  {
    symbol: "BAC", name: "Bank of America Corp.", exchange: "NYSE", sector: "Financial Services", industry: "Banks",
    price: 42.56, change: 0.34, changePercent: 0.81, marketCap: 335000, pe: 14.2, eps: 3.00,
    high52w: 46.80, low52w: 32.40, volume: 32500000, avgVolume: 29800000, dividend: 0.96, dividendYield: 2.26,
    beta: 1.38, roe: 10.8, roce: 3.2, bookValue: 33.78, debtToEquity: 1.12, currentRatio: 0.92,
    revenueGrowth: 3.5, profitGrowth: 18.2,
    about: "Bank of America Corporation, through its subsidiaries, provides banking and financial products and services for individual consumers, small and middle-market businesses, institutional investors, large corporations, and governments worldwide."
  },
  {
    symbol: "KO", name: "The Coca-Cola Company", exchange: "NYSE", sector: "Consumer Defensive", industry: "Beverages",
    price: 63.45, change: 0.12, changePercent: 0.19, marketCap: 274000, pe: 25.8, eps: 2.46,
    high52w: 73.53, low52w: 57.93, volume: 12300000, avgVolume: 11500000, dividend: 1.94, dividendYield: 3.06,
    beta: 0.58, roe: 40.2, roce: 18.5, bookValue: 6.12, debtToEquity: 1.72, currentRatio: 1.13,
    revenueGrowth: -2.8, profitGrowth: 5.4,
    about: "The Coca-Cola Company, a beverage company, manufactures, markets, and sells various nonalcoholic beverages worldwide. The company provides sparkling soft drinks, flavored and enhanced water, sports drinks, juice, dairy, and plant-based beverages."
  },
  {
    symbol: "AVGO", name: "Broadcom Inc.", exchange: "NASDAQ", sector: "Technology", industry: "Semiconductors",
    price: 178.45, change: 3.89, changePercent: 2.23, marketCap: 835000, pe: 145.2, eps: 1.23,
    high52w: 186.42, low52w: 119.76, volume: 28900000, avgVolume: 25600000, dividend: 2.10, dividendYield: 1.18,
    beta: 1.24, roe: 12.8, roce: 8.4, bookValue: 15.67, debtToEquity: 1.06, currentRatio: 1.12,
    revenueGrowth: 44.2, profitGrowth: 22.8,
    about: "Broadcom Inc. designs, develops, and supplies various semiconductor and infrastructure software solutions. It operates through two segments: Semiconductor Solutions and Infrastructure Software."
  },
  {
    symbol: "LLY", name: "Eli Lilly and Company", exchange: "NYSE", sector: "Healthcare", industry: "Pharmaceuticals",
    price: 812.34, change: 12.56, changePercent: 1.57, marketCap: 772000, pe: 125.4, eps: 6.48,
    high52w: 972.53, low52w: 688.85, volume: 3200000, avgVolume: 2800000, dividend: 5.20, dividendYield: 0.64,
    beta: 0.42, roe: 58.4, roce: 22.8, bookValue: 12.34, debtToEquity: 2.45, currentRatio: 1.18,
    revenueGrowth: 32.5, profitGrowth: 68.4,
    about: "Eli Lilly and Company discovers, develops, and markets human pharmaceuticals worldwide. The company offers Mounjaro, Zepbound, Trulicity, Humalog, and other products."
  },
  {
    symbol: "NFLX", name: "Netflix Inc.", exchange: "NASDAQ", sector: "Communication Services", industry: "Entertainment",
    price: 678.90, change: 8.45, changePercent: 1.26, marketCap: 295000, pe: 42.3, eps: 16.05,
    high52w: 712.30, low52w: 485.20, volume: 5800000, avgVolume: 5200000, dividend: 0, dividendYield: 0,
    beta: 1.22, roe: 32.5, roce: 18.9, bookValue: 52.34, debtToEquity: 0.68, currentRatio: 1.15,
    revenueGrowth: 16.8, profitGrowth: 44.2,
    about: "Netflix, Inc. provides entertainment services. It offers TV series, documentaries, feature films, and games across various genres and languages worldwide."
  },
  {
    symbol: "CRM", name: "Salesforce Inc.", exchange: "NYSE", sector: "Technology", industry: "Cloud Computing",
    price: 272.45, change: -3.12, changePercent: -1.13, marketCap: 264000, pe: 45.8, eps: 5.95,
    high52w: 318.70, low52w: 212.00, volume: 6200000, avgVolume: 5800000, dividend: 1.60, dividendYield: 0.59,
    beta: 1.28, roe: 10.2, roce: 7.8, bookValue: 62.45, debtToEquity: 0.22, currentRatio: 1.08,
    revenueGrowth: 11.2, profitGrowth: 76.5,
    about: "Salesforce, Inc. provides customer relationship management technology that brings companies and customers together worldwide."
  },
  {
    symbol: "ORCL", name: "Oracle Corporation", exchange: "NYSE", sector: "Technology", industry: "Cloud Computing",
    price: 178.23, change: 2.67, changePercent: 1.52, marketCap: 492000, pe: 38.4, eps: 4.64,
    high52w: 192.43, low52w: 112.50, volume: 9800000, avgVolume: 8900000, dividend: 1.60, dividendYield: 0.90,
    beta: 1.08, roe: 125.4, roce: 22.3, bookValue: -5.12, debtToEquity: -15.8, currentRatio: 0.72,
    revenueGrowth: 18.4, profitGrowth: 28.9,
    about: "Oracle Corporation offers products and services that address enterprise information technology environments worldwide. It provides cloud software and on-premises software solutions."
  },
  {
    symbol: "ADBE", name: "Adobe Inc.", exchange: "NASDAQ", sector: "Technology", industry: "Software",
    price: 478.56, change: -5.23, changePercent: -1.08, marketCap: 212000, pe: 44.2, eps: 10.82,
    high52w: 638.25, low52w: 403.75, volume: 3400000, avgVolume: 3100000, dividend: 0, dividendYield: 0,
    beta: 1.32, roe: 35.8, roce: 28.4, bookValue: 32.67, debtToEquity: 0.42, currentRatio: 1.11,
    revenueGrowth: 10.8, profitGrowth: 15.2,
    about: "Adobe Inc. operates as a diversified software company worldwide. It operates through three segments: Digital Media, Digital Experience, and Publishing and Advertising."
  },
  {
    symbol: "AMD", name: "Advanced Micro Devices", exchange: "NASDAQ", sector: "Technology", industry: "Semiconductors",
    price: 164.78, change: 4.56, changePercent: 2.85, marketCap: 266000, pe: 198.5, eps: 0.83,
    high52w: 227.30, low52w: 120.62, volume: 52000000, avgVolume: 48000000, dividend: 0, dividendYield: 0,
    beta: 1.72, roe: 3.2, roce: 2.8, bookValue: 28.45, debtToEquity: 0.04, currentRatio: 2.52,
    revenueGrowth: 10.2, profitGrowth: -35.8,
    about: "Advanced Micro Devices, Inc. operates as a semiconductor company worldwide. It provides x86 microprocessors, GPUs, and adaptive SoC products."
  },
  {
    symbol: "INTC", name: "Intel Corporation", exchange: "NASDAQ", sector: "Technology", industry: "Semiconductors",
    price: 31.45, change: -0.89, changePercent: -2.75, marketCap: 133000, pe: -18.2, eps: -1.73,
    high52w: 51.28, low52w: 18.51, volume: 62000000, avgVolume: 58000000, dividend: 0.50, dividendYield: 1.59,
    beta: 1.05, roe: -16.8, roce: -8.4, bookValue: 25.78, debtToEquity: 0.47, currentRatio: 1.57,
    revenueGrowth: -1.4, profitGrowth: -85.2,
    about: "Intel Corporation designs, develops, manufactures, markets, and sells computing and related products and services worldwide."
  },
  {
    symbol: "DIS", name: "The Walt Disney Company", exchange: "NYSE", sector: "Communication Services", industry: "Entertainment",
    price: 112.34, change: 1.23, changePercent: 1.11, marketCap: 205000, pe: 38.9, eps: 2.89,
    high52w: 123.74, low52w: 83.91, volume: 11200000, avgVolume: 10500000, dividend: 1.00, dividendYield: 0.89,
    beta: 1.38, roe: 5.8, roce: 4.2, bookValue: 52.34, debtToEquity: 0.48, currentRatio: 0.95,
    revenueGrowth: 3.8, profitGrowth: 125.4,
    about: "The Walt Disney Company operates as an entertainment company worldwide through Disney Entertainment, ESPN, and Disney Experiences segments."
  },
  {
    symbol: "PFE", name: "Pfizer Inc.", exchange: "NYSE", sector: "Healthcare", industry: "Pharmaceuticals",
    price: 28.67, change: -0.34, changePercent: -1.17, marketCap: 162000, pe: 48.2, eps: 0.59,
    high52w: 31.54, low52w: 24.48, volume: 38000000, avgVolume: 35000000, dividend: 1.68, dividendYield: 5.86,
    beta: 0.65, roe: 3.2, roce: 2.8, bookValue: 18.45, debtToEquity: 0.72, currentRatio: 1.22,
    revenueGrowth: -41.2, profitGrowth: -92.8,
    about: "Pfizer Inc. discovers, develops, manufactures, markets, distributes, and sells biopharmaceutical products worldwide."
  },
  {
    symbol: "COST", name: "Costco Wholesale Corp.", exchange: "NASDAQ", sector: "Consumer Defensive", industry: "Discount Stores",
    price: 892.45, change: 5.67, changePercent: 0.64, marketCap: 396000, pe: 52.8, eps: 16.90,
    high52w: 918.93, low52w: 654.80, volume: 2100000, avgVolume: 1900000, dividend: 4.64, dividendYield: 0.52,
    beta: 0.78, roe: 28.5, roce: 22.1, bookValue: 62.34, debtToEquity: 0.35, currentRatio: 1.02,
    revenueGrowth: 7.8, profitGrowth: 18.4,
    about: "Costco Wholesale Corporation operates membership warehouses in the United States, Puerto Rico, Canada, Mexico, Japan, and other countries."
  },
  {
    symbol: "GS", name: "Goldman Sachs Group", exchange: "NYSE", sector: "Financial Services", industry: "Capital Markets",
    price: 478.90, change: 3.45, changePercent: 0.73, marketCap: 158000, pe: 15.8, eps: 30.31,
    high52w: 512.50, low52w: 378.20, volume: 2800000, avgVolume: 2500000, dividend: 11.00, dividendYield: 2.30,
    beta: 1.35, roe: 12.4, roce: 3.8, bookValue: 258.90, debtToEquity: 2.45, currentRatio: 0.78,
    revenueGrowth: 12.5, profitGrowth: 48.2,
    about: "The Goldman Sachs Group, Inc. operates as a global investment banking, securities, and investment management firm worldwide."
  },
  {
    symbol: "CVX", name: "Chevron Corporation", exchange: "NYSE", sector: "Energy", industry: "Oil & Gas",
    price: 152.34, change: -2.12, changePercent: -1.37, marketCap: 282000, pe: 14.2, eps: 10.73,
    high52w: 171.70, low52w: 135.37, volume: 7800000, avgVolume: 7200000, dividend: 6.52, dividendYield: 4.28,
    beta: 1.08, roe: 14.5, roce: 11.2, bookValue: 78.90, debtToEquity: 0.18, currentRatio: 1.38,
    revenueGrowth: -5.2, profitGrowth: -18.4,
    about: "Chevron Corporation engages in integrated energy and chemicals operations worldwide through its Upstream and Downstream segments."
  },
];

// Generate financial data for a stock
export function getFinancialData(symbol: string): FinancialData[] {
  const stock = stocks.find(s => s.symbol === symbol);
  if (!stock) return [];
  
  const baseRevenue = stock.marketCap / stock.pe * 4;
  const years = ["2019", "2020", "2021", "2022", "2023", "2024", "TTM"];
  
  return years.map((year, i) => {
    const growth = 1 + (i * 0.08) + (Math.random() * 0.1 - 0.05);
    const revenue = Math.round(baseRevenue * growth);
    const expenseRatio = 0.7 + Math.random() * 0.1;
    const expenses = Math.round(revenue * expenseRatio);
    const operatingProfit = revenue - expenses;
    const opm = Math.round((operatingProfit / revenue) * 100);
    const otherIncome = Math.round(revenue * 0.02);
    const interest = Math.round(revenue * 0.03);
    const depreciation = Math.round(revenue * 0.05);
    const pbt = operatingProfit + otherIncome - interest - depreciation;
    const taxPercent = 21 + Math.round(Math.random() * 4);
    const netProfit = Math.round(pbt * (1 - taxPercent / 100));
    const eps = +(netProfit / (stock.marketCap / stock.price)).toFixed(2);
    
    return {
      year, revenue, expenses, operatingProfit, opm, otherIncome,
      interest, depreciation, profitBeforeTax: pbt, taxPercent, netProfit, eps
    };
  });
}

export function getBalanceSheetData(symbol: string): BalanceSheetData[] {
  const stock = stocks.find(s => s.symbol === symbol);
  if (!stock) return [];
  
  const baseAssets = stock.marketCap * 0.3;
  const years = ["2019", "2020", "2021", "2022", "2023", "2024", "TTM"];
  
  return years.map((year, i) => {
    const growth = 1 + (i * 0.06);
    const totalAssets = Math.round(baseAssets * growth);
    const equity = Math.round(totalAssets * 0.08);
    const reserves = Math.round(totalAssets * 0.32);
    const borrowings = Math.round(totalAssets * 0.25);
    const otherLiabilities = totalAssets - equity - reserves - borrowings;
    const fixedAssets = Math.round(totalAssets * 0.45);
    const investments = Math.round(totalAssets * 0.2);
    const otherAssets = totalAssets - fixedAssets - investments;
    
    return {
      year, equity, reserves, borrowings, otherLiabilities,
      totalLiabilities: totalAssets, fixedAssets, investments, otherAssets, totalAssets
    };
  });
}

export function getCashFlowData(symbol: string): CashFlowData[] {
  const stock = stocks.find(s => s.symbol === symbol);
  if (!stock) return [];
  
  const baseOCF = stock.marketCap * 0.05;
  const years = ["2019", "2020", "2021", "2022", "2023", "2024", "TTM"];
  
  return years.map((year, i) => {
    const growth = 1 + (i * 0.08);
    const operatingCashFlow = Math.round(baseOCF * growth * (0.9 + Math.random() * 0.2));
    const investingCashFlow = -Math.round(baseOCF * growth * (0.5 + Math.random() * 0.3));
    const financingCashFlow = -Math.round(baseOCF * growth * (0.2 + Math.random() * 0.2));
    const netCashFlow = operatingCashFlow + investingCashFlow + financingCashFlow;
    const freeCashFlow = operatingCashFlow + investingCashFlow;
    
    return { year, operatingCashFlow, investingCashFlow, financingCashFlow, netCashFlow, freeCashFlow };
  });
}

export function getQuarterlyData(symbol: string): QuarterlyData[] {
  const stock = stocks.find(s => s.symbol === symbol);
  if (!stock) return [];
  
  const baseRevenue = stock.marketCap / stock.pe;
  const quarters = ["Q1 2024", "Q2 2024", "Q3 2024", "Q4 2024", "Q1 2025", "Q2 2025"];
  
  return quarters.map((quarter, i) => {
    const seasonality = 1 + (i % 4 === 3 ? 0.1 : 0) + (Math.random() * 0.05);
    const revenue = Math.round(baseRevenue * seasonality);
    const expenseRatio = 0.7 + Math.random() * 0.08;
    const expenses = Math.round(revenue * expenseRatio);
    const operatingProfit = revenue - expenses;
    const opm = Math.round((operatingProfit / revenue) * 100);
    const otherIncome = Math.round(revenue * 0.015);
    const interest = Math.round(revenue * 0.025);
    const depreciation = Math.round(revenue * 0.04);
    const pbt = operatingProfit + otherIncome - interest - depreciation;
    const taxPercent = 20 + Math.round(Math.random() * 5);
    const netProfit = Math.round(pbt * (1 - taxPercent / 100));
    const eps = +(netProfit / (stock.marketCap / stock.price)).toFixed(2);
    
    return {
      quarter, revenue, expenses, operatingProfit, opm, otherIncome,
      interest, depreciation, profitBeforeTax: pbt, taxPercent, netProfit, eps
    };
  });
}

export function getRatioData(symbol: string): RatioData[] {
  const stock = stocks.find(s => s.symbol === symbol);
  if (!stock) return [];
  
  const years = ["2019", "2020", "2021", "2022", "2023", "2024", "TTM"];
  
  return years.map((year, i) => ({
    year,
    debtorDays: Math.round(30 + Math.random() * 40),
    inventoryDays: Math.round(40 + Math.random() * 60),
    daysPayable: Math.round(50 + Math.random() * 50),
    cashConversionCycle: Math.round(-20 + Math.random() * 80),
    workingCapitalDays: Math.round(-30 + Math.random() * 60),
    roce: +(stock.roce * (0.8 + i * 0.05 + Math.random() * 0.1)).toFixed(1),
    roe: +(stock.roe * (0.8 + i * 0.04 + Math.random() * 0.1)).toFixed(1),
  }));
}

export function getShareholdingData(symbol: string): ShareholdingData[] {
  const quarters = ["Q3 2023", "Q4 2023", "Q1 2024", "Q2 2024", "Q3 2024", "Q4 2024", "Q1 2025"];
  const basePromoters = 5 + Math.random() * 15;
  
  return quarters.map((quarter, i) => {
    const promoters = +(basePromoters + (Math.random() - 0.5) * 2).toFixed(1);
    const fii = +(35 + Math.random() * 15 + (Math.random() - 0.5) * 3).toFixed(1);
    const dii = +(20 + Math.random() * 10 + (Math.random() - 0.5) * 2).toFixed(1);
    const publicHolding = +(100 - promoters - fii - dii).toFixed(1);
    return { quarter, promoters, fii, dii, public: publicHolding };
  });
}

export function getPriceHistory(symbol: string, period: string = "1Y"): PriceHistory[] {
  const stock = stocks.find(s => s.symbol === symbol);
  if (!stock) return [];
  
  let days = 252;
  switch (period) {
    case "1M": days = 22; break;
    case "6M": days = 126; break;
    case "1Y": days = 252; break;
    case "3Y": days = 756; break;
    case "5Y": days = 1260; break;
    case "Max": days = 2520; break;
  }
  
  const data: PriceHistory[] = [];
  let currentPrice = stock.price * (0.7 + Math.random() * 0.3);
  
  for (let i = days; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    if (date.getDay() === 0 || date.getDay() === 6) continue;
    
    const change = (Math.random() - 0.48) * currentPrice * 0.03;
    currentPrice = Math.max(currentPrice + change, currentPrice * 0.5);
    const high = currentPrice * (1 + Math.random() * 0.02);
    const low = currentPrice * (1 - Math.random() * 0.02);
    const open = low + Math.random() * (high - low);
    const volume = Math.round(stock.avgVolume * (0.5 + Math.random()));
    
    data.push({
      date: date.toISOString().split('T')[0],
      price: +currentPrice.toFixed(2),
      volume,
      open: +open.toFixed(2),
      high: +high.toFixed(2),
      low: +low.toFixed(2),
    });
  }
  
  // Adjust last price to match current
  if (data.length > 0) {
    data[data.length - 1].price = stock.price;
  }
  
  return data;
}

export function getPeers(symbol: string): Stock[] {
  const stock = stocks.find(s => s.symbol === symbol);
  if (!stock) return [];
  return stocks.filter(s => s.sector === stock.sector && s.symbol !== symbol).slice(0, 6);
}

export const prebuiltScreens: ScreenResult[] = [
  {
    id: "high-growth",
    name: "High Growth Stocks",
    description: "Companies with revenue growth above 20% and profit growth above 30% in the trailing twelve months.",
    category: "Growth",
    stocks: ["NVDA", "META", "LLY", "AVGO", "AMZN"]
  },
  {
    id: "value-picks",
    name: "Value Picks",
    description: "Stocks trading below 15x earnings with strong fundamentals and consistent dividend payments.",
    category: "Value",
    stocks: ["JPM", "BAC", "XOM", "JNJ", "V"]
  },
  {
    id: "dividend-kings",
    name: "Dividend Aristocrats",
    description: "Companies with 25+ consecutive years of dividend increases, sorted by highest yield.",
    category: "Dividends",
    stocks: ["KO", "JNJ", "PG", "XOM", "WMT"]
  },
  {
    id: "momentum",
    name: "Momentum Leaders",
    description: "Stocks within 10% of 52-week high with above-average volume and positive price trend.",
    category: "Technical",
    stocks: ["NVDA", "META", "AVGO", "LLY", "GOOGL"]
  },
  {
    id: "low-pe",
    name: "Low P/E Ratio",
    description: "Profitable companies trading at P/E ratios below the market average of 20x.",
    category: "Value",
    stocks: ["JPM", "BAC", "XOM", "JNJ", "UNH"]
  },
  {
    id: "high-roce",
    name: "High ROCE",
    description: "Companies with Return on Capital Employed above 30%, indicating efficient capital allocation.",
    category: "Quality",
    stocks: ["NVDA", "AAPL", "MSFT", "V", "MA"]
  },
  {
    id: "52w-high",
    name: "Near 52-Week High",
    description: "Stocks trading within 5% of their 52-week high price, indicating strong bullish momentum.",
    category: "Technical",
    stocks: ["NVDA", "AVGO", "META", "LLY", "MSFT"]
  },
  {
    id: "magic-formula",
    name: "Magic Formula",
    description: "Based on Joel Greenblatt's Magic Formula combining high earnings yield and high return on capital.",
    category: "Formula",
    stocks: ["AAPL", "MSFT", "GOOGL", "META", "V"]
  },
  {
    id: "piotroski",
    name: "Piotroski F-Score 9",
    description: "Companies with perfect Piotroski F-Score of 9, indicating strong financial health across profitability, leverage, and efficiency.",
    category: "Formula",
    stocks: ["MSFT", "GOOGL", "V", "UNH", "PG"]
  },
  {
    id: "golden-crossover",
    name: "Golden Crossover",
    description: "Stocks where the 50-day moving average has crossed above the 200-day moving average, a bullish technical signal.",
    category: "Technical",
    stocks: ["NVDA", "META", "AVGO", "AMZN", "GOOGL"]
  },
  {
    id: "debt-free",
    name: "Debt-Free Companies",
    description: "Companies with zero or minimal long-term debt and strong cash positions on their balance sheet.",
    category: "Quality",
    stocks: ["GOOGL", "NVDA", "TSLA", "META", "AAPL"]
  },
  {
    id: "quarterly-growers",
    name: "Quarterly Revenue Growers",
    description: "Companies showing consecutive quarter-over-quarter revenue growth for the past 4 quarters.",
    category: "Growth",
    stocks: ["NVDA", "META", "AVGO", "LLY", "MSFT"]
  },
];

export function searchStocks(query: string): Stock[] {
  const q = query.toLowerCase();
  return stocks.filter(s => 
    s.symbol.toLowerCase().includes(q) || 
    s.name.toLowerCase().includes(q) ||
    s.sector.toLowerCase().includes(q) ||
    s.industry.toLowerCase().includes(q)
  );
}

export function formatNumber(num: number, decimals: number = 0): string {
  if (Math.abs(num) >= 1e6) return (num / 1e6).toFixed(1) + "T";
  if (Math.abs(num) >= 1e3) return (num / 1e3).toFixed(1) + "B";
  return num.toFixed(decimals);
}

export function formatMarketCap(num: number): string {
  if (num >= 1e6) return "$" + (num / 1e6).toFixed(2) + "T";
  if (num >= 1e3) return "$" + (num / 1e3).toFixed(0) + "B";
  return "$" + num.toFixed(0) + "M";
}

export function formatCurrency(num: number): string {
  return "$" + num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function formatLargeNumber(num: number): string {
  if (Math.abs(num) >= 1e9) return (num / 1e9).toFixed(1) + "B";
  if (Math.abs(num) >= 1e6) return (num / 1e6).toFixed(1) + "M";
  if (Math.abs(num) >= 1e3) return (num / 1e3).toFixed(1) + "K";
  return num.toString();
}
