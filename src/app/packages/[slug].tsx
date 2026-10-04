import { Stack, useLocalSearchParams } from "expo-router";
import { ErrorBox, H2, Loading, P, Screen } from "@/ui";
import { TierCard } from "@/components/TierCard";
import { useCatalog } from "@/lib/catalog";

export default function PackagesScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const cat = useCatalog();
  if (cat.isPending) return <Screen edges={[]}><Loading /></Screen>;
  if (cat.error) return <Screen edges={[]}><ErrorBox message={cat.error.message} onRetry={() => cat.refetch()} /></Screen>;
  const sg = cat.data.segments.find((x) => x.slug === slug);
  if (!sg) return <Screen edges={[]}><ErrorBox message="This package list doesn't exist." /></Screen>;
  return (
    <Screen edges={[]}>
      <Stack.Screen options={{ title: sg.short }} />
      <H2>{sg.name}</H2>
      <P>{sg.who}</P>
      <P style={{ fontStyle: "italic" }}>{sg.worry}</P>
      {sg.tiers.map((t) => <TierCard key={t.id} t={t} />)}
    </Screen>
  );
}
