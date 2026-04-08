import { KeyRound } from "lucide-react";
import { useState } from "react";
import { Button, Input } from "@/common/components/ui";

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
          <Input
            className="flex-1 font-mono text-xs"
            onChange={(e) => setToken(e.target.value)}
            placeholder="Paste token or credential…"
            type="password"
            value={token}
          />
          <Button disabled={busy || !token.trim()} onClick={() => onSubmit(token.trim())} size="sm" type="button">
            Submit
          </Button>
          <Button disabled={busy} onClick={onCancel} size="sm" type="button" variant="outline">
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}
