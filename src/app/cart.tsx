import { useEffect, useRef, useState } from "react";
import { Pressable, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Button, Card, Empty, ErrorBox, Loading, Money, P, ProductImage, Row, Screen, Small, Stepper } from "@/ui";
import { useCatalog } from "@/lib/catalog";
import { api, errorMessage } from "@/lib/api";
import { encodeItems, itemsLabel, priceLines } from "@/lib/kit";
import { useCart, type Line } from "@/stores/cart";
import { CART } from "@/shared/store";
import { colors, fonts } from "@/theme";
import { useProfile } from "@/stores/profile";
import { ShareList } from "@/components/ShareList";

export default function CartScreen() {
  const { resume } = useLocalSearchParams<{ resume?: string }>();
  const cat = useCatalog();
  const { lines: items, setQty, remove, replace } = useCart();
  const pro = useProfile((s) => s.role) === "pro";
  // "idle" | "busy" | "done" | an error message
  const [resumeState, setResume] = useState<string>(resume ? "busy" : "idle");
  const started = useRef<string | undefined>(undefined);

  // A resume link (/cart?resume=ID) brings back a saved cart.
  useEffect(() => {
    if (!resume || started.current === resume) return;
    started.current = resume;
    api<{ items: Line[] }>(`/leads/${encodeURIComponent(resume)}`, { auth: false })
      .then((r) => { replace(r.items); useCart.setState({ leadId: resume }); setResume("done"); })
      .catch((e) => setResume(errorMessage(e)));
  }, [resume, replace]);

  if (cat.isPending || resumeState === "busy") return <Screen edges={[]}><Loading /></Screen>;
  if (cat.error) return <Screen edges={[]}><ErrorBox message={cat.error.message} onRetry={() => cat.refetch()} /></Screen>;
  const { lines, subtotal } = priceLines(cat.data, items);
  const tooBig = subtotal > CART.maxTotal;

  if (!lines.length)
    return (
      <Screen edges={[]}>
        {resumeState !== "idle" && resumeState !== "done" ? <ErrorBox message={resumeState} /> : null}
        <Empty title={pro ? "Your list is empty" : "Your cart is empty"} text={pro ? "Tap + on items in the catalogue to build a list." : "Find the right kit in three quick questions."} action={<Button title={pro ? "Open the catalogue" : "Find my kit"} onPress={() => router.replace(pro ? "/(tabs)/shop" : "/find")} />} />
      </Screen>
    );

  return (
    <Screen edges={[]} footer={
      <>
        <Row style={{ justifyContent: "space-between" }}><Small style={{ fontFamily: fonts.sansSemiBold }}>{itemsLabel(items.reduce((n, l) => n + l.qty, 0))} · free Lagos delivery</Small><Money n={subtotal} style={{ fontSize: 20 }} /></Row>
        {tooBig ? <ErrorBox message="Orders this size are arranged on WhatsApp." /> : null}
        {pro ? <ShareList items={items} kind="ink" /> : (
          <Button title="Choose how to pay" icon="arrow-forward" disabled={tooBig} onPress={() => router.push({ pathname: "/kit", params: { items: encodeItems(items), name: "Your kit" } })} />
        )}
        {pro ? (
          <Small onPress={() => router.push({ pathname: "/kit", params: { items: encodeItems(items), name: "Your list" } })} style={{ textAlign: "center", color: colors.ink, fontFamily: fonts.sansSemiBold, paddingVertical: 6 }}>Or buy it yourself</Small>
        ) : null}
      </>
    }>
      {resumeState === "done" ? <Small style={{ color: colors.leaf }}>Welcome back. Your cart is restored.</Small> : null}
      {lines.map((l) => (
        <Card key={l.id}>
          <Row>
            <ProductImage uri={l.p.image} size={56} />
            <View style={{ flex: 1 }}><P numberOfLines={2}>{l.p.name}</P><Money n={l.total} style={{ fontSize: 14 }} /></View>
          </Row>
          <Row style={{ justifyContent: "space-between" }}>
            <Stepper value={l.qty} max={CART.maxQty} onChange={(n) => (n <= 0 ? remove(l.id) : setQty(l.id, n))} />
            <Pressable onPress={() => remove(l.id)} hitSlop={10} accessibilityRole="button"><Small style={{ color: colors.flare }}>Remove</Small></Pressable>
          </Row>
        </Card>
      ))}
      {!pro ? <ShareList items={items} /> : null}
    </Screen>
  );
}
