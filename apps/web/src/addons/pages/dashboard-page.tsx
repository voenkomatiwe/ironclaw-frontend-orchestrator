import { Download, PackageOpen, Plus, Store } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router";
import { hashColor } from "@/common/lib/colors";
import type { AddonManifest } from "../api-types";
import { AddonCard } from "../components/addon-card";
import { useAddons, useInstallAddon, useRegistry } from "../queries";

type SuggestionCardProps = {
  manifest: AddonManifest;
};

function SuggestionCard({ manifest }: SuggestionCardProps) {
  const install = useInstallAddon();
  const [installing, setInstalling] = useState(false);
  const color = hashColor(manifest.name);
  const abbr = manifest.displayName
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const handleInstall = () => {
    setInstalling(true);
    install.mutate({ manifestName: manifest.name, envOverrides: {} }, { onSettled: () => setInstalling(false) });
  };

  return (
    <div className="group flex min-w-[200px] flex-1 cursor-default items-center gap-3 rounded-xl border border-border bg-surface-high p-4 transition-all hover:border-primary hover:shadow-md">
      <div className={`h-9 w-9 rounded-xl ${color.bg} flex shrink-0 items-center justify-center`}>
        <span className={`font-bold text-xs ${color.text}`}>{abbr}</span>
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium text-foreground text-sm">{manifest.displayName}</p>
        <p className="truncate text-muted-foreground text-xs">{manifest.description}</p>
      </div>
      <button
        className="flex shrink-0 items-center gap-1 rounded-lg bg-primary px-3 py-1.5 font-semibold text-on-primary-fixed text-xs transition-colors hover:bg-primary/90 disabled:opacity-50"
        disabled={installing || install.isPending}
        onClick={handleInstall}
      >
        <Download size={11} />
        {installing ? "…" : "Install"}
      </button>
    </div>
  );
}

type StatCardProps = {
  label: string;
  value: number;
  color: string;
};

function StatCard({ label, value, color }: StatCardProps) {
  return (
    <div className="rounded-xl border border-border bg-surface-high p-4">
      <p className="mb-1 text-muted-foreground text-xs">{label}</p>
      <p className={`font-bold text-2xl ${color}`}>{value}</p>
    </div>
  );
}

function EmptyState() {
  const { data: manifests } = useRegistry();
  const suggestions = manifests?.slice(0, 3) ?? [];

  return (
    <div className="flex flex-col items-center justify-center px-4 py-20">
      <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border-2 border-primary border-dashed">
        <PackageOpen className="text-primary" size={28} />
      </div>
      <h2 className="mb-2 font-bold text-foreground text-xl">No add-ons installed yet</h2>
      <p className="mb-6 max-w-sm text-center text-muted-foreground text-sm">
        Browse the Add-on Store to discover tools that extend IronHub with powerful capabilities.
      </p>
      <Link
        className="flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 font-medium text-on-primary-fixed text-sm transition-colors hover:bg-primary/90"
        to="/registry"
      >
        <Store size={16} /> Browse Add-on Store
      </Link>

      {suggestions.length > 0 && (
        <div className="mt-10 w-full max-w-2xl">
          <p className="mb-3 font-medium text-muted-foreground text-xs">Suggested for you</p>
          <div className="flex flex-wrap gap-3">
            {suggestions.map((m) => (
              <SuggestionCard key={m.name} manifest={m} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function Dashboard() {
  const { data: addons, isLoading, error } = useAddons();

  const counts = (addons ?? []).reduce(
    (acc, a) => {
      acc.total++;
      if (a.status === "running") acc.running++;
      else if (a.status === "stopped" || a.status === "installed") acc.stopped++;
      else if (a.status === "error") acc.errors++;
      return acc;
    },
    { total: 0, running: 0, stopped: 0, errors: 0 }
  );

  return (
    <div className="mx-auto max-w-6xl p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-bold text-foreground text-xl">Dashboard</h1>
          <p className="mt-0.5 text-muted-foreground text-sm">Manage your installed add-ons</p>
        </div>
        <Link
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 font-medium text-on-primary-fixed text-sm transition-colors hover:bg-primary/90"
          to="/registry"
        >
          <Plus size={16} /> Add Add-on
        </Link>
      </div>

      {isLoading && <div className="py-20 text-center text-muted-foreground">Loading…</div>}

      {error && (
        <div className="mb-6 rounded-xl border border-destructive/20 bg-destructive-muted p-4 text-destructive text-sm">
          {error.message}
        </div>
      )}

      {addons && addons.length === 0 && <EmptyState />}

      {addons && addons.length > 0 && (
        <>
          <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <StatCard color="text-foreground" label="Installed" value={counts.total} />
            <StatCard color="text-success" label="Running" value={counts.running} />
            <StatCard color="text-muted-foreground" label="Stopped" value={counts.stopped} />
            <StatCard color="text-destructive" label="Errors" value={counts.errors} />
          </div>

          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold text-foreground text-sm">
              Installed Add-ons <span className="ml-1.5 font-normal text-muted-foreground">({addons.length})</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {addons.map((addon) => (
              <AddonCard addon={addon} key={addon.id} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default function DashboardPage() {
  return <Dashboard />;
}
