import { cn } from "@/common/lib/utils";
import type { AddonStatus } from "../api-types";

const styles: Record<AddonStatus, string> = {
  running: "border-green-200 bg-green-100 text-green-700",
  starting: "border-amber-200 bg-amber-100 text-amber-700",
  stopping: "border-amber-200 bg-amber-100 text-amber-700",
  stopped: "border-gray-200 bg-gray-100 text-gray-500",
  installed: "border-blue-200 bg-blue-100 text-blue-700",
  installing: "border-violet-200 bg-violet-100 text-violet-700",
  error: "border-red-200 bg-red-100 text-red-600",
  removing: "border-red-200 bg-red-100 text-red-600",
};

const dots: Record<AddonStatus, string> = {
  running: "bg-green-500",
  starting: "bg-amber-500",
  stopping: "bg-amber-500",
  stopped: "bg-gray-400",
  installed: "bg-blue-500",
  installing: "animate-pulse bg-violet-500",
  error: "bg-red-500",
  removing: "bg-red-500",
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
