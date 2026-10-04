import { useState } from "react";
import { Stack } from "expo-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button, Card, Choice, ErrorBox, Field, H3, Loading, Money, Notice, P, Row, Screen, Small } from "@/ui";
import { api, ApiError, errorMessage } from "@/lib/api";
import { shareLink } from "@/lib/share";
import { SITE } from "@/lib/config";
import { naira } from "@/shared/format";

type StoreData = {
  store: { slug: string; name: string; bio: string; kind: string; commission_bps: number; whatsapp: string } | null;
  stats?: { orders: number; sales: number; earned: number };
  recent?: { id: string; subtotal: number; commission: number; status: string; created_at: string }[];
};

export default function MyStore() {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["myStore"], queryFn: () => api<StoreData>("/me/store") });
  const [f, setF] = useState({ name: "", slug: "", bio: "", kind: "affiliate", whatsapp: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState(false);

  // Fill the form when the store loads (or changes on the server).
  const [loaded, setLoaded] = useState<unknown>(null);
  const loadedStore = q.data?.store;
  if (loadedStore && loaded !== loadedStore) {
    setLoaded(loadedStore);
    setF({ name: loadedStore.name, slug: loadedStore.slug, bio: loadedStore.bio, kind: loadedStore.kind, whatsapp: loadedStore.whatsapp ? `+${loadedStore.whatsapp}` : "" });
  }

  if (q.isPending) return <Screen edges={[]}><Loading /></Screen>;
  if (q.error) return <Screen edges={[]}><ErrorBox message={q.error.message} onRetry={() => q.refetch()} /></Screen>;
  const s = q.data.store;

  const save = async () => {
    setBusy(true); setErr(""); setMsg("");
    try {
      await api("/stores", { body: f });
      setMsg(s ? "Saved." : "Your store is live.");
      setEditing(false);
      void qc.invalidateQueries({ queryKey: ["myStore"] });
      void qc.invalidateQueries({ queryKey: ["me"] });
    } catch (x) { if (x instanceof ApiError) setErrors(x.fields); setErr(errorMessage(x)); }
    setBusy(false);
  };
  const set = (k: keyof typeof f) => (v: string) => { setF((x) => ({ ...x, [k]: v })); setErrors((e) => ({ ...e, [k]: "" })); };

  return (
    <Screen edges={[]}>
      <Stack.Screen options={{ title: s ? "My store" : "Sell & earn" }} />
      {msg ? <Notice tone="leaf">{msg}</Notice> : null}
      {s && !editing ? (
        <>
          <Card>
            <H3>{s.name}</H3>
            <Small>{SITE.replace(/^https?:\/\//, "")}/s/{s.slug}</Small>
            <P>You earn {(s.commission_bps / 100).toFixed(1)}% of every kit sold through your link, once it's delivered.</P>
            <Button title="Share my store" kind="ink" onPress={() => shareLink(`Get genuine solar kits delivered in Lagos through my store:`, `/s/${s.slug}`)} />
            <Button title="Edit store" kind="ghost" small onPress={() => setEditing(true)} />
          </Card>
          <Row>
            <Card style={{ flex: 1 }}><Small>Orders</Small><H3>{q.data.stats?.orders ?? 0}</H3></Card>
            <Card style={{ flex: 1 }}><Small>Sales</Small><Money n={q.data.stats?.sales ?? 0} /></Card>
            <Card style={{ flex: 1 }}><Small>Earned</Small><Money n={q.data.stats?.earned ?? 0} /></Card>
          </Row>
          {(q.data.recent ?? []).map((o) => (
            <Row key={o.id} style={{ justifyContent: "space-between" }}><Small>{o.id} · {o.status.replace(/_/g, " ")}</Small><Small>{naira(o.commission)}</Small></Row>
          ))}
        </>
      ) : (
        <Card>
          {!s ? <P>Open a free store, share your link, and earn on every kit your link sells. Installers can also send customers ready-made kits.</P> : null}
          <Row>
            <Choice title="I share links" sub="Affiliate" on={f.kind === "affiliate"} onPress={() => set("kind")("affiliate")} />
            <Choice title="I install solar" sub="Installer" on={f.kind === "installer"} onPress={() => set("kind")("installer")} />
          </Row>
          <Field label="Store name" value={f.name} onChangeText={set("name")} error={errors.name} />
          <Field label="Link name" value={f.slug} onChangeText={(t) => set("slug")(t.toLowerCase().replace(/[^a-z0-9-]/g, "-"))} error={errors.slug} autoCapitalize="none" hint={`${SITE.replace(/^https?:\/\//, "")}/s/${f.slug || "your-name"}`} />
          <Field label="About (optional)" value={f.bio} onChangeText={set("bio")} maxLength={300} multiline />
          <Field label="WhatsApp (optional)" value={f.whatsapp} onChangeText={set("whatsapp")} error={errors.whatsapp} keyboardType="phone-pad" />
          {err ? <ErrorBox message={err} /> : null}
          <Button title={s ? "Save" : "Open my store"} kind="ink" busy={busy} onPress={save} />
        </Card>
      )}
    </Screen>
  );
}
