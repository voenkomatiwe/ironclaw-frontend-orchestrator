import { ChevronDown, ChevronRight, ShieldAlert } from "lucide-react";
import { useState } from "react";
import { Button } from "@/common/components/ui";
import type { IronclawPendingApproval } from "../api-types";

type ChatApprovalBarProps = {
  pending: IronclawPendingApproval;
  busy?: boolean;
  onApprove: () => void;
  onDeny: () => void;
  onAlways?: () => void;
};

export function ChatApprovalBar({ pending, busy, onApprove, onDeny, onAlways }: ChatApprovalBarProps) {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <div className="mx-4 mb-2 rounded-xl border border-warning/30 bg-warning-muted p-3 md:mx-6">
      <div className="flex items-center gap-3">
        <ShieldAlert className="shrink-0 text-warning" size={18} />

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-foreground text-sm">{pending.tool_name}</span>
            {pending.parameters && pending.parameters !== "{}" && (
              <button
                className="flex items-center gap-0.5 text-muted-foreground text-xs hover:text-foreground"
                onClick={() => setShowDetails((p) => !p)}
                type="button"
              >
                {showDetails ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                Details
              </button>
            )}
          </div>
          {pending.description && <p className="truncate text-muted-foreground text-xs">{pending.description}</p>}
        </div>

        <div className="flex shrink-0 gap-2">
          <Button disabled={busy} onClick={onApprove} size="sm" type="button" variant="success">
            Approve
          </Button>
          <Button disabled={busy} onClick={onDeny} size="sm" type="button" variant="outline">
            Deny
          </Button>
          {onAlways && (
            <Button
              className="hidden sm:block"
              disabled={busy}
              onClick={onAlways}
              size="sm"
              type="button"
              variant="outline"
            >
              Always
            </Button>
          )}
        </div>
      </div>

      {showDetails && pending.parameters && (
        <pre className="mt-2 max-h-32 overflow-auto rounded-lg bg-surface-highest p-2.5 font-mono text-[11px] text-muted-foreground leading-relaxed">
          {pending.parameters}
        </pre>
      )}
    </div>
  );
}
