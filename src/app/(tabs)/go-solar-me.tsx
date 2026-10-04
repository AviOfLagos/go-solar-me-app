import { useState } from "react";
import { Pressable, RefreshControl, View } from "react-native";
import { router } from "expo-router";
import { Button, Card, Field, H1, H2, Loading, P, Progress, Row, Screen, Small } from "@/ui";
import { useMine, POOL_STATUS } from "@/lib/pools";
import { useAuth } from "@/stores/auth";
import { naira } from "@/shared/format";
import { colors, fonts } from "@/theme";

export default function GoSolarMeTab() {
  const user = useAuth((s) => s.user);
  const mine = useMine();
  const [link, setLink] = useState("");
  const [linkErr, setLinkErr] = useState("");

  const open = () => {
    const m = link.trim().match(/(?:fund\/)?([a-z0-9]{6,16})\/?$/i);
    if (!m) return setLinkErr("Paste the page link, e.g. solar.nexprove.com/fund/ab12cd34");
    setLinkErr("");
    router.push({ pathname: "/fund/[id]", params: { id: m[1].toLowerCase() } });
  };

  return (
    <Screen refreshControl={user ? <RefreshControl refreshing={mine.isRefetching} onRefresh={() => mine.refetch()} /> : undefined}>
      <H1>Go Solar Me</H1>
      <P>Let family, friends or the public fund a solar kit. Every naira goes to the kit, never cash. The order places itself at 100%.</P>
      <Button title="Start a Go Solar Me page" onPress={() => router.push("/fund/new")} />
      <Button title="Split a kit with my squad" kind="ghost" onPress={() => router.push({ pathname: "/fund/new", params: { kind: "squad" } })} />

      <Card>
        <P style={{ fontFamily: fonts.sansSemiBold, color: colors.ink }}>How it works</P>
        <Small>1. Pick the kit. 2. Share the page on WhatsApp. 3. Anyone chips in from ₦1,000, no account needed. 4. At 100% we deliver and install.</Small>
        <Small>Not funded by the deadline? Extend once, switch to a smaller kit, or cancel and everyone is refunded.</Small>
      </Card>

      <H2>My pages</H2>
      {!user ? <P>Sign in to see the pages you started.</P> : mine.isPending ? <Loading /> : !mine.data?.pools.length ? <P>None yet.</P> : mine.data.pools.map((p) => (
        <Pressable key={p.id} onPress={() => router.push({ pathname: "/fund/[id]", params: { id: p.id } })} style={{ padding: 14, gap: 6, borderRadius: 14, backgroundColor: colors.paper, borderWidth: 1, borderColor: colors.line }}>
          <P style={{ fontFamily: fonts.sansSemiBold, color: colors.ink }}>{p.title}</P>
          <Progress value={p.raised / p.goal} />
          <Small>{naira(p.raised)} of {naira(p.goal)} · {POOL_STATUS[p.status] ?? p.status}</Small>
        </Pressable>
      ))}

      <H2>Open a page</H2>
      <Row style={{ alignItems: "flex-end" }}>
        <View style={{ flex: 1 }}><Field label="Page link" value={link} onChangeText={(t) => { setLink(t); setLinkErr(""); }} autoCapitalize="none" autoCorrect={false} error={linkErr} placeholder="Paste a link someone sent you" /></View>
        <Button small kind="ink" title="Open" onPress={open} />
      </Row>
    </Screen>
  );
}
