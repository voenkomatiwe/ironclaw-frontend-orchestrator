import { Loader } from "lucide-react";
import { useState } from "react";
import { usePairingApprove, usePairingRequests } from "../queries";

export function PairingPanel() {
  const [channel, setChannel] = useState("");
  const trimmed = channel.trim();
  const { data, isLoading, isError } = usePairingRequests(trimmed || null);
  const approve = usePairingApprove();

  return (
    <div className="rounded-xl border border-border bg-surface-high p-4">
      <h3 className="mb-2 font-medium text-foreground text-sm">Channel pairing</h3>
      <p className="mb-3 text-muted-foreground text-xs">
        Enter WASM channel name (e.g. from your extension) to list pending pairing codes and approve them.
      </p>
      <div className="mb-3 flex gap-2">
        <input
          className="flex-1 rounded-lg border border-border bg-surface-low px-3 py-2 font-mono text-foreground text-xs"
          onChange={(e) => setChannel(e.target.value)}
          placeholder="channel name"
          value={channel}
        />
      </div>
      {!trimmed ? (
        <p className="text-muted-foreground text-xs">Type a channel name to poll requests.</p>
      ) : isLoading ? (
        <div className="flex items-center gap-2 text-muted-foreground text-xs">
          <Loader className="animate-spin" size={14} />
          Loading…
        </div>
      ) : isError ? (
        <p className="text-muted-foreground text-xs">No data (channel may be invalid).</p>
      ) : !data?.requests?.length ? (
        <p className="text-muted-foreground text-xs">No pending requests.</p>
      ) : (
        <ul className="space-y-2">
          {data.requests.map((r) => (
            <li
              className="flex items-center justify-between gap-2 rounded-lg border border-border bg-surface-low px-3 py-2"
              key={r.code}
            >
              <div className="min-w-0">
                <p className="font-mono text-foreground text-xs">{r.code}</p>
                <p className="text-[10px] text-muted-foreground">from {r.sender_id}</p>
              </div>
              <button
                className="shrink-0 rounded-lg bg-primary px-2 py-1 text-on-primary-fixed text-xs disabled:opacity-50"
                disabled={approve.isPending}
                onClick={() => approve.mutate({ channel: trimmed, code: r.code })}
                type="button"
              >
                Approve
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
