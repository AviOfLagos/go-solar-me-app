import { useMemo, useState } from "react";
import { Linking, Pressable, View } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Card, Chip, ErrorBox, H2, Label, Notice, P, Row, Small, Stepper } from "@/ui";
import { TierCard } from "@/components/TierCard";
import { APPLIANCES, emptyLoad, fuelPerMonth, recommend, sizeLoad, type Load } from "@/lib/catalog";
import { waLink } from "@/lib/config";
import { naira } from "@/shared/format";
import type { Catalog } from "@/lib/types";
import { colors, fonts } from "@/theme";

export type Who = "me" | "someone" | "us";
const WHO: { key: Who; label: string }[] = [
  { key: "me", label: "Me" },
  { key: "someone", label: "Someone else" },
  { key: "us", label: "Us (house, shop, office)" },
];
const PRESETS: Record<string, { load: Partial<Load>; hours: number }> = {
  students: { load: { bulb: 2, fan: 1, laptop: 1 }, hours: 6 },
  "remote-workers": { load: { bulb: 2, fan: 1, laptop: 1, router: 1 }, hours: 8 },
  renters: { load: { bulb: 4, fan: 2, tv: 1, fridge: 1, laptop: 1 }, hours: 8 },
  shops: { load: { bulb: 3, fan: 1, clipper: 2, tv: 1, freezer: 1 }, hours: 10 },
  families: { load: { bulb: 8, fan: 3, tv: 1, fridge: 1, freezer: 1, pump: 1, laptop: 1 }, hours: 10 },
  duplex: { load: { bulb: 14, fan: 4, tv: 2, fridge: 1, freezer: 1, pump: 1, ac: 2, router: 1, laptop: 2 }, hours: 12 },
  offices: { load: { bulb: 10, fan: 4, laptop: 8, router: 1, ac: 1 }, hours: 9 },
};
const HOURS = [4, 6, 8, 10, 12, 16];

/** The sizing calculator: who it's for, what it powers, hours without NEPA, then the kits that fit. */
export function KitFinder({ catalog: c, initialWho = "me", askWho = true, title = "Find your kit" }: { catalog: Catalog; initialWho?: Who; askWho?: boolean; title?: string }) {
  const [who, setWho] = useState<Who>(initialWho);
  const [segment, setSegment] = useState("remote-workers");
  const [load, setLoad] = useState<Load>({ ...emptyLoad, ...PRESETS["remote-workers"].load });
  const [hours, setHours] = useState(8);
  const [custom, setCustom] = useState(false);

  const size = useMemo(() => sizeLoad(load, hours), [load, hours]);
  const picks = useMemo(() => (size.running > 0 ? recommend(c, size.kw, size.kwh, segment) : []), [c, size, segment]);

  const pickSegment = (slug: string) => {
    setSegment(slug);
    setLoad({ ...emptyLoad, ...(PRESETS[slug]?.load ?? {}) });
    setHours(PRESETS[slug]?.hours ?? 8);
  };
  let n = 0;
  const num = () => `${++n}. `;

  return (
    <>
      <H2>{title}</H2>
      <Card>
        {askWho ? (
          <>
            <Label>{num()}Who is it for?</Label>
            <Row style={{ flexWrap: "wrap" }}>
              {WHO.map((w) => <Chip key={w.key} label={w.label} on={who === w.key} onPress={() => setWho(w.key)} />)}
            </Row>
            {who === "someone" ? <Small>You'll add their name and number at checkout. You can pay from anywhere.</Small> : null}
          </>
        ) : null}

        <Label style={{ marginTop: askWho ? 8 : 0 }}>{num()}What should it power?</Label>
        <Row style={{ flexWrap: "wrap" }}>
          {c.segments.map((sg) => <Chip key={sg.slug} small label={sg.short} on={!custom && segment === sg.slug} onPress={() => { setCustom(false); pickSegment(sg.slug); }} />)}
          <Chip small label="Choose appliances" on={custom} onPress={() => setCustom(true)} />
        </Row>
        {custom ? (
          <View style={{ gap: 6 }}>
            {APPLIANCES.map((a) => (
              <Row key={a.key} style={{ justifyContent: "space-between" }}>
                <P>{a.label}</P>
                <Stepper value={load[a.key]} max={30} onChange={(v) => setLoad((l) => ({ ...l, [a.key]: Math.max(0, Math.min(30, v)) }))} />
              </Row>
            ))}
          </View>
        ) : null}
        <Small>Hours without NEPA each day</Small>
        <Row style={{ flexWrap: "wrap" }}>
          {HOURS.map((h) => <Chip key={h} small label={`${h}h`} on={hours === h} onPress={() => setHours(h)} />)}
        </Row>
        {size.running > 0 ? (
          <Notice>You spend about {naira(fuelPerMonth(size.kw, hours))} a month on fuel for this. Solar pays for itself.</Notice>
        ) : null}
      </Card>

      <H2>{num()}Pick a kit</H2>
      {size.running === 0 ? <P>Add at least one appliance.</P> : picks.length === 0 ? (
        <ErrorBox message="That's more than our kits cover. Chat with us and we'll size a custom system." />
      ) : picks.map((t) => <TierCard key={t.id} t={t} who={who} />)}

      <Pressable onPress={() => Linking.openURL(waLink("Hi, I need help choosing a solar kit"))} style={{ flexDirection: "row", alignItems: "center", gap: 10, padding: 14, backgroundColor: colors.paper, borderRadius: 14, borderWidth: 1, borderColor: colors.line }}>
        <Ionicons name="logo-whatsapp" size={22} color={colors.leaf} />
        <View style={{ flex: 1 }}>
          <P style={{ fontFamily: fonts.sansSemiBold, color: colors.ink }}>Not sure? Chat on WhatsApp</P>
          <Small>A real person replies with a kit and a full price.</Small>
        </View>
      </Pressable>

      <H2>Packages by need</H2>
      {c.segments.map((sg) => (
        <Pressable key={sg.slug} onPress={() => router.push({ pathname: "/packages/[slug]", params: { slug: sg.slug } })} style={{ padding: 14, backgroundColor: colors.paper, borderRadius: 14, borderWidth: 1, borderColor: colors.line, gap: 4 }}>
          <P style={{ fontFamily: fonts.sansSemiBold, color: colors.ink }}>{sg.name}</P>
          <Small numberOfLines={2}>{sg.who}</Small>
          <Small>From {naira(Math.min(...sg.tiers.map((t) => t.price)))}</Small>
        </Pressable>
      ))}
    </>
  );
}
