import { Linking, Pressable, View } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Button, Card, H1, P, Screen, Small } from "@/ui";
import { useMe } from "@/lib/me";
import { unregisterPush } from "@/lib/push";
import { signOutGoogle } from "@/lib/signin";
import { waLink } from "@/lib/config";
import { useAuth } from "@/stores/auth";
import { useProfile } from "@/stores/profile";
import { roleTitle } from "@/lib/roles";
import { colors, fonts } from "@/theme";

type IconName = keyof typeof Ionicons.glyphMap;

function Item({ icon, title, sub, onPress }: { icon: IconName; title: string; sub?: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" style={({ pressed }) => ({ flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 12, opacity: pressed ? 0.6 : 1 })}>
      <Ionicons name={icon} size={22} color={colors.ink} />
      <View style={{ flex: 1 }}>
        <P style={{ fontFamily: fonts.sansSemiBold, color: colors.ink }}>{title}</P>
        {sub ? <Small>{sub}</Small> : null}
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.mute} />
    </Pressable>
  );
}

export default function MeTab() {
  const user = useAuth((s) => s.user);
  const me = useMe();
  const store = me.data?.store;
  const role = useProfile((s) => s.role);

  const signOut = async () => {
    await unregisterPush();
    await signOutGoogle();
    await useAuth.getState().signOut();
  };

  return (
    <Screen>
      <H1>{user ? `Hi, ${user.name.split(" ")[0] || "there"}` : "Me"}</H1>
      {user ? <Small>{user.email}</Small> : (
        <Card>
          <P>Sign in to save cards and addresses, track orders and start Go Solar Me pages. You can buy and chip in without an account.</P>
          <Button title="Sign in or create account" kind="ink" onPress={() => router.push("/sign-in")} />
        </Card>
      )}
      <Card style={{ gap: 0 }}>
        <Item icon="compass-outline" title="I'm here to…" sub={roleTitle(role)} onPress={() => router.push({ pathname: "/welcome", params: { step: "role" } })} />
        {user ? <Item icon="person-outline" title="Profile" sub="Name and phone" onPress={() => router.push("/account/profile")} /> : null}
        {user ? <Item icon="card-outline" title="Saved cards" sub="Name, remove or add cards" onPress={() => router.push("/account/cards")} /> : null}
        <Item icon="ticket-outline" title="Gift cards" sub="Buy one or check a balance" onPress={() => router.push("/gift-cards")} />
        <Item icon="calendar-outline" title="Pay small small" sub="Spread the cost with a partner lender" onPress={() => router.push("/pay-small-small")} />
        {user ? <Item icon="storefront-outline" title={store ? "My store" : "Sell & earn"} sub={store ? `/s/${store.slug}` : "Earn on every kit sold through your link"} onPress={() => router.push("/account/store")} /> : null}
        <Item icon="logo-whatsapp" title="Help on WhatsApp" sub="A real person replies" onPress={() => Linking.openURL(waLink("Hi, I need help with the Go Solar Me app"))} />
      </Card>
      {user ? <Button title="Sign out" kind="ghost" onPress={signOut} /> : null}
    </Screen>
  );
}
