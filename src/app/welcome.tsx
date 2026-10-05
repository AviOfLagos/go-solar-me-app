import { useEffect, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { Stack, router, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button, ErrorBox, H1, OptionCard, P, Small, StepBar } from "@/ui";
import { AuthButtons } from "@/components/AuthButtons";
import { OpenLink } from "@/components/OpenLink";
import { Scene } from "@/components/Scene";
import { ROLES, type Role } from "@/lib/roles";
import { appleAvailable, signInWithApple, signInWithGoogle } from "@/lib/signin";
import { errorMessage } from "@/lib/api";
import { asString } from "@/lib/kit";
import { useProfile } from "@/stores/profile";
import { useAuth } from "@/stores/auth";
import { colors, fonts } from "@/theme";

type Step = "intro" | "role" | "account";

const ACCOUNT_COPY: Record<Role, string> = {
  home: "Keep your kit, track delivery and save your address for next time.",
  gift: "Follow the delivery to your person and get updates wherever you are.",
  group: "You'll need one to start a page or a squad. Chipping in doesn't.",
  pro: "Your shared lists, clients' orders and earnings stay in one place.",
};

/** Welcome: one idea per screen. Intro, then "what brings you here?", then sign in or skip. */
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

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.haze }} edges={["top", "bottom"]}>
      <Stack.Screen options={{ headerShown: false, gestureEnabled: changing }} />
      <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 20, gap: 20 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        {step === "intro" ? (
          <>
            <Scene kind="home" height={340} />
            <View style={{ gap: 10 }}>
              <H1 style={{ fontSize: 36, lineHeight: 42 }}>Steady light,{"\n"}without the fuel.</H1>
              <P>Solar kits for Lagos homes and businesses. Pick a kit in a minute, pay your way, and we install it.</P>
            </View>
            <View style={{ flex: 1 }} />
            {haveLink ? (
              <View style={{ backgroundColor: colors.paper, borderRadius: 24, padding: 16 }}>
                <OpenLink label="Paste the link or code you got" onOpened={() => finish()} />
              </View>
            ) : null}
            <Button title="Get started" icon="arrow-forward" onPress={() => setStep("role")} />
            {!haveLink ? (
              <Pressable onPress={() => setHaveLink(true)} hitSlop={8} accessibilityRole="button">
                <Text style={{ color: colors.ink2, fontFamily: fonts.sansSemiBold, textAlign: "center" }}>
                  Got a link from an installer? <Text style={{ color: colors.ink, textDecorationLine: "underline" }}>Open it</Text>
                </Text>
              </Pressable>
            ) : null}
          </>
        ) : step === "role" ? (
          <>
            {changing ? <View style={{ height: 8 }} /> : <StepBar step={1} total={2} onBack={() => setStep("intro")} />}
            <View style={{ gap: 8 }}>
              <H1>What brings you here?</H1>
              <P>We'll shape the app around it. You can change it later in Me.</P>
            </View>
            <View style={{ gap: 10 }}>
              {ROLES.map((r) => <OptionCard key={r.key} icon={r.icon} title={r.title} sub={r.sub} on={pick === r.key} onPress={() => setPick(r.key)} />)}
            </View>
            <View style={{ flex: 1 }} />
            <Button title={changing ? "Save" : "Continue"} icon={changing ? undefined : "arrow-forward"} disabled={!pick} onPress={chooseRole} />
          </>
        ) : (
          <>
            <StepBar step={2} total={2} onBack={() => setStep("role")} label="Almost done" />
            <Scene kind={pick ?? "home"} height={180} />
            <View style={{ gap: 8 }}>
              <H1>Save your progress?</H1>
              <P>{ACCOUNT_COPY[pick ?? "home"]}</P>
            </View>
            <AuthButtons busy={busy} appleAvailable={apple} onGoogle={() => social("google", signInWithGoogle)} onApple={() => social("apple", signInWithApple)} />
            <Button title="Use email instead" kind="ghost" onPress={() => { finish(); router.replace("/(tabs)"); router.push("/sign-in"); }} />
            {err ? <ErrorBox message={err} /> : null}
            <View style={{ flex: 1 }} />
            <Pressable onPress={done} hitSlop={8} accessibilityRole="button" style={{ paddingVertical: 8 }}>
              <Text style={{ fontFamily: fonts.sansBold, fontSize: 16, color: colors.ink, textAlign: "center" }}>Skip for now</Text>
            </Pressable>
            <Small style={{ textAlign: "center" }}>You can buy and chip in without an account.</Small>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
