import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Button, Card, ErrorBox, Field, P, Row, Small } from "@/ui";
import { Wizard } from "@/components/Wizard";
import { MethodPicker, defaultMethod, type Method } from "@/components/PayMethod";
import { api, ApiError, errorMessage } from "@/lib/api";
import { usePay, usePayOptions } from "@/lib/pay";
import { useMe } from "@/lib/me";
import { asString } from "@/lib/kit";
import { isEmail, isName, naira } from "@/shared/format";
import { colors, fonts } from "@/theme";
import type { PayStart } from "@/lib/types";

const AMOUNTS = [50_000, 100_000, 250_000, 500_000];

function GiftPreview({ n, to, from }: { n: number; to: string; from: string }) {
  return (
    <View style={{ backgroundColor: colors.night, borderRadius: 28, padding: 22, gap: 6, overflow: "hidden" }}>
      <View style={{ position: "absolute", right: -30, top: -30, width: 140, height: 140, borderRadius: 70, backgroundColor: colors.mint, opacity: 0.18 }} />
      <Small style={{ color: colors.mint, fontFamily: fonts.sansBold }}>Solar gift card</Small>
      <Text style={{ fontFamily: fonts.light, fontSize: 38, color: colors.paper, letterSpacing: -1 }}>{naira(n)}</Text>
      <Small style={{ color: "#AEB8B1" }}>{to ? `For ${to}` : "For someone you love"}{from ? ` · from ${from}` : ""}</Small>
    </View>
  );
}

/** A solar gift card in two steps: how much, then who it's from and to (and pay). */
export default function GiftCards() {
  const q = useLocalSearchParams<{ amount?: string }>();
  const me = useMe();
  const opts = usePayOptions();
  const pay = usePay();
  const start = Math.min(5_000_000, Math.max(10_000, Math.round(Number(asString(q.amount)) || 100_000)));
  const [step, setStep] = useState(1);
  const [amount, setAmount] = useState(String(start));
  const [f, setF] = useState({ fromName: me.data?.user?.name ?? "", fromEmail: me.data?.user?.email ?? "", toName: "", toEmail: "", message: "" });
  const [method, setMethod] = useState<Method | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [check, setCheck] = useState({ open: false, code: "", result: "", busy: false });
  const n = Math.floor(Number(amount.replace(/[^\d]/g, "")) || 0);
  const set = (k: keyof typeof f) => (v: string) => { setF((x) => ({ ...x, [k]: v })); setErrors((e) => ({ ...e, [k]: "" })); };

  const next = () => {
    if (n < 10_000 || n > 5_000_000) return setErrors({ amount: "From ₦10,000 to ₦5,000,000." });
    setErrors({}); setStep(2);
  };

  const buy = async () => {
    const e: Record<string, string> = {};
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
      if (x instanceof ApiError) {
        setErrors(x.fields);
        if (x.fields?.amount) setStep(1);
        if (x.code === "canceled") { setBusy(false); return; }
      }
      setErr(errorMessage(x));
    }
    setBusy(false);
  };

  const checkBalance = async () => {
    const code = check.code.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
    if (!code) return setCheck({ ...check, result: "Enter the code." });
    setCheck({ ...check, busy: true, result: "" });
    try { const g = await api<{ balance: number }>(`/gift-cards/${encodeURIComponent(code)}`, { auth: false }); setCheck({ ...check, code, busy: false, result: `Balance: ${naira(g.balance)}` }); }
    catch (x) { setCheck({ ...check, code, busy: false, result: errorMessage(x) }); }
  };

  if (step === 1)
    return (
      <Wizard step={1} total={2} onBack={() => router.back()} title="How much?" sub="They spend it on any kit or product. It never expires."
        footer={<Button title="Next: who it's for" icon="arrow-forward" onPress={next} />}>
        <GiftPreview n={n} to={f.toName} from={f.fromName} />
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
          {AMOUNTS.map((a) => {
            const on = n === a;
            return (
              <Pressable key={a} onPress={() => setAmount(String(a))} accessibilityRole="radio" accessibilityState={{ checked: on }}
                style={{ width: "47%", flexGrow: 1, paddingVertical: 16, borderRadius: 20, alignItems: "center", backgroundColor: on ? colors.ink : colors.paper }}>
                <Text style={{ fontFamily: fonts.sansBold, fontSize: 16, color: on ? colors.mint : colors.ink }}>{naira(a)}</Text>
              </Pressable>
            );
          })}
        </View>
        <Field label="Or another amount (₦)" value={amount} onChangeText={(t) => { setAmount(t); setErrors({}); }} keyboardType="number-pad" error={errors.amount} />
        {check.open ? (
          <Card>
            <Row style={{ alignItems: "flex-end" }}>
              <View style={{ flex: 1 }}><Field label="Gift card code" value={check.code} onChangeText={(t) => setCheck({ ...check, code: t, result: "" })} autoCapitalize="characters" /></View>
              <Button small kind="ghost" title="Check" busy={check.busy} onPress={checkBalance} />
            </Row>
            {check.result ? <P>{check.result}</P> : null}
          </Card>
        ) : (
          <Small onPress={() => setCheck({ ...check, open: true })} style={{ color: colors.ink, fontFamily: fonts.sansSemiBold }}>Have a card? Check its balance</Small>
        )}
      </Wizard>
    );

  return (
    <Wizard step={2} total={2} onBack={() => setStep(1)} label="Last step" title="Who's it for?" sub="We email them the code if you add their email."
      footer={<>{err ? <ErrorBox message={err} /> : null}<Button title={`Pay ${naira(n)}`} icon="lock-closed" busy={busy} onPress={buy} /></>}>
      <Card>
        <Field label="Their name (optional)" value={f.toName} onChangeText={set("toName")} error={errors.toName} />
        <Field label="Their email (optional)" value={f.toEmail} onChangeText={set("toEmail")} error={errors.toEmail} keyboardType="email-address" autoCapitalize="none" />
        <Field label="A message (optional)" value={f.message} onChangeText={set("message")} maxLength={300} multiline placeholder="Happy new home!" />
      </Card>
      <Card>
        <Small style={{ fontFamily: fonts.sansSemiBold, color: colors.ink2 }}>From you</Small>
        <Field label="Your name" value={f.fromName} onChangeText={set("fromName")} error={errors.fromName} />
        <Field label="Your email" hint="For your receipt." value={f.fromEmail} onChangeText={set("fromEmail")} error={errors.fromEmail} keyboardType="email-address" autoCapitalize="none" />
        <MethodPicker opts={opts.data} value={method ?? defaultMethod(opts.data)} onChange={setMethod} />
      </Card>
    </Wizard>
  );
}
