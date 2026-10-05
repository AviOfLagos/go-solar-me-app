import { Pressable, View } from "react-native";
import { Stack, router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Card, ErrorBox, H2, Loading, Money, P, ProductImage, Row, Screen, Small } from "@/ui";
import { useCatalog } from "@/lib/catalog";
import { asString, decodeItems, encodeItems, priceLines } from "@/lib/kit";
import { useCart } from "@/stores/cart";
import { useProfile } from "@/stores/profile";
import { PATH_ORDER, type PayPath } from "@/lib/roles";
import { ShareList } from "@/components/ShareList";
import { useState } from "react";
import { FINANCE } from "@/shared/store";
import { colors, fonts } from "@/theme";

type IconName = keyof typeof Ionicons.glyphMap;

/** "How do you want to pay?" — every path starts from the kit picked here. */
export default function KitScreen() {
  const q = useLocalSearchParams<{ items: string; name?: string; who?: string }>();
  const items = decodeItems(q.items);
  const cat = useCatalog();
  const addMany = useCart((s) => s.addMany);
  const role = useProfile((s) => s.role) ?? "home";
  const [sharing, setSharing] = useState(false);

  if (cat.isPending) return <Screen edges={[]}><Loading /></Screen>;
  if (cat.error) return <Screen edges={[]}><ErrorBox message={cat.error.message} onRetry={() => cat.refetch()} /></Screen>;
  const { lines, subtotal } = priceLines(cat.data, items);
  if (!lines.length) return <Screen edges={[]}><ErrorBox message="This kit isn't available any more. Pick another." /></Screen>;
  const enc = encodeItems(items);

  const all: Record<PayPath, { icon: IconName; title: string; sub: string; go: () => void; hide?: boolean }> = {
    share: { icon: "share-social-outline", title: "Share this list", sub: "Send a link. They see today's prices and pay.", go: () => setSharing(true) },
    now: { icon: "card-outline", title: "Pay now", sub: "Card, bank transfer or USSD. Delivered to you.", go: () => { addMany(items); router.push("/checkout"); } },
    someone: { icon: "gift-outline", title: "Buy for someone", sub: "Send it to family or a friend in Lagos. Pay from anywhere.", go: () => { addMany(items); router.push({ pathname: "/checkout", params: { for: "someone" } }); } },
    fund: { icon: "people-outline", title: "Go Solar Me", sub: "A page anyone can chip in to. The order places itself at 100%.", go: () => router.push({ pathname: "/fund/new", params: { items: enc } }) },
    squad: { icon: "git-branch-outline", title: "Split with squad", sub: "2 to 10 people, equal shares, one pay button each.", go: () => router.push({ pathname: "/fund/new", params: { items: enc, kind: "squad" } }) },
    gift: { icon: "ticket-outline", title: "Give a gift card", sub: "They spend it on this kit or anything else.", go: () => router.push({ pathname: "/gift-cards", params: { amount: String(subtotal) } }) },
    small: { icon: "calendar-outline", title: "Pay small small", sub: `30–50% down, the rest over 3 to 12 months.`, go: () => router.push({ pathname: "/pay-small-small", params: { items: enc } }), hide: subtotal < FINANCE.minTotal },
  };
  // The order follows what the person told us at the start; "someone else" or "us" on the calculator wins.
  const order = [...PATH_ORDER[role]];
  const bump = (k: PayPath) => { order.splice(order.indexOf(k), 1); order.unshift(k); };
  if (q.who === "us") bump("squad");
  if (q.who === "someone") bump("someone");
  const paths = order.map((k) => all[k]).filter((p) => !p.hide);
  const [first, ...rest] = paths;

  return (
    <Screen edges={[]}>
      <Stack.Screen options={{ title: asString(q.name) || "Your kit" }} />
      <Card>
        {lines.map((l) => (
          <Row key={l.id}>
            <ProductImage uri={l.p.image} size={48} />
            <View style={{ flex: 1 }}><P numberOfLines={2}>{l.p.name}</P><Small>Qty {l.qty}</Small></View>
            <Money n={l.total} style={{ fontSize: 14 }} />
          </Row>
        ))}
        <Row style={{ justifyContent: "space-between", borderTopWidth: 1, borderTopColor: colors.line, paddingTop: 8 }}>
          <P style={{ fontFamily: fonts.sansSemiBold, color: colors.ink }}>Total</P>
          <Money n={subtotal} style={{ fontSize: 20 }} />
        </Row>
        <Small>Free delivery in Lagos.</Small>
      </Card>
      {sharing ? <Card><ShareList items={items} kind="ink" /></Card> : null}
      <H2>How do you want to pay?</H2>
      {[first, ...rest].map((p, i) => (
        <Pressable key={p.title} onPress={p.go} accessibilityRole="button"
          style={({ pressed }) => ({ flexDirection: "row", gap: 12, alignItems: "center", padding: 14, borderRadius: 14, borderWidth: 1, backgroundColor: pressed ? colors.sunTint : i === 0 ? colors.sunTint : colors.paper, borderColor: i === 0 ? colors.ink : colors.line })}>
          <Ionicons name={p.icon} size={24} color={colors.ink} />
          <View style={{ flex: 1 }}>
            <P style={{ fontFamily: fonts.sansSemiBold, color: colors.ink }}>{p.title}</P>
            <Small>{p.sub}</Small>
          </View>
          {i === 0 ? <Small style={{ fontFamily: fonts.sansBold, color: colors.ink }}>Suggested</Small> : <Ionicons name="chevron-forward" size={18} color={colors.mute} />}
        </Pressable>
      ))}
    </Screen>
  );
}
