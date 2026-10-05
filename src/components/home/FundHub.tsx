import { Pressable, View } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Button, Card, H2, Loading, P, Progress, Small } from "@/ui";
import { Hero, Tile } from "@/components/Hero";
import { OpenLink } from "@/components/OpenLink";
import { useMine, POOL_STATUS } from "@/lib/pools";
import { useAuth } from "@/stores/auth";
import { naira } from "@/shared/format";
import { colors, fonts } from "@/theme";

const STEPS: [keyof typeof Ionicons.glyphMap, string][] = [
  ["cube-outline", "Pick the kit"],
  ["logo-whatsapp", "Share the page"],
  ["cash-outline", "Anyone chips in from ₦1,000"],
  ["checkmark-done-outline", "At 100% we deliver and install"],
];

/** Go Solar Me: start a page or a squad split, see your pages, open someone's link. */
export function FundHub({ hero = true }: { hero?: boolean }) {
  const user = useAuth((s) => s.user);
  const mine = useMine();
  return (
    <>
      {hero ? (
        <Hero kicker="Go Solar Me" icon="people" title="Go solar together." sub="Family, friends or the public fund the kit. Every naira goes to the kit, never cash." />
      ) : null}
      <View style={{ flexDirection: "row", gap: 12 }}>
        <Tile tone="sun" icon="megaphone-outline" title="Start a page" sub="Anyone can chip in" onPress={() => router.push("/fund/new")} />
        <Tile icon="git-branch-outline" title="Split with squad" sub="2–10 equal shares" onPress={() => router.push({ pathname: "/fund/new", params: { kind: "squad" } })} />
      </View>
      <View style={{ flexDirection: "row", gap: 12 }}>
        <Tile icon="calendar-outline" title="Pay small small" sub="Spread it over months" onPress={() => router.push("/pay-small-small")} />
        <Tile icon="ticket-outline" title="Gift card" sub="Give solar credit" onPress={() => router.push("/gift-cards")} />
      </View>

      <Card>
        <P style={{ fontFamily: fonts.sansSemiBold, color: colors.ink }}>How it works</P>
        {STEPS.map(([icon, text], i) => (
          <View key={text} style={{ flexDirection: "row", gap: 10, alignItems: "center" }}>
            <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: colors.sunTint, alignItems: "center", justifyContent: "center" }}>
              <Ionicons name={icon} size={15} color={colors.ink} />
            </View>
            <P style={{ flex: 1 }}>{i + 1}. {text}</P>
          </View>
        ))}
        <Small>Not funded by the deadline? Extend once, switch to a smaller kit, or cancel and everyone is refunded.</Small>
      </Card>

      <H2>My pages</H2>
      {!user ? (
        <Card>
          <P>Sign in to start a page and see how it's going.</P>
          <Button title="Sign in" kind="ink" small onPress={() => router.push("/sign-in")} />
        </Card>
      ) : mine.isPending ? <Loading /> : !mine.data?.pools.length ? <P>None yet. Start one above.</P> : mine.data.pools.map((p) => (
        <Pressable key={p.id} onPress={() => router.push({ pathname: "/fund/[id]", params: { id: p.id } })} style={{ padding: 14, gap: 6, borderRadius: 14, backgroundColor: colors.paper, borderWidth: 1, borderColor: colors.line }}>
          <P style={{ fontFamily: fonts.sansSemiBold, color: colors.ink }}>{p.title}</P>
          <Progress value={p.raised / p.goal} />
          <Small>{naira(p.raised)} of {naira(p.goal)} · {POOL_STATUS[p.status] ?? p.status}</Small>
        </Pressable>
      ))}

      <Card><OpenLink label="Open a page someone sent you" placeholder="solar.nexprove.com/fund/… or a code" /></Card>
    </>
  );
}
