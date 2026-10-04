import { View } from "react-native";
import { router } from "expo-router";
import { Button, Card, H3, Money, P, Row, Small } from "@/ui";
import { colors, fonts } from "@/theme";
import { naira } from "@/shared/format";
import { installedRange } from "@/lib/catalog";
import { encodeItems } from "@/lib/kit";
import type { Tier } from "@/lib/types";

export function TierCard({ t, who }: { t: Tier; who?: string }) {
  const range = installedRange(t);
  return (
    <Card highlight={t.best}>
      {t.best ? (
        <View style={{ alignSelf: "flex-start", backgroundColor: colors.sun, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3 }}>
          <Small style={{ color: colors.ink, fontFamily: fonts.sansBold }}>Most picked</Small>
        </View>
      ) : null}
      <H3>{t.name}</H3>
      <P>{t.tagline}</P>
      <Small>Runs: {t.powers.join(" · ")}</Small>
      <Row style={{ justifyContent: "space-between" }}>
        <Money n={t.price} style={{ fontSize: 20 }} />
        <Small>{t.kw} kW · {t.kwh} kWh</Small>
      </Row>
      <Small>{range ? `Installed: about ${naira(range[0])} – ${naira(range[1])}` : "No installation needed"}</Small>
      <Button title="Choose this kit" onPress={() => router.push({ pathname: "/kit", params: { items: encodeItems(t.items), name: t.name, who: who ?? "me" } })} />
    </Card>
  );
}
