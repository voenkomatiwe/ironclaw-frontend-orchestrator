import { Outlet } from "react-router";
import { GatewayStatusBar } from "@/common/components/gateway-status-bar";
import { Sidebar } from "@/common/components/sidebar";

export function RootLayout() {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <GatewayStatusBar />
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
