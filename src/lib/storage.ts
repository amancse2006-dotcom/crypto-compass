export interface Holding {
  symbol: string;
  quantity: number;
  averageCost: number;
}
const WATCHLIST_KEY = "cryptoscope.watchlist.v1";
const PORTFOLIO_KEY = "cryptoscope.portfolio.v1";
function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const value = localStorage.getItem(key);
    return value ? (JSON.parse(value) as T) : fallback;
  } catch {
    return fallback;
  }
}
export const getWatchlist = () =>
  read<string[]>(WATCHLIST_KEY, ["BTC/USDT", "ETH/USDT", "SOL/USDT"]);
export const saveWatchlist = (symbols: string[]) =>
  localStorage.setItem(WATCHLIST_KEY, JSON.stringify([...new Set(symbols)]));
export const getPortfolio = () => read<Holding[]>(PORTFOLIO_KEY, []);
export const savePortfolio = (holdings: Holding[]) =>
  localStorage.setItem(PORTFOLIO_KEY, JSON.stringify(holdings));
