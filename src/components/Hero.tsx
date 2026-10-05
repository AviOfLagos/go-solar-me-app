import { useState, type ReactNode } from "react";
import { Pressable, Text, View } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Button, H1, Money, P, Small } from "@/ui";
import { Scene, type SceneKind } from "@/components/Scene";
import { OpenLink } from "@/components/OpenLink";
import { useAuth } from "@/stores/auth";
import type { Order } from "@/lib/types";
import { colors, fonts } from "@/theme";

type IconName = keyof typeof Ionicons.glyphMap;

const greeting = () => {
  const h = Number(new Intl.DateTimeFormat("en-GB", { hour: "numeric", hour12: false, timeZone: "Africa/Lagos" }).format(new Date()));
  return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
};

/** "Good morning, Ada" with an avatar that opens Me. */
export function Greeting({ sub }: { sub?: string }) {
  const user = useAuth((s) => s.user);
  const first = user?.name.split(" ")[0];
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
      <View style={{ flex: 1 }}>
        <Small style={{ fontFamily: fonts.sansSemiBold }}>{greeting()}{first ? `, ${first}` : ""}</Small>
        {sub ? <Text style={{ fontFamily: fonts.light, fontSize: 26, color: colors.ink, letterSpacing: -0.4 }}>{sub}</Text> : null}
      </View>
      <Pressable onPress={() => router.push("/(tabs)/me")} accessibilityRole="button" accessibilityLabel="Me"
        style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: colors.paper, alignItems: "center", justifyContent: "center" }}>
        {first ? <Text style={{ fontFamily: fonts.sansBold, color: colors.ink }}>{first[0].toUpperCase()}</Text> : <Ionicons name="person-outline" size={20} color={colors.ink} />}
      </Pressable>
    </View>
  );
}

/** The one main thing to do on a home screen: a picture, a line, how long it takes, one button. */
export function StartCard({ scene, title, sub, meta, cta, onPress, children }: {
  scene: SceneKind; title: string; sub: string; meta?: string; cta: string; onPress: () => void; children?: ReactNode;
}) {
  return (
    <View style={{ backgroundColor: colors.paper, borderRadius: 30, padding: 10, gap: 4 }}>
      <Scene kind={scene} height={190} />
      <View style={{ padding: 12, gap: 8 }}>
        {meta ? (
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <Ionicons name="time-outline" size={14} color={colors.mintDeep} />
            <Small style={{ fontFamily: fonts.sansSemiBold, color: colors.mintDeep }}>{meta}</Small>
          </View>
        ) : null}
        <H1 style={{ fontSize: 28, lineHeight: 33 }}>{title}</H1>
        <P>{sub}</P>
        <View style={{ height: 4 }} />
        <Button title={cta} icon="arrow-forward" onPress={onPress} />
        {children}
      </View>
    </View>
  );
}

/** A small secondary action. Two at most under the start card. */
export function Tile({ icon, title, sub, onPress, tone = "paper" }: { icon: IconName; title: string; sub?: string; onPress: () => void; tone?: "paper" | "sun" | "lemon" }) {
  const bg = tone === "sun" ? colors.mint : tone === "lemon" ? colors.lemon : colors.paper;
  return (
    <Pressable accessibilityRole="button" onPress={onPress}
      style={({ pressed }) => ({ flex: 1, minHeight: 124, padding: 16, borderRadius: 24, gap: 10, justifyContent: "space-between", backgroundColor: bg, transform: [{ scale: pressed ? 0.98 : 1 }] })}>
      <View style={{ width: 40, height: 40, borderRadius: 14, alignItems: "center", justifyContent: "center", backgroundColor: tone === "paper" ? colors.haze : "rgba(255,255,255,0.6)" }}>
        <Ionicons name={icon} size={20} color={colors.ink} />
      </View>
      <View style={{ gap: 2 }}>
        <Text style={{ fontFamily: fonts.sansBold, fontSize: 15, color: colors.ink }}>{title}</Text>
        {sub ? <Small style={{ color: colors.ink2 }}>{sub}</Small> : null}
      </View>
    </Pressable>
  );
}

/** "Continue where you left off": the kit in the cart. */
export function ContinueCard({ title, sub, total, onPress }: { title: string; sub: string; total: number; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button"
      style={({ pressed }) => ({ flexDirection: "row", alignItems: "center", gap: 14, padding: 16, borderRadius: 24, backgroundColor: colors.mint, opacity: pressed ? 0.9 : 1 })}>
      <View style={{ width: 44, height: 44, borderRadius: 16, backgroundColor: "rgba(255,255,255,0.6)", alignItems: "center", justifyContent: "center" }}>
        <Ionicons name="bag-handle-outline" size={22} color={colors.ink} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontFamily: fonts.sansBold, fontSize: 15, color: colors.ink }}>{title}</Text>
        <Small style={{ color: colors.ink2 }}>{sub}</Small>
      </View>
      <Money n={total} style={{ fontSize: 15 }} />
      <Ionicons name="chevron-forward" size={18} color={colors.ink} />
    </Pressable>
  );
}

const STAGES = [
  { key: "pending", label: "Paid" },
  { key: "confirmed", label: "Confirmed" },
  { key: "out_for_delivery", label: "On the way" },
  { key: "delivered", label: "Delivered" },
  { key: "installed", label: "Lights on" },
] as const;

/** Where an order is: five dots from paid to lights on. */
export function OrderProgress({ order, onPress }: { order: Order; onPress?: () => void }) {
  const stages = order.installer ? STAGES : STAGES.slice(0, 4);
  const at = Math.max(0, stages.findIndex((s) => s.key === order.status));
  const label = stages[at]?.label ?? order.statusLabel;
  return (
    <Pressable onPress={onPress} disabled={!onPress} style={{ backgroundColor: colors.paper, borderRadius: 24, padding: 18, gap: 12 }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <View>
          <Small style={{ fontFamily: fonts.sansSemiBold }}>Order {order.id}{order.recipient ? ` · for ${order.recipient.name}` : ""}</Small>
          <Text style={{ fontFamily: fonts.light, fontSize: 24, color: colors.ink }}>{label}</Text>
        </View>
        <Ionicons name={at >= stages.length - 1 ? "sunny" : "car-outline"} size={26} color={colors.mintDeep} />
      </View>
      <View style={{ flexDirection: "row", gap: 6 }}>
        {stages.map((s, i) => <View key={s.key} style={{ flex: 1, height: 6, borderRadius: 3, backgroundColor: i <= at ? colors.mintDeep : colors.line }} />)}
      </View>
      <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
        {stages.map((s, i) => <Small key={s.key} style={{ fontSize: 11, color: i <= at ? colors.ink : colors.mute }}>{s.label}</Small>)}
      </View>
    </Pressable>
  );
}

/** "Got a link or code?" that opens into the paste box only when tapped. */
export function LinkRow({ label = "Got a link or code from someone?" }: { label?: string }) {
  const [open, setOpen] = useState(false);
  if (open) return <View style={{ backgroundColor: colors.paper, borderRadius: 24, padding: 16 }}><OpenLink label="Paste the link or code" /></View>;
  return (
    <Pressable onPress={() => setOpen(true)} accessibilityRole="button" style={{ flexDirection: "row", alignItems: "center", gap: 10, padding: 16, borderRadius: 24, borderWidth: 1, borderStyle: "dashed", borderColor: colors.line }}>
      <Ionicons name="link-outline" size={20} color={colors.ink2} />
      <Text style={{ flex: 1, fontFamily: fonts.sansSemiBold, color: colors.ink2 }}>{label}</Text>
      <Ionicons name="chevron-forward" size={16} color={colors.mute} />
    </Pressable>
  );
}
