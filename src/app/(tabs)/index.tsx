import { RefreshControl, View } from "react-native";
import { router } from "expo-router";
import { ErrorBox, Loading, Screen, Tag } from "@/ui";
import { ContinueCard, Greeting, LinkRow, OrderProgress, StartCard, Tile } from "@/components/Hero";
import { FundHub } from "@/components/home/FundHub";
import { ProHome } from "@/components/home/ProHome";
import { promoActive, useCatalog } from "@/lib/catalog";
import { useMine } from "@/lib/pools";
import { encodeItems, priceLines, itemsLabel } from "@/lib/kit";
import { useProfile } from "@/stores/profile";
import { useCart } from "@/stores/cart";

const ACTIVE = ["pending", "confirmed", "out_for_delivery", "delivered"];

/**
 * Home: one main action for the kind of person (picked at the start, changeable in Me), then at most
 * what they're in the middle of (a kit in the cart, an order on its way) and two smaller actions.
 */
export default function Home() {
  const cat = useCatalog();
  const role = useProfile((s) => s.role) ?? "home";
  const mine = useMine();
  const items = useCart((s) => s.lines);

  if (cat.isPending) return <Screen tab><Loading label="Loading…" /></Screen>;
  if (cat.error) return <Screen tab><ErrorBox message={cat.error.message} onRetry={() => cat.refetch()} /></Screen>;
  const c = cat.data;
  const { lines, subtotal } = priceLines(c, items);
  const live = mine.data?.orders.find((o) => ACTIVE.includes(o.status));
  const refresh = <RefreshControl refreshing={cat.isRefetching || mine.isRefetching} onRefresh={() => { void cat.refetch(); void mine.refetch(); }} />;

  if (role === "pro") return <Screen tab refreshControl={refresh}><Greeting /><ProHome catalog={c} /></Screen>;
  if (role === "group") return <Screen tab refreshControl={refresh}><Greeting /><FundHub /></Screen>;

  const gift = role === "gift";
  return (
    <Screen tab refreshControl={refresh}>
      <Greeting />
      {promoActive(c) ? <Tag label={`${c.promo.name}: up to ${c.promo.percent}% off today`} tone="lemon" /> : null}
      {live ? <OrderProgress order={live} onPress={() => router.push("/(tabs)/orders")} /> : null}
      {lines.length ? (
        <ContinueCard title="Pick up where you left off" sub={`${itemsLabel(lines.reduce((n, l) => n + l.qty, 0))} in your kit`} total={subtotal}
          onPress={() => router.push({ pathname: "/kit", params: { items: encodeItems(items), name: "Your kit", who: gift ? "someone" : "me" } })} />
      ) : null}
      <StartCard
        scene={gift ? "gift" : "home"}
        meta="3 quick questions · about a minute"
        title={gift ? "Light up their home." : "Find the right kit."}
        sub={gift ? "Tell us what they need to run. We deliver and install in Lagos, and keep you posted." : "Tell us what you want to run. We'll match a kit and show what you'll save on fuel."}
        cta={gift ? "Find a kit for them" : "Find my kit"}
        onPress={() => router.push({ pathname: "/find", params: gift ? { who: "someone" } : {} })}
      />
      <View style={{ flexDirection: "row", gap: 12 }}>
        {gift ? (
          <>
            <Tile tone="lemon" icon="ticket-outline" title="Send a gift card" sub="They choose the kit" onPress={() => router.push("/gift-cards")} />
            <Tile icon="people-outline" title="Chip in together" sub="Family shares the cost" onPress={() => router.push("/fund/new")} />
          </>
        ) : (
          <>
            <Tile tone="lemon" icon="calendar-outline" title="Pay small small" sub="Part now, rest monthly" onPress={() => router.push("/pay-small-small")} />
            <Tile icon="git-branch-outline" title="Split the cost" sub="With housemates" onPress={() => router.push({ pathname: "/fund/new", params: { kind: "squad" } })} />
          </>
        )}
      </View>
      <LinkRow />
    </Screen>
  );
}
