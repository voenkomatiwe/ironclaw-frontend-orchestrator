import { ChevronDown, ChevronRight, File, Folder, Loader, RefreshCw, Send, Square } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/common/lib/utils";
import type { JobEntry, JobState } from "../api-types";
import {
  useCancelJob,
  useJobPrompt,
  useJobStream,
  useJobs,
  useJobsSummary,
  useJobWorkspaceFile,
  useJobWorkspaceList,
  useRestartJob,
} from "../queries";

const stateClass: Partial<Record<string, string>> = {
  pending: "border border-blue-200 bg-blue-100 text-blue-700",
  running: "border border-amber-200 bg-amber-100 text-amber-700",
  completed: "border border-green-200 bg-green-100 text-green-700",
  failed: "border border-red-200 bg-red-100 text-red-600",
  cancelled: "border border-gray-200 bg-gray-100 text-gray-500",
};

function StateBadge({ state }: { state: JobState }) {
  return (
    <span
      className={cn(
        "rounded-full px-2 py-0.5 font-medium text-xs",
        stateClass[state] ?? "border border-gray-200 bg-gray-100 text-gray-500",
        state === "running" && "animate-pulse"
      )}
    >
      {state}
    </span>
  );
}

function StatCard({ label, value, color }: { label: string; value: number | undefined; color: string }) {
  return (
    <div className="rounded-xl border border-border bg-surface-high p-4">
      <p className="mb-1 text-muted-foreground text-xs">{label}</p>
      <p className={cn("font-bold text-2xl", color)}>{value ?? "—"}</p>
    </div>
  );
}

function formatDate(iso?: string) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function JobDetail({ job }: { job: JobEntry }) {
  const { events, connected } = useJobStream(job.id);
  const cancelJob = useCancelJob();
  const restartJob = useRestartJob();
  const promptJob = useJobPrompt();
  const [pending, setPending] = useState<"cancel" | "restart" | null>(null);
  const [browsePath, setBrowsePath] = useState("");
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [promptDraft, setPromptDraft] = useState("");

  const listQ = useJobWorkspaceList(job.id, browsePath);
  const fileQ = useJobWorkspaceFile(job.id, selectedFile);

  // biome-ignore lint/correctness/useExhaustiveDependencies: reset when expanded job changes
  useEffect(() => {
    setBrowsePath("");
    setSelectedFile(null);
    setPromptDraft("");
  }, [job.id]);

  const canCancel = job.state === "running" || job.state === "in_progress";
  const canRestart = job.can_restart ?? (job.state === "failed" || job.state === "cancelled");
  const canPrompt = job.can_prompt === true && (job.state === "running" || job.state === "in_progress");

  async function handleCancel() {
    setPending("cancel");
    try {
      await cancelJob.mutateAsync(job.id);
    } finally {
      setPending(null);
    }
  }

  async function handleRestart() {
    setPending("restart");
    try {
      await restartJob.mutateAsync(job.id);
    } finally {
      setPending(null);
    }
  }

  return (
    <div className="border-border border-t bg-surface-low px-4 py-4">
      <div className="mb-3 flex items-center gap-2">
        {canCancel && (
          <button
            className="flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-1.5 text-red-600 text-xs transition-colors hover:bg-red-50 disabled:opacity-50"
            disabled={pending !== null}
            onClick={handleCancel}
            type="button"
          >
            {pending === "cancel" ? <Loader className="animate-spin" size={12} /> : <Square size={12} />}
            Cancel
          </button>
        )}
        {canRestart && (
          <button
            className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-on-primary-fixed text-xs transition-colors hover:bg-primary/90 disabled:opacity-50"
            disabled={pending !== null}
            onClick={handleRestart}
            type="button"
          >
            {pending === "restart" ? <Loader className="animate-spin" size={12} /> : <RefreshCw size={12} />}
            Restart
          </button>
        )}
        <div className="ml-auto flex items-center gap-1.5">
          <span className={cn("h-2 w-2 rounded-full", connected ? "bg-green-500" : "bg-gray-300")} />
          <span className="text-muted-foreground text-xs">{connected ? "Live" : "Disconnected"}</span>
        </div>
      </div>

      {events.length > 0 ? (
        <div className="max-h-48 overflow-y-auto rounded-lg border border-border bg-surface-highest">
          <div className="divide-y divide-border font-mono">
            {events.map((evt, i) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: append-only list
              <div className="px-3 py-1.5 text-foreground text-xs" key={i}>
                {evt.timestamp && (
                  <span className="mr-2 text-muted-foreground text-xs">
                    {new Date(evt.timestamp).toLocaleTimeString()}
                  </span>
                )}
                {evt.message ?? evt.data ?? JSON.stringify(evt)}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <p className="text-muted-foreground text-xs">{connected ? "Waiting for events..." : "No events."}</p>
      )}

      <div className="mt-4 border-border border-t pt-4">
        <h4 className="mb-2 font-medium text-foreground text-xs">Workspace files</h4>
        {listQ.isLoading ? (
          <p className="text-muted-foreground text-xs">Loading file list…</p>
        ) : listQ.isError ? (
          <p className="text-muted-foreground text-xs">
            No sandbox workspace available for this job (files API not applicable or not found).
          </p>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-lg border border-border bg-surface-highest">
              <div className="flex items-center gap-1 border-border border-b px-2 py-1.5 font-mono text-[10px] text-muted-foreground">
                {browsePath ? (
                  <button
                    className="rounded px-1 hover:bg-surface-high"
                    onClick={() => {
                      const i = browsePath.lastIndexOf("/");
                      setBrowsePath(i <= 0 ? "" : browsePath.slice(0, i));
                      setSelectedFile(null);
                    }}
                    type="button"
                  >
                    ↑
                  </button>
                ) : null}
                <span className="truncate">{browsePath || "(root)"}</span>
              </div>
              <div className="max-h-40 overflow-y-auto p-1">
                {(listQ.data?.entries ?? []).map((e) => (
                  <button
                    className={cn(
                      "flex w-full items-center gap-1.5 rounded px-2 py-1 text-left font-mono text-foreground text-xs hover:bg-surface-high",
                      selectedFile === e.path && !e.is_dir && "bg-surface-high"
                    )}
                    key={e.path}
                    onClick={() => {
                      if (e.is_dir) {
                        setBrowsePath(e.path);
                        setSelectedFile(null);
                      } else {
                        setSelectedFile(e.path);
                      }
                    }}
                    type="button"
                  >
                    {e.is_dir ? (
                      <Folder className="shrink-0 text-amber-600" size={12} />
                    ) : (
                      <File className="shrink-0 text-muted-foreground" size={12} />
                    )}
                    <span className="truncate">{e.name}</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="min-h-[120px] rounded-lg border border-border bg-surface-highest p-2">
              {!selectedFile ? (
                <p className="text-muted-foreground text-xs">Select a file to preview</p>
              ) : fileQ.isLoading ? (
                <p className="text-muted-foreground text-xs">Loading…</p>
              ) : fileQ.isError ? (
                <p className="text-destructive text-xs">Could not read file.</p>
              ) : (
                <pre className="max-h-48 overflow-auto whitespace-pre-wrap break-all font-mono text-[10px] text-foreground">
                  {fileQ.data?.content ?? ""}
                </pre>
              )}
            </div>
          </div>
        )}
      </div>

      {canPrompt ? (
        <div className="mt-4 border-border border-t pt-4">
          <h4 className="mb-2 font-medium text-foreground text-xs">Follow-up prompt</h4>
          <div className="flex gap-2">
            <textarea
              className="min-h-[64px] flex-1 resize-y rounded-lg border border-border bg-surface-highest px-3 py-2 font-mono text-foreground text-xs"
              onChange={(e) => setPromptDraft(e.target.value)}
              placeholder="Message to send to the running job…"
              value={promptDraft}
            />
            <button
              className="flex h-9 shrink-0 items-center gap-1 self-end rounded-lg bg-primary px-3 text-on-primary-fixed text-xs disabled:opacity-50"
              disabled={!promptDraft.trim() || promptJob.isPending}
              onClick={() => {
                const t = promptDraft.trim();
                if (!t) return;
                promptJob.mutate(
                  { id: job.id, content: t, done: false },
                  {
                    onSuccess: () => setPromptDraft(""),
                  }
                );
              }}
              type="button"
            >
              {promptJob.isPending ? <Loader className="animate-spin" size={12} /> : <Send size={12} />}
              Send
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function JobRow({ job, expanded, onToggle }: { job: JobEntry; expanded: boolean; onToggle: () => void }) {
  return (
    <>
      <tr className="cursor-pointer border-border border-b hover:bg-surface-highest" onClick={onToggle}>
        <td className="px-4 py-3">
          <div className="flex items-center gap-1.5">
            {expanded ? (
              <ChevronDown className="shrink-0 text-muted-foreground" size={14} />
            ) : (
              <ChevronRight className="shrink-0 text-muted-foreground" size={14} />
            )}
            <span className="font-mono text-muted-foreground text-xs">{job.id.slice(0, 8)}</span>
          </div>
        </td>
        <td className="px-4 py-3 font-medium text-foreground text-sm">{job.title}</td>
        <td className="px-4 py-3 text-muted-foreground text-xs">{job.source ?? "—"}</td>
        <td className="px-4 py-3">
          <StateBadge state={job.state} />
        </td>
        <td className="px-4 py-3 text-muted-foreground text-xs">{formatDate(job.created_at)}</td>
        <td className="px-4 py-3 text-right">
          <File className="ml-auto text-muted-foreground" size={13} />
        </td>
      </tr>
      {expanded && (
        <tr>
          <td className="p-0" colSpan={6}>
            <JobDetail job={job} />
          </td>
        </tr>
      )}
    </>
  );
}

export function JobsView() {
  const { data: summary } = useJobsSummary();
  const { data: jobs = [], isLoading } = useJobs();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <div className="mx-auto max-w-6xl p-6">
      <div className="mb-6">
        <h1 className="font-bold text-foreground text-xl">Sandbox Jobs</h1>
        <p className="mt-0.5 text-muted-foreground text-sm">Monitor and manage Claude Code sandbox executions</p>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard color="text-foreground" label="Total" value={summary?.total} />
        <StatCard color="text-amber-600" label="Running" value={summary?.running} />
        <StatCard color="text-success" label="Completed" value={summary?.completed} />
        <StatCard color="text-destructive" label="Failed" value={summary?.failed} />
      </div>

      {isLoading ? (
        <div className="flex items-center gap-2 text-muted-foreground text-sm">
          <Loader className="animate-spin" size={16} />
          Loading jobs...
        </div>
      ) : jobs.length === 0 ? (
        <div className="rounded-xl border border-border bg-surface-high p-8 text-center">
          <p className="text-muted-foreground text-sm">No jobs found.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-border border-b bg-surface-high">
                <th className="px-4 py-3 text-left font-medium text-foreground text-xs">ID</th>
                <th className="px-4 py-3 text-left font-medium text-foreground text-xs">Title</th>
                <th className="px-4 py-3 text-left font-medium text-foreground text-xs">Source</th>
                <th className="px-4 py-3 text-left font-medium text-foreground text-xs">State</th>
                <th className="px-4 py-3 text-left font-medium text-foreground text-xs">Created</th>
                <th className="px-4 py-3 text-right font-medium text-foreground text-xs">Files</th>
              </tr>
            </thead>
            <tbody>
              {jobs.map((job) => (
                <JobRow
                  expanded={expandedId === job.id}
                  job={job}
                  key={job.id}
                  onToggle={() => setExpandedId((prev) => (prev === job.id ? null : job.id))}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default function JobsPage() {
  return <JobsView />;
}
