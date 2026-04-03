import { ExternalLink, LayoutGrid, Loader2, Package, Sparkles } from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router";
import { listEmbeddedAddonNames } from "@/addons/addon-ui-registry";
import { ExtensionBrandAvatar } from "@/common/components/extension-brand-avatar";
import { filterWasmExtensions, WasmExtensionCard } from "@/extensions/components/wasm-extension-card";
import { useExtensions } from "@/extensions/queries";

function SectionLabel({ children }: { children: string }) {
  return <h2 className="font-medium text-[11px] text-muted-foreground uppercase tracking-wider">{children}</h2>;
}

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
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
      <div className="relative mb-8 overflow-hidden rounded-xl border border-border bg-surface-high px-5 py-6 sm:px-6">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(640px_circle_at_0%_0%,var(--primary)_0%,transparent_52%)] opacity-[0.08]" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(480px_circle_at_100%_100%,var(--primary)_0%,transparent_48%)] opacity-[0.04]" />
        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <div className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-border bg-surface-low/90 px-2.5 py-0.5 text-[11px] text-muted-foreground">
              <LayoutGrid className="text-primary" size={12} />
              Gateway overview
            </div>
            <h1 className="font-bold text-foreground text-xl tracking-tight sm:text-2xl">Add-ons &amp; extensions</h1>
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
            className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg bg-primary px-3 py-2 font-semibold text-on-primary-fixed text-sm hover:bg-primary/90"
            to="/extensions#install-wasm"
          >
            <Sparkles size={16} />
            Extensions
          </Link>
        </div>
      </div>

      {!wasmLoading && bundledUisToShow.length > 0 && (
        <section className="mb-8">
          <div className="mb-3">
            <SectionLabel>Bundled UIs</SectionLabel>
            <p className="mt-1 text-muted-foreground text-xs">
              Client-only screens for extensions already installed on this gateway (same id as the WASM package).
            </p>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {bundledUisToShow.map((name) => {
              return (
                <div
                  className="group relative overflow-hidden rounded-xl border border-border bg-surface-low transition-colors hover:border-primary/15"
                  key={name}
                >
                  <div
                    aria-hidden
                    className="pointer-events-none absolute inset-0 bg-[radial-gradient(320px_circle_at_0%_0%,var(--primary)_0%,transparent_60%)] opacity-[0.05] group-hover:opacity-[0.08]"
                  />
                  <div className="relative flex flex-col gap-3 p-4">
                    <div className="flex items-center gap-2.5">
                      <ExtensionBrandAvatar name={name} />
                      <div className="min-w-0">
                        <h3 className="truncate font-semibold text-foreground text-sm">{name}</h3>
                        <p className="text-[11px] text-muted-foreground">Embedded package</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      <Link
                        className="inline-flex items-center gap-1 rounded-md bg-primary px-2.5 py-1.5 font-medium text-on-primary-fixed text-xs hover:bg-primary/90"
                        to={`/addons/${name}/start`}
                      >
                        <ExternalLink size={11} /> Open
                      </Link>
                      <Link
                        className="inline-flex items-center gap-1 rounded-md border border-border bg-surface-high px-2.5 py-1.5 font-medium text-foreground text-xs hover:border-primary/30 hover:bg-surface-highest"
                        to={`/addons/${name}/manage`}
                      >
                        About
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      <section>
        <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
          <div>
            <SectionLabel>WASM extensions</SectionLabel>
            <p className="mt-1 text-muted-foreground text-xs">Install and manage from the Extensions marketplace.</p>
          </div>
          {!wasmLoading && wasmList.length > 0 ? (
            <span className="rounded-full bg-surface-highest px-2.5 py-1 font-medium text-muted-foreground text-xs tabular-nums">
              {wasmList.length} on this gateway
            </span>
          ) : null}
        </div>

        {wasmLoading && (
          <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-border bg-surface-high/50 py-10 text-muted-foreground">
            <Loader2 aria-hidden className="size-6 animate-spin text-primary/70" />
            <p className="text-xs">Loading WASM extensions…</p>
          </div>
        )}

        {!wasmLoading && wasmList.length === 0 && (
          <div className="relative overflow-hidden rounded-xl border border-border bg-surface-low px-5 py-8 text-center">
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 bg-[radial-gradient(400px_circle_at_50%_0%,var(--primary)_0%,transparent_62%)] opacity-[0.06]"
            />
            <div className="relative mx-auto max-w-md">
              <div className="mx-auto mb-3 flex size-11 items-center justify-center rounded-xl bg-primary-container/70 text-primary">
                <Package className="size-5" strokeWidth={1.5} />
              </div>
              <p className="font-medium text-foreground text-sm">No WASM tools or channels yet</p>
              <p className="mt-1.5 text-muted-foreground text-xs leading-relaxed">
                Open the{" "}
                <Link className="font-medium text-primary hover:underline" to="/extensions#install-wasm">
                  Extension marketplace
                </Link>{" "}
                to install from a URL, then activate extensions from this page or the marketplace.
              </p>
              <Link
                className="mt-4 inline-flex items-center justify-center gap-1.5 rounded-lg bg-primary px-3 py-2 font-semibold text-on-primary-fixed text-xs hover:bg-primary/90"
                to="/extensions#install-wasm"
              >
                <Sparkles size={14} />
                Go to install
              </Link>
            </div>
          </div>
        )}

        {!wasmLoading && wasmList.length > 0 && (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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
