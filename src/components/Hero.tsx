import type { ReactNode } from "react";
import { Pressable, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { H1, P, Small } from "@/ui";
import { colors, fonts } from "@/theme";

type IconName = keyof typeof Ionicons.glyphMap;

/** The dark banner at the top of each home screen. */
export function Hero({ kicker, title, sub, icon = "sunny", children }: { kicker?: string; title: string; sub?: string; icon?: IconName; children?: ReactNode }) {
  return (
    <View style={{ backgroundColor: colors.ink, borderRadius: 20, padding: 20, gap: 10, overflow: "hidden" }}>
      <View style={{ position: "absolute", right: -44, top: -44, opacity: 0.12 }} pointerEvents="none">
        <Ionicons name={icon} size={170} color={colors.sun} />
      </View>
      {kicker ? <Small style={{ color: colors.sun, fontFamily: fonts.sansBold, letterSpacing: 1 }}>{kicker.toUpperCase()}</Small> : null}
      <H1 style={{ color: colors.paper, maxWidth: "88%" }}>{title}</H1>
      {sub ? <P style={{ color: "#C9D3E0", maxWidth: "92%" }}>{sub}</P> : null}
      {children ? <View style={{ gap: 10, marginTop: 4 }}>{children}</View> : null}
    </View>
  );
}

/** A big tappable tile with an icon, for the main actions on a home screen. */
export function Tile({ icon, title, sub, onPress, tone = "paper" }: { icon: IconName; title: string; sub?: string; onPress: () => void; tone?: "paper" | "sun" }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress}
      style={({ pressed }) => ({
        flex: 1, minHeight: 116, padding: 14, borderRadius: 16, gap: 8, justifyContent: "space-between",
        backgroundColor: tone === "sun" ? colors.sun : colors.paper, borderWidth: tone === "sun" ? 0 : 1, borderColor: colors.line,
        opacity: pressed ? 0.85 : 1, transform: [{ scale: pressed ? 0.98 : 1 }],
      })}>
      <View style={{ width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center", backgroundColor: tone === "sun" ? colors.paper : colors.sunTint }}>
        <Ionicons name={icon} size={22} color={colors.ink} />
      </View>
      <View style={{ gap: 2 }}>
        <P style={{ fontFamily: fonts.sansBold, color: colors.ink }}>{title}</P>
        {sub ? <Small style={{ color: tone === "sun" ? colors.ink2 : colors.mute }}>{sub}</Small> : null}
      </View>
    </Pressable>
  );
}
