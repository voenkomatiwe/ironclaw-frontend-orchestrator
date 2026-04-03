import {
  Bot,
  Briefcase,
  Database,
  LayoutGrid,
  LogOut,
  RefreshCw,
  ScrollText,
  Settings,
  Store,
  User,
} from "lucide-react";
import { Link, useLocation } from "react-router";
import { cn } from "@/common/lib/utils";
import { useAppStore } from "@/store/app";

const NAV_ITEMS = [
  { to: "/dashboard", label: "Dashboard", Icon: LayoutGrid },
  { to: "/extensions", label: "Extensions", Icon: Store },
  { to: "/ironclaw", label: "IronClaw", Icon: Bot },
  { to: "/memory", label: "Memory", Icon: Database },
  { to: "/jobs", label: "Jobs", Icon: Briefcase },
  { to: "/routines", label: "Routines", Icon: RefreshCw },
  { to: "/logs", label: "Logs", Icon: ScrollText },
  { to: "/settings", label: "Settings", Icon: Settings },
] as const;

export function Sidebar() {
  const { pathname } = useLocation();
  const clearSession = useAppStore((s) => s.clearSession);

  return (
    <aside className="flex w-56 shrink-0 flex-col gap-1 border-sidebar-border border-r bg-sidebar px-3 py-5">
      <div className="mb-6 flex items-center gap-2.5 px-3">
        <svg className="h-5 w-5" role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <title>NEAR</title>
          <path d="M21.443 0c-.89 0-1.714.46-2.18 1.218l-5.017 7.448a.533.533 0 0 0 .792.7l4.938-4.282a.2.2 0 0 1 .334.151v13.41a.2.2 0 0 1-.354.128L5.03.905A2.555 2.555 0 0 0 3.078 0h-.521A2.557 2.557 0 0 0 0 2.557v18.886a2.557 2.557 0 0 0 4.736 1.338l5.017-7.448a.533.533 0 0 0-.792-.7l-4.938 4.283a.2.2 0 0 1-.333-.152V5.352a.2.2 0 0 1 .354-.128l14.924 17.87c.486.574 1.2.905 1.952.906h.521A2.558 2.558 0 0 0 24 21.445V2.557A2.558 2.558 0 0 0 21.443 0Z" />
        </svg>

        <span className="font-bold text-base text-foreground tracking-tight">IronHub</span>
      </div>

      <div className="flex flex-1 flex-col gap-0.5">
        {NAV_ITEMS.map(({ to, label, Icon }) => {
          const active =
            pathname === to ||
            (to !== "/dashboard" && to !== "/extensions" && pathname.startsWith(to)) ||
            (to === "/extensions" && pathname.startsWith("/extensions"));
          return (
            <Link
              className={cn(
                "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors",
                active
                  ? "bg-primary-container font-medium text-primary"
                  : "text-muted-foreground hover:bg-surface-high hover:text-foreground"
              )}
              key={to}
              to={to}
            >
              <Icon size={16} />
              {label}
            </Link>
          );
        })}
      </div>

      <div className="border-border border-t pt-3">
        <div className="flex items-center gap-2 px-3 py-2">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-surface-highest">
            <User className="text-muted-foreground" size={14} />
          </div>
          <span className="min-w-0 flex-1 truncate text-muted-foreground text-sm">Admin</span>
          <button
            className="shrink-0 rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-surface-high hover:text-foreground"
            onClick={() => clearSession()}
            title="Sign out"
            type="button"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
}
