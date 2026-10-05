import { useEffect, useMemo, useRef, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Button, Card, Check, Choice, ErrorBox, Field, Loading, Money, P, Row, Screen, Small } from "@/ui";
import { Wizard } from "@/components/Wizard";
import { LgaPicker } from "@/components/LgaPicker";
import { MethodPicker, SavedCards, defaultMethod, type Method } from "@/components/PayMethod";
import { useCatalog } from "@/lib/catalog";
import { useMe } from "@/lib/me";
import { usePay, usePayOptions } from "@/lib/pay";
import { api, ApiError, errorMessage } from "@/lib/api";
import { giftSplit, priceLines, itemsLabel } from "@/lib/kit";
import { useCart } from "@/stores/cart";
import { useAuth } from "@/stores/auth";
import { INTL_PHONE, NG_PHONE, isEmail, isName, naira, normalizePhone } from "@/shared/format";
import { colors, fonts } from "@/theme";
import type { PayStart } from "@/lib/types";

type Form = {
  forSomeoneElse: boolean; recipientName: string; recipientPhone: string; giftMessage: string;
  name: string; email: string; phone: string; altPhone: string; address: string; lga: string; landmark: string; notes: string;
  installer: boolean; cardNickname: string;
};

export default function Checkout() {
  const q = useLocalSearchParams<{ for?: string }>();
  const cat = useCatalog();
  const opts = usePayOptions();
  const me = useMe();
  const user = useAuth((s) => s.user);
  const cart = useCart();
  const pay = usePay();

  const [f, setF] = useState<Form>({
    forSomeoneElse: q.for === "someone", recipientName: "", recipientPhone: "", giftMessage: "",
    name: cart.contact.name, email: cart.contact.email, phone: cart.contact.phone, altPhone: "", address: "", lga: "", landmark: "", notes: "",
    installer: false, cardNickname: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState("");
  const [busy, setBusy] = useState(false);
  const [method, setMethod] = useState<Method | null>(null);
  const [card, setCard] = useState("auto");
  const [saveCard, setSaveCard] = useState(false);
  const [gift, setGift] = useState<{ code: string; balance: number } | null>(null);
  const [giftInput, setGiftInput] = useState("");
  const [giftMsg, setGiftMsg] = useState("");
  const [giftBusy, setGiftBusy] = useState(false);
  const prefilled = useRef(false);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [extra, setExtra] = useState(false);
  const [showGift, setShowGift] = useState(false);

  // Prefill once from the account: name, email, phone and the last delivery address.
  useEffect(() => {
    if (prefilled.current || !me.data?.user) return;
    prefilled.current = true;
    const u = me.data.user, d = me.data.lastDelivery;
    setF((x) => ({
      ...x, name: x.name || u.name, email: x.email || u.email, phone: x.phone || u.phone,
      ...(d && !x.forSomeoneElse && !x.address ? { address: d.address, lga: d.lga, landmark: d.landmark, altPhone: d.altPhone } : {}),
    }));
  }, [me.data]);

  const m: Method = method ?? defaultMethod(opts.data);
  const cards = me.data?.cards ?? [];
  const mine = cards.filter((c) => c.provider === m);
  const choice = card === "new" ? "new" : mine.find((c) => c.id === card)?.id ?? mine[0]?.id ?? "new";
  const { lines, subtotal } = useMemo(() => priceLines(cat.data, cart.lines), [cat.data, cart.lines]);
  const { giftUsed, toPay } = giftSplit(subtotal, gift?.balance ?? 0, opts.data?.minCharge ?? 1000);

  const set = <K extends keyof Form>(k: K) => (v: Form[K]) => { setF((x) => ({ ...x, [k]: v })); setErrors((e) => ({ ...e, [k]: "" })); };
  const capture = () => cart.setContact({ name: f.name, email: f.email.trim(), phone: f.phone });

  if (cat.isPending || opts.isPending) return <Screen edges={[]}><Loading /></Screen>;
  if (cat.error) return <Screen edges={[]}><ErrorBox message={cat.error.message} onRetry={() => cat.refetch()} /></Screen>;
  if (!lines.length) return <Screen edges={[]}><ErrorBox message="Your cart is empty." /><Button title="Pick a kit" onPress={() => router.replace("/(tabs)")} /></Screen>;
  const noPay = toPay > 0 && !opts.data?.naira && !opts.data?.intl;

  // Each step checks only its own fields; server errors jump back to the step that has them.
  const STEP_FIELDS: Record<1 | 2, string[]> = {
    1: ["name", "email", "phone", "recipientName", "recipientPhone", "altPhone"],
    2: ["address", "lga"],
  };
  function check(which: 1 | 2) {
    const e: Record<string, string> = {};
    const phone = normalizePhone(f.phone);
    if (which === 1) {
      if (!isName(f.name)) e.name = "Enter your full name.";
      if (!isEmail(f.email.trim())) e.email = "Enter a valid email address.";
      if (f.forSomeoneElse) {
        if (!isName(f.recipientName)) e.recipientName = "Enter the name of the person receiving it.";
        if (!NG_PHONE.test(normalizePhone(f.recipientPhone))) e.recipientPhone = "Enter their Nigerian mobile number.";
        if (phone && !NG_PHONE.test(phone) && !INTL_PHONE.test(phone)) e.phone = "Enter a valid number with country code, or leave it empty.";
      } else if (!NG_PHONE.test(phone)) e.phone = "Enter a Nigerian mobile number, e.g. 0803 123 4567.";
      if (f.altPhone && !NG_PHONE.test(normalizePhone(f.altPhone))) e.altPhone = "Enter a valid Nigerian number or leave it empty.";
    } else {
      if (f.address.replace(/\s/g, "").length < 8) e.address = "Enter the full delivery address.";
      if (!f.lga) e.lga = "We deliver within Lagos only. Pick the LGA.";
    }
    setErrors(e);
    return !Object.keys(e).length;
  }
  const next = (from: 1 | 2) => { if (check(from)) { if (from === 1) capture(); setStep((from + 1) as 2 | 3); } };

  async function applyGift(code = giftInput) {
    const c = code.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
    if (!c) return setGiftMsg("Enter the code from your gift card.");
    setGiftBusy(true); setGiftMsg("");
    try { setGift(await api<{ code: string; balance: number }>(`/gift-cards/${encodeURIComponent(c)}`, { auth: false })); setGiftInput(""); }
    catch (e) { setGift(null); setGiftMsg(errorMessage(e)); }
    setGiftBusy(false);
  }

  async function submit() {
    if (busy) return;
    setFormError("");
    capture();
    setBusy(true);
    try {
      const useSaved = choice !== "new";
      const start = await api<PayStart>("/checkout", {
        body: {
          items: cart.lines, ...f, email: f.email.trim(), ref: cart.ref ?? undefined, giftCode: gift?.code, leadId: cart.leadId ?? undefined,
          expectedTotal: toPay, source: "app", provider: m,
          savedCardId: toPay > 0 && useSaved ? choice : undefined,
          saveCard: !!user && !useSaved && saveCard, cardNickname: saveCard ? f.cardNickname : "",
        },
      });
      await pay(start);
    } catch (e) {
      if (e instanceof ApiError) {
        setErrors(e.fields);
        const bad = Object.keys(e.fields ?? {});
        if (bad.some((k) => STEP_FIELDS[1].includes(k))) setStep(1);
        else if (bad.some((k) => STEP_FIELDS[2].includes(k))) setStep(2);
        if (e.code === "gift_changed") setGift(null);
        if (e.code === "amount_changed" && gift) await applyGift(gift.code);
        if (e.code === "canceled") { setBusy(false); return; }
      }
      setFormError(errorMessage(e));
    }
    setBusy(false);
  }

  const other = f.forSomeoneElse;
  const back = () => (step === 1 ? router.back() : setStep((step - 1) as 1 | 2));
  const totalBar = (
    <Row style={{ justifyContent: "space-between", paddingHorizontal: 4 }}>
      <Small style={{ fontFamily: fonts.sansSemiBold }}>{itemsLabel(lines.reduce((n, l) => n + l.qty, 0))} · free Lagos delivery</Small>
      <Money n={toPay} style={{ fontSize: 16 }} />
    </Row>
  );

  if (step === 1)
    return (
      <Wizard step={1} total={3} onBack={back} title={other ? "Who's it for?" : "Your details"} sub={other ? "We'll call them to arrange delivery." : "We call to confirm your order before delivery."}
        footer={<>{totalBar}<Button title="Next: delivery" icon="arrow-forward" onPress={() => next(1)} /></>}>
        {!user ? (
          <Small>Have an account? <Small style={{ color: colors.ink, fontFamily: fonts.sansBold, textDecorationLine: "underline" }} onPress={() => router.push("/sign-in")}>Sign in</Small> to fill this in for you.</Small>
        ) : null}
        <Row>
          <Choice title="For me" on={!other} onPress={() => set("forSomeoneElse")(false)} />
          <Choice title="For someone else" on={other} onPress={() => set("forSomeoneElse")(true)} />
        </Row>
        {other ? (
          <Card>
            <Field label="Their full name" value={f.recipientName} onChangeText={set("recipientName")} error={errors.recipientName} autoComplete="off" />
            <Field label="Their phone number" value={f.recipientPhone} onChangeText={set("recipientPhone")} error={errors.recipientPhone} keyboardType="phone-pad" placeholder="0803 123 4567" />
            <Field label="A note for them (optional)" value={f.giftMessage} onChangeText={set("giftMessage")} maxLength={300} placeholder="No more NEPA wahala, Mum" />
          </Card>
        ) : null}
        <Card>
          {other ? <Small style={{ fontFamily: fonts.sansSemiBold, color: colors.ink2 }}>About you</Small> : null}
          <Field label="Full name" value={f.name} onChangeText={set("name")} onBlur={capture} error={errors.name} autoComplete="name" />
          <Field label={other ? "Your phone (any country, optional)" : "Phone number"} value={f.phone} onChangeText={set("phone")} onBlur={capture} error={errors.phone} keyboardType="phone-pad" autoComplete="tel" placeholder={other ? "+44 7700 900123" : "0803 123 4567"} />
          <Field label="Email" hint="For your receipt." value={f.email} onChangeText={set("email")} onBlur={capture} error={errors.email} keyboardType="email-address" autoCapitalize="none" autoComplete="email" />
          {extra || f.altPhone ? (
            <Field label="Another Nigerian number (optional)" value={f.altPhone} onChangeText={set("altPhone")} error={errors.altPhone} keyboardType="phone-pad" />
          ) : (
            <Small onPress={() => setExtra(true)} style={{ color: colors.ink, fontFamily: fonts.sansSemiBold }}>+ Add another number</Small>
          )}
        </Card>
      </Wizard>
    );

  if (step === 2)
    return (
      <Wizard step={2} total={3} onBack={back} title={other ? "Where should it go?" : "Where should we deliver?"} sub="Free delivery anywhere in Lagos."
        footer={<>{totalBar}<Button title="Next: payment" icon="arrow-forward" onPress={() => next(2)} /></>}>
        <Card>
          <LgaPicker value={f.lga} onChange={set("lga")} error={errors.lga} />
          <Field label="Street address" value={f.address} onChangeText={set("address")} error={errors.address} placeholder="House number, street, area" autoComplete="street-address" />
          <Field label="Nearest landmark (optional)" value={f.landmark} onChangeText={set("landmark")} placeholder="e.g. opposite Shoprite" />
          {extra || f.notes ? (
            <Field label="Delivery notes (optional)" value={f.notes} onChangeText={set("notes")} multiline style={{ minHeight: 70, paddingTop: 12 }} />
          ) : (
            <Small onPress={() => setExtra(true)} style={{ color: colors.ink, fontFamily: fonts.sansSemiBold }}>+ Add a delivery note</Small>
          )}
        </Card>
        <Pressable onPress={() => set("installer")(!f.installer)} accessibilityRole="switch" accessibilityState={{ checked: f.installer }}
          style={{ flexDirection: "row", alignItems: "center", gap: 14, padding: 16, borderRadius: 24, backgroundColor: f.installer ? colors.mintTint : colors.paper, borderWidth: 1.5, borderColor: f.installer ? colors.ink : colors.paper }}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontFamily: fonts.sansBold, fontSize: 15, color: colors.ink }}>Install it for me</Text>
            <Small>No charge now. We quote after the order.</Small>
          </View>
          <View style={{ width: 50, height: 30, borderRadius: 15, padding: 3, backgroundColor: f.installer ? colors.ink : colors.line, alignItems: f.installer ? "flex-end" : "flex-start" }}>
            <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: f.installer ? colors.mint : colors.paper }} />
          </View>
        </Pressable>
      </Wizard>
    );

  return (
    <Wizard step={3} total={3} onBack={back} title="Review and pay" label="Last step"
      footer={
        <>
          {formError ? <ErrorBox message={formError} /> : null}
          <Button title={toPay === 0 ? "Place order" : `Pay ${naira(toPay)}`} icon="lock-closed" busy={busy} disabled={noPay} onPress={submit} />
          <Small style={{ textAlign: "center" }}>{m === "paystack" ? "Secured by Paystack." : "Secured by Stripe."} We call to confirm before delivery.</Small>
        </>
      }>
      <Card>
        {lines.map((l) => <Row key={l.id} style={{ justifyContent: "space-between" }}><P style={{ flex: 1, color: colors.ink }} numberOfLines={1}>{l.qty} × {l.p.name}</P><Money n={l.total} style={{ fontSize: 14 }} /></Row>)}
        <Row style={{ justifyContent: "space-between" }}><Small>Delivery to {f.lga}</Small><Small style={{ color: colors.mintDeep, fontFamily: fonts.sansBold }}>Free</Small></Row>
        {giftUsed > 0 ? <Row style={{ justifyContent: "space-between" }}><Small>Gift card</Small><Small style={{ color: colors.leaf }}>−{naira(giftUsed)}</Small></Row> : null}
        <Row style={{ justifyContent: "space-between", borderTopWidth: 1, borderTopColor: colors.line, paddingTop: 10 }}>
          <P style={{ fontFamily: fonts.sansBold, color: colors.ink }}>To pay</P><Money n={toPay} style={{ fontSize: 20 }} />
        </Row>
        <Small>{other ? `For ${f.recipientName} · ` : ""}{f.address}, {f.lga}{f.installer ? " · with installation" : ""} · <Small style={{ color: colors.ink, textDecorationLine: "underline" }} onPress={() => setStep(2)}>Change</Small></Small>
        {cart.ref ? <Small>Referred by {cart.ref}</Small> : null}
      </Card>

      {gift || showGift ? (
        <Card>
          {gift ? (
            <Row style={{ justifyContent: "space-between" }}>
              <P>{gift.code} · {naira(gift.balance)} available</P>
              <Button small kind="ghost" title="Remove" onPress={() => setGift(null)} />
            </Row>
          ) : (
            <Row style={{ alignItems: "flex-end" }}>
              <View style={{ flex: 1 }}><Field label="Gift card code" value={giftInput} onChangeText={(t) => { setGiftInput(t); setGiftMsg(""); }} autoCapitalize="characters" autoCorrect={false} /></View>
              <Button small kind="ghost" title="Apply" busy={giftBusy} onPress={() => applyGift()} />
            </Row>
          )}
          {giftMsg ? <Small style={{ color: colors.flare }}>{giftMsg}</Small> : null}
          {giftUsed > 0 ? <Small style={{ color: colors.leaf }}>Gift card covers {naira(giftUsed)} of this order.</Small> : null}
        </Card>
      ) : (
        <Small onPress={() => setShowGift(true)} style={{ color: colors.ink, fontFamily: fonts.sansSemiBold }}>+ Use a gift card</Small>
      )}

      {toPay > 0 ? (
        noPay ? <ErrorBox message="Online payments are being switched on. Message us on WhatsApp to order." /> : (
          <Card>
            <MethodPicker opts={opts.data} value={m} onChange={(x) => { setMethod(x); setCard("auto"); }} />
            {user ? <SavedCards cards={cards} method={m} value={choice} onChange={setCard} /> : null}
            {choice === "new" ? (
              <>
                <Small>{m === "paystack" ? "You'll finish on Paystack's secure page with a card, bank transfer or USSD, then come straight back." : "You'll enter your card on Stripe's secure form."}</Small>
                {user ? (
                  <>
                    <Check label={m === "paystack" ? "Save this card for next time (cards only)" : "Save this card for next time"} on={saveCard} onPress={() => setSaveCard(!saveCard)} />
                    {saveCard ? <Field label="Name this card" placeholder="GTB salary card" value={f.cardNickname} onChangeText={set("cardNickname")} maxLength={40} /> : null}
                  </>
                ) : null}
              </>
            ) : null}
          </Card>
        )
      ) : <Card><P>Your gift card covers this order. No card needed.</P></Card>}
    </Wizard>
  );
}
