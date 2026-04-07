import { Briefcase, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router";
import { cn } from "@/common/lib/utils";
import type { JobEntry, JobState } from "../api-types";
import { useJobs, useJobsSummary } from "../queries";

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

function formatDuration(created?: string, updated?: string): string {
  if (!created || !updated) return "";
  try {
    const ms = new Date(updated).getTime() - new Date(created).getTime();
    if (ms < 1000) return "< 1s";
    if (ms < 60_000) return `${Math.round(ms / 1000)}s`;
    return `${Math.round(ms / 60_000)}m`;
  } catch {
    return "";
  }
}

const stateLabel: Record<string, string> = {
  running: "Running",
  in_progress: "Running",
  pending: "Pending",
  completed: "Done",
  failed: "Failed",
  cancelled: "Cancelled",
};

const stateStyle: Record<string, string> = {
  running: "bg-warning/10 text-warning",
  in_progress: "bg-warning/10 text-warning",
  pending: "bg-primary/10 text-primary",
  completed: "bg-success/10 text-success",
  failed: "bg-destructive/10 text-destructive",
  cancelled: "bg-muted text-muted-foreground",
};

const borderColor: Record<string, string> = {
  running: "border-l-warning",
  in_progress: "border-l-warning",
  pending: "border-l-primary",
  completed: "border-l-success",
  failed: "border-l-destructive",
  cancelled: "border-l-border",
};

const STATE_ORDER: Record<string, number> = {
  running: 0,
  in_progress: 0,
  pending: 1,
  failed: 2,
  completed: 3,
  cancelled: 4,
};

function isRunning(state: JobState): boolean {
  return state === "running" || state === "in_progress";
}

function buildInfoLine(job: JobEntry): string {
  const source = job.source ?? "unknown";
  const dur = formatDuration(job.created_at, job.updated_at);
  if (isRunning(job.state)) {
    return `Started ${formatRelative(job.created_at)} · via ${source}`;
  }
  if (job.state === "completed") {
    return `Completed ${formatRelative(job.updated_at)} · took ${dur || "—"} · via ${source}`;
  }
  if (job.state === "failed") {
    return `Failed ${formatRelative(job.updated_at)} · took ${dur || "—"} · via ${source}`;
  }
  if (job.state === "cancelled") {
    return `Cancelled ${formatRelative(job.updated_at)} · via ${source}`;
  }
  return `Queued ${formatRelative(job.created_at)} · via ${source}`;
}

/* ── SummaryPills ────────────────────────────────────────── */

type SummaryPillsProps = {
  running: number;
  completed: number;
  failed: number;
};

function SummaryPills({ running, completed, failed }: SummaryPillsProps) {
  return (
    <div className="mb-5 flex flex-wrap gap-2">
      {running > 0 && (
        <div className="flex items-center gap-2 rounded-full bg-white px-4 py-1.5 text-sm shadow-xs">
          <span className="h-2 w-2 animate-pulse rounded-full bg-warning" />
          {running} running
        </div>
      )}
      <div className="flex items-center gap-2 rounded-full bg-white px-4 py-1.5 text-sm shadow-xs">
        <span className="h-2 w-2 rounded-full bg-success" />
        {completed} completed
      </div>
      {failed > 0 && (
        <div className="flex items-center gap-2 rounded-full bg-white px-4 py-1.5 text-sm shadow-xs">
          <span className="h-2 w-2 rounded-full bg-destructive" />
          {failed} failed
        </div>
      )}
    </div>
  );
}

/* ── JobCard ─────────────────────────────────────────────── */

type JobCardProps = {
  job: JobEntry;
};

function JobCard({ job }: JobCardProps) {
  const navigate = useNavigate();
  const running = isRunning(job.state);

  return (
    <button
      className={cn(
        "w-full rounded-2xl border-l-4 bg-white text-left shadow-xs transition-shadow hover:shadow-sm",
        borderColor[job.state] ?? "border-l-border",
        job.state === "cancelled" && "opacity-60"
      )}
      onClick={() => navigate(`/jobs/${job.id}`)}
      type="button"
    >
      <div className="flex items-start justify-between gap-3 p-4">
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-[15px] text-foreground">{job.title}</p>
          <p className="mt-1 text-[13px] text-muted-foreground">{buildInfoLine(job)}</p>
        </div>
        <div className="flex shrink-0 items-center gap-2.5">
          <span
            className={cn(
              "flex items-center gap-1.5 rounded-full px-2.5 py-0.5 font-medium text-xs",
              stateStyle[job.state] ?? "bg-muted text-muted-foreground"
            )}
          >
            {running && <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-warning" />}
            {stateLabel[job.state] ?? job.state}
          </span>
          <ChevronRight className="text-muted-foreground" size={18} />
        </div>
      </div>
    </button>
  );
}

/* ── Skeleton & Empty ────────────────────────────────────── */

function JobCardSkeleton() {
  return (
    <div className="animate-pulse rounded-2xl border-l-4 border-l-border bg-white p-4 shadow-xs">
      <div className="flex items-start justify-between">
        <div>
          <div className="h-4 w-44 rounded-md bg-surface-highest" />
          <div className="mt-2 h-3 w-64 rounded-md bg-surface-highest" />
        </div>
        <div className="flex items-center gap-2">
          <div className="h-5 w-16 rounded-full bg-surface-highest" />
        </div>
      </div>
    </div>
  );
}

function SkeletonPills() {
  return (
    <div className="mb-5 flex gap-2">
      <div className="h-8 w-24 animate-pulse rounded-full bg-surface-highest" />
      <div className="h-8 w-28 animate-pulse rounded-full bg-surface-highest" />
      <div className="h-8 w-20 animate-pulse rounded-full bg-surface-highest" />
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <div className="max-w-[280px] text-center">
        <Briefcase className="mx-auto mb-4 text-muted-foreground/30" size={48} />
        <p className="font-semibold text-[17px] text-foreground">No jobs yet</p>
        <p className="mt-2 text-[13px] text-muted-foreground leading-relaxed">
          Jobs are tasks that run in the sandbox. They will appear here when triggered.
        </p>
      </div>
    </div>
  );
}

/* ── JobsListView ────────────────────────────────────────── */

export function JobsListView() {
  const { data: summary } = useJobsSummary();
  const { data: jobs = [], isLoading } = useJobs();

  const sortedJobs = [...jobs].sort((a, b) => {
    const oa = STATE_ORDER[a.state] ?? 3;
    const ob = STATE_ORDER[b.state] ?? 3;
    if (oa !== ob) return oa - ob;
    return (b.created_at ?? "").localeCompare(a.created_at ?? "");
  });

  return (
    <div className="mx-auto p-6">
      {isLoading ? (
        <>
          <SkeletonPills />
          <div className="flex flex-col gap-3">
            <JobCardSkeleton />
            <JobCardSkeleton />
          </div>
        </>
      ) : sortedJobs.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          <SummaryPills
            completed={summary?.completed ?? 0}
            failed={summary?.failed ?? 0}
            running={summary?.running ?? 0}
          />
          <div className="flex flex-col gap-3">
            {sortedJobs.map((job) => (
              <JobCard job={job} key={job.id} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default function JobsListPage() {
  return <JobsListView />;
}
