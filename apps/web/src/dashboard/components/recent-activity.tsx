import { useNavigate } from "react-router";
import { Badge } from "@/common/components/ui";
import { cn } from "@/common/lib/utils";
import { useJobs } from "@/jobs/queries";

const STATE_BADGE: Record<string, { variant: "success" | "warning" | "destructive" | "default"; label: string }> = {
  running: { variant: "warning", label: "Running" },
  in_progress: { variant: "warning", label: "Running" },
  pending: { variant: "default", label: "Pending" },
  completed: { variant: "success", label: "Done" },
  failed: { variant: "destructive", label: "Failed" },
  cancelled: { variant: "default", label: "Cancelled" },
};

function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function RecentActivity() {
  const navigate = useNavigate();
  const { data: jobs, isLoading } = useJobs();

  const recent = (jobs ?? [])
    .sort((a, b) => {
      const ta = a.updated_at || a.created_at || "";
      const tb = b.updated_at || b.created_at || "";
      return tb.localeCompare(ta);
    })
    .slice(0, 5);

  if (isLoading) {
    return (
      <section>
        <h2 className="mb-3 font-display text-sm font-semibold text-foreground">Recent Activity</h2>
        <div className="space-y-1">
          {Array.from({ length: 3 }).map((_, i) => (
            <div className="h-11 animate-pulse rounded-lg bg-surface-low" key={i} />
          ))}
        </div>
      </section>
    );
  }

  if (recent.length === 0) {
    return (
      <section>
        <h2 className="mb-3 font-display text-sm font-semibold text-foreground">Recent Activity</h2>
        <p className="text-xs text-muted-foreground">No recent activity</p>
      </section>
    );
  }

  return (
    <section>
      <h2 className="mb-3 font-display text-sm font-semibold text-foreground">Recent Activity</h2>
      <div className="space-y-1">
        {recent.map((job) => {
          const badge = STATE_BADGE[job.state] ?? STATE_BADGE.pending!;
          const time = job.updated_at || job.created_at;
          return (
            <button
              className={cn(
                "flex w-full items-center justify-between rounded-lg bg-surface-low px-3 py-2.5",
                "text-left transition-colors hover:bg-surface-high"
              )}
              key={job.id}
              onClick={() => navigate(`/jobs/${job.id}`)}
              type="button"
            >
              <div className="flex min-w-0 items-center gap-2.5">
                <Badge variant={badge.variant}>{badge.label}</Badge>
                <span className="truncate text-xs text-foreground">{job.title}</span>
              </div>
              {time && (
                <span className="ml-3 shrink-0 text-[10px] text-muted-foreground">
                  {relativeTime(time)}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </section>
  );
}
