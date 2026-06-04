/**
 * LocalStorage-based watchlist management
 */

const STORAGE_KEY = "us-stock-screener-watchlist";

export function getWatchlist(): string[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export function addToWatchlist(symbol: string): string[] {
  const list = getWatchlist();
  const upper = symbol.toUpperCase();
  if (!list.includes(upper)) {
    list.push(upper);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  }
  return list;
}

export function removeFromWatchlist(symbol: string): string[] {
  const list = getWatchlist().filter((s) => s !== symbol.toUpperCase());
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  return list;
}

export function isInWatchlist(symbol: string): boolean {
  return getWatchlist().includes(symbol.toUpperCase());
}
