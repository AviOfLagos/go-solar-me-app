import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { api } from "@/lib/api";
import { CART } from "@/shared/store";
import { NG_PHONE, INTL_PHONE, normalizePhone, isEmail } from "@/shared/format";

export type Line = { id: string; qty: number };

type CartState = {
  lines: Line[];
  /** Lead id from POST /leads, sent again on every change and as leadId at checkout. */
  leadId: string | null;
  contact: { name: string; phone: string; email: string };
  /** Seller slug from a store link (/s/slug), for referral commission. */
  ref: string | null;
  add: (id: string, qty?: number) => void;
  addMany: (items: Line[]) => void;
  setQty: (id: string, qty: number) => void;
  remove: (id: string) => void;
  replace: (items: Line[]) => void;
  clear: () => void;
  setContact: (c: Partial<CartState["contact"]>) => void;
  setRef: (slug: string | null) => void;
};

const clampLines = (lines: Line[]) => {
  const merged = new Map<string, number>();
  for (const l of lines) merged.set(l.id, Math.min(CART.maxQty, (merged.get(l.id) ?? 0) + Math.max(0, Math.floor(l.qty))));
  return [...merged].filter(([, q]) => q > 0).slice(0, CART.maxLines).map(([id, qty]) => ({ id, qty }));
};

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      lines: [],
      leadId: null,
      contact: { name: "", phone: "", email: "" },
      ref: null,
      add: (id, qty = 1) => { set({ lines: clampLines([...get().lines, { id, qty }]) }); syncLead(); },
      addMany: (items) => { set({ lines: clampLines([...get().lines, ...items]) }); syncLead(); },
      setQty: (id, qty) => {
        set({ lines: clampLines(get().lines.map((l) => (l.id === id ? { id, qty } : l))) });
        syncLead();
      },
      remove: (id) => { set({ lines: get().lines.filter((l) => l.id !== id) }); syncLead(); },
      replace: (items) => { set({ lines: clampLines(items) }); syncLead(); },
      clear: () => set({ lines: [], leadId: null }),
      setContact: (c) => { set({ contact: { ...get().contact, ...c } }); syncLead(); },
      setRef: (slug) => set({ ref: slug }),
    }),
    { name: "gsm_cart", storage: createJSONStorage(() => AsyncStorage) },
  ),
);

let timer: ReturnType<typeof setTimeout> | null = null;

/**
 * Saves the phone or email and the cart as soon as there is one, so an unfinished checkout can be
 * followed up. Debounced, and never blocks the cart.
 */
export function syncLead() {
  if (timer) clearTimeout(timer);
  timer = setTimeout(async () => {
    const { lines, leadId, contact } = useCart.getState();
    const phone = normalizePhone(contact.phone);
    const okPhone = NG_PHONE.test(phone) || INTL_PHONE.test(phone);
    const okEmail = isEmail(contact.email.trim());
    if (!leadId && !okPhone && !okEmail) return;
    try {
      const r = await api<{ id: string }>("/leads", {
        body: { id: leadId ?? undefined, name: contact.name, phone: okPhone ? phone : "", email: okEmail ? contact.email.trim() : "", consent: true, source: "app", items: lines },
      });
      if (r.id && r.id !== leadId) useCart.setState({ leadId: r.id });
    } catch {
      // A missed lead must never break the cart.
    }
  }, 800);
}
