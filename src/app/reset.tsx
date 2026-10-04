import { useState } from "react";
import { Stack, router } from "expo-router";
import { Button, ErrorBox, Field, P, Screen, Small } from "@/ui";
import { api, ApiError, errorMessage } from "@/lib/api";
import { finishWithToken } from "@/lib/signin";
import { isEmail } from "@/shared/format";
import type { SessionUser } from "@/stores/auth";

export default function Reset() {
  const [step, setStep] = useState<"email" | "code">("email");
  const [f, setF] = useState({ email: "", code: "", password: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof f) => (v: string) => { setF((x) => ({ ...x, [k]: v })); setErrors((e) => ({ ...e, [k]: "" })); };

  const send = async () => {
    if (!isEmail(f.email.trim())) return setErrors({ email: "Enter a valid email." });
    setBusy(true); setErr("");
    try { await api("/auth/reset", { body: { email: f.email.trim() }, auth: false }); setStep("code"); }
    catch (e) { setErr(errorMessage(e)); }
    setBusy(false);
  };
  const confirm = async () => {
    const e: Record<string, string> = {};
    if (f.code.replace(/\D/g, "").length !== 6) e.code = "Enter the 6-digit code.";
    if (f.password.length < 8 || f.password.length > 128) e.password = "Use 8 to 128 characters.";
    setErrors(e);
    if (Object.keys(e).length) return;
    setBusy(true); setErr("");
    try {
      const r = await api<{ user: SessionUser; token: string }>("/auth/reset/confirm", { body: { email: f.email.trim(), code: f.code, password: f.password }, auth: false });
      await finishWithToken(r);
      router.dismissAll();
      router.replace("/(tabs)/me");
    } catch (x) {
      if (x instanceof ApiError) setErrors(x.fields);
      setErr(errorMessage(x));
    }
    setBusy(false);
  };

  return (
    <Screen edges={[]}>
      <Stack.Screen options={{ title: "Reset password" }} />
      <P>{step === "email" ? "We'll email you a 6-digit code." : `If ${f.email.trim()} has an account, a code is on its way. It works for 15 minutes.`}</P>
      {step === "email" ? (
        <Field label="Email" value={f.email} onChangeText={set("email")} error={errors.email} keyboardType="email-address" autoCapitalize="none" autoComplete="email" />
      ) : (
        <>
          <Field label="Code from the email" value={f.code} onChangeText={set("code")} error={errors.code} keyboardType="number-pad" autoComplete="one-time-code" maxLength={7} />
          <Field label="New password" value={f.password} onChangeText={set("password")} error={errors.password} secureTextEntry autoComplete="new-password" hint="At least 8 characters." />
        </>
      )}
      {err ? <ErrorBox message={err} /> : null}
      <Button title={step === "email" ? "Send code" : "Set new password"} kind="ink" busy={busy} onPress={step === "email" ? send : confirm} />
      {step === "code" ? <Small style={{ textAlign: "center", textDecorationLine: "underline" }} onPress={send}>Send a new code</Small> : null}
    </Screen>
  );
}
