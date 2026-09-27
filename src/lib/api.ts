// Typed client for CryptoScope's FastAPI service.
export const API_URL =
  (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, "") ||
  "http://127.0.0.1:8000";

export type Timeframe = "1m" | "5m" | "15m" | "1h" | "4h" | "1d" | "1M";
export interface Candle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}
export interface Ticker {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  high24h: number;
  low24h: number;
  volume24h: number;
}
export type Signal = "STRONG BUY" | "BUY" | "NEUTRAL" | "SELL" | "STRONG SELL";
export interface Indicator {
  name: string;
  value: string | number | null;
  signal: Signal;
  description?: string;
  category?: string;
}
export interface Pattern {
  name: string;
  detected: boolean;
  signal: Signal;
  reliability?: string;
  description?: string;
  category?: string;
}
export interface RiskMetrics {
  volatilityPct: number;
  maxDrawdownPct: number;
  rangePct: number;
  trendStrength: number;
  volumeRatio: number;
  classification: string;
}
export interface Summary {
  label: Signal;
  score: number;
  counts?: Record<string, number>;
  breakdown?: Record<string, { score: number; weight: number }>;
  explanation?: string;
  risk?: RiskMetrics;
}
export interface AnalysisResponse {
  symbol: string;
  interval: Timeframe;
  ticker?: Ticker;
  indicators: Indicator[];
  patterns: Pattern[];
  summary: Summary;
}
export interface NewsItem {
  title: string;
  source: string;
  url: string;
  time: string;
  snippet?: string;
}

async function http<T>(path: string, params?: Record<string, string | number>): Promise<T> {
  const url = new URL(`${API_URL}${path}`);
  Object.entries(params ?? {}).forEach(([key, value]) => url.searchParams.set(key, String(value)));
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok)
    throw new Error(`API ${res.status}: ${(await res.text().catch(() => "")) || res.statusText}`);
  return res.json() as Promise<T>;
}

function normalizeSignal(value: unknown): Signal {
  const s = String(value ?? "neutral")
    .toUpperCase()
    .replaceAll("_", " ");
  if (["STRONG BUY", "BUY", "NEUTRAL", "SELL", "STRONG SELL"].includes(s)) return s as Signal;
  if (s === "BULLISH") return "BUY";
  if (s === "BEARISH") return "SELL";
  return "NEUTRAL";
}
function categorize(name: string): string {
  if (/SMA|EMA/.test(name)) return "Trend";
  if (/RSI|MACD|ROC|Momentum|Stoch|CCI|Williams|Osc/.test(name)) return "Momentum";
  if (/ATR|Deviation/.test(name)) return "Volatility";
  if (/Vol|OBV|MFI/.test(name)) return "Volume";
  return "Technical";
}

export const api = {
  klines: async (symbol: string, interval: Timeframe, limit = 200): Promise<Candle[]> => {
    const r = await http<{ candles?: Candle[] } | Candle[]>("/api/market/klines", {
      symbol,
      interval,
      limit,
    });
    return Array.isArray(r) ? r : (r.candles ?? []);
  },
  ticker: (symbol: string) => http<Ticker>("/api/market/ticker", { symbol }),
  analysis: async (symbol: string, interval: Timeframe): Promise<AnalysisResponse> => {
    const r = await http<
      Omit<AnalysisResponse, "summary"> & { summary?: Partial<Summary> & { overall?: string } }
    >("/api/analysis", { symbol, interval });
    const raw = r.summary ?? {};
    return {
      ...r,
      indicators: (r.indicators ?? []).map((i) => ({
        ...i,
        signal: normalizeSignal(i.signal),
        category: i.category ?? categorize(i.name),
      })),
      patterns: (r.patterns ?? []).map((p) => ({
        ...p,
        detected: p.detected ?? true,
        signal: normalizeSignal(p.signal),
        category: p.category ?? "Candlestick",
        reliability: p.reliability ?? "Context dependent",
      })),
      summary: { ...raw, label: normalizeSignal(raw.label ?? raw.overall), score: raw.score ?? 0 },
    };
  },
  news: async (symbol: string, limit = 8): Promise<NewsItem[]> => {
    const r = await http<{ items?: NewsItem[]; results?: NewsItem[] } | NewsItem[]>("/api/news", {
      symbol,
      limit,
    });
    return Array.isArray(r) ? r : (r.items ?? r.results ?? []);
  },
};
