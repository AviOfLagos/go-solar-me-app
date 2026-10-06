import { useEffect, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { Stack, router, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button, ErrorBox, H1, OptionCard, P, Small, StepBar } from "@/ui";
import { AuthButtons } from "@/components/AuthButtons";
import { OpenLink } from "@/components/OpenLink";
import { Photo, PhotoChip } from "@/components/Photo";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { ROLES, type Role } from "@/lib/roles";
import { appleAvailable, signInWithApple, signInWithGoogle } from "@/lib/signin";
import { errorMessage } from "@/lib/api";
import { asString } from "@/lib/kit";
import { track } from "@/lib/track";
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
    track(`role-${pick}`);
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
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.haze }} edges={step === "intro" ? ["bottom"] : ["top", "bottom"]}>
      <Stack.Screen options={{ headerShown: false, gestureEnabled: changing }} />
      <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 20, gap: 20 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        {step === "intro" ? (
          <>
            <Photo kind="hero" height={500} radius={0} style={{ marginHorizontal: -20, marginTop: -20 }}>
              <LinearGradient colors={["rgba(243,242,236,0)", "rgba(243,242,236,0)", colors.haze]} locations={[0, 0.55, 0.97]} style={{ position: "absolute", inset: 0 }} />
              <PhotoChip label="Sun power" sub="₦0 on fuel today" style={{ right: 20, top: 190 }} />
            </Photo>
            <View style={{ gap: 10, marginTop: -60 }}>
              <Text style={{ fontFamily: fonts.light, fontSize: 40, lineHeight: 46, color: colors.ink, letterSpacing: -1 }}>
                Steady{" "}
                <Text style={{ backgroundColor: colors.mint, fontFamily: fonts.sansSemiBold }}> light </Text>
                {"\n"}without the fuel.
              </Text>
              <P>Solar kits for Lagos homes and businesses. Pick one in a minute, pay your way, and we install it.</P>
            </View>
            <View style={{ flex: 1 }} />
            {haveLink ? (
              <View style={{ backgroundColor: colors.paper, borderRadius: 24, padding: 16 }}>
                <OpenLink label="Paste the link or code you got" onOpened={() => finish()} />
              </View>
            ) : null}
            <View style={{ flexDirection: "row", gap: 10 }}>
              <Button title="Get started" icon="arrow-forward" onPress={() => setStep("role")} style={{ flex: 1 }} />
              {!haveLink ? (
                <Pressable onPress={() => setHaveLink(true)} accessibilityRole="button" accessibilityLabel="I have a link or code from an installer"
                  style={({ pressed }) => ({ width: 54, height: 54, borderRadius: 16, backgroundColor: colors.paper, alignItems: "center", justifyContent: "center", opacity: pressed ? 0.7 : 1 })}>
                  <Ionicons name="link" size={22} color={colors.ink} />
                </Pressable>
              ) : null}
            </View>
            {!haveLink ? <Small style={{ textAlign: "center" }}>Got a link from an installer? Tap the link button.</Small> : null}
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
            <Photo kind={pick ?? "home"} height={170} />
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
