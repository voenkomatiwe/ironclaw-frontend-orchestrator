import { ChevronDown, ChevronRight, Loader, Play, RefreshCw, Trash2, Zap } from "lucide-react";
import { useState } from "react";
import { Button } from "@/common/components/ui";
import { cn } from "@/common/lib/utils";
import type { RoutineEntry, RoutineStatus } from "../api-types";
import {
  useDeleteRoutine,
  useRoutineHistory,
  useRoutines,
  useRoutinesSummary,
  useToggleRoutine,
  useTriggerRoutine,
} from "../queries";

/* ── helpers ─────────────────────────────────────────────── */

function formatRelative(iso?: string): string {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    const diff = Date.now() - d.getTime();
    if (Math.abs(diff) < 60_000) return "just now";
    if (diff < 0) {
      const abs = Math.abs(diff);
      if (abs < 3_600_000) return `in ${Math.floor(abs / 60_000)}m`;
      if (abs < 86_400_000) return `in ${Math.floor(abs / 3_600_000)}h`;
    }
    if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
    if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
    return d.toLocaleDateString();
  } catch {
    return iso;
  }
}

const statusLabel: Record<RoutineStatus, string> = {
  enabled: "Healthy",
  disabled: "Paused",
  failing: "Failing",
};

const statusStyle: Record<RoutineStatus, string> = {
  enabled: "bg-success/10 text-success",
  disabled: "bg-muted text-muted-foreground",
  failing: "bg-destructive/10 text-destructive",
};

const borderColor: Record<RoutineStatus, string> = {
  enabled: "border-l-success",
  disabled: "border-l-border",
  failing: "border-l-destructive",
};

function formatSchedule(trigger: string): string {
  const map: Record<string, string> = {
    "* * * * *": "Every minute",
    "0 * * * *": "Every hour",
  };
  if (map[trigger]) return map[trigger];
  const daily = trigger.match(/^(\d+)\s+(\d+)\s+\*\s+\*\s+\*$/);
  if (daily) {
    const h = daily[2]!.padStart(2, "0");
    const m = daily[1]!.padStart(2, "0");
    return `Every day at ${h}:${m}`;
  }
  const weekly = trigger.match(/^(\d+)\s+(\d+)\s+\*\s+\*\s+(\d)$/);
  if (weekly) {
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    return `Every ${days[Number(weekly[3])] ?? "week"}`;
  }
  return trigger;
}

/* ── SummaryPills ────────────────────────────────────────── */

type SummaryPillsProps = {
  active: number;
  paused: number;
  runsToday: number;
};

function SummaryPills({ active, paused, runsToday }: SummaryPillsProps) {
  return (
    <div className="mb-5 flex flex-wrap gap-2">
      {active > 0 && (
        <div className="flex items-center gap-2 rounded-full bg-white px-4 py-1.5 text-sm shadow-xs">
          <span className="h-2 w-2 rounded-full bg-success" />
          {active} active
        </div>
      )}
      {paused > 0 && (
        <div className="flex items-center gap-2 rounded-full bg-white px-4 py-1.5 text-sm shadow-xs">
          <span className="h-2 w-2 rounded-full bg-muted-foreground" />
          {paused} paused
        </div>
      )}
      {runsToday > 0 && (
        <div className="flex items-center gap-2 rounded-full bg-white px-4 py-1.5 text-sm shadow-xs">
          <Zap className="text-primary" size={14} />
          {runsToday} runs today
        </div>
      )}
    </div>
  );
}

/* ── RunHistoryList ──────────────────────────────────────── */

type RunHistoryListProps = {
  routineId: string;
};

function RunHistoryList({ routineId }: RunHistoryListProps) {
  const { data: history = [], isLoading } = useRoutineHistory(routineId);

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 py-3 text-muted-foreground text-xs">
        <Loader className="animate-spin" size={12} />
        Loading history…
      </div>
    );
  }

  if (history.length === 0) {
    return <p className="py-3 text-muted-foreground text-xs">No runs recorded yet.</p>;
  }

  return (
    <div className="flex flex-col gap-1">
      {history.slice(0, 5).map((run) => {
        const duration =
          run.completedAt && run.startedAt
            ? `${((new Date(run.completedAt).getTime() - new Date(run.startedAt).getTime()) / 1000).toFixed(1)}s`
            : null;

        return (
          <div className="flex items-start gap-3 py-2" key={run.id}>
            <div
              className={cn(
                "mt-0.5 flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full text-xs",
                run.success ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"
              )}
            >
              {run.success ? "✓" : "✗"}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between">
                <span className="font-medium text-[13px] text-foreground">
                  {run.success ? "Completed" : "Failed"} {duration && `in ${duration}`}
                </span>
                <span className="text-muted-foreground text-xs">{formatRelative(run.startedAt)}</span>
              </div>
              {run.output && (
                <p
                  className={cn(
                    "mt-0.5 line-clamp-1 text-xs",
                    run.success ? "text-muted-foreground" : "text-destructive"
                  )}
                >
                  {run.output}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ── ExpandedActions ─────────────────────────────────────── */

type ExpandedActionsProps = {
  routine: RoutineEntry;
};

function ExpandedActions({ routine }: ExpandedActionsProps) {
  const triggerRoutine = useTriggerRoutine();
  const deleteRoutine = useDeleteRoutine();
  const [pending, setPending] = useState<"trigger" | "delete" | null>(null);

  async function handleTrigger() {
    setPending("trigger");
    try {
      await triggerRoutine.mutateAsync(routine.id);
    } finally {
      setPending(null);
    }
  }

  async function handleDelete() {
    if (!confirm(`Delete "${routine.name}"?`)) return;
    setPending("delete");
    try {
      await deleteRoutine.mutateAsync(routine.id);
    } finally {
      setPending(null);
    }
  }

  return (
    <div className="flex gap-2">
      <Button className="text-[13px]" disabled={pending !== null} onClick={handleTrigger} type="button">
        {pending === "trigger" ? <Loader className="animate-spin" size={14} /> : <Play size={14} />}
        Run now
      </Button>
      <Button
        className="text-[13px] hover:text-destructive"
        disabled={pending !== null}
        onClick={handleDelete}
        type="button"
        variant="ghost"
      >
        {pending === "delete" ? <Loader className="animate-spin" size={14} /> : <Trash2 size={14} />}
        Delete
      </Button>
    </div>
  );
}

/* ── RoutineCard ─────────────────────────────────────────── */

type RoutineCardProps = {
  routine: RoutineEntry;
  isExpanded: boolean;
  onToggleExpand: () => void;
};

function RoutineCard({ routine, isExpanded, onToggleExpand }: RoutineCardProps) {
  const toggleRoutine = useToggleRoutine();
  const [togglePending, setTogglePending] = useState(false);
  const isPaused = routine.status === "disabled";

  async function handleToggle(e: React.MouseEvent) {
    e.stopPropagation();
    setTogglePending(true);
    try {
      await toggleRoutine.mutateAsync({
        id: routine.id,
        enable: routine.status !== "enabled",
      });
    } finally {
      setTogglePending(false);
    }
  }

  const scheduleParts = [formatSchedule(routine.trigger)];
  if (routine.lastRun) scheduleParts.push(`Last run ${formatRelative(routine.lastRun)}`);
  if (routine.nextRun) scheduleParts.push(`Next ${formatRelative(routine.nextRun)}`);

  return (
    <div
      className={cn(
        "rounded-2xl border-l-4 bg-white shadow-xs transition-shadow hover:shadow-sm",
        borderColor[routine.status],
        isPaused && "opacity-60"
      )}
    >
      {/* Clickable header */}
      <button
        className="flex w-full items-start justify-between gap-3 p-4 text-left"
        onClick={onToggleExpand}
        type="button"
      >
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-[15px] text-foreground">{routine.name}</p>
          <p className="mt-1 text-[13px] text-muted-foreground">{isPaused ? "Paused" : scheduleParts.join(" · ")}</p>
        </div>
        <div className="flex shrink-0 items-center gap-2.5">
          <span className={cn("rounded-full px-2.5 py-0.5 font-medium text-xs", statusStyle[routine.status])}>
            {statusLabel[routine.status]}
          </span>
          {/* Toggle switch */}
          <button
            aria-label={isPaused ? "Enable routine" : "Disable routine"}
            className={cn(
              "relative h-[22px] w-10 rounded-full transition-colors",
              routine.status === "enabled" || routine.status === "failing" ? "bg-success" : "bg-gray-300"
            )}
            disabled={togglePending}
            onClick={handleToggle}
            type="button"
          >
            <span
              className={cn(
                "absolute top-0.5 h-[18px] w-[18px] rounded-full bg-white shadow-sm transition-[left,right]",
                routine.status === "enabled" || routine.status === "failing"
                  ? "right-0.5 left-auto"
                  : "right-auto left-0.5"
              )}
            />
          </button>
          {/* Chevron */}
          {isExpanded ? (
            <ChevronDown className="text-muted-foreground" size={18} />
          ) : (
            <ChevronRight className="text-muted-foreground" size={18} />
          )}
        </div>
      </button>

      {/* Last result preview (collapsed only) */}
      {!isExpanded && routine.lastRun && (
        <div className="mx-4 mb-4 rounded-xl bg-surface-high px-3 py-2.5 text-muted-foreground text-xs">
          ✓ Completed {formatRelative(routine.lastRun)}
          {routine.action && <span> — "{routine.action}"</span>}
        </div>
      )}

      {/* Expanded section */}
      {isExpanded && (
        <div className="border-border border-t px-4 pt-3 pb-4">
          <ExpandedActions routine={routine} />
          <div className="mt-4">
            <p className="mb-2 font-semibold text-[13px] text-foreground">Recent runs</p>
            <RunHistoryList routineId={routine.id} />
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Skeleton & Empty ────────────────────────────────────── */

function RoutineCardSkeleton() {
  return (
    <div className="animate-pulse rounded-2xl border-l-4 border-l-border bg-white p-4 shadow-xs">
      <div className="flex items-start justify-between">
        <div>
          <div className="h-4 w-36 rounded-md bg-surface-highest" />
          <div className="mt-2 h-3 w-56 rounded-md bg-surface-highest" />
        </div>
        <div className="flex items-center gap-2">
          <div className="h-5 w-16 rounded-full bg-surface-highest" />
          <div className="h-[22px] w-10 rounded-full bg-surface-highest" />
        </div>
      </div>
      <div className="mt-3 h-9 rounded-xl bg-surface-high" />
    </div>
  );
}

function SkeletonPills() {
  return (
    <div className="mb-5 flex gap-2">
      <div className="h-8 w-24 animate-pulse rounded-full bg-surface-highest" />
      <div className="h-8 w-20 animate-pulse rounded-full bg-surface-highest" />
      <div className="h-8 w-28 animate-pulse rounded-full bg-surface-highest" />
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <div className="max-w-[280px] text-center">
        <RefreshCw className="mx-auto mb-4 text-muted-foreground/30" size={48} />
        <p className="font-semibold text-[17px] text-foreground">No routines yet</p>
        <p className="mt-2 text-[13px] text-muted-foreground leading-relaxed">
          Routines are automated tasks that run on a schedule. They will appear here once configured.
        </p>
      </div>
    </div>
  );
}

/* ── RoutinesView ────────────────────────────────────────── */

export function RoutinesView() {
  const { data: summary } = useRoutinesSummary();
  const { data: routines = [], isLoading } = useRoutines();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const active = summary?.enabled ?? 0;
  const paused = summary?.disabled ?? 0;
  const runsToday = summary?.runsToday ?? 0;

  function toggleExpand(id: string) {
    setExpandedId((prev) => (prev === id ? null : id));
  }

  return (
    <div className="p-6">
      {isLoading ? (
        <>
          <SkeletonPills />
          <div className="flex flex-col gap-3">
            <RoutineCardSkeleton />
            <RoutineCardSkeleton />
          </div>
        </>
      ) : routines.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          <SummaryPills active={active} paused={paused} runsToday={runsToday} />
          <div className="flex flex-col gap-3">
            {routines.map((r) => (
              <RoutineCard
                isExpanded={expandedId === r.id}
                key={r.id}
                onToggleExpand={() => toggleExpand(r.id)}
                routine={r}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default function RoutinesPage() {
  return <RoutinesView />;
}
