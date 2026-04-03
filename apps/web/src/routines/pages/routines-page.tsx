import { ChevronDown, ChevronRight, Loader, Play, Trash2 } from "lucide-react";
import { useState } from "react";
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

const statusClass: Record<RoutineStatus, string> = {
  enabled: "bg-green-100 text-green-700",
  disabled: "bg-gray-100 text-gray-500",
  failing: "bg-red-100 text-red-600",
};

function StatusBadge({ status }: { status: RoutineStatus }) {
  return <span className={cn("rounded-full px-2 py-0.5 font-medium text-xs", statusClass[status])}>{status}</span>;
}

function StatCard({ label, value, color }: { label: string; value: number | undefined; color: string }) {
  return (
    <div className="rounded-xl border border-border bg-surface-high p-4">
      <p className="mb-1 text-muted-foreground text-xs">{label}</p>
      <p className={cn("font-bold text-2xl", color)}>{value ?? "—"}</p>
    </div>
  );
}

function formatRelative(iso?: string): string {
  if (!iso) return "—";
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

function HistoryPanel({ routineId }: { routineId: string }) {
  const { data: history = [], isLoading } = useRoutineHistory(routineId);

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 px-4 py-3 text-muted-foreground text-xs">
        <Loader className="animate-spin" size={12} />
        Loading history...
      </div>
    );
  }

  if (history.length === 0) {
    return <p className="px-4 py-3 text-muted-foreground text-xs">No runs recorded.</p>;
  }

  return (
    <div className="divide-y divide-border">
      {history.map((run) => {
        const duration =
          run.completedAt && run.startedAt
            ? `${((new Date(run.completedAt).getTime() - new Date(run.startedAt).getTime()) / 1000).toFixed(1)}s`
            : null;
        return (
          <div className="flex items-start gap-3 px-4 py-2.5" key={run.id}>
            <span
              className={cn(
                "mt-0.5 shrink-0 rounded-full px-2 py-0.5 font-medium text-xs",
                run.success ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"
              )}
            >
              {run.success ? "ok" : "fail"}
            </span>
            <div className="min-w-0">
              <p className="text-foreground text-xs">
                {formatRelative(run.startedAt)}
                {duration && <span className="ml-2 text-muted-foreground">{duration}</span>}
              </p>
              {run.output && (
                <p className="mt-0.5 line-clamp-2 font-mono text-muted-foreground text-xs">{run.output}</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function RoutineRow({
  routine,
  historyOpen,
  onHistoryToggle,
}: {
  routine: RoutineEntry;
  historyOpen: boolean;
  onHistoryToggle: () => void;
}) {
  const trigger = useTriggerRoutine();
  const toggle = useToggleRoutine();
  const deleteRoutine = useDeleteRoutine();
  const [pending, setPending] = useState<"trigger" | "toggle" | "delete" | null>(null);

  async function handleTrigger() {
    setPending("trigger");
    try {
      await trigger.mutateAsync(routine.id);
    } finally {
      setPending(null);
    }
  }

  async function handleToggle() {
    setPending("toggle");
    try {
      await toggle.mutateAsync({
        id: routine.id,
        enable: routine.status !== "enabled",
      });
    } finally {
      setPending(null);
    }
  }

  async function handleDelete() {
    if (!confirm(`Delete routine "${routine.name}"?`)) return;
    setPending("delete");
    try {
      await deleteRoutine.mutateAsync(routine.id);
    } finally {
      setPending(null);
    }
  }

  return (
    <>
      <tr className="border-border border-b hover:bg-surface-highest">
        <td className="px-4 py-3 font-medium text-foreground text-sm">{routine.name}</td>
        <td className="px-4 py-3 font-mono text-muted-foreground text-xs">{routine.trigger}</td>
        <td className="max-w-xs px-4 py-3 text-muted-foreground text-xs">
          <span className="line-clamp-1">{routine.action}</span>
        </td>
        <td className="px-4 py-3 text-muted-foreground text-xs">{formatRelative(routine.lastRun)}</td>
        <td className="px-4 py-3 text-muted-foreground text-xs">{formatRelative(routine.nextRun)}</td>
        <td className="px-4 py-3 text-center text-foreground text-sm">{routine.runs}</td>
        <td className="px-4 py-3">
          <StatusBadge status={routine.status} />
        </td>
        <td className="px-4 py-3">
          {pending !== null ? (
            <Loader className="animate-spin text-muted-foreground" size={14} />
          ) : (
            <div className="flex items-center gap-1.5">
              <button
                className="rounded-md p-1 text-muted-foreground transition-colors hover:text-primary"
                onClick={handleTrigger}
                title="Trigger now"
                type="button"
              >
                <Play size={13} />
              </button>
              <button
                className="rounded-lg border border-border px-2 py-0.5 text-muted-foreground text-xs transition-colors hover:border-primary hover:text-primary"
                onClick={handleToggle}
                type="button"
              >
                {routine.status === "enabled" ? "Disable" : "Enable"}
              </button>
              <button
                className="rounded-md p-1 text-muted-foreground transition-colors hover:text-destructive"
                onClick={handleDelete}
                title="Delete"
                type="button"
              >
                <Trash2 size={13} />
              </button>
              <button
                className="rounded-md p-1 text-muted-foreground transition-colors hover:text-foreground"
                onClick={onHistoryToggle}
                title="History"
                type="button"
              >
                {historyOpen ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
              </button>
            </div>
          )}
        </td>
      </tr>
      {historyOpen && (
        <tr>
          <td className="bg-surface-highest p-0" colSpan={8}>
            <HistoryPanel routineId={routine.id} />
          </td>
        </tr>
      )}
    </>
  );
}

export function RoutinesView() {
  const { data: summary } = useRoutinesSummary();
  const { data: routines = [], isLoading } = useRoutines();
  const [historyId, setHistoryId] = useState<string | null>(null);

  function toggleHistory(id: string) {
    setHistoryId((prev) => (prev === id ? null : id));
  }

  return (
    <div className="mx-auto max-w-6xl p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-bold text-foreground text-xl">Routines</h1>
          <p className="mt-0.5 text-muted-foreground text-sm">Manage automated scheduled tasks</p>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-5">
        <StatCard color="text-foreground" label="Total" value={summary?.total} />
        <StatCard color="text-success" label="Enabled" value={summary?.enabled} />
        <StatCard color="text-muted-foreground" label="Disabled" value={summary?.disabled} />
        <StatCard color="text-destructive" label="Failing" value={summary?.failing} />
        <StatCard color="text-primary" label="Runs today" value={summary?.runsToday} />
      </div>

      {isLoading ? (
        <div className="flex items-center gap-2 text-muted-foreground text-sm">
          <Loader className="animate-spin" size={16} />
          Loading routines...
        </div>
      ) : routines.length === 0 ? (
        <div className="rounded-xl border border-border bg-surface-high p-8 text-center">
          <p className="text-muted-foreground text-sm">No routines configured.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-border border-b bg-surface-high">
                <th className="px-4 py-3 text-left font-medium text-foreground text-xs">Name</th>
                <th className="px-4 py-3 text-left font-medium text-foreground text-xs">Trigger</th>
                <th className="px-4 py-3 text-left font-medium text-foreground text-xs">Action</th>
                <th className="px-4 py-3 text-left font-medium text-foreground text-xs">Last run</th>
                <th className="px-4 py-3 text-left font-medium text-foreground text-xs">Next run</th>
                <th className="px-4 py-3 text-center font-medium text-foreground text-xs">Runs</th>
                <th className="px-4 py-3 text-left font-medium text-foreground text-xs">Status</th>
                <th className="px-4 py-3 text-left font-medium text-foreground text-xs">Actions</th>
              </tr>
            </thead>
            <tbody>
              {routines.map((routine) => (
                <RoutineRow
                  historyOpen={historyId === routine.id}
                  key={routine.id}
                  onHistoryToggle={() => toggleHistory(routine.id)}
                  routine={routine}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default function RoutinesPage() {
  return <RoutinesView />;
}
