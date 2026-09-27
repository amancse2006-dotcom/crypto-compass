# CryptoScope — College Mini-Project Report Material

**Project title:** CryptoScope: Cryptocurrency Market Analysis & Risk Intelligence Platform  
**Project type:** Educational web application / mini-project

## 1. Abstract

CryptoScope is a responsive web application for exploring cryptocurrency spot markets through live public ticker and OHLCV data. A React and TypeScript frontend communicates with a Python FastAPI backend. The backend retrieves market data from Bybit's public V5 API, calculates a suite of technical indicators, checks recent candles against explicit candlestick rules, and combines normalized factor scores using a documented weighted model. The analysis view also reports historical volatility, maximum drawdown, observed range, relative volume, and a qualitative risk class. Users can search pairs, view charts, save a watchlist, and track user-entered holdings locally in their browser. The platform is designed to explain its calculations and limitations; its signals are educational summaries, not guaranteed predictions or financial advice.

## 2. Problem statement

Market data, indicator calculations, and portfolio tracking are often spread across separate tools. Learners may find it difficult to connect raw candle data with technical indicators and risk measures, or to understand how a displayed signal was formed. The project addresses this learning need with one small, inspectable application that retrieves public data and presents calculated context with an explicit methodology.

## 3. Objectives

1. Retrieve current public cryptocurrency ticker and candle data without private API keys.
2. Display market movement and interactive timeframe-based price history.
3. Compute and explain technical indicators and candlestick observations.
4. Present a weighted, reproducible technical signal and its factor contributions.
5. Summarize historical volatility, drawdown, range, trend, and volume conditions.
6. Provide searchable coin exploration, a browser-local watchlist, and a browser-local portfolio tracker.
7. Deliver an accessible responsive interface with loading, unavailable-data, empty, and error states.
8. Explain educational limitations and avoid claims of certain price prediction.

## 4. Existing system

Many market websites provide charts, news, watchlists, or technical indicators, but may split these functions across products or hide the details of their scoring. They are not necessarily designed to demonstrate how data moves through a simple student project. CryptoScope focuses on a compact, inspectable pipeline and describes its rule-based calculations directly.

## 5. Proposed system

CryptoScope uses a browser frontend and a FastAPI service. The service proxies public Bybit spot-market ticker and kline endpoints, runs pure Python/NumPy calculations, sanitizes non-finite values, and returns JSON. The frontend consumes this typed API and renders the dashboard, analysis, explorer, watchlist, portfolio, and methodology pages. Saved pairs and holdings stay in browser `localStorage`; market data is not simulated when upstream data is unavailable.

## 6. Methodology

The selected timeframe's candle series feeds price, momentum, volatility, volume, and pattern calculations. The signal engine normalizes each category from −1 to +1, applies weights of trend 30%, momentum 25%, volatility 20%, volume 15%, and pattern 10%, and sums the weighted values. A final score ≥ +0.20 is labeled bullish; ≤ −0.20 bearish; values between those thresholds are neutral. The component values and weights are exposed in the UI so a student can trace the result.

Trend uses the direction of the latest close relative to computed simple and exponential moving averages. Momentum combines indicator direction rules for RSI, MACD, rate of change, momentum, stochastic, CCI, and Williams %R. Volatility contributes a negative risk adjustment from the standard deviation of per-candle returns, capped at 5%. Volume compares the latest candle with the average of the most recent 20 candles. Pattern contribution uses directional patterns detected by the explicit rules in `backend/analysis.py`.

Risk measures are computed over the fetched candle window: volatility is the standard deviation of returns per candle and is not annualized; maximum drawdown is the worst close relative to a prior running peak; range is the maximum high less minimum low relative to the latest close; volume ratio is latest volume divided by the trailing 20-candle mean. Risk classes are descriptive thresholds in the backend, not external ratings.

## 7. System architecture

```text
Browser
  ├─ React + TypeScript, Vite, TanStack Router, React Query, Tailwind
  ├─ SVG OHLC candlestick chart and responsive pages
  └─ localStorage: watchlist + holdings
       │ JSON over HTTP (VITE_API_URL)
       ▼
FastAPI application (backend/main.py)
  ├─ /api/market/ticker ── Bybit V5 public market tickers
  ├─ /api/market/klines ── Bybit V5 public market klines
  ├─ /api/analysis ─────── backend/analysis.py (NumPy indicator and signal engine)
  └─ /api/news ─────────── CryptoPanic public news feed (optional)
```

## 8. Data flow

1. The user opens a page or chooses a pair and timeframe.
2. The frontend issues an HTTP request to FastAPI with the symbol, interval, and optional candle count.
3. FastAPI validates the interval/limit and requests the corresponding public market data.
4. Bybit returns ticker or newest-first candle records; the backend maps the response into normalized ticker/OHLCV fields and reverses candles into chronological order.
5. For analysis, NumPy arrays are passed to the technical indicator and pattern routines. The weighted signal and historical risk metrics are derived from the same candle set.
6. Non-finite numbers are converted to JSON `null` values. The frontend adapts the response to its TypeScript models and renders loading, data, or failure states.
7. The user may save a pair or holding in local browser storage. Portfolio value combines the user-entered quantity with the latest available ticker; unavailable prices remain unavailable.

## 9. Technologies used

- **Frontend:** React 19, TypeScript, Vite, TanStack Router, TanStack Query, Tailwind CSS, Lucide icons, Recharts dependency (custom SVG used for the candle plot).
- **Backend:** Python 3, FastAPI, Uvicorn, HTTPX, NumPy.
- **Market source:** Bybit public V5 REST API.
- **News source:** CryptoPanic public feed, best-effort.
- **Storage:** Browser `localStorage` for watchlist and portfolio only; no user accounts or database.

## 10. Feature descriptions

- **Dashboard:** Live selected-asset tickers, BTC price/range context, selected volume summary, and quick links.
- **Analysis:** Pair/timeframe controls, live ticker, OHLC candles, indicator and pattern tables, multi-timeframe summaries, weighted factor breakdown, risk metrics, and optional news.
- **Coin Explorer:** Searchable supported USDT pairs and current public ticker values.
- **Portfolio:** User-entered pair, quantity, and average cost, combined with current public prices to show estimated market value and unrealized P/L.
- **Watchlist:** Add/remove market pairs and refresh their current ticker details.
- **Methodology:** Project purpose, scoring approach, technical limitations, and educational disclaimer.

## 11. Results and screenshots checklist

For a demonstration capture, run both services and record screenshots of:

- [ ] Dashboard with successful live ticker data and the refresh/status state.
- [ ] Coin Explorer search results for a supported pair.
- [ ] Analysis page with selected pair/timeframe and a populated candlestick chart.
- [ ] Technical indicator table and detected-pattern view.
- [ ] Weighted signal categories, score, explanation, and risk cards.
- [ ] Watchlist with an added pair after page reload (demonstrates local persistence).
- [ ] Portfolio with entered sample quantity/cost and live valuation (clearly label sample inputs).
- [ ] API-down or unsupported-pair state showing a clear error/unavailable message.
- [ ] Methodology/disclaimer page.

Screenshots should be captured from the running version and should not replace or imply actual market values if API data is unavailable.

## 12. Limitations

- Public provider availability, rate limits, and supported trading pairs constrain data access.
- Price and analysis values describe returned historical observations and can become stale between refreshes.
- The signal is a transparent heuristic, not a statistically validated strategy, and its categories can disagree.
- Candle pattern rules can generate false positives, overlap, and omit contextual information such as liquidity or market regime.
- Volatility is per-bar rather than annualized; measures depend on selected timeframe and data window.
- The browser-local portfolio has no sync, authentication, fees, taxes, deposits, or withdrawal handling.
- The optional news feed can return no results and is not used in signal scoring.

## 13. Future scope

- Add automated unit tests and deterministic fixture-based backend tests.
- Add more formally validated indicators and disclose warm-up periods and parameter settings.
- Add alternative chart overlays and separate subplots for volume, RSI, and MACD.
- Add configurable score weights with saved methodology versions.
- Add user-controlled portfolio cash flows and fee/tax inputs, while retaining clear privacy boundaries.
- Add caching, provider timeouts/retries, rate limiting, and more robust source health indicators.
- Add optional exchange adapters and paper-trading simulations; no live order execution is in current scope.
- Conduct a historical backtest with out-of-sample evaluation before making any performance claims.

## 14. Conclusion

CryptoScope demonstrates a full-stack path from public market data to a browser-based educational analysis interface. Its modular frontend/backend structure, explicit weighted score, visible risk statistics, and clear limitations make it suitable for demonstrating API integration and basic financial data analysis. It does not predict prices with certainty or provide investment recommendations.

## 15. References

1. Bybit, “V5 API Documentation — Market,” https://bybit-exchange.github.io/docs/v5/market/overview (public ticker and kline endpoint reference; accessed 2026-09-27).
2. FastAPI documentation, https://fastapi.tiangolo.com/ (accessed 2026-09-27).
3. NumPy documentation, https://numpy.org/doc/ (accessed 2026-09-27).
4. TanStack Router documentation, https://tanstack.com/router/latest (accessed 2026-09-27).
5. CryptoPanic, https://cryptopanic.com/ (optional public news feed; accessed 2026-09-27).
6. Kanav GPT, “Crypto Compass” reference concept/repository, https://github.com/kanavgpt007-svg/crypto-compass/ (consulted for general project inspiration; implementation and CryptoScope analysis model are independently developed).

## 16. Viva questions and suggested answers

1. **What is CryptoScope?** — A web application that retrieves public crypto market data and presents technical and historical risk context for learning.
2. **What does OHLCV mean?** — Open, high, low, close, and traded volume over a selected candle interval.
3. **Why use FastAPI?** — It provides a lightweight Python HTTP API with parameter validation and async requests to the market provider.
4. **What is a moving average?** — A smoothed estimate of recent price level; SMA weights observations equally, while EMA weights recent observations more heavily.
5. **What does RSI measure?** — Recent upward versus downward price movement on a bounded scale, commonly 0–100.
6. **What is maximum drawdown?** — The largest percentage decline from a running historical peak to a later trough in the selected sample.
7. **How is the CryptoScope score calculated?** — Five normalized factor directions are weighted trend 30%, momentum 25%, volatility 20%, volume 15%, patterns 10%, then summed.
8. **Why is volatility a risk deduction?** — It represents larger observed per-bar moves; it can increase both upside and downside and is not treated as directional evidence.
9. **Does a bullish signal mean the price will rise?** — No. It summarizes selected historical rules and has no certainty or predictive guarantee.
10. **Why normalize Bybit's candle order?** — The API returns newest-first; chronological order makes charting and rolling calculations consistent.
11. **Where are watchlist and portfolio data stored?** — In local browser storage on that device/browser; there is no server account or synchronization.
12. **What happens if the market API fails?** — The UI reports unavailable/error states and does not substitute fabricated market values.
13. **What is a candlestick pattern?** — A rule-based description of candle body/wick relationships over one or more bars; context and confirmation matter.
14. **Why is volatility not annualized?** — Annualization requires assumptions about sampling frequency and market behavior; the UI instead labels the per-candle historical measure.
15. **What would you improve next?** — Add deterministic tests, documented warm-up handling, out-of-sample evaluation, caching, and user-configurable analysis settings.

## 17. 2–3 minute presentation script

Good morning. Our mini-project is CryptoScope, a cryptocurrency market analysis and risk intelligence platform. We built it to demonstrate how public market data can be turned into explainable educational analysis in a single web application.

The frontend is developed with React and TypeScript. It communicates with a Python FastAPI backend, which retrieves spot ticker and candle data from Bybit's public API. In the dashboard and coin explorer, users can view live USDT pair prices and daily changes. In Analysis, a user chooses a coin and timeframe, then sees its OHLC candlestick chart, technical indicators, and any candlestick rules detected in the latest bars.

An important part of the project is the CryptoScope weighted signal. It combines five categories: trend at 30 percent, momentum at 25 percent, volatility at 20 percent, volume at 15 percent, and candle patterns at 10 percent. The page displays each contribution and a written explanation, so the result is inspectable rather than a hidden label. The risk section reports historical per-candle volatility, maximum drawdown, range, and relative volume for the selected data window.

The application also includes a browser-local watchlist and portfolio tracker. Portfolio holdings are entered by the user and valued using live ticker data; they are not uploaded to an account.

CryptoScope has important limitations. Data depends on public providers, technical rules can be wrong, and the score is not a forecast or investment recommendation. It is intended for research and classroom demonstration, not financial advice. Future work could include automated tests, more chart indicators, robust caching, and rigorous out-of-sample evaluation. Thank you.

## 18. Presentation outline (14 slides)

1. Title: CryptoScope and team / institution details.
2. Motivation: Market information is fragmented for beginner analysis.
3. Problem statement and intended student-learning outcome.
4. Project objectives.
5. Existing-system observations and project scope.
6. Proposed CryptoScope features.
7. System architecture (React → FastAPI → Bybit / optional CryptoPanic).
8. Data flow from query to normalized candle records to UI.
9. Indicator and candle-pattern examples.
10. Weighted signal model with factor weights and thresholds.
11. Risk measures: volatility, drawdown, range, volume ratio.
12. Screenshots/demo: Dashboard, Explorer, Analysis.
13. Screenshots/demo: Portfolio, Watchlist; limitations and disclaimer.
14. Conclusion, future scope, and references.
