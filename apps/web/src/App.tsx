import { createBrowserRouter, Navigate, Outlet, RouterProvider } from "react-router";
import { AddonStartOutlet } from "@/addons/addon-ui-registry";
import AddonDetailPage from "@/addons/pages/addon-detail-page";
import DashboardPage from "@/addons/pages/dashboard-page";
import ExtensionsMarketPage from "@/extensions/pages/extensions-market-page";
import AuthPage from "@/auth/pages/auth-page";
import { AppAuthGate } from "@/common/components/app-auth-gate";
import { RootLayout } from "@/common/components/root-layout";
import IronclawPage from "@/ironclaw/pages/ironclaw-page";
import JobsPage from "@/jobs/pages/jobs-page";
import LogsPage from "@/logs/pages/logs-page";
import MemoryPage from "@/memory/pages/memory-page";
import RoutinesPage from "@/routines/pages/routines-page";
import SettingsPage from "@/settings/pages/settings-page";

const router = createBrowserRouter([
  {
    path: "/",
    element: <AppAuthGate />,
    children: [
      { path: "auth", element: <AuthPage /> },
      {
        element: <RootLayout />,
        children: [
          { index: true, element: <Navigate replace to="/dashboard" /> },
          { path: "dashboard", element: <DashboardPage /> },
          {
            path: "addons/:name",
            element: <Outlet />,
            children: [
              { index: true, element: <Navigate replace to="manage" /> },
              { path: "manage", element: <AddonDetailPage /> },
              { path: "start/*", element: <AddonStartOutlet /> },
            ],
          },
          { path: "extensions", element: <ExtensionsMarketPage /> },
          { path: "ironclaw", element: <IronclawPage /> },
          { path: "memory", element: <MemoryPage /> },
          { path: "jobs", element: <JobsPage /> },
          { path: "routines", element: <RoutinesPage /> },
          { path: "logs", element: <LogsPage /> },
          { path: "settings", element: <SettingsPage /> },
        ],
      },
    ],
  },
]);

export default function App() {
  return <RouterProvider router={router} />;
}
