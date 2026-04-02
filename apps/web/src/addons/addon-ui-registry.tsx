import { type FC, type LazyExoticComponent, lazy, Suspense } from "react";
import { Link, Navigate, useParams } from "react-router";

const ADDON_UI_ROOT: Record<string, LazyExoticComponent<FC>> = {
  "polymarket-copy-bot": lazy(() => import("@repo/polymarket-copy-bot")),
};

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
      <div className="mx-auto max-w-lg p-6">
        <p className="text-muted-foreground text-sm">No embedded UI is registered for this add-on.</p>
        <Link className="mt-4 inline-block text-primary text-sm hover:underline" to={`/addons/${name}/manage`}>
          Back to manage
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
