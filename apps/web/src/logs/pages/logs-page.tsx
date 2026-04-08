import { Pause, Play, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/common/lib/utils";
import type { LogLevel } from "../api-types";
import { useLogStream, useLogsLevel, useSetLogsLevel } from "../queries";

/* ── helpers ─────────────────────────────────────────────── */

const LEVELS: LogLevel[] = ["TRACE", "DEBUG", "INFO", "WARN", "ERROR"];

type FilterLevel = "ALL" | "INFO" | "WARN" | "ERROR";

const FILTER_PILLS: { value: FilterLevel; label: string }[] = [
  { value: "ALL", label: "All" },
  { value: "INFO", label: "Info" },
  { value: "WARN", label: "Warn" },
  { value: "ERROR", label: "Error" },
];

const levelOrder: Record<LogLevel, number> = {
  TRACE: 0,
  DEBUG: 1,
  INFO: 2,
  WARN: 3,
  ERROR: 4,
};

const filterMinLevel: Record<FilterLevel, number> = {
  ALL: 0,
  INFO: 2,
  WARN: 3,
  ERROR: 4,
};

const levelBadgeStyle: Record<LogLevel, string> = {
  TRACE: "bg-muted text-muted-foreground",
  DEBUG: "bg-muted text-muted-foreground",
  INFO: "bg-success/10 text-success",
  WARN: "bg-warning/10 text-warning",
  ERROR: "bg-destructive/10 text-destructive",
};

const rowBg: Partial<Record<LogLevel, string>> = {
  WARN: "bg-warning/5",
  ERROR: "bg-destructive/5",
};

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

function isLowLevel(level: LogLevel): boolean {
  return level === "TRACE" || level === "DEBUG";
}

/* ── LogsView ────────────────────────────────────────────── */

export function LogsView() {
  const { data: levelData } = useLogsLevel();
  const setLevel = useSetLogsLevel();

  const [streaming, setStreaming] = useState(true);
  const [filterLevel, setFilterLevel] = useState<FilterLevel>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const { entries, connected, clear } = useLogStream(streaming);

  const query = searchQuery.trim().toLowerCase();
  const minLevel = filterMinLevel[filterLevel];

  const filtered = entries.filter((e) => {
    if (levelOrder[e.level] < minLevel) return false;
    if (query) {
      const t = (e.target ?? "").toLowerCase();
      const m = (e.message ?? "").toLowerCase();
      if (!t.includes(query) && !m.includes(query)) return false;
    }
    return true;
  });

  const filteredLength = filtered.length;

  useEffect(() => {
    if (filteredLength > 0 && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [filteredLength]);

  return (
    <div className="flex h-full flex-col p-6">
      {/* Toolbar */}
      <div className="mb-4 rounded-2xl bg-white p-4 shadow-xs">
        {/* Row 1: Status + Actions */}
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className={cn("h-2 w-2 rounded-full", connected ? "bg-success" : "bg-muted-foreground/40")} />
            <span className="text-[12px] text-muted-foreground">
              {connected ? "Live" : "Disconnected"} — {filtered.length} entries
            </span>
          </div>
          <div className="flex gap-1.5">
            <button
              className="flex items-center gap-1.5 rounded-xl bg-surface-high px-3 py-1.5 text-[12px] text-muted-foreground transition-colors hover:text-foreground"
              onClick={() => setStreaming((v) => !v)}
              type="button"
            >
              {streaming ? <Pause size={12} /> : <Play size={12} />}
              {streaming ? "Pause" : "Resume"}
            </button>
            <button
              className="flex items-center gap-1.5 rounded-xl bg-surface-high px-3 py-1.5 text-[12px] text-muted-foreground transition-colors hover:text-destructive"
              onClick={clear}
              type="button"
            >
              <Trash2 size={12} />
              Clear
            </button>
          </div>
        </div>

        {/* Row 2: Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Level pills */}
          <div className="flex gap-1">
            {FILTER_PILLS.map((pill) => (
              <button
                className={cn(
                  "rounded-lg px-2.5 py-1 font-medium text-[11px] transition-colors",
                  filterLevel === pill.value
                    ? "bg-primary text-white"
                    : "bg-surface-high text-muted-foreground hover:text-foreground"
                )}
                key={pill.value}
                onClick={() => setFilterLevel(pill.value)}
                type="button"
              >
                {pill.label}
              </button>
            ))}
          </div>

          {/* Search */}
          <input
            className="min-w-[140px] flex-1 rounded-xl border border-border bg-surface-high px-3 py-1.5 text-[12px] text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none sm:max-w-xs"
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search logs…"
            type="search"
            value={searchQuery}
          />

          {/* Server level */}
          <div className="ml-auto flex items-center gap-1.5">
            <span className="text-[11px] text-muted-foreground">Server:</span>
            <select
              className="rounded-lg border border-border bg-surface-high px-2 py-1 text-[11px] text-foreground focus:border-primary focus:outline-none"
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
        </div>
      </div>

      {/* Log entries */}
      <div className="min-h-0 flex-1 overflow-y-auto rounded-2xl bg-white shadow-xs" ref={scrollRef}>
        {filtered.length === 0 ? (
          <div className="flex h-full min-h-[30vh] items-center justify-center">
            <p className="text-[13px] text-muted-foreground">
              {streaming ? "Waiting for log entries…" : "Stream paused."}
            </p>
          </div>
        ) : (
          <div className="p-2">
            {filtered.map((entry, i) => (
              <div
                className={cn(
                  "flex items-start gap-2.5 rounded-xl px-3 py-2",
                  rowBg[entry.level],
                  isLowLevel(entry.level) && "opacity-50"
                )}
                // biome-ignore lint/suspicious/noArrayIndexKey: log entries are append-only
                key={i}
              >
                <span className="mt-0.5 shrink-0 text-[11px] text-muted-foreground" style={{ minWidth: "60px" }}>
                  {formatTs(entry.timestamp)}
                </span>
                <span
                  className={cn(
                    "mt-0.5 shrink-0 rounded px-1.5 py-0.5 font-semibold text-[10px]",
                    levelBadgeStyle[entry.level]
                  )}
                >
                  {entry.level}
                </span>
                <div className="min-w-0 flex-1">
                  <span className="text-[12px] text-foreground">{entry.message}</span>
                  {entry.target && <span className="ml-2 text-[10px] text-muted-foreground/60">{entry.target}</span>}
                </div>
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
