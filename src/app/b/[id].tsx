import { useEffect } from "react";
import { Stack, router, useLocalSearchParams } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { Button, Card, ErrorBox, H1, Loading, Money, P, Screen, Small } from "@/ui";
import { api } from "@/lib/api";
import { encodeItems } from "@/lib/kit";
import { useCart } from "@/stores/cart";

type Build = { id: string; title: string; note: string; author: string; store: { slug: string; name: string } | null; items: { id: string; name: string; qty: number; price: number }[]; total: number };

/** A kit someone (often an installer) put together and shared. */
export default function BuildScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const setRef = useCart((s) => s.setRef);
  const q = useQuery({ queryKey: ["build", id], queryFn: () => api<Build>(`/builds/${encodeURIComponent(id)}`, { auth: false }) });
  useEffect(() => { if (q.data?.store) setRef(q.data.store.slug); }, [q.data, setRef]);
  if (q.isPending) return <Screen edges={[]}><Loading /></Screen>;
  if (q.error) return <Screen edges={[]}><ErrorBox message={q.error.message} onRetry={() => q.refetch()} /></Screen>;
  const b = q.data;
  return (
    <Screen edges={[]}>
      <Stack.Screen options={{ title: "Shared kit" }} />
      <H1>{b.title || "A kit for you"}</H1>
      <Small>{b.store ? `From ${b.store.name}` : b.author ? `From ${b.author}` : ""}</Small>
      {b.note ? <P>{b.note}</P> : null}
      <Card>
        {b.items.map((i) => <P key={i.id}>{i.qty} × {i.name}</P>)}
        <Money n={b.total} style={{ fontSize: 20 }} />
      </Card>
      <Button title="Choose this kit" onPress={() => router.push({ pathname: "/kit", params: { items: encodeItems(b.items), name: b.title || "Shared kit" } })} />
    </Screen>
  );
}
