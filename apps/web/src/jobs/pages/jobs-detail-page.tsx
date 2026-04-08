import { ArrowLeft, File, Folder, Loader, RefreshCw, Send, Square } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { cn } from "@/common/lib/utils";
import type { JobEntry, JobState } from "../api-types";
import {
  useCancelJob,
  useJobPrompt,
  useJobStream,
  useJobs,
  useJobWorkspaceFile,
  useJobWorkspaceList,
  useRestartJob,
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

function isRunning(state: JobState): boolean {
  return state === "running" || state === "in_progress";
}

function buildInfoLine(job: JobEntry): string {
  const source = job.source ?? "unknown";
  const dur = formatDuration(job.created_at, job.updated_at);
  if (isRunning(job.state)) return `Started ${formatRelative(job.created_at)} · via ${source}`;
  if (job.state === "completed")
    return `Completed ${formatRelative(job.updated_at)} · took ${dur || "—"} · via ${source}`;
  if (job.state === "failed") return `Failed ${formatRelative(job.updated_at)} · took ${dur || "—"} · via ${source}`;
  if (job.state === "cancelled") return `Cancelled ${formatRelative(job.updated_at)} · via ${source}`;
  return `Queued ${formatRelative(job.created_at)} · via ${source}`;
}

/* ── EventTimeline ───────────────────────────────────────── */

type EventTimelineProps = {
  jobId: string;
};

function EventTimeline({ jobId }: EventTimelineProps) {
  const { events, connected } = useJobStream(jobId);
  const scrollRef = useRef<HTMLDivElement>(null);

  // biome-ignore lint/correctness/useExhaustiveDependencies: auto-scroll on new events
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [events.length]);

  return (
    <div className="flex min-h-0 flex-1 flex-col p-4">
      {events.length === 0 ? (
        <p className="text-muted-foreground text-xs">{connected ? "Waiting for activity…" : "No activity recorded."}</p>
      ) : (
        <div className="flex flex-col gap-2 overflow-y-auto" ref={scrollRef}>
          {events.map((evt, i) => {
            const message = evt.message ?? evt.data ?? JSON.stringify(evt);
            return (
              // biome-ignore lint/suspicious/noArrayIndexKey: append-only SSE stream
              <div className="flex items-start gap-3" key={i}>
                <div className="mt-0.5 flex h-5.5 w-5.5 shrink-0 items-center justify-center rounded-full bg-success/10 text-success text-xs">
                  ✓
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-[13px] text-foreground">{message}</span>
                    {evt.timestamp && (
                      <span className="text-[11px] text-muted-foreground">
                        {new Date(evt.timestamp).toLocaleTimeString()}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
      {/* Live indicator */}
      <div className="mt-4 flex items-center gap-1.5">
        <span className={cn("h-1.5 w-1.5 rounded-full", connected ? "bg-success" : "bg-muted-foreground/40")} />
        <span className="text-[11px] text-muted-foreground">{connected ? "Live — auto-updating" : "Disconnected"}</span>
      </div>
    </div>
  );
}

/* ── FileExplorer ────────────────────────────────────────── */

type FileExplorerProps = {
  jobId: string;
};

function FileExplorer({ jobId }: FileExplorerProps) {
  const [browsePath, setBrowsePath] = useState("");
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const listQ = useJobWorkspaceList(jobId, browsePath);
  const fileQ = useJobWorkspaceFile(jobId, selectedFile);

  if (listQ.isError) {
    return <p className="p-4 text-muted-foreground text-xs">No workspace files available for this job.</p>;
  }

  return (
    <div className="flex flex-col gap-3 p-4">
      {/* File tree */}
      <div className="overflow-hidden rounded-xl border border-border bg-white">
        <div className="flex items-center gap-2 border-border border-b bg-surface-high px-3 py-2 font-semibold text-[11px] text-muted-foreground">
          {browsePath ? (
            <button
              className="rounded px-1 hover:bg-surface-highest"
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
          <span className="truncate">📁 {browsePath || "Workspace files"}</span>
        </div>
        <div className="max-h-48 overflow-y-auto p-1">
          {listQ.isLoading ? (
            <div className="flex items-center justify-center py-4 text-muted-foreground">
              <Loader className="animate-spin" size={14} />
            </div>
          ) : (
            (listQ.data?.entries ?? []).map((e) => (
              <button
                className={cn(
                  "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-[13px] text-foreground hover:bg-surface-high",
                  selectedFile === e.path && !e.is_dir && "bg-primary/5"
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
                  <Folder className="shrink-0 text-warning" size={14} />
                ) : (
                  <File className="shrink-0 text-muted-foreground" size={14} />
                )}
                <span className="truncate">{e.name}</span>
              </button>
            ))
          )}
        </div>
      </div>

      {/* File preview */}
      <div className="overflow-hidden rounded-xl border border-border bg-white">
        <div className="border-border border-b bg-surface-high px-3 py-2 text-[11px] text-muted-foreground">
          {selectedFile ? `📄 ${selectedFile.split("/").pop()}` : "Select a file to preview"}
        </div>
        <div className="p-3">
          {!selectedFile ? (
            <p className="text-muted-foreground text-xs">Tap a file above to see its contents.</p>
          ) : fileQ.isLoading ? (
            <div className="flex items-center justify-center py-4 text-muted-foreground">
              <Loader className="animate-spin" size={14} />
            </div>
          ) : fileQ.isError ? (
            <p className="text-destructive text-xs">Could not read this file.</p>
          ) : (
            <pre className="max-h-64 overflow-auto whitespace-pre-wrap break-all font-mono text-[11px] text-foreground">
              {fileQ.data?.content ?? ""}
            </pre>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── MessageForm ─────────────────────────────────────────── */

type MessageFormProps = {
  jobId: string;
};

function MessageForm({ jobId }: MessageFormProps) {
  const promptMutation = useJobPrompt();
  const [draft, setDraft] = useState("");

  function handleSend() {
    const t = draft.trim();
    if (!t) return;
    promptMutation.mutate({ id: jobId, content: t, done: false }, { onSuccess: () => setDraft("") });
  }

  return (
    <div className="flex flex-col gap-3 p-4">
      <textarea
        className="min-h-20 resize-y rounded-xl border border-border bg-white px-3 py-2 text-[13px] text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        onChange={(e) => setDraft(e.target.value)}
        placeholder="Message to send to the running job…"
        value={draft}
      />
      <button
        className="flex w-full items-center justify-center gap-1.5 self-end rounded-xl bg-primary px-4 py-2 font-medium text-[13px] text-white transition-colors hover:bg-primary/90 disabled:opacity-50 sm:w-auto"
        disabled={!draft.trim() || promptMutation.isPending}
        onClick={handleSend}
        type="button"
      >
        {promptMutation.isPending ? <Loader className="animate-spin" size={14} /> : <Send size={14} />}
        Send
      </button>
    </div>
  );
}

/* ── JobDetailView ───────────────────────────────────────── */

type TabId = "activity" | "files" | "message";

type JobDetailViewProps = {
  job: JobEntry;
};

function JobDetailView({ job }: JobDetailViewProps) {
  const navigate = useNavigate();
  const cancelJob = useCancelJob();
  const restartJob = useRestartJob();
  const [activeTab, setActiveTab] = useState<TabId>("activity");
  const [pending, setPending] = useState<"cancel" | "restart" | null>(null);

  // biome-ignore lint/correctness/useExhaustiveDependencies: reset tab when job changes
  useEffect(() => {
    setActiveTab("activity");
  }, [job.id]);

  const running = isRunning(job.state);
  const canCancel = running;
  const canRestart = job.can_restart ?? (job.state === "failed" || job.state === "cancelled");
  const canPrompt = job.can_prompt === true && running;

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

  const tabs: { id: TabId; label: string; disabled: boolean }[] = [
    { id: "activity", label: "Activity", disabled: false },
    { id: "files", label: "Files", disabled: false },
    { id: "message", label: "Message", disabled: !canPrompt },
  ];

  return (
    <div className="flex flex-col">
      {/* Top bar */}
      <div className="flex items-center gap-3 border-border border-b bg-white px-4 py-3">
        <button
          className="flex shrink-0 items-center gap-1.5 text-[13px] text-muted-foreground transition-colors hover:text-foreground"
          onClick={() => navigate("/jobs")}
          type="button"
        >
          <ArrowLeft size={16} />
          Back
        </button>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h2 className="truncate font-display font-semibold text-[16px] text-foreground">{job.title}</h2>
            <span
              className={cn(
                "flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-0.5 font-medium text-xs",
                stateStyle[job.state] ?? "bg-muted text-muted-foreground"
              )}
            >
              {running && <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-warning" />}
              {stateLabel[job.state] ?? job.state}
            </span>
          </div>
          <p className="text-[12px] text-muted-foreground">{buildInfoLine(job)}</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {canCancel && (
            <button
              className="flex items-center gap-1.5 rounded-xl border border-destructive/30 px-3 py-1.5 font-medium text-destructive text-xs transition-colors hover:bg-destructive/5 disabled:opacity-50"
              disabled={pending !== null}
              onClick={handleCancel}
              type="button"
            >
              {pending === "cancel" ? <Loader className="animate-spin" size={12} /> : <Square size={12} />}
              Stop
            </button>
          )}
          {canRestart && (
            <button
              className="flex items-center gap-1.5 rounded-xl bg-primary px-3 py-1.5 font-medium text-white text-xs transition-colors hover:bg-primary/90 disabled:opacity-50"
              disabled={pending !== null}
              onClick={handleRestart}
              type="button"
            >
              {pending === "restart" ? <Loader className="animate-spin" size={12} /> : <RefreshCw size={12} />}
              Restart
            </button>
          )}
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex border-border border-b bg-white">
        {tabs.map((tab) => (
          <button
            className={cn(
              "border-b-2 px-5 pt-2.5 pb-2 font-medium text-[13px] transition-colors",
              activeTab === tab.id
                ? "border-primary text-primary"
                : tab.disabled
                  ? "cursor-default border-transparent text-muted-foreground/40"
                  : "border-transparent text-muted-foreground hover:text-foreground"
            )}
            disabled={tab.disabled}
            key={tab.id}
            onClick={() => !tab.disabled && setActiveTab(tab.id)}
            type="button"
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === "activity" && <EventTimeline jobId={job.id} />}
      {activeTab === "files" && <FileExplorer jobId={job.id} />}
      {activeTab === "message" && canPrompt && <MessageForm jobId={job.id} />}
    </div>
  );
}

/* ── Page ─────────────────────────────────────────────────── */

export default function JobDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: jobs = [], isLoading } = useJobs();
  const job = jobs.find((j) => j.id === id) ?? null;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        <Loader className="animate-spin" size={20} />
      </div>
    );
  }

  if (!job) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-20">
        <p className="text-muted-foreground text-sm">Job not found</p>
        <button className="text-primary text-sm hover:underline" onClick={() => navigate("/jobs")} type="button">
          ← Back to jobs
        </button>
      </div>
    );
  }

  return <JobDetailView job={job} />;
}
