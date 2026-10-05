import { useMemo, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import { Button, Card, Chip, ErrorBox, Field, H1, Loading, Money, OptionCard, P, Row, Screen, Small } from "@/ui";
import { Wizard } from "@/components/Wizard";
import { LgaPicker } from "@/components/LgaPicker";
import { SignInPrompt } from "@/components/SignInPrompt";
import { useCatalog } from "@/lib/catalog";
import { useMe } from "@/lib/me";
import { api, ApiError, errorMessage } from "@/lib/api";
import { decodeItems, priceLines, itemsLabel } from "@/lib/kit";
import { useAuth } from "@/stores/auth";
import { useCart } from "@/stores/cart";
import { OCCASIONS, POOL } from "@/shared/store";
import { NG_PHONE, isName, naira, normalizePhone } from "@/shared/format";
import { colors, fonts } from "@/theme";

const FOR = ["Me", "My mum", "My dad", "Our house", "My shop", "Our church", "Someone else"];
const DELIVERY_FIELDS = ["recipientPhone", "lga", "address", "recipientName"];

/**
 * Start a Go Solar Me page in four short steps: kind of page, who (or the squad), timing, delivery.
 */
export default function NewPool() {
  const q = useLocalSearchParams<{ items?: string; kind?: string }>();
  const user = useAuth((s) => s.user);
  const cat = useCatalog();
  const me = useMe();
  const cartLines = useCart((s) => s.lines);
  const qc = useQueryClient();
  const items = useMemo(() => { const d = decodeItems(q.items); return d.length ? d : cartLines; }, [q.items, cartLines]);

  const [step, setStep] = useState(1);
  const [kind, setKind] = useState<"public" | "squad">(q.kind === "squad" ? "squad" : "public");
  const [forWho, setForWho] = useState("My mum");
  const [forName, setForName] = useState("");
  const [occasion, setOccasion] = useState("just-because");
  const [days, setDays] = useState<number>(POOL.defaultDays);
  const [d, setD] = useState({ recipientName: "", recipientPhone: "", lga: "", address: "", installer: false });
  const [shares, setShares] = useState<string[]>(["", ""]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState("");
  const [busy, setBusy] = useState(false);

  if (!user) return <Screen edges={[]}><SignInPrompt text="You need an account to start a page, so you can manage it and get updates. Supporters don't need one." /></Screen>;
  if (cat.isPending) return <Screen edges={[]}><Loading /></Screen>;
  if (cat.error) return <Screen edges={[]}><ErrorBox message={cat.error.message} onRetry={() => cat.refetch()} /></Screen>;

  const { lines, subtotal } = priceLines(cat.data, items);
  if (!lines.length)
    return (
      <Screen edges={[]}>
        <H1>First, pick the kit</H1>
        <P>Your page funds one kit. Find the right one in three quick questions.</P>
        <Button title="Find a kit" icon="arrow-forward" onPress={() => router.push("/find")} />
      </Screen>
    );

  const squad = kind === "squad";
  const self = !squad && forWho === "Me";
  const perShare = Math.floor(subtotal / Math.max(1, shares.length));
  const back = () => (step === 1 ? router.back() : setStep(step - 1));
  const kitBar = (
    <Row style={{ justifyContent: "space-between", paddingHorizontal: 4 }}>
      <Small style={{ fontFamily: fonts.sansSemiBold }}>Goal · {itemsLabel(lines.reduce((n, l) => n + l.qty, 0))}</Small>
      <Money n={subtotal} style={{ fontSize: 16 }} />
    </Row>
  );

  const checkWho = () => {
    const e: Record<string, string> = {};
    if (squad && (shares.length < POOL.squadMin || shares.length > POOL.squadMax)) e.shares = `A squad is ${POOL.squadMin} to ${POOL.squadMax} people.`;
    if (!squad && !self && !isName(forName)) e.forName = "A first name is enough.";
    setErrors(e);
    if (!Object.keys(e).length) setStep(3);
  };

  async function create() {
    if (busy) return;
    const e: Record<string, string> = {};
    const phone = normalizePhone(d.recipientPhone || me.data?.user?.phone || "");
    if (!NG_PHONE.test(phone)) e.recipientPhone = "Enter the Nigerian number we should call for delivery.";
    if (!d.lga) e.lga = "Pick the LGA in Lagos.";
    if (d.address && d.address.replace(/\s/g, "").length < 8) e.address = "Enter the full address, or leave it for later.";
    setErrors(e);
    if (Object.keys(e).length) return;
    setBusy(true); setFormError("");
    try {
      const r = await api<{ id: string }>("/pools", {
        body: {
          items, kind, occasion, deadlineDays: days, forName: self || squad ? undefined : forName.trim(),
          recipientName: self ? undefined : d.recipientName || forName.trim() || undefined, recipientPhone: phone, lga: d.lga, address: d.address, installer: d.installer,
          shares: squad ? shares.map((n, i) => n.trim() || `Person ${i + 1}`) : undefined,
          ref: useCart.getState().ref ?? undefined,
        },
      });
      void qc.invalidateQueries({ queryKey: ["myOrders"] });
      router.replace({ pathname: "/fund/[id]", params: { id: r.id, created: "1" } });
    } catch (x) {
      if (x instanceof ApiError) {
        setErrors(x.fields);
        const bad = Object.keys(x.fields ?? {});
        if (bad.includes("shares") || bad.includes("forName")) setStep(2);
        else if (!bad.some((k) => DELIVERY_FIELDS.includes(k)) && bad.length) setStep(3);
      }
      setFormError(errorMessage(x));
    }
    setBusy(false);
  }

  if (step === 1)
    return (
      <Wizard step={1} total={4} onBack={back} title="How should people pay?" sub="You can share the page either way."
        footer={<>{kitBar}<Button title={squad ? "Next: your squad" : "Next: who it's for"} icon="arrow-forward" onPress={() => setStep(2)} /></>}>
        <OptionCard icon="megaphone-outline" title="Anyone chips in" sub="Family, friends, church. Any amount from ₦1,000." on={!squad} onPress={() => setKind("public")} />
        <OptionCard icon="git-branch-outline" title="Split it equally" sub="2–10 people, one share and pay button each." on={squad} onPress={() => setKind("squad")} />
        <Card style={{ backgroundColor: colors.lemonTint }}>
          <Small style={{ color: colors.ink2 }}>Every naira goes to the kit, never cash. At 100% the order places itself. If it isn't funded by the deadline, you choose: extend, switch to a smaller kit, or refund everyone.</Small>
        </Card>
      </Wizard>
    );

  if (step === 2)
    return squad ? (
      <Wizard step={2} total={4} onBack={back} title="Who's in the squad?" sub={`Each person pays an equal share of about ${naira(perShare)}.`}
        footer={<>{kitBar}<Button title="Next: timing" icon="arrow-forward" onPress={checkWho} /></>}>
        <Card>
          {shares.map((n, i) => (
            <Row key={i} style={{ alignItems: "flex-end" }}>
              <View style={{ flex: 1 }}><Field label={`Person ${i + 1}`} value={n} onChangeText={(t) => setShares((a) => a.map((x, j) => (j === i ? t : x)))} placeholder={i === 0 ? "You" : "Name"} /></View>
              {shares.length > POOL.squadMin ? <Button small kind="ghost" title="Remove" onPress={() => setShares((a) => a.filter((_, j) => j !== i))} /> : null}
            </Row>
          ))}
          {shares.length < POOL.squadMax ? <Button small kind="ghost" title="+ Add a person" onPress={() => setShares((a) => [...a, ""])} /> : null}
          {errors.shares ? <Small style={{ color: colors.flare }}>{errors.shares}</Small> : null}
        </Card>
      </Wizard>
    ) : (
      <Wizard step={2} total={4} onBack={back} title="Who is it for?" sub="It shows on the page, so people know who they're helping."
        footer={<>{kitBar}<Button title="Next: timing" icon="arrow-forward" onPress={checkWho} /></>}>
        <Row style={{ flexWrap: "wrap" }}>{FOR.map((x) => <Chip key={x} label={x} on={forWho === x} onPress={() => setForWho(x)} />)}</Row>
        {!self ? <Field label="Their first name" value={forName} onChangeText={(t) => { setForName(t); setErrors((e) => ({ ...e, forName: "" })); }} error={errors.forName} placeholder="Mama Tunde" /> : null}
      </Wizard>
    );

  if (step === 3)
    return (
      <Wizard step={3} total={4} onBack={back} title="How long should it run?" sub="Most pages fill in two to four weeks."
        footer={<>{kitBar}<Button title="Next: delivery" icon="arrow-forward" onPress={() => setStep(4)} /></>}>
        <View style={{ flexDirection: "row", gap: 10 }}>
          {POOL.deadlineDays.map((n) => {
            const on = days === n;
            return (
              <Pressable key={n} onPress={() => setDays(n)} accessibilityRole="radio" accessibilityState={{ checked: on }}
                style={{ flex: 1, paddingVertical: 18, borderRadius: 22, alignItems: "center", backgroundColor: on ? colors.ink : colors.paper }}>
                <Text style={{ fontFamily: fonts.light, fontSize: 30, color: on ? colors.mint : colors.ink }}>{n}</Text>
                <Small style={{ color: on ? colors.paper : colors.mute }}>days</Small>
              </Pressable>
            );
          })}
        </View>
        <Small style={{ fontFamily: fonts.sansSemiBold, color: colors.ink2, marginTop: 6 }}>What's the occasion? (optional)</Small>
        <Row style={{ flexWrap: "wrap" }}>{OCCASIONS.map((o) => <Chip small key={o.slug} label={o.label} on={occasion === o.slug} onPress={() => setOccasion(o.slug)} />)}</Row>
      </Wizard>
    );

  return (
    <Wizard step={4} total={4} onBack={back} title="Where will it go?" label="Last step" sub="Only the LGA shows on the page. Address and phone stay private."
      footer={<>{formError ? <ErrorBox message={formError} /> : null}<Button title="Create the page" icon="sparkles-outline" busy={busy} onPress={create} /></>}>
      <Card>
        {!self && !squad ? <Field label="Who receives it (full name)" value={d.recipientName} onChangeText={(t) => setD({ ...d, recipientName: t })} placeholder={forName || "Their name"} /> : null}
        <Field label="Phone we call for delivery" value={d.recipientPhone} onChangeText={(t) => { setD({ ...d, recipientPhone: t }); setErrors((e) => ({ ...e, recipientPhone: "" })); }} error={errors.recipientPhone} keyboardType="phone-pad" placeholder={self ? me.data?.user?.phone || "0803 123 4567" : "0803 123 4567"} />
        <LgaPicker value={d.lga} onChange={(l) => { setD({ ...d, lga: l }); setErrors((e) => ({ ...e, lga: "" })); }} error={errors.lga} />
        <Field label="Street address (can wait until it's funded)" value={d.address} onChangeText={(t) => setD({ ...d, address: t })} error={errors.address} />
      </Card>
      <OptionCard icon="construct-outline" title="Install it for them" sub="We quote installation after it's funded." on={d.installer} onPress={() => setD({ ...d, installer: !d.installer })} />
    </Wizard>
  );
}
