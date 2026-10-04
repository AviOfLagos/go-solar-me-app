// Shared with solar-builders-ng. Keep in step.
// Note: no process.env references here — use EXPO_PUBLIC_* in app code.

export const STORE = {
  name: "Solar Builders NG",
  shortName: "Solar Builders",
  city: "Lagos",
  country: "NG",
  supportEmail: "solar@nexprove.com",
  supportPhone: "+2347030546907",
  whatsapp: "2347030546907",
  currency: "NGN",
  deliveryFee: 0,
};

export const FINANCE = {
  minTotal: 300_000,
  downPayments: [30, 40, 50],
  months: [3, 6, 12],
  employment: [
    "Salaried",
    "Self-employed / business owner",
    "Freelancer / remote worker",
    "Student",
    "Other",
  ],
  incomeBands: [
    "Under ₦200k",
    "₦200k – ₦500k",
    "₦500k – ₦1m",
    "₦1m – ₦3m",
    "Above ₦3m",
  ],
};

export const CART = {
  maxQty: 50,
  maxLines: 40,
  maxTotal: 100_000_000,
};

export const ORDER_STATUS = {
  awaiting_payment: "Waiting for payment",
  pending: "Pending: we'll call to confirm",
  confirmed: "Confirmed",
  out_for_delivery: "Out for delivery",
  delivered: "Delivered",
  installed: "Installed: lights on",
  cancelled: "Cancelled",
  expired: "Payment not completed",
  refunded: "Refunded",
} as const;
export type OrderStatus = keyof typeof ORDER_STATUS;

export const POOL = {
  deadlineDays: [14, 30, 60],
  defaultDays: 30,
  choiceDays: 7,
  extendDays: 30,
  squadMin: 2,
  squadMax: 10,
  chipIns: [5_000, 10_000, 20_000],
};

export const OCCASIONS = [
  {
    slug: "birthday",
    label: "Birthday",
    story: (n: string) =>
      `${n}'s birthday is coming, and we want to give something that lasts: steady light, no generator noise and no more fuel money. Every naira here goes straight to ${n}'s solar kit.`,
  },
  {
    slug: "mothers-day",
    label: "Mother's Day",
    story: (n: string) =>
      `${n} has kept the house running through every NEPA outage. This Mother's Day, let's give her steady light and a quiet night's sleep. Every naira goes straight to her solar kit.`,
  },
  {
    slug: "christmas",
    label: "Christmas",
    story: (n: string) =>
      `This Christmas, let's give ${n} light that doesn't depend on NEPA or fuel queues. Every naira goes straight to the solar kit.`,
  },
  {
    slug: "new-baby",
    label: "New baby",
    story: (n: string) =>
      `A new baby means night feeds, a fan that must stay on and a fridge that can't go off. Help ${n} go solar so the little one never sleeps in the heat.`,
  },
  {
    slug: "nepa",
    label: "NEPA wahala",
    story: (n: string) =>
      `${n} is tired of buying fuel and sleeping in the heat. Together we can switch ${n} to solar for good. Every naira goes straight to the kit.`,
  },
  {
    slug: "just-because",
    label: "Just because",
    story: (n: string) =>
      `Help ${n} go solar. Every naira here goes straight to the solar kit, and we deliver and install it in Lagos.`,
  },
] as const;
export type Occasion = (typeof OCCASIONS)[number]["slug"];

export const LAGOS_LGAS = [
  "Agege",
  "Ajeromi-Ifelodun",
  "Alimosho",
  "Amuwo-Odofin",
  "Apapa",
  "Badagry",
  "Epe",
  "Eti-Osa",
  "Ibeju-Lekki",
  "Ifako-Ijaiye",
  "Ikeja",
  "Ikorodu",
  "Kosofe",
  "Lagos Island",
  "Lagos Mainland",
  "Mushin",
  "Ojo",
  "Oshodi-Isolo",
  "Shomolu",
  "Surulere",
] as const;
export type LGA = (typeof LAGOS_LGAS)[number];

export const PROMO = {
  name: "Solar Friday",
  percent: 15,
  /** 5 = Friday in Africa/Lagos (UTC+1) */
  weekdays: [5],
  timeZone: "Africa/Lagos",
};

/** Returns true if today is Solar Friday (in WAT/UTC+1). */
export function isSolarFriday(): boolean {
  const now = new Date();
  const lagos = new Date(
    now.toLocaleString("en-US", { timeZone: "Africa/Lagos" })
  );
  return lagos.getDay() === 5;
}
