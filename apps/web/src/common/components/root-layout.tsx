import { Outlet } from "react-router";
import { BottomNav } from "@/common/components/bottom-nav";
import { IconRail } from "@/common/components/icon-rail";
import { TopHeader } from "@/common/components/top-header";

export function RootLayout() {
  return (
    <div className="flex h-screen overflow-hidden">
      <IconRail />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <TopHeader />
        <main className="flex-1 overflow-y-auto pb-16 md:pb-0" style={{ scrollbarGutter: "stable" }}>
          <Outlet />
        </main>
        <BottomNav />
      </div>
    </div>
  );
}
