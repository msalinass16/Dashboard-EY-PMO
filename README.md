# Portfolio Dashboard

A professional investment dashboard — Bloomberg/Koyfin-style dark UI — built with React, TypeScript, Vite, Tailwind CSS, and Recharts.

## Quick Start

```bash
npm install
npm run dev
```

Then open http://localhost:5173

## Features

- **Portfolio Summary** — current value, invested capital, unrealized P&L, daily P&L
- **Holdings Table** — sortable by every column, click any row to drill into position detail
- **Allocation Charts** — position, sector, and market-cap pie charts
- **Benchmark Analysis** — portfolio vs SPY and QQQ with 1M / 3M / 6M / 1Y / ALL periods
- **Valuation Metrics** — weighted P/E, forward P/E, PEG, EV/EBITDA, revenue growth, margins, ROIC, FCF yield
- **Concentration Metrics** — HHI index, top-N weights, diversification score, effective N
- **Risk Analytics** — beta, annualized volatility, Sharpe ratio, max drawdown, alpha vs SPY/QQQ
- **Position Detail** — price chart, company description, analyst targets, key statistics

## Data Sources

### Primary — Yahoo Finance (no API key required)
Requests are proxied through the Vite dev server (`/api/yahoo/*` → `https://query1.finance.yahoo.com`). This avoids browser CORS issues. Works in `npm run dev` only.

### Fallback — Demo Mode
When Yahoo Finance is unreachable the app automatically falls back to generated demo data so the UI is always functional. A yellow banner in the header indicates demo mode.

### Optional — Financial Modeling Prep
Create a `.env` file and add:
```
VITE_FMP_API_KEY=your_key_here
```
Then in `src/config/dataProviders.ts` change `primary` or `fallback` to `'fmp'`.

## Switching Data Providers

Edit `src/config/dataProviders.ts`:

```ts
const config: DataProviderConfig = {
  primary: 'yahoo',      // 'yahoo' | 'fmp' | 'mock'
  fallback: 'mock',      // 'yahoo' | 'fmp' | 'mock'
  fmpApiKey: '',         // or set VITE_FMP_API_KEY
  refreshIntervalMs: 60_000,   // how often to auto-refresh quotes
  enableMockFallback: true,    // set false to disable demo mode
};
```

## Adding / Editing Holdings

Edit `src/data/holdings.ts`. Each entry:

```ts
{
  ticker: 'NVDA',
  name: 'NVIDIA',
  shares: 2.80,
  avgCost: 221.76,   // per share
  sector: 'Technology',
  marketCapCategory: 'Mega Cap',  // 'Mega Cap' | 'Large Cap' | 'Mid Cap' | 'Small Cap' | 'ETF'
  isETF: false,
}
```

## Production Build

```bash
npm run build
npm run preview
```

> **Note**: The Yahoo Finance proxy is a Vite dev-server feature. For a production deployment you need a backend proxy (nginx, Express, etc.) to forward requests to Yahoo Finance and avoid CORS.

## Tech Stack

| Tool | Version | Purpose |
|------|---------|---------|
| React | 18 | UI |
| TypeScript | 5 | Type safety |
| Vite | 5 | Build / dev server / proxy |
| Tailwind CSS | 3 | Styling |
| Recharts | 2 | Charts |
| React Router | 6 | Client-side routing |
| date-fns | 3 | Date utilities |
| lucide-react | latest | Icons |
