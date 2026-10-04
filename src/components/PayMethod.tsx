import { Pressable, Text, View } from "react-native";
import { Choice, Label, Row, Small } from "@/ui";
import type { Card, PayOptions } from "@/lib/types";
import { colors, fonts } from "@/theme";

export type Method = "paystack" | "stripe";

/** "Pay in naira" vs "Card from abroad" — shown only when both are on. */
export function MethodPicker({ opts, value, onChange }: { opts: PayOptions | undefined; value: Method; onChange: (m: Method) => void }) {
  if (!opts?.naira || !opts.intl) return null;
  return (
    <View style={{ gap: 6 }}>
      <Label>How do you want to pay?</Label>
      <Row>
        <Choice title="Pay in naira" sub="Card, transfer or USSD" on={value === "paystack"} onPress={() => onChange("paystack")} />
        <Choice title="Card from abroad" sub="Visa, Mastercard, Amex" on={value === "stripe"} onPress={() => onChange("stripe")} />
      </Row>
    </View>
  );
}

export const defaultMethod = (o: PayOptions | undefined): Method => (o && !o.naira && o.intl ? "stripe" : "paystack");

/** Saved cards for the chosen method, plus "new". */
export function SavedCards({ cards, method, value, onChange }: { cards: Card[]; method: Method; value: string; onChange: (id: string) => void }) {
  const mine = cards.filter((c) => c.provider === method);
  if (!mine.length) return null;
  const opt = (id: string, title: string, sub?: string) => (
    <Pressable key={id} accessibilityRole="radio" accessibilityState={{ checked: value === id }} onPress={() => onChange(id)}
      style={{ padding: 12, borderRadius: 12, borderWidth: value === id ? 2 : 1, borderColor: value === id ? colors.ink : colors.line, backgroundColor: colors.paper }}>
      <Text style={{ fontFamily: fonts.sansSemiBold, color: colors.ink }}>{title}</Text>
      {sub ? <Small>{sub}</Small> : null}
    </Pressable>
  );
  return (
    <View style={{ gap: 6 }}>
      <Label>Your saved cards</Label>
      {mine.map((c) => opt(c.id, c.nickname, `•••• ${c.last4} · ${String(c.expMonth).padStart(2, "0")}/${String(c.expYear).slice(-2)}${c.bank ? ` · ${c.bank}` : ""}`))}
      {opt("new", method === "paystack" ? "New card, bank transfer or USSD" : "Use a new card")}
    </View>
  );
}
