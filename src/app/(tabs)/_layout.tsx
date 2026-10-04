import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { View, type ColorValue } from "react-native";
import { colors, fonts } from "@/theme";
import { useCart } from "@/stores/cart";

type IconName = keyof typeof Ionicons.glyphMap;
function icon(name: IconName) {
  return function TabIcon({ color, size }: { color: ColorValue; size: number }) {
    return <Ionicons name={name} size={size} color={color as string} />;
  };
}

export default function TabLayout() {
  const count = useCart((s) => s.lines.reduce((n, l) => n + l.qty, 0));
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.ink,
        tabBarInactiveTintColor: colors.mute,
        tabBarLabelStyle: { fontFamily: fonts.sansMedium, fontSize: 11 },
        tabBarStyle: { backgroundColor: colors.paper, borderTopColor: colors.line },
      }}
    >
      <Tabs.Screen name="index" options={{ title: "Home", tabBarIcon: icon("sunny-outline") }} />
      <Tabs.Screen
        name="shop"
        options={{ title: "Shop", tabBarIcon: icon("storefront-outline"), tabBarBadge: count ? (count > 99 ? "99+" : count) : undefined, tabBarBadgeStyle: { backgroundColor: colors.sun, color: colors.ink } }}
      />
      <Tabs.Screen
        name="go-solar-me"
        options={{
          title: "Go Solar Me",
          tabBarIcon: ({ size }) => (
            <View style={{ backgroundColor: colors.sun, borderRadius: 14, paddingHorizontal: 12, paddingVertical: 3 }}>
              <Ionicons name="people" size={size - 2} color={colors.ink} />
            </View>
          ),
        }}
      />
      <Tabs.Screen name="orders" options={{ title: "Orders", tabBarIcon: icon("cube-outline") }} />
      <Tabs.Screen name="me" options={{ title: "Me", tabBarIcon: icon("person-circle-outline") }} />
    </Tabs>
  );
}
