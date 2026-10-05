import { Pressable, RefreshControl, View } from "react-native";
import { router } from "expo-router";
import { ErrorBox, Loading, P, Screen, Small } from "@/ui";
import { Hero, Tile } from "@/components/Hero";
import { KitFinder } from "@/components/home/KitFinder";
import { FundHub } from "@/components/home/FundHub";
import { ProHome } from "@/components/home/ProHome";
import { promoActive, useCatalog } from "@/lib/catalog";
import { useProfile } from "@/stores/profile";
import { useAuth } from "@/stores/auth";
import { colors, fonts } from "@/theme";

/** Home is different for each kind of person (picked on the welcome screens, changeable in Me). */
export default function Home() {
  const cat = useCatalog();
  const role = useProfile((s) => s.role) ?? "home";
  const user = useAuth((s) => s.user);
  const first = user?.name.split(" ")[0];

  if (cat.isPending) return <Screen><Loading label="Loading kits…" /></Screen>;
  if (cat.error) return <Screen><ErrorBox message={cat.error.message} onRetry={() => cat.refetch()} /></Screen>;
  const c = cat.data;

  return (
    <Screen refreshControl={<RefreshControl refreshing={cat.isRefetching} onRefresh={() => cat.refetch()} />}>
      {first ? <Small style={{ fontFamily: fonts.sansSemiBold }}>Hi {first} 👋</Small> : null}
      {promoActive(c) ? (
        <Pressable onPress={() => router.push("/(tabs)/shop")} style={{ backgroundColor: colors.sun, borderRadius: 14, padding: 14 }}>
          <Small style={{ color: colors.ink, fontFamily: fonts.sansBold }}>{c.promo.name.toUpperCase()} IS ON</Small>
          <P style={{ color: colors.ink }}>Up to {c.promo.percent}% off batteries, panels, inverters and more. Today only.</P>
        </Pressable>
      ) : null}

      {role === "pro" ? <ProHome catalog={c} /> : role === "group" ? <FundHub /> : role === "gift" ? (
        <>
          <Hero kicker="Solar for someone" icon="gift" title="Light up their home." sub="Pick a kit, pay from anywhere. We deliver and install in Lagos, and keep you posted." />
          <View style={{ flexDirection: "row", gap: 12 }}>
            <Tile tone="sun" icon="ticket-outline" title="Gift card" sub="They choose the kit" onPress={() => router.push("/gift-cards")} />
            <Tile icon="people-outline" title="Chip in together" sub="Family shares the cost" onPress={() => router.push("/fund/new")} />
          </View>
          <KitFinder catalog={c} initialWho="someone" title="Find a kit for them" />
        </>
      ) : (
        <>
          <Hero title="Steady light, no fuel." sub="Tell us what you power. We'll show the kits that fit, with free delivery in Lagos." />
          <View style={{ flexDirection: "row", gap: 12 }}>
            <Tile icon="calendar-outline" title="Pay small small" sub="30–50% now, rest monthly" onPress={() => router.push("/pay-small-small")} />
            <Tile icon="git-branch-outline" title="Split the cost" sub="With housemates or squad" onPress={() => router.push({ pathname: "/fund/new", params: { kind: "squad" } })} />
          </View>
          <KitFinder catalog={c} />
        </>
      )}
    </Screen>
  );
}
