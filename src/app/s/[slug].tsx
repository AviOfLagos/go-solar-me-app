import { useEffect } from "react";
import { Linking } from "react-native";
import { Stack, router, useLocalSearchParams } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { Button, Card, ErrorBox, H1, H3, Loading, Money, P, Screen, Small } from "@/ui";
import { api } from "@/lib/api";
import { encodeItems } from "@/lib/kit";
import { useCart } from "@/stores/cart";

type StorePage = { slug: string; name: string; bio: string; kind: string; whatsapp: string; owner: string; builds: { id: string; title: string; note: string; items: { id: string; name: string; qty: number }[]; total: number }[] };

/** A seller's store. Opening it remembers the seller, so they earn on what this phone buys. */
export default function Store() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const setRef = useCart((s) => s.setRef);
  const q = useQuery({ queryKey: ["store", slug], queryFn: () => api<StorePage>(`/stores/${encodeURIComponent(slug)}`, { auth: false }) });
  useEffect(() => { if (q.data) setRef(q.data.slug); }, [q.data, setRef]);

  if (q.isPending) return <Screen edges={[]}><Loading /></Screen>;
  if (q.error) return <Screen edges={[]}><ErrorBox message={q.error.message} onRetry={() => q.refetch()} /></Screen>;
  const s = q.data;
  return (
    <Screen edges={[]}>
      <Stack.Screen options={{ title: s.name }} />
      <H1>{s.name}</H1>
      <P>{s.bio || `${s.owner}'s solar store. Genuine stock, free delivery in Lagos.`}</P>
      {s.whatsapp ? <Button title={`WhatsApp ${s.owner}`} kind="ghost" onPress={() => Linking.openURL(`https://wa.me/${s.whatsapp}`)} /> : null}
      <Button title="Shop all products" kind="ink" onPress={() => router.push("/(tabs)/shop")} />
      {s.builds.map((b) => (
        <Card key={b.id}>
          <H3>{b.title || "Recommended kit"}</H3>
          {b.note ? <P>{b.note}</P> : null}
          {b.items.map((i) => <Small key={i.id}>{i.qty} × {i.name}</Small>)}
          <Money n={b.total} />
          <Button title="Choose this kit" onPress={() => router.push({ pathname: "/kit", params: { items: encodeItems(b.items), name: b.title || s.name } })} />
        </Card>
      ))}
    </Screen>
  );
}
