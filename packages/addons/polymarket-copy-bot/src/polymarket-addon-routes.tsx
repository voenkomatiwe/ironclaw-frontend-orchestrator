import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { Navigate, Route, Routes } from "react-router";
import { isSetupComplete } from "./lib/api";
import { ensureWasmInstalled } from "./lib/gateway-setup";
import DashboardPage from "./pages/DashboardPage";
import WizardPage from "./pages/WizardPage";

function PolymarketIndex() {
  const { data: setupDone, isLoading } = useQuery({
    queryKey: ["copy-bot-setup-check"],
    queryFn: () => isSetupComplete(),
    retry: false,
  });

  if (isLoading) return <div className="min-h-screen bg-black" />;
  if (setupDone) return <Navigate replace to="dashboard" />;
  return <Navigate replace to="wizard" />;
}

function PolymarketAddonRoutes() {
  const wasmInstallAttempted = useRef(false);

  // Auto-install WASM extension on the gateway (idempotent, runs once)
  useEffect(() => {
    if (wasmInstallAttempted.current) return;
    wasmInstallAttempted.current = true;
    ensureWasmInstalled().catch(() => {
      // Non-fatal — wizard still works, WASM can be installed manually later
    });
  }, []);

  return (
    <Routes>
      <Route element={<WizardPage />} path="wizard" />
      <Route element={<DashboardPage />} path="dashboard" />
      <Route element={<PolymarketIndex />} index />
      <Route element={<PolymarketIndex />} path="*" />
    </Routes>
  );
}

export { PolymarketAddonRoutes };
export default PolymarketAddonRoutes;
