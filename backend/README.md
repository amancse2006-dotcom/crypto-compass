# CryptoScope API

FastAPI service providing public market data, technical analysis, risk measures, and optional news to the CryptoScope frontend. It is read-only and does not require exchange credentials.

## Run locally

```powershell
cd backend
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

## Routes

| Route | Parameters | Response |
|---|---|---|
| `GET /` | — | Service health metadata |
| `GET /api/market/ticker` | required `symbol`, e.g. `BTC/USDT` | Last price, 24h change/range and volume |
| `GET /api/market/klines` | `symbol`, `interval` (default `1h`), `limit` (10–1000) | Chronological OHLCV candles |
| `GET /api/analysis` | `symbol`, `interval` (default `1h`) | Indicators, detected patterns and summary with weighted breakdown and historical risk metrics |
| `GET /api/news` | `symbol`, `limit` (1–30, default 8) | Best-effort news items; empty list when feed is unavailable |

Supported intervals are `1m`, `5m`, `15m`, `1h`, `4h`, `1d`, and `1M`. Ticker and candle data come from Bybit V5 public spot-market endpoints. News uses the public CryptoPanic feed and is not part of analysis scoring.

## Signal and risk

The backend returns factor directions from −1 to +1 for trend (30%), momentum (25%), volatility (20%), volume (15%), and detected patterns (10%). The weighted sum is bullish at ≥ +0.20, bearish at ≤ −0.20, otherwise neutral. The response includes each factor's normalized score and weight. Risk metrics describe only the returned candle window; volatility is per candle and not annualized.

`ALLOWED_ORIGINS` may be configured as a comma-separated list of exact origins. The default allows localhost ports 8080, 5173, and 3000 for development. Configure the deployed frontend origin before hosting the service publicly.
