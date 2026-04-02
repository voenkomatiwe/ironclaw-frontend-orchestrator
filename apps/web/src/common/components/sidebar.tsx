import { Bot, LayoutGrid, ScrollText, Settings, Store, User } from "lucide-react";
import { Link, useLocation } from "react-router";
import { cn } from "@/common/lib/utils";

const NAV_ITEMS = [
  { to: "/dashboard", label: "Dashboard", Icon: LayoutGrid },
  { to: "/registry", label: "Add-ons", Icon: Store },
  { to: "/ironclaw", label: "IronClaw", Icon: Bot },
  { to: "/logs", label: "Logs", Icon: ScrollText },
  { to: "/settings", label: "Settings", Icon: Settings },
] as const;

export function Sidebar() {
  const { pathname } = useLocation();

  return (
    <aside className="flex w-56 shrink-0 flex-col gap-1 border-sidebar-border border-r bg-sidebar px-3 py-5">
      <div className="mb-6 flex items-center gap-2.5 px-3">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary">
          <span className="font-bold text-on-primary-fixed text-xs">IH</span>
        </div>
        <span className="font-bold text-base text-foreground tracking-tight">IronHub</span>
      </div>

      <div className="flex flex-1 flex-col gap-0.5">
        {NAV_ITEMS.map(({ to, label, Icon }) => {
          const active = pathname === to || (to !== "/dashboard" && pathname.startsWith(to));
          return (
            <Link
              className={cn(
                "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors",
                active
                  ? "bg-surface-highest font-medium text-primary"
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
        <div className="flex items-center gap-2.5 px-3 py-2">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-surface-highest">
            <User className="text-muted-foreground" size={14} />
          </div>
          <span className="truncate text-muted-foreground text-sm">Admin</span>
        </div>
      </div>
    </aside>
  );
}
