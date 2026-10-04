// Shapes returned by the API (see docs/API.md in solar-builders-ng).
export type Product = {
  id: string; slug: string; name: string; brand: string; category: string;
  specs: string[]; description: string; image: string; price: number;
};
export type Tier = {
  id: string; name: string; tagline: string; powers: string[]; kw: number; kwh: number;
  install: [number, number]; best: boolean; price: number; items: { id: string; qty: number }[];
};
export type Segment = { slug: string; name: string; short: string; who: string; worry: string; tiers: Tier[] };
export type Category = { slug: string; name: string; short: string; blurb: string };
export type Brand = { slug: string; name: string; tagline: string };
export type Catalog = {
  store: { name: string; whatsapp: string; phone: string; deliveryFee: number; currency: string; lgas: string[] };
  promo: { name: string; percent: number; weekdays: number[]; timeZone: string; categories: string[]; productSlugs: string[] };
  categories: Category[]; brands: Brand[]; products: Product[]; segments: Segment[];
};

export type Card = { id: string; provider: "paystack" | "stripe"; brand: string; last4: string; expMonth: number; expYear: number; nickname: string; bank?: string };
export type Me = {
  user: { id: string; email: string; name: string; phone: string; google: boolean; hasPassword: boolean } | null;
  cards: Card[];
  store: { slug: string; name: string; kind: string; commission_bps: number } | null;
  team: boolean;
  lastDelivery: { address: string; lga: string; landmark: string; altPhone: string } | null;
  pay: PayOptions;
};
export type PayOptions = { naira: boolean; intl: boolean; minCharge: number; stripePublishableKey: string | null };

export type OrderItem = { id: string; name: string; qty: number; price: number };
export type Order = {
  id: string; items: OrderItem[]; subtotal: number; total_paid: number; gift_card_used: number; status: string; statusLabel: string;
  status_at: string; recipient: { name: string } | null; delivery: { lga: string; address: string }; installer: boolean; pool_id: string | null; created_at: string;
};
export type PoolSummary = { id: string; kind: "public" | "squad"; title: string; goal: number; raised: number; status: string; deadline: string; created_at: string };

export type Pool = {
  id: string; kind: "public" | "squad"; title: string; story: string; occasion: string; owner: string; lga: string;
  goal: number; raised: number; status: "open" | "ended" | "funded" | "cancelled"; createdAt: string; deadline: string; extended: boolean;
  choiceEnds: string | null; items: { id: string; name: string; price: number; qty: number; funded: number }[];
  shares: { id: string; name: string; amount: number; paid: boolean }[];
  supporters: { name: string; message: string; amount: number; at: string; piece: string | null }[];
  order: { status: string } | null; isOwner: boolean; needsAddress: boolean;
};

/** What every "start a payment" call returns. */
export type PayStart = {
  provider?: "paystack" | "stripe";
  id?: string; ref?: string; amount: number;
  authorizationUrl?: string; clientSecret?: string; paymentStatus?: string; paid?: boolean;
};

export type PaySummary = {
  provider?: "paystack" | "stripe"; paymentStatus?: string; amount?: number; kind?: string; ok?: boolean; emailed?: boolean; error?: string;
  order?: { ref: string; total?: number; giftUsed?: number; phone?: string; email?: string; installer?: boolean; recipient?: { name: string } | null; status: string } | null;
  pool?: { id: string; title: string; goal: number; raised: number; status: string } | null;
  accepted?: number; refunded?: number;
  gift?: { code: string; amount: number; toName: string } | null;
};
