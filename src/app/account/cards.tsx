import { useCallback, useEffect, useRef, useState } from "react";
import { View } from "react-native";
import { Stack, router, useLocalSearchParams } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import { initPaymentSheet, initStripe, presentPaymentSheet } from "@stripe/stripe-react-native";
import { Button, Card, Empty, ErrorBox, Field, H3, Loading, Notice, P, Row, Screen, Small } from "@/ui";
import { MethodPicker, defaultMethod, type Method } from "@/components/PayMethod";
import { useMe } from "@/lib/me";
import { usePayOptions } from "@/lib/pay";
import { api, errorMessage } from "@/lib/api";
import { asString } from "@/lib/kit";
import { colors } from "@/theme";
import type { Card as SavedCard } from "@/lib/types";

export default function Cards() {
  const q = useLocalSearchParams<{ reference?: string }>();
  const me = useMe();
  const opts = usePayOptions();
  const qc = useQueryClient();
  const [nick, setNick] = useState("");
  const [method, setMethod] = useState<Method | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");
  const handled = useRef("");
  const refresh = useCallback(() => qc.invalidateQueries({ queryKey: ["me"] }), [qc]);

  // Back from Paystack's ₦100 card check: keep the card (the ₦100 is refunded).
  useEffect(() => {
    const ref = asString(q.reference);
    if (!ref || handled.current === ref) return;
    handled.current = ref;
    setBusy(true);
    api("/cards/setup", { method: "PUT", body: { reference: ref } })
      .then(() => { setMsg("Card saved. The ₦100 check is on its way back to you."); void refresh(); })
      .catch((e) => setErr(errorMessage(e)))
      .finally(() => setBusy(false));
  }, [q.reference, refresh]);

  if (me.isPending) return <Screen edges={[]}><Loading /></Screen>;
  if (me.error) return <Screen edges={[]}><ErrorBox message={me.error.message} onRetry={() => me.refetch()} /></Screen>;
  const m = method ?? defaultMethod(opts.data);

  const add = async () => {
    if (!nick.trim()) return setErr("Give the card a name, e.g. GTB salary card.");
    setBusy(true); setErr(""); setMsg("");
    try {
      const r = await api<{ provider: Method; id?: string; authorizationUrl?: string; clientSecret?: string }>("/cards/setup", { body: { nickname: nick.trim(), provider: m } });
      if (r.authorizationUrl && r.id) {
        router.push({ pathname: "/pay", params: { url: r.authorizationUrl, id: r.id, then: "cards" } });
      } else if (r.clientSecret && opts.data?.stripePublishableKey) {
        await initStripe({ publishableKey: opts.data.stripePublishableKey, urlScheme: "gosolarme" });
        const init = await initPaymentSheet({ setupIntentClientSecret: r.clientSecret, merchantDisplayName: "Solar Builders NG", returnURL: "gosolarme://stripe-redirect" });
        if (init.error) throw new Error(init.error.message);
        const done = await presentPaymentSheet();
        if (done.error) { if (done.error.code !== "Canceled") throw new Error(done.error.message); }
        else {
          await api("/cards/setup", { method: "PUT", body: { setupIntentId: r.clientSecret.split("_secret")[0] } });
          setMsg("Card saved.");
          setNick("");
          void refresh();
        }
      }
    } catch (e) { setErr(errorMessage(e)); }
    setBusy(false);
  };

  return (
    <Screen edges={[]}>
      <Stack.Screen options={{ title: "Saved cards" }} />
      {msg ? <Notice tone="leaf">{msg}</Notice> : null}
      {!me.data?.cards.length ? <Empty title="No saved cards yet" text="Add one below, or tick “Save this card” at checkout." /> : me.data.cards.map((c) => <CardRow key={c.id} c={c} onChange={refresh} />)}
      <Card>
        <H3>Add a card</H3>
        <MethodPicker opts={opts.data} value={m} onChange={setMethod} />
        {m === "paystack" ? <Small>Paystack checks the card with a ₦100 charge, which we refund straight away.</Small> : null}
        <Field label="Name this card" value={nick} onChangeText={(t) => { setNick(t); setErr(""); }} placeholder="GTB salary card" maxLength={40} />
        {err ? <ErrorBox message={err} /> : null}
        <Button title="Continue" kind="ink" busy={busy} onPress={add} />
      </Card>
    </Screen>
  );
}

function CardRow({ c, onChange }: { c: SavedCard; onChange: () => void }) {
  const [edit, setEdit] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [name, setName] = useState(c.nickname);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const run = async (fn: () => Promise<unknown>) => {
    setBusy(true); setErr("");
    try { await fn(); onChange(); setEdit(false); } catch (e) { setErr(errorMessage(e)); }
    setBusy(false);
  };
  return (
    <Card>
      <View style={{ backgroundColor: colors.ink, borderRadius: 12, padding: 14 }}>
        <P style={{ color: colors.paper }}>{c.nickname}</P>
        <Small style={{ color: colors.haze }}>{c.brand.toUpperCase()} •••• {c.last4} · {String(c.expMonth).padStart(2, "0")}/{String(c.expYear).slice(-2)}{c.provider === "stripe" ? " · international" : c.bank ? ` · ${c.bank}` : ""}</Small>
      </View>
      {edit ? (
        <Row style={{ alignItems: "flex-end" }}>
          <View style={{ flex: 1 }}><Field label="Card name" value={name} onChangeText={setName} maxLength={40} /></View>
          <Button small kind="ink" title="Save" busy={busy} onPress={() => run(() => api(`/cards/${c.id}`, { method: "PATCH", body: { nickname: name.trim() } }))} />
        </Row>
      ) : null}
      <Row>
        <Button small kind="ghost" title={edit ? "Cancel" : "Rename"} onPress={() => setEdit(!edit)} />
        {confirm ? (
          <>
            <Button small kind="danger" title="Yes, remove" busy={busy} onPress={() => run(() => api(`/cards/${c.id}`, { method: "DELETE" }))} />
            <Button small kind="ghost" title="Keep" onPress={() => setConfirm(false)} />
          </>
        ) : <Button small kind="ghost" title="Remove" onPress={() => setConfirm(true)} />}
      </Row>
      {err ? <ErrorBox message={err} /> : null}
    </Card>
  );
}
