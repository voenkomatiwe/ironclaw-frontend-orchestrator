import { Bot, Briefcase, Home, Settings } from "lucide-react";
import { Link, useLocation } from "react-router";
import { cn } from "@/common/lib/utils";

const BOTTOM_NAV_ITEMS = [
  { to: "/", label: "Home", Icon: Home, exact: true },
  { to: "/ironclaw", label: "IronClaw", Icon: Bot, exact: false },
  { to: "/jobs", label: "Jobs", Icon: Briefcase, exact: false },
  { to: "/settings", label: "Settings", Icon: Settings, exact: false },
] as const;

export function BottomNav() {
  const { pathname } = useLocation();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 flex justify-around border-white/15 border-t bg-primary-darker pb-[env(safe-area-inset-bottom)] md:hidden">
      {BOTTOM_NAV_ITEMS.map(({ to, label, Icon, exact }) => {
        const active = exact ? pathname === to : pathname.startsWith(to);
        return (
          <Link
            className={cn(
              "flex flex-col items-center gap-1 px-3 py-2 text-[10px] transition-colors",
              active ? "text-white" : "text-white/50 hover:text-white"
            )}
            key={to}
            to={to}
          >
            <Icon size={22} />
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
