import { Pressable, Text, View } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Money, ProductImage, Small } from "@/ui";
import { naira } from "@/shared/format";
import { compareAt, inPromo, promoActive } from "@/lib/catalog";
import { useCart } from "@/stores/cart";
import type { Catalog, Product } from "@/lib/types";
import { colors, fonts } from "@/theme";

/** A product with a quick "+" so lists can be built without opening every item. */
export function ProductRow({ p, c }: { p: Product; c: Catalog }) {
  const promo = promoActive(c) && inPromo(c, p);
  const qty = useCart((s) => s.lines.find((l) => l.id === p.id)?.qty ?? 0);
  const add = useCart((s) => s.add);
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 8, padding: 10, borderRadius: 24, backgroundColor: colors.paper }}>
    <Pressable
      accessibilityRole="button"
      onPress={() => router.push({ pathname: "/product/[slug]", params: { slug: p.slug } })}
      style={({ pressed }) => ({ flex: 1, flexDirection: "row", gap: 12, alignItems: "center", opacity: pressed ? 0.8 : 1 })}
    >
      <ProductImage uri={p.image} size={76} />
      <View style={{ flex: 1, gap: 3 }}>
        <Text numberOfLines={2} style={{ fontFamily: fonts.sansSemiBold, fontSize: 15, color: colors.ink }}>{p.name}</Text>
        <Small numberOfLines={1}>{p.specs.slice(0, 2).join(" · ")}</Small>
        <View style={{ flexDirection: "row", gap: 8, alignItems: "baseline" }}>
          <Money n={p.price} style={{ fontSize: 15 }} />
          {promo ? <Small style={{ textDecorationLine: "line-through" }}>{naira(compareAt(c, p.price))}</Small> : null}
        </View>
      </View>
    </Pressable>
      <Pressable onPress={() => add(p.id)} hitSlop={8} accessibilityRole="button" accessibilityLabel={`Add ${p.name}`}
        style={({ pressed }) => ({ width: 42, height: 42, borderRadius: 21, alignItems: "center", justifyContent: "center", backgroundColor: qty ? colors.ink : colors.mint, transform: [{ scale: pressed ? 0.92 : 1 }] })}>
        {qty ? <Text style={{ fontFamily: fonts.sansBold, color: colors.mint }}>{qty}</Text> : <Ionicons name="add" size={22} color={colors.ink} />}
      </Pressable>
    </View>
  );
}
