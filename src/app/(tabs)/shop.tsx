import { useMemo, useState } from "react";
import { FlatList, RefreshControl, View } from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button, Chip, ErrorBox, Field, H1, Loading, P, Row, Small, s as ui } from "@/ui";
import { ProductRow } from "@/components/ProductRow";
import { useCatalog } from "@/lib/catalog";
import { useCart } from "@/stores/cart";
import { colors, space } from "@/theme";

export default function Shop() {
  const cat = useCatalog();
  const [category, setCategory] = useState<string>("");
  const [brand, setBrand] = useState<string>("");
  const [q, setQ] = useState("");
  const count = useCart((st) => st.lines.reduce((n, l) => n + l.qty, 0));

  const list = useMemo(() => {
    const words = q.trim().toLowerCase().split(/\s+/).filter(Boolean);
    return (cat.data?.products ?? []).filter((p) =>
      (!category || p.category === category) && (!brand || p.brand === brand) &&
      words.every((w) => `${p.name} ${p.brand} ${p.specs.join(" ")} ${p.category}`.toLowerCase().includes(w)));
  }, [cat.data, category, brand, q]);

  if (cat.isPending) return <SafeAreaView style={ui.screen}><Loading /></SafeAreaView>;
  if (cat.error) return <SafeAreaView style={[ui.screen, { padding: space.md }]}><ErrorBox message={cat.error.message} onRetry={() => cat.refetch()} /></SafeAreaView>;
  const c = cat.data;

  return (
    <SafeAreaView style={ui.screen} edges={["top"]}>
      <FlatList
        data={list}
        keyExtractor={(p) => p.id}
        contentContainerStyle={{ padding: space.md, gap: space.sm, paddingBottom: count ? 96 : space.xl }}
        refreshControl={<RefreshControl refreshing={cat.isRefetching} onRefresh={() => cat.refetch()} />}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={
          <View style={{ gap: space.sm, marginBottom: space.sm }}>
            <H1>Shop</H1>
            <Field label="Search" placeholder="5kVA, lithium, EcoFlow…" value={q} onChangeText={setQ} returnKeyType="search" autoCorrect={false} />
            <Row style={{ flexWrap: "wrap" }}>
              <Chip small label="All" on={!category} onPress={() => setCategory("")} />
              {c.categories.map((x) => <Chip small key={x.slug} label={x.short} on={category === x.slug} onPress={() => setCategory(category === x.slug ? "" : x.slug)} />)}
            </Row>
            <Row style={{ flexWrap: "wrap" }}>
              {c.brands.map((b) => <Chip small key={b.slug} label={b.name} on={brand === b.slug} onPress={() => setBrand(brand === b.slug ? "" : b.slug)} />)}
            </Row>
            <Small>{list.length} product{list.length === 1 ? "" : "s"}</Small>
          </View>
        }
        ListEmptyComponent={<P>Nothing matches. Try fewer words or clear the filters.</P>}
        renderItem={({ item }) => <ProductRow p={item} c={c} />}
      />
      {count ? (
        <View style={{ position: "absolute", left: space.md, right: space.md, bottom: space.md }}>
          <Button title={`View cart (${count})`} kind="ink" onPress={() => router.push("/cart")} style={{ shadowColor: colors.ink, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 }} />
        </View>
      ) : null}
    </SafeAreaView>
  );
}
