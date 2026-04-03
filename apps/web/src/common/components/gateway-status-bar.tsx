import { Activity, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { cn } from "@/common/lib/utils";
import { useGatewayStatus } from "@/settings/queries";

function formatUptime(secs: number) {
  if (secs < 60) return `${secs}s`;
  if (secs < 3600) return `${Math.floor(secs / 60)}m`;
  return `${Math.floor(secs / 3600)}h ${Math.floor((secs % 3600) / 60)}m`;
}

export function GatewayStatusBar() {
  const { data, isLoading, isError } = useGatewayStatus();
  const [open, setOpen] = useState(false);

  if (isLoading && !data) {
    return (
      <div className="border-border border-b bg-surface-high px-4 py-1.5 text-muted-foreground text-xs">
        Gateway status…
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="border-border border-b bg-surface-high px-4 py-1.5 text-muted-foreground text-xs">
        Gateway status unavailable
      </div>
    );
  }

  return (
    <div className="border-border border-b bg-surface-high">
      <button
        className="flex w-full items-center gap-2 px-4 py-1.5 text-left text-xs"
        onClick={() => setOpen((v) => !v)}
        type="button"
      >
        <Activity className="shrink-0 text-success" size={14} />
        <span className="font-mono text-foreground">v{data.version}</span>
        <span className="text-muted-foreground">·</span>
        <span className="text-muted-foreground">
          {data.total_connections} conn · up {formatUptime(data.uptime_secs)}
        </span>
        <span className="ml-auto text-muted-foreground">
          {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </span>
      </button>
      <div
        className={cn(
          "grid transition-[grid-template-rows] duration-200",
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        )}
      >
        <div className="overflow-hidden">
          <div className="border-border border-t px-4 py-2 font-mono text-[10px] text-muted-foreground leading-relaxed">
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
    </div>
  );
}
