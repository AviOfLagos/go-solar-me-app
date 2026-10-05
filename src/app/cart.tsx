import { useEffect, useRef, useState } from "react";
import { Pressable, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Button, Card, Empty, ErrorBox, Loading, Money, P, ProductImage, Row, Screen, Small, Stepper } from "@/ui";
import { useCatalog } from "@/lib/catalog";
import { api, errorMessage } from "@/lib/api";
import { encodeItems, priceLines } from "@/lib/kit";
import { useCart, type Line } from "@/stores/cart";
import { CART } from "@/shared/store";
import { colors } from "@/theme";
import { ShareList } from "@/components/ShareList";

export default function CartScreen() {
  const { resume } = useLocalSearchParams<{ resume?: string }>();
  const cat = useCatalog();
  const { lines: items, setQty, remove, replace } = useCart();
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
        <Empty title="Your cart is empty" text="The calculator picks a kit in a few taps." action={<Button title="Pick a kit" onPress={() => router.replace("/(tabs)")} />} />
      </Screen>
    );

  return (
    <Screen edges={[]} footer={
      <>
        <Row style={{ justifyContent: "space-between" }}><P>Subtotal · free Lagos delivery</P><Money n={subtotal} style={{ fontSize: 20 }} /></Row>
        {tooBig ? <ErrorBox message="Orders this size are arranged on WhatsApp." /> : null}
        <Row>
          <Button style={{ flex: 1 }} kind="ghost" title="Other ways to pay" disabled={tooBig} onPress={() => router.push({ pathname: "/kit", params: { items: encodeItems(items), name: "Your cart" } })} />
          <Button style={{ flex: 1 }} title="Checkout" disabled={tooBig} onPress={() => router.push("/checkout")} />
        </Row>
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
      <ShareList items={items} />
    </Screen>
  );
}
