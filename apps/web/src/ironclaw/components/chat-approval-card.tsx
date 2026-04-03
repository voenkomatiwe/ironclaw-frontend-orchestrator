import { ShieldAlert } from "lucide-react";
import { cn } from "@/common/lib/utils";
import type { IronclawPendingApproval } from "../api-types";

type Props = {
  pending: IronclawPendingApproval;
  busy?: boolean;
  onApprove: () => void;
  onDeny: () => void;
  onAlways?: () => void;
};

export function ChatApprovalCard({ pending, busy, onApprove, onDeny, onAlways }: Props) {
  return (
    <div
      className={cn(
        "rounded-xl border border-amber-200 bg-amber-50/90 p-4 dark:border-amber-900/50 dark:bg-amber-950/40"
      )}
    >
      <div className="mb-2 flex items-center gap-2 font-medium text-amber-900 text-sm dark:text-amber-100">
        <ShieldAlert className="shrink-0" size={16} />
        Tool approval required
      </div>
      <p className="mb-1 font-mono text-foreground text-xs">{pending.tool_name}</p>
      <p className="mb-2 text-muted-foreground text-xs">{pending.description}</p>
      {pending.parameters ? (
        <pre className="mb-3 max-h-32 overflow-auto rounded-lg bg-surface-highest p-2 font-mono text-[10px] leading-relaxed">
          {pending.parameters}
        </pre>
      ) : null}
      <div className="flex flex-wrap gap-2">
        <button
          className="rounded-lg bg-primary px-3 py-1.5 text-on-primary-fixed text-xs disabled:opacity-50"
          disabled={busy}
          onClick={onApprove}
          type="button"
        >
          Approve
        </button>
        <button
          className="rounded-lg border border-border px-3 py-1.5 text-foreground text-xs disabled:opacity-50"
          disabled={busy}
          onClick={onDeny}
          type="button"
        >
          Deny
        </button>
        {onAlways ? (
          <button
            className="rounded-lg border border-amber-300 px-3 py-1.5 text-amber-900 text-xs disabled:opacity-50 dark:text-amber-200"
            disabled={busy}
            onClick={onAlways}
            type="button"
          >
            Always allow
          </button>
        ) : null}
      </div>
    </div>
  );
}
