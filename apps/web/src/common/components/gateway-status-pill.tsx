import { useEffect, useRef, useState } from "react";
import { cn } from "@/common/lib/utils";
import { useGatewayStatus } from "@/settings/queries";

function formatUptime(secs: number) {
  if (secs < 60) return `${secs}s`;
  if (secs < 3600) return `${Math.floor(secs / 60)}m`;
  return `${Math.floor(secs / 3600)}h ${Math.floor((secs % 3600) / 60)}m`;
}

export function GatewayStatusPill() {
  const { data, isLoading, isError } = useGatewayStatus();
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleMouseDown(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleMouseDown);
    return () => document.removeEventListener("mousedown", handleMouseDown);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  if (isLoading && !data) {
    return (
      <div className="flex items-center gap-1.5 rounded-full bg-surface-high px-2.5 py-1 text-muted-foreground text-xs">
        <span className="size-2 animate-pulse rounded-full bg-muted-foreground/40" />
        Gateway…
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="flex items-center gap-1.5 rounded-full bg-surface-high px-2.5 py-1 text-muted-foreground text-xs">
        <span className="size-2 rounded-full bg-destructive" />
        Unavailable
      </div>
    );
  }

  return (
    <div className="relative" ref={wrapperRef}>
      <button
        aria-expanded={open}
        className="flex items-center gap-1.5 rounded-full bg-surface-high px-2.5 py-1 text-xs transition-colors hover:bg-surface-highest"
        onClick={() => setOpen((v) => !v)}
        type="button"
      >
        <span className="size-2 rounded-full bg-success" />
        <span className="font-mono text-foreground">v{data.version}</span>
        <span className="text-muted-foreground">·</span>
        <span className="text-muted-foreground">up {formatUptime(data.uptime_secs)}</span>
      </button>
      {open && (
        <div
          className={cn(
            "absolute top-full right-0 z-50 mt-1 grid w-72 max-w-[calc(100vw-2rem)] overflow-hidden rounded-lg border border-border bg-surface-low shadow-lg",
            "grid-rows-[1fr] transition-[grid-template-rows] duration-200"
          )}
        >
          <div className="overflow-hidden">
            <div className="p-3 font-mono text-[11px] text-muted-foreground leading-relaxed">
              <p>
                SSE {data.sse_connections} · WS {data.ws_connections} · LLM {data.llm_backend} / {data.llm_model}
              </p>
              <p>
                Cost today {data.daily_cost} · Actions/h {data.actions_this_hour}
                {data.restart_enabled ? " · restart enabled" : ""}
              </p>
              {data.enabled_channels?.length ? (
                <p className="mt-1 truncate">Channels: {data.enabled_channels.join(", ")}</p>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
