# StockTrackr — Personal Indian Stock Portfolio Tracker

A minimalist MERN stack application for tracking your NSE/BSE stock portfolio with live Yahoo Finance data, P&L analysis, and beautiful charts.

> ⚠️ **Disclaimer**: Data sourced from Yahoo Finance (unofficial, delayed). Suitable for portfolio tracking and analysis only — **NOT for algorithmic trading decisions**.

---

## Features

- 📊 **Dashboard** — Portfolio value, P&L, today's change, allocation chart, top movers
- 💼 **Portfolios** — Multiple named portfolios with holdings table
- 📈 **Stock Charts** — 1D/1W/1M/3M/6M/1Y/5Y ranges + compare up to 3 stocks
- 👁 **Watchlist** — Track stocks with one-click "Buy" conversion
- 📋 **Transactions** — Full buy/sell history with realized gain tracking
- 🗄️ **Caching** — MongoDB cache (2min for prices, 1hr for history) to respect rate limits
- 🇮🇳 **Indian Market Focus** — NSE (`.NS`) and BSE (`.BO`) tickers supported

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Node.js + Express |
| Database | MongoDB + Mongoose |
| Market Data | yahoo-finance2 |
| Frontend | React + Vite |
| Charts | Recharts |
| HTTP Client | Axios |
| Routing | React Router v6 |

---

## Quick Start

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)

### 1. Clone & Setup

```bash
git clone <repo-url>
cd Stock
```

### 2. Backend Setup

```bash
cd server
cp ../.env.example .env   # Edit MONGO_URI if needed
npm install
```

### 3. Seed the Database

```bash
npm run seed
```

This creates:
- 2 portfolios: "Long Term" & "Swing Trades"
- 6 holdings: RELIANCE.NS, TCS.NS, HDFCBANK.NS, INFY.NS, WIPRO.NS, ITC.NS
- 5 watchlist entries
- All transactions logged

### 4. Start the Backend

```bash
npm run dev   # starts on http://localhost:5000
```

### 5. Frontend Setup

```bash
cd ../client
npm install
npm run dev   # starts on http://localhost:5173
```

### 6. Open in Browser

```
http://localhost:5173
```

---

## Environment Variables

See [`.env.example`](.env.example) for all options.

| Variable | Default | Description |
|---|---|---|
| `PORT` | `5000` | Express server port |
| `MONGO_URI` | `mongodb://localhost:27017/stocktracker` | MongoDB connection string |
| `PRICE_CACHE_TTL_MINUTES` | `2` | Live price cache duration |
| `HISTORY_CACHE_TTL_MINUTES` | `60` | Historical data cache duration |
| `CLIENT_URL` | `http://localhost:5173` | Frontend URL for CORS |

---

## API Reference

### Portfolios
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/portfolios` | List all portfolios |
| `POST` | `/api/portfolios` | Create portfolio `{ name, description }` |
| `PUT` | `/api/portfolios/:id` | Update portfolio |
| `DELETE` | `/api/portfolios/:id` | Delete portfolio + holdings |
| `GET` | `/api/portfolios/:id/holdings` | Holdings with live P&L |

### Holdings
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/holdings` | Add holding `{ portfolioId, ticker, quantity, buyPrice, buyDate }` |
| `PUT` | `/api/holdings/:id` | Update holding |
| `DELETE` | `/api/holdings/:id` | Remove holding |

### Stock Data
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/stocks/:ticker/quote` | Live price (cached 2min) |
| `GET` | `/api/stocks/:ticker/history?range=1M` | Historical OHLCV (cached 1hr) |
| `GET` | `/api/stocks/:ticker/validate` | Validate ticker symbol |
| `GET` | `/api/stocks/compare?tickers=A,B&range=3M` | Compare up to 3 stocks |

**Supported `range` values**: `1D`, `1W`, `1M`, `3M`, `6M`, `1Y`, `5Y`

### Watchlist
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/watchlist` | Get all watchlist items |
| `POST` | `/api/watchlist` | Add `{ ticker, notes, targetPrice }` |
| `DELETE` | `/api/watchlist/:id` | Remove from watchlist |
| `POST` | `/api/watchlist/:id/buy` | Convert to holding `{ portfolioId, quantity, buyPrice, buyDate }` |

### Transactions
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/transactions` | List with optional `?portfolioId=&type=&ticker=` |
| `POST` | `/api/transactions` | Log manual sell |

### Dashboard
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/dashboard/summary` | Aggregated portfolio, P&L, allocation, movers |

---

## NSE/BSE Ticker Format

| Exchange | Suffix | Example |
|---|---|---|
| NSE | `.NS` | `RELIANCE.NS` |
| BSE | `.BO` | `RELIANCE.BO` |

---

## Project Structure

```
Stock/
├── server/
│   ├── config/db.js           — MongoDB connection
│   ├── models/                — Mongoose schemas
│   │   ├── Portfolio.js
│   │   ├── Holding.js
│   │   ├── Watchlist.js
│   │   ├── Transaction.js
│   │   └── StockCache.js
│   ├── routes/                — Express routers
│   ├── controllers/           — Business logic
│   ├── services/
│   │   ├── yahooFinanceService.js  — API calls + caching
│   │   └── analyticsService.js    — P&L calculations
│   ├── seed.js                — Sample data loader
│   └── server.js              — Express entry point
├── client/
│   └── src/
│       ├── api/               — Axios API modules
│       ├── hooks/             — React data hooks
│       ├── components/        — Reusable UI components
│       ├── pages/             — Page components
│       ├── utils/             — Helpers (currency, dates)
│       ├── App.jsx            — Root + routing
│       └── index.css          — Design system
└── .env.example
```

---

## License

MIT — personal use only. Not affiliated with Yahoo Finance.
