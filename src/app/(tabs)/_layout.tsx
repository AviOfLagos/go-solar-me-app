import type { ComponentProps } from "react";
import { Pressable, Text, View } from "react-native";
import { Redirect, Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, fonts } from "@/theme";
import { useCart } from "@/stores/cart";
import { useProfile } from "@/stores/profile";

type IconName = keyof typeof Ionicons.glyphMap;
type BarProps = Parameters<NonNullable<ComponentProps<typeof Tabs>["tabBar"]>>[0];

const ICONS: Record<string, [IconName, IconName]> = {
  index: ["home-outline", "home"],
  shop: ["grid-outline", "grid"],
  "go-solar-me": ["people-outline", "people"],
  orders: ["cube-outline", "cube"],
  me: ["person-outline", "person"],
};

/** A floating pill: the active tab grows into a dark pill with its name, the rest are icons. */
function FloatingBar({ state, descriptors, navigation, visible, badge }: BarProps & { visible: string[]; badge: number }) {
  const insets = useSafeAreaInsets();
  return (
    <View pointerEvents="box-none" style={{ position: "absolute", left: 0, right: 0, bottom: Math.max(insets.bottom, 12), alignItems: "center" }}>
      <View style={{
        flexDirection: "row", gap: 4, padding: 6, borderRadius: 999, backgroundColor: colors.paper,
        shadowColor: "#17201B", shadowOpacity: 0.12, shadowRadius: 18, shadowOffset: { width: 0, height: 6 }, elevation: 10,
      }}>
        {state.routes.filter((r) => visible.includes(r.name)).map((route) => {
          const focused = state.routes[state.index]?.key === route.key;
          const title = (descriptors[route.key]?.options.title ?? route.name) as string;
          const [off, on] = ICONS[route.name] ?? ["ellipse-outline", "ellipse"];
          const press = () => {
            const e = navigation.emit({ type: "tabPress", target: route.key, canPreventDefault: true });
            if (!focused && !e.defaultPrevented) navigation.navigate(route.name);
          };
          return (
            <Pressable key={route.key} onPress={press} accessibilityRole="tab" accessibilityState={{ selected: focused }} accessibilityLabel={title}
              style={{ flexDirection: "row", alignItems: "center", gap: 8, height: 52, paddingHorizontal: focused ? 18 : 15, borderRadius: 999, backgroundColor: focused ? colors.ink : "transparent" }}>
              <View>
                <Ionicons name={focused ? on : off} size={22} color={focused ? colors.mint : colors.ink2} />
                {route.name === "shop" && badge > 0 ? (
                  <View style={{ position: "absolute", top: -4, right: -8, minWidth: 18, height: 18, borderRadius: 9, backgroundColor: colors.mint, alignItems: "center", justifyContent: "center", paddingHorizontal: 4, borderWidth: 2, borderColor: focused ? colors.ink : colors.paper }}>
                    <Text style={{ fontFamily: fonts.sansBold, fontSize: 10, color: colors.ink }}>{badge > 99 ? "99+" : badge}</Text>
                  </View>
                ) : null}
              </View>
              {focused ? <Text style={{ fontFamily: fonts.sansBold, fontSize: 14, color: colors.paper }}>{title}</Text> : null}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

/**
 * Four tabs at most (see docs/DESIGN.md). Home changes with the role picked at the start; people
 * raising money find Go Solar Me on Home, everyone else reaches it from the kit's ways to pay.
 */
export default function TabLayout() {
  const count = useCart((s) => s.lines.reduce((n, l) => n + l.qty, 0));
  const { onboarded, role } = useProfile();
  if (!onboarded) return <Redirect href="/welcome" />;
  const visible = ["index", "shop", "orders", "me"];
  return (
    <Tabs screenOptions={{ headerShown: false }} tabBar={(p) => <FloatingBar {...p} visible={visible} badge={count} />}>
      <Tabs.Screen name="index" options={{ title: role === "pro" ? "Lists" : "Home" }} />
      <Tabs.Screen name="shop" options={{ title: role === "pro" ? "Catalogue" : "Shop" }} />
      <Tabs.Screen name="go-solar-me" options={{ title: "Go Solar Me", href: null }} />
      <Tabs.Screen name="orders" options={{ title: "Orders" }} />
      <Tabs.Screen name="me" options={{ title: "Me" }} />
    </Tabs>
  );
}
