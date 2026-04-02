import { ExternalLink, Play, Settings, Square } from "lucide-react";
import { Link } from "react-router";
import { hasEmbeddedAddonUi } from "@/addons/addon-ui-registry";
import { hashColor, initials } from "@/common/lib/colors";
import { cn } from "@/common/lib/utils";
import type { AddonInstance } from "../api-types";
import { useStartAddon, useStopAddon } from "../queries";
import { StatusBadge } from "./status-badge";

type AddonCardProps = {
  addon: AddonInstance;
};

export function AddonCard({ addon }: AddonCardProps) {
  const start = useStartAddon();
  const stop = useStopAddon();
  const color = hashColor(addon.name);
  const isRunning = addon.status === "running";
  const isInstalling = addon.status === "installing";
  const isBusy = ["starting", "stopping", "removing", "installing"].includes(addon.status);
  const manifest = JSON.parse(addon.manifestJson) as { displayName?: string; description?: string };

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-border bg-surface-high p-5 transition-all hover:border-border/60 hover:shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3">
          <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl", color.bg)}>
            <span className={cn("font-bold text-sm", color.text)}>{initials(addon.name)}</span>
          </div>
          <div className="min-w-0">
            <h3 className="truncate font-semibold text-foreground">{manifest.displayName ?? addon.name}</h3>
            <p className="mt-0.5 text-muted-foreground text-xs">v{addon.manifestVersion}</p>
          </div>
        </div>
        <StatusBadge status={addon.status} />
      </div>

      {manifest.description && (
        <p className="line-clamp-2 text-muted-foreground text-xs leading-relaxed">{manifest.description}</p>
      )}

      <div className="mt-auto flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
        {isInstalling ? (
          <span className="animate-pulse text-primary text-xs">Installing…</span>
        ) : isRunning && hasEmbeddedAddonUi(addon.name) ? (
          <Link
            className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 font-medium text-on-primary-fixed text-xs transition-colors hover:bg-primary/90"
            to={`/addons/${addon.name}/start`}
          >
            <ExternalLink size={12} /> Open UI
          </Link>
        ) : isRunning && addon.hostPort ? (
          <a
            className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 font-medium text-on-primary-fixed text-xs transition-colors hover:bg-primary/90"
            href={`http://${window.location.hostname}:${addon.hostPort}/`}
            rel="noreferrer"
            target="_blank"
          >
            <ExternalLink size={12} /> Open UI
          </a>
        ) : (
          <button
            className={cn(
              "flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-medium text-xs transition-colors disabled:opacity-40",
              isRunning
                ? "bg-surface-highest text-foreground hover:bg-surface-highest/80"
                : "bg-primary text-on-primary-fixed hover:bg-primary/90"
            )}
            disabled={isBusy}
            onClick={() => (isRunning ? stop.mutate(addon.name) : start.mutate(addon.name))}
          >
            {isRunning ? (
              <>
                <Square size={12} /> Stop
              </>
            ) : (
              <>
                <Play size={12} /> Start
              </>
            )}
          </button>
        )}

        {!isInstalling && (
          <Link
            className="ml-auto rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-surface-highest hover:text-foreground"
            onClick={(e) => e.stopPropagation()}
            title="Settings"
            to={`/addons/${addon.name}/manage`}
          >
            <Settings size={14} />
          </Link>
        )}
      </div>
    </div>
  );
}
