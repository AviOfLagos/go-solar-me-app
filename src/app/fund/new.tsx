import { useMemo, useState } from "react";
import { View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import { Button, Card, Check, Chip, Choice, ErrorBox, Field, H2, H3, Label, Loading, Money, P, Row, Screen, Small } from "@/ui";
import { SignInPrompt } from "@/components/SignInPrompt";
import { TierCard } from "@/components/TierCard";
import { useCatalog } from "@/lib/catalog";
import { useMe } from "@/lib/me";
import { api, ApiError, errorMessage } from "@/lib/api";
import { decodeItems, priceLines } from "@/lib/kit";
import { useAuth } from "@/stores/auth";
import { useCart } from "@/stores/cart";
import { LAGOS_LGAS, OCCASIONS, POOL } from "@/shared/store";
import { NG_PHONE, isName, naira, normalizePhone } from "@/shared/format";
import { colors } from "@/theme";

const FOR = ["Me", "My mum", "My dad", "Our house", "My shop", "Our church", "Someone else"];

export default function NewPool() {
  const q = useLocalSearchParams<{ items?: string; kind?: string }>();
  const user = useAuth((s) => s.user);
  const cat = useCatalog();
  const me = useMe();
  const cartLines = useCart((s) => s.lines);
  const qc = useQueryClient();
  const items = useMemo(() => { const d = decodeItems(q.items); return d.length ? d : cartLines; }, [q.items, cartLines]);

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
        <H2>First, pick the kit</H2>
        <P>Choose a kit to fund. Most people start from these.</P>
        {cat.data.segments.flatMap((s) => s.tiers.filter((t) => t.best)).slice(0, 5).map((t) => <TierCard key={t.id} t={t} />)}
      </Screen>
    );

  const self = forWho === "Me";
  const perShare = Math.floor(subtotal / Math.max(1, shares.length));

  async function create() {
    if (busy) return;
    const e: Record<string, string> = {};
    if (!self && !isName(forName)) e.forName = "A first name is enough.";
    const phone = normalizePhone(d.recipientPhone || me.data?.user?.phone || "");
    if (!NG_PHONE.test(phone)) e.recipientPhone = "Enter the Nigerian number we should call for delivery.";
    if (!d.lga) e.lga = "Pick the LGA in Lagos.";
    if (d.address && d.address.replace(/\s/g, "").length < 8) e.address = "Enter the full address, or leave it for later.";
    if (kind === "squad" && (shares.length < POOL.squadMin || shares.length > POOL.squadMax)) e.shares = `A squad is ${POOL.squadMin} to ${POOL.squadMax} people.`;
    setErrors(e);
    if (Object.keys(e).length) return setFormError("Check the highlighted fields.");
    setBusy(true); setFormError("");
    try {
      const r = await api<{ id: string }>("/pools", {
        body: {
          items, kind, occasion, deadlineDays: days, forName: self ? undefined : forName.trim(),
          recipientName: self ? undefined : d.recipientName || forName.trim(), recipientPhone: phone, lga: d.lga, address: d.address, installer: d.installer,
          shares: kind === "squad" ? shares.map((n, i) => n.trim() || `Person ${i + 1}`) : undefined,
          ref: useCart.getState().ref ?? undefined,
        },
      });
      void qc.invalidateQueries({ queryKey: ["myOrders"] });
      router.replace({ pathname: "/fund/[id]", params: { id: r.id, created: "1" } });
    } catch (x) {
      if (x instanceof ApiError) setErrors(x.fields);
      setFormError(errorMessage(x));
    }
    setBusy(false);
  }

  return (
    <Screen edges={[]} footer={<>{formError ? <ErrorBox message={formError} /> : null}<Button title="Create the page" busy={busy} onPress={create} /></>}>
      <Card>
        <Row style={{ justifyContent: "space-between" }}><H3>The kit</H3><Money n={subtotal} /></Row>
        {lines.map((l) => <Small key={l.id}>{l.qty} × {l.p.name}</Small>)}
      </Card>

      <Row>
        <Choice title="Public page" sub="Anyone chips in any amount" on={kind === "public"} onPress={() => setKind("public")} />
        <Choice title="Squad split" sub="2–10 people, equal shares" on={kind === "squad"} onPress={() => setKind("squad")} />
      </Row>

      <Card>
        <Label>Who is it for?</Label>
        <Row style={{ flexWrap: "wrap" }}>{FOR.map((x) => <Chip small key={x} label={x} on={forWho === x} onPress={() => setForWho(x)} />)}</Row>
        {!self ? <Field label="Their first name" value={forName} onChangeText={(t) => { setForName(t); setErrors((e) => ({ ...e, forName: "" })); }} error={errors.forName} placeholder="Mama Tunde" /> : null}
        <Label>Occasion</Label>
        <Row style={{ flexWrap: "wrap" }}>{OCCASIONS.map((o) => <Chip small key={o.slug} label={o.label} on={occasion === o.slug} onPress={() => setOccasion(o.slug)} />)}</Row>
        <Label>Deadline</Label>
        <Row>{POOL.deadlineDays.map((n) => <Chip key={n} label={`${n} days`} on={days === n} onPress={() => setDays(n)} />)}</Row>
      </Card>

      {kind === "squad" ? (
        <Card>
          <Label>Who's in the squad?</Label>
          <Small>Each person gets an equal share of about {naira(perShare)} and their own pay button.</Small>
          {shares.map((n, i) => (
            <Row key={i} style={{ alignItems: "flex-end" }}>
              <View style={{ flex: 1 }}><Field label={`Person ${i + 1}`} value={n} onChangeText={(t) => setShares((a) => a.map((x, j) => (j === i ? t : x)))} placeholder={i === 0 ? "You" : "Name"} /></View>
              {shares.length > POOL.squadMin ? <Button small kind="ghost" title="Remove" onPress={() => setShares((a) => a.filter((_, j) => j !== i))} /> : null}
            </Row>
          ))}
          {shares.length < POOL.squadMax ? <Button small kind="ghost" title="Add a person" onPress={() => setShares((a) => [...a, ""])} /> : null}
          {errors.shares ? <Small style={{ color: colors.flare }}>{errors.shares}</Small> : null}
        </Card>
      ) : null}

      <Card>
        <H3>Delivery</H3>
        {!self ? <Field label="Who receives it (full name)" value={d.recipientName} onChangeText={(t) => setD({ ...d, recipientName: t })} placeholder={forName || "Their name"} /> : null}
        <Field label="Phone we call for delivery" value={d.recipientPhone} onChangeText={(t) => { setD({ ...d, recipientPhone: t }); setErrors((e) => ({ ...e, recipientPhone: "" })); }} error={errors.recipientPhone} keyboardType="phone-pad" placeholder={self ? me.data?.user?.phone || "0803 123 4567" : "0803 123 4567"} />
        <Label>LGA in Lagos</Label>
        <Row style={{ flexWrap: "wrap", gap: 6 }}>{LAGOS_LGAS.map((l) => <Chip small key={l} label={l} on={d.lga === l} onPress={() => { setD({ ...d, lga: l }); setErrors((e) => ({ ...e, lga: "" })); }} />)}</Row>
        {errors.lga ? <Small style={{ color: colors.flare }}>{errors.lga}</Small> : null}
        <Field label="Street address (can wait until it's funded)" value={d.address} onChangeText={(t) => setD({ ...d, address: t })} error={errors.address} />
        <Check label="They'll need an installer" on={d.installer} onPress={() => setD({ ...d, installer: !d.installer })} />
        <Small>The address and phone are never shown on the public page; only the LGA is.</Small>
      </Card>
    </Screen>
  );
}
