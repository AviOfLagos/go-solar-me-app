import { useEffect, useRef, useState } from "react";
import { Linking, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import * as Clipboard from "expo-clipboard";
import { useQueryClient } from "@tanstack/react-query";
import { Button, Card, ErrorBox, H1, Loading, Money, Notice, P, Screen, Small } from "@/ui";
import { api, errorMessage } from "@/lib/api";
import { cancelPayment } from "@/lib/pay";
import { asString } from "@/lib/kit";
import { sharePicture } from "@/lib/share";
import { SITE, waLink } from "@/lib/config";
import { useCart } from "@/stores/cart";
import { naira, ngLocal } from "@/shared/format";
import { colors } from "@/theme";
import { Celebrate, NextSteps } from "@/components/Celebrate";
import type { PaySummary } from "@/lib/types";

const waiting = (r: PaySummary) => r.paymentStatus === "processing" || (r.provider === "paystack" && r.paymentStatus === "pending");

/** Asks the server what happened to the payment and says it plainly. Never trusts the payment page. */
export default function Success() {
  const q = useLocalSearchParams<{ id?: string; secret?: string; order?: string }>();
  const id = asString(q.id), secret = asString(q.secret), orderRef = asString(q.order);
  const [r, setR] = useState<PaySummary | null>(null);
  const [err, setErr] = useState("");
  const [copied, setCopied] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const tries = useRef(0);
  const qc = useQueryClient();
  const clear = useCart((s) => s.clear);

  useEffect(() => {
    if (orderRef) { clear(); void qc.invalidateQueries({ queryKey: ["myOrders"] }); return; }
    if (!id) return;
    let alive = true, timer: ReturnType<typeof setTimeout>;
    const check = async () => {
      try {
        const d = await api<PaySummary>(`/payments/${encodeURIComponent(id)}`, { body: { clientSecret: secret } });
        if (!alive) return;
        setR(d);
        if (waiting(d) && tries.current++ < 12) { timer = setTimeout(check, 5000); return; }
        if (d.kind === "order" && d.paymentStatus === "succeeded" && d.ok !== false) clear();
        if (d.kind === "order" && (d.paymentStatus === "canceled" || d.paymentStatus === "failed")) void cancelPayment(id, secret);
        void qc.invalidateQueries({ queryKey: ["myOrders"] });
        if (d.kind === "contribution" && d.pool) void qc.invalidateQueries({ queryKey: ["pool", d.pool.id] });
      } catch (e) {
        if (alive) setErr(errorMessage(e));
      }
    };
    void check();
    return () => { alive = false; clearTimeout(timer); };
  }, [id, secret, orderRef, clear, qc, attempt]);

  const done = (
    <View style={{ gap: 8 }}>
      <Button title="Track my order" onPress={() => router.dismissTo("/(tabs)/orders")} />
      <Button title="Back home" kind="ghost" onPress={() => router.dismissTo("/(tabs)")} />
    </View>
  );

  if (orderRef)
    return (
      <Screen>
        <Celebrate />
        <H1 style={{ textAlign: "center" }}>You're going solar!</H1>
        <P style={{ textAlign: "center" }}>Order {orderRef} was paid with your gift card.</P>
        <NextSteps />
        <Button title="Share: I'm going solar" kind="ghost" onPress={() => sharePicture("order", orderRef, "I'm going solar!", `${SITE}/`)} />
        {done}
      </Screen>
    );
  if (!id) return <Screen><ErrorBox message="Nothing to show here." />{done}</Screen>;
  if (err) return <Screen><H1>We couldn't check your payment</H1><ErrorBox message={err} onRetry={() => { setErr(""); tries.current = 0; setAttempt((n) => n + 1); }} /><P>If you were charged, it will still count. Check My orders in a minute.</P>{done}</Screen>;
  if (!r) return <Screen><Loading label="Confirming your payment…" /><Small style={{ textAlign: "center" }}>Please don't close the app.</Small></Screen>;

  if (waiting(r))
    return (
      <Screen>
        <H1>Your bank is still confirming</H1>
        <P>This can take a few minutes, especially for bank transfers. We'll complete it as soon as the money lands and let you know. You won't be charged twice.</P>
        {done}
      </Screen>
    );

  if (r.error || r.paymentStatus !== "succeeded" || r.ok === false)
    return (
      <Screen>
        <H1>{r.paymentStatus === "canceled" ? "Payment cancelled" : "Your payment didn't go through"}</H1>
        <P>{r.error || (r.paymentStatus === "canceled" ? "You cancelled before paying. Nothing was charged." : "The payment was not completed. You have not been charged for this attempt.")}</P>
        <Button title="Try again" onPress={() => (r.kind === "contribution" && r.pool ? router.dismissTo({ pathname: "/fund/[id]", params: { id: r.pool.id } }) : router.back())} />
        <Button title="Get help on WhatsApp" kind="ghost" onPress={() => Linking.openURL(waLink(`Hi, my payment ${id} didn't go through`))} />
      </Screen>
    );

  if (r.kind === "contribution" && r.pool) {
    const p = r.pool;
    return (
      <Screen>
        {r.accepted ? <Celebrate icon="heart" tone="lemon" /> : null}
        <H1>{r.accepted ? "Thank you for chipping in!" : "The kit was already funded"}</H1>
        {r.accepted ? (
          <P>You added {naira(r.accepted)} to {p.title}. It's now at {naira(p.raised)} of {naira(p.goal)}{p.status === "funded" ? ". Goal reached, so we're placing the order!" : "."}</P>
        ) : <P>Someone finished it just before you. Nothing was kept: your full payment is on its way back to you.</P>}
        {r.refunded && r.accepted ? <Notice>Only {naira(r.accepted)} was needed, so we've refunded the other {naira(r.refunded)} to where you paid from. Refunds can take 5 to 10 working days.</Notice> : null}
        {r.accepted ? <Button title="Share the page" kind="ghost" onPress={() => sharePicture("pool", p.id, `I just helped with "${p.title}". Chip in too:`, `${SITE}/fund/${p.id}`)} /> : null}
        <Button title="Back to the page" kind="ink" onPress={() => router.dismissTo({ pathname: "/fund/[id]", params: { id: p.id } })} />
      </Screen>
    );
  }

  if (r.kind === "gift_card")
    return (
      <Screen>
        <Celebrate icon="gift" tone="lemon" />
        <H1 style={{ textAlign: "center" }}>Your gift card is ready</H1>
        {r.gift ? (
          <>
            <P>A {naira(r.gift.amount)} solar gift card{r.gift.toName ? ` for ${r.gift.toName}` : ""}. It never expires.</P>
            <Card style={{ alignItems: "center" }}>
              <Money n={r.gift.amount} />
              <P selectable style={{ fontSize: 28, letterSpacing: 4, color: colors.ink }}>{r.gift.code}</P>
              <Button small kind="ghost" title={copied ? "Copied ✓" : "Copy code"} onPress={async () => { await Clipboard.setStringAsync(r.gift!.code); setCopied(true); }} />
            </Card>
            {r.emailed ? <Small>We've also emailed it.</Small> : <Small>Keep it safe. Anyone with the code can spend it.</Small>}
          </>
        ) : <P>Payment received. We've emailed the code.</P>}
        {done}
      </Screen>
    );

  const o = r.order;
  return (
    <Screen>
      <Celebrate />
      <H1 style={{ textAlign: "center" }}>{o?.recipient ? `${o.recipient.name} is going solar!` : "You're going solar!"}</H1>
      <P style={{ textAlign: "center" }}>
        Order {o?.ref} · {naira(o?.total ?? r.amount ?? 0)}{o?.giftUsed ? ` (${naira(o.giftUsed)} on your gift card)` : ""}
        {o?.phone ? `. We'll call ${o.recipient ? o.recipient.name : "you"} on ${ngLocal(o.phone)}.` : ""}
      </P>
      <NextSteps installer={o?.installer} who={o?.recipient?.name} />
      {r.emailed && o?.email ? <Small>A copy has been sent to {o.email}.</Small> : null}
      {o?.ref ? <Button title="Share: I'm going solar" kind="ghost" onPress={() => sharePicture("order", o.ref, "I'm going solar!", `${SITE}/`)} /> : null}
      {done}
    </Screen>
  );
}
