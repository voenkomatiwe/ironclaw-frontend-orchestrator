import { PauseCircle, PlayCircle, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/common/lib/utils";
import type { LogLevel } from "../api-types";
import { useLogStream, useLogsLevel, useSetLogsLevel } from "../queries";

const LEVELS: LogLevel[] = ["TRACE", "DEBUG", "INFO", "WARN", "ERROR"];
const ALL = "ALL" as const;
type FilterLevel = LogLevel | typeof ALL;

const levelBadgeClass: Record<LogLevel, string> = {
  TRACE: "border border-border bg-muted text-muted-foreground",
  DEBUG: "border border-primary/25 bg-primary-container text-primary",
  INFO: "border border-success/25 bg-success-muted text-success",
  WARN: "border border-warning/25 bg-warning-muted text-warning",
  ERROR: "border border-destructive/25 bg-destructive-muted text-destructive",
};

const levelOrder: Record<LogLevel, number> = {
  TRACE: 0,
  DEBUG: 1,
  INFO: 2,
  WARN: 3,
  ERROR: 4,
};

function LevelBadge({ level }: { level: LogLevel }) {
  return (
    <span className={cn("shrink-0 rounded-md px-1.5 py-0.5 font-mono text-xs", levelBadgeClass[level])}>{level}</span>
  );
}

function formatTs(ts: string) {
  try {
    return new Date(ts).toLocaleTimeString(undefined, {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  } catch {
    return ts;
  }
}

export function LogsView() {
  const { data: levelData } = useLogsLevel();
  const setLevel = useSetLogsLevel();

  const [streaming, setStreaming] = useState(true);
  const [filterLevel, setFilterLevel] = useState<FilterLevel>(ALL);
  const [targetFilter, setTargetFilter] = useState("");
  const [autoScroll, setAutoScroll] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  const { entries, connected, clear } = useLogStream(streaming);

  const targetQ = targetFilter.trim().toLowerCase();

  const filtered = entries.filter((e) => {
    if (filterLevel !== ALL && levelOrder[e.level] < levelOrder[filterLevel]) return false;
    if (targetQ) {
      const t = (e.target ?? "").toLowerCase();
      const m = (e.message ?? "").toLowerCase();
      if (!t.includes(targetQ) && !m.includes(targetQ)) return false;
    }
    return true;
  });

  const filteredLength = filtered.length;
  useEffect(() => {
    if (filteredLength > 0 && autoScroll && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [filteredLength, autoScroll]);

  return (
    <div className="flex h-full flex-col p-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="font-bold text-foreground text-xl">Logs</h1>
          <p className="mt-0.5 text-muted-foreground text-sm">Real-time server log stream</p>
        </div>
        <div className="flex items-center gap-1.5">
          <span className={cn("h-2 w-2 rounded-full", connected ? "bg-success" : "bg-muted-foreground/35")} />
          <span className="text-muted-foreground text-xs">{connected ? "Connected" : "Disconnected"}</span>
        </div>
      </div>

      <div className="mb-3 flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1.5">
          <label className="text-muted-foreground text-xs" htmlFor="server-level">
            Server level:
          </label>
          <select
            className="rounded-lg border border-border bg-surface-low px-2 py-1 text-foreground text-xs focus:border-primary focus:outline-none"
            id="server-level"
            onChange={(e) => setLevel.mutate(e.target.value as LogLevel)}
            value={levelData?.level ?? "INFO"}
          >
            {LEVELS.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-1.5">
          <label className="text-muted-foreground text-xs" htmlFor="filter-level">
            Filter:
          </label>
          <select
            className="rounded-lg border border-border bg-surface-low px-2 py-1 text-foreground text-xs focus:border-primary focus:outline-none"
            id="filter-level"
            onChange={(e) => setFilterLevel(e.target.value as FilterLevel)}
            value={filterLevel}
          >
            <option value={ALL}>ALL</option>
            {LEVELS.map((l) => (
              <option key={l} value={l}>
                {l}+
              </option>
            ))}
          </select>
        </div>

        <input
          className="min-w-[140px] flex-1 rounded-lg border border-border bg-surface-low px-2 py-1 font-mono text-foreground text-xs focus:border-primary focus:outline-none sm:max-w-xs"
          onChange={(e) => setTargetFilter(e.target.value)}
          placeholder="Filter by target or message…"
          type="search"
          value={targetFilter}
        />

        <label className="flex cursor-pointer items-center gap-1.5 text-muted-foreground text-xs">
          <input
            checked={autoScroll}
            className="accent-primary"
            onChange={(e) => setAutoScroll(e.target.checked)}
            type="checkbox"
          />
          Auto-scroll
        </label>

        <button
          className="flex items-center gap-1 rounded-lg border border-border px-2.5 py-1 text-muted-foreground text-xs transition-colors hover:border-primary hover:text-primary"
          onClick={() => setStreaming((v) => !v)}
          type="button"
        >
          {streaming ? <PauseCircle size={13} /> : <PlayCircle size={13} />}
          {streaming ? "Pause" : "Resume"}
        </button>

        <button
          className="flex items-center gap-1 rounded-lg border border-border px-2.5 py-1 text-muted-foreground text-xs transition-colors hover:border-destructive hover:text-destructive"
          onClick={clear}
          type="button"
        >
          <Trash2 size={13} />
          Clear
        </button>

        <span className="ml-auto text-muted-foreground text-xs">{filtered.length} entries</span>
      </div>

      <div className="flex-1 overflow-y-auto rounded-xl border border-border bg-surface-low" ref={scrollRef}>
        {filtered.length === 0 ? (
          <div className="flex h-full items-center justify-center text-muted-foreground text-sm">
            {streaming ? "Waiting for log entries..." : "Stream paused."}
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filtered.map((entry, i) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: log entries are append-only
              <div className="flex items-start gap-3 px-4 py-2 font-mono text-xs" key={i}>
                <span className="mt-0.5 shrink-0 text-muted-foreground">{formatTs(entry.timestamp)}</span>
                <LevelBadge level={entry.level} />
                <span className="w-32 shrink-0 truncate text-muted-foreground">{entry.target}</span>
                <span className="wrap-break-word min-w-0 text-foreground">{entry.message}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function LogsPage() {
  return <LogsView />;
}
