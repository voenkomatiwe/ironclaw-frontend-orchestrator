import { Check, ChevronDown, ChevronRight, Loader2, X } from "lucide-react";
import { useState } from "react";
import { cn } from "@/common/lib/utils";
import type { ToolExecution } from "../api-types";

type ChatToolCardProps = {
  tool: ToolExecution;
};

export function ChatToolCard({ tool }: ChatToolCardProps) {
  const [expanded, setExpanded] = useState(false);
  const isRunning = tool.status === "running";
  const isError = tool.status === "done" && tool.ok === false;

  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border",
        isRunning
          ? "border-primary/30 bg-primary-container/30"
          : isError
            ? "border-destructive/30 bg-destructive/5"
            : "border-border bg-surface-low"
      )}
    >
      <button
        className="flex w-full items-center gap-2 px-3 py-2.5 text-left"
        onClick={() => setExpanded((p) => !p)}
        type="button"
      >
        {isRunning ? (
          <Loader2 className="shrink-0 animate-spin text-primary" size={14} />
        ) : isError ? (
          <X className="shrink-0 text-destructive" size={14} />
        ) : (
          <Check className="shrink-0 text-success" size={14} />
        )}

        <span className="flex-1 truncate font-semibold text-foreground text-sm">{tool.name}</span>

        {isRunning && <span className="text-primary text-xs">running…</span>}

        {tool.preview &&
          !isRunning &&
          (expanded ? (
            <ChevronDown className="shrink-0 text-muted-foreground" size={14} />
          ) : (
            <ChevronRight className="shrink-0 text-muted-foreground" size={14} />
          ))}
      </button>

      {expanded && tool.preview && (
        <div className="border-border/50 border-t bg-surface-highest px-3 py-2.5">
          <pre className="overflow-x-auto whitespace-pre-wrap font-mono text-muted-foreground text-xs leading-relaxed">
            {tool.preview}
          </pre>
        </div>
      )}
    </div>
  );
}
