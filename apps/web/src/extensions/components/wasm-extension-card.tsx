import { Loader, Settings2, Zap } from "lucide-react";
import { Link } from "react-router";
import { cn } from "@/common/lib/utils";
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
        "flex flex-col gap-3 rounded-xl border border-border bg-surface-high p-4 transition-shadow hover:shadow-sm",
        ext.active && "border-l-[3px] border-l-success pl-[13px]"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate font-semibold text-foreground text-sm">{ext.display_name}</h3>
            <span className="shrink-0 rounded-md bg-success/15 px-1.5 py-0.5 font-semibold text-[10px] text-success uppercase tracking-wide">
              {label}
            </span>
            {ext.version ? <span className="text-[11px] text-muted-foreground">v{ext.version}</span> : null}
          </div>
          <p className="mt-1 line-clamp-2 font-mono text-[11px] text-muted-foreground">{ext.name}</p>
          {ext.description ? (
            <p className="mt-2 line-clamp-2 text-muted-foreground text-xs leading-relaxed">{ext.description}</p>
          ) : null}
        </div>
        <span
          aria-hidden
          className={cn("mt-1 size-2 shrink-0 rounded-full", ext.active ? "bg-success" : "bg-muted-foreground/40")}
          title={ext.active ? "Active" : "Inactive"}
        />
      </div>

      <div className="mt-auto flex flex-wrap gap-2">
        {busy ? <Loader className="size-4 shrink-0 animate-spin text-muted-foreground" /> : null}

        <Link
          className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-primary px-3 py-2 font-medium text-on-primary-fixed text-xs transition-colors hover:bg-primary/90 sm:flex-none"
          to="/extensions"
        >
          <Settings2 size={14} />
          Marketplace
        </Link>

        {!ext.active && (ext.kind === "wasm_tool" || ext.kind === "wasm_channel") ? (
          <button
            className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-success/50 px-3 py-2 font-medium text-success text-xs transition-colors hover:bg-success/10 disabled:opacity-50 sm:flex-none"
            disabled={busy}
            onClick={() => run(() => activate.mutateAsync(ext.name))}
            type="button"
          >
            <Zap size={14} />
            Activate
          </button>
        ) : null}

        <button
          className="ml-auto rounded-lg border border-destructive/30 px-3 py-2 text-destructive text-xs transition-colors hover:bg-destructive-muted disabled:opacity-50"
          disabled={busy}
          onClick={() => run(() => remove.mutateAsync(ext.name))}
          type="button"
        >
          Remove
        </button>
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
