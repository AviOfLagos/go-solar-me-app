import { useEffect, useState } from "react";
import { Platform, View } from "react-native";
import { router } from "expo-router";
import * as AppleAuthentication from "expo-apple-authentication";
import { Button, ErrorBox, Field, P, Row, Screen, Small } from "@/ui";
import { appleAvailable, signInWithApple, signInWithEmail, signInWithGoogle } from "@/lib/signin";
import { ApiError, errorMessage } from "@/lib/api";
import { NG_PHONE, isEmail, isName, normalizePhone } from "@/shared/format";
import { colors } from "@/theme";

export default function SignIn() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [f, setF] = useState({ name: "", email: "", phone: "", password: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState("");
  const [apple, setApple] = useState(false);
  useEffect(() => { void appleAvailable().then(setApple); }, []);

  const done = () => (router.canGoBack() ? router.back() : router.replace("/(tabs)/me"));
  const run = async (name: string, fn: () => Promise<unknown>) => {
    if (busy) return;
    setBusy(name); setErr("");
    try {
      const u = await fn();
      if (u) done();
    } catch (e) {
      if (e instanceof ApiError) setErrors(e.fields);
      setErr(errorMessage(e));
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
      <P>Track orders, save cards, start a Go Solar Me page or open a store.</P>
      {apple && Platform.OS === "ios" ? (
        <AppleAuthentication.AppleAuthenticationButton
          buttonType={AppleAuthentication.AppleAuthenticationButtonType.CONTINUE}
          buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
          cornerRadius={10}
          style={{ height: 50 }}
          onPress={() => run("apple", signInWithApple)}
        />
      ) : null}
      <Button title="Continue with Google" kind="ghost" busy={busy === "google"} onPress={() => run("google", signInWithGoogle)} />
      <Small style={{ textAlign: "center" }}>or with email</Small>
      {mode === "register" ? <Field label="Full name" value={f.name} onChangeText={set("name")} error={errors.name} autoComplete="name" /> : null}
      <Field label="Email" value={f.email} onChangeText={set("email")} error={errors.email} keyboardType="email-address" autoCapitalize="none" autoComplete="email" />
      {mode === "register" ? <Field label="Phone (optional)" value={f.phone} onChangeText={set("phone")} error={errors.phone} keyboardType="phone-pad" /> : null}
      <Field label="Password" value={f.password} onChangeText={set("password")} error={errors.password} secureTextEntry autoComplete={mode === "login" ? "current-password" : "new-password"} hint={mode === "register" ? "At least 8 characters." : undefined} onSubmitEditing={submit} />
      {err ? <ErrorBox message={err} /> : null}
      <Button title={mode === "login" ? "Sign in" : "Create account"} kind="ink" busy={busy === "email"} onPress={submit} />
      <Row style={{ justifyContent: "space-between" }}>
        <Small style={{ color: colors.ink, textDecorationLine: "underline" }} onPress={() => { setMode(mode === "login" ? "register" : "login"); setErr(""); setErrors({}); }}>
          {mode === "login" ? "New here? Create an account" : "Have an account? Sign in"}
        </Small>
        {mode === "login" ? <Small style={{ color: colors.ink, textDecorationLine: "underline" }} onPress={() => router.push("/reset")}>Forgot password?</Small> : <View />}
      </Row>
    </Screen>
  );
}
