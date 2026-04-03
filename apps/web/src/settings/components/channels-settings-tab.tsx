import { Check, Circle, Loader, Wrench } from "lucide-react";
import { type ReactNode, useMemo, useState } from "react";
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

const MESSAGING_KINDS = new Set(["wasm_channel", "channel_relay"]);

function StatusDot({ active }: { active: boolean }) {
  return (
    <span
      aria-hidden
      className={cn("inline-block size-2 shrink-0 rounded-full", active ? "bg-success" : "bg-destructive")}
    />
  );
}

function Pill({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span className={cn("rounded-md px-1.5 py-0.5 font-medium text-[10px] uppercase tracking-wide", className)}>
      {children}
    </span>
  );
}

function SectionTitle({ children }: { children: ReactNode }) {
  return <h2 className="mb-3 font-medium text-[11px] text-muted-foreground uppercase tracking-wider">{children}</h2>;
}

type StepKey = "installed" | "configured" | "active";

function InstallationStepper({
  installed,
  configured,
  active,
}: {
  installed: boolean;
  configured: boolean;
  active: boolean;
}) {
  const steps: { key: StepKey; label: string; done: boolean }[] = [
    { key: "installed", label: "Installed", done: installed },
    { key: "configured", label: "Configured", done: configured },
    { key: "active", label: "Active", done: active },
  ];

  return (
    <div className="mb-3 flex items-center gap-0">
      {steps.map((s, i) => (
        <div className="flex min-w-0 flex-1 items-center" key={s.key}>
          <div className="flex min-w-0 flex-col items-center gap-1">
            <div
              className={cn(
                "flex size-6 items-center justify-center rounded-full border",
                s.done ? "border-success/60 bg-success/10 text-success" : "border-border text-muted-foreground"
              )}
            >
              {s.done ? <Check size={14} strokeWidth={2.5} /> : <Circle size={12} />}
            </div>
            <span className="text-center text-[10px] text-muted-foreground leading-tight">{s.label}</span>
          </div>
          {i < steps.length - 1 ? (
            <div aria-hidden className="mx-1 h-px min-w-[12px] flex-1 border-border border-t border-dashed" />
          ) : null}
        </div>
      ))}
    </div>
  );
}

function channelActiveFromList(enabled: string[], patterns: RegExp[]) {
  const lower = enabled.map((c) => c.toLowerCase());
  return patterns.some((re) => lower.some((c) => re.test(c)));
}

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

  const installedByName = useMemo(() => Object.fromEntries(installed.map((e) => [e.name, e])), [installed]);

  const enabledList = gateway?.enabled_channels ?? [];
  const httpHint =
    settings && typeof settings.ENABLE_HTTP === "string"
      ? `ENABLE_HTTP=${settings.ENABLE_HTTP}`
      : "Configure via ENABLE_HTTP on the gateway host.";

  const builtIns = useMemo(
    () => [
      {
        id: "web_gateway",
        title: "Web Gateway",
        description: "Browser chat, SSE, and WebSocket connections to this gateway.",
        detail: gateway ? `SSE: ${gateway.sse_connections} · WS: ${gateway.ws_connections}` : "Loading…",
        active: Boolean(gateway && (gateway.sse_connections > 0 || gateway.ws_connections > 0)),
      },
      {
        id: "http_webhook",
        title: "HTTP Webhook",
        description: "Inbound HTTP webhook channel with optional HMAC verification.",
        detail: httpHint,
        active: channelActiveFromList(enabledList, [/http/, /webhook/]),
      },
      {
        id: "cli",
        title: "CLI",
        description: "Command-line interface channel when enabled on the gateway.",
        detail: "Uses gateway channel configuration.",
        active: channelActiveFromList(enabledList, [/^cli$/i, /cli/]),
      },
      {
        id: "repl",
        title: "REPL",
        description: "Interactive REPL channel when enabled on the gateway.",
        detail: "Uses gateway channel configuration.",
        active: channelActiveFromList(enabledList, [/^repl$/i, /repl/]),
      },
    ],
    [gateway, enabledList, httpHint]
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
      if (currentlyActive) {
        await removeMutation.mutateAsync(name);
      } else {
        await activateMutation.mutateAsync(name);
      }
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

  return (
    <div className="space-y-8">
      <p className="text-muted-foreground text-sm">
        Built-in transports reflect gateway status. Messaging integrations come from the extensions registry and
        installed WASM channels.
      </p>

      {loading ? (
        <div className="flex items-center gap-2 text-muted-foreground text-sm">
          <Loader className="animate-spin" size={16} />
          Loading channels…
        </div>
      ) : null}

      {!loading ? (
        <>
          <section>
            <SectionTitle>Built-in channels</SectionTitle>
            <div className="grid gap-3 sm:grid-cols-2">
              {builtIns.map((b) => (
                <div
                  className={cn(
                    "relative overflow-hidden rounded-xl border border-border bg-surface-high p-4",
                    b.active && "border-l-[3px] border-l-success pl-[13px]"
                  )}
                  key={b.id}
                >
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold text-foreground text-sm">{b.title}</h3>
                    <Pill className="bg-muted/40 text-muted-foreground">Built-in</Pill>
                    <StatusDot active={b.active} />
                  </div>
                  <p className="mb-2 text-muted-foreground text-xs leading-relaxed">{b.description}</p>
                  <p className="mb-3 font-mono text-[11px] text-muted-foreground/90">{b.detail}</p>
                  <p className={cn("font-medium text-xs", b.active ? "text-success" : "text-muted-foreground")}>
                    {b.active ? "Active" : "Inactive"}
                  </p>
                </div>
              ))}
            </div>
          </section>

          <section>
            <SectionTitle>Messaging channels</SectionTitle>
            {messagingRows.length === 0 ? (
              <p className="text-muted-foreground text-sm">No messaging extensions in the registry.</p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {messagingRows.map((row) => {
                  const pending = pendingName === row.name;
                  const installedStep = row.isInstalled;
                  const configuredStep = row.isInstalled && !row.needsSetup;
                  const activeStep = row.active;

                  return (
                    <div
                      className="rounded-xl border border-border border-dashed bg-surface-high/80 p-4"
                      key={row.name}
                    >
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold text-foreground text-sm">{row.displayName}</h3>
                        <Pill className="bg-warning/15 text-warning">Channel</Pill>
                        {row.version ? <span className="text-[11px] text-muted-foreground">v{row.version}</span> : null}
                      </div>
                      <p className="mb-2 line-clamp-3 text-muted-foreground text-xs leading-relaxed">
                        {row.description || "—"}
                      </p>
                      {row.keywords.length ? (
                        <p className="mb-3 font-mono text-[10px] text-muted-foreground/80">{row.keywords.join(", ")}</p>
                      ) : null}

                      {row.isInstalled ? (
                        <>
                          <InstallationStepper
                            active={activeStep}
                            configured={configuredStep}
                            installed={installedStep}
                          />
                          <div className="flex flex-wrap gap-2">
                            {row.needsSetup ? (
                              <button
                                className="rounded-lg border border-success/60 px-3 py-1.5 text-success text-xs hover:bg-success/10 disabled:opacity-50"
                                disabled={pending}
                                onClick={() => setSetupFor(row.name)}
                                type="button"
                              >
                                <span className="inline-flex items-center gap-1">
                                  <Wrench size={12} />
                                  Setup
                                </span>
                              </button>
                            ) : !row.active ? (
                              <button
                                className="rounded-lg border border-success/60 px-3 py-1.5 text-success text-xs hover:bg-success/10 disabled:opacity-50"
                                disabled={pending}
                                onClick={() => void handleToggleActive(row.name, false)}
                                type="button"
                              >
                                Activate
                              </button>
                            ) : (
                              <button
                                className="rounded-lg border border-border px-3 py-1.5 text-muted-foreground text-xs hover:border-primary hover:text-primary disabled:opacity-50"
                                disabled={pending}
                                onClick={() => void handleToggleActive(row.name, true)}
                                type="button"
                              >
                                Deactivate
                              </button>
                            )}
                            <button
                              className="rounded-lg border border-destructive/50 px-3 py-1.5 text-destructive text-xs hover:bg-destructive-muted disabled:opacity-50"
                              disabled={pending}
                              onClick={() => void handleRemove(row.name)}
                              type="button"
                            >
                              Remove
                            </button>
                            {pending ? <Loader className="animate-spin text-muted-foreground" size={16} /> : null}
                          </div>
                        </>
                      ) : (
                        <button
                          className="rounded-lg border border-success/60 px-3 py-1.5 text-success text-xs hover:bg-success/10 disabled:opacity-50"
                          disabled={pending || installMutation.isPending}
                          onClick={() => void handleInstall(row.name)}
                          type="button"
                        >
                          {pending ? (
                            <span className="inline-flex items-center gap-2">
                              <Loader className="animate-spin" size={14} />
                              Install…
                            </span>
                          ) : (
                            "Install"
                          )}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </>
      ) : null}

      <section className="border-border border-t pt-6">
        <h2 className="mb-2 font-medium text-foreground text-sm">Advanced: channel settings keys</h2>
        <p className="mb-4 text-muted-foreground text-xs">
          Raw <code className="font-mono">channels.*</code> and <code className="font-mono">signal.*</code> entries from
          the gateway settings store.
        </p>
        <SettingsKeysTab prefixes={["channels.", "signal."]} />
      </section>

      <ExtensionSetupDialog extensionName={setupFor} onClose={() => setSetupFor(null)} />
    </div>
  );
}
