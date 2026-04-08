import { type FC, type LazyExoticComponent, lazy, Suspense } from "react";
import { Link, Navigate, useParams } from "react-router";

const ADDON_UI_ROOT: Record<string, LazyExoticComponent<FC>> = {
  "polycopy-tool": lazy(() => import("@repo/polymarket-copy-bot")),
};

/** Bundled SPA routes only — no gateway container API. */
export function listEmbeddedAddonNames(): string[] {
  return Object.keys(ADDON_UI_ROOT);
}

export function hasEmbeddedAddonUi(addonName: string): boolean {
  return addonName in ADDON_UI_ROOT;
}

export function AddonStartOutlet() {
  const { name } = useParams<{ name: string }>();
  if (!name) {
    return <Navigate replace to="/dashboard" />;
  }
  const LazyRoot = ADDON_UI_ROOT[name];
  if (!LazyRoot) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground text-sm">No embedded UI is registered for this add-on.</p>
        <Link className="mt-4 inline-block text-primary text-sm hover:underline" to="/dashboard">
          Back to dashboard
        </Link>
      </div>
    );
  }
  return (
    <Suspense fallback={<div className="p-6 text-muted-foreground text-sm">Loading add-on…</div>}>
      <LazyRoot />
    </Suspense>
  );
}
