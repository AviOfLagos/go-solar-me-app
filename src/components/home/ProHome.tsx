import { Pressable, View } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Button, Card, H2, Loading, Money, P, Row, Small } from "@/ui";
import { Hero, Tile } from "@/components/Hero";
import { OpenLink } from "@/components/OpenLink";
import { ShareList } from "@/components/ShareList";
import { useMyBuilds } from "@/lib/builds";
import { useMe } from "@/lib/me";
import { shareLink } from "@/lib/share";
import { priceLines } from "@/lib/kit";
import { useAuth } from "@/stores/auth";
import { useCart } from "@/stores/cart";
import type { Catalog } from "@/lib/types";
import { colors, fonts } from "@/theme";

/** Installers and resellers: build an equipment list, send the link, track what they shared and earned. */
export function ProHome({ catalog }: { catalog: Catalog }) {
  const user = useAuth((s) => s.user);
  const me = useMe();
  const builds = useMyBuilds();
  const items = useCart((s) => s.lines);
  const { lines, subtotal } = priceLines(catalog, items);
  const store = me.data?.store;

  return (
    <>
      <Hero kicker="For installers" icon="construct" title="Quote in minutes." sub="Build an equipment list, send the link. Your client sees today's prices and pays any way they like." />
      <View style={{ flexDirection: "row", gap: 12 }}>
        <Tile tone="sun" icon="add-circle-outline" title="New list" sub="Pick from the catalogue" onPress={() => router.push("/(tabs)/shop")} />
        <Tile icon="calculator-outline" title="Size a system" sub="From appliances and hours" onPress={() => router.push("/size")} />
      </View>

      {lines.length ? (
        <Card highlight>
          <Row style={{ justifyContent: "space-between" }}>
            <P style={{ fontFamily: fonts.sansBold, color: colors.ink }}>Your list · {lines.reduce((n, l) => n + l.qty, 0)} items</P>
            <Money n={subtotal} />
          </Row>
          <Small numberOfLines={2}>{lines.map((l) => `${l.qty}× ${l.p.name}`).join(", ")}</Small>
          <ShareList items={items} kind="ink" />
          <Button title="Edit list" kind="ghost" small onPress={() => router.push("/cart")} />
        </Card>
      ) : null}

      <H2>Lists you shared</H2>
      {!user ? (
        <Card>
          <P>Sign in to keep every list you send in one place, and earn on the sales they bring.</P>
          <Button title="Sign in" kind="ink" small onPress={() => router.push("/sign-in")} />
        </Card>
      ) : builds.isPending ? <Loading /> : !builds.data?.builds.length ? (
        <P>None yet. Make a list and tap Share.</P>
      ) : builds.data.builds.map((b) => (
        <Pressable key={b.id} onPress={() => router.push({ pathname: "/b/[id]", params: { id: b.id } })}
          style={{ padding: 14, gap: 4, borderRadius: 14, backgroundColor: colors.paper, borderWidth: 1, borderColor: colors.line }}>
          <Row style={{ justifyContent: "space-between" }}>
            <P style={{ fontFamily: fonts.sansSemiBold, color: colors.ink, flex: 1 }} numberOfLines={1}>{b.title || `List ${b.id}`}</P>
            <Money n={b.total} style={{ fontSize: 14 }} />
          </Row>
          <Row style={{ justifyContent: "space-between" }}>
            <Small>{b.items} items · {b.views} {b.views === 1 ? "view" : "views"} · {new Date(b.created_at).toLocaleDateString()}</Small>
            <Pressable hitSlop={10} accessibilityRole="button" accessibilityLabel="Share again" onPress={() => shareLink(b.title || "Your solar equipment list", b.path)}>
              <Ionicons name="share-social-outline" size={20} color={colors.ink} />
            </Pressable>
          </Row>
        </Pressable>
      ))}

      {user ? (
        <Pressable onPress={() => router.push("/account/store")} style={{ flexDirection: "row", gap: 12, alignItems: "center", padding: 14, borderRadius: 14, backgroundColor: colors.leafTint }}>
          <Ionicons name="storefront-outline" size={24} color={colors.leaf} />
          <View style={{ flex: 1 }}>
            <P style={{ fontFamily: fonts.sansBold, color: colors.ink }}>{store ? store.name : "Open your store, earn on sales"}</P>
            <Small>{store ? `solar.nexprove.com/s/${store.slug}` : "Lists you share are credited to you."}</Small>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.mute} />
        </Pressable>
      ) : null}

      <Card><OpenLink label="Open a list someone sent you" /></Card>
    </>
  );
}
