import { Loader, Settings2, Zap } from "lucide-react";
import { Link } from "react-router";
import { ExtensionBrandAvatar } from "@/common/components/extension-brand-avatar";
import { Badge, Button } from "@/common/components/ui";
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
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(380px_circle_at_0%_0%,var(--primary)_0%,transparent_62%)] opacity-[0.04] group-hover:opacity-[0.07]"
      />
      <div className="relative flex flex-1 flex-col gap-2 p-3">
        <div className="flex items-start gap-3">
          <ExtensionBrandAvatar
            className="size-9 rounded-lg"
            description={ext.description}
            displayName={ext.display_name}
            name={ext.name}
          />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <h3 className="truncate font-semibold text-foreground text-sm">{ext.display_name}</h3>
              <Badge
                className={cn(
                  "shrink-0 px-1.5 font-semibold text-[9px] uppercase tracking-wide",
                  extensionKindBadgeClass(ext.kind)
                )}
              >
                {label}
              </Badge>
              <span
                className={cn(
                  "ml-auto inline-flex shrink-0 items-center gap-1 rounded-full px-1.5 py-0.5 font-medium text-[10px]",
                  ext.active ? "bg-success-muted text-success" : "bg-muted/80 text-muted-foreground"
                )}
              >
                <span
                  aria-hidden
                  className={cn("size-1.5 shrink-0 rounded-full", ext.active ? "bg-success" : "bg-muted-foreground/50")}
                />
                {ext.active ? "Live" : "Inactive"}
              </span>
            </div>
            <div className="mt-0.5 flex items-center gap-1.5 text-[10px] text-muted-foreground">
              <span className="truncate font-mono">{ext.name}</span>
              {ext.version ? (
                <span className="shrink-0 rounded bg-surface-highest px-1 py-0.5 font-medium">v{ext.version}</span>
              ) : null}
            </div>
            {ext.description ? (
              <p className="mt-0.5 truncate text-muted-foreground text-xs">{ext.description}</p>
            ) : null}
          </div>
        </div>

        <div className="mt-auto flex flex-wrap items-center gap-1.5 border-border border-t pt-2">
          {busy ? <Loader className="size-3.5 shrink-0 animate-spin text-muted-foreground" /> : null}

          <Button
            as={Link}
            size="sm"
            to="/extensions"
            variant="outline"
          >
            <Settings2 size={12} />
            Marketplace
          </Button>

          {!ext.active && (ext.kind === "wasm_tool" || ext.kind === "wasm_channel") ? (
            <Button
              className="border-success/50 bg-success-muted/30 text-success hover:bg-success-muted/50"
              disabled={busy}
              onClick={() => run(() => activate.mutateAsync(ext.name))}
              size="sm"
              type="button"
              variant="outline"
            >
              <Zap size={12} />
              Activate
            </Button>
          ) : null}

          <Button
            className="ml-auto"
            disabled={busy}
            onClick={() => run(() => remove.mutateAsync(ext.name))}
            size="sm"
            type="button"
            variant="destructive"
          >
            Remove
          </Button>
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
