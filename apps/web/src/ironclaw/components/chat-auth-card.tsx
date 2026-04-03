import { KeyRound } from "lucide-react";
import { useState } from "react";
import { cn } from "@/common/lib/utils";

type Props = {
  extensionName: string;
  instructions?: string;
  busy?: boolean;
  onSubmit: (token: string) => void;
  onCancel: () => void;
};

export function ChatAuthCard({ extensionName, instructions, busy, onSubmit, onCancel }: Props) {
  const [token, setToken] = useState("");

  return (
    <div className={cn("rounded-xl border border-primary/25 bg-primary-container/90 p-4")}>
      <div className="mb-2 flex items-center gap-2 font-medium text-foreground text-sm">
        <KeyRound className="shrink-0" size={16} />
        Extension auth: {extensionName}
      </div>
      {instructions ? <p className="mb-2 whitespace-pre-wrap text-muted-foreground text-xs">{instructions}</p> : null}
      <input
        className="mb-2 w-full rounded-lg border border-border bg-surface-low px-3 py-2 font-mono text-foreground text-xs"
        onChange={(e) => setToken(e.target.value)}
        placeholder="Paste token or credential…"
        type="password"
        value={token}
      />
      <div className="flex flex-wrap gap-2">
        <button
          className="rounded-lg bg-primary px-3 py-1.5 text-on-primary-fixed text-xs disabled:opacity-50"
          disabled={busy || !token.trim()}
          onClick={() => onSubmit(token.trim())}
          type="button"
        >
          Submit
        </button>
        <button
          className="rounded-lg border border-border px-3 py-1.5 text-foreground text-xs disabled:opacity-50"
          disabled={busy}
          onClick={onCancel}
          type="button"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
