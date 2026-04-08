import { Binary, ChevronDown, ExternalLink, Link2, Loader, Search, Store, Wrench } from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router";

import { hasEmbeddedAddonUi } from "@/addons/addon-ui-registry";
import { ExtensionBrandAvatar } from "@/common/components/extension-brand-avatar";
import { Badge, Button, Input } from "@/common/components/ui";
import { cn } from "@/common/lib/utils";
import { extensionKindBadgeClass } from "@/extensions/lib/extension-kind-styles";
import type { ExtensionKind } from "@/settings/api-types";
import { inferenceSelectClass } from "@/settings/components/inference-settings-ui";
import { ExtensionSetupDialog } from "../components/extension-setup-dialog";
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

type KindFilterValue = "all" | ExtensionKind | "embedded";

// Task 4: filter bar will consume these
export const KIND_FILTER_OPTIONS: { value: KindFilterValue; label: string }[] = [
  { value: "all", label: "All types" },
  { value: "wasm_tool", label: "Tool" },
  { value: "wasm_channel", label: "Channel" },
  { value: "mcp_server", label: "MCP" },
  { value: "channel_relay", label: "Relay" },
  { value: "embedded", label: "Embedded" },
];

export const STATUS_FILTER_OPTIONS: { value: "all" | "installed" | "available"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "installed", label: "Installed" },
  { value: "available", label: "Available" },
];

const KIND_OPTIONS: { value: ExtensionKind; label: string; hint: string }[] = [
  { value: "wasm_tool", label: "WASM tool", hint: "Agent tools & capabilities" },
  { value: "wasm_channel", label: "WASM channel", hint: "Messaging / transport" },
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
  isInRegistry: boolean;
  hasEmbeddedUi: boolean;
};

type KindBadgeProps = {
  kind: ExtensionKind;
};

function KindBadge({ kind }: KindBadgeProps) {
  const label = (kindLabel[kind] ?? kind).toUpperCase();
  return (
    <Badge className={cn("px-1.5 font-semibold text-[9px] uppercase tracking-wide", extensionKindBadgeClass(kind))}>
      {label}
    </Badge>
  );
}

function matchesFilters(
  row: ExtensionRow,
  query: string,
  kind: KindFilterValue,
  status: "all" | "installed" | "available"
) {
  if (status === "installed" && !row.isInstalled) return false;
  if (status === "available" && row.isInstalled) return false;
  if (kind === "embedded" && !row.hasEmbeddedUi) return false;
  if (kind !== "all" && kind !== "embedded" && row.kind !== kind) return false;
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
        "group relative flex flex-col overflow-hidden rounded-xl border border-border bg-surface-low transition-colors",
        !isAvailable && row.active && "border-success/35"
      )}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(380px_circle_at_100%_0%,var(--primary)_0%,transparent_65%)] opacity-[0.04] group-hover:opacity-[0.07]"
      />
      <div className="relative flex flex-1 flex-col gap-2 p-3">
        <div className="flex items-start gap-3">
          <ExtensionBrandAvatar
            className="size-9 rounded-lg"
            description={row.description}
            displayName={row.displayName}
            keywords={row.keywords}
            name={row.name}
          />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <h3 className="truncate font-semibold text-foreground text-sm">{row.displayName}</h3>
              <KindBadge kind={row.kind} />
              {!row.isInRegistry ? (
                <Badge className="bg-muted px-1.5 font-semibold text-[9px] text-muted-foreground uppercase tracking-wide">
                  SIDELOADED
                </Badge>
              ) : null}
              {row.hasEmbeddedUi ? <Badge variant="primary">Embedded</Badge> : null}
              {!isAvailable ? (
                <span
                  className={cn(
                    "ml-auto inline-flex shrink-0 items-center gap-1 rounded-full px-1.5 py-0.5 font-medium text-[10px]",
                    row.active ? "bg-success-muted text-success" : "bg-muted/80 text-muted-foreground"
                  )}
                >
                  <span
                    aria-hidden
                    className={cn(
                      "size-1.5 shrink-0 rounded-full",
                      row.active ? "bg-success" : "bg-muted-foreground/50"
                    )}
                  />
                  {row.active ? "Live" : "Inactive"}
                </span>
              ) : null}
            </div>
            <div className="mt-0.5 flex items-center gap-1.5 text-[10px] text-muted-foreground">
              <span className="truncate font-mono opacity-90">{row.name}</span>
              {row.version ? (
                <span className="shrink-0 rounded bg-surface-highest px-1 py-0.5 font-medium">v{row.version}</span>
              ) : null}
            </div>
            <p className="mt-0.5 truncate text-muted-foreground text-xs">{row.description?.trim() || "—"}</p>
          </div>
        </div>

        {!isAvailable && row.hasEmbeddedUi ? (
          <div className="flex items-center gap-1.5 border-border border-t pt-2">
            <Button as={Link} size="sm" to={`/addons/${row.name}/start`}>
              <ExternalLink className="size-3" />
              Open
            </Button>
            <Button as={Link} size="sm" to={`/addons/${row.name}/manage`} variant="outline">
              About
            </Button>
          </div>
        ) : null}

        <div
          className={cn(
            "mt-auto flex items-center gap-1.5 border-border border-t pt-2",
            !isAvailable && row.hasEmbeddedUi && "border-t-0 pt-0"
          )}
        >
          {isAvailable ? (
            <Button
              className="w-full sm:w-auto"
              disabled={pending || installPending}
              onClick={onInstall}
              size="sm"
              type="button"
            >
              {installPending ? <Loader className="size-3.5 animate-spin" /> : null}
              Install
            </Button>
          ) : (
            <>
              {row.needsSetup ? (
                <Button
                  className="border-success/50 bg-success-muted/30 text-success hover:bg-success-muted/50"
                  disabled={pending}
                  onClick={onConfigure}
                  size="sm"
                  type="button"
                  variant="outline"
                >
                  <Wrench className="size-3" strokeWidth={2} />
                  Configure
                </Button>
              ) : null}
              {!row.active ? (
                <Button disabled={pending} onClick={onActivate} size="sm" type="button">
                  Activate
                </Button>
              ) : null}
              <Button
                className="ml-auto"
                disabled={pending}
                onClick={onRemove}
                size="sm"
                type="button"
                variant="destructive"
              >
                {pending ? <Loader className="size-3.5 animate-spin" /> : null}
                Remove
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

type FilterSidebarProps = {
  kindFilter: KindFilterValue;
  statusFilter: "all" | "installed" | "available";
  onKindChange: (v: KindFilterValue) => void;
  onStatusChange: (v: "all" | "installed" | "available") => void;
  resultCount: number;
  totalCount: number;
};

function FilterSidebar({
  kindFilter,
  statusFilter,
  onKindChange,
  onStatusChange,
  resultCount,
  totalCount,
}: FilterSidebarProps) {
  return (
    <>
      {/* Desktop sticky sidebar */}
      <aside className="hidden w-52 shrink-0 flex-col gap-5 self-start lg:sticky lg:top-6 lg:flex">
        <div>
          <p className="mb-2 font-medium text-[10px] text-muted-foreground uppercase tracking-wider">Type</p>
          <div aria-label="Filter by type" className="flex flex-col gap-0.5" role="group">
            {KIND_FILTER_OPTIONS.map((o) => (
              <button
                className={cn(
                  "rounded-lg px-3 py-1.5 text-left font-medium text-sm transition-colors",
                  kindFilter === o.value
                    ? "bg-primary text-on-primary-fixed"
                    : "text-muted-foreground hover:bg-surface-highest hover:text-foreground"
                )}
                key={o.value}
                onClick={() => onKindChange(o.value)}
                type="button"
              >
                {o.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-2 font-medium text-[10px] text-muted-foreground uppercase tracking-wider">Status</p>
          <div aria-label="Filter by status" className="flex flex-col gap-0.5" role="group">
            {STATUS_FILTER_OPTIONS.map((o) => (
              <button
                className={cn(
                  "rounded-lg px-3 py-1.5 text-left font-medium text-sm transition-colors",
                  statusFilter === o.value
                    ? "bg-primary text-on-primary-fixed"
                    : "text-muted-foreground hover:bg-surface-highest hover:text-foreground"
                )}
                key={o.value}
                onClick={() => onStatusChange(o.value)}
                type="button"
              >
                {o.label}
              </button>
            ))}
          </div>
        </div>

        <p className="text-[11px] text-muted-foreground">
          Showing {resultCount} of {totalCount}
        </p>
      </aside>

      {/* Mobile horizontal pills */}
      <div className="flex flex-wrap gap-x-3 gap-y-1.5 lg:hidden">
        <div aria-label="Filter by type" className="flex flex-wrap gap-1.5" role="group">
          {KIND_FILTER_OPTIONS.map((o) => (
            <button
              className={cn(
                "rounded-full px-3 py-1 font-medium text-xs transition-colors",
                kindFilter === o.value
                  ? "bg-primary text-on-primary-fixed"
                  : "bg-surface-highest text-muted-foreground hover:bg-surface-variant hover:text-foreground"
              )}
              key={o.value}
              onClick={() => onKindChange(o.value)}
              type="button"
            >
              {o.label}
            </button>
          ))}
        </div>
        <div aria-label="Filter by status" className="flex flex-wrap gap-1.5" role="group">
          {STATUS_FILTER_OPTIONS.map((o) => (
            <button
              className={cn(
                "rounded-full px-3 py-1 font-medium text-xs transition-colors",
                statusFilter === o.value
                  ? "bg-primary text-on-primary-fixed"
                  : "bg-surface-highest text-muted-foreground hover:bg-surface-variant hover:text-foreground"
              )}
              key={o.value}
              onClick={() => onStatusChange(o.value)}
              type="button"
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>
    </>
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
  const [kindFilter, setKindFilter] = useState<KindFilterValue>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "installed" | "available">("all");
  const [installOpen, setInstallOpen] = useState(false);
  const [installName, setInstallName] = useState("");
  const [installUrl, setInstallUrl] = useState("");
  const [installKind, setInstallKind] = useState<ExtensionKind>("wasm_tool");

  const installedByName = useMemo(() => Object.fromEntries(installed.map((e) => [e.name, e])), [installed]);
  const activeCount = useMemo(() => installed.filter((e) => e.active).length, [installed]);

  const rows: ExtensionRow[] = useMemo(() => {
    const registryNames = new Set(registry.map((r) => r.name));

    const registryRows: ExtensionRow[] = registry.map((reg) => {
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
        isInRegistry: true,
        hasEmbeddedUi: hasEmbeddedAddonUi(reg.name),
      };
    });

    const sideloadedRows: ExtensionRow[] = installed
      .filter((inst) => !registryNames.has(inst.name))
      .map((inst) => ({
        name: inst.name,
        displayName: inst.display_name || inst.name,
        kind: inst.kind,
        description: inst.description,
        keywords: [],
        version: inst.version,
        active: inst.active,
        isInstalled: true,
        needsSetup: inst.needs_setup,
        isInRegistry: false,
        hasEmbeddedUi: hasEmbeddedAddonUi(inst.name),
      }));

    return [...registryRows, ...sideloadedRows];
  }, [registry, installed, installedByName]);

  const filteredRows = useMemo(
    () =>
      rows
        .filter((r) => matchesFilters(r, filterQuery, kindFilter, statusFilter))
        .sort((a, b) => {
          if (a.isInstalled !== b.isInstalled) return a.isInstalled ? -1 : 1;
          return a.displayName.localeCompare(b.displayName);
        }),
    [rows, filterQuery, kindFilter, statusFilter]
  );

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

  function handleInstallSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!installName.trim()) return;
    installMutation.mutate(
      { name: installName.trim(), url: installUrl.trim() || undefined, kind: installKind },
      {
        onSuccess: () => {
          setInstallName("");
          setInstallUrl("");
          setInstallOpen(false);
        },
      }
    );
  }

  const isLoading = loadingInstalled || loadingRegistry;

  return (
    <div className="px-4 py-8 sm:px-6">
      <div className="relative mb-8 overflow-hidden rounded-xl border border-border bg-surface-high px-5 py-6 sm:px-6">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(700px_circle_at_100%_0%,var(--primary)_0%,transparent_55%)] opacity-[0.1]" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(560px_circle_at_0%_100%,var(--chart-5)_0%,transparent_50%)] opacity-[0.05]" />
        <div className="relative">
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-border bg-surface-highest/80 px-3 py-1 text-muted-foreground text-xs">
            <Store className="text-primary" size={14} />
            Gateway extensions
          </div>
          <h1 className="font-bold font-display text-2xl text-foreground tracking-tight sm:text-3xl">
            Extension marketplace
          </h1>
          <p className="mt-2 text-muted-foreground text-sm leading-relaxed">
            Browse the registry, install WASM tools and channels by URL, then activate or configure them
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface-highest/80 px-2.5 py-1 text-muted-foreground text-xs">
              <span aria-hidden className="size-1.5 rounded-full bg-muted-foreground/40" />
              {installed.length} installed
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-success/30 bg-success-muted px-2.5 py-1 text-success text-xs">
              <span aria-hidden className="size-1.5 rounded-full bg-success" />
              {activeCount} active
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary-container/90 px-2.5 py-1 text-primary text-xs">
              <span aria-hidden className="size-1.5 rounded-full bg-primary" />
              {registry.length} in registry
            </span>
          </div>
        </div>
      </div>

      <div className="relative mb-6 overflow-hidden rounded-2xl border border-border bg-surface-high shadow-sm">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(900px_circle_at_100%_0%,var(--primary)_0%,transparent_55%)] opacity-[0.07]"
        />
        <button
          aria-expanded={installOpen}
          className="relative flex w-full items-center gap-3 px-5 py-4 text-left transition-colors hover:bg-surface-highest/30"
          onClick={() => setInstallOpen((v) => !v)}
          type="button"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
            <Binary size={20} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-foreground text-sm">Install from WASM URL</p>
            <p className="mt-0.5 text-muted-foreground text-xs">
              Paste a direct link to a <span className="font-mono text-[11px]">.wasm</span> bundle
            </p>
          </div>
          <ChevronDown
            className={cn(
              "shrink-0 text-muted-foreground transition-transform duration-200",
              installOpen && "rotate-180"
            )}
            size={18}
          />
        </button>
        <div
          className="grid overflow-hidden transition-[grid-template-rows] duration-200"
          style={{ gridTemplateRows: installOpen ? "1fr" : "0fr" }}
        >
          <div className="overflow-hidden">
            <div className="relative border-border border-t px-5 pt-4 pb-5">
              <form className="space-y-4" onSubmit={handleInstallSubmit}>
                <div>
                  <label className="mb-1.5 block font-medium text-muted-foreground text-xs" htmlFor="wasm-ext-name">
                    Extension id <span className="text-destructive">*</span>
                  </label>
                  <Input
                    autoComplete="off"
                    className="w-full max-w-full font-mono"
                    id="wasm-ext-name"
                    onChange={(e) => setInstallName(e.target.value)}
                    placeholder="e.g. polymarket-copy-bot"
                    required
                    value={installName}
                  />
                </div>
                <div>
                  <label
                    className="mb-1.5 flex items-center gap-1.5 font-medium text-muted-foreground text-xs"
                    htmlFor="wasm-ext-url"
                  >
                    <Link2 className="text-muted-foreground" size={12} />
                    WASM URL
                  </label>
                  <Input
                    className="w-full max-w-full font-mono"
                    id="wasm-ext-url"
                    inputMode="url"
                    onChange={(e) => setInstallUrl(e.target.value)}
                    placeholder="https://…/extension.wasm"
                    type="url"
                    value={installUrl}
                  />
                </div>
                <div>
                  <label className="mb-1.5 block font-medium text-muted-foreground text-xs" htmlFor="wasm-ext-kind">
                    Kind
                  </label>
                  <select
                    className={cn(inferenceSelectClass, "max-w-full")}
                    id="wasm-ext-kind"
                    onChange={(e) => setInstallKind(e.target.value as ExtensionKind)}
                    value={installKind}
                  >
                    {KIND_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label} — {o.hint}
                      </option>
                    ))}
                  </select>
                </div>
                {installMutation.error ? (
                  <p className="text-destructive text-xs">{installMutation.error.message}</p>
                ) : null}
                <Button
                  className="w-full font-semibold"
                  disabled={!installName.trim() || installMutation.isPending}
                  size="lg"
                  type="submit"
                >
                  {installMutation.isPending ? "Installing…" : "Install WASM extension"}
                </Button>
              </form>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        <FilterSidebar
          kindFilter={kindFilter}
          onKindChange={setKindFilter}
          onStatusChange={setStatusFilter}
          resultCount={filteredRows.length}
          statusFilter={statusFilter}
          totalCount={rows.length}
        />

        <div className="min-w-0 flex-1">
          {/* Mobile filter result count */}
          <p className="mb-3 text-muted-foreground text-xs lg:hidden">
            Showing {filteredRows.length} of {rows.length}
          </p>

          {/* Search bar */}
          <div className="relative mb-4">
            <Search
              aria-hidden
              className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              aria-label="Search extensions"
              className="w-full pl-9"
              onChange={(e) => setFilterQuery(e.target.value)}
              placeholder="Search name, description, tags…"
              type="search"
              value={filterQuery}
            />
          </div>

          {/* Card list */}
          <div className="space-y-4">
            {isLoading ? (
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <Loader className="animate-spin" size={16} />
                Loading extensions…
              </div>
            ) : rows.length === 0 ? (
              <p className="text-muted-foreground text-sm">No extensions in the registry.</p>
            ) : filteredRows.length === 0 ? (
              <p className="text-muted-foreground text-sm">No matching extensions. Try clearing filters.</p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {filteredRows.map((row) => (
                  <CatalogExtensionCard
                    installPending={installMutation.isPending}
                    key={row.name}
                    onActivate={() => void handleActivate(row.name)}
                    onConfigure={() => setSetupFor(row.name)}
                    onInstall={() => void handleInstall(row.name)}
                    onRemove={() => void handleRemove(row.name)}
                    pending={pendingName === row.name}
                    row={row}
                    variant={row.isInstalled ? "installed" : "available"}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <ExtensionSetupDialog extensionName={setupFor} onClose={() => setSetupFor(null)} />
    </div>
  );
}

export default function ExtensionsMarketPage() {
  return <ExtensionsMarket />;
}
