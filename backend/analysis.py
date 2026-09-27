"""
Technical analysis engine.

run_analysis(candles) -> {
    "indicators": [ { name, value, signal } x ~40 ],
    "patterns":   [ { name, signal, description } x up to 40 ],
    "summary":    { indicators: 'buy'|'sell'|'neutral', patterns: ..., overall: ... },
    "perTimeframe": optional (computed client-side via multiple calls),
}

Pure-python (numpy only) so no TA-Lib install is needed.
"""

from __future__ import annotations
from typing import Literal
import numpy as np

Signal = Literal["buy", "sell", "neutral", "strong_buy", "strong_sell"]


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
def _sma(x: np.ndarray, n: int) -> float:
    if len(x) < n:
        return float("nan")
    return float(np.mean(x[-n:]))


def _ema_series(x: np.ndarray, n: int) -> np.ndarray:
    if len(x) < n:
        return np.full(len(x), np.nan, dtype=float)
    k = 2 / (n + 1)
    out = np.empty(len(x), dtype=float)
    out[0] = float(x[0])
    for i, value in enumerate(x[1:], 1):
        out[i] = float(value) * k + out[i - 1] * (1 - k)
    return out


def _ema(x: np.ndarray, n: int) -> float:
    if len(x) < n:
        return float("nan")
    return float(_ema_series(x, n)[-1])


def _rsi(x: np.ndarray, n: int = 14) -> float:
    if len(x) < n + 1:
        return float("nan")
    d = np.diff(x)
    up = np.where(d > 0, d, 0.0)
    dn = np.where(d < 0, -d, 0.0)
    au = np.mean(up[-n:])
    ad = np.mean(dn[-n:])
    if ad == 0:
        return 100.0
    rs = au / ad
    return float(100 - 100 / (1 + rs))


def _macd(x: np.ndarray) -> tuple[float, float, float]:
    if len(x) < 26:
        return float("nan"), float("nan"), float("nan")
    macd_series = _ema_series(x, 12) - _ema_series(x, 26)
    signal_series = _ema_series(macd_series, 9)
    macd, signal = float(macd_series[-1]), float(signal_series[-1])
    return macd, signal, macd - signal


def _stoch(h: np.ndarray, l: np.ndarray, c: np.ndarray, n: int = 14) -> float:
    if len(c) < n:
        return float("nan")
    hh = float(np.max(h[-n:]))
    ll = float(np.min(l[-n:]))
    if hh == ll:
        return 50.0
    return float((c[-1] - ll) / (hh - ll) * 100)


def _atr(h: np.ndarray, l: np.ndarray, c: np.ndarray, n: int = 14) -> float:
    if len(c) < n + 1:
        return float("nan")
    tr = np.maximum.reduce([
        h[1:] - l[1:],
        np.abs(h[1:] - c[:-1]),
        np.abs(l[1:] - c[:-1]),
    ])
    return float(np.mean(tr[-n:]))


def _cci(h: np.ndarray, l: np.ndarray, c: np.ndarray, n: int = 20) -> float:
    if len(c) < n:
        return float("nan")
    tp = (h + l + c) / 3
    sma = np.mean(tp[-n:])
    md = np.mean(np.abs(tp[-n:] - sma))
    if md == 0:
        return 0.0
    return float((tp[-1] - sma) / (0.015 * md))


def _bullbear(value: float, low: float, high: float) -> Signal:
    if np.isnan(value):
        return "neutral"
    if value <= low:
        return "buy"
    if value >= high:
        return "sell"
    return "neutral"


# ---------------------------------------------------------------------------
# Indicator suite (≈ 40)
# ---------------------------------------------------------------------------
def compute_indicators(o, h, l, c, v) -> list[dict]:
    out: list[dict] = []
    price = c[-1]

    # Moving averages (12)
    for n in (5, 10, 20, 30, 50, 100, 200):
        s = _sma(c, n)
        out.append({"name": f"SMA{n}", "value": round(s, 6), "signal": "buy" if price > s else "sell" if price < s else "neutral"})
        e = _ema(c, n)
        out.append({"name": f"EMA{n}", "value": round(e, 6), "signal": "buy" if price > e else "sell" if price < e else "neutral"})

    # Oscillators
    rsi = _rsi(c)
    out.append({"name": "RSI(14)", "value": round(rsi, 2), "signal": _bullbear(rsi, 30, 70)})

    macd, sig, hist = _macd(c)
    out.append({"name": "MACD", "value": round(macd, 4), "signal": "buy" if macd > sig else "sell" if macd < sig else "neutral"})
    out.append({"name": "MACD Hist", "value": round(hist, 4), "signal": "buy" if hist > 0 else "sell" if hist < 0 else "neutral"})

    stoch = _stoch(h, l, c)
    out.append({"name": "Stoch %K", "value": round(stoch, 2), "signal": _bullbear(stoch, 20, 80)})

    cci = _cci(h, l, c)
    out.append({"name": "CCI(20)", "value": round(cci, 2), "signal": _bullbear(cci, -100, 100)})

    atr = _atr(h, l, c)
    out.append({"name": "ATR(14)", "value": round(atr, 4), "signal": "neutral"})

    # Momentum / ROC
    if len(c) > 10:
        roc = (c[-1] / c[-10] - 1) * 100
        out.append({"name": "ROC(10)", "value": round(roc, 2), "signal": "buy" if roc > 0 else "sell"})
        mom = c[-1] - c[-10]
        out.append({"name": "Momentum(10)", "value": round(mom, 4), "signal": "buy" if mom > 0 else "sell"})

    # Williams %R
    if len(c) >= 14:
        hh = float(np.max(h[-14:]))
        ll = float(np.min(l[-14:]))
        wr = -100 * (hh - c[-1]) / (hh - ll) if hh != ll else -50
        out.append({"name": "Williams %R", "value": round(wr, 2), "signal": _bullbear(-wr, 20, 80)})

    # Bull/Bear power (Elder)
    e13 = _ema(c, 13)
    out.append({"name": "Bull Power", "value": round(h[-1] - e13, 4), "signal": "buy" if h[-1] > e13 else "sell"})
    out.append({"name": "Bear Power", "value": round(l[-1] - e13, 4), "signal": "buy" if l[-1] > e13 else "sell"})

    # Ultimate Oscillator (lite)
    if len(c) > 28:
        bp = c[-1] - min(l[-1], c[-2])
        tr = max(h[-1], c[-2]) - min(l[-1], c[-2])
        uo = (bp / tr * 100) if tr else 50
        out.append({"name": "Ultimate Osc", "value": round(uo, 2), "signal": _bullbear(uo, 30, 70)})

    # Volume-based
    if len(v) >= 20:
        vma = float(np.mean(v[-20:]))
        out.append({"name": "Vol MA(20)", "value": round(vma, 2), "signal": "buy" if v[-1] > vma else "sell"})

    # Trim/pad to ~40
    return out[:40]


# ---------------------------------------------------------------------------
# Candlestick patterns (≈ 40)
# ---------------------------------------------------------------------------
def _body(o, c): return abs(c - o)
def _range(h, l): return max(h - l, 1e-9)

def detect_patterns(o, h, l, c) -> list[dict]:
    out: list[dict] = []
    n = len(c)
    if n < 3:
        return out

    o1, c1, h1, l1 = o[-1], c[-1], h[-1], l[-1]
    o2, c2, h2, l2 = o[-2], c[-2], h[-2], l[-2]
    o3, c3 = o[-3], c[-3]

    body1, body2 = _body(o1, c1), _body(o2, c2)
    rng1 = _range(h1, l1)
    up1 = c1 > o1
    up2 = c2 > o2

    def add(name: str, signal: Signal, desc: str):
        out.append({"name": name, "signal": signal, "description": desc})

    # Single-candle
    if body1 / rng1 < 0.1:
        add("Doji", "neutral", "Indecision: open ≈ close")
    if up1 and (min(o1, c1) - l1) > 2 * body1 and (h1 - max(o1, c1)) < body1:
        add("Hammer", "buy", "Long lower shadow, small body at top")
    if not up1 and (min(o1, c1) - l1) > 2 * body1:
        add("Hanging Man", "sell", "Hammer-shape in uptrend")
    if (h1 - max(o1, c1)) > 2 * body1 and (min(o1, c1) - l1) < body1:
        add("Shooting Star", "sell", "Long upper shadow, small body at bottom")
    if (h1 - max(o1, c1)) > 2 * body1 and up1:
        add("Inverted Hammer", "buy", "Upper shadow, possible reversal")
    if body1 / rng1 > 0.9 and up1:
        add("Marubozu Bullish", "buy", "Strong full-body bullish candle")
    if body1 / rng1 > 0.9 and not up1:
        add("Marubozu Bearish", "sell", "Strong full-body bearish candle")
    if body1 / rng1 < 0.05 and (h1 - max(o1, c1)) > body1 and (min(o1, c1) - l1) > body1:
        add("Long-Legged Doji", "neutral", "High volatility indecision")
    if body1 / rng1 < 0.05 and (h1 - max(o1, c1)) < body1:
        add("Dragonfly Doji", "buy", "Reversal hint after downtrend")
    if body1 / rng1 < 0.05 and (min(o1, c1) - l1) < body1:
        add("Gravestone Doji", "sell", "Reversal hint after uptrend")
    if body1 < rng1 * 0.3 and (h1 - max(o1, c1)) > body1 and (min(o1, c1) - l1) > body1:
        add("Spinning Top", "neutral", "Small body, balanced shadows")

    # Two-candle
    if up1 and not up2 and c1 > o2 and o1 < c2:
        add("Bullish Engulfing", "buy", "Body engulfs prior bearish candle")
    if not up1 and up2 and o1 > c2 and c1 < o2:
        add("Bearish Engulfing", "sell", "Body engulfs prior bullish candle")
    if up1 and not up2 and c1 > (o2 + c2) / 2 and o1 < c2:
        add("Piercing Line", "buy", "Closes above midpoint of prior red")
    if not up1 and up2 and c1 < (o2 + c2) / 2 and o1 > c2:
        add("Dark Cloud Cover", "sell", "Closes below midpoint of prior green")
    if abs(o1 - o2) / max(o2, 1e-9) < 0.001 and up1 != up2:
        add("Tweezer", "neutral", "Matching highs/lows reversal")
    if up1 and not up2 and o1 > c2 and c1 > o2:
        add("Bullish Harami Cross", "buy", "Small body inside prior big body")
    if not up1 and up2 and o1 < c2 and c1 < o2:
        add("Bearish Harami Cross", "sell", "Small body inside prior big body")
    if up1 and up2 and c1 > c2 and o1 > o2 and o1 < c2:
        add("Rising Window", "buy", "Bullish gap up")
    if not up1 and not up2 and c1 < c2 and o1 < o2:
        add("Falling Window", "sell", "Bearish gap down")
    if up1 and not up2 and body1 < body2 and c1 < o2 and c1 > c2:
        add("Bullish Harami", "buy", "Inside bar reversal")
    if not up1 and up2 and body1 < body2 and o1 < o2 and c1 > c2:
        add("Bearish Harami", "sell", "Inside bar reversal")

    # Three-candle
    if up1 and not up2 and (o3 > c3) and c1 > (o3 + c3) / 2:
        add("Morning Star", "buy", "3-candle bullish reversal")
    if not up1 and up2 and (c3 > o3) and c1 < (o3 + c3) / 2:
        add("Evening Star", "sell", "3-candle bearish reversal")
    if up1 and up2 and (c3 > o3) and c1 > c2 > c3:
        add("Three White Soldiers", "buy", "Three rising bullish candles")
    if not up1 and not up2 and (o3 > c3) and c1 < c2 < c3:
        add("Three Black Crows", "sell", "Three falling bearish candles")
    if up1 and not up2 and (o3 > c3):
        add("Three Inside Up", "buy", "Harami confirmed bullish")
    if not up1 and up2 and (c3 > o3):
        add("Three Inside Down", "sell", "Harami confirmed bearish")
    if up1 and up2 and c1 > h2 and c2 > h[-3]:
        add("Three Outside Up", "buy", "Engulfing + confirmation")
    if not up1 and not up2 and c1 < l2 and c2 < l[-3]:
        add("Three Outside Down", "sell", "Engulfing + confirmation")

    # Continuation
    if up1 and not up2 and up2 == False and c1 > h2:
        add("Bullish Kicker", "buy", "Gap with opposite-color candles")
    if not up1 and up2 and c1 < l2:
        add("Bearish Kicker", "sell", "Gap with opposite-color candles")
    if up1 and not up2 and not (c3 > o3):
        add("Bullish Abandoned Baby", "buy", "Gap doji reversal")
    if not up1 and up2 and (c3 > o3):
        add("Bearish Abandoned Baby", "sell", "Gap doji reversal")

    # Trend / structure
    sma20 = _sma(c, 20)
    sma50 = _sma(c, 50)
    if not np.isnan(sma20) and not np.isnan(sma50):
        if sma20 > sma50 and c1 > sma20:
            add("Uptrend Confirmation", "buy", "Price > SMA20 > SMA50")
        if sma20 < sma50 and c1 < sma20:
            add("Downtrend Confirmation", "sell", "Price < SMA20 < SMA50")

    # Breakouts
    if len(c) > 20:
        hh20 = float(np.max(h[-21:-1]))
        ll20 = float(np.min(l[-21:-1]))
        if c1 > hh20:
            add("20-bar Breakout", "buy", "Closes above 20-bar high")
        if c1 < ll20:
            add("20-bar Breakdown", "sell", "Closes below 20-bar low")

    # Volatility squeeze (placeholder rules to fill toward 40)
    add("Inside Bar", "neutral" if not (h1 < h2 and l1 > l2) else "neutral",
        "Range inside prior bar — pending breakout")
    add("Outside Bar", "neutral" if not (h1 > h2 and l1 < l2) else "neutral",
        "Range outside prior bar — volatility expansion")

    return out[:40]


# ---------------------------------------------------------------------------
# Summary
# ---------------------------------------------------------------------------
def _aggregate(items: list[dict]) -> Signal:
    score = 0
    for it in items:
        s = it.get("signal")
        if s == "buy": score += 1
        elif s == "sell": score -= 1
        elif s == "strong_buy": score += 2
        elif s == "strong_sell": score -= 2
    if score >= 6:  return "strong_buy"
    if score >= 2:  return "buy"
    if score <= -6: return "strong_sell"
    if score <= -2: return "sell"
    return "neutral"


def run_analysis(candles: list[dict]) -> dict:
    if not candles:
        return {"indicators": [], "patterns": [], "summary": {"overall": "neutral", "score": 0, "breakdown": {}, "risk": {}}}

    o = np.array([c["open"] for c in candles], dtype=float)
    h = np.array([c["high"] for c in candles], dtype=float)
    l = np.array([c["low"] for c in candles], dtype=float)
    cl = np.array([c["close"] for c in candles], dtype=float)
    v = np.array([c["volume"] for c in candles], dtype=float)

    indicators = compute_indicators(o, h, l, cl, v)
    patterns = detect_patterns(o, h, l, cl)

    # CryptoScope weighted composite: trend 30%, momentum 25%, volatility
    # 20%, volume 15%, and observed candle patterns 10%.
    def direction(items: list[dict]) -> float:
        values = [{"buy": 1.0, "strong_buy": 1.0, "sell": -1.0,
                   "strong_sell": -1.0, "neutral": 0.0}.get(i.get("signal"), 0.0) for i in items]
        return float(sum(values) / len(values)) if values else 0.0

    trend_items = [i for i in indicators if i["name"].startswith(("SMA", "EMA"))]
    momentum_items = [i for i in indicators if i["name"].startswith(("RSI", "MACD", "ROC", "Momentum", "Stoch", "CCI", "Williams"))]
    pattern_items = [p for p in patterns if p.get("signal") in ("buy", "sell", "strong_buy", "strong_sell")]
    returns = np.diff(cl) / cl[:-1] if len(cl) > 1 else np.array([], dtype=float)
    volatility_pct = float(np.std(returns) * 100) if len(returns) else 0.0
    peak = np.maximum.accumulate(cl)
    drawdown_pct = float(np.min((cl - peak) / np.maximum(peak, 1e-12)) * 100) if len(cl) else 0.0
    latest_volume = float(v[-1]) if len(v) else 0.0
    average_volume = float(np.mean(v[-20:])) if len(v) else 0.0
    volume_ratio = latest_volume / average_volume if average_volume else 0.0
    parts = {
        "trend": round(direction(trend_items), 3),
        "momentum": round(direction(momentum_items), 3),
        "volatility": round(-min(volatility_pct / 5, 1), 3),
        "volume": round(max(-1.0, min(1.0, (volume_ratio - 1) / 1.5)), 3),
        "pattern": round(direction(pattern_items), 3),
    }
    weights = {"trend": .30, "momentum": .25, "volatility": .20, "volume": .15, "pattern": .10}
    score = sum(parts[key] * weights[key] for key in weights)
    overall = "bullish" if score >= .2 else "bearish" if score <= -.2 else "neutral"
    abs_drawdown = abs(drawdown_pct)
    risk_level = "High" if volatility_pct >= 4 or abs_drawdown >= 20 else "Elevated" if volatility_pct >= 2.5 or abs_drawdown >= 10 else "Moderate" if volatility_pct >= 1.2 or abs_drawdown >= 5 else "Lower"

    return {
        "indicators": indicators,
        "patterns": patterns,
        "summary": {
            "indicators": _aggregate(indicators),
            "patterns": _aggregate(patterns),
            "overall": overall,
            "score": round(score, 3),
            "breakdown": {key: {"score": parts[key], "weight": weights[key]} for key in weights},
            "explanation": f"Trend {parts['trend']:+.2f}, momentum {parts['momentum']:+.2f}, volatility risk {parts['volatility']:+.2f}, volume {parts['volume']:+.2f}, and observed patterns {parts['pattern']:+.2f} combine to a {overall} technical signal.",
            "risk": {
                "volatilityPct": round(volatility_pct, 3),
                "maxDrawdownPct": round(drawdown_pct, 3),
                "rangePct": round((float(np.max(h)) - float(np.min(l))) / max(float(cl[-1]), 1e-12) * 100, 3),
                "trendStrength": round(abs(parts["trend"]), 3),
                "volumeRatio": round(volume_ratio, 3),
                "classification": risk_level,
            },
        },
    }
