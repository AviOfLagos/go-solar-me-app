import { useRef, useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { WebView, type WebViewNavigation } from "react-native-webview";
import { router, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { SITE } from "@/lib/config";
import { asString } from "@/lib/kit";
import { colors, fonts } from "@/theme";

/** Where Paystack sends the buyer when they finish or cancel. We stop there and ask our server. */
const RETURNS = ["/checkout/success", "/fund/", "/gift-cards", "/account/cards"];
const isReturn = (url: string) => url.startsWith(SITE) && RETURNS.some((p) => url.slice(SITE.length).startsWith(p));

/** Paystack's secure page, inside the app. Closing it, finishing or cancelling all go to the result screen. */
export default function PayScreen() {
  const q = useLocalSearchParams<{ url: string; id: string; then?: string }>();
  const url = asString(q.url), id = asString(q.id);
  const done = useRef(false);
  const [loading, setLoading] = useState(true);

  const finish = () => {
    if (done.current) return;
    done.current = true;
    // Adding a card returns to the cards screen; everything else to the result screen.
    if (asString(q.then) === "cards") router.replace({ pathname: "/account/cards", params: { reference: id } });
    else router.replace({ pathname: "/success", params: { id } });
  };

  const onRequest = (r: { url: string }) => {
    if (isReturn(r.url)) { finish(); return false; }
    return true;
  };

  if (!url.startsWith("https://")) return null;
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.paper }} edges={["top", "bottom"]}>
      <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 12, height: 48, borderBottomWidth: 1, borderBottomColor: colors.line }}>
        <Ionicons name="lock-closed" size={16} color={colors.leaf} />
        <Text style={{ flex: 1, marginLeft: 6, fontFamily: fonts.sansSemiBold, color: colors.ink }}>Secure payment · Paystack</Text>
        <Pressable onPress={finish} hitSlop={12} accessibilityRole="button" accessibilityLabel="Close payment">
          <Ionicons name="close" size={26} color={colors.ink} />
        </Pressable>
      </View>
      <WebView
        source={{ uri: url }}
        onShouldStartLoadWithRequest={onRequest}
        onNavigationStateChange={(n: WebViewNavigation) => { if (isReturn(n.url)) finish(); }}
        onLoadEnd={() => setLoading(false)}
        setSupportMultipleWindows={false}
        javaScriptEnabled
        domStorageEnabled
        startInLoadingState
        style={{ flex: 1 }}
      />
      {loading ? <View style={{ position: "absolute", top: 120, left: 0, right: 0, alignItems: "center" }}><ActivityIndicator color={colors.ink} /></View> : null}
    </SafeAreaView>
  );
}
