import { cn } from "@/common/lib/utils";
import type { AddonStatus } from "../api-types";

const styles: Record<AddonStatus, string> = {
  running: "bg-success/10 text-success border-success/20",
  starting: "bg-warning/10 text-warning border-warning/20",
  stopping: "bg-warning/10 text-warning border-warning/20",
  stopped: "bg-muted-foreground/10 text-muted-foreground border-border",
  installed: "bg-primary/10 text-primary border-primary/20",
  installing: "bg-primary/10 text-primary border-primary/20",
  error: "bg-destructive-muted text-destructive border-destructive/20",
  removing: "bg-destructive-muted text-destructive border-destructive/20",
};

const dots: Record<AddonStatus, string> = {
  running: "bg-success",
  starting: "bg-warning",
  stopping: "bg-warning",
  stopped: "bg-muted-foreground/50",
  installed: "bg-primary",
  installing: "bg-primary animate-pulse",
  error: "bg-destructive",
  removing: "bg-destructive",
};

type StatusBadgeProps = {
  status: AddonStatus;
};

export function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 font-medium text-xs",
        styles[status]
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", dots[status])} />
      {status}
    </span>
  );
}
