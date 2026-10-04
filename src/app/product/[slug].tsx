import { useState } from "react";
import { View } from "react-native";
import { Image } from "expo-image";
import { Stack, router, useLocalSearchParams } from "expo-router";
import { Button, Card, ErrorBox, H2, Loading, Money, P, Row, Screen, Small, Stepper } from "@/ui";
import { compareAt, findProduct, inPromo, promoActive, useCatalog } from "@/lib/catalog";
import { encodeItems } from "@/lib/kit";
import { useCart } from "@/stores/cart";
import { naira } from "@/shared/format";
import { colors } from "@/theme";

export default function ProductScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const cat = useCatalog();
  const add = useCart((s) => s.add);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  if (cat.isPending) return <Screen edges={[]}><Loading /></Screen>;
  if (cat.error) return <Screen edges={[]}><ErrorBox message={cat.error.message} onRetry={() => cat.refetch()} /></Screen>;
  const p = findProduct(cat.data, slug);
  if (!p) return <Screen edges={[]}><ErrorBox message="This product isn't available any more." /></Screen>;
  const promo = promoActive(cat.data) && inPromo(cat.data, p);
  const brand = cat.data.brands.find((b) => b.slug === p.brand)?.name ?? p.brand;

  return (
    <Screen edges={[]} footer={
      <>
        <Row style={{ justifyContent: "space-between" }}>
          <Stepper value={qty} onChange={(n) => setQty(Math.max(1, Math.min(50, n)))} />
          <Money n={p.price * qty} style={{ fontSize: 20 }} />
        </Row>
        <Row>
          <Button style={{ flex: 1 }} kind="ghost" title={added ? "Added ✓" : "Add to cart"} onPress={() => { add(p.id, qty); setAdded(true); }} />
          <Button style={{ flex: 1 }} title="Buy now" onPress={() => router.push({ pathname: "/kit", params: { items: encodeItems([{ id: p.id, qty }]), name: brand } })} />
        </Row>
      </>
    }>
      <Stack.Screen options={{ title: brand }} />
      <View style={{ height: 260, backgroundColor: colors.paper, borderRadius: 16, overflow: "hidden" }}>
        <Image source={{ uri: p.image }} style={{ flex: 1 }} contentFit="contain" accessibilityLabel={p.name} />
      </View>
      <H2>{p.name}</H2>
      <Row style={{ alignItems: "baseline" }}>
        <Money n={p.price} style={{ fontSize: 24 }} />
        {promo ? <Small style={{ textDecorationLine: "line-through" }}>{naira(compareAt(cat.data, p.price))}</Small> : null}
      </Row>
      {promo ? <Small style={{ color: colors.leaf }}>{cat.data.promo.name} price, today only.</Small> : null}
      <Card>
        {p.specs.map((x) => <P key={x}>• {x}</P>)}
      </Card>
      <P>{p.description}</P>
      <Small>Genuine {brand} stock. Free delivery in Lagos. Installation quoted after you order.</Small>
    </Screen>
  );
}
