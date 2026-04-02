import { useEffect, useLayoutEffect, useState } from "react";
import { Outlet, useSearchParams } from "react-router";
import { useAppStore } from "@/store/app";

export function AppAuthGate() {
  const token = useAppStore((s) => s.token);
  const setToken = useAppStore((s) => s.setToken);
  const [searchParams, setSearchParams] = useSearchParams();
  const queryString = searchParams.toString();
  const [hydrated, setHydrated] = useState(() => useAppStore.persist.hasHydrated());

  useEffect(() => {
    if (useAppStore.persist.hasHydrated()) {
      setHydrated(true);
      return;
    }
    return useAppStore.persist.onFinishHydration(() => {
      setHydrated(true);
    });
  }, []);

  useLayoutEffect(() => {
    if (!hydrated) return;
    const params = new URLSearchParams(queryString);
    const urlToken = params.get("token");
    if (!urlToken) return;
    setToken(urlToken);
    params.delete("token");
    setSearchParams(params, { replace: true });
  }, [hydrated, queryString, setToken, setSearchParams]);

  if (!hydrated) {
    return (
      <div className="flex h-screen items-center justify-center bg-background text-muted-foreground text-sm">
        Loading…
      </div>
    );
  }

  if (!token) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-2 bg-background px-6 text-center">
        <p className="text-base text-foreground">A token is required</p>
        <p className="max-w-md text-muted-foreground text-sm">
          Open the app using a link that includes the{" "}
          <code className="rounded bg-surface-high px-1 py-0.5 font-mono text-xs">?token=…</code>{" "}
          query parameter.
        </p>
      </div>
    );
  }

  return <Outlet />;
}
