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
    <div className={cn("rounded-xl border border-warning/30 bg-warning-muted/90 p-4")}>
      <div className="mb-2 flex items-center gap-2 font-medium text-foreground text-sm">
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
            className="rounded-lg border border-warning/40 px-3 py-1.5 text-foreground text-xs disabled:opacity-50"
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
