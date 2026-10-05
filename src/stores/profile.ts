import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { Role } from "@/lib/roles";

type ProfileState = {
  /** What brought this person here; picks their home screen and default ways to pay. */
  role: Role | null;
  /** Finished the welcome screens (or skipped them). */
  onboarded: boolean;
  /** Saved answers have been read from the phone (don't decide anything before this). */
  hydrated: boolean;
  setRole: (r: Role) => void;
  finish: () => void;
};

export const useProfile = create<ProfileState>()(
  persist(
    (set) => ({
      role: null,
      onboarded: false,
      hydrated: false,
      setRole: (role) => set({ role }),
      finish: () => set({ onboarded: true }),
    }),
    {
      name: "gsm_profile",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({ role: s.role, onboarded: s.onboarded }),
      onRehydrateStorage: () => () => useProfile.setState({ hydrated: true }),
    },
  ),
);
