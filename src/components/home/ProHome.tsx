import { Pressable, Text, View } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Button, Loading, Money, P, Section, Small } from "@/ui";
import { LinkRow, StartCard, Tile } from "@/components/Hero";
import { ShareList } from "@/components/ShareList";
import { useMyBuilds } from "@/lib/builds";
import { useMe } from "@/lib/me";
import { shareLink } from "@/lib/share";
import { priceLines, itemsLabel } from "@/lib/kit";
import { useAuth } from "@/stores/auth";
import { useCart } from "@/stores/cart";
import type { Catalog } from "@/lib/types";
import { colors, fonts } from "@/theme";

function Stat({ n, label }: { n: string | number; label: string }) {
  return (
    <View style={{ flex: 1, backgroundColor: colors.paper, borderRadius: 22, padding: 14 }}>
      <Text style={{ fontFamily: fonts.light, fontSize: 28, color: colors.ink }}>{n}</Text>
      <Small>{label}</Small>
    </View>
  );
}

/** Installers and resellers: make a list, send the link, see what they've shared. */
export function ProHome({ catalog }: { catalog: Catalog }) {
  const user = useAuth((s) => s.user);
  const me = useMe();
  const builds = useMyBuilds();
  const items = useCart((s) => s.lines);
  const { lines, subtotal } = priceLines(catalog, items);
  const store = me.data?.store;
  const list = builds.data?.builds ?? [];
  const views = list.reduce((n, b) => n + b.views, 0);

  return (
    <>
      {lines.length ? (
        <View style={{ backgroundColor: colors.night, borderRadius: 28, padding: 20, gap: 12 }}>
          <Small style={{ color: "#AEB8B1", fontFamily: fonts.sansSemiBold }}>Your list in progress</Small>
          <View style={{ flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between" }}>
            <Text style={{ fontFamily: fonts.light, fontSize: 32, color: colors.paper }}>{itemsLabel(lines.reduce((n, l) => n + l.qty, 0))}</Text>
            <Money n={subtotal} style={{ color: colors.mint, fontSize: 18 }} />
          </View>
          <Small style={{ color: "#AEB8B1" }} numberOfLines={2}>{lines.map((l) => `${l.qty}× ${l.p.name}`).join(" · ")}</Small>
          <ShareList items={items} kind="sun" />
          <Button title="Edit list" kind="ghost" small onPress={() => router.push("/cart")} />
        </View>
      ) : (
        <StartCard
          scene="pro"
          meta="Quote a client in minutes"
          title="Build a list, send a link."
          sub="Pick the equipment from the catalogue. Your client opens the link, sees today's prices and pays any way they like."
          cta="Start a new list"
          onPress={() => router.push("/(tabs)/shop")}
        />
      )}

      <View style={{ flexDirection: "row", gap: 12 }}>
        <Tile tone="lemon" icon="calculator-outline" title="Size a system" sub="From appliances and hours" onPress={() => router.push({ pathname: "/find", params: { pro: "1" } })} />
        <Tile icon="storefront-outline" title={store ? "My store" : "Open a store"} sub={store ? "Earnings and sales" : "Earn on every sale"} onPress={() => router.push(user ? "/account/store" : "/sign-in")} />
      </View>

      {user && list.length ? (
        <View style={{ flexDirection: "row", gap: 12 }}>
          <Stat n={list.length} label="lists shared" />
          <Stat n={views} label={views === 1 ? "client view" : "client views"} />
        </View>
      ) : null}

      <Section title="Lists you shared" />
      {!user ? (
        <View style={{ backgroundColor: colors.paper, borderRadius: 24, padding: 18, gap: 10 }}>
          <P>Sign in to keep every list you send in one place and get credit for the sales.</P>
          <Button title="Sign in" kind="ghost" small onPress={() => router.push("/sign-in")} />
        </View>
      ) : builds.isPending ? <Loading /> : !list.length ? (
        <Small>Nothing yet. Your first shared list will show here.</Small>
      ) : list.map((b) => (
        <Pressable key={b.id} onPress={() => router.push({ pathname: "/b/[id]", params: { id: b.id } })}
          style={({ pressed }) => ({ flexDirection: "row", alignItems: "center", gap: 12, padding: 16, borderRadius: 22, backgroundColor: colors.paper, opacity: pressed ? 0.85 : 1 })}>
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={{ fontFamily: fonts.sansBold, color: colors.ink }} numberOfLines={1}>{b.title || `List ${b.id}`}</Text>
            <Small>{itemsLabel(b.items)} · {b.views} {b.views === 1 ? "view" : "views"}</Small>
          </View>
          <Money n={b.total} style={{ fontSize: 14 }} />
          <Pressable hitSlop={10} accessibilityRole="button" accessibilityLabel="Share again" onPress={() => shareLink(b.title || "Your solar equipment list", b.path)}
            style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: colors.haze, alignItems: "center", justifyContent: "center" }}>
            <Ionicons name="share-social-outline" size={18} color={colors.ink} />
          </Pressable>
        </Pressable>
      ))}
      <LinkRow label="Open a list someone sent you" />
    </>
  );
}
