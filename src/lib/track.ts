import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";
import { API_BASE } from "./config";

/**
 * Anonymous usage counts, the same shape as the website's (first-party, no ad id, no names, no contact details):
 * a random id for this app launch, a screen path and a short label. Nothing here crosses into other apps, so the
 * iOS tracking prompt doesn't apply, and people can still turn it off in Profile → Usage counts.
 */
const KEY = "gsm_usage_off";
const sid = Math.random().toString(36).slice(2, 12);
let off = false;
void AsyncStorage.getItem(KEY).then((v) => { off = v === "1"; }).catch(() => {});

export const usageCountsOn = () => !off;
export async function setUsageCounts(on: boolean) {
  off = !on;
  await AsyncStorage.setItem(KEY, on ? "0" : "1").catch(() => {});
}

function send(kind: "view" | "click", path: string, name = "") {
  if (off || __DEV__) return;
  void fetch(`${API_BASE}/events`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ kind, path: `/app${path === "/" ? "" : path}`, name: name.slice(0, 60), sid, ref: Platform.OS }),
  }).catch(() => {});
}

/** A screen was opened. Ids in the path are collapsed so one screen counts as one. */
export const trackView = (pathname: string) => send("view", pathname.replace(/\/[a-z0-9]{8,}(?=\/|$)/gi, "/:id") || "/");
/** Something was tapped or finished. Use the website's names where there is one (see src/components/Tracker.tsx there). */
export const track = (name: string) => send("click", "/", name);
