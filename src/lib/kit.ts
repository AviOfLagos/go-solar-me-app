import type { Line } from "@/stores/cart";
import type { Catalog } from "./types";

/** Items travel between screens as "id:qty,id:qty". */
export const encodeItems = (items: Line[]) => items.map((i) => `${i.id}:${i.qty}`).join(",");
export const decodeItems = (s: string | string[] | undefined): Line[] =>
  String(Array.isArray(s) ? s[0] : s ?? "")
    .split(",")
    .map((p) => p.split(":"))
    .filter(([id, q]) => id && Number(q) > 0)
    .map(([id, q]) => ({ id, qty: Math.min(50, Math.floor(Number(q))) }));

/** Priced lines for display. The server re-prices everything; this is only what we show. */
export function priceLines(c: Catalog | undefined, items: Line[]) {
  const byId = new Map((c?.products ?? []).map((p) => [p.id, p] as const));
  const lines = items.flatMap((i) => {
    const p = byId.get(i.id);
    return p ? [{ ...i, p, total: p.price * i.qty }] : [];
  });
  return { lines, subtotal: lines.reduce((n, l) => n + l.total, 0), missing: items.length - lines.length };
}

/** Same split the server uses: a gift card covers what it can, and any card part stays ≥ ₦1,000. */
export function giftSplit(total: number, balance: number, minCharge = 1000) {
  let used = Math.min(balance, total);
  if (total - used > 0 && total - used < minCharge) used = Math.max(0, total - minCharge);
  return { giftUsed: used, toPay: total - used };
}

export const asString = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

/** "1 item", "3 items". */
export const itemsLabel = (n: number) => `${n} item${n === 1 ? "" : "s"}`;
