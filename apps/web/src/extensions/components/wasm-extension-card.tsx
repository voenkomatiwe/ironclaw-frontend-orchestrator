import { Loader, Settings2, Zap } from "lucide-react";
import { Link } from "react-router";
import { ExtensionBrandAvatar } from "@/common/components/extension-brand-avatar";
import { cn } from "@/common/lib/utils";
import { extensionKindBadgeClass } from "@/extensions/lib/extension-kind-styles";
import { useActivateExtension, useRemoveExtension } from "@/extensions/queries";
import type { ExtensionEntry, ExtensionKind } from "@/settings/api-types";

const kindLabel: Record<string, string> = {
  wasm_tool: "Tool",
  wasm_channel: "Channel",
  mcp_server: "MCP",
  channel_relay: "Relay",
};

type WasmExtensionCardProps = {
  ext: ExtensionEntry;
  pending: boolean;
  onPending: (name: string | null) => void;
};

export function WasmExtensionCard({ ext, pending, onPending }: WasmExtensionCardProps) {
  const activate = useActivateExtension();
  const remove = useRemoveExtension();
  const busy = pending || activate.isPending || remove.isPending;
  const label = (kindLabel[ext.kind] ?? ext.kind).toUpperCase();

  const run = async (fn: () => Promise<unknown>) => {
    onPending(ext.name);
    try {
      await fn();
    } finally {
      onPending(null);
    }
  };

  return (
    <div
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-xl border border-border bg-surface-low transition-colors hover:border-primary/15",
        ext.active && "border-success/35"
      )}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(380px_circle_at_0%_0%,var(--primary)_0%,transparent_62%)] opacity-[0.05] group-hover:opacity-[0.08]"
      />
      <div className="relative flex flex-1 flex-col gap-2 p-4">
        <div className="flex gap-2.5">
          <ExtensionBrandAvatar description={ext.description} displayName={ext.display_name} name={ext.name} />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <h3 className="truncate font-semibold text-foreground text-sm">{ext.display_name}</h3>
              <span
                className={cn(
                  "shrink-0 rounded-full px-1.5 py-0.5 font-semibold text-[9px] uppercase tracking-wide",
                  extensionKindBadgeClass(ext.kind)
                )}
              >
                {label}
              </span>
            </div>
            <div className="mt-0.5 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[10px] text-muted-foreground">
              <span className="truncate font-mono">{ext.name}</span>
              {ext.version ? (
                <span className="shrink-0 rounded bg-surface-highest px-1 py-0.5 font-medium text-[10px]">
                  v{ext.version}
                </span>
              ) : null}
            </div>
            <p
              className={cn(
                "mt-1 inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 font-medium text-[10px]",
                ext.active ? "bg-success-muted text-success" : "bg-muted/80 text-muted-foreground"
              )}
            >
              <span
                aria-hidden
                className={cn("size-1.5 shrink-0 rounded-full", ext.active ? "bg-success" : "bg-muted-foreground/50")}
              />
              {ext.active ? "Live" : "Inactive"}
            </p>
            {ext.description ? (
              <p className="mt-1 line-clamp-2 text-muted-foreground text-xs leading-relaxed">{ext.description}</p>
            ) : null}
          </div>
        </div>

        <div className="mt-auto flex flex-wrap items-center gap-1.5 pt-0.5">
          {busy ? <Loader className="size-3.5 shrink-0 animate-spin text-muted-foreground" /> : null}

          <Link
            className="inline-flex flex-1 items-center justify-center gap-1 rounded-md bg-primary px-2.5 py-1.5 font-medium text-on-primary-fixed text-xs hover:bg-primary/90 sm:flex-none"
            to="/extensions"
          >
            <Settings2 size={12} />
            Marketplace
          </Link>

          {!ext.active && (ext.kind === "wasm_tool" || ext.kind === "wasm_channel") ? (
            <button
              className="inline-flex flex-1 items-center justify-center gap-1 rounded-md border border-success/50 bg-success-muted/30 px-2.5 py-1.5 font-medium text-success text-xs hover:bg-success-muted/50 disabled:opacity-50 sm:flex-none"
              disabled={busy}
              onClick={() => run(() => activate.mutateAsync(ext.name))}
              type="button"
            >
              <Zap size={12} />
              Activate
            </button>
          ) : null}

          <button
            className="ml-auto rounded-md border border-destructive/30 px-2.5 py-1.5 font-medium text-destructive text-xs hover:bg-destructive-muted disabled:opacity-50"
            disabled={busy}
            onClick={() => run(() => remove.mutateAsync(ext.name))}
            type="button"
          >
            Remove
          </button>
        </div>
      </div>
    </div>
  );
}

function isWasmKind(k: ExtensionKind): boolean {
  return k === "wasm_tool" || k === "wasm_channel";
}

export function filterWasmExtensions(entries: ExtensionEntry[]): ExtensionEntry[] {
  return entries.filter((e) => isWasmKind(e.kind));
}
