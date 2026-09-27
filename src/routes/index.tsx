import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowUpRight,
  BarChart3,
  ChevronRight,
  CircleAlert,
  Gauge,
  Search,
  ShieldCheck,
  TrendingDown,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { useEffect, useState } from "react";
import { api, type Ticker } from "../lib/api";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "CryptoScope — Market Intelligence" },
      {
        name: "description",
        content:
          "CryptoScope cryptocurrency market analysis, technical indicators and risk intelligence.",
      },
    ],
  }),
  component: Home,
});

const symbols = ["BTC/USDT", "ETH/USDT", "SOL/USDT", "XRP/USDT"];

const coinNames: Record<string, string> = {
  "BTC/USDT": "Bitcoin",
  "ETH/USDT": "Ethereum",
  "SOL/USDT": "Solana",
  "XRP/USDT": "XRP",
};

function Home() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [tickers, setTickers] = useState<Record<string, Ticker>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadMarketData = async () => {
    try {
      setError("");

      const results = await Promise.all(
        symbols.map(async (symbol) => {
          const ticker = await api.ticker(symbol);
          return [symbol, ticker] as const;
        }),
      );

      setTickers(Object.fromEntries(results));
    } catch (err) {
      console.error(err);
      setError("Unable to load live market data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMarketData();

    const timer = window.setInterval(loadMarketData, 30000);

    return () => window.clearInterval(timer);
  }, []);

  const btc = tickers["BTC/USDT"];

  const totalVolume = Object.values(tickers).reduce(
    (sum, ticker) => sum + (ticker.volume24h || 0),
    0,
  );

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header / Hero */}
      <section className="border-b border-border">
        <div className="mx-auto max-w-7xl px-6 py-10">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="mb-3 flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-primary">
                <span className="h-2 w-2 animate-pulse rounded-full bg-bull" />
                Live Market Intelligence
              </div>

              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
                Crypto market,
                <span className="block text-primary">decoded.</span>
              </h1>

              <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground">
                CryptoScope combines live market data, technical signals and risk metrics into one
                focused workspace for cryptocurrency analysis.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                to="/analysis"
                className="inline-flex items-center gap-2 rounded-md bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
              >
                Open Analysis
                <ArrowUpRight className="h-4 w-4" />
              </Link>

              <Link
                to="/about"
                className="inline-flex items-center gap-2 rounded-md border border-border bg-surface px-5 py-3 text-sm font-medium transition hover:bg-surface-elevated"
              >
                About CryptoScope
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Search */}
      <section className="mx-auto max-w-7xl px-6 py-6">
        <div className="flex items-center gap-3 rounded-xl border border-border bg-surface px-4 py-3">
          <Search className="h-5 w-5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search a cryptocurrency, pair or market..."
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                sessionStorage.setItem("cryptoscope.explorer-query", event.currentTarget.value);
                window.location.assign("/explorer");
              }
            }}
            className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
          <kbd className="hidden rounded border border-border px-2 py-1 font-mono text-xs text-muted-foreground sm:block">
            /
          </kbd>
        </div>
      </section>

      {/* Live metrics */}
      <section className="mx-auto max-w-7xl px-6 pb-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            label="BTC Price"
            value={loading ? "Loading..." : btc ? formatPrice(btc.price) : "—"}
            detail={
              btc ? `${formatPercent(btc.changePercent)} over 24h` : "Waiting for market data"
            }
            positive={btc ? btc.changePercent >= 0 : undefined}
            icon={<Gauge className="h-5 w-5" />}
          />

          <MetricCard
            label="BTC 24h Range"
            value={btc ? `${formatPrice(btc.low24h)} – ${formatPrice(btc.high24h)}` : "—"}
            detail="Live market range"
            icon={<BarChart3 className="h-5 w-5" />}
          />

          <MetricCard
            label="Tracked Volume"
            value={loading ? "Loading..." : formatVolume(totalVolume)}
            detail="Selected assets / 24h"
            icon={<TrendingUp className="h-5 w-5" />}
          />

          <MetricCard
            label="Data Status"
            value={error ? "Offline" : loading ? "Loading" : "Live"}
            detail={error || "Updated automatically every 30 seconds"}
            positive={!error}
            icon={<ShieldCheck className="h-5 w-5" />}
          />
        </div>
      </section>

      {/* Error message */}
      {error && (
        <section className="mx-auto max-w-7xl px-6 pb-4">
          <div className="rounded-lg border border-bear/30 bg-bear/5 p-4 text-sm text-bear">
            {error}
          </div>
        </section>
      )}

      {/* Market table */}
      <section className="mx-auto max-w-7xl px-6 py-6">
        <div className="overflow-hidden rounded-xl border border-border bg-surface">
          <div className="flex flex-col gap-4 border-b border-border p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold">Live Market Overview</h2>
                {!loading && !error && (
                  <span className="rounded-full bg-bull/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-bull">
                    Live
                  </span>
                )}
              </div>

              <p className="mt-1 text-sm text-muted-foreground">
                Real-time ticker information supplied by the CryptoScope API.
              </p>
            </div>

            <Link
              to="/analysis"
              className="inline-flex items-center gap-1 text-sm font-medium text-primary"
            >
              View full analysis
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="hidden grid-cols-6 gap-4 border-b border-border px-5 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground md:grid">
            <span>Asset</span>
            <span>Price</span>
            <span>24h Change</span>
            <span>Trend</span>
            <span>24h Range</span>
            <span>Volume</span>
          </div>

          {symbols.map((symbol) => {
            const coin = tickers[symbol];
            const change = coin?.changePercent ?? 0;
            const positive = change >= 0;

            return (
              <div
                key={symbol}
                className="grid gap-4 border-b border-border px-5 py-5 last:border-b-0 md:grid-cols-6 md:items-center"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-background font-mono text-xs font-bold">
                    {symbol.replace("/USDT", "").slice(0, 1)}
                  </div>

                  <div>
                    <div className="font-semibold">{symbol.replace("/USDT", "")}</div>
                    <div className="text-xs text-muted-foreground">{coinNames[symbol]}</div>
                  </div>
                </div>

                <div className="text-sm font-semibold">{coin ? formatPrice(coin.price) : "—"}</div>

                <div
                  className={
                    positive ? "font-mono text-sm text-bull" : "font-mono text-sm text-bear"
                  }
                >
                  {coin ? formatPercent(change) : "—"}
                </div>

                <div>
                  {coin ? (
                    <span
                      className={
                        positive
                          ? "inline-flex items-center gap-1 rounded-full bg-bull/10 px-2.5 py-1 text-xs font-medium text-bull"
                          : "inline-flex items-center gap-1 rounded-full bg-bear/10 px-2.5 py-1 text-xs font-medium text-bear"
                      }
                    >
                      {positive ? (
                        <TrendingUp className="h-3 w-3" />
                      ) : (
                        <TrendingDown className="h-3 w-3" />
                      )}
                      {positive ? "Bullish" : "Bearish"}
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground">Loading...</span>
                  )}
                </div>

                <div className="text-xs text-muted-foreground">
                  {coin ? `${formatPrice(coin.low24h)} – ${formatPrice(coin.high24h)}` : "—"}
                </div>

                <div className="font-mono text-sm text-muted-foreground">
                  {coin ? formatVolume(coin.volume24h) : "—"}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Intelligence modules */}
      <section className="mx-auto max-w-7xl px-6 py-10">
        <div className="mb-5">
          <p className="font-mono text-xs uppercase tracking-widest text-primary">
            Intelligence modules
          </p>
          <h2 className="mt-2 text-2xl font-bold">From market data to analytical context.</h2>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <ModuleCard
            icon={<BarChart3 />}
            title="Technical Analysis"
            description="Study momentum, trend and volatility using technical indicators."
          />

          <ModuleCard
            icon={<ShieldCheck />}
            title="Risk Intelligence"
            description="Understand volatility, drawdown and asset risk before acting."
          />

          <ModuleCard
            icon={<TrendingUp />}
            title="Market Watch"
            description="Monitor important assets and their latest market movements."
          />

          <ModuleCard
            icon={<Wallet />}
            title="Portfolio"
            description="Track holdings, allocation and performance from one dashboard."
          />
        </div>
      </section>

      {/* Disclaimer */}
      <section className="mx-auto max-w-7xl px-6 pb-12">
        <div className="rounded-xl border border-border bg-surface p-5">
          <div className="flex gap-3">
            <CircleAlert className="mt-0.5 h-5 w-5 shrink-0 text-primary" />

            <div>
              <h3 className="font-semibold">Research tool, not financial advice</h3>

              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                CryptoScope presents market data and analytical signals for educational and research
                purposes. Signals are not guarantees of future price movement.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function MetricCard({
  label,
  value,
  detail,
  positive,
  icon,
}: {
  label: string;
  value: string;
  detail: string;
  positive?: boolean;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border bg-surface p-5">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">{label}</span>
        <span className="text-primary">{icon}</span>
      </div>

      <div className="mt-5 text-2xl font-bold">{value}</div>

      <div
        className={
          positive === true
            ? "mt-1 text-xs text-bull"
            : positive === false
              ? "mt-1 text-xs text-bear"
              : "mt-1 text-xs text-muted-foreground"
        }
      >
        {detail}
      </div>
    </div>
  );
}

function ModuleCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <Link
      to={
        title === "Portfolio" ? "/portfolio" : title === "Market Watch" ? "/watchlist" : "/analysis"
      }
      className="group rounded-xl border border-border bg-surface p-5 transition hover:-translate-y-0.5 hover:bg-surface-elevated"
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
        {icon}
      </div>

      <h3 className="mt-5 font-semibold">{title}</h3>

      <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>

      <div className="mt-5 flex items-center gap-1 text-xs font-medium text-primary">
        Explore
        <ChevronRight className="h-3.5 w-3.5 transition group-hover:translate-x-1" />
      </div>
    </Link>
  );
}

function formatPrice(value: number) {
  if (!Number.isFinite(value)) return "—";

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: value >= 100 ? 0 : 4,
  }).format(value);
}

function formatPercent(value: number) {
  if (!Number.isFinite(value)) return "—";

  return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;
}

function formatVolume(value: number) {
  if (!Number.isFinite(value)) return "—";

  if (value >= 1_000_000_000) {
    return `$${(value / 1_000_000_000).toFixed(2)}B`;
  }

  if (value >= 1_000_000) {
    return `$${(value / 1_000_000).toFixed(2)}M`;
  }

  if (value >= 1_000) {
    return `$${(value / 1_000).toFixed(2)}K`;
  }

  return `$${value.toFixed(2)}`;
}
