import { create } from "zustand";
import { persist } from "zustand/middleware";

interface AppStore {
  statieActivaId: string | null;
  setStatieActivaId: (id: string) => void;
}

export const useAppStore = create<AppStore>()(
  persist(
    (set) => ({
      statieActivaId: null,
      setStatieActivaId: (id) => set({ statieActivaId: id }),
    }),
    { name: "itp-crm-store" }
  )
);
