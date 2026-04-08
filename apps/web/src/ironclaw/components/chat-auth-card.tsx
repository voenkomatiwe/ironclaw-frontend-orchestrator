import { KeyRound } from "lucide-react";
import { useState } from "react";

type ChatAuthCardProps = {
  extensionName: string;
  instructions?: string;
  busy?: boolean;
  onSubmit: (token: string) => void;
  onCancel: () => void;
};

export function ChatAuthCard({ extensionName, instructions, busy, onSubmit, onCancel }: ChatAuthCardProps) {
  const [token, setToken] = useState("");

  return (
    <div className="mx-4 mb-2 rounded-xl border border-primary/25 bg-primary-container/90 p-3 md:mx-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex items-center gap-2">
          <KeyRound className="shrink-0 text-primary" size={18} />
          <span className="font-semibold text-foreground text-sm">{extensionName}</span>
        </div>

        {instructions && <p className="text-muted-foreground text-xs sm:hidden">{instructions}</p>}

        <div className="flex flex-1 items-center gap-2">
          <input
            className="flex-1 rounded-lg border border-border bg-surface-low px-3 py-1.5 font-mono text-foreground text-xs focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            onChange={(e) => setToken(e.target.value)}
            placeholder="Paste token or credential…"
            type="password"
            value={token}
          />
          <button
            className="rounded-lg bg-primary px-3 py-1.5 font-medium text-on-primary-fixed text-xs transition-colors hover:bg-primary/90 disabled:opacity-50"
            disabled={busy || !token.trim()}
            onClick={() => onSubmit(token.trim())}
            type="button"
          >
            Submit
          </button>
          <button
            className="rounded-lg border border-border px-3 py-1.5 text-foreground text-xs transition-colors hover:bg-surface-high disabled:opacity-50"
            disabled={busy}
            onClick={onCancel}
            type="button"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
