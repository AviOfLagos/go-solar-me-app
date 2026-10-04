import { Linking, RefreshControl, View } from "react-native";
import { router } from "expo-router";
import { Button, Card, Empty, ErrorBox, H1, Loading, Money, P, Row, Screen, Small } from "@/ui";
import { SignInPrompt } from "@/components/SignInPrompt";
import { useMine } from "@/lib/pools";
import { sharePicture } from "@/lib/share";
import { SITE, waLink } from "@/lib/config";
import { useAuth } from "@/stores/auth";
import { colors } from "@/theme";

const SHAREABLE = ["pending", "confirmed", "out_for_delivery", "delivered", "installed"];
const STEPS = ["pending", "confirmed", "out_for_delivery", "delivered", "installed"];

export default function Orders() {
  const user = useAuth((s) => s.user);
  const mine = useMine();
  if (!user) return <Screen><H1>Orders</H1><SignInPrompt text="Sign in to track your orders. Paid as a guest? Sign in with the same email and they'll show here." /></Screen>;
  if (mine.isPending) return <Screen><Loading /></Screen>;
  if (mine.error) return <Screen><ErrorBox message={mine.error.message} onRetry={() => mine.refetch()} /></Screen>;
  const orders = mine.data.orders;
  return (
    <Screen refreshControl={<RefreshControl refreshing={mine.isRefetching} onRefresh={() => mine.refetch()} />}>
      <H1>Orders</H1>
      {!orders.length ? <Empty title="No orders yet" text="Your kits show here once paid." action={<Button title="Pick a kit" onPress={() => router.push("/(tabs)")} />} /> : orders.map((o) => {
        const step = STEPS.indexOf(o.status);
        return (
          <Card key={o.id}>
            <Row style={{ justifyContent: "space-between" }}>
              <P style={{ color: colors.ink }}>{o.id}</P>
              <Money n={o.total_paid + o.gift_card_used} />
            </Row>
            <Small>{new Date(o.created_at).toLocaleDateString()} · {o.delivery.lga}{o.recipient ? ` · for ${o.recipient.name}` : ""}{o.pool_id ? " · Go Solar Me" : ""}</Small>
            {step >= 0 ? (
              <Row style={{ gap: 4 }}>{STEPS.map((x, i) => <View key={x} style={{ flex: 1, height: 6, borderRadius: 3, backgroundColor: i <= step ? colors.leaf : colors.line }} />)}</Row>
            ) : null}
            <P>{o.statusLabel}{o.pool_id && !o.delivery.address ? " · add the delivery address on your Go Solar Me page" : ""}</P>
            {o.items.map((i) => <Small key={i.id}>{i.qty} × {i.name}</Small>)}
            <Row>
              {SHAREABLE.includes(o.status) ? <Button small kind="ghost" title={o.status === "installed" ? "Share: lights on" : "Share"} onPress={() => sharePicture("order", o.id, o.status === "installed" ? "Lights on! I went solar." : "I'm going solar!", `${SITE}/`)} /> : null}
              <Button small kind="ghost" title="Get help" onPress={() => Linking.openURL(waLink(`Hi, about my order ${o.id}`))} />
            </Row>
          </Card>
        );
      })}
    </Screen>
  );
}
