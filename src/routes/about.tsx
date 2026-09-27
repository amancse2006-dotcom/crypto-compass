import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "Methodology — CryptoScope" },
      {
        name: "description",
        content:
          "Learn how CryptoScope combines public candle data, technical indicators, and historical risk measures.",
      },
    ],
  }),
  component: About,
});

const factors = [
  ["Trend", "30%", "Mean direction of the latest close relative to available SMA and EMA values."],
  [
    "Momentum",
    "25%",
    "Directional rules from RSI, MACD, rate of change, momentum, stochastic, CCI, and Williams %R.",
  ],
  [
    "Volatility",
    "20%",
    "A risk deduction based on standard deviation of per-candle returns, capped at 5%. It is not directional evidence.",
  ],
  ["Volume", "15%", "Latest candle volume compared with the trailing 20-candle average."],
  [
    "Pattern",
    "10%",
    "Average direction of detected candle rules. Patterns can overlap and need context.",
  ],
];

function About() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <p className="font-mono text-xs uppercase tracking-widest text-primary">About CryptoScope</p>
      <h1 className="mt-2 text-4xl font-bold tracking-tight">
        A transparent market analysis study.
      </h1>
      <p className="mt-5 max-w-3xl text-base leading-7 text-muted-foreground">
        CryptoScope is a college mini-project that turns public cryptocurrency spot-market data into
        a readable set of technical observations and historical risk measures. The browser requests
        data from a FastAPI service; it does not place trades or fabricate market values.
      </p>
      <section className="mt-10 rounded-xl border border-border bg-surface p-6">
        <h2 className="text-xl font-semibold">Signal methodology</h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Each factor is normalized to a direction from −1 to +1. The weighted contributions are
          summed. Scores at or above +0.20 are labeled bullish; at or below −0.20 bearish;
          intermediate values neutral.
        </p>
        <div className="mt-5 space-y-4">
          {factors.map(([name, weight, desc]) => (
            <div
              key={name}
              className="grid gap-1 border-t border-border pt-3 sm:grid-cols-[120px_70px_1fr]"
            >
              <strong>{name}</strong>
              <span className="font-mono text-primary">{weight}</span>
              <p className="text-sm text-muted-foreground">{desc}</p>
            </div>
          ))}
        </div>
      </section>
      <section className="mt-6 grid gap-4 sm:grid-cols-2">
        <Info
          title="Risk measures"
          body="Volatility is the standard deviation of candle returns (not annualized). Maximum drawdown measures close-to-close peak loss in the fetched window. Range is full-window high-to-low relative to the latest close; volume ratio compares the latest bar with its trailing mean."
        />
        <Info
          title="Data and implementation"
          body="The backend retrieves public Bybit V5 spot tickers and klines, computes indicators with Python and NumPy, and returns JSON. News is an optional CryptoPanic feed. Watchlist and portfolio data stay in this browser's local storage."
        />
        <Info
          title="Educational limitations"
          body="Technical rules can disagree, candle patterns can be false positives, and historical conditions can change quickly. This score has not been established as a predictive or profitable strategy."
        />
        <Info
          title="Research disclaimer"
          body="CryptoScope is for classroom demonstration and independent research only. It is not financial advice, a recommendation, or a guarantee of future performance. Verify market data and make decisions independently."
        />
      </section>
      <section className="mt-8 rounded-xl border border-border p-5">
        <h2 className="font-semibold">Acknowledgement</h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          The general idea of a cryptocurrency analysis dashboard was informed by{" "}
          <a
            className="text-primary underline"
            href="https://github.com/kanavgpt007-svg/crypto-compass/"
            target="_blank"
            rel="noreferrer"
          >
            Crypto Compass
          </a>
          . CryptoScope uses its own interface, data presentation, implementation, and weighted
          analysis methodology.
        </p>
      </section>
    </div>
  );
}
function Info({ title, body }: { title: string; body: string }) {
  return (
    <article className="rounded-xl border border-border bg-surface p-5">
      <h2 className="font-semibold">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{body}</p>
    </article>
  );
}
