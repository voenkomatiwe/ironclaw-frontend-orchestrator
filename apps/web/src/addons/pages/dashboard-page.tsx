import { ExternalLink, Sparkles } from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router";
import { listEmbeddedAddonNames } from "@/addons/addon-ui-registry";
import { hashColor, initials } from "@/common/lib/colors";
import { cn } from "@/common/lib/utils";
import { filterWasmExtensions, WasmExtensionCard } from "@/extensions/components/wasm-extension-card";
import { useExtensions } from "@/extensions/queries";

export function Dashboard() {
  const { data: extensions = [], isLoading: wasmLoading } = useExtensions();
  const wasmList = filterWasmExtensions(extensions);
  const [wasmPending, setWasmPending] = useState<string | null>(null);
  const embeddedNames = listEmbeddedAddonNames();
  const wasmNames = useMemo(() => new Set(wasmList.map((e) => e.name)), [wasmList]);
  const bundledUisToShow = useMemo(
    () => embeddedNames.filter((name) => wasmNames.has(name)),
    [embeddedNames, wasmNames]
  );

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="relative mb-8 overflow-hidden rounded-2xl border border-border bg-surface-high px-6 py-8 sm:px-8">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(800px_circle_at_0%_0%,var(--primary)_0%,transparent_50%)] opacity-[0.12]" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(600px_circle_at_100%_100%,var(--primary)_0%,transparent_45%)] opacity-[0.06]" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <h1 className="font-bold text-2xl text-foreground tracking-tight sm:text-3xl">Add-ons &amp; extensions</h1>
            <p className="mt-2 max-w-xl text-muted-foreground text-sm leading-relaxed">
              The gateway does not expose <span className="font-mono text-xs">/api/addons</span> or a container
              registry. Install WASM extensions from the{" "}
              <Link className="font-medium text-primary hover:underline" to="/extensions">
                Extension marketplace
              </Link>
              . Bundled UIs appear here only after a matching extension id is installed on this gateway.
            </p>
          </div>
          <Link
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 font-semibold text-on-primary-fixed text-sm shadow-sm transition-colors hover:bg-primary/90"
            to="/extensions#install-wasm"
          >
            <Sparkles size={18} />
            Extensions
          </Link>
        </div>
      </div>

      {!wasmLoading && bundledUisToShow.length > 0 && (
        <section className="mb-10">
          <div className="mb-4">
            <h2 className="font-semibold text-base text-foreground">Bundled UIs</h2>
            <p className="mt-0.5 text-muted-foreground text-xs">
              Client-only screens for extensions already installed on this gateway (same id as the WASM package).
            </p>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {bundledUisToShow.map((name) => {
              const color = hashColor(name);
              return (
                <div
                  className="flex flex-col gap-4 rounded-xl border border-border bg-surface-high p-5 transition-all hover:border-border/60 hover:shadow-sm"
                  key={name}
                >
                  <div className="flex items-center gap-3">
                    <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl", color.bg)}>
                      <span className={cn("font-bold text-sm", color.text)}>{initials(name)}</span>
                    </div>
                    <div className="min-w-0">
                      <h3 className="truncate font-semibold text-foreground">{name}</h3>
                      <p className="text-muted-foreground text-xs">Embedded package</p>
                    </div>
                  </div>
                  <div className="mt-auto flex flex-wrap gap-2">
                    <Link
                      className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 font-medium text-on-primary-fixed text-xs transition-colors hover:bg-primary/90"
                      to={`/addons/${name}/start`}
                    >
                      <ExternalLink size={12} /> Open
                    </Link>
                    <Link
                      className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-foreground text-xs transition-colors hover:bg-surface-highest"
                      to={`/addons/${name}/manage`}
                    >
                      About
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      <section>
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="font-semibold text-base text-foreground">WASM extensions</h2>
            <p className="mt-0.5 text-muted-foreground text-xs">Gateway — install and manage in Extensions</p>
          </div>
          {!wasmLoading && wasmList.length > 0 ? (
            <span className="text-muted-foreground text-xs tabular-nums">{wasmList.length} on this gateway</span>
          ) : null}
        </div>

        {wasmLoading && <div className="py-10 text-center text-muted-foreground text-sm">Loading WASM extensions…</div>}

        {!wasmLoading && wasmList.length === 0 && (
          <div className="rounded-2xl border border-border border-dashed bg-surface-high/40 px-4 py-10 text-center">
            <p className="text-muted-foreground text-sm">No WASM tool or channel extensions yet.</p>
            <p className="mt-1 text-muted-foreground text-xs">
              Open the{" "}
              <Link className="font-medium text-primary hover:underline" to="/extensions#install-wasm">
                Extension marketplace
              </Link>{" "}
              to install from a URL.
            </p>
          </div>
        )}

        {!wasmLoading && wasmList.length > 0 && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {wasmList.map((ext) => (
              <WasmExtensionCard
                ext={ext}
                key={ext.name}
                onPending={setWasmPending}
                pending={wasmPending === ext.name}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default function DashboardPage() {
  return <Dashboard />;
}
