import type { ReactNode } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, View } from "react-native";
import { Stack } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { H1, P, StepBar } from "@/ui";
import { colors } from "@/theme";

/**
 * The frame for every multi-step flow (docs/DESIGN.md rule 3): progress at the top, one question,
 * and the button that names the next step at the bottom.
 */
export function Wizard({ step, total, onBack, label, title, sub, footer, children }: {
  step: number; total: number; onBack: () => void; label?: string; title: string; sub?: string; footer?: ReactNode; children?: ReactNode;
}) {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.haze }} edges={["top", "bottom"]}>
      <Stack.Screen options={{ headerShown: false }} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <View style={{ paddingHorizontal: 20, paddingTop: 8 }}>
          <StepBar step={step} total={total} onBack={onBack} label={label} />
        </View>
        <ScrollView contentContainerStyle={{ padding: 20, gap: 16, paddingBottom: 32 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={{ gap: 8, marginBottom: 2 }}>
            <H1>{title}</H1>
            {sub ? <P>{sub}</P> : null}
          </View>
          {children}
        </ScrollView>
        {footer ? <View style={{ paddingHorizontal: 20, paddingBottom: 12, paddingTop: 6, gap: 8 }}>{footer}</View> : null}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
