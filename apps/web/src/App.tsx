import { createBrowserRouter, Navigate, Outlet, RouterProvider } from "react-router";
import { AddonStartOutlet } from "@/addons/addon-ui-registry";
import AddonDetailPage from "@/addons/pages/addon-detail-page";
import DashboardPage from "@/addons/pages/dashboard-page";
import RegistryPage from "@/addons/pages/registry-page";
import { RootLayout } from "@/common/components/root-layout";
import IronclawPage from "@/ironclaw/pages/ironclaw-page";
import LogsPage from "@/logs/pages/logs-page";
import SettingsPage from "@/settings/pages/settings-page";

const router = createBrowserRouter([
  {
    path: "/",
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
      { path: "registry", element: <RegistryPage /> },
      { path: "ironclaw", element: <IronclawPage /> },
      { path: "logs", element: <LogsPage /> },
      { path: "settings", element: <SettingsPage /> },
    ],
  },
]);

export default function App() {
  return <RouterProvider router={router} />;
}
