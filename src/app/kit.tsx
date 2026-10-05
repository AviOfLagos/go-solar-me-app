import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { Stack, router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Card, ErrorBox, H1, Loading, Money, P, ProductImage, Row, Screen, Small, Tag } from "@/ui";
import { ShareList } from "@/components/ShareList";
import { useCatalog } from "@/lib/catalog";
import { asString, decodeItems, encodeItems, priceLines, itemsLabel } from "@/lib/kit";
import { PATH_ORDER, type PayPath } from "@/lib/roles";
import { useCart } from "@/stores/cart";
import { useProfile } from "@/stores/profile";
import { FINANCE } from "@/shared/store";
import { colors, fonts } from "@/theme";

type IconName = keyof typeof Ionicons.glyphMap;
type Path = { icon: IconName; title: string; sub: string; go: () => void; hide?: boolean };

/**
 * "How do you want to pay?" One suggested way (from the person's role or who it's for), two more,
 * and the rest behind "More ways to pay" so the choice stays small (docs/DESIGN.md rule 2).
 */
export default function KitScreen() {
  const q = useLocalSearchParams<{ items: string; name?: string; who?: string }>();
  const items = decodeItems(q.items);
  const cat = useCatalog();
  const addMany = useCart((s) => s.addMany);
  const role = useProfile((s) => s.role) ?? "home";
  const [sharing, setSharing] = useState(false);
  const [more, setMore] = useState(false);
  const [showItems, setShowItems] = useState(false);

  if (cat.isPending) return <Screen edges={[]}><Loading /></Screen>;
  if (cat.error) return <Screen edges={[]}><ErrorBox message={cat.error.message} onRetry={() => cat.refetch()} /></Screen>;
  const { lines, subtotal } = priceLines(cat.data, items);
  if (!lines.length) return <Screen edges={[]}><ErrorBox message="This kit isn't available any more. Pick another." /></Screen>;
  const enc = encodeItems(items);

  const all: Record<PayPath, Path> = {
    share: { icon: "share-social-outline", title: "Send it to a client", sub: "Share a link. They see today's prices and pay.", go: () => setSharing(true) },
    now: { icon: "card-outline", title: "Pay now", sub: "Card, bank transfer or USSD.", go: () => { addMany(items); router.push("/checkout"); } },
    someone: { icon: "gift-outline", title: "Buy it for someone", sub: "We deliver to them in Lagos. Pay from anywhere.", go: () => { addMany(items); router.push({ pathname: "/checkout", params: { for: "someone" } }); } },
    fund: { icon: "people-outline", title: "Let people chip in", sub: "A Go Solar Me page. Orders itself at 100%.", go: () => router.push({ pathname: "/fund/new", params: { items: enc } }) },
    squad: { icon: "git-branch-outline", title: "Split with your squad", sub: "2–10 people, equal shares.", go: () => router.push({ pathname: "/fund/new", params: { items: enc, kind: "squad" } }) },
    gift: { icon: "ticket-outline", title: "Give a gift card", sub: "They spend it on this or anything else.", go: () => router.push({ pathname: "/gift-cards", params: { amount: String(subtotal) } }) },
    small: { icon: "calendar-outline", title: "Pay small small", sub: "30–50% now, the rest over 3–12 months.", go: () => router.push({ pathname: "/pay-small-small", params: { items: enc } }), hide: subtotal < FINANCE.minTotal },
  };
  const order = [...PATH_ORDER[role]];
  const bump = (k: PayPath) => { order.splice(order.indexOf(k), 1); order.unshift(k); };
  if (q.who === "us") bump("squad");
  if (q.who === "someone") bump("someone");
  const paths = order.map((k) => all[k]).filter((p) => !p.hide);
  const [first, ...rest] = paths;
  const shown = rest.slice(0, 2);
  const hidden = rest.slice(2);

  return (
    <Screen edges={[]}>
      <Stack.Screen options={{ title: "" }} />
      <View style={{ gap: 6 }}>
        <Small style={{ fontFamily: fonts.sansSemiBold }}>{asString(q.name) || "Your kit"} · {itemsLabel(lines.reduce((n, l) => n + l.qty, 0))}</Small>
        <Text style={{ fontFamily: fonts.light, fontSize: 38, color: colors.ink, letterSpacing: -1 }}>₦{subtotal.toLocaleString("en-NG")}</Text>
        <Pressable onPress={() => setShowItems(!showItems)} hitSlop={8} style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
          <Small style={{ color: colors.ink, fontFamily: fonts.sansSemiBold }}>{showItems ? "Hide" : "See"} what's inside</Small>
          <Ionicons name={showItems ? "chevron-up" : "chevron-down"} size={14} color={colors.ink} />
        </Pressable>
      </View>
      {showItems ? (
        <Card>
          {lines.map((l) => (
            <Row key={l.id}>
              <ProductImage uri={l.p.image} size={44} />
              <View style={{ flex: 1 }}><P numberOfLines={2} style={{ color: colors.ink }}>{l.p.name}</P><Small>Qty {l.qty}</Small></View>
              <Money n={l.total} style={{ fontSize: 14 }} />
            </Row>
          ))}
          <Small>Free delivery in Lagos.</Small>
        </Card>
      ) : null}

      <H1 style={{ fontSize: 26, lineHeight: 32, marginTop: 6 }}>How would you like to pay?</H1>

      {/* The suggested way: big and first */}
      <Pressable onPress={first.go} accessibilityRole="button"
        style={({ pressed }) => ({ backgroundColor: colors.night, borderRadius: 28, padding: 20, gap: 14, transform: [{ scale: pressed ? 0.985 : 1 }] })}>
        <Row style={{ justifyContent: "space-between" }}>
          <View style={{ width: 48, height: 48, borderRadius: 16, backgroundColor: colors.mint, alignItems: "center", justifyContent: "center" }}>
            <Ionicons name={first.icon} size={24} color={colors.ink} />
          </View>
          <Tag label="Suggested for you" tone="mint" />
        </Row>
        <View style={{ gap: 4 }}>
          <Text style={{ fontFamily: fonts.sansBold, fontSize: 20, color: colors.paper }}>{first.title}</Text>
          <Small style={{ color: "#AEB8B1" }}>{first.sub}</Small>
        </View>
        <Row style={{ justifyContent: "flex-end" }}>
          <Text style={{ fontFamily: fonts.sansBold, color: colors.mint }}>Continue</Text>
          <Ionicons name="arrow-forward" size={18} color={colors.mint} />
        </Row>
      </Pressable>
      {sharing ? <Card><ShareList items={items} kind="ink" /></Card> : null}

      {[...shown, ...(more ? hidden : [])].map((p) => (
        <Pressable key={p.title} onPress={p.go} accessibilityRole="button"
          style={({ pressed }) => ({ flexDirection: "row", gap: 14, alignItems: "center", padding: 16, borderRadius: 24, backgroundColor: colors.paper, opacity: pressed ? 0.85 : 1 })}>
          <View style={{ width: 44, height: 44, borderRadius: 15, backgroundColor: colors.haze, alignItems: "center", justifyContent: "center" }}>
            <Ionicons name={p.icon} size={22} color={colors.ink} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontFamily: fonts.sansBold, fontSize: 15, color: colors.ink }}>{p.title}</Text>
            <Small>{p.sub}</Small>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.mute} />
        </Pressable>
      ))}
      {hidden.length && !more ? (
        <Pressable onPress={() => setMore(true)} hitSlop={8} accessibilityRole="button" style={{ alignItems: "center", paddingVertical: 8 }}>
          <Text style={{ fontFamily: fonts.sansSemiBold, color: colors.ink, textDecorationLine: "underline" }}>More ways to pay ({hidden.length})</Text>
        </Pressable>
      ) : null}
    </Screen>
  );
}
