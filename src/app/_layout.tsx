import { useCallback, useEffect, useState } from "react";
import { Platform, View } from "react-native";
import { Stack } from "expo-router";
import { QueryClientProvider } from "@tanstack/react-query";
import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import * as Notifications from "expo-notifications";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import {
  Manrope_300Light, Manrope_400Regular, Manrope_500Medium, Manrope_600SemiBold, Manrope_700Bold,
} from "@expo-google-fonts/manrope";
import { queryClient } from "@/lib/query";
import { useAuth } from "@/stores/auth";
import { useProfile } from "@/stores/profile";
import { openFromPush, registerForPush } from "@/lib/push";
import { colors, fonts } from "@/theme";
import { AppSplash } from "@/components/AppSplash";

void SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Manrope_300Light, Manrope_400Regular, Manrope_500Medium, Manrope_600SemiBold, Manrope_700Bold,
  });
  const authReady = useAuth((s) => s.ready);
  const hydrated = useProfile((s) => s.hydrated);
  const ready = authReady && hydrated;
  const user = useAuth((s) => s.user);

  useEffect(() => { void useAuth.getState().boot(); }, []);
  useEffect(() => {
    if ((fontsLoaded || fontError) && ready) void SplashScreen.hideAsync();
  }, [fontsLoaded, fontError, ready]);

  // Keep this phone registered for pushes while signed in.
  useEffect(() => { if (user) void registerForPush(); }, [user]);

  // Open the right screen when a push is tapped (also when it launched the app).
  useEffect(() => {
    if (Platform.OS === "web") return;
    const last = Notifications.getLastNotificationResponse();
    if (last) openFromPush(last.notification.request.content.data);
    const sub = Notifications.addNotificationResponseReceivedListener((r) => openFromPush(r.notification.request.content.data));
    return () => sub.remove();
  }, []);

  const [splash, setSplash] = useState(true);
  const hideSplash = useCallback(() => setSplash(false), []);
  if ((!fontsLoaded && !fontError) || !ready) return null;

  return (
    <SafeAreaProvider>
      <View style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <StatusBar style="dark" />
        <Stack
          screenOptions={{
            headerTintColor: colors.ink,
            headerTitleStyle: { fontFamily: fonts.sansBold, fontSize: 17 },
            headerStyle: { backgroundColor: colors.haze },
            headerShadowVisible: false,
            headerBackButtonDisplayMode: "minimal",
            contentStyle: { backgroundColor: colors.haze },
          }}
        >
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="welcome" options={{ headerShown: false, animation: "fade" }} />
          <Stack.Screen name="pay" options={{ presentation: "fullScreenModal", headerShown: false, gestureEnabled: false }} />
          <Stack.Screen name="success" options={{ headerShown: false, gestureEnabled: false }} />
          <Stack.Screen name="sign-in" options={{ presentation: "modal", title: "Sign in" }} />
          <Stack.Screen name="find" options={{ headerShown: false }} />
          <Stack.Screen name="checkout/index" options={{ title: "Checkout" }} />
          <Stack.Screen name="checkout/success" options={{ headerShown: false }} />
          <Stack.Screen name="fund/new" options={{ title: "Start a page" }} />
          <Stack.Screen name="fund/[id]" options={{ title: "Go Solar Me" }} />
          <Stack.Screen name="kit" options={{ title: "" }} />
          <Stack.Screen name="cart" options={{ title: "Your list" }} />
          <Stack.Screen name="product/[slug]" options={{ title: "" }} />
          <Stack.Screen name="packages/[slug]" options={{ title: "" }} />
          <Stack.Screen name="b/[id]" options={{ title: "Shared list" }} />
          <Stack.Screen name="s/[slug]" options={{ title: "" }} />
          <Stack.Screen name="gift-cards" options={{ title: "Gift cards" }} />
          <Stack.Screen name="pay-small-small" options={{ title: "Pay small small" }} />
          <Stack.Screen name="reset" options={{ title: "Reset password" }} />
          <Stack.Screen name="account/profile" options={{ title: "Profile" }} />
          <Stack.Screen name="account/cards" options={{ title: "Saved cards" }} />
          <Stack.Screen name="account/store" options={{ title: "My store" }} />
        </Stack>
      </QueryClientProvider>
      {splash ? <AppSplash onDone={hideSplash} /> : null}
      </View>
    </SafeAreaProvider>
  );
}
