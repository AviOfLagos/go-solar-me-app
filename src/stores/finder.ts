import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { emptyLoad, type Load } from "@/lib/catalog";

/** Presets for each buyer type: what they usually run, and hours without light. */
export const PRESETS: Record<string, { load: Partial<Load>; hours: number }> = {
  students: { load: { bulb: 2, fan: 1, laptop: 1 }, hours: 6 },
  "remote-workers": { load: { bulb: 2, fan: 1, laptop: 1, router: 1 }, hours: 8 },
  renters: { load: { bulb: 4, fan: 2, tv: 1, fridge: 1, laptop: 1 }, hours: 8 },
  shops: { load: { bulb: 3, fan: 1, clipper: 2, tv: 1, freezer: 1 }, hours: 10 },
  families: { load: { bulb: 8, fan: 3, tv: 1, fridge: 1, freezer: 1, pump: 1, laptop: 1 }, hours: 10 },
  duplex: { load: { bulb: 14, fan: 4, tv: 2, fridge: 1, freezer: 1, pump: 1, ac: 2, router: 1, laptop: 2 }, hours: 12 },
  offices: { load: { bulb: 10, fan: 4, laptop: 8, router: 1, ac: 1 }, hours: 9 },
};

type FinderState = {
  /** A preset slug, or "custom" when they picked appliances one by one. */
  segment: string | null;
  load: Load;
  hours: number;
  pick: (segment: string) => void;
  setLoad: (l: Load) => void;
  setHours: (h: number) => void;
};

/** The kit finder's answers, kept so coming back resumes where they left off. */
export const useFinder = create<FinderState>()(
  persist(
    (set) => ({
      segment: null,
      load: { ...emptyLoad },
      hours: 8,
      pick: (segment) => set(segment === "custom" ? { segment } : { segment, load: { ...emptyLoad, ...(PRESETS[segment]?.load ?? {}) }, hours: PRESETS[segment]?.hours ?? 8 }),
      setLoad: (load) => set({ load }),
      setHours: (hours) => set({ hours }),
    }),
    { name: "gsm_finder", storage: createJSONStorage(() => AsyncStorage) },
  ),
);
