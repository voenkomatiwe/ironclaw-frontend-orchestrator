import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { Navigate, Route, Routes } from "react-router";
import { botApi } from "./lib/api";
import { getAuthToken } from "./lib/auth-token";
import { wsClient } from "./lib/ws";
import AuthPage from "./pages/AuthPage";
import DashboardPage from "./pages/DashboardPage";
import WizardPage from "./pages/WizardPage";

function AuthGate({ children }: { children: React.ReactNode }) {
  const token = getAuthToken();
  if (!token) return <Navigate replace to="auth" />;
  return <>{children}</>;
}

function PolymarketIndex() {
  const token = getAuthToken();
  const { data: botStatus, isLoading } = useQuery({
    queryKey: ["bot-status"],
    queryFn: () => botApi.status(),
    enabled: !!token,
    retry: false,
  });

  if (!token) return <Navigate replace to="auth" />;
  if (isLoading) {
    return <div className="min-h-screen bg-black" />;
  }

  if (botStatus?.setupComplete) {
    return <Navigate replace to="dashboard" />;
  }
  return <Navigate replace to="wizard" />;
}

function PolymarketCatchAll() {
  return <Navigate replace to={getAuthToken() ? "dashboard" : "auth"} />;
}

function PolymarketAddonRoutes() {
  useEffect(() => {
    if (!getAuthToken()) return;
    wsClient.connect();
    return () => wsClient.disconnect();
  }, []);

  return (
    <Routes>
      <Route element={<AuthPage />} path="auth" />
      <Route
        element={
          <AuthGate>
            <WizardPage />
          </AuthGate>
        }
        path="wizard"
      />
      <Route
        element={
          <AuthGate>
            <DashboardPage />
          </AuthGate>
        }
        path="dashboard"
      />
      <Route element={<PolymarketIndex />} index />
      <Route element={<PolymarketCatchAll />} path="*" />
    </Routes>
  );
}

export { PolymarketAddonRoutes };
export default PolymarketAddonRoutes;
