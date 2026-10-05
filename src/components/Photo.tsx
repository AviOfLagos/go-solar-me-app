import type { ReactNode } from "react";
import { Text, View, type StyleProp, type ViewStyle } from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { colors, fonts } from "@/theme";

// Photos: Unsplash (free to use under the Unsplash License). See assets/photos/CREDITS.md.
export const PHOTOS = {
  hero: require("../../assets/photos/hero-portrait.jpg"),
  home: require("../../assets/photos/home.jpg"),
  gift: require("../../assets/photos/gift.jpg"),
  group: require("../../assets/photos/group.jpg"),
  pro: require("../../assets/photos/pro.jpg"),
} as const;
export type PhotoKind = keyof typeof PHOTOS;

/** A small frosted chip floating on a photo, e.g. "☀ Sun power". */
export function PhotoChip({ icon = "sunny", label, sub, style }: { icon?: keyof typeof Ionicons.glyphMap; label: string; sub?: string; style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[{ position: "absolute", flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 8, paddingLeft: 8, paddingRight: 14, borderRadius: 16, backgroundColor: "rgba(255,255,255,0.86)" }, style]}>
      <View style={{ width: 28, height: 28, borderRadius: 9, backgroundColor: colors.mint, alignItems: "center", justifyContent: "center" }}>
        <Ionicons name={icon} size={15} color={colors.ink} />
      </View>
      <View>
        <Text style={{ fontFamily: fonts.sansBold, fontSize: 13, color: colors.ink }}>{label}</Text>
        {sub ? <Text style={{ fontFamily: fonts.sansMedium, fontSize: 11, color: colors.ink2 }}>{sub}</Text> : null}
      </View>
    </View>
  );
}

/** A rounded photo with optional floating chips on top. */
export function Photo({ kind, height = 200, radius = 24, children, style }: { kind: PhotoKind; height?: number; radius?: number; children?: ReactNode; style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[{ height, borderRadius: radius, overflow: "hidden", backgroundColor: colors.line }, style]}>
      <Image source={PHOTOS[kind]} style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} contentFit="cover" transition={200} accessibilityIgnoresInvertColors />
      {children}
    </View>
  );
}
