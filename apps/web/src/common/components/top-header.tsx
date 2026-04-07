import { useLocation } from "react-router";
import { GatewayStatusPill } from "@/common/components/gateway-status-pill";
import { NAV_ITEMS } from "@/common/components/icon-rail";
import { NearLogo } from "@/common/icons/near-logo";
import { trimId } from "@/common/lib/utils";
import { useAppStore } from "@/store/app";

function getPageTitle(pathname: string): string {
  const exact = NAV_ITEMS.find((item) => item.to === pathname);
  if (exact) return exact.label;
  const prefix = NAV_ITEMS.find((item) => !item.exact && pathname.startsWith(item.to));
  if (prefix) return prefix.label;
  return "IronHub";
}

export function TopHeader() {
  const { pathname } = useLocation();
  const title = getPageTitle(pathname);
  const accountId = useAppStore((s) => s.accountId);

  return (
    <header className="flex h-12 shrink-0 items-center justify-between border-border border-b bg-white px-4 shadow-sm">
      <div className="flex items-center gap-2.5">
        <NearLogo className="h-5 w-5 md:hidden" fill="#2882c8" />
        <h1 className="font-semibold text-foreground text-sm">{title}</h1>
      </div>
      <div className="flex items-center gap-3">
        {accountId ? (
          <span className="font-mono text-muted-foreground text-xs" title={accountId}>
            {trimId(accountId)}
          </span>
        ) : null}
        <GatewayStatusPill />
      </div>
    </header>
  );
}
