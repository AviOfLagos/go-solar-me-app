import { useQuery } from "@tanstack/react-query";
import { api } from "./api";
import { shareLink } from "./share";
import { useAuth } from "@/stores/auth";
import type { Line } from "@/stores/cart";

export type MyBuild = { id: string; title: string; path: string; items: number; total: number; views: number; created_at: string };

/** Saves the list as a link (solar.nexprove.com/b/…) and opens the share sheet. Anyone can open it and buy. */
export async function shareList(items: Line[], title = "") {
  const r = await api<{ id: string; path: string }>("/builds", { body: { items, title: title.trim() || undefined } });
  await shareLink(title.trim() ? `${title.trim()}: here's the solar equipment list, with today's prices.` : "Here's the solar equipment list, with today's prices.", r.path);
  return r;
}

export function useMyBuilds() {
  const user = useAuth((s) => s.user);
  return useQuery({ queryKey: ["myBuilds", user?.id], queryFn: () => api<{ builds: MyBuild[] }>("/me/builds"), enabled: !!user });
}
