import { Download, Layers, Search } from "lucide-react";
import { useState } from "react";
import { hashColor, initials } from "@/common/lib/colors";
import { cn } from "@/common/lib/utils";
import type { AddonManifest, EnvVarDef } from "../api-types";
import { useAddons, useInstallAddon, useRegistry } from "../queries";

function getRequiredVars(manifest: AddonManifest): EnvVarDef[] {
  const all = manifest.services ? manifest.services.flatMap((s) => s.envVars) : manifest.envVars;
  return all.filter((e) => e.required);
}

type InstallModalProps = {
  manifest: AddonManifest;
  onClose: () => void;
};

function InstallModal({ manifest, onClose }: InstallModalProps) {
  const install = useInstallAddon();
  const requiredVars = getRequiredVars(manifest);
  const [values, setValues] = useState<Record<string, string>>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    install.mutate({ manifestName: manifest.name, envOverrides: values }, { onSuccess: onClose });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4 backdrop-blur-sm">
      <div className="flex max-h-[90vh] w-full max-w-lg flex-col rounded-2xl border border-border bg-surface-high shadow-xl">
        <div className="shrink-0 border-border border-b p-6">
          <h2 className="font-semibold text-foreground text-lg">Install {manifest.displayName}</h2>
          <p className="mt-1 text-muted-foreground text-sm">{manifest.description}</p>
        </div>

        <form className="flex min-h-0 flex-col" onSubmit={handleSubmit}>
          <div className="flex flex-col gap-4 overflow-y-auto p-6">
            {requiredVars.length === 0 ? (
              <p className="text-muted-foreground text-sm">No configuration required.</p>
            ) : (
              requiredVars.map((env) => (
                <div key={env.name}>
                  <label className="mb-1 flex items-center gap-1 font-medium text-muted-foreground text-xs">
                    {env.name} <span className="text-destructive">*</span>
                  </label>
                  <input
                    className="w-full rounded-lg border border-border bg-surface-low px-3 py-2 text-foreground text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    onChange={(e) => setValues((v) => ({ ...v, [env.name]: e.target.value }))}
                    placeholder={env.description}
                    required
                    type={env.secret ? "password" : "text"}
                    value={values[env.name] ?? ""}
                  />
                </div>
              ))
            )}
          </div>

          <div className="flex shrink-0 flex-col gap-3 px-6 pb-6">
            {install.error && <p className="text-destructive text-sm">{install.error.message}</p>}
            <div className="flex gap-3">
              <button
                className="flex-1 rounded-lg bg-surface-highest px-4 py-2 text-foreground text-sm transition-colors hover:bg-surface-highest/80"
                onClick={onClose}
                type="button"
              >
                Cancel
              </button>
              <button
                className="flex-1 rounded-lg bg-primary px-4 py-2 font-medium text-on-primary-fixed text-sm transition-colors hover:bg-primary/90 disabled:opacity-50"
                disabled={install.isPending}
                type="submit"
              >
                {install.isPending ? "Installing…" : "Install"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export function Registry() {
  const { data: manifests, isLoading } = useRegistry();
  const { data: installed } = useAddons();
  const [selected, setSelected] = useState<AddonManifest | null>(null);
  const [installingName, setInstallingName] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const install = useInstallAddon();

  const installedNames = new Set(installed?.map((a) => a.name) ?? []);

  const filtered = (manifests ?? []).filter(
    (m) =>
      !search ||
      m.displayName.toLowerCase().includes(search.toLowerCase()) ||
      m.description.toLowerCase().includes(search.toLowerCase())
  );

  const handleInstallClick = (m: AddonManifest) => {
    if (getRequiredVars(m).length === 0) {
      setInstallingName(m.name);
      install.mutate(
        { manifestName: m.name, envOverrides: {} },
        {
          onSettled: () => setInstallingName(null),
        }
      );
    } else {
      setSelected(m);
    }
  };

  return (
    <div className="mx-auto max-w-6xl p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-bold text-foreground text-xl">Add-on Store</h1>
          <p className="mt-0.5 text-muted-foreground text-sm">Discover &amp; install add-ons</p>
        </div>
        <div className="relative">
          <Search className="absolute top-1/2 left-3 -translate-y-1/2 text-muted-foreground" size={14} />
          <input
            className="w-56 rounded-lg border border-border bg-surface-high py-2 pr-4 pl-8 text-foreground text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search add-ons…"
            type="search"
            value={search}
          />
        </div>
      </div>

      {isLoading && <div className="py-20 text-center text-muted-foreground">Loading…</div>}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((m) => {
          const isInstalled = installedNames.has(m.name);
          const isMulti = !!(m.services && m.services.length > 0);
          const isInstalling = installingName === m.name;
          const color = hashColor(m.name);

          return (
            <div
              className="flex flex-col gap-4 rounded-xl border border-border bg-surface-high p-5 transition-all hover:border-border/60 hover:shadow-sm"
              key={m.name}
            >
              <div className="flex items-start gap-3">
                <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl", color.bg)}>
                  {isMulti ? (
                    <Layers className={color.text} size={16} />
                  ) : (
                    <span className={cn("font-bold text-sm", color.text)}>{initials(m.name)}</span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold text-foreground">{m.displayName}</h3>
                    <span className="text-muted-foreground text-xs">v{m.version}</span>
                    {isMulti && (
                      <span className="rounded-full border border-primary/20 bg-primary/10 px-1.5 py-0.5 text-primary text-xs">
                        {m.services!.length} services
                      </span>
                    )}
                  </div>
                  <p className="mt-1 line-clamp-2 text-muted-foreground text-xs">{m.description}</p>
                </div>
              </div>

              <p className="truncate font-mono text-muted-foreground text-xs">
                {m.image ?? m.services?.map((s) => s.image).join(", ")}
              </p>

              <div className="mt-auto">
                {isInstalled ? (
                  <span className="inline-flex items-center rounded-lg border border-success/20 bg-success-muted px-3 py-1.5 text-success text-xs">
                    Installed
                  </span>
                ) : (
                  <button
                    className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 font-medium text-on-primary-fixed text-sm transition-colors hover:bg-primary/90 disabled:opacity-50"
                    disabled={isInstalling}
                    onClick={() => handleInstallClick(m)}
                  >
                    <Download size={14} /> {isInstalling ? "Installing…" : "Install"}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {selected && <InstallModal manifest={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}

export default function RegistryPage() {
  return <Registry />;
}
