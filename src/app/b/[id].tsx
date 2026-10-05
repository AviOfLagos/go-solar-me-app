import { useEffect } from "react";
import { Text, View } from "react-native";
import { Stack, router, useLocalSearchParams } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { Button, Card, ErrorBox, Loading, Money, P, ProductImage, Row, Screen, Small } from "@/ui";
import { api } from "@/lib/api";
import { useCatalog, findProduct } from "@/lib/catalog";
import { encodeItems, itemsLabel } from "@/lib/kit";
import { useCart } from "@/stores/cart";
import { naira } from "@/shared/format";
import { colors, fonts } from "@/theme";

type Build = { id: string; title: string; note: string; author: string; store: { slug: string; name: string } | null; items: { id: string; name: string; qty: number; price: number }[]; total: number };

/** A list someone (often an installer) put together and shared. Prices are today's. */
export default function BuildScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const setRef = useCart((s) => s.setRef);
  const cat = useCatalog();
  const q = useQuery({ queryKey: ["build", id], queryFn: () => api<Build>(`/builds/${encodeURIComponent(id)}`, { auth: false }) });
  useEffect(() => { if (q.data?.store) setRef(q.data.store.slug); }, [q.data, setRef]);
  if (q.isPending) return <Screen edges={[]}><Loading /></Screen>;
  if (q.error) return <Screen edges={[]}><ErrorBox message={q.error.message} onRetry={() => q.refetch()} /></Screen>;
  const b = q.data;
  const from = b.store?.name || b.author;
  const count = b.items.reduce((n, i) => n + i.qty, 0);
  return (
    <Screen edges={[]} footer={<Button title="Choose how to pay" icon="arrow-forward" onPress={() => router.push({ pathname: "/kit", params: { items: encodeItems(b.items), name: b.title || "Shared list" } })} />}>
      <Stack.Screen options={{ title: "" }} />
      <View style={{ backgroundColor: colors.night, borderRadius: 28, padding: 22, gap: 8 }}>
        {from ? (
          <Row>
            <View style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: colors.mint, alignItems: "center", justifyContent: "center" }}>
              <Ionicons name="construct" size={15} color={colors.ink} />
            </View>
            <Small style={{ color: "#AEB8B1" }}>Put together by <Small style={{ color: colors.paper, fontFamily: fonts.sansBold }}>{from}</Small></Small>
          </Row>
        ) : null}
        <Text style={{ fontFamily: fonts.light, fontSize: 28, color: colors.paper, lineHeight: 34 }}>{b.title || "A solar list for you"}</Text>
        <Text style={{ fontFamily: fonts.light, fontSize: 38, color: colors.mint, letterSpacing: -1 }}>{naira(b.total)}</Text>
        <Small style={{ color: "#AEB8B1" }}>{itemsLabel(count)} · today's prices · free Lagos delivery</Small>
      </View>
      {b.note ? <Card style={{ backgroundColor: colors.lemonTint }}><P style={{ color: colors.ink }}>{b.note}</P></Card> : null}
      <Card>
        {b.items.map((i) => {
          const p = findProduct(cat.data, i.id);
          return (
            <Row key={i.id} style={{ paddingVertical: 4 }}>
              {p ? <ProductImage uri={p.image} size={48} /> : null}
              <View style={{ flex: 1 }}>
                <P numberOfLines={2} style={{ color: colors.ink }}>{i.name}</P>
                <Small>Qty {i.qty}</Small>
              </View>
              <Money n={i.price * i.qty} style={{ fontSize: 14 }} />
            </Row>
          );
        })}
      </Card>
      <Small style={{ textAlign: "center" }}>Pay in full, split it, let family chip in, or pay small small. You pick on the next screen.</Small>
    </Screen>
  );
}
