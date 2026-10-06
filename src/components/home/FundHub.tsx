import { Pressable, Text, View } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Button, ErrorBox, Loading, P, Progress, Section, Small } from "@/ui";
import { LinkRow, StartCard, Tile } from "@/components/Hero";
import { useMine, POOL_STATUS } from "@/lib/pools";
import { useAuth } from "@/stores/auth";
import { naira } from "@/shared/format";
import type { PoolSummary } from "@/lib/types";
import { colors, fonts } from "@/theme";

const MILESTONES = [25, 50, 75, 100];

/** A page's progress with its milestones lit up as they're reached. */
export function PoolCard({ p }: { p: PoolSummary }) {
  const pct = Math.min(100, Math.round((p.raised / p.goal) * 100));
  return (
    <Pressable onPress={() => router.push({ pathname: "/fund/[id]", params: { id: p.id } })}
      style={({ pressed }) => ({ padding: 18, gap: 10, borderRadius: 24, backgroundColor: colors.paper, opacity: pressed ? 0.9 : 1 })}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontFamily: fonts.sansBold, fontSize: 15, color: colors.ink }} numberOfLines={1}>{p.title}</Text>
          <Small>{POOL_STATUS[p.status] ?? p.status}</Small>
        </View>
        <Text style={{ fontFamily: fonts.light, fontSize: 26, color: colors.ink }}>{pct}%</Text>
      </View>
      <Progress value={p.raised / p.goal} />
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <Small>{naira(p.raised)} of {naira(p.goal)}</Small>
        <View style={{ flexDirection: "row", gap: 4 }}>
          {MILESTONES.map((m) => (
            <View key={m} style={{ paddingHorizontal: 7, paddingVertical: 2, borderRadius: 999, backgroundColor: pct >= m ? colors.mint : colors.haze }}>
              <Text style={{ fontFamily: fonts.sansBold, fontSize: 10, color: pct >= m ? colors.ink : colors.mute }}>{m}%</Text>
            </View>
          ))}
        </View>
      </View>
    </Pressable>
  );
}

/** Go Solar Me: one main action (start a page), two smaller ways, then your pages. */
export function FundHub() {
  const user = useAuth((s) => s.user);
  const mine = useMine();
  const pools = mine.data?.pools ?? [];
  return (
    <>
      {pools.length ? (
        <>
          <Section title="Your pages" />
          {pools.map((p) => <PoolCard key={p.id} p={p} />)}
        </>
      ) : null}
      <StartCard
        scene="group"
        meta="Takes about 2 minutes"
        title="Go solar together."
        sub="Pick a kit and share one link. Family, friends or anyone can chip in from ₦1,000. At 100% we deliver and install."
        cta="Start a page"
        onPress={() => router.push("/fund/new")}
      >
        <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap", marginTop: 4 }}>
          {[["shield-checkmark-outline", "Money goes to the kit, never cash"], ["refresh-outline", "Refunds if it isn't funded"]].map(([i, t]) => (
            <View key={t} style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <Ionicons name={i as keyof typeof Ionicons.glyphMap} size={14} color={colors.mintDeep} />
              <Small>{t}</Small>
            </View>
          ))}
        </View>
      </StartCard>
      <View style={{ flexDirection: "row", gap: 12 }}>
        <Tile tone="lemon" icon="git-branch-outline" title="Split with squad" sub="2–10 equal shares" onPress={() => router.push({ pathname: "/fund/new", params: { kind: "squad" } })} />
        <Tile icon="calendar-outline" title="Pay small small" sub="Part now, rest monthly" onPress={() => router.push("/pay-small-small")} />
      </View>
      {!user ? (
        <View style={{ backgroundColor: colors.paper, borderRadius: 24, padding: 18, gap: 10 }}>
          <P>Sign in to start a page and follow how it's going.</P>
          <Button title="Sign in" kind="ghost" small onPress={() => router.push("/sign-in")} />
        </View>
      ) : mine.isPending ? <Loading /> : mine.error ? <ErrorBox message={`Couldn't load your pages. ${mine.error.message}`} onRetry={() => mine.refetch()} /> : null}
      <LinkRow label="Open a page someone sent you" />
    </>
  );
}
