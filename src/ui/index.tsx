import { forwardRef, isValidElement, useEffect, useRef, useState, type ReactNode } from "react";
import {
  ActivityIndicator, Dimensions, Keyboard, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View,
  type PressableProps, type ScrollViewProps, type StyleProp, type TextInputProps, type TextProps, type TextStyle, type ViewStyle,
} from "react-native";
import { SafeAreaView, type Edge } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { colors, fonts, radii, space, MIN_TOUCH, TAB_SPACE } from "@/theme";
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

export function Screen({ children, scroll = true, edges = ["top"], contentStyle, refreshControl, footer, tab }: {
  children: ReactNode; scroll?: boolean; edges?: Edge[]; contentStyle?: StyleProp<ViewStyle>;
  refreshControl?: ScrollViewProps["refreshControl"]; footer?: ReactNode;
  /** A tab screen: leaves room for the floating tab bar. */
  tab?: boolean;
}) {
  const ref = useRef<ScrollView>(null);
  const y = useRef(0);
  // When the keyboard opens, lift the screen and scroll the field being typed in so it sits above the keyboard.
  useEffect(() => {
    if (!scroll) return;
    const sub = Keyboard.addListener(Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow", (e) => {
      const field = TextInput.State.currentlyFocusedInput?.();
      if (!field) return;
      setTimeout(() => field.measureInWindow((_x, top, _w, h) => {
        const visibleBottom = Dimensions.get("window").height - e.endCoordinates.height - 24;
        const over = top + h - visibleBottom;
        if (over > 0) ref.current?.scrollTo({ y: y.current + over + 8, animated: true });
      }), 120);
    });
    return () => sub.remove();
  }, [scroll]);
  return (
    <SafeAreaView style={s.screen} edges={edges}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
        {scroll ? (
          <ScrollView ref={ref} onScroll={(e) => { y.current = e.nativeEvent.contentOffset.y; }} scrollEventThrottle={32}
            contentContainerStyle={[s.content, tab && { paddingBottom: TAB_SPACE }, contentStyle]} showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled" keyboardDismissMode={Platform.OS === "ios" ? "interactive" : "on-drag"} refreshControl={refreshControl}>
            {children}
          </ScrollView>
        ) : (
          <View style={[s.content, { flex: 1 }, contentStyle]}>{children}</View>
        )}
        {footer ? <View style={s.footer}>{footer}</View> : null}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

export const Card = ({ children, style, highlight }: { children: ReactNode; style?: StyleProp<ViewStyle>; highlight?: boolean }) => (
  <View style={[s.card, highlight && { borderColor: colors.ink, borderWidth: 1.5 }, style]}>{children}</View>
);
export const Row = ({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) => <View style={[s.row, style]}>{children}</View>;
export const Gap = ({ h = space.md }: { h?: number }) => <View style={{ height: h }} />;

/* ---------- controls ---------- */

type BtnProps = Omit<PressableProps, "children" | "style"> & {
  title: string; kind?: "sun" | "ink" | "ghost" | "danger"; busy?: boolean; style?: StyleProp<ViewStyle>; small?: boolean;
  /** Ionicons name shown after the title (e.g. "arrow-forward"). */
  icon?: keyof typeof Ionicons.glyphMap;
};
export function Button({ title, kind = "ink", busy, disabled, style, small, icon, ...rest }: BtnProps) {
  const off = disabled || busy;
  const bg = kind === "sun" ? colors.mint : kind === "ink" ? colors.ink : kind === "danger" ? colors.flare : colors.paper;
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
      {busy ? <ActivityIndicator color={fg} /> : (
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <Text style={[s.btnText, small && { fontSize: 14 }, { color: fg }]}>{title}</Text>
          {icon ? <Ionicons name={icon} size={small ? 16 : 18} color={fg} /> : null}
        </View>
      )}
    </Pressable>
  );
}

export const Field = forwardRef<TextInput, TextInputProps & { label: string; error?: string; hint?: string }>(
  function Field({ label, error, hint, style, secureTextEntry, ...rest }, ref) {
    // Password fields get an eye so a typo can be checked.
    const [hidden, setHidden] = useState(true);
    const input = (
      <TextInput
        ref={ref}
        placeholderTextColor={colors.mute}
        style={[s.input, !!error && { borderColor: colors.flare }, secureTextEntry && { paddingRight: 52 }, style]}
        accessibilityLabel={label}
        secureTextEntry={secureTextEntry && hidden}
        {...rest}
      />
    );
    return (
      <View style={{ gap: 6 }}>
        <Label>{label}</Label>
        {secureTextEntry ? (
          <View>
            {input}
            <Pressable accessibilityRole="button" accessibilityLabel={hidden ? "Show password" : "Hide password"} hitSlop={8} onPress={() => setHidden((h) => !h)}
              style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: 52, alignItems: "center", justifyContent: "center" }}>
              <Ionicons name={hidden ? "eye-outline" : "eye-off-outline"} size={22} color={colors.mute} />
            </Pressable>
          </View>
        ) : input}
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

/** "Step 2 of 3" with a progress bar and an optional back arrow. Counts down near the end. */
export function StepBar({ step, total, onBack, label }: { step: number; total: number; onBack?: () => void; label?: string }) {
  const left = total - step;
  return (
    <View style={{ gap: 10 }}>
      <View style={[s.row, { justifyContent: "space-between" }]}>
        {onBack ? (
          <Pressable onPress={onBack} hitSlop={12} accessibilityRole="button" accessibilityLabel="Back" style={s.iconBtn}>
            <Ionicons name="arrow-back" size={20} color={colors.ink} />
          </Pressable>
        ) : <View style={{ width: 40 }} />}
        <Small style={{ fontFamily: fonts.sansSemiBold, color: colors.ink2 }}>
          {label ?? (left === 0 ? "Last step" : step === 1 ? `Step 1 of ${total}` : left === 1 ? "1 step left" : `Step ${step} of ${total}`)}
        </Small>
        <View style={{ width: 40 }} />
      </View>
      <View style={{ flexDirection: "row", gap: 6 }} accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: total, now: step }}>
        {Array.from({ length: total }, (_, i) => (
          <View key={i} style={{ flex: 1, height: 6, borderRadius: 3, backgroundColor: i < step ? colors.ink : colors.line }} />
        ))}
      </View>
    </View>
  );
}

/** A big tappable answer with an icon. Used for one-question-per-screen steps. */
export function OptionCard({ icon, title, sub, on, onPress, right }: {
  icon?: keyof typeof Ionicons.glyphMap; title: string; sub?: string; on?: boolean; onPress: () => void; right?: ReactNode;
}) {
  return (
    <Pressable onPress={onPress} accessibilityRole="radio" accessibilityState={{ checked: !!on }}
      style={({ pressed }) => [s.option, on && { borderColor: colors.ink, backgroundColor: colors.mintTint }, pressed && { transform: [{ scale: 0.985 }] }]}>
      {icon ? (
        <View style={[s.optionIcon, on && { backgroundColor: colors.mint }]}>
          <Ionicons name={icon} size={22} color={colors.ink} />
        </View>
      ) : null}
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={s.optionTitle}>{title}</Text>
        {sub ? <Small numberOfLines={2}>{sub}</Small> : null}
      </View>
      {right ?? <Ionicons name={on ? "checkmark-circle" : "ellipse-outline"} size={24} color={on ? colors.ink : colors.line} />}
    </Pressable>
  );
}

/** A small rounded label, e.g. "Suggested" or "Saves ₦96,000/mo". */
export const Tag = ({ label, tone = "mint" }: { label: string; tone?: "mint" | "lemon" | "ink" | "line" }) => (
  <View style={{ alignSelf: "flex-start", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5,
    backgroundColor: tone === "mint" ? colors.mint : tone === "lemon" ? colors.lemon : tone === "ink" ? colors.ink : colors.paper }}>
    <Text style={{ fontFamily: fonts.sansBold, fontSize: 12, color: tone === "ink" ? colors.paper : colors.ink }}>{label}</Text>
  </View>
);

/** Section title with an optional action on the right ("See all"). */
export const Section = ({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) => (
  <View style={[s.row, { justifyContent: "space-between", marginTop: 4 }]}>
    <H3 style={{ fontFamily: fonts.sansBold }}>{title}</H3>
    {action ? <Small onPress={onAction} style={{ fontFamily: fonts.sansSemiBold, color: colors.ink }}>{action}</Small> : null}
  </View>
);

/* ---------- states ---------- */

export const Loading = ({ label = "Loading…" }: { label?: string }) => (
  <View style={s.center}><ActivityIndicator color={colors.ink} /><Small>{label}</Small></View>
);
export const ErrorBox = ({ message, onRetry }: { message: string; onRetry?: () => void }) => (
  <View style={s.errorBox} accessibilityRole="alert">
    <Text style={[s.p, { color: colors.flare, fontFamily: fonts.sansMedium }]}>{message}</Text>
    {onRetry ? <Button title="Try again" kind="ghost" small onPress={onRetry} style={{ alignSelf: "flex-start" }} /> : null}
  </View>
);
export const Notice = ({ children, tone = "sun" }: { children: ReactNode; tone?: "sun" | "leaf" }) => (
  <View style={[s.notice, { backgroundColor: tone === "leaf" ? colors.leafTint : colors.lemonTint }]}>
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
  <View style={{ width: size, height: size, borderRadius: 16, borderWidth: 0, borderColor: colors.line, backgroundColor: colors.paper, overflow: "hidden" }}>
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
  h1: { fontFamily: fonts.light, fontSize: 32, lineHeight: 38, color: colors.ink, letterSpacing: -0.5 },
  h2: { fontFamily: fonts.sansSemiBold, fontSize: 22, lineHeight: 28, color: colors.ink, letterSpacing: -0.2 },
  h3: { fontFamily: fonts.sansSemiBold, fontSize: 17, lineHeight: 23, color: colors.ink },
  p: { fontFamily: fonts.sans, fontSize: 15, lineHeight: 22, color: colors.ink2 },
  small: { fontFamily: fonts.sans, fontSize: 13, lineHeight: 18, color: colors.mute },
  label: { fontFamily: fonts.sansSemiBold, fontSize: 14, color: colors.ink },
  iconBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.paper, alignItems: "center", justifyContent: "center" },
  option: { flexDirection: "row", gap: 14, alignItems: "center", padding: 16, borderRadius: 22, backgroundColor: colors.paper, borderWidth: 1.5, borderColor: colors.paper },
  optionIcon: { width: 46, height: 46, borderRadius: 16, alignItems: "center", justifyContent: "center", backgroundColor: colors.haze },
  optionTitle: { fontFamily: fonts.sansBold, fontSize: 16, color: colors.ink },
  money: { fontFamily: fonts.sansBold, fontSize: 16, color: colors.ink, fontVariant: ["tabular-nums"] },
  card: { backgroundColor: colors.paper, borderRadius: radii.card, padding: 18, gap: space.sm },
  row: { flexDirection: "row", alignItems: "center", gap: space.sm },
  btn: { minHeight: 54, borderRadius: radii.button, alignItems: "center", justifyContent: "center", paddingHorizontal: 22 },
  btnSmall: { minHeight: MIN_TOUCH, paddingHorizontal: 18 },
  btnText: { fontFamily: fonts.sansBold, fontSize: 16, letterSpacing: 0.1 },
  input: { minHeight: 52, borderWidth: 1, borderColor: colors.line, borderRadius: radii.input, backgroundColor: colors.paper, paddingHorizontal: 16, fontFamily: fonts.sansMedium, fontSize: 16, color: colors.ink },
  chip: { minHeight: MIN_TOUCH, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.paper, justifyContent: "center" },
  chipText: { fontFamily: fonts.sansMedium, fontSize: 14, color: colors.ink },
  choice: { flex: 1, minHeight: 64, borderWidth: 1.5, borderColor: colors.line, borderRadius: 18, padding: 14, backgroundColor: colors.paper, gap: 2 },
  choiceTitle: { fontFamily: fonts.sansSemiBold, fontSize: 15, color: colors.ink },
  check: { flexDirection: "row", alignItems: "center", gap: 10, minHeight: MIN_TOUCH },
  box: { width: 24, height: 24, borderRadius: 8, borderWidth: 1.5, borderColor: colors.mute, alignItems: "center", justifyContent: "center" },
  step: { width: MIN_TOUCH, height: MIN_TOUCH, alignItems: "center", justifyContent: "center" },
  stepText: { fontFamily: fonts.sansBold, fontSize: 20, color: colors.ink },
  center: { alignItems: "center", justifyContent: "center", gap: space.sm, padding: space.lg },
  errorBox: { backgroundColor: colors.flareTint, borderRadius: 16, padding: 14, gap: space.sm },
  notice: { borderRadius: 16, padding: 14 },
  track: { height: 10, borderRadius: 5, backgroundColor: colors.line, overflow: "hidden" },
  bar: { height: 10, borderRadius: 5, backgroundColor: colors.mintDeep },
});
