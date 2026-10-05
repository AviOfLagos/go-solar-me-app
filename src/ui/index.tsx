import { forwardRef, isValidElement, type ReactNode } from "react";
import {
  ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View,
  type PressableProps, type ScrollViewProps, type StyleProp, type TextInputProps, type TextProps, type TextStyle, type ViewStyle,
} from "react-native";
import { SafeAreaView, type Edge } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { colors, fonts, radii, space, MIN_TOUCH } from "@/theme";
import { naira } from "@/shared/format";

/* ---------- text ---------- */

type TProps = TextProps & { children?: ReactNode };
export const H1 = (p: TProps) => <Text {...p} style={[s.h1, p.style]} accessibilityRole="header" />;
export const H2 = (p: TProps) => <Text {...p} style={[s.h2, p.style]} accessibilityRole="header" />;
export const H3 = (p: TProps) => <Text {...p} style={[s.h3, p.style]} />;
export const P = (p: TProps) => <Text {...p} style={[s.p, p.style]} />;
export const Small = (p: TProps) => <Text {...p} style={[s.small, p.style]} />;
export const Label = (p: TProps) => <Text {...p} style={[s.label, p.style]} />;
export const Money = ({ n, style }: { n: number; style?: StyleProp<TextStyle> }) => <Text style={[s.money, style]}>{naira(n)}</Text>;

/* ---------- layout ---------- */

export function Screen({ children, scroll = true, edges = ["top"], contentStyle, refreshControl, footer }: {
  children: ReactNode; scroll?: boolean; edges?: Edge[]; contentStyle?: StyleProp<ViewStyle>;
  refreshControl?: ScrollViewProps["refreshControl"]; footer?: ReactNode;
}) {
  return (
    <SafeAreaView style={s.screen} edges={edges}>
      {scroll ? (
        <ScrollView contentContainerStyle={[s.content, contentStyle]} keyboardShouldPersistTaps="handled" refreshControl={refreshControl}>
          {children}
        </ScrollView>
      ) : (
        <View style={[s.content, { flex: 1 }, contentStyle]}>{children}</View>
      )}
      {footer ? <View style={s.footer}>{footer}</View> : null}
    </SafeAreaView>
  );
}

export const Card = ({ children, style, highlight }: { children: ReactNode; style?: StyleProp<ViewStyle>; highlight?: boolean }) => (
  <View style={[s.card, highlight && { borderColor: colors.ink, borderWidth: 2 }, style]}>{children}</View>
);
export const Row = ({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) => <View style={[s.row, style]}>{children}</View>;
export const Gap = ({ h = space.md }: { h?: number }) => <View style={{ height: h }} />;

/* ---------- controls ---------- */

type BtnProps = Omit<PressableProps, "children" | "style"> & {
  title: string; kind?: "sun" | "ink" | "ghost" | "danger"; busy?: boolean; style?: StyleProp<ViewStyle>; small?: boolean;
};
export function Button({ title, kind = "sun", busy, disabled, style, small, ...rest }: BtnProps) {
  const off = disabled || busy;
  const bg = kind === "sun" ? colors.sun : kind === "ink" ? colors.ink : kind === "danger" ? colors.flare : colors.paper;
  const fg = kind === "ink" || kind === "danger" ? colors.paper : colors.ink;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!off, busy: !!busy }}
      disabled={off}
      style={({ pressed }) => [
        s.btn, small && s.btnSmall, { backgroundColor: bg, opacity: off ? 0.55 : pressed ? 0.85 : 1 },
        kind === "ghost" && { borderWidth: 1, borderColor: colors.line }, style,
      ]}
      {...rest}
    >
      {busy ? <ActivityIndicator color={fg} /> : <Text style={[s.btnText, small && { fontSize: 14 }, { color: fg }]}>{title}</Text>}
    </Pressable>
  );
}

export const Field = forwardRef<TextInput, TextInputProps & { label: string; error?: string; hint?: string }>(
  function Field({ label, error, hint, style, ...rest }, ref) {
    return (
      <View style={{ gap: 6 }}>
        <Label>{label}</Label>
        <TextInput
          ref={ref}
          placeholderTextColor={colors.mute}
          style={[s.input, !!error && { borderColor: colors.flare }, style]}
          accessibilityLabel={label}
          {...rest}
        />
        {error ? <Small style={{ color: colors.flare }}>{error}</Small> : hint ? <Small>{hint}</Small> : null}
      </View>
    );
  },
);

export function Chip({ label, on, onPress, small }: { label: string; on?: boolean; onPress: () => void; small?: boolean }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: !!on }}
      onPress={onPress}
      hitSlop={6}
      style={[s.chip, small && { paddingVertical: 6, minHeight: 36 }, on && { backgroundColor: colors.ink, borderColor: colors.ink }]}
    >
      <Text style={[s.chipText, on && { color: colors.paper }]}>{label}</Text>
    </Pressable>
  );
}

export function Choice({ title, sub, on, onPress }: { title: string; sub?: string; on: boolean; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="radio" accessibilityState={{ checked: on }} onPress={onPress}
      style={[s.choice, on && { borderColor: colors.ink, backgroundColor: colors.sunTint }]}>
      <Text style={s.choiceTitle}>{title}</Text>
      {sub ? <Small>{sub}</Small> : null}
    </Pressable>
  );
}

export function Check({ label, on, onPress }: { label: string; on: boolean; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: on }} onPress={onPress} style={s.check} hitSlop={6}>
      <View style={[s.box, on && { backgroundColor: colors.ink, borderColor: colors.ink }]}>{on ? <Text style={{ color: colors.paper, fontSize: 14 }}>✓</Text> : null}</View>
      <Text style={[s.p, { flex: 1 }]}>{label}</Text>
    </Pressable>
  );
}

export function Stepper({ value, onChange, max = 50 }: { value: number; onChange: (n: number) => void; max?: number }) {
  return (
    <Row style={{ gap: 0, borderWidth: 1, borderColor: colors.line, borderRadius: radii.input }}>
      <Pressable accessibilityLabel="Less" onPress={() => onChange(value - 1)} style={s.step}><Text style={s.stepText}>−</Text></Pressable>
      <Text style={[s.p, { minWidth: 28, textAlign: "center", fontFamily: fonts.sansSemiBold }]}>{value}</Text>
      <Pressable accessibilityLabel="More" disabled={value >= max} onPress={() => onChange(value + 1)} style={s.step}><Text style={s.stepText}>+</Text></Pressable>
    </Row>
  );
}

/* ---------- states ---------- */

export const Loading = ({ label = "Loading…" }: { label?: string }) => (
  <View style={s.center}><ActivityIndicator color={colors.ink} /><Small>{label}</Small></View>
);
export const ErrorBox = ({ message, onRetry }: { message: string; onRetry?: () => void }) => (
  <View style={s.errorBox} accessibilityRole="alert">
    <Text style={[s.p, { color: colors.flare }]}>{message}</Text>
    {onRetry ? <Button title="Try again" kind="ghost" small onPress={onRetry} style={{ alignSelf: "flex-start" }} /> : null}
  </View>
);
export const Notice = ({ children, tone = "sun" }: { children: ReactNode; tone?: "sun" | "leaf" }) => (
  <View style={[s.notice, { backgroundColor: tone === "leaf" ? colors.leafTint : colors.sunTint }]}>
    {isValidElement(children) ? children : <P>{children}</P>}
  </View>
);
export const Empty = ({ title, text, action }: { title: string; text?: string; action?: ReactNode }) => (
  <View style={[s.center, { paddingVertical: space.xl }]}>
    <H3 style={{ textAlign: "center" }}>{title}</H3>
    {text ? <P style={{ textAlign: "center", color: colors.mute }}>{text}</P> : null}
    {action}
  </View>
);

export const ProductImage = ({ uri, size = 64 }: { uri: string; size?: number }) => (
  <View style={{ width: size, height: size, borderRadius: 10, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.paper, overflow: "hidden" }}>
    <Image source={{ uri }} style={{ flex: 1 }} contentFit="contain" transition={150} accessibilityIgnoresInvertColors />
  </View>
);

export function Progress({ value }: { value: number }) {
  const pct = Math.max(0, Math.min(1, value));
  return (
    <View style={s.track} accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: 100, now: Math.round(pct * 100) }}>
      <View style={[s.bar, { width: `${pct * 100}%` }]} />
    </View>
  );
}

export const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.haze },
  content: { padding: space.md, gap: space.md, paddingBottom: space.xl },
  footer: { padding: space.md, borderTopWidth: 1, borderTopColor: colors.line, backgroundColor: colors.paper, gap: space.sm },
  h1: { fontFamily: fonts.displayBold, fontSize: 30, lineHeight: 34, color: colors.ink },
  h2: { fontFamily: fonts.displayBold, fontSize: 22, lineHeight: 27, color: colors.ink },
  h3: { fontFamily: fonts.display, fontSize: 18, lineHeight: 23, color: colors.ink },
  p: { fontFamily: fonts.sans, fontSize: 15, lineHeight: 21, color: colors.ink2 },
  small: { fontFamily: fonts.sans, fontSize: 13, lineHeight: 18, color: colors.mute },
  label: { fontFamily: fonts.sansSemiBold, fontSize: 14, color: colors.ink },
  money: { fontFamily: fonts.sansBold, fontSize: 16, color: colors.ink, fontVariant: ["tabular-nums"] },
  card: { backgroundColor: colors.paper, borderRadius: radii.card, borderWidth: 1, borderColor: colors.line, padding: space.md, gap: space.sm },
  row: { flexDirection: "row", alignItems: "center", gap: space.sm },
  btn: { minHeight: 50, borderRadius: radii.input, alignItems: "center", justifyContent: "center", paddingHorizontal: space.md },
  btnSmall: { minHeight: MIN_TOUCH, paddingHorizontal: 14 },
  btnText: { fontFamily: fonts.sansBold, fontSize: 16 },
  input: { minHeight: 48, borderWidth: 1, borderColor: colors.line, borderRadius: radii.input, backgroundColor: colors.paper, paddingHorizontal: 14, fontFamily: fonts.sans, fontSize: 16, color: colors.ink },
  chip: { minHeight: MIN_TOUCH, paddingHorizontal: 14, paddingVertical: 10, borderRadius: radii.pill, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.paper, justifyContent: "center" },
  chipText: { fontFamily: fonts.sansMedium, fontSize: 14, color: colors.ink },
  choice: { flex: 1, minHeight: 64, borderWidth: 1, borderColor: colors.line, borderRadius: 12, padding: 12, backgroundColor: colors.paper, gap: 2 },
  choiceTitle: { fontFamily: fonts.sansSemiBold, fontSize: 15, color: colors.ink },
  check: { flexDirection: "row", alignItems: "center", gap: 10, minHeight: MIN_TOUCH },
  box: { width: 24, height: 24, borderRadius: 6, borderWidth: 1.5, borderColor: colors.mute, alignItems: "center", justifyContent: "center" },
  step: { width: MIN_TOUCH, height: MIN_TOUCH, alignItems: "center", justifyContent: "center" },
  stepText: { fontFamily: fonts.sansBold, fontSize: 20, color: colors.ink },
  center: { alignItems: "center", justifyContent: "center", gap: space.sm, padding: space.lg },
  errorBox: { backgroundColor: colors.flareTint, borderRadius: 12, padding: 12, gap: space.sm },
  notice: { borderRadius: 12, padding: 12 },
  track: { height: 10, borderRadius: 5, backgroundColor: colors.haze, overflow: "hidden" },
  bar: { height: 10, borderRadius: 5, backgroundColor: colors.sun },
});
