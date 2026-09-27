import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { api } from "../lib/api";
import { getWatchlist, saveWatchlist } from "../lib/storage";

export const Route = createFileRoute("/watchlist")({
  component: Watchlist,
  head: () => ({ meta: [{ title: "Watchlist — CryptoScope" }] }),
});
function Watchlist() {
  const [symbols, setSymbols] = useState(getWatchlist);
  const [input, setInput] = useState("");
  const q = useQuery({
    queryKey: ["watchlist", symbols],
    queryFn: () => Promise.allSettled(symbols.map((s) => api.ticker(s))),
    enabled: symbols.length > 0,
    refetchInterval: 30000,
  });
  const add = (event: React.FormEvent) => {
    event.preventDefault();
    const raw = input.trim().toUpperCase();
    if (!raw) return;
    const pair = raw.includes("/") ? raw : `${raw}/USDT`;
    const next = [...new Set([...symbols, pair])];
    setSymbols(next);
    saveWatchlist(next);
    setInput("");
  };
  const remove = (pair: string) => {
    const next = symbols.filter((s) => s !== pair);
    setSymbols(next);
    saveWatchlist(next);
  };
  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <p className="font-mono text-xs uppercase tracking-widest text-primary">Saved markets</p>
      <h1 className="mt-2 text-3xl font-bold">Watchlist</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Your pairs are stored in this browser and refreshed from live tickers.
      </p>
      <form onSubmit={add} className="mt-6 flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Add a pair, e.g. SOL"
          aria-label="Pair to add"
          className="min-w-0 flex-1 rounded-lg border border-border bg-surface px-4 py-3 outline-none focus:border-primary"
        />
        <button className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">
          Add pair
        </button>
      </form>
      {q.isError && (
        <p role="alert" className="mt-4 text-sm text-bear">
          Could not refresh some ticker data. Try again when the backend is available.
        </p>
      )}
      <div className="mt-6 space-y-3">
        {symbols.map((pair, i) => {
          const result = q.data?.[i];
          const t = result?.status === "fulfilled" ? result.value : undefined;
          return (
            <div
              key={pair}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-surface p-4"
            >
              <div>
                <div className="font-semibold">{pair}</div>
                <div className="mt-1 font-mono text-sm text-muted-foreground">
                  {t
                    ? `$${t.price.toLocaleString(undefined, { maximumFractionDigits: 5 })} · ${t.changePercent >= 0 ? "+" : ""}${t.changePercent.toFixed(2)}%`
                    : q.isLoading
                      ? "Loading live quote…"
                      : "Quote unavailable"}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Link to="/analysis" className="text-sm text-primary">
                  Open analysis
                </Link>
                <button
                  onClick={() => remove(pair)}
                  className="rounded-md border border-border px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground"
                  aria-label={`Remove ${pair}`}
                >
                  Remove
                </button>
              </div>
            </div>
          );
        })}
        {symbols.length === 0 && (
          <div className="rounded-xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
            Your watchlist is empty. Add a USDT pair above to start following it.
          </div>
        )}
      </div>
    </div>
  );
}
