import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Search, ArrowUpRight } from "lucide-react";
import { api, type Ticker } from "../lib/api";
import { SUGGESTED_PAIRS } from "../lib/analysis-data";

export const Route = createFileRoute("/explorer")({
  component: Explorer,
  head: () => ({ meta: [{ title: "Coin Explorer — CryptoScope" }] }),
});
function Explorer() {
  const [query, setQuery] = useState(() =>
    typeof window === "undefined"
      ? ""
      : (sessionStorage.getItem("cryptoscope.explorer-query") ?? ""),
  );
  const pairs = useMemo(() => {
    const q = query.trim().toUpperCase();
    return q
      ? [
          ...new Set([
            q.includes("/") ? q : `${q}/USDT`,
            ...SUGGESTED_PAIRS.filter((p) => p.includes(q)),
          ]),
        ]
      : SUGGESTED_PAIRS;
  }, [query]);
  const markets = useQuery({
    queryKey: ["explorer", pairs],
    queryFn: async () => Promise.allSettled(pairs.map((p) => api.ticker(p))),
    refetchInterval: 30000,
  });
  const tickers = (markets.data ?? []).flatMap((r) => (r.status === "fulfilled" ? [r.value] : []));
  return (
    <div className="mx-auto max-w-7xl px-6 py-10">
      <p className="font-mono text-xs uppercase tracking-widest text-primary">Market directory</p>
      <h1 className="mt-2 text-3xl font-bold">Coin explorer</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Search supported USDT spot pairs and open the live analysis view.
      </p>
      <label className="mt-6 flex items-center gap-3 rounded-xl border border-border bg-surface px-4 py-3">
        <Search className="h-4 w-4 text-muted-foreground" />
        <input
          aria-label="Search coin pairs"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search BTC, ETH/USDT…"
          className="w-full bg-transparent outline-none"
        />
      </label>
      {markets.isError && (
        <p
          role="alert"
          className="mt-4 rounded-lg border border-bear/30 bg-bear/5 p-4 text-sm text-bear"
        >
          Market data unavailable. Check that the API is running, then retry.
        </p>
      )}
      <div className="mt-6 overflow-x-auto rounded-xl border border-border bg-surface">
        <table className="w-full min-w-[650px] text-left text-sm">
          <thead className="bg-surface-elevated text-xs uppercase text-muted-foreground">
            <tr>
              {["Pair", "Last price", "24h change", "24h high / low", "Volume", ""].map((x) => (
                <th key={x} className="px-4 py-3">
                  {x}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {markets.isLoading && (
              <tr>
                <td colSpan={6} className="p-8 text-center text-muted-foreground">
                  Loading live tickers…
                </td>
              </tr>
            )}
            {tickers.map((t: Ticker) => (
              <tr key={t.symbol} className="border-t border-border/70">
                <td className="px-4 py-4 font-semibold">{t.symbol}</td>
                <td className="px-4 py-4 font-mono">{price(t.price)}</td>
                <td
                  className={`px-4 py-4 font-mono ${t.changePercent >= 0 ? "text-bull" : "text-bear"}`}
                >
                  {t.changePercent >= 0 ? "+" : ""}
                  {t.changePercent.toFixed(2)}%
                </td>
                <td className="px-4 py-4 font-mono text-muted-foreground">
                  {price(t.high24h)} / {price(t.low24h)}
                </td>
                <td className="px-4 py-4 font-mono text-muted-foreground">{volume(t.volume24h)}</td>
                <td className="px-4 py-4">
                  <Link to="/analysis" className="inline-flex items-center gap-1 text-primary">
                    Analyze <ArrowUpRight className="h-3.5 w-3.5" />
                  </Link>
                </td>
              </tr>
            ))}
            {!markets.isLoading && tickers.length === 0 && (
              <tr>
                <td colSpan={6} className="p-8 text-center text-muted-foreground">
                  No live pair data found. Confirm the symbol is a supported USDT spot market.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs text-muted-foreground">
        Ticker data is supplied by the public Bybit API through the CryptoScope backend. Refreshes
        every 30 seconds.
      </p>
    </div>
  );
}
function price(n: number) {
  return Number.isFinite(n)
    ? new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: n > 10 ? 2 : 5,
      }).format(n)
    : "—";
}
function volume(n: number) {
  return Number.isFinite(n)
    ? `$${new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 2 }).format(n)}`
    : "—";
}
