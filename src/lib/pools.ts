import { useQuery } from "@tanstack/react-query";
import { api } from "./api";
import { useAuth } from "@/stores/auth";
import type { Order, Pool, PoolSummary } from "./types";

export const usePool = (id: string) =>
  useQuery({ queryKey: ["pool", id], queryFn: () => api<Pool>(`/pools/${encodeURIComponent(id)}`), enabled: !!id });

/** My orders and my Go Solar Me pages (signed in only). */
export function useMine() {
  const user = useAuth((s) => s.user);
  return useQuery({ queryKey: ["myOrders", user?.id], queryFn: () => api<{ orders: Order[]; pools: PoolSummary[] }>("/me/orders"), enabled: !!user });
}

export const POOL_STATUS: Record<string, string> = {
  open: "Open",
  ended: "Deadline passed: choose next step",
  funded: "Funded",
  cancelled: "Closed and refunded",
};

export function daysLeft(deadline: string) {
  const d = Math.ceil((new Date(deadline).getTime() - Date.now()) / 864e5);
  return d <= 0 ? "Deadline passed" : d === 1 ? "Last day" : `${d} days left`;
}
