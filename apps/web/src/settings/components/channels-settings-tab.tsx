import { ChevronDown, ChevronRight, Loader, Wrench } from "lucide-react";
import { type ReactNode, useMemo, useState } from "react";
import { ExtensionBrandAvatar } from "@/common/components/extension-brand-avatar";
import { cn } from "@/common/lib/utils";
import { ExtensionSetupDialog } from "@/extensions/components/extension-setup-dialog";
import {
  useActivateExtension,
  useExtensions,
  useExtensionsRegistry,
  useInstallExtension,
  useRemoveExtension,
} from "@/extensions/queries";
import { useGatewayStatus, useGeneralSettings } from "../queries";
import { SettingsKeysTab } from "./settings-keys-tab";

/* ── helpers ─────────────────────────────────────────────── */

const MESSAGING_KINDS = new Set(["wasm_channel", "channel_relay"]);

function StatusBadge({ active, label }: { active: boolean; label?: string }) {
  return (
    <span
      className={cn(
        "rounded-md px-2 py-0.5 font-medium text-[10px]",
        active ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"
      )}
    >
      {label ?? (active ? "Live" : "Inactive")}
    </span>
  );
}

function SectionHeader({ children }: { children: ReactNode }) {
  return <h2 className="mb-3 font-semibold text-[13px] text-muted-foreground uppercase tracking-wider">{children}</h2>;
}

function channelActiveFromList(enabled: string[], patterns: RegExp[]) {
  const lower = enabled.map((c) => c.toLowerCase());
  return patterns.some((re) => lower.some((c) => re.test(c)));
}

/* ── ProgressBar ─────────────────────────────────────────── */

function ProgressBar({ installed, configured, active }: { installed: boolean; configured: boolean; active: boolean }) {
  return (
    <div className="mt-3">
      <div className="flex gap-1.5">
        <div className={cn("h-1 flex-1 rounded-full", installed ? "bg-success" : "bg-border")} />
        <div className={cn("h-1 flex-1 rounded-full", configured ? "bg-success" : "bg-border")} />
        <div className={cn("h-1 flex-1 rounded-full", active ? "bg-success" : "bg-border")} />
      </div>
      <div className="mt-1 flex justify-between text-[10px] text-muted-foreground">
        <span>Installed</span>
        <span>Configured</span>
        <span>Active</span>
      </div>
    </div>
  );
}

/* ── ChannelsSettingsTab ─────────────────────────────────── */

export function ChannelsSettingsTab() {
  const { data: gateway, isLoading: loadingGateway } = useGatewayStatus();
  const { data: settings } = useGeneralSettings();
  const { data: installed = [], isLoading: loadingInstalled } = useExtensions();
  const { data: registry = [], isLoading: loadingRegistry } = useExtensionsRegistry();
  const installMutation = useInstallExtension();
  const activateMutation = useActivateExtension();
  const removeMutation = useRemoveExtension();

  const [pendingName, setPendingName] = useState<string | null>(null);
  const [setupFor, setSetupFor] = useState<string | null>(null);
  const [advancedOpen, setAdvancedOpen] = useState(false);

  const installedByName = useMemo(() => Object.fromEntries(installed.map((e) => [e.name, e])), [installed]);
  const enabledList = gateway?.enabled_channels ?? [];

  const httpActive = useMemo(() => {
    if (settings && typeof settings.ENABLE_HTTP === "string") {
      return settings.ENABLE_HTTP.toLowerCase() === "true" || settings.ENABLE_HTTP === "1";
    }
    return channelActiveFromList(enabledList, [/http/, /webhook/]);
  }, [settings, enabledList]);

  const builtIns = useMemo(
    () => [
      {
        title: "Web Gateway",
        detail: gateway ? `${gateway.sse_connections} SSE · ${gateway.ws_connections} WS` : "",
        active: Boolean(gateway && (gateway.sse_connections > 0 || gateway.ws_connections > 0)),
      },
      {
        title: "HTTP Webhook",
        detail: httpActive ? "Enabled" : "Disabled",
        active: httpActive,
      },
      {
        title: "CLI",
        detail: "",
        active: channelActiveFromList(enabledList, [/^cli$/i, /cli/]),
      },
      {
        title: "REPL",
        detail: "",
        active: channelActiveFromList(enabledList, [/^repl$/i, /repl/]),
      },
    ],
    [gateway, enabledList, httpActive]
  );

  const messagingRows = useMemo(() => {
    return registry
      .filter((r) => MESSAGING_KINDS.has(r.kind))
      .map((reg) => {
        const inst = installedByName[reg.name];
        return {
          name: reg.name,
          displayName: reg.display_name,
          kind: reg.kind,
          description: reg.description ?? "",
          keywords: reg.keywords ?? [],
          version: inst?.version ?? reg.version,
          isInstalled: reg.installed || Boolean(inst),
          needsSetup: inst?.needs_setup ?? false,
          active: inst?.active ?? false,
        };
      })
      .sort((a, b) => a.displayName.localeCompare(b.displayName));
  }, [registry, installedByName]);

  async function handleInstall(name: string) {
    setPendingName(name);
    try {
      await installMutation.mutateAsync({ name });
    } finally {
      setPendingName(null);
    }
  }

  async function handleToggleActive(name: string, currentlyActive: boolean) {
    setPendingName(name);
    try {
      if (currentlyActive) await removeMutation.mutateAsync(name);
      else await activateMutation.mutateAsync(name);
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

  const loading = loadingGateway || loadingInstalled || loadingRegistry;

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-8 text-muted-foreground text-sm">
        <Loader className="animate-spin" size={16} />
        Loading channels…
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Built-in channels */}
      <section>
        <SectionHeader>Built-in Channels</SectionHeader>
        <div className="grid grid-cols-2 gap-2.5">
          {builtIns.map((b) => (
            <div className="rounded-xl bg-white p-3.5 shadow-xs" key={b.title}>
              <div className="mb-1.5 flex items-center justify-between">
                <span className="font-semibold text-[13px] text-foreground">{b.title}</span>
                <StatusBadge active={b.active} />
              </div>
              {b.detail && <p className="text-[11px] text-muted-foreground">{b.detail}</p>}
            </div>
          ))}
        </div>
      </section>

      {/* Messaging channels */}
      <section>
        <SectionHeader>Messaging Channels</SectionHeader>
        {messagingRows.length === 0 ? (
          <p className="text-[13px] text-muted-foreground">No messaging extensions in the registry.</p>
        ) : (
          <div className="flex flex-col gap-2.5">
            {messagingRows.map((row) => {
              const pending = pendingName === row.name;
              const configuredStep = row.isInstalled && !row.needsSetup;

              return (
                <div className="rounded-xl bg-white p-4 shadow-xs" key={row.name}>
                  {/* Header */}
                  <div className="flex items-center gap-3">
                    <ExtensionBrandAvatar
                      description={row.description}
                      displayName={row.displayName}
                      keywords={row.keywords}
                      name={row.name}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-[14px] text-foreground">{row.displayName}</p>
                      <p className="text-[11px] text-muted-foreground">{row.description || "—"}</p>
                    </div>
                    {/* Action / status */}
                    {!row.isInstalled ? (
                      <button
                        className="shrink-0 rounded-lg bg-primary px-3 py-1.5 font-medium text-[11px] text-white transition-colors hover:bg-primary/90 disabled:opacity-50"
                        disabled={pending || installMutation.isPending}
                        onClick={() => void handleInstall(row.name)}
                        type="button"
                      >
                        {pending ? <Loader className="animate-spin" size={12} /> : "Install"}
                      </button>
                    ) : row.active ? (
                      <StatusBadge active label="Active" />
                    ) : null}
                  </div>

                  {/* Installed: progress + actions */}
                  {row.isInstalled && (
                    <>
                      <ProgressBar active={row.active} configured={configuredStep} installed />

                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        {row.needsSetup ? (
                          <button
                            className="flex items-center gap-1 rounded-lg border border-success/40 px-2.5 py-1.5 font-medium text-[11px] text-success transition-colors hover:bg-success/5 disabled:opacity-50"
                            disabled={pending}
                            onClick={() => setSetupFor(row.name)}
                            type="button"
                          >
                            <Wrench size={12} />
                            Setup
                          </button>
                        ) : !row.active ? (
                          <button
                            className="rounded-lg bg-primary px-2.5 py-1.5 font-medium text-[11px] text-white transition-colors hover:bg-primary/90 disabled:opacity-50"
                            disabled={pending}
                            onClick={() => void handleToggleActive(row.name, false)}
                            type="button"
                          >
                            Activate
                          </button>
                        ) : (
                          <button
                            className="rounded-lg bg-surface-high px-2.5 py-1.5 font-medium text-[11px] text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
                            disabled={pending}
                            onClick={() => void handleToggleActive(row.name, true)}
                            type="button"
                          >
                            Deactivate
                          </button>
                        )}
                        <button
                          className="rounded-lg border border-destructive/30 px-2.5 py-1.5 font-medium text-[11px] text-destructive transition-colors hover:bg-destructive/5 disabled:opacity-50"
                          disabled={pending}
                          onClick={() => void handleRemove(row.name)}
                          type="button"
                        >
                          Remove
                        </button>
                        {pending && <Loader className="animate-spin text-muted-foreground" size={14} />}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Advanced (collapsible) */}
      <div className="rounded-2xl bg-white shadow-xs">
        <button
          className="flex w-full items-center justify-between p-4 text-left"
          onClick={() => setAdvancedOpen((v) => !v)}
          type="button"
        >
          <div>
            <h3 className="font-semibold text-[13px] text-foreground">Advanced settings</h3>
            <p className="mt-0.5 text-[11px] text-muted-foreground">channels.* and signal.* keys</p>
          </div>
          {advancedOpen ? (
            <ChevronDown className="text-muted-foreground" size={16} />
          ) : (
            <ChevronRight className="text-muted-foreground" size={16} />
          )}
        </button>
        {advancedOpen && (
          <div className="border-border border-t px-4 pt-3 pb-4">
            <SettingsKeysTab prefixes={["channels.", "signal."]} />
          </div>
        )}
      </div>

      <ExtensionSetupDialog extensionName={setupFor} onClose={() => setSetupFor(null)} />
    </div>
  );
}
