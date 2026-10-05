import { useEffect, useState } from "react";
import { Animated, Easing, StyleSheet, Text, View } from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { PHOTOS } from "@/components/Photo";
import { colors, fonts } from "@/theme";

/**
 * The photo splash shown for a moment on every cold start, after the native icon splash.
 * Fades the brand in, then fades itself out to reveal the app.
 */
export function AppSplash({ onDone }: { onDone: () => void }) {
  const [fade] = useState(() => new Animated.Value(1));
  const [rise] = useState(() => new Animated.Value(0));
  useEffect(() => {
    Animated.timing(rise, { toValue: 1, duration: 700, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
    const t = setTimeout(() => {
      Animated.timing(fade, { toValue: 0, duration: 450, easing: Easing.in(Easing.quad), useNativeDriver: true }).start(onDone);
    }, 1500);
    return () => clearTimeout(t);
  }, [fade, rise, onDone]);
  return (
    <Animated.View style={[StyleSheet.absoluteFill, { opacity: fade, backgroundColor: colors.night, zIndex: 10 }]} pointerEvents="none">
      <Image source={PHOTOS.hero} style={StyleSheet.absoluteFill} contentFit="cover" />
      <LinearGradient colors={["rgba(23,32,27,0.05)", "rgba(23,32,27,0.25)", "rgba(23,32,27,0.92)"]} locations={[0, 0.45, 1]} style={StyleSheet.absoluteFill} />
      <Animated.View style={{ position: "absolute", left: 28, right: 28, bottom: 72, gap: 14, opacity: rise, transform: [{ translateY: rise.interpolate({ inputRange: [0, 1], outputRange: [24, 0] }) }] }}>
        <View style={{ width: 56, height: 56, borderRadius: 18, backgroundColor: colors.mint, alignItems: "center", justifyContent: "center" }}>
          <Ionicons name="sunny" size={30} color={colors.ink} />
        </View>
        <Text style={{ fontFamily: fonts.light, fontSize: 44, lineHeight: 48, color: colors.paper, letterSpacing: -1 }}>Go Solar Me</Text>
        <Text style={{ fontFamily: fonts.sansMedium, fontSize: 15, color: "rgba(255,255,255,0.8)" }}>Steady light for Lagos homes · by Solar Builders NG</Text>
      </Animated.View>
    </Animated.View>
  );
}
