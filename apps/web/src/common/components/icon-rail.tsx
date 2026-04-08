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
import { NearLogo } from "@/common/icons/near-logo";
import { cn } from "@/common/lib/utils";
import { useAppStore } from "@/store/app";

export const NAV_ITEMS = [
  { to: "/dashboard", label: "Dashboard", Icon: LayoutGrid, exact: true },
  { to: "/extensions", label: "Extensions", Icon: Store, exact: false },
  { to: "/ironclaw", label: "IronClaw", Icon: Bot, exact: false },
  { to: "/memory", label: "Memory", Icon: Database, exact: false },
  { to: "/jobs", label: "Jobs", Icon: Briefcase, exact: false },
  { to: "/routines", label: "Routines", Icon: RefreshCw, exact: false },
  { to: "/logs", label: "Logs", Icon: ScrollText, exact: false },
  { to: "/settings", label: "Settings", Icon: Settings, exact: false },
] as const;

export function IconRail() {
  const { pathname } = useLocation();
  const clearSession = useAppStore((s) => s.clearSession);

  return (
    <aside className="hidden w-15 shrink-0 flex-col items-center border-white/15 border-r bg-linear-to-b from-primary-dark to-primary-darker py-2 md:flex">
      <div className="mb-4 flex h-9 w-9 items-center justify-center">
        <NearLogo className="h-5 w-5" fill="white" />
      </div>

      <nav className="flex flex-1 flex-col items-center gap-1">
        {NAV_ITEMS.map(({ to, label, Icon, exact }) => {
          const active = exact ? pathname === to : pathname.startsWith(to);
          return (
            <Link
              className={cn(
                "flex h-9 w-9 items-center justify-center rounded-xl transition-colors",
                active ? "bg-white/15 text-white" : "text-white/50 hover:bg-white/10 hover:text-white"
              )}
              key={to}
              title={label}
              to={to}
            >
              <Icon size={20} />
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto flex flex-col items-center gap-1 pt-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/15">
          <User className="text-white" size={16} />
        </div>
        <button
          className="flex h-9 w-9 items-center justify-center rounded-xl text-white/50 transition-colors hover:bg-white/10 hover:text-white"
          onClick={() => clearSession()}
          title="Sign out"
          type="button"
        >
          <LogOut size={18} />
        </button>
      </div>
    </aside>
  );
}
