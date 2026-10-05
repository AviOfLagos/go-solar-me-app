import { useEffect, useState } from "react";
import { View } from "react-native";
import { router } from "expo-router";
import { Button, ErrorBox, Field, H2, Notice, P, Row, Screen, Small } from "@/ui";
import { AuthButtons } from "@/components/AuthButtons";
import { appleAvailable, signInWithApple, signInWithEmail, signInWithGoogle } from "@/lib/signin";
import { ApiError, errorMessage } from "@/lib/api";
import { NG_PHONE, isEmail, isName, normalizePhone } from "@/shared/format";
import { colors, fonts } from "@/theme";

export default function SignIn() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [f, setF] = useState({ name: "", email: "", phone: "", password: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [err, setErr] = useState("");
  const [hint, setHint] = useState("");
  const [busy, setBusy] = useState("");
  const [apple, setApple] = useState(false);
  useEffect(() => { void appleAvailable().then(setApple); }, []);

  const done = () => (router.canGoBack() ? router.back() : router.replace("/(tabs)/me"));
  const switchTo = (m: "login" | "register", why = "") => { setMode(m); setErr(""); setErrors({}); setHint(why); };

  const run = async (name: string, fn: () => Promise<unknown>) => {
    if (busy) return;
    setBusy(name); setErr(""); setHint("");
    try {
      const u = await fn();
      if (u) done();
    } catch (e) {
      // No account yet: keep what they typed and turn the form into sign-up. Already registered: the reverse.
      if (e instanceof ApiError && e.code === "no_account") {
        switchTo("register", "There's no account with this email yet. Add your name to create one. Your password stays as typed.");
      } else if (e instanceof ApiError && e.code === "account_exists") {
        switchTo("login", "You already have an account with this email. Sign in instead.");
      } else {
        if (e instanceof ApiError) setErrors(e.fields);
        setErr(errorMessage(e));
      }
    }
    setBusy("");
  };

  const submit = () => {
    const e: Record<string, string> = {};
    if (mode === "register" && !isName(f.name)) e.name = "Enter your name.";
    if (!isEmail(f.email.trim())) e.email = "Enter a valid email.";
    if (mode === "register" && f.phone && !NG_PHONE.test(normalizePhone(f.phone))) e.phone = "Enter a Nigerian number or leave it empty.";
    if (mode === "register" ? f.password.length < 8 || f.password.length > 128 : !f.password) e.password = mode === "register" ? "Use 8 to 128 characters." : "Enter your password.";
    setErrors(e);
    if (Object.keys(e).length) return;
    void run("email", () => signInWithEmail(mode, { ...f, email: f.email.trim() }));
  };
  const set = (k: keyof typeof f) => (v: string) => { setF((x) => ({ ...x, [k]: v })); setErrors((e) => ({ ...e, [k]: "" })); };

  return (
    <Screen edges={[]}>
      <View style={{ gap: 4 }}>
        <H2>{mode === "login" ? "Welcome back" : "Create your account"}</H2>
        <P>Track orders, save cards, share lists and start Go Solar Me pages.</P>
      </View>
      <AuthButtons busy={busy} appleAvailable={apple} onGoogle={() => run("google", signInWithGoogle)} onApple={() => run("apple", signInWithApple)} />
      <Small>New to Go Solar Me? Google creates your account on the spot.</Small>

      <Row style={{ gap: 10 }}>
        <View style={{ flex: 1, height: 1, backgroundColor: colors.line }} />
        <Small>or with email</Small>
        <View style={{ flex: 1, height: 1, backgroundColor: colors.line }} />
      </Row>

      {hint ? <Notice>{hint}</Notice> : null}
      {mode === "register" ? <Field label="Full name" value={f.name} onChangeText={set("name")} error={errors.name} autoComplete="name" autoFocus={!!hint} /> : null}
      <Field label="Email" value={f.email} onChangeText={set("email")} error={errors.email} keyboardType="email-address" autoCapitalize="none" autoComplete="email" />
      {mode === "register" ? <Field label="Phone (optional)" value={f.phone} onChangeText={set("phone")} error={errors.phone} keyboardType="phone-pad" /> : null}
      <Field label="Password" value={f.password} onChangeText={set("password")} error={errors.password} secureTextEntry autoComplete={mode === "login" ? "current-password" : "new-password"} hint={mode === "register" ? "At least 8 characters." : undefined} onSubmitEditing={submit} />
      {err ? <ErrorBox message={err} /> : null}
      <Button title={mode === "login" ? "Sign in" : "Create account"} kind="ink" busy={busy === "email"} onPress={submit} />
      <Row style={{ justifyContent: "space-between" }}>
        <Small style={{ color: colors.ink, fontFamily: fonts.sansSemiBold, textDecorationLine: "underline" }} onPress={() => switchTo(mode === "login" ? "register" : "login")}>
          {mode === "login" ? "New here? Create an account" : "Have an account? Sign in"}
        </Small>
        {mode === "login" ? <Small style={{ color: colors.ink, textDecorationLine: "underline" }} onPress={() => router.push("/reset")}>Forgot password?</Small> : <View />}
      </Row>
    </Screen>
  );
}
