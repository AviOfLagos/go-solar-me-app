import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import Constants from "expo-constants";
import { router } from "expo-router";
import { api } from "./api";

Notifications.setNotificationHandler({
  handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: true, shouldSetBadge: false }),
});

let lastToken: string | null = null;

/**
 * Asks once (after a sign-in, never on first launch) and registers this phone so the server can
 * push order and pool updates. Silent on simulators or when the person says no.
 */
export async function registerForPush() {
  try {
    if (Platform.OS === "web" || !Device.isDevice) return null;
    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", { name: "Orders and pools", importance: Notifications.AndroidImportance.DEFAULT });
    }
    let { status } = await Notifications.getPermissionsAsync();
    if (status !== "granted") status = (await Notifications.requestPermissionsAsync()).status;
    if (status !== "granted") return null;
    const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
    const token = (await Notifications.getExpoPushTokenAsync(projectId ? { projectId } : undefined)).data;
    await api("/me/devices", { body: { token, platform: Platform.OS === "ios" ? "ios" : "android" } });
    lastToken = token;
    return token;
  } catch {
    return null;
  }
}

/** Call before signing out so this phone stops getting the old account's pushes. */
export async function unregisterPush() {
  if (!lastToken) return;
  await api(`/me/devices/${encodeURIComponent(lastToken)}`, { method: "DELETE" }).catch(() => {});
  lastToken = null;
}

/** Push data says what to open: { kind: "order", ref } | { kind: "pool", id } | { kind: "store" }. */
export function openFromPush(data: Record<string, unknown> | undefined) {
  if (!data) return;
  if (data.kind === "pool" && typeof data.id === "string") router.push({ pathname: "/fund/[id]", params: { id: data.id } });
  else if (data.kind === "order") router.push("/(tabs)/orders");
  else if (data.kind === "store") router.push("/account/store");
}
