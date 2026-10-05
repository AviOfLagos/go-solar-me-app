import { useState } from "react";
import { View } from "react-native";
import { Image } from "expo-image";
import { Stack, router, useLocalSearchParams } from "expo-router";
import { Button, ErrorBox, H2, Loading, Money, P, Row, Screen, Small, Stepper, Tag } from "@/ui";
import { useProfile } from "@/stores/profile";
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
  const pro = useProfile((st) => st.role) === "pro";

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
        {pro ? (
          <Button title={added ? "Added to your list ✓" : "Add to list"} onPress={() => { add(p.id, qty); setAdded(true); }} />
        ) : (
          <Row>
            <Button style={{ flex: 1 }} kind="ghost" title={added ? "Added ✓" : "Add to cart"} onPress={() => { add(p.id, qty); setAdded(true); }} />
            <Button style={{ flex: 1 }} title="Buy now" onPress={() => router.push({ pathname: "/kit", params: { items: encodeItems([{ id: p.id, qty }]), name: brand } })} />
          </Row>
        )}
      </>
    }>
      <Stack.Screen options={{ title: brand }} />
      <View style={{ height: 280, backgroundColor: colors.paper, borderRadius: 28, overflow: "hidden", padding: 16 }}>
        <Image source={{ uri: p.image }} style={{ flex: 1 }} contentFit="contain" accessibilityLabel={p.name} />
      </View>
      <H2>{p.name}</H2>
      <Row style={{ alignItems: "baseline" }}>
        <Money n={p.price} style={{ fontSize: 24 }} />
        {promo ? <Small style={{ textDecorationLine: "line-through" }}>{naira(compareAt(cat.data, p.price))}</Small> : null}
      </Row>
      {promo ? <Small style={{ color: colors.leaf }}>{cat.data.promo.name} price, today only.</Small> : null}
      <Row style={{ flexWrap: "wrap" }}>
        {p.specs.map((x) => <Tag key={x} label={x} tone="line" />)}
      </Row>
      <P>{p.description}</P>
      <Small>Genuine {brand} stock. Free delivery in Lagos. Installation quoted after you order.</Small>
    </Screen>
  );
}
