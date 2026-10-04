import { useEffect, useMemo, useRef, useState } from "react";
import { View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Button, Card, Check, Chip, Choice, ErrorBox, Field, H3, Label, Loading, Money, P, Row, Screen, Small } from "@/ui";
import { MethodPicker, SavedCards, defaultMethod, type Method } from "@/components/PayMethod";
import { useCatalog } from "@/lib/catalog";
import { useMe } from "@/lib/me";
import { usePay, usePayOptions } from "@/lib/pay";
import { api, ApiError, errorMessage } from "@/lib/api";
import { giftSplit, priceLines } from "@/lib/kit";
import { useCart } from "@/stores/cart";
import { useAuth } from "@/stores/auth";
import { INTL_PHONE, NG_PHONE, isEmail, isName, naira, normalizePhone } from "@/shared/format";
import { LAGOS_LGAS } from "@/shared/store";
import { colors } from "@/theme";
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

  function validate() {
    const e: Record<string, string> = {};
    const phone = normalizePhone(f.phone);
    if (!isName(f.name)) e.name = "Enter your full name.";
    if (!isEmail(f.email.trim())) e.email = "Enter a valid email address.";
    if (f.forSomeoneElse) {
      if (!isName(f.recipientName)) e.recipientName = "Enter the name of the person receiving it.";
      if (!NG_PHONE.test(normalizePhone(f.recipientPhone))) e.recipientPhone = "Enter their Nigerian mobile number.";
      if (phone && !NG_PHONE.test(phone) && !INTL_PHONE.test(phone)) e.phone = "Enter a valid number with country code, or leave it empty.";
    } else if (!NG_PHONE.test(phone)) e.phone = "Enter a Nigerian mobile number, e.g. 0803 123 4567.";
    if (f.altPhone && !NG_PHONE.test(normalizePhone(f.altPhone))) e.altPhone = "Enter a valid Nigerian number or leave it empty.";
    if (f.address.replace(/\s/g, "").length < 8) e.address = "Enter the full delivery address.";
    if (!f.lga) e.lga = "We deliver within Lagos only. Pick the LGA.";
    setErrors(e);
    return !Object.keys(e).length;
  }

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
    if (!validate()) return setFormError("Check the highlighted fields.");
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
        if (e.code === "gift_changed") setGift(null);
        if (e.code === "amount_changed" && gift) await applyGift(gift.code);
        if (e.code === "canceled") { setBusy(false); return; }
      }
      setFormError(errorMessage(e));
    }
    setBusy(false);
  }

  const other = f.forSomeoneElse;
  return (
    <Screen edges={[]} footer={
      <>
        {formError ? <ErrorBox message={formError} /> : null}
        <Row style={{ justifyContent: "space-between" }}><P>To pay</P><Money n={toPay} style={{ fontSize: 22 }} /></Row>
        <Button title={toPay === 0 ? "Place order" : `Pay ${naira(toPay)}`} busy={busy} disabled={noPay} onPress={submit} />
        <Small style={{ textAlign: "center" }}>{m === "paystack" ? "Secured by Paystack." : "Secured by Stripe."} Your order is pending until we confirm it by phone.</Small>
      </>
    }>
      {!user ? <Small>Have an account? <Small style={{ color: colors.ink, textDecorationLine: "underline" }} onPress={() => router.push("/sign-in")}>Sign in</Small> to use saved cards and your last address.</Small> : null}

      <Card>
        <H3>Who is this for?</H3>
        <Row>
          <Choice title="Me" sub="Delivered to my address." on={!other} onPress={() => set("forSomeoneElse")(false)} />
          <Choice title="Someone else" sub="Pay from anywhere." on={other} onPress={() => set("forSomeoneElse")(true)} />
        </Row>
        {other ? (
          <>
            <Field label="Their full name" value={f.recipientName} onChangeText={set("recipientName")} error={errors.recipientName} autoComplete="off" />
            <Field label="Their phone number" hint="We call them to arrange delivery." value={f.recipientPhone} onChangeText={set("recipientPhone")} error={errors.recipientPhone} keyboardType="phone-pad" placeholder="0803 123 4567" />
            <Field label="A note for them (optional)" value={f.giftMessage} onChangeText={set("giftMessage")} maxLength={300} placeholder="Happy birthday Mum, no more NEPA wahala" />
          </>
        ) : null}
      </Card>

      <Card>
        <H3>{other ? "Your details" : "Contact"}</H3>
        <Field label={other ? "Your phone (any country, optional)" : "Phone number"} hint={other ? undefined : "We call this number to confirm your order."} value={f.phone} onChangeText={set("phone")} onBlur={capture} error={errors.phone} keyboardType="phone-pad" autoComplete="tel" placeholder={other ? "+44 7700 900123" : "0803 123 4567"} />
        <Field label="Full name" value={f.name} onChangeText={set("name")} onBlur={capture} error={errors.name} autoComplete="name" />
        <Field label="Email" hint="For your receipt." value={f.email} onChangeText={set("email")} onBlur={capture} error={errors.email} keyboardType="email-address" autoCapitalize="none" autoComplete="email" />
        <Field label="Alternate Nigerian number (optional)" value={f.altPhone} onChangeText={set("altPhone")} error={errors.altPhone} keyboardType="phone-pad" />
        <Small>OK to message you once on WhatsApp about this order if you don't finish.</Small>
      </Card>

      <Card>
        <H3>{other ? "Their address in Lagos" : "Delivery in Lagos"}</H3>
        <Label>Local government area</Label>
        <Row style={{ flexWrap: "wrap", gap: 6 }}>
          {LAGOS_LGAS.map((l) => <Chip key={l} small label={l} on={f.lga === l} onPress={() => set("lga")(l)} />)}
        </Row>
        {errors.lga ? <Small style={{ color: colors.flare }}>{errors.lga}</Small> : null}
        <Field label="Street address" value={f.address} onChangeText={set("address")} error={errors.address} placeholder="House number, street, area" autoComplete="street-address" />
        <Field label="Nearest landmark (optional)" value={f.landmark} onChangeText={set("landmark")} placeholder="e.g. opposite Shoprite" />
        <Field label="Delivery notes (optional)" value={f.notes} onChangeText={set("notes")} multiline style={{ minHeight: 70, paddingTop: 12 }} />
        <Check label={`I need an installer. No charge now; we quote after the order.`} on={f.installer} onPress={() => set("installer")(!f.installer)} />
      </Card>

      <Card>
        <H3>Gift card</H3>
        {gift ? (
          <Row style={{ justifyContent: "space-between" }}>
            <P>{gift.code} · {naira(gift.balance)} available</P>
            <Button small kind="ghost" title="Remove" onPress={() => setGift(null)} />
          </Row>
        ) : (
          <Row style={{ alignItems: "flex-end" }}>
            <View style={{ flex: 1 }}><Field label="Code" value={giftInput} onChangeText={(t) => { setGiftInput(t); setGiftMsg(""); }} autoCapitalize="characters" autoCorrect={false} /></View>
            <Button small kind="ghost" title="Apply" busy={giftBusy} onPress={() => applyGift()} />
          </Row>
        )}
        {giftMsg ? <Small style={{ color: colors.flare }}>{giftMsg}</Small> : null}
        {giftUsed > 0 ? <Small style={{ color: colors.leaf }}>Gift card covers {naira(giftUsed)} of this order.</Small> : null}
      </Card>

      {toPay > 0 ? (
        <Card>
          <H3>Payment</H3>
          {noPay ? <ErrorBox message="Online payments are being switched on. Message us on WhatsApp to order." /> : (
            <>
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
            </>
          )}
        </Card>
      ) : <Card><P>Your gift card covers this order. No card needed.</P></Card>}

      <Card>
        <H3>Summary</H3>
        {lines.map((l) => <Row key={l.id} style={{ justifyContent: "space-between" }}><P style={{ flex: 1 }} numberOfLines={1}>{l.qty} × {l.p.name}</P><Money n={l.total} style={{ fontSize: 14 }} /></Row>)}
        <Row style={{ justifyContent: "space-between" }}><Small>Delivery (Lagos)</Small><Small>Free</Small></Row>
        {giftUsed > 0 ? <Row style={{ justifyContent: "space-between" }}><Small>Gift card</Small><Small style={{ color: colors.leaf }}>−{naira(giftUsed)}</Small></Row> : null}
        {cart.ref ? <Small>Referred by {cart.ref}</Small> : null}
      </Card>
    </Screen>
  );
}
