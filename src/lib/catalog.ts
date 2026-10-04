import { useQuery } from "@tanstack/react-query";
import { api } from "./api";
import type { Catalog, Product, Tier } from "./types";

/** One cached call for the whole store. Prices always come from here, never from the app. */
export function useCatalog() {
  return useQuery({ queryKey: ["catalog"], queryFn: () => api<Catalog>("/catalog", { auth: false }), staleTime: 30 * 60_000 });
}

export function productMap(c: Catalog | undefined) {
  return new Map((c?.products ?? []).map((p) => [p.id, p] as const));
}

export function findProduct(c: Catalog | undefined, idOrSlug: string): Product | undefined {
  return c?.products.find((p) => p.id === idOrSlug || p.slug === idOrSlug);
}

/** Installed price range, when the tier needs an installer. */
export const installedRange = (t: Tier) => (t.install[1] === 0 ? null : ([t.price + t.install[0], t.price + t.install[1]] as const));

/* ---------- Solar Friday (display only; the real price never changes) ---------- */

function lagosDay(d = new Date()) {
  const wd = new Intl.DateTimeFormat("en-GB", { timeZone: "Africa/Lagos", weekday: "short" }).format(d);
  return ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(wd);
}
export const promoActive = (c: Catalog | undefined) => !!c && c.promo.weekdays.includes(lagosDay());
export function inPromo(c: Catalog, p: Product) {
  const { categories, productSlugs } = c.promo;
  if (productSlugs.length && productSlugs.includes(p.slug)) return true;
  if (!categories.length && !productSlugs.length) return true;
  return categories.includes(p.category);
}
/** The "was" price shown on Fridays, so (was − percent) = the real selling price. */
export const compareAt = (c: Catalog, price: number) => Math.ceil(price / (1 - c.promo.percent / 100) / 100) * 100;

/* ---------- sizing: what to buy for what you want to run ---------- */

export const APPLIANCES = [
  { key: "bulb", label: "LED bulbs", w: 10, duty: 1, surge: 1 },
  { key: "fan", label: "Fans", w: 70, duty: 1, surge: 1 },
  { key: "laptop", label: "Laptops", w: 65, duty: 1, surge: 1 },
  { key: "tv", label: "TV + decoder", w: 120, duty: 1, surge: 1 },
  { key: "router", label: "Wi-Fi router", w: 15, duty: 1, surge: 1 },
  { key: "fridge", label: "Fridge", w: 150, duty: 0.45, surge: 3 },
  { key: "freezer", label: "Chest freezer", w: 200, duty: 0.5, surge: 3 },
  { key: "pump", label: "Water pump", w: 750, duty: 0.08, surge: 3 },
  { key: "ac", label: "AC (1HP)", w: 900, duty: 0.7, surge: 1.5 },
  { key: "clipper", label: "POS / clippers", w: 30, duty: 1, surge: 1 },
] as const;
export type ApplianceKey = (typeof APPLIANCES)[number]["key"];
export type Load = Record<ApplianceKey, number>;
export const emptyLoad = Object.fromEntries(APPLIANCES.map((a) => [a.key, 0])) as Load;

/** Same sizing rule as the website's power planner. */
export function sizeLoad(load: Load, hours: number) {
  let running = 0, energy = 0, surge = 0;
  for (const a of APPLIANCES) {
    const n = load[a.key];
    running += a.w * n;
    energy += a.w * n * a.duty * hours;
    surge = Math.max(surge, n ? a.w * (a.surge - 1) : 0);
  }
  return {
    running,
    kw: Math.max(0.1, Math.round(((running + surge) * 1.25) / 100) / 10),
    kwh: Math.max(0.05, Math.round((energy / 1000 / 0.8) * 10) / 10),
  };
}

/** Cheapest kits that cover the load, the chosen buyer type's own kits first. */
export function recommend(c: Catalog, kw: number, kwh: number, segment?: string, n = 3) {
  const all = c.segments.flatMap((s) => s.tiers.map((t) => ({ ...t, segment: s.slug })));
  const fit = all
    .filter((t) => t.kw >= kw && t.kwh >= kwh * 0.85)
    .sort((a, b) => Number(b.segment === segment) - Number(a.segment === segment) || a.price - b.price);
  const seen = new Set<string>();
  return fit.filter((t) => {
    const k = t.items.map((i) => `${i.id}x${i.qty}`).join();
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  }).slice(0, n);
}

/** Rough monthly fuel spend for a small generator covering the same hours. */
export function fuelPerMonth(kw: number, hoursPerDay: number, pricePerLitre = 1000) {
  const litresPerHour = Math.max(0.4, kw * 0.35);
  return Math.round((litresPerHour * hoursPerDay * 30 * pricePerLitre) / 1000) * 1000;
}
