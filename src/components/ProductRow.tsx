import { Pressable, View } from "react-native";
import { router } from "expo-router";
import { Money, P, ProductImage, Small } from "@/ui";
import { colors } from "@/theme";
import { naira } from "@/shared/format";
import { compareAt, inPromo, promoActive } from "@/lib/catalog";
import type { Catalog, Product } from "@/lib/types";

export function ProductRow({ p, c }: { p: Product; c: Catalog }) {
  const promo = promoActive(c) && inPromo(c, p);
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => router.push({ pathname: "/product/[slug]", params: { slug: p.slug } })}
      style={({ pressed }) => ({ flexDirection: "row", gap: 12, padding: 12, borderRadius: 14, backgroundColor: pressed ? colors.sunTint : colors.paper, borderWidth: 1, borderColor: colors.line })}
    >
      <ProductImage uri={p.image} size={72} />
      <View style={{ flex: 1, gap: 2 }}>
        <P numberOfLines={2} style={{ color: colors.ink }}>{p.name}</P>
        <Small numberOfLines={1}>{p.specs.slice(0, 3).join(" · ")}</Small>
        <View style={{ flexDirection: "row", gap: 8, alignItems: "baseline" }}>
          <Money n={p.price} />
          {promo ? <Small style={{ textDecorationLine: "line-through" }}>{naira(compareAt(c, p.price))}</Small> : null}
        </View>
      </View>
    </Pressable>
  );
}
