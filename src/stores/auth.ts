import { create } from "zustand";
import { api, setToken, setUnauthorizedHandler, getToken } from "@/lib/api";
import { queryClient } from "@/lib/query";

export type SessionUser = { id: string; email: string; name: string };

type AuthState = {
  ready: boolean;
  user: SessionUser | null;
  /** Load the saved token on launch. */
  boot: () => Promise<void>;
  signedIn: (token: string, user: SessionUser) => Promise<void>;
  signOut: () => Promise<void>;
};

export const useAuth = create<AuthState>((set) => ({
  ready: false,
  user: null,
  boot: async () => {
    const token = await getToken();
    if (!token) return set({ ready: true });
    try {
      const me = await api<{ user: SessionUser | null }>("/me");
      set({ user: me.user, ready: true });
    } catch {
      set({ ready: true });
    }
  },
  signedIn: async (token, user) => {
    await setToken(token);
    set({ user });
    await queryClient.invalidateQueries();
  },
  signOut: async () => {
    await setToken(null);
    set({ user: null });
    queryClient.removeQueries({ queryKey: ["me"] });
    queryClient.removeQueries({ queryKey: ["myOrders"] });
  },
}));

// A 401 on any call means the session ended: sign out, keep the cart.
setUnauthorizedHandler(() => {
  void useAuth.getState().signOut();
});
