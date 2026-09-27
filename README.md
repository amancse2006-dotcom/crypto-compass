# CryptoScope

**Cryptocurrency Market Analysis & Risk Intelligence Platform**

CryptoScope is an educational market dashboard built with React, TypeScript, TanStack Router, and FastAPI. It retrieves public spot-market candles, tickers, and news, then presents technical indicators, candlestick observations, a weighted signal, and historical risk measures. The UI and scoring approach are original to this project. The high-level idea of a crypto analysis dashboard was informed by [Crypto Compass](https://github.com/kanavgpt007-svg/crypto-compass/); this repository is not a copy of its implementation.

## Features

- Live market dashboard and searchable USDT spot-pair explorer, refreshed every 30 seconds.
- OHLCV candlestick chart and selectable analysis timeframes.
- Backend technical indicators including SMA, EMA, RSI, MACD, ATR, stochastic, CCI, and volume average, plus rule-based candle-pattern observations.
- Explainable CryptoScope score: trend 30%, momentum 25%, volatility 20%, volume 15%, pattern 10%; components and contributions are shown in Analysis.
- Historical volatility, maximum drawdown, candle-window range, trend strength, and relative volume assessment.
- Browser-local watchlist and portfolio tracker. Portfolio valuation uses live ticker data; quantities and average costs are user-entered.
- Market news from the public CryptoPanic feed when available.
- Educational disclaimer and methodology page.

## Architecture

```text
React / TypeScript (Vite, TanStack Router, React Query, Tailwind, SVG chart)
        │ HTTP JSON (VITE_API_URL; default http://localhost:8000)
        ▼
FastAPI (backend/main.py) ── public Bybit V5 API: spot tickers and klines
        ├── backend/analysis.py: indicators, candle rules, weighted score, risk
        └── public CryptoPanic feed: optional news (empty list on source failure)
```

The frontend normalizes the backend response into typed models in `src/lib/api.ts`. Watchlist and portfolio records use versioned `localStorage` keys; no account or database is required. The backend is read-only and does not place trades.

## Setup

Requirements: Node.js 20+ with npm, Python 3.10+, and network access to the public data providers.

### Backend

```powershell
cd backend
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

The service listens at `http://localhost:8000`. `ALLOWED_ORIGINS` can be set to a comma-separated list of exact browser origins; by default localhost ports 8080, 5173, and 3000 are allowed.

### Frontend

In a second terminal, from the repository root:

```powershell
npm install
Copy-Item .env.example .env
npm run dev -- --host 127.0.0.1 --port 8080
```

The example `.env` sets `VITE_API_URL=http://localhost:8000`. Open `http://localhost:8080`. Production build: `npm run build`; static preview: `npm run preview`.

## API

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/` | Service health metadata |
| GET | `/api/market/ticker?symbol=BTC/USDT` | Latest public ticker and 24h fields |
| GET | `/api/market/klines?symbol=BTC/USDT&interval=1h&limit=200` | OHLCV candle series |
| GET | `/api/analysis?symbol=BTC/USDT&interval=1h` | Indicators, detected patterns, signal breakdown, risk metrics |
| GET | `/api/news?symbol=BTC/USDT&limit=8` | Optional relevant news items |

Supported intervals: `1m`, `5m`, `15m`, `1h`, `4h`, `1d`, `1M`. The backend validates intervals and candle limits and sanitizes non-finite analysis values for JSON.

## Methodology

Each factor is normalized to a direction between −1 and +1. Trend is the mean sign of available price-versus-SMA/EMA comparisons. Momentum uses directional RSI, MACD, ROC, momentum, stochastic, CCI, and Williams %R rules. Volatility is a risk deduction derived from the standard deviation of candle-to-candle returns, capped at 5% per bar. Volume compares the latest candle with its trailing 20-candle average. Pattern direction averages currently detected directional rules. The final score is the weighted sum; scores at or above +0.20 are bullish, at or below −0.20 bearish, otherwise neutral.

Risk statistics are descriptive of the candles returned for the chosen interval: volatility is per-candle return standard deviation (not annualized), maximum drawdown is peak-to-trough close drawdown, and range is full-window high-to-low relative to the latest close. These values depend on timeframe and data window. Rule-based patterns are heuristics and may overlap; they are not independently validated trading strategies.

## Limitations and safety

- Market coverage, rate limits, availability, and field meanings are controlled by upstream public endpoints; there is no fallback price fabrication.
- News availability varies. Missing news is shown as an empty state.
- Portfolio records are stored only in the current browser and are not synced or backed up. P/L excludes fees, taxes, cash flows, and corporate/network events.
- The score is an educational summary of historical data, not a forecast or recommendation. Crypto assets are volatile; this application is not financial advice.

## College project material

See [docs/college-project.md](docs/college-project.md) for the abstract, problem statement, objectives, methodology, architecture, data flow, demo checklist, limitations, future scope, references, viva Q&A, presentation script, and slide outline.
