import { useState } from "react";
import { RefreshControl, View } from "react-native";
import { Stack, useLocalSearchParams } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import { Button, Card, Check, Chip, ErrorBox, Field, H1, H3, Label, Loading, Money, Notice, P, Progress, Row, Screen, Small } from "@/ui";
import { MethodPicker, defaultMethod, type Method } from "@/components/PayMethod";
import { usePool, daysLeft, POOL_STATUS } from "@/lib/pools";
import { usePay, usePayOptions } from "@/lib/pay";
import { useCatalog } from "@/lib/catalog";
import { useMe } from "@/lib/me";
import { api, ApiError, errorMessage } from "@/lib/api";
import { asString } from "@/lib/kit";
import { sharePicture } from "@/lib/share";
import { SITE } from "@/lib/config";
import { naira, isEmail, isName } from "@/shared/format";
import { OCCASIONS, POOL } from "@/shared/store";
import { colors } from "@/theme";
import type { Pool, PayStart } from "@/lib/types";

export default function PoolScreen() {
  const q = useLocalSearchParams<{ id: string; created?: string }>();
  const id = asString(q.id);
  const pool = usePool(id);

  if (pool.isPending) return <Screen edges={[]}><Loading /></Screen>;
  if (pool.error) return <Screen edges={[]}><ErrorBox message={pool.error.message} onRetry={() => pool.refetch()} /></Screen>;
  const p = pool.data;
  const open = p.status === "open" || p.status === "ended";
  const share = () => sharePicture("pool", p.id, p.kind === "squad" ? `Pay your share for "${p.title}":` : `Help with "${p.title}". Chip in any amount:`, `${SITE}/fund/${p.id}`);

  return (
    <Screen edges={[]} refreshControl={<RefreshControl refreshing={pool.isRefetching} onRefresh={() => pool.refetch()} />}>
      <Stack.Screen options={{ title: p.kind === "squad" ? "Squad split" : "Go Solar Me" }} />
      {q.created ? <Notice tone="leaf">Your page is live. Share it on WhatsApp to get the first chip-in.</Notice> : null}
      <Small style={{ color: colors.sunDeep }}>{OCCASIONS.find((o) => o.slug === p.occasion)?.label ?? ""}</Small>
      <H1>{p.title}</H1>
      <Card>
        <Row style={{ justifyContent: "space-between", alignItems: "baseline" }}>
          <Money n={p.raised} style={{ fontSize: 24 }} />
          <Small>of {naira(p.goal)}</Small>
        </Row>
        <Progress value={p.raised / p.goal} />
        <Small>{Math.floor((p.raised / p.goal) * 100)}% · {p.status === "open" ? daysLeft(p.deadline) : POOL_STATUS[p.status]} · {p.supporters.length} supporter{p.supporters.length === 1 ? "" : "s"} · {p.lga}</Small>
        <Button title="Share on WhatsApp" kind="ink" onPress={share} />
      </Card>

      {p.isOwner ? <OwnerPanel p={p} onChange={() => pool.refetch()} /> : null}
      {open ? <Contribute p={p} /> : p.status === "funded" ? <Notice tone="leaf">Funded! {p.order ? `The order is ${p.order.status.replace(/_/g, " ")}.` : "We're placing the order."}</Notice> : <Notice>This page is closed. Everyone who chipped in was refunded.</Notice>}

      <P>{p.story}</P>
      <Card>
        <H3>The kit</H3>
        {p.items.map((i) => <Row key={i.id} style={{ justifyContent: "space-between" }}><P style={{ flex: 1 }}>{i.qty} × {i.name}</P><Small>{i.funded ? `${i.funded} funded` : ""}</Small></Row>)}
      </Card>
      {p.supporters.length ? (
        <Card>
          <H3>Supporters</H3>
          {p.supporters.map((x, k) => (
            <View key={k} style={{ gap: 2, paddingVertical: 4 }}>
              <Row style={{ justifyContent: "space-between" }}><P style={{ color: colors.ink }}>{x.name}</P><Money n={x.amount} style={{ fontSize: 14 }} /></Row>
              {x.piece ? <Small>Funded: {x.piece}</Small> : null}
              {x.message ? <Small>“{x.message}”</Small> : null}
            </View>
          ))}
        </Card>
      ) : null}
      <Small>Every naira goes to this kit, never cash. If it isn't funded, everyone is refunded.</Small>
    </Screen>
  );
}

function Contribute({ p }: { p: Pool }) {
  const opts = usePayOptions();
  const me = useMe();
  const pay = usePay();
  const remaining = p.goal - p.raised;
  const chips = POOL.chipIns.filter((x) => x < remaining);
  const multiPart = p.items.length > 1 || (p.items[0]?.qty ?? 0) > 1;
  const pieces = multiPart ? p.items.filter((i) => i.price <= remaining && i.funded < i.qty) : [];
  const openShares = p.shares.filter((x) => !x.paid);
  const [mode, setMode] = useState<"amount" | "piece" | "share">(p.kind === "squad" ? "share" : "amount");
  const [amount, setAmount] = useState(String(chips[1] ?? chips[0] ?? remaining));
  const [piece, setPiece] = useState(pieces[0]?.id ?? "");
  const [shareId, setShareId] = useState(openShares[0]?.id ?? "");
  const [f, setF] = useState({ name: me.data?.user?.name ?? "", email: me.data?.user?.email ?? "", message: "", anonymous: false });
  const [method, setMethod] = useState<Method | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const min = Math.min(1000, remaining);
  const n = Math.floor(Number(amount.replace(/[^\d]/g, "")) || 0);
  const value = mode === "piece" ? p.items.find((i) => i.id === piece)?.price ?? 0 : mode === "share" ? openShares.find((x) => x.id === shareId)?.amount ?? 0 : n;

  async function go() {
    if (busy) return;
    const e: Record<string, string> = {};
    if (!isEmail(f.email.trim())) e.email = "Enter your email for the receipt.";
    if (f.name.trim() && !isName(f.name)) e.name = "Enter your name, or tick Hide my name.";
    if (mode === "amount" && (n < min || n > remaining)) e.amount = `Enter ${naira(min)} to ${naira(remaining)}.`;
    if (mode === "share" && !shareId) e.share = "Pick whose share you're paying.";
    setErrors(e);
    if (Object.keys(e).length) return;
    setBusy(true); setErr("");
    try {
      const start = await api<PayStart>(`/pools/${p.id}/contribute`, {
        body: { ...f, email: f.email.trim(), provider: method ?? defaultMethod(opts.data), amount: mode === "amount" ? n : undefined, piece: mode === "piece" ? piece : undefined, shareId: mode === "share" ? shareId : undefined },
      });
      await pay(start);
    } catch (x) {
      if (x instanceof ApiError) { setErrors(x.fields); if (x.code === "canceled") { setBusy(false); return; } }
      setErr(errorMessage(x));
    }
    setBusy(false);
  }

  return (
    <Card>
      <H3>{p.kind === "squad" ? "Pay a share" : "Chip in"}</H3>
      {p.kind === "squad" ? (
        <View style={{ gap: 6 }}>
          {p.shares.map((x) => (
            <Chip key={x.id} label={`${x.name} · ${x.paid ? "Paid ✓" : naira(x.amount)}`} on={shareId === x.id} onPress={() => !x.paid && setShareId(x.id)} />
          ))}
          {errors.share ? <Small style={{ color: colors.flare }}>{errors.share}</Small> : null}
        </View>
      ) : (
        <>
          {pieces.length ? (
            <Row><Chip label="Any amount" on={mode === "amount"} onPress={() => setMode("amount")} /><Chip label="Fund a part" on={mode === "piece"} onPress={() => setMode("piece")} /></Row>
          ) : null}
          {mode === "amount" ? (
            <>
              <Row style={{ flexWrap: "wrap" }}>
                {[...chips.slice(0, 2), remaining].map((v, k) => <Chip key={k} label={v === remaining ? `The rest (${naira(v)})` : naira(v)} on={n === v} onPress={() => setAmount(String(v))} />)}
              </Row>
              <Field label="Or type an amount (₦)" value={amount} onChangeText={setAmount} keyboardType="number-pad" error={errors.amount} />
            </>
          ) : (
            <View style={{ gap: 6 }}>
              {pieces.map((i) => <Chip key={i.id} label={`${i.name} · ${naira(i.price)}`} on={piece === i.id} onPress={() => setPiece(i.id)} />)}
            </View>
          )}
        </>
      )}
      <Field label="Your name" value={f.name} onChangeText={(t) => setF({ ...f, name: t })} error={errors.name} autoComplete="name" />
      <Field label="Email for your receipt" value={f.email} onChangeText={(t) => setF({ ...f, email: t })} error={errors.email} keyboardType="email-address" autoCapitalize="none" />
      <Field label="Message (optional)" value={f.message} onChangeText={(t) => setF({ ...f, message: t })} maxLength={200} placeholder="Happy birthday Mummy!" />
      <Check label="Hide my name on the page" on={f.anonymous} onPress={() => setF({ ...f, anonymous: !f.anonymous })} />
      <MethodPicker opts={opts.data} value={method ?? defaultMethod(opts.data)} onChange={setMethod} />
      {err ? <ErrorBox message={err} /> : null}
      <Button title={`Continue with ${naira(value > 0 ? value : 0)}`} busy={busy} disabled={value <= 0} onPress={go} />
      <Small>No account needed. If the kit gets funded before your payment lands, we refund you automatically.</Small>
    </Card>
  );
}

function OwnerPanel({ p, onChange }: { p: Pool; onChange: () => void }) {
  const qc = useQueryClient();
  const cat = useCatalog();
  const [address, setAddress] = useState({ address: "", landmark: "" });
  const [busy, setBusy] = useState("");
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");
  const [confirmCancel, setConfirmCancel] = useState(false);

  const act = async (name: string, path: string, body: Record<string, unknown>, done: string) => {
    setBusy(name); setErr(""); setMsg("");
    try {
      await api(path, { body });
      setMsg(done);
      void qc.invalidateQueries({ queryKey: ["myOrders"] });
      onChange();
    } catch (x) { setErr(errorMessage(x)); }
    setBusy("");
  };

  const smaller = (cat.data?.segments ?? []).flatMap((s) => s.tiers).filter((t) => t.price <= p.raised && t.price > 0).sort((a, b) => b.price - a.price).slice(0, 3);
  const open = p.status === "open" || p.status === "ended";

  return (
    <Card style={{ borderColor: colors.ink }}>
      <H3>Your page</H3>
      {msg ? <Notice tone="leaf">{msg}</Notice> : null}
      {err ? <ErrorBox message={err} /> : null}
      {p.needsAddress ? (
        <>
          <Label>Add the delivery address</Label>
          <Field label="Street address" value={address.address} onChangeText={(t) => setAddress({ ...address, address: t })} placeholder="House number, street, area" />
          <Field label="Nearest landmark (optional)" value={address.landmark} onChangeText={(t) => setAddress({ ...address, landmark: t })} />
          <Button small kind="ink" title="Save address" busy={busy === "address"} onPress={() => act("address", `/pools/${p.id}/address`, address, "Address saved.")} />
        </>
      ) : null}
      {p.status === "ended" ? <Notice>The deadline passed. Choose what happens{p.choiceEnds ? ` by ${new Date(p.choiceEnds).toLocaleDateString()}` : ""}, or everyone is refunded automatically.</Notice> : null}
      {open ? (
        <>
          {!p.extended ? <Button small kind="ghost" title={`Extend by ${POOL.extendDays} days (once)`} busy={busy === "extend"} onPress={() => act("extend", `/pools/${p.id}/close`, { action: "extend" }, "Extended.")} /> : null}
          {p.kind === "public" && smaller.length ? (
            <>
              <Label>Switch to a kit the money already covers</Label>
              {smaller.map((t) => (
                <Button key={t.id} small kind="ghost" title={`${t.name} · ${naira(t.price)}`} busy={busy === t.id}
                  onPress={() => act(t.id, `/pools/${p.id}/close`, { action: "smaller", items: t.items }, `Switched. We're placing the order${p.raised > t.price ? ` and the ${naira(p.raised - t.price)} left over becomes a gift card for you` : ""}.`)} />
              ))}
            </>
          ) : null}
          {confirmCancel ? (
            <Row>
              <Button small style={{ flex: 1 }} kind="danger" title="Yes, cancel and refund" busy={busy === "cancel"} onPress={() => act("cancel", `/pools/${p.id}/close`, { action: "cancel" }, "Cancelled. Everyone is being refunded.")} />
              <Button small style={{ flex: 1 }} kind="ghost" title="Keep it" onPress={() => setConfirmCancel(false)} />
            </Row>
          ) : <Button small kind="ghost" title="Cancel and refund everyone" onPress={() => setConfirmCancel(true)} />}
        </>
      ) : null}
    </Card>
  );
}
