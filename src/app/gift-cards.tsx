import { useState } from "react";
import { Stack, useLocalSearchParams } from "expo-router";
import { Button, Card, Chip, ErrorBox, Field, H3, Money, P, Row, Screen, Small } from "@/ui";
import { MethodPicker, defaultMethod, type Method } from "@/components/PayMethod";
import { api, ApiError, errorMessage } from "@/lib/api";
import { usePay, usePayOptions } from "@/lib/pay";
import { useMe } from "@/lib/me";
import { asString } from "@/lib/kit";
import { isEmail, isName, naira } from "@/shared/format";
import { colors } from "@/theme";
import type { PayStart } from "@/lib/types";

const AMOUNTS = [25_000, 50_000, 100_000, 250_000, 500_000, 1_000_000];

export default function GiftCards() {
  const q = useLocalSearchParams<{ amount?: string }>();
  const me = useMe();
  const opts = usePayOptions();
  const pay = usePay();
  const start = Math.min(5_000_000, Math.max(10_000, Math.round(Number(asString(q.amount)) || 100_000)));
  const [amount, setAmount] = useState(String(start));
  const [f, setF] = useState({ fromName: me.data?.user?.name ?? "", fromEmail: me.data?.user?.email ?? "", toName: "", toEmail: "", message: "" });
  const [method, setMethod] = useState<Method | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [check, setCheck] = useState({ code: "", result: "", busy: false });
  const n = Math.floor(Number(amount.replace(/[^\d]/g, "")) || 0);
  const set = (k: keyof typeof f) => (v: string) => { setF((x) => ({ ...x, [k]: v })); setErrors((e) => ({ ...e, [k]: "" })); };

  const buy = async () => {
    const e: Record<string, string> = {};
    if (n < 10_000 || n > 5_000_000) e.amount = "From ₦10,000 to ₦5,000,000.";
    if (!isName(f.fromName)) e.fromName = "Enter your name.";
    if (!isEmail(f.fromEmail.trim())) e.fromEmail = "Enter a valid email for your receipt.";
    if (f.toName && !isName(f.toName)) e.toName = "Enter their name or leave it empty.";
    if (f.toEmail && !isEmail(f.toEmail.trim())) e.toEmail = "Enter a valid email or leave it empty.";
    setErrors(e);
    if (Object.keys(e).length) return;
    setBusy(true); setErr("");
    try {
      const r = await api<PayStart>("/gift-cards", { body: { ...f, fromEmail: f.fromEmail.trim(), toEmail: f.toEmail.trim(), amount: n, provider: method ?? defaultMethod(opts.data) } });
      await pay(r);
    } catch (x) {
      if (x instanceof ApiError) { setErrors(x.fields); if (x.code === "canceled") { setBusy(false); return; } }
      setErr(errorMessage(x));
    }
    setBusy(false);
  };

  const checkBalance = async () => {
    const code = check.code.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
    if (!code) return setCheck({ ...check, result: "Enter the code." });
    setCheck({ ...check, busy: true, result: "" });
    try { const g = await api<{ balance: number }>(`/gift-cards/${encodeURIComponent(code)}`, { auth: false }); setCheck({ code, busy: false, result: `Balance: ${naira(g.balance)}` }); }
    catch (x) { setCheck({ code, busy: false, result: errorMessage(x) }); }
  };

  return (
    <Screen edges={[]}>
      <Stack.Screen options={{ title: "Gift cards" }} />
      <Card style={{ backgroundColor: colors.ink }}>
        <Small style={{ color: colors.sun }}>Solar Builders NG gift card</Small>
        <Money n={n} style={{ color: colors.paper, fontSize: 32 }} />
        <Small style={{ color: colors.haze }}>{f.toName ? `For ${f.toName}` : "For someone you love"}{f.fromName ? ` · from ${f.fromName}` : ""}</Small>
      </Card>
      <P>For birthdays, weddings, new homes or staff rewards. They spend it on any product or kit. It never expires and can't be exchanged for cash.</P>
      <Card>
        <Row style={{ flexWrap: "wrap" }}>{AMOUNTS.map((a) => <Chip key={a} small label={naira(a)} on={n === a} onPress={() => setAmount(String(a))} />)}</Row>
        <Field label="Or enter an amount (₦)" value={amount} onChangeText={(t) => { setAmount(t); setErrors((e) => ({ ...e, amount: "" })); }} keyboardType="number-pad" error={errors.amount} />
        <Field label="Your name" value={f.fromName} onChangeText={set("fromName")} error={errors.fromName} />
        <Field label="Your email" value={f.fromEmail} onChangeText={set("fromEmail")} error={errors.fromEmail} keyboardType="email-address" autoCapitalize="none" />
        <Field label="Their name (optional)" value={f.toName} onChangeText={set("toName")} error={errors.toName} />
        <Field label="Their email (optional)" value={f.toEmail} onChangeText={set("toEmail")} error={errors.toEmail} keyboardType="email-address" autoCapitalize="none" hint="We email them the code." />
        <Field label="Message (optional)" value={f.message} onChangeText={set("message")} maxLength={300} multiline />
        <MethodPicker opts={opts.data} value={method ?? defaultMethod(opts.data)} onChange={setMethod} />
        {err ? <ErrorBox message={err} /> : null}
        <Button title={`Buy ${naira(n)} gift card`} busy={busy} onPress={buy} />
      </Card>
      <Card>
        <H3>Check a balance</H3>
        <Row style={{ alignItems: "flex-end" }}>
          <Field label="Code" value={check.code} onChangeText={(t) => setCheck({ code: t, result: "", busy: false })} autoCapitalize="characters" style={{ minWidth: 180 }} />
          <Button small kind="ghost" title="Check" busy={check.busy} onPress={checkBalance} />
        </Row>
        {check.result ? <P>{check.result}</P> : null}
      </Card>
    </Screen>
  );
}
