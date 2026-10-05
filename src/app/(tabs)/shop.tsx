import { useMemo, useState } from "react";
import { FlatList, Pressable, RefreshControl, ScrollView, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button, Chip, ErrorBox, H1, Loading, P, Row, Small, s as ui } from "@/ui";
import { useProfile } from "@/stores/profile";
import { ProductRow } from "@/components/ProductRow";
import { useCatalog } from "@/lib/catalog";
import { useCart } from "@/stores/cart";
import { colors, fonts, space, TAB_SPACE } from "@/theme";

export default function Shop() {
  const cat = useCatalog();
  const [category, setCategory] = useState<string>("");
  const [brand, setBrand] = useState<string>("");
  const [q, setQ] = useState("");
  const count = useCart((st) => st.lines.reduce((n, l) => n + l.qty, 0));
  const pro = useProfile((st) => st.role) === "pro";
  const [brands, setBrands] = useState(false);

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
        contentContainerStyle={{ padding: space.md, gap: 10, paddingBottom: TAB_SPACE + (count ? 70 : 0) }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={cat.isRefetching} onRefresh={() => cat.refetch()} />}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={
          <View style={{ gap: 12, marginBottom: 6 }}>
            <H1>{pro ? "Catalogue" : "Shop"}</H1>
            {pro ? <Small>Tap + to add items to your list, then share it from the cart.</Small> : null}
            <Row style={{ backgroundColor: colors.paper, borderRadius: 16, paddingHorizontal: 16, minHeight: 50 }}>
              <Ionicons name="search" size={18} color={colors.mute} />
              <TextInput placeholder="Search 5kVA, lithium, EcoFlow…" placeholderTextColor={colors.mute} value={q} onChangeText={setQ} returnKeyType="search" autoCorrect={false}
                accessibilityLabel="Search" style={{ flex: 1, fontFamily: fonts.sansMedium, fontSize: 15, color: colors.ink, paddingVertical: 12 }} />
              <Pressable onPress={() => setBrands(!brands)} hitSlop={8} accessibilityRole="button" accessibilityLabel="Filter by brand">
                <Ionicons name="options-outline" size={20} color={brand || brands ? colors.ink : colors.mute} />
              </Pressable>
            </Row>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }} style={{ marginHorizontal: -space.md }} contentInset={{ left: space.md, right: space.md }}>
              <View style={{ width: space.md - 8 }} />
              <Chip small label="All" on={!category} onPress={() => setCategory("")} />
              {c.categories.map((x) => <Chip small key={x.slug} label={x.short} on={category === x.slug} onPress={() => setCategory(category === x.slug ? "" : x.slug)} />)}
              <View style={{ width: space.md - 8 }} />
            </ScrollView>
            {brands ? (
              <Row style={{ flexWrap: "wrap" }}>
                {c.brands.map((b) => <Chip small key={b.slug} label={b.name} on={brand === b.slug} onPress={() => setBrand(brand === b.slug ? "" : b.slug)} />)}
              </Row>
            ) : null}
            <Small>{list.length} product{list.length === 1 ? "" : "s"}</Small>
          </View>
        }
        ListEmptyComponent={<P>Nothing matches. Try fewer words or clear the filters.</P>}
        renderItem={({ item }) => <ProductRow p={item} c={c} />}
      />
      {count ? (
        <View style={{ position: "absolute", left: space.md, right: space.md, bottom: TAB_SPACE - 22 }}>
          <Button title={pro ? `Review and share list (${count})` : `View cart (${count})`} kind="sun" icon="arrow-forward" onPress={() => router.push("/cart")} style={{ shadowColor: colors.ink, shadowOpacity: 0.15, shadowRadius: 10, elevation: 4 }} />
        </View>
      ) : null}
    </SafeAreaView>
  );
}
