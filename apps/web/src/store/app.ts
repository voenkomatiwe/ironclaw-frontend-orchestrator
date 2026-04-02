import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export function normalizeApiOrigin(input: string): string {
  return input
    .trim()
    .replace(/\/$/, "")
    .replace(/\/api\/v1\/?$/i, "");
}

type AppStore = {
  token: string | null;
  apiUrl: string | null;
  setSession: (payload: { token: string; apiUrl: string }) => void;
  clearSession: () => void;
};

export const useAppStore = create<AppStore>()(
  persist(
    (set) => ({
      token: null,
      apiUrl: null,
      setSession: ({ token, apiUrl }) =>
        set({
          token: token.trim() || null,
          apiUrl: normalizeApiOrigin(apiUrl) || null,
        }),
      clearSession: () => set({ token: null, apiUrl: null }),
    }),
    {
      name: "ironhub-auth",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ token: state.token, apiUrl: state.apiUrl }),
    }
  )
);
