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
  accountId: string | null;
  setSession: (payload: { token: string; apiUrl: string; accountId?: string }) => void;
  clearSession: () => void;
};

export const useAppStore = create<AppStore>()(
  persist(
    (set) => ({
      token: null,
      apiUrl: null,
      accountId: null,
      setSession: ({ token, apiUrl, accountId }) =>
        set({
          token: token.trim() || null,
          apiUrl: normalizeApiOrigin(apiUrl) || null,
          accountId: accountId?.trim() || null,
        }),
      clearSession: () => set({ token: null, apiUrl: null, accountId: null }),
    }),
    {
      name: "ironhub-auth",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ token: state.token, apiUrl: state.apiUrl, accountId: state.accountId }),
    }
  )
);
