import { useEffect, useState } from "react";
import { Animated, Easing, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Small } from "@/ui";
import { colors, fonts } from "@/theme";

/** A short, calm "done" moment: a check that pops in with a few rays. Only for real wins. */
export function Celebrate({ icon = "checkmark", tone = "mint" }: { icon?: keyof typeof Ionicons.glyphMap; tone?: "mint" | "lemon" }) {
  const [pop] = useState(() => new Animated.Value(0));
  const [rays] = useState(() => new Animated.Value(0));
  useEffect(() => {
    Animated.sequence([
      Animated.spring(pop, { toValue: 1, friction: 5, tension: 120, useNativeDriver: true }),
      Animated.timing(rays, { toValue: 1, duration: 600, easing: Easing.out(Easing.quad), useNativeDriver: true }),
    ]).start();
  }, [pop, rays]);
  const bg = tone === "mint" ? colors.mint : colors.lemon;
  return (
    <View style={{ alignItems: "center", justifyContent: "center", height: 150 }} accessibilityElementsHidden>
      {Array.from({ length: 8 }, (_, i) => (
        <Animated.View key={i} style={{
          position: "absolute", width: 6, height: 16, borderRadius: 3, backgroundColor: bg,
          opacity: rays.interpolate({ inputRange: [0, 0.3, 1], outputRange: [0, 1, 0.9] }),
          transform: [{ rotate: `${i * 45}deg` }, { translateY: rays.interpolate({ inputRange: [0, 1], outputRange: [-40, -66] }) }],
        }} />
      ))}
      <Animated.View style={{ width: 96, height: 96, borderRadius: 48, backgroundColor: bg, alignItems: "center", justifyContent: "center", transform: [{ scale: pop }] }}>
        <Ionicons name={icon} size={48} color={colors.ink} />
      </Animated.View>
    </View>
  );
}

/** "What happens next": the order's road from paid to lights on. */
export function NextSteps({ installer, who }: { installer?: boolean; who?: string }) {
  const steps = [
    { t: "Paid", s: "Done. Your receipt is on its way.", done: true },
    { t: "We call to confirm", s: `Usually within a few hours${who ? `, on ${who}'s number` : ""}.` },
    { t: "Delivery in Lagos", s: "Free. We agree a day that works." },
    ...(installer ? [{ t: "Installation", s: "Our team sets it up and shows how it works." }] : []),
    { t: "Lights on", s: "No more fuel runs." },
  ];
  return (
    <View style={{ backgroundColor: colors.paper, borderRadius: 24, padding: 18, gap: 0 }}>
      <Small style={{ fontFamily: fonts.sansSemiBold, color: colors.ink2, marginBottom: 10 }}>What happens next</Small>
      {steps.map((x, i) => (
        <View key={x.t} style={{ flexDirection: "row", gap: 12 }}>
          <View style={{ alignItems: "center" }}>
            <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: x.done ? colors.mintDeep : colors.haze, alignItems: "center", justifyContent: "center" }}>
              {x.done ? <Ionicons name="checkmark" size={14} color={colors.paper} /> : <Text style={{ fontFamily: fonts.sansBold, fontSize: 11, color: colors.mute }}>{i + 1}</Text>}
            </View>
            {i < steps.length - 1 ? <View style={{ width: 2, flex: 1, minHeight: 18, backgroundColor: colors.line }} /> : null}
          </View>
          <View style={{ flex: 1, paddingBottom: 14 }}>
            <Text style={{ fontFamily: fonts.sansBold, color: colors.ink }}>{x.t}</Text>
            <Small>{x.s}</Small>
          </View>
        </View>
      ))}
    </View>
  );
}
