import { useMemo, useState } from "react";
import { Loader, Search, Store, Wrench } from "lucide-react";
import { Link } from "react-router";

import { cn } from "@/common/lib/utils";
import type { ExtensionKind } from "@/settings/api-types";
import { inferenceControlClass, inferenceSelectClass } from "@/settings/components/inference-settings-ui";
import { ExtensionSetupDialog } from "../components/extension-setup-dialog";
import { InstallWasmPanel } from "../components/install-wasm-panel";
import {
  useActivateExtension,
  useExtensions,
  useExtensionsRegistry,
  useInstallExtension,
  useRemoveExtension,
} from "../queries";

const kindLabel: Record<string, string> = {
  wasm_tool: "Tool",
  wasm_channel: "Channel",
  mcp_server: "MCP",
  channel_relay: "Relay",
};

const KIND_FILTER_OPTIONS: { value: "all" | ExtensionKind; label: string }[] = [
  { value: "all", label: "All types" },
  { value: "wasm_tool", label: "Tool" },
  { value: "wasm_channel", label: "Channel" },
  { value: "mcp_server", label: "MCP" },
  { value: "channel_relay", label: "Relay" },
];

type ExtensionRow = {
  name: string;
  displayName: string;
  kind: ExtensionKind;
  description?: string | null;
  keywords: string[];
  version?: string;
  active: boolean;
  isInstalled: boolean;
  needsSetup: boolean;
};

type SectionTitleProps = {
  children: string;
};

function SectionTitle({ children }: SectionTitleProps) {
  return <h2 className="mb-3 font-medium text-[11px] text-muted-foreground uppercase tracking-wider">{children}</h2>;
}

type KindBadgeProps = {
  kind: ExtensionKind;
};

function KindBadge({ kind }: KindBadgeProps) {
  const label = (kindLabel[kind] ?? kind).toUpperCase();
  return (
    <span className="rounded-md bg-emerald-500/15 px-1.5 py-0.5 font-semibold text-[10px] text-emerald-500 uppercase tracking-wide">
      {label}
    </span>
  );
}

type StatusDotProps = {
  active: boolean;
};

function StatusDot({ active }: StatusDotProps) {
  return (
    <span
      aria-hidden
      className={cn("inline-block size-2 shrink-0 rounded-full", active ? "bg-emerald-500" : "bg-red-500")}
      title={active ? "Active" : "Inactive"}
    />
  );
}

function matchesAvailableFilters(row: ExtensionRow, query: string, kind: "all" | ExtensionKind) {
  if (kind !== "all" && row.kind !== kind) return false;
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const blob = [row.displayName, row.name, row.description ?? "", ...row.keywords].join(" ").toLowerCase();
  return blob.includes(q);
}

type CatalogExtensionCardProps = {
  row: ExtensionRow;
  variant: "installed" | "available";
  pending: boolean;
  installPending: boolean;
  onInstall: () => void;
  onActivate: () => void;
  onRemove: () => void;
  onConfigure: () => void;
};

function CatalogExtensionCard({
  row,
  variant,
  pending,
  installPending,
  onInstall,
  onActivate,
  onRemove,
  onConfigure,
}: CatalogExtensionCardProps) {
  const isAvailable = variant === "available";

  return (
    <div
      className={cn(
        "relative flex flex-col rounded-xl border border-border bg-surface-high p-4 transition-shadow hover:shadow-sm",
        !isAvailable && row.active && "border-l-[3px] border-l-emerald-500 pl-[13px]"
      )}
    >
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <h3 className="font-semibold text-foreground text-sm">{row.displayName}</h3>
        <KindBadge kind={row.kind} />
        {row.version ? <span className="text-[11px] text-muted-foreground">v{row.version}</span> : null}
        {!isAvailable ? <StatusDot active={row.active} /> : null}
      </div>
      <p className="mb-2 line-clamp-3 flex-1 text-muted-foreground text-xs leading-relaxed">
        {row.description?.trim() || "—"}
      </p>
      {row.keywords.length > 0 ? (
        <p className="mb-3 font-mono text-[10px] text-muted-foreground/90">{row.keywords.join(", ")}</p>
      ) : (
        <div className="mb-3" />
      )}

      <div className="mt-auto flex flex-wrap gap-2">
        {pending ? <Loader className="size-4 shrink-0 animate-spin text-muted-foreground" /> : null}
        {isAvailable ? (
          <button
            className="rounded-lg border border-emerald-500/60 px-3 py-1.5 text-emerald-500 text-xs hover:bg-emerald-500/10 disabled:opacity-50"
            disabled={pending || installPending}
            onClick={onInstall}
            type="button"
          >
            Install
          </button>
        ) : (
          <>
            {row.needsSetup ? (
              <button
                className="flex items-center gap-1 rounded-lg border border-emerald-500/60 px-3 py-1.5 text-emerald-500 text-xs hover:bg-emerald-500/10 disabled:opacity-50"
                disabled={pending}
                onClick={onConfigure}
                type="button"
              >
                <Wrench size={12} />
                Configure
              </button>
            ) : null}
            {!row.active && (
              <button
                className="rounded-lg border border-emerald-500/60 px-3 py-1.5 text-emerald-500 text-xs hover:bg-emerald-500/10 disabled:opacity-50"
                disabled={pending}
                onClick={onActivate}
                type="button"
              >
                Activate
              </button>
            )}
            <button
              className="rounded-lg border border-red-500/50 px-3 py-1.5 text-red-500 text-xs hover:bg-red-500/10 disabled:opacity-50"
              disabled={pending}
              onClick={onRemove}
              type="button"
            >
              Remove
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export function ExtensionsMarket() {
  const { data: installed = [], isLoading: loadingInstalled } = useExtensions();
  const { data: registry = [], isLoading: loadingRegistry } = useExtensionsRegistry();
  const installMutation = useInstallExtension();
  const activateMutation = useActivateExtension();
  const removeMutation = useRemoveExtension();

  const [pendingName, setPendingName] = useState<string | null>(null);
  const [setupFor, setSetupFor] = useState<string | null>(null);
  const [filterQuery, setFilterQuery] = useState("");
  const [kindFilter, setKindFilter] = useState<"all" | ExtensionKind>("all");

  const installedByName = useMemo(() => Object.fromEntries(installed.map((e) => [e.name, e])), [installed]);

  const rows: ExtensionRow[] = useMemo(
    () =>
      registry.map((reg) => {
        const inst = installedByName[reg.name];
        return {
          name: reg.name,
          displayName: reg.display_name,
          kind: reg.kind,
          description: reg.description,
          keywords: reg.keywords ?? [],
          version: inst?.version ?? reg.version,
          active: inst?.active ?? false,
          isInstalled: reg.installed || Boolean(inst),
          needsSetup: inst?.needs_setup ?? false,
        };
      }),
    [registry, installedByName]
  );

  const installedRows = useMemo(
    () => rows.filter((r) => r.isInstalled).sort((a, b) => a.displayName.localeCompare(b.displayName)),
    [rows]
  );

  const availableRows = useMemo(() => {
    return rows
      .filter((r) => !r.isInstalled)
      .filter((r) => matchesAvailableFilters(r, filterQuery, kindFilter))
      .sort((a, b) => a.displayName.localeCompare(b.displayName));
  }, [rows, filterQuery, kindFilter]);

  const availableTotal = useMemo(() => rows.filter((r) => !r.isInstalled).length, [rows]);

  async function handleInstall(name: string) {
    setPendingName(name);
    try {
      await installMutation.mutateAsync({ name });
    } finally {
      setPendingName(null);
    }
  }

  async function handleActivate(name: string) {
    setPendingName(name);
    try {
      await activateMutation.mutateAsync(name);
    } finally {
      setPendingName(null);
    }
  }

  async function handleRemove(name: string) {
    setPendingName(name);
    try {
      await removeMutation.mutateAsync(name);
    } finally {
      setPendingName(null);
    }
  }

  const isLoading = loadingInstalled || loadingRegistry;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="relative mb-10 overflow-hidden rounded-2xl border border-border bg-surface-high px-6 py-8 sm:px-8">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(700px_circle_at_100%_0%,var(--primary)_0%,transparent_55%)] opacity-[0.1]" />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-border bg-surface-highest/80 px-3 py-1 text-muted-foreground text-xs">
              <Store className="text-primary" size={14} />
              Gateway extensions
            </div>
            <h1 className="font-bold text-2xl text-foreground tracking-tight sm:text-3xl">Extension marketplace</h1>
            <p className="mt-2 max-w-2xl text-muted-foreground text-sm leading-relaxed">
              Browse the registry, install WASM tools and channels by URL, then activate or configure them
            </p>
          </div>
          <Link
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-border bg-surface-highest/80 px-4 py-2.5 font-medium text-foreground text-sm transition-colors hover:bg-surface-highest"
            to="/dashboard"
          >
            <span>Service add-ons</span>
          </Link>
        </div>
      </div>

      <div className="mb-10 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_300px] lg:items-start">
        <InstallWasmPanel />
        <div className="rounded-xl border border-border border-dashed bg-surface-high/50 p-4 text-muted-foreground text-xs leading-relaxed lg:sticky lg:top-6">
          <p className="font-medium text-foreground text-sm">Channels &amp; MCP</p>
          <p className="mt-2">
            Messaging extensions also appear in <span className="font-medium text-foreground">Settings → Channels</span>{" "}
            for pairing and transport. MCP quick-add stays under{" "}
            <span className="font-medium text-foreground">Settings → MCP</span>.
          </p>
        </div>
      </div>

      <div className="space-y-10">
        {isLoading ? (
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <Loader className="animate-spin" size={16} />
            Loading extensions…
          </div>
        ) : rows.length === 0 ? (
          <p className="text-muted-foreground text-sm">No extensions in the registry.</p>
        ) : (
          <>
            <section>
              <SectionTitle>Installed</SectionTitle>
              {installedRows.length === 0 ? (
                <p className="text-muted-foreground text-sm">
                  Nothing installed yet. Use the catalog below or install from URL above.
                </p>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {installedRows.map((row) => (
                    <CatalogExtensionCard
                      installPending={installMutation.isPending}
                      key={row.name}
                      onActivate={() => void handleActivate(row.name)}
                      onConfigure={() => setSetupFor(row.name)}
                      onInstall={() => void handleInstall(row.name)}
                      onRemove={() => void handleRemove(row.name)}
                      pending={pendingName === row.name}
                      row={row}
                      variant="installed"
                    />
                  ))}
                </div>
              )}
            </section>

            <section>
              <SectionTitle>Available in registry</SectionTitle>
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="relative max-w-xl flex-1">
                  <Search
                    aria-hidden
                    className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
                  />
                  <input
                    className={cn(inferenceControlClass, "w-full max-w-none pl-9 sm:max-w-xl")}
                    onChange={(e) => setFilterQuery(e.target.value)}
                    placeholder="Search name, description, tags…"
                    type="search"
                    value={filterQuery}
                  />
                </div>
                <select
                  aria-label="Filter by extension type"
                  className={cn(inferenceSelectClass, "w-full sm:w-48")}
                  onChange={(e) => setKindFilter(e.target.value as "all" | ExtensionKind)}
                  value={kindFilter}
                >
                  {KIND_FILTER_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
              <p className="mb-3 text-muted-foreground text-xs">
                Showing {availableRows.length} of {availableTotal} available
                {filterQuery.trim() || kindFilter !== "all" ? " (filtered)" : ""}.
              </p>
              {availableRows.length === 0 ? (
                <p className="text-muted-foreground text-sm">
                  No matching extensions. Clear filters or install from URL above.
                </p>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  {availableRows.map((row) => (
                    <CatalogExtensionCard
                      installPending={installMutation.isPending}
                      key={row.name}
                      onActivate={() => void handleActivate(row.name)}
                      onConfigure={() => setSetupFor(row.name)}
                      onInstall={() => void handleInstall(row.name)}
                      onRemove={() => void handleRemove(row.name)}
                      pending={pendingName === row.name}
                      row={row}
                      variant="available"
                    />
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </div>

      <ExtensionSetupDialog extensionName={setupFor} onClose={() => setSetupFor(null)} />
    </div>
  );
}

export default function ExtensionsMarketPage() {
  return <ExtensionsMarket />;
}
