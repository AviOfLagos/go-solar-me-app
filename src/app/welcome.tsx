import { useEffect, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { Stack, router, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Button, ErrorBox, H1, H2, P, Small } from "@/ui";
import { AuthButtons } from "@/components/AuthButtons";
import { OpenLink } from "@/components/OpenLink";
import { ROLES, type Role } from "@/lib/roles";
import { appleAvailable, signInWithApple, signInWithGoogle } from "@/lib/signin";
import { errorMessage } from "@/lib/api";
import { asString } from "@/lib/kit";
import { useProfile } from "@/stores/profile";
import { useAuth } from "@/stores/auth";
import { colors, fonts } from "@/theme";

type Step = "intro" | "role" | "account";

const PERKS: { icon: keyof typeof Ionicons.glyphMap; text: string }[] = [
  { icon: "flash-outline", text: "The right kit for what you power, in a few taps" },
  { icon: "wallet-outline", text: "Pay at once, split it, let friends chip in, or pay small small" },
  { icon: "car-outline", text: "Free delivery and installation in Lagos" },
];

const ACCOUNT_COPY: Record<Role, string> = {
  home: "Save your kit, track delivery and keep your address for next time.",
  gift: "Track the delivery to your person and get updates wherever you are.",
  group: "You need an account to start a page or a squad. Chipping in doesn't need one.",
  pro: "Your shared lists, clients' orders and earnings all live in your account.",
};

function Dots({ step }: { step: Step }) {
  const off = step === "intro" ? "#3A4B63" : colors.line;
  const i = step === "intro" ? 0 : step === "role" ? 1 : 2;
  return (
    <View style={{ flexDirection: "row", gap: 6, justifyContent: "center" }} accessibilityLabel={`Step ${i + 1} of 3`}>
      {[0, 1, 2].map((d) => <View key={d} style={{ width: d === i ? 22 : 8, height: 8, borderRadius: 4, backgroundColor: d === i ? (step === "intro" ? colors.sun : colors.ink) : off }} />)}
    </View>
  );
}

export default function Welcome() {
  const q = useLocalSearchParams<{ step?: string }>();
  const changing = asString(q.step) === "role";
  const [step, setStep] = useState<Step>(changing ? "role" : "intro");
  const { role, setRole, finish } = useProfile();
  const user = useAuth((s) => s.user);
  const [pick, setPick] = useState<Role | null>(role);
  const [busy, setBusy] = useState("");
  const [err, setErr] = useState("");
  const [apple, setApple] = useState(false);
  const [haveLink, setHaveLink] = useState(false);
  useEffect(() => { void appleAvailable().then(setApple); }, []);

  const done = () => { finish(); router.replace("/(tabs)"); };
  const chooseRole = () => {
    if (!pick) return;
    setRole(pick);
    if (changing) return router.back();
    if (user) return done();
    setStep("account");
  };
  const social = async (name: string, fn: () => Promise<unknown>) => {
    if (busy) return;
    setBusy(name); setErr("");
    try { if (await fn()) done(); } catch (e) { setErr(errorMessage(e)); }
    setBusy("");
  };

  const dark = step === "intro";
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: dark ? colors.ink : colors.haze }} edges={["top", "bottom"]}>
      <Stack.Screen options={{ headerShown: false, gestureEnabled: changing }} />
      <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 20, gap: 18 }} keyboardShouldPersistTaps="handled">
        {step === "intro" ? (
          <>
            <View style={{ alignItems: "center", marginTop: 24 }}>
              <View style={{ width: 132, height: 132, borderRadius: 66, backgroundColor: "#1B2F4E", alignItems: "center", justifyContent: "center" }}>
                <Ionicons name="sunny" size={84} color={colors.sun} />
              </View>
            </View>
            <View style={{ gap: 8 }}>
              <Small style={{ color: colors.sun, fontFamily: fonts.sansBold, letterSpacing: 1, textAlign: "center" }}>GO SOLAR ME</Small>
              <H1 style={{ color: colors.paper, textAlign: "center", fontSize: 34, lineHeight: 38 }}>Steady light.{"\n"}No more fuel.</H1>
              <P style={{ color: "#C9D3E0", textAlign: "center" }}>Solar kits for Lagos homes and businesses, by Solar Builders NG.</P>
            </View>
            <View style={{ gap: 12, marginTop: 6 }}>
              {PERKS.map((p) => (
                <View key={p.text} style={{ flexDirection: "row", gap: 12, alignItems: "center" }}>
                  <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: "#1B2F4E", alignItems: "center", justifyContent: "center" }}>
                    <Ionicons name={p.icon} size={20} color={colors.sun} />
                  </View>
                  <P style={{ color: colors.paper, flex: 1 }}>{p.text}</P>
                </View>
              ))}
            </View>
            <View style={{ flex: 1 }} />
            {haveLink ? (
              <View style={{ backgroundColor: colors.paper, borderRadius: 16, padding: 14 }}>
                <OpenLink label="Paste the link or code you got" onOpened={() => finish()} />
              </View>
            ) : null}
            <Dots step={step} />
            <Button title="Get started" onPress={() => setStep("role")} />
            {!haveLink ? (
              <Pressable onPress={() => setHaveLink(true)} hitSlop={8} accessibilityRole="button">
                <Text style={{ color: colors.paper, fontFamily: fonts.sansSemiBold, textAlign: "center", textDecorationLine: "underline" }}>
                  Got a link or code from an installer?
                </Text>
              </Pressable>
            ) : null}
          </>
        ) : step === "role" ? (
          <>
            {!changing ? (
              <Pressable onPress={() => setStep("intro")} hitSlop={10} accessibilityRole="button" accessibilityLabel="Back" style={{ alignSelf: "flex-start" }}>
                <Ionicons name="arrow-back" size={24} color={colors.ink} />
              </Pressable>
            ) : null}
            <View style={{ gap: 6 }}>
              <H1>What brings you here?</H1>
              <P>We'll set the app up around it. You can change this any time in Me.</P>
            </View>
            {ROLES.map((r) => {
              const on = pick === r.key;
              return (
                <Pressable key={r.key} onPress={() => setPick(r.key)} accessibilityRole="radio" accessibilityState={{ checked: on }}
                  style={({ pressed }) => ({
                    flexDirection: "row", gap: 14, alignItems: "center", padding: 16, borderRadius: 18,
                    backgroundColor: on ? colors.sunTint : colors.paper, borderWidth: 2, borderColor: on ? colors.ink : colors.line,
                    transform: [{ scale: pressed ? 0.98 : 1 }],
                  })}>
                  <View style={{ width: 48, height: 48, borderRadius: 14, alignItems: "center", justifyContent: "center", backgroundColor: on ? colors.sun : colors.haze }}>
                    <Ionicons name={r.icon} size={24} color={colors.ink} />
                  </View>
                  <View style={{ flex: 1, gap: 2 }}>
                    <P style={{ fontFamily: fonts.sansBold, color: colors.ink, fontSize: 16 }}>{r.title}</P>
                    <Small>{r.sub}</Small>
                  </View>
                  <Ionicons name={on ? "checkmark-circle" : "ellipse-outline"} size={24} color={on ? colors.ink : colors.line} />
                </Pressable>
              );
            })}
            <View style={{ flex: 1 }} />
            {!changing ? <Dots step={step} /> : null}
            <Button title={changing ? "Save" : "Continue"} kind="ink" disabled={!pick} onPress={chooseRole} />
          </>
        ) : (
          <>
            <Pressable onPress={() => setStep("role")} hitSlop={10} accessibilityRole="button" accessibilityLabel="Back" style={{ alignSelf: "flex-start" }}>
              <Ionicons name="arrow-back" size={24} color={colors.ink} />
            </Pressable>
            <View style={{ gap: 6 }}>
              <H1>Sign in now, or later?</H1>
              <P>{ACCOUNT_COPY[pick ?? "home"]}</P>
            </View>
            <AuthButtons busy={busy} appleAvailable={apple} onGoogle={() => social("google", signInWithGoogle)} onApple={() => social("apple", signInWithApple)} />
            <Button title="Use email instead" kind="ghost" onPress={() => { finish(); router.replace("/(tabs)"); router.push("/sign-in"); }} />
            {err ? <ErrorBox message={err} /> : null}
            <View style={{ flex: 1 }} />
            <Dots step={step} />
            <Pressable onPress={done} hitSlop={8} accessibilityRole="button" style={{ paddingVertical: 10 }}>
              <H2 style={{ fontSize: 16, textAlign: "center", textDecorationLine: "underline" }}>Skip for now</H2>
            </Pressable>
            <Small style={{ textAlign: "center" }}>You can buy and chip in without an account.</Small>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
