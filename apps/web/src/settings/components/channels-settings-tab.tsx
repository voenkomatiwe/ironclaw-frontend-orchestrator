import { Check, Circle, Globe, Loader, Radio, SquareTerminal, Terminal, Webhook, Wrench } from "lucide-react";
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

const MESSAGING_KINDS = new Set(["wasm_channel", "channel_relay"]);

function Pill({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span className={cn("rounded-full px-2 py-0.5 font-semibold text-[10px] uppercase tracking-wide", className)}>
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
    <div className="mb-2 rounded-lg bg-surface-highest/50 p-2">
      <div className="flex items-center gap-0">
        {steps.map((s, i) => (
          <div className="flex min-w-0 flex-1 items-center" key={s.key}>
            <div className="flex min-w-0 flex-col items-center gap-1">
              <div
                className={cn(
                  "flex size-6 items-center justify-center rounded-full border",
                  s.done
                    ? "border-success/45 bg-success-muted text-success"
                    : "border-border bg-surface-low text-muted-foreground"
                )}
              >
                {s.done ? <Check size={12} strokeWidth={2.5} /> : <Circle size={10} strokeWidth={1.5} />}
              </div>
              <span className="text-center text-[9px] text-muted-foreground leading-tight">{s.label}</span>
            </div>
            {i < steps.length - 1 ? (
              <div
                aria-hidden
                className={cn(
                  "mx-1 h-px min-w-[8px] flex-1 border-t",
                  steps[i]?.done && steps[i + 1]?.done ? "border-success/30" : "border-border border-dashed"
                )}
              />
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}

const BUILTIN_ICONS = {
  web_gateway: Globe,
  http_webhook: Webhook,
  cli: Terminal,
  repl: SquareTerminal,
} as const;

type BuiltInId = keyof typeof BUILTIN_ICONS;

type BuiltInChannel = {
  id: BuiltInId;
  title: string;
  description: string;
  detail: string;
  active: boolean;
};

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

  const builtIns = useMemo((): BuiltInChannel[] => {
    return [
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
    ];
  }, [gateway, enabledList, httpHint]);

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
    <div className="space-y-6">
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
              {builtIns.map((b) => {
                const Icon = BUILTIN_ICONS[b.id];
                return (
                  <div
                    className={cn(
                      "group relative overflow-hidden rounded-xl border border-border bg-surface-low transition-colors",
                      "hover:border-primary/20",
                      b.active && "border-success/35"
                    )}
                    key={b.id}
                  >
                    <div
                      aria-hidden
                      className="pointer-events-none absolute inset-0 bg-[radial-gradient(360px_circle_at_0%_0%,var(--primary)_0%,transparent_60%)] opacity-[0.06] group-hover:opacity-[0.09]"
                    />
                    <div className="relative flex flex-col gap-2 p-4">
                      <div className="flex gap-2.5">
                        <div
                          className={cn(
                            "flex size-10 shrink-0 items-center justify-center rounded-lg",
                            b.active ? "bg-primary-container text-primary" : "bg-surface-highest text-muted-foreground"
                          )}
                        >
                          <Icon aria-hidden className="size-5" strokeWidth={1.75} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <h3 className="font-semibold text-foreground text-sm">{b.title}</h3>
                            <Pill className="bg-surface-highest text-muted-foreground">Built-in</Pill>
                          </div>
                          <p
                            className={cn(
                              "mt-1 inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 font-medium text-[10px]",
                              b.active ? "bg-success-muted text-success" : "bg-muted/80 text-muted-foreground"
                            )}
                          >
                            <span
                              aria-hidden
                              className={cn(
                                "size-1.5 shrink-0 rounded-full",
                                b.active ? "bg-success" : "bg-muted-foreground/50"
                              )}
                            />
                            {b.active ? "Live" : "Inactive"}
                          </p>
                        </div>
                      </div>
                      <p className="text-muted-foreground text-xs leading-relaxed">{b.description}</p>
                      <div className="rounded-lg border border-border/60 bg-surface-high/80 px-2.5 py-2 font-mono text-[10px] text-muted-foreground leading-snug">
                        {b.detail}
                      </div>
                    </div>
                  </div>
                );
              })}
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
                  const kindLabel = row.kind === "channel_relay" ? "Relay" : "Channel";

                  return (
                    <div
                      className={cn(
                        "group relative flex flex-col overflow-hidden rounded-xl border border-border bg-surface-low transition-colors hover:border-primary/15",
                        row.active && "border-success/35"
                      )}
                      key={row.name}
                    >
                      <div
                        aria-hidden
                        className="pointer-events-none absolute inset-0 bg-[radial-gradient(380px_circle_at_100%_0%,var(--primary)_0%,transparent_65%)] opacity-[0.05] group-hover:opacity-[0.07]"
                      />
                      <div className="relative flex flex-1 flex-col gap-2 p-4">
                        <div className="flex gap-2.5">
                          <ExtensionBrandAvatar
                            description={row.description}
                            displayName={row.displayName}
                            keywords={row.keywords}
                            name={row.name}
                          />
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <h3 className="truncate font-semibold text-foreground text-sm">{row.displayName}</h3>
                              <Pill
                                className={cn(
                                  row.kind === "channel_relay"
                                    ? "bg-primary-container/90 text-primary"
                                    : "bg-warning-muted text-warning"
                                )}
                              >
                                {kindLabel}
                              </Pill>
                            </div>
                            <div className="mt-0.5 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[10px] text-muted-foreground">
                              <span className="truncate font-mono opacity-90">{row.name}</span>
                              {row.version ? (
                                <span className="shrink-0 rounded bg-surface-highest px-1 py-0.5 font-medium">
                                  v{row.version}
                                </span>
                              ) : null}
                            </div>
                          </div>
                        </div>
                        <p className="line-clamp-2 text-muted-foreground text-xs leading-relaxed">
                          {row.description || "—"}
                        </p>
                        {row.keywords.length ? (
                          <div className="flex flex-wrap gap-1">
                            {row.keywords.slice(0, 5).map((kw) => (
                              <span
                                className="rounded-full bg-surface-variant px-1.5 py-0.5 font-medium text-[9px] text-muted-foreground"
                                key={`${row.name}-${kw}`}
                              >
                                {kw}
                              </span>
                            ))}
                            {row.keywords.length > 5 ? (
                              <span className="rounded-full bg-surface-highest px-1.5 py-0.5 text-[9px] text-muted-foreground">
                                +{row.keywords.length - 5}
                              </span>
                            ) : null}
                          </div>
                        ) : null}

                        <div className="mt-auto pt-0.5">
                          {row.isInstalled ? (
                            <>
                              <InstallationStepper
                                active={activeStep}
                                configured={configuredStep}
                                installed={installedStep}
                              />
                              <div className="flex flex-wrap items-center gap-1.5">
                                {row.needsSetup ? (
                                  <button
                                    className="inline-flex items-center gap-1 rounded-md border border-success/50 bg-success-muted/30 px-2 py-1.5 font-medium text-success text-xs hover:bg-success-muted/50 disabled:opacity-50"
                                    disabled={pending}
                                    onClick={() => setSetupFor(row.name)}
                                    type="button"
                                  >
                                    <Wrench className="size-3" strokeWidth={2} />
                                    Setup
                                  </button>
                                ) : !row.active ? (
                                  <button
                                    className="rounded-md bg-primary px-2.5 py-1.5 font-medium text-on-primary-fixed text-xs hover:bg-primary/90 disabled:opacity-50"
                                    disabled={pending}
                                    onClick={() => void handleToggleActive(row.name, false)}
                                    type="button"
                                  >
                                    Activate
                                  </button>
                                ) : (
                                  <button
                                    className="rounded-md border border-border bg-surface-high px-2.5 py-1.5 font-medium text-muted-foreground text-xs hover:border-primary/35 hover:text-primary disabled:opacity-50"
                                    disabled={pending}
                                    onClick={() => void handleToggleActive(row.name, true)}
                                    type="button"
                                  >
                                    Deactivate
                                  </button>
                                )}
                                <button
                                  className="rounded-md border border-destructive/30 px-2.5 py-1.5 font-medium text-destructive text-xs hover:bg-destructive-muted disabled:opacity-50"
                                  disabled={pending}
                                  onClick={() => void handleRemove(row.name)}
                                  type="button"
                                >
                                  Remove
                                </button>
                                {pending ? (
                                  <Loader className="size-3.5 shrink-0 animate-spin text-muted-foreground" />
                                ) : null}
                              </div>
                            </>
                          ) : (
                            <button
                              className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-primary px-3 py-2 font-medium text-on-primary-fixed text-xs hover:bg-primary/90 disabled:opacity-50 sm:w-auto"
                              disabled={pending || installMutation.isPending}
                              onClick={() => void handleInstall(row.name)}
                              type="button"
                            >
                              {pending ? (
                                <>
                                  <Loader className="size-3.5 animate-spin" />
                                  Install…
                                </>
                              ) : (
                                <>
                                  <Radio className="size-3.5" strokeWidth={2} />
                                  Install
                                </>
                              )}
                            </button>
                          )}
                        </div>
                      </div>
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
