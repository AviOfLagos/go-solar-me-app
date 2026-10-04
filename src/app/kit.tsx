import { Pressable, View } from "react-native";
import { Stack, router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Card, ErrorBox, H2, Loading, Money, P, ProductImage, Row, Screen, Small } from "@/ui";
import { useCatalog } from "@/lib/catalog";
import { asString, decodeItems, encodeItems, priceLines } from "@/lib/kit";
import { useCart } from "@/stores/cart";
import { FINANCE } from "@/shared/store";
import { colors, fonts } from "@/theme";

type IconName = keyof typeof Ionicons.glyphMap;

/** "How do you want to pay?" — every path starts from the kit picked here. */
export default function KitScreen() {
  const q = useLocalSearchParams<{ items: string; name?: string; who?: string }>();
  const items = decodeItems(q.items);
  const cat = useCatalog();
  const addMany = useCart((s) => s.addMany);

  if (cat.isPending) return <Screen edges={[]}><Loading /></Screen>;
  if (cat.error) return <Screen edges={[]}><ErrorBox message={cat.error.message} onRetry={() => cat.refetch()} /></Screen>;
  const { lines, subtotal } = priceLines(cat.data, items);
  if (!lines.length) return <Screen edges={[]}><ErrorBox message="This kit isn't available any more. Pick another." /></Screen>;
  const enc = encodeItems(items);

  const paths: { icon: IconName; title: string; sub: string; go: () => void; hide?: boolean }[] = [
    { icon: "card-outline", title: "Pay now", sub: "Card, bank transfer or USSD. Delivered to you.", go: () => { addMany(items); router.push("/checkout"); } },
    { icon: "gift-outline", title: "Buy for someone", sub: "Send it to family or a friend in Lagos. Pay from anywhere.", go: () => { addMany(items); router.push({ pathname: "/checkout", params: { for: "someone" } }); } },
    { icon: "people-outline", title: "Go Solar Me", sub: "A page anyone can chip in to. The order places itself at 100%.", go: () => router.push({ pathname: "/fund/new", params: { items: enc } }) },
    { icon: "git-branch-outline", title: "Split with squad", sub: "2 to 10 people, equal shares, one pay button each.", go: () => router.push({ pathname: "/fund/new", params: { items: enc, kind: "squad" } }) },
    { icon: "ticket-outline", title: "Give a gift card", sub: "They spend it on this kit or anything else.", go: () => router.push({ pathname: "/gift-cards", params: { amount: String(subtotal) } }) },
    { icon: "calendar-outline", title: "Pay small small", sub: `30–50% down, the rest over 3 to 12 months.`, go: () => router.push({ pathname: "/pay-small-small", params: { items: enc } }), hide: subtotal < FINANCE.minTotal },
  ];
  // Someone else first if that's who it's for.
  if (q.who === "someone") paths.unshift(paths.splice(1, 1)[0]);
  if (q.who === "us") paths.unshift(paths.splice(3, 1)[0]);

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
      <H2>How do you want to pay?</H2>
      {paths.filter((p) => !p.hide).map((p) => (
        <Pressable key={p.title} onPress={p.go} accessibilityRole="button"
          style={({ pressed }) => ({ flexDirection: "row", gap: 12, alignItems: "center", padding: 14, borderRadius: 14, borderWidth: 1, borderColor: colors.line, backgroundColor: pressed ? colors.sunTint : colors.paper })}>
          <Ionicons name={p.icon} size={24} color={colors.ink} />
          <View style={{ flex: 1 }}>
            <P style={{ fontFamily: fonts.sansSemiBold, color: colors.ink }}>{p.title}</P>
            <Small>{p.sub}</Small>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.mute} />
        </Pressable>
      ))}
    </Screen>
  );
}
