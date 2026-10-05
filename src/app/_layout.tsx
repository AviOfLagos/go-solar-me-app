import { Platform } from "react-native";
import { useEffect } from "react";
import { Stack } from "expo-router";
import { QueryClientProvider } from "@tanstack/react-query";
import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import * as Notifications from "expo-notifications";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { BricolageGrotesque_600SemiBold, BricolageGrotesque_800ExtraBold } from "@expo-google-fonts/bricolage-grotesque";
import {
  InstrumentSans_400Regular, InstrumentSans_500Medium, InstrumentSans_600SemiBold, InstrumentSans_700Bold,
} from "@expo-google-fonts/instrument-sans";
import { queryClient } from "@/lib/query";
import { useAuth } from "@/stores/auth";
import { useProfile } from "@/stores/profile";
import { openFromPush, registerForPush } from "@/lib/push";
import { colors, fonts } from "@/theme";

void SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    BricolageGrotesque_600SemiBold, BricolageGrotesque_800ExtraBold,
    InstrumentSans_400Regular, InstrumentSans_500Medium, InstrumentSans_600SemiBold, InstrumentSans_700Bold,
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

  if ((!fontsLoaded && !fontError) || !ready) return null;

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <StatusBar style="dark" />
        <Stack
          screenOptions={{
            headerTintColor: colors.ink,
            headerTitleStyle: { fontFamily: fonts.display },
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
        </Stack>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
