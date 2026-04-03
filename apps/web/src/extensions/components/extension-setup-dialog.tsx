import { Loader, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { ExtensionBrandAvatar } from "@/common/components/extension-brand-avatar";
import { cn } from "@/common/lib/utils";
import { extensionKindBadgeClass } from "@/extensions/lib/extension-kind-styles";
import { useExtensionSetupSchema, useExtensionSetupSubmit, useExtensionsRegistry } from "@/extensions/queries";
import type { ExtensionKind } from "@/settings/api-types";
import { inferenceControlClass } from "@/settings/components/inference-settings-ui";

const FORM_ID = "extension-setup-form";

const KNOWN_EXTENSION_KINDS = new Set<string>(["wasm_tool", "wasm_channel", "mcp_server", "channel_relay"]);

type ExtensionSetupDialogProps = {
  extensionName: string | null;
  onClose: () => void;
};

function fieldHint(provided: boolean, optional: boolean): string {
  if (provided) return "Already set — leave blank to keep";
  if (optional) return "Optional";
  return "";
}

export function ExtensionSetupDialog({ extensionName, onClose }: ExtensionSetupDialogProps) {
  const { data: registry = [] } = useExtensionsRegistry();
  const { data: schema, isLoading, isError } = useExtensionSetupSchema(extensionName);
  const submit = useExtensionSetupSubmit();
  const [secrets, setSecrets] = useState<Record<string, string>>({});
  const [fields, setFields] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<string | null>(null);

  const registryEntry = useMemo(
    () => (extensionName ? registry.find((e) => e.name === extensionName) : undefined),
    [registry, extensionName]
  );

  const displayTitle = registryEntry?.display_name ?? schema?.name ?? extensionName ?? "";
  const kindStr = schema?.kind ?? registryEntry?.kind ?? "";

  // biome-ignore lint/correctness/useExhaustiveDependencies: reset form when switching extension
  useEffect(() => {
    setSecrets({});
    setFields({});
    setMessage(null);
  }, [extensionName]);

  useEffect(() => {
    if (!extensionName) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [extensionName, onClose]);

  const handleFormSubmit = useCallback(
    (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      if (!extensionName) return;
      setMessage(null);
      submit.mutate(
        { name: extensionName, secrets, fields },
        {
          onSuccess: (res) => {
            if (res.success) {
              if (res.auth_url && typeof res.auth_url === "string") {
                try {
                  const u = new URL(res.auth_url);
                  if (u.protocol === "https:") window.open(u.href, "_blank", "width=600,height=700");
                } catch {
                  setMessage("Invalid auth URL");
                }
              } else {
                onClose();
              }
            } else {
              setMessage(res.message ?? "Setup failed");
            }
          },
          onError: () => setMessage("Request failed"),
        }
      );
    },
    [extensionName, secrets, fields, submit, onClose]
  );

  if (!extensionName) return null;

  const secretList = schema?.secrets ?? [];
  const fieldList = schema?.fields ?? [];
  const hasFormFields = secretList.length > 0 || fieldList.length > 0;

  return (
    <div
      aria-labelledby="extension-setup-title"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-[2px]"
      role="dialog"
    >
      <div className="flex max-h-[min(90vh,720px)] w-full max-w-xl flex-col overflow-hidden rounded-2xl border border-border bg-surface-low shadow-xl">
        <div className="relative shrink-0 border-border border-b bg-surface-high/70 px-5 py-4">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(520px_circle_at_0%_0%,var(--primary)_0%,transparent_55%)] opacity-[0.1]"
          />
          <div className="relative flex gap-3">
            <ExtensionBrandAvatar
              className="size-12 min-h-12 min-w-12 ring-border/80"
              description={registryEntry?.description}
              displayName={registryEntry?.display_name}
              iconSize={24}
              keywords={registryEntry?.keywords}
              name={extensionName}
            />
            <div className="min-w-0 flex-1 pr-8">
              <p className="font-medium text-[11px] text-muted-foreground uppercase tracking-wider">
                Configure extension
              </p>
              <h2
                className="mt-0.5 font-semibold text-base text-foreground leading-snug tracking-tight"
                id="extension-setup-title"
              >
                {displayTitle}
              </h2>
              <p className="mt-0.5 truncate font-mono text-[11px] text-muted-foreground">{extensionName}</p>
              {kindStr ? (
                <span
                  className={cn(
                    "mt-2 inline-block rounded-full px-2 py-0.5 font-semibold text-[9px] uppercase tracking-wide",
                    KNOWN_EXTENSION_KINDS.has(kindStr)
                      ? extensionKindBadgeClass(kindStr as ExtensionKind)
                      : "bg-surface-highest text-muted-foreground"
                  )}
                >
                  {kindStr.replace(/_/g, " ")}
                </span>
              ) : null}
              {registryEntry?.description ? (
                <p className="mt-2 line-clamp-2 text-muted-foreground text-xs leading-relaxed">
                  {registryEntry.description}
                </p>
              ) : null}
            </div>
            <button
              aria-label="Close"
              className="absolute top-0 right-0 rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-surface-highest hover:text-foreground"
              onClick={onClose}
              type="button"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center gap-3 py-12 text-muted-foreground text-sm">
              <Loader aria-hidden className="size-8 animate-spin text-primary/80" />
              <p>Loading configuration…</p>
            </div>
          ) : isError ? (
            <div className="rounded-xl border border-destructive/25 bg-destructive-muted/40 px-4 py-3 text-destructive text-sm">
              Could not load setup schema for this extension. Check the gateway and try again.
            </div>
          ) : schema ? (
            hasFormFields ? (
              <form className="flex flex-col gap-6" id={FORM_ID} onSubmit={handleFormSubmit}>
                {secretList.length > 0 ? (
                  <section className="space-y-3">
                    <div>
                      <h3 className="font-semibold text-foreground text-xs">Secrets &amp; credentials</h3>
                      <p className="mt-0.5 text-[11px] text-muted-foreground leading-relaxed">
                        Stored securely on the gateway. Values are masked when you type.
                      </p>
                    </div>
                    <div className="space-y-3">
                      {secretList.map((s) => (
                        <label className="block space-y-1.5" key={s.name}>
                          <span className="font-medium text-foreground text-xs">{s.prompt}</span>
                          {fieldHint(s.provided, s.optional) ? (
                            <span className="block text-[11px] text-muted-foreground">
                              {fieldHint(s.provided, s.optional)}
                            </span>
                          ) : null}
                          <input
                            autoComplete="off"
                            className={cn(inferenceControlClass, "font-mono text-sm")}
                            name={s.name}
                            onChange={(e) => setSecrets((prev) => ({ ...prev, [s.name]: e.target.value }))}
                            placeholder={s.provided ? "••••••••" : s.optional ? "Optional" : "Required"}
                            type="password"
                            value={secrets[s.name] ?? ""}
                          />
                        </label>
                      ))}
                    </div>
                  </section>
                ) : null}

                {fieldList.length > 0 ? (
                  <section className="space-y-3">
                    <div>
                      <h3 className="font-semibold text-foreground text-xs">Settings</h3>
                      <p className="mt-0.5 text-[11px] text-muted-foreground leading-relaxed">
                        Extension-specific options from the gateway schema.
                      </p>
                    </div>
                    <div className="space-y-3">
                      {fieldList.map((f) => (
                        <label className="block space-y-1.5" key={f.name}>
                          <span className="font-medium text-foreground text-xs">{f.prompt}</span>
                          {fieldHint(f.provided, f.optional) ? (
                            <span className="block text-[11px] text-muted-foreground">
                              {fieldHint(f.provided, f.optional)}
                            </span>
                          ) : null}
                          <input
                            autoComplete="off"
                            className={cn(inferenceControlClass, "font-mono text-sm")}
                            name={f.name}
                            onChange={(e) => setFields((prev) => ({ ...prev, [f.name]: e.target.value }))}
                            placeholder={f.provided ? "Leave blank to keep" : f.optional ? "Optional" : "Required"}
                            type={f.input_type === "password" ? "password" : "text"}
                            value={fields[f.name] ?? ""}
                          />
                        </label>
                      ))}
                    </div>
                  </section>
                ) : null}

                {message ? (
                  <p
                    className="rounded-lg border border-destructive/30 bg-destructive-muted/30 px-3 py-2 text-destructive text-xs"
                    role="alert"
                  >
                    {message}
                  </p>
                ) : null}
              </form>
            ) : (
              <div className="rounded-xl border border-border bg-surface-high/50 px-4 py-6 text-center text-muted-foreground text-sm">
                <p>This extension does not expose any setup fields.</p>
                <button
                  className="mt-4 rounded-lg bg-primary px-4 py-2 font-medium text-on-primary-fixed text-xs hover:bg-primary/90"
                  onClick={onClose}
                  type="button"
                >
                  Close
                </button>
              </div>
            )
          ) : null}
        </div>

        {schema && hasFormFields ? (
          <div className="shrink-0 border-border border-t bg-surface-high/40 px-5 py-3">
            <div className="flex flex-wrap items-center justify-end gap-2">
              <button
                className="rounded-lg border border-border bg-surface-low px-4 py-2 font-medium text-foreground text-sm transition-colors hover:bg-surface-highest"
                onClick={onClose}
                type="button"
              >
                Cancel
              </button>
              <button
                className="inline-flex min-w-[7rem] items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 font-medium text-on-primary-fixed text-sm transition-colors hover:bg-primary/90 disabled:opacity-50"
                disabled={submit.isPending}
                form={FORM_ID}
                type="submit"
              >
                {submit.isPending ? <Loader aria-hidden className="size-4 animate-spin" /> : null}
                Save
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
