import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export function normalizeApiOrigin(input: string): string {
  return input
    .trim()
    .replace(/\/$/, "")
    .replace(/\/api\/v1\/?$/i, "");
}

/**
 * Register the gateway URL + token with the Vite dev-server proxy.
 * The proxy will validate the connection via /api/health and then
 * forward all /api/* requests with the Bearer token attached.
 */
async function registerProxyTarget(url: string, token: string): Promise<void> {
  const res = await fetch("/__proxy/set-target", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url, token }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: "Connection failed" }));
    throw new Error((body as { error?: string }).error ?? `Proxy returned ${res.status}`);
  }
}

async function clearProxyTarget(): Promise<void> {
  await fetch("/__proxy/clear-target", { method: "POST" }).catch(() => {});
}

type AppStore = {
  token: string | null;
  apiUrl: string | null;
  accountId: string | null;
  /** True once the dev-server proxy has been configured with the gateway target. */
  proxyReady: boolean;
  /** Connect to gateway: registers with dev-server proxy, then stores credentials. Throws on failure. */
  setSession: (payload: { token: string; apiUrl: string; accountId?: string }) => Promise<void>;
  clearSession: () => void;
};

export const useAppStore = create<AppStore>()(
  persist(
    (set) => ({
      token: null,
      apiUrl: null,
      accountId: null,
      proxyReady: false,
      setSession: async ({ token, apiUrl, accountId }) => {
        const cleanUrl = normalizeApiOrigin(apiUrl);
        const cleanToken = token.trim();
        if (!cleanUrl || !cleanToken) throw new Error("URL and token are required");
        await registerProxyTarget(cleanUrl, cleanToken);
        set({
          token: cleanToken,
          apiUrl: cleanUrl,
          accountId: accountId?.trim() || null,
          proxyReady: true,
        });
      },
      clearSession: () => {
        void clearProxyTarget();
        set({ token: null, apiUrl: null, accountId: null, proxyReady: false });
      },
    }),
    {
      name: "ironhub-auth",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ token: state.token, apiUrl: state.apiUrl, accountId: state.accountId }),
    }
  )
);

/**
 * On page load, if we have stored credentials, re-register them with the proxy.
 * The proxy holds state in memory and loses it on Vite restart.
 * React Query hooks wait for `proxyReady` before issuing any requests.
 */
function syncProxyOnHydration() {
  const { token, apiUrl } = useAppStore.getState();
  if (token && apiUrl) {
    registerProxyTarget(apiUrl, token)
      .then(() => useAppStore.setState({ proxyReady: true }))
      .catch(() => {
        // Gateway unreachable — mark ready anyway so hooks can surface errors
        // instead of silently stalling. User can re-connect from auth page.
        useAppStore.setState({ proxyReady: true });
      });
  }
  // No stored credentials — nothing to register, no need to set proxyReady
  // (user must go through auth page which calls setSession → proxyReady = true)
}

// Handle both cases: hydration already done, or still pending.
if (useAppStore.persist.hasHydrated()) {
  syncProxyOnHydration();
} else {
  useAppStore.persist.onFinishHydration?.(syncProxyOnHydration);
}
