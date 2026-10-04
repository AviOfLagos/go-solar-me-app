import { useQuery } from "@tanstack/react-query";
import { api } from "./api";
import { useAuth } from "@/stores/auth";
import type { Me } from "./types";

/** Profile, saved cards, store and last address. Only fetched when signed in. */
export function useMe() {
  const user = useAuth((s) => s.user);
  return useQuery({ queryKey: ["me", user?.id], queryFn: () => api<Me>("/me"), enabled: !!user });
}
