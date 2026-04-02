import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

type AppStore = {
  token: string | null;
  setToken: (token: string | null) => void;
  clearToken: () => void;
};

export const useAppStore = create<AppStore>()(
  persist(
    (set) => ({
      token: null,
      setToken: (token) => set({ token }),
      clearToken: () => set({ token: null }),
    }),
    {
      name: "ironhub-auth",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ token: state.token }),
    }
  )
);
