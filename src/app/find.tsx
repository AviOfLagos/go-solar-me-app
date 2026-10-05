import { useMemo, useState } from "react";
import { Linking, Pressable, ScrollView, Text, View } from "react-native";
import { Stack, router, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Button, Card, ErrorBox, H1, H2, Loading, Money, P, Row, Small, StepBar, Stepper, Tag } from "@/ui";
import { APPLIANCES, fuelPerMonth, installedRange, recommend, sizeLoad, useCatalog } from "@/lib/catalog";
import { asString, encodeItems } from "@/lib/kit";
import { waLink } from "@/lib/config";
import { naira } from "@/shared/format";
import { useFinder } from "@/stores/finder";
import { colors, fonts } from "@/theme";

type IconName = keyof typeof Ionicons.glyphMap;
const SEGMENT_ICONS: Record<string, IconName> = {
  students: "school-outline", "remote-workers": "laptop-outline", renters: "bed-outline", shops: "storefront-outline",
  families: "people-outline", duplex: "business-outline", offices: "briefcase-outline",
};
const HOURS: { h: number; label: string }[] = [
  { h: 4, label: "A few hours" }, { h: 6, label: "Half the day" }, { h: 8, label: "Most evenings" },
  { h: 10, label: "Most of the day" }, { h: 12, label: "Day and night" }, { h: 16, label: "Almost always" },
];

/**
 * Find your kit, one question at a time:
 * 1. what should it run (a preset, or appliances one by one)
 * 2. hours without light
 * 3. the match, with what it saves
 */
export default function Find() {
  const q = useLocalSearchParams<{ who?: string; pro?: string }>();
  const who = asString(q.who) || "me";
  const cat = useCatalog();
  const f = useFinder();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [picking, setPicking] = useState(false);
  const size = useMemo(() => sizeLoad(f.load, f.hours), [f.load, f.hours]);
  const picks = useMemo(() => (cat.data && size.running > 0 ? recommend(cat.data, size.kw, size.kwh, f.segment ?? undefined) : []), [cat.data, size, f.segment]);
  const fuel = fuelPerMonth(size.kw, f.hours);

  const back = () => {
    if (picking) return setPicking(false);
    if (step > 1) return setStep((s) => (s - 1) as 1 | 2);
    router.back();
  };

  let body: React.ReactNode;
  let footer: React.ReactNode = null;
  if (cat.isPending) body = <Loading label="Loading kits…" />;
  else if (cat.error) body = <ErrorBox message={cat.error.message} onRetry={() => cat.refetch()} />;
  else if (step === 1 && !picking) {
    body = (
      <>
        <View style={{ gap: 8 }}>
          <H1>What should it keep running?</H1>
          <P>Pick the closest match.</P>
        </View>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
          {[...cat.data.segments.map((sg) => ({ key: sg.slug, icon: SEGMENT_ICONS[sg.slug] ?? ("flash-outline" as IconName), title: sg.short })),
            { key: "custom", icon: "options-outline" as IconName, title: "I'll pick appliances" }].map((o) => {
            const on = f.segment === o.key;
            return (
              <Pressable key={o.key} accessibilityRole="radio" accessibilityState={{ checked: on }}
                onPress={() => { f.pick(o.key); if (o.key === "custom") setPicking(true); else setStep(2); }}
                style={({ pressed }) => ({ width: "48%", flexGrow: 1, minHeight: 112, padding: 16, borderRadius: 24, gap: 12, justifyContent: "space-between",
                  backgroundColor: on ? colors.ink : colors.paper, transform: [{ scale: pressed ? 0.97 : 1 }] })}>
                <View style={{ width: 42, height: 42, borderRadius: 14, alignItems: "center", justifyContent: "center", backgroundColor: on ? colors.mint : colors.haze }}>
                  <Ionicons name={o.icon} size={21} color={colors.ink} />
                </View>
                <Text style={{ fontFamily: fonts.sansBold, fontSize: 15, color: on ? colors.paper : colors.ink }}>{o.title}</Text>
              </Pressable>
            );
          })}
        </View>
        {f.segment && f.segment !== "custom" ? (
          <Small>{cat.data.segments.find((s) => s.slug === f.segment)?.who}</Small>
        ) : null}
      </>
    );
  } else if (step === 1 && picking) {
    body = (
      <>
        <View style={{ gap: 8 }}>
          <H1>What will you run?</H1>
          <P>Count what should work when there's no light.</P>
        </View>
        <Card style={{ gap: 4 }}>
          {APPLIANCES.map((a) => (
            <Row key={a.key} style={{ justifyContent: "space-between", minHeight: 52 }}>
              <P style={{ color: colors.ink, fontFamily: fonts.sansMedium }}>{a.label}</P>
              <Stepper value={f.load[a.key]} max={30} onChange={(v) => f.setLoad({ ...f.load, [a.key]: Math.max(0, Math.min(30, v)) })} />
            </Row>
          ))}
        </Card>
      </>
    );
    footer = <Button title="Next: hours without light" icon="arrow-forward" disabled={size.running === 0} onPress={() => { setPicking(false); setStep(2); }} />;
  } else if (step === 2) {
    body = (
      <>
        <View style={{ gap: 8 }}>
          <H1>How long is light usually off?</H1>
          <P>In a normal day. We'll size the batteries for it.</P>
        </View>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
          {HOURS.map(({ h, label }) => {
            const on = f.hours === h;
            return (
              <Pressable key={h} onPress={() => f.setHours(h)} accessibilityRole="radio" accessibilityState={{ checked: on }}
                style={{ width: "31%", flexGrow: 1, paddingVertical: 18, paddingHorizontal: 10, borderRadius: 22, alignItems: "center", gap: 2,
                  backgroundColor: on ? colors.ink : colors.paper }}>
                <Text style={{ fontFamily: fonts.light, fontSize: 30, color: on ? colors.mint : colors.ink }}>{h}h</Text>
                <Text style={{ fontFamily: fonts.sansMedium, fontSize: 12, color: on ? colors.paper : colors.mute, textAlign: "center" }}>{label}</Text>
              </Pressable>
            );
          })}
        </View>
        {size.running > 0 ? (
          <View style={{ backgroundColor: colors.lemonTint, borderRadius: 22, padding: 16, gap: 4 }}>
            <Small style={{ fontFamily: fonts.sansSemiBold, color: colors.ink2 }}>On a generator, that's about</Small>
            <Text style={{ fontFamily: fonts.light, fontSize: 30, color: colors.ink }}>{naira(fuel)}<Text style={{ fontSize: 16 }}> a month</Text></Text>
            <Small>in fuel alone. Solar pays that back.</Small>
          </View>
        ) : null}
      </>
    );
    footer = <Button title="See my kit" icon="sparkles-outline" onPress={() => setStep(3)} />;
  } else {
    const [best, ...others] = picks;
    if (!best) {
      body = (
        <>
          <H1>That's a big setup.</H1>
          <P>It's more than our ready kits cover. Chat with us and we'll size a custom system with a full price.</P>
          <Button title="Chat on WhatsApp" onPress={() => Linking.openURL(waLink("Hi, I need a custom solar system"))} />
        </>
      );
    } else {
      const range = installedRange(best);
      const choose = (t: typeof best) => router.push({ pathname: "/kit", params: { items: encodeItems(t.items), name: t.name, who } });
      body = (
        <>
          <View style={{ gap: 8 }}>
            <Tag label="Your match" />
            <H1>{best.name}</H1>
            <P>{best.tagline}</P>
          </View>
          <View style={{ backgroundColor: colors.night, borderRadius: 28, padding: 20, gap: 14 }}>
            <View>
              <Small style={{ color: "#AEB8B1" }}>Kit price</Small>
              <Text style={{ fontFamily: fonts.light, fontSize: 40, color: colors.paper, letterSpacing: -1 }}>{naira(best.price)}</Text>
              <Small style={{ color: "#AEB8B1" }}>{range ? `About ${naira(range[0])} – ${naira(range[1])} installed` : "No installation needed"} · free Lagos delivery</Small>
            </View>
            <View style={{ flexDirection: "row", gap: 10 }}>
              <View style={{ flex: 1, backgroundColor: colors.nightSoft, borderRadius: 18, padding: 12 }}>
                <Text style={{ fontFamily: fonts.light, fontSize: 22, color: colors.mint }}>{best.kw} kW</Text>
                <Small style={{ color: "#AEB8B1" }}>power at once</Small>
              </View>
              <View style={{ flex: 1, backgroundColor: colors.nightSoft, borderRadius: 18, padding: 12 }}>
                <Text style={{ fontFamily: fonts.light, fontSize: 22, color: colors.mint }}>{best.kwh} kWh</Text>
                <Small style={{ color: "#AEB8B1" }}>stored for the night</Small>
              </View>
            </View>
            <View style={{ backgroundColor: colors.mint, borderRadius: 18, padding: 12, flexDirection: "row", alignItems: "center", gap: 10 }}>
              <Ionicons name="trending-down" size={20} color={colors.ink} />
              <Text style={{ flex: 1, fontFamily: fonts.sansSemiBold, color: colors.ink }}>Saves about {naira(fuel)} a month on fuel</Text>
            </View>
          </View>
          <Card>
            <Small style={{ fontFamily: fonts.sansSemiBold, color: colors.ink2 }}>Keeps these running</Small>
            {best.powers.map((p) => (
              <Row key={p}><Ionicons name="checkmark-circle" size={18} color={colors.mintDeep} /><P style={{ color: colors.ink }}>{p}</P></Row>
            ))}
          </Card>
          {others.length ? (
            <>
              <H2 style={{ fontSize: 18 }}>Other sizes</H2>
              {others.map((t) => (
                <Pressable key={t.id} onPress={() => choose(t)} style={({ pressed }) => ({ flexDirection: "row", alignItems: "center", gap: 12, padding: 16, borderRadius: 22, backgroundColor: colors.paper, opacity: pressed ? 0.8 : 1 })}>
                  <View style={{ flex: 1 }}>
                    <P style={{ fontFamily: fonts.sansBold, color: colors.ink }}>{t.name}</P>
                    <Small>{t.kw} kW · {t.kwh} kWh</Small>
                  </View>
                  <Money n={t.price} style={{ fontSize: 15 }} />
                  <Ionicons name="chevron-forward" size={18} color={colors.mute} />
                </Pressable>
              ))}
            </>
          ) : null}
          <Pressable onPress={() => setStep(1)} hitSlop={8}><Small style={{ textAlign: "center", textDecorationLine: "underline" }}>Start over</Small></Pressable>
        </>
      );
      footer = <Button title="Choose this kit" icon="arrow-forward" onPress={() => choose(best)} />;
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.haze }} edges={["top", "bottom"]}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={{ paddingHorizontal: 20, paddingTop: 8 }}>
        <StepBar step={step} total={3} onBack={back} label={step === 3 ? "Done" : undefined} />
      </View>
      <ScrollView contentContainerStyle={{ padding: 20, gap: 18, paddingBottom: 32 }} showsVerticalScrollIndicator={false}>{body}</ScrollView>
      {footer ? <View style={{ paddingHorizontal: 20, paddingBottom: 12, paddingTop: 4 }}>{footer}</View> : null}
    </SafeAreaView>
  );
}
