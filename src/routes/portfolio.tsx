import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { api } from "../lib/api";
import { getPortfolio, savePortfolio, type Holding } from "../lib/storage";

export const Route = createFileRoute("/portfolio")({
  component: Portfolio,
  head: () => ({ meta: [{ title: "Portfolio — CryptoScope" }] }),
});
function Portfolio() {
  const [holdings, setHoldings] = useState(getPortfolio);
  const [symbol, setSymbol] = useState("");
  const [quantity, setQuantity] = useState("");
  const [cost, setCost] = useState("");
  const tickers = useQuery({
    queryKey: ["portfolio-prices", holdings.map((h) => h.symbol)],
    queryFn: () => Promise.allSettled(holdings.map((h) => api.ticker(h.symbol))),
    enabled: holdings.length > 0,
    refetchInterval: 30000,
  });
  const add = (e: React.FormEvent) => {
    e.preventDefault();
    const raw = symbol.trim().toUpperCase();
    const qty = Number(quantity);
    const avg = Number(cost);
    if (!raw || !Number.isFinite(qty) || qty <= 0 || !Number.isFinite(avg) || avg < 0) return;
    const pair = raw.includes("/") ? raw : `${raw}/USDT`;
    const next = [
      ...holdings.filter((h) => h.symbol !== pair),
      { symbol: pair, quantity: qty, averageCost: avg },
    ];
    setHoldings(next);
    savePortfolio(next);
    setSymbol("");
    setQuantity("");
    setCost("");
  };
  const remove = (pair: string) => {
    const next = holdings.filter((h) => h.symbol !== pair);
    setHoldings(next);
    savePortfolio(next);
  };
  const rows = holdings.map((h, i) => {
    const r = tickers.data?.[i];
    const price = r?.status === "fulfilled" ? r.value.price : null;
    return {
      ...h,
      price,
      value: price === null ? null : price * h.quantity,
      pnl: price === null ? null : (price - h.averageCost) * h.quantity,
    };
  });
  const total = rows.reduce((sum, r) => sum + (r.value ?? 0), 0);
  const pnl = rows.reduce((sum, r) => sum + (r.pnl ?? 0), 0);
  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <p className="font-mono text-xs uppercase tracking-widest text-primary">Personal tracking</p>
      <h1 className="mt-2 text-3xl font-bold">Portfolio tracker</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Holdings are saved locally in this browser. Live values use current ticker data; average
        cost is entered by you.
      </p>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <Summary label="Live market value" value={total ? money(total) : "—"} />
        <Summary
          label="Unrealized P/L"
          value={rows.some((r) => r.pnl !== null) ? `${pnl >= 0 ? "+" : ""}${money(pnl)}` : "—"}
        />
      </div>
      <form
        onSubmit={add}
        className="mt-6 grid gap-3 rounded-xl border border-border bg-surface p-4 sm:grid-cols-4"
      >
        <input
          required
          value={symbol}
          onChange={(e) => setSymbol(e.target.value)}
          placeholder="Pair (BTC or BTC/USDT)"
          aria-label="Asset pair"
          className="rounded-lg border border-border bg-background px-3 py-2"
        />
        <input
          required
          type="number"
          min="0"
          step="any"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          placeholder="Quantity"
          aria-label="Holding quantity"
          className="rounded-lg border border-border bg-background px-3 py-2"
        />
        <input
          required
          type="number"
          min="0"
          step="any"
          value={cost}
          onChange={(e) => setCost(e.target.value)}
          placeholder="Average cost (USD)"
          aria-label="Average cost"
          className="rounded-lg border border-border bg-background px-3 py-2"
        />
        <button className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">
          Save holding
        </button>
      </form>
      {tickers.isError && (
        <p role="alert" className="mt-4 text-sm text-bear">
          Some live quotes could not be retrieved.
        </p>
      )}
      <div className="mt-6 overflow-x-auto rounded-xl border border-border bg-surface">
        <table className="w-full min-w-[650px] text-left text-sm">
          <thead className="bg-surface-elevated text-xs uppercase text-muted-foreground">
            <tr>
              {[
                "Asset",
                "Quantity",
                "Avg. cost",
                "Live price",
                "Market value",
                "Unrealized P/L",
                "",
              ].map((x) => (
                <th key={x} className="px-4 py-3">
                  {x}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.symbol} className="border-t border-border/70">
                <td className="px-4 py-4 font-semibold">{r.symbol}</td>
                <td className="px-4 py-4">{r.quantity}</td>
                <td className="px-4 py-4">{money(r.averageCost)}</td>
                <td className="px-4 py-4">{r.price === null ? "—" : money(r.price)}</td>
                <td className="px-4 py-4">{r.value === null ? "—" : money(r.value)}</td>
                <td
                  className={`px-4 py-4 ${r.pnl === null ? "text-muted-foreground" : r.pnl >= 0 ? "text-bull" : "text-bear"}`}
                >
                  {r.pnl === null ? "—" : `${r.pnl >= 0 ? "+" : ""}${money(r.pnl)}`}
                </td>
                <td className="px-4 py-4">
                  <button
                    onClick={() => remove(r.symbol)}
                    className="text-xs text-muted-foreground hover:text-foreground"
                  >
                    Remove
                  </button>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={7} className="p-8 text-center text-muted-foreground">
                  No holdings yet. Add an asset and your own quantity and average cost above.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs text-muted-foreground">
        Portfolio calculations exclude fees, taxes, and deposits or withdrawals. They are a tracking
        aid, not investment advice.
      </p>
    </div>
  );
}
function Summary({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-5">
      <div className="text-sm text-muted-foreground">{label}</div>
      <div className="mt-3 text-2xl font-semibold">{value}</div>
    </div>
  );
}
function money(v: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(v);
}
