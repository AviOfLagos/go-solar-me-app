import { useState } from "react";
import { Stack, router, useLocalSearchParams } from "expo-router";
import { Button, Card, Chip, ErrorBox, Field, H2, H3, Label, Loading, Money, Notice, P, Row, Screen, Small } from "@/ui";
import { useCatalog } from "@/lib/catalog";
import { useMe } from "@/lib/me";
import { api, ApiError, errorMessage } from "@/lib/api";
import { decodeItems, priceLines } from "@/lib/kit";
import { useCart } from "@/stores/cart";
import { FINANCE } from "@/shared/store";
import { NG_PHONE, isEmail, isName, naira, normalizePhone } from "@/shared/format";

/** A request to a partner lender. Nothing is charged here. */
export default function PaySmallSmall() {
  const q = useLocalSearchParams<{ items?: string }>();
  const cat = useCatalog();
  const me = useMe();
  const cartLines = useCart((s) => s.lines);
  const items = decodeItems(q.items).length ? decodeItems(q.items) : cartLines;
  const [f, setF] = useState({ name: me.data?.user?.name ?? "", phone: me.data?.user?.phone ?? "", email: me.data?.user?.email ?? "", employment: "", incomeBand: "" });
  const [down, setDown] = useState(FINANCE.downPayments[0]);
  const [months, setMonths] = useState(FINANCE.months[1]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState("");

  if (cat.isPending) return <Screen edges={[]}><Loading /></Screen>;
  if (cat.error) return <Screen edges={[]}><ErrorBox message={cat.error.message} onRetry={() => cat.refetch()} /></Screen>;
  const { lines, subtotal } = priceLines(cat.data, items);
  const set = (k: keyof typeof f) => (v: string) => { setF((x) => ({ ...x, [k]: v })); setErrors((e) => ({ ...e, [k]: "" })); };

  if (sent) return (
    <Screen edges={[]}>
      <H2>Request sent</H2>
      <Notice tone="leaf">Reference {sent}. Our lending partner will call you within 2 working days. Nothing has been charged.</Notice>
      <Button title="Done" kind="ink" onPress={() => router.dismissTo("/(tabs)")} />
    </Screen>
  );
  if (subtotal < FINANCE.minTotal) return (
    <Screen edges={[]}>
      <Stack.Screen options={{ title: "Pay small small" }} />
      <H2>Pay small small</H2>
      <P>A partner lender pays us in full, and you repay them in 3, 6 or 12 months with {FINANCE.downPayments.join(", ")}% down.</P>
      <Notice>It starts from {naira(FINANCE.minTotal)}. {lines.length ? `Your kit is ${naira(subtotal)}.` : "Pick a kit first."}</Notice>
      <Button title="Pick a kit" onPress={() => router.push("/(tabs)")} />
    </Screen>
  );

  const submit = async () => {
    const e: Record<string, string> = {};
    if (!isName(f.name)) e.name = "Enter your name.";
    if (!NG_PHONE.test(normalizePhone(f.phone))) e.phone = "Enter a Nigerian mobile number.";
    if (f.email && !isEmail(f.email.trim())) e.email = "Enter a valid email or leave it empty.";
    if (!f.employment) e.employment = "Choose one.";
    if (!f.incomeBand) e.incomeBand = "Choose one.";
    setErrors(e);
    if (Object.keys(e).length) return;
    setBusy(true); setErr("");
    try {
      const r = await api<{ id: string }>("/finance", { body: { items, ...f, email: f.email.trim(), downPct: down, months } });
      setSent(r.id);
    } catch (x) { if (x instanceof ApiError) setErrors(x.fields); setErr(errorMessage(x)); }
    setBusy(false);
  };

  return (
    <Screen edges={[]}>
      <Stack.Screen options={{ title: "Pay small small" }} />
      <Card>
        <Row style={{ justifyContent: "space-between" }}><H3>Your kit</H3><Money n={subtotal} /></Row>
        {lines.map((l) => <Small key={l.id}>{l.qty} × {l.p.name}</Small>)}
        <P>About {naira(Math.round((subtotal * down) / 100))} down, the rest over {months} months. The lender sets the rate.</P>
      </Card>
      <Card>
        <Label>Down payment</Label>
        <Row>{FINANCE.downPayments.map((d) => <Chip key={d} label={`${d}%`} on={down === d} onPress={() => setDown(d)} />)}</Row>
        <Label>Months to repay</Label>
        <Row>{FINANCE.months.map((m) => <Chip key={m} label={`${m}`} on={months === m} onPress={() => setMonths(m)} />)}</Row>
        <Field label="Full name" value={f.name} onChangeText={set("name")} error={errors.name} />
        <Field label="Phone" value={f.phone} onChangeText={set("phone")} error={errors.phone} keyboardType="phone-pad" />
        <Field label="Email (optional)" value={f.email} onChangeText={set("email")} error={errors.email} keyboardType="email-address" autoCapitalize="none" />
        <Label>Work</Label>
        <Row style={{ flexWrap: "wrap" }}>{FINANCE.employment.map((x) => <Chip small key={x} label={x} on={f.employment === x} onPress={() => set("employment")(x)} />)}</Row>
        {errors.employment ? <Small style={{ color: "#E5482D" }}>{errors.employment}</Small> : null}
        <Label>Monthly income</Label>
        <Row style={{ flexWrap: "wrap" }}>{FINANCE.incomeBands.map((x) => <Chip small key={x} label={x} on={f.incomeBand === x} onPress={() => set("incomeBand")(x)} />)}</Row>
        {errors.incomeBand ? <Small style={{ color: "#E5482D" }}>{errors.incomeBand}</Small> : null}
        {err ? <ErrorBox message={err} /> : null}
        <Button title="Send request" kind="ink" busy={busy} onPress={submit} />
        <Small>Nothing is charged. The lender calls you to finish.</Small>
      </Card>
    </Screen>
  );
}
