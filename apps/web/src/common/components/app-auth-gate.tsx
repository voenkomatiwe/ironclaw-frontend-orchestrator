import { useEffect, useState } from "react";
import { Navigate, Outlet, useLocation } from "react-router";
import { useAppStore } from "@/store/app";

export function AppAuthGate() {
  const { pathname } = useLocation();
  const token = useAppStore((s) => s.token);
  const apiUrl = useAppStore((s) => s.apiUrl);
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

  if (!hydrated) {
    return (
      <div className="flex h-screen items-center justify-center bg-background text-muted-foreground text-sm">
        Loading…
      </div>
    );
  }

  const ok = Boolean(token?.trim() && apiUrl?.trim());

  if (!ok) {
    if (pathname === "/auth") {
      return <Outlet />;
    }
    return <Navigate replace to="/auth" />;
  }

  if (pathname === "/auth") {
    return <Navigate replace to="/dashboard" />;
  }

  return <Outlet />;
}
