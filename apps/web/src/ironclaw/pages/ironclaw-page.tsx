import { AlertCircle, Bot, ImagePlus, Loader2, Send } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type {
  IronclawImageAttachment,
  IronclawMessage,
  IronclawPendingApproval,
  IronclawSsePayload,
  IronclawTurn,
} from "../api-types";
import { ChatApprovalCard } from "../components/chat-approval-card";
import { ChatAuthCard } from "../components/chat-auth-card";
import { ChatBubble } from "../components/chat-bubble";
import { ThreadList } from "../components/thread-list";
import {
  fetchIronclawHistoryBefore,
  useIronclawApproval,
  useIronclawAuthCancel,
  useIronclawAuthToken,
  useIronclawCreateThread,
  useIronclawHistory,
  useIronclawSendMessage,
  useIronclawStatus,
  useIronclawThreads,
} from "../queries";
import { useIronclawChatSse } from "../use-ironclaw-chat-sse";

function turnsToMessages(turns: IronclawTurn[]): IronclawMessage[] {
  const msgs: IronclawMessage[] = [];
  for (const turn of turns) {
    if (turn.user_input) {
      msgs.push({ role: "user", content: turn.user_input, timestamp: turn.started_at });
    }
    if (turn.response) {
      msgs.push({
        role: "assistant",
        content: turn.response,
        timestamp: turn.completed_at,
        toolCalls: turn.tool_calls?.length ? turn.tool_calls : undefined,
      });
    }
  }
  return msgs;
}

function normId(a?: string | null, b?: string | null): boolean {
  if (!a || !b) return false;
  return a.replace(/-/g, "").toLowerCase() === b.replace(/-/g, "").toLowerCase();
}

function contentKeySnippet(s: string): string {
  let h = 0;
  const cap = Math.min(s.length, 240);
  for (let i = 0; i < cap; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return `${h}`;
}

function payloadThreadMatch(payload: IronclawSsePayload, threadId?: string): boolean {
  const tid = payload.thread_id;
  if (!tid) return true;
  return normId(tid, threadId);
}

type ToolLine = { name: string; status: "running" | "done"; ok?: boolean; preview?: string };

const SLASH_HINTS = ["/help", "/status", "/clear", "/compact", "/interrupt", "/thread new"];

export function IronclawChat() {
  const { data: status, isLoading: statusLoading } = useIronclawStatus();
  const { data: threadsData } = useIronclawThreads();
  const [activeThreadId, setActiveThreadId] = useState<string | undefined>();
  const [sseFresh, setSseFresh] = useState(false);
  const [streamingText, setStreamingText] = useState("");
  const [thinking, setThinking] = useState<string | null>(null);
  const [tools, setTools] = useState<ToolLine[]>([]);
  const [prependedTurns, setPrependedTurns] = useState<IronclawTurn[]>([]);
  const [paginationBefore, setPaginationBefore] = useState<string | null>(null);
  const [olderHasMore, setOlderHasMore] = useState<boolean | null>(null);
  const [loadOlderBusy, setLoadOlderBusy] = useState(false);
  const [sseApproval, setSseApproval] = useState<IronclawPendingApproval | null>(null);
  const [authExt, setAuthExt] = useState<{
    extension_name: string;
    instructions?: string;
  } | null>(null);
  const [stagedImages, setStagedImages] = useState<(IronclawImageAttachment & { id: string })[]>([]);
  const [showSlash, setShowSlash] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const qcRefetch = useRef<() => void>(() => {});

  const historyQuery = useIronclawHistory(activeThreadId, {
    refetchInterval: sseFresh ? false : 3500,
  });
  const { data: history, refetch: refetchHistory } = historyQuery;
  qcRefetch.current = () => {
    void refetchHistory();
  };

  const sendMutation = useIronclawSendMessage();
  const createThread = useIronclawCreateThread();
  const approvalMut = useIronclawApproval();
  const authTokenMut = useIronclawAuthToken();
  const authCancelMut = useIronclawAuthCancel();

  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const allThreads = useMemo(() => {
    if (!threadsData) return [];
    const list = [];
    if (threadsData.assistant_thread) list.push(threadsData.assistant_thread);
    if (threadsData.threads) list.push(...threadsData.threads);
    return list;
  }, [threadsData]);

  useEffect(() => {
    if (!activeThreadId && threadsData?.active_thread) {
      setActiveThreadId(threadsData.active_thread);
    } else if (!activeThreadId && allThreads.length > 0) {
      setActiveThreadId(allThreads[0]!.id);
    }
  }, [threadsData, allThreads, activeThreadId]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: intentional reset when switching threads
  useEffect(() => {
    setPrependedTurns([]);
    setPaginationBefore(null);
    setOlderHasMore(null);
    setStreamingText("");
    setThinking(null);
    setTools([]);
    setSseFresh(false);
    setSseApproval(null);
    setAuthExt(null);
  }, [activeThreadId]);

  const mergedTurns = useMemo(() => [...prependedTurns, ...(history?.turns ?? [])], [prependedTurns, history?.turns]);

  const messages = useMemo(() => turnsToMessages(mergedTurns), [mergedTurns]);

  const pendingApproval = history?.pending_approval ?? sseApproval ?? undefined;

  const handleSse = useCallback(
    (raw: { event: string; payload: IronclawSsePayload }) => {
      const ev = raw.event;
      const p = raw.payload;
      const t = p.type ?? ev;

      setSseFresh(true);

      if (t === "heartbeat") return;

      if ((t === "response" || ev === "response") && payloadThreadMatch(p, activeThreadId)) {
        setStreamingText("");
        setThinking(null);
        setTools([]);
        qcRefetch.current();
        return;
      }

      if ((t === "stream_chunk" || ev === "stream_chunk") && payloadThreadMatch(p, activeThreadId)) {
        const c = typeof p.content === "string" ? p.content : "";
        setStreamingText((prev) => prev + c);
        setThinking(null);
        return;
      }

      if ((t === "thinking" || ev === "thinking") && payloadThreadMatch(p, activeThreadId)) {
        setThinking(typeof p.message === "string" ? p.message : "Thinking…");
        return;
      }

      if ((t === "tool_started" || ev === "tool_started") && payloadThreadMatch(p, activeThreadId)) {
        const name = typeof p.name === "string" ? p.name : "?";
        setTools((prev) => [...prev.filter((x) => x.name !== name), { name, status: "running" }]);
        return;
      }

      if ((t === "tool_completed" || ev === "tool_completed") && payloadThreadMatch(p, activeThreadId)) {
        const name = typeof p.name === "string" ? p.name : "?";
        setTools((prev) =>
          prev.map((x) =>
            x.name === name ? { ...x, status: "done" as const, ok: Boolean(p.success), preview: x.preview } : x
          )
        );
        return;
      }

      if ((t === "tool_result" || ev === "tool_result") && payloadThreadMatch(p, activeThreadId)) {
        const name = typeof p.name === "string" ? p.name : "?";
        const preview = typeof p.preview === "string" ? p.preview : undefined;
        setTools((prev) => prev.map((x) => (x.name === name ? { ...x, preview: preview ?? x.preview } : x)));
        return;
      }

      if (t === "approval_needed" || ev === "approval_needed") {
        const forThread = !p.thread_id || normId(p.thread_id, activeThreadId);
        if (forThread && p.request_id && p.tool_name) {
          setSseApproval({
            request_id: String(p.request_id),
            tool_name: String(p.tool_name),
            description: String(p.description ?? ""),
            parameters: String(p.parameters ?? "{}"),
          });
        }
        return;
      }

      if (t === "auth_required" || ev === "auth_required") {
        if (p.extension_name) {
          setAuthExt({
            extension_name: String(p.extension_name),
            instructions: typeof p.instructions === "string" ? p.instructions : undefined,
          });
        }
        return;
      }

      if (t === "auth_completed" || ev === "auth_completed") {
        setAuthExt(null);
        return;
      }

      if ((t === "error" || ev === "error") && payloadThreadMatch(p, activeThreadId)) {
        const msg = typeof p.message === "string" ? p.message : "Error";
        setThinking(null);
        setStreamingText((prev) => (prev ? `${prev}\n\n[Error] ${msg}` : `[Error] ${msg}`));
      }
    },
    [activeThreadId]
  );

  const isConnected = status?.connected === true;
  useIronclawChatSse(Boolean(isConnected && activeThreadId), handleSse);

  // biome-ignore lint/correctness/useExhaustiveDependencies: scroll when chat content changes
  useEffect(() => {
    const el = scrollRef.current;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  }, [messages.length, streamingText, tools.length, thinking]);

  const canLoadOlder = (olderHasMore ?? history?.has_more) && (paginationBefore ?? history?.oldest_timestamp);

  async function onLoadOlder() {
    const before = paginationBefore ?? history?.oldest_timestamp;
    if (!activeThreadId || !before || loadOlderBusy) return;
    setLoadOlderBusy(true);
    try {
      const page = await fetchIronclawHistoryBefore(activeThreadId, before);
      setPrependedTurns((prev) => [...(page.turns ?? []), ...prev]);
      setPaginationBefore(page.oldest_timestamp ?? null);
      setOlderHasMore(page.has_more);
    } catch {
    } finally {
      setLoadOlderBusy(false);
    }
  }

  function readFilesAsImages(files: FileList | null) {
    if (!files?.length) return;
    const cap = 4 - stagedImages.length;
    const slice = Array.from(files).slice(0, Math.max(0, cap));
    for (const file of slice) {
      if (!file.type.startsWith("image/")) continue;
      const reader = new FileReader();
      reader.onload = () => {
        const r = String(reader.result ?? "");
        const base64 = r.includes(",") ? r.split(",")[1]! : r;
        setStagedImages((prev) => [
          ...prev,
          { id: crypto.randomUUID(), data: base64, media_type: file.type || "image/png" },
        ]);
      };
      reader.readAsDataURL(file);
    }
  }

  const handleSend = () => {
    const text = input.trim();
    if ((!text && stagedImages.length === 0) || sendMutation.isPending) return;
    setInput("");
    setShowSlash(false);
    setStreamingText("");
    sendMutation.mutate({
      content: text || "(image)",
      thread_id: activeThreadId,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      images: stagedImages.length ? stagedImages.map(({ data, media_type }) => ({ data, media_type })) : undefined,
    });
    setStagedImages([]);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleCreateThread = () => {
    createThread.mutate(undefined, {
      onSuccess: (newThread) => setActiveThreadId(newThread.id),
    });
  };

  function runSlash(raw: string) {
    const cmd = raw.trim().toLowerCase();
    if (cmd === "/help") {
      window.alert(`Try: ${SLASH_HINTS.join(", ")} — sent to the agent as a normal message.`);
      return;
    }
    setInput("");
    sendMutation.mutate({ content: raw.trim(), thread_id: activeThreadId });
  }

  return (
    <div className="flex h-full">
      <ThreadList
        activeId={activeThreadId}
        isCreating={createThread.isPending}
        onCreate={handleCreateThread}
        onSelect={setActiveThreadId}
        threads={allThreads}
      />

      <div className="flex flex-1 flex-col">
        <div className="flex items-center justify-between border-border border-b bg-surface-high px-6 py-4">
          <div>
            <h1 className="flex items-center gap-2 font-bold text-foreground text-lg">
              <Bot size={20} />
              IronClaw Chat
            </h1>
            <p className="mt-0.5 text-muted-foreground text-xs">
              {statusLoading
                ? "Checking connection…"
                : isConnected
                  ? sseFresh
                    ? "Live stream connected"
                    : "Connected (syncing…)"
                  : "Disconnected"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className={`h-2 w-2 rounded-full ${isConnected ? "animate-pulse bg-success" : "bg-destructive"}`} />
            <span className="text-muted-foreground text-xs">{isConnected ? "Online" : "Offline"}</span>
          </div>
        </div>

        {!statusLoading && !isConnected && (
          <div className="mx-6 mt-4 flex items-center gap-2 rounded-xl border border-destructive/20 bg-destructive-muted p-3 text-destructive text-sm">
            <AlertCircle size={16} />
            {status?.error ?? "Cannot reach IronClaw Gateway. Check API URL and token in Auth."}
          </div>
        )}

        <div className="flex-1 space-y-4 overflow-y-auto bg-background px-6 py-4" ref={scrollRef}>
          {canLoadOlder ? (
            <div className="flex justify-center">
              <button
                className="rounded-lg border border-border px-3 py-1.5 text-muted-foreground text-xs hover:bg-surface-high disabled:opacity-50"
                disabled={loadOlderBusy}
                onClick={() => void onLoadOlder()}
                type="button"
              >
                {loadOlderBusy ? "Loading…" : "Load older messages"}
              </button>
            </div>
          ) : null}

          {messages.length === 0 && isConnected && !streamingText && (
            <div className="flex h-full min-h-[120px] flex-col items-center justify-center text-muted-foreground">
              <Bot className="mb-3 text-muted-foreground/40" size={40} />
              <p className="text-sm">Send a message or type /help for slash hints</p>
            </div>
          )}

          {messages.map((msg) => (
            <ChatBubble
              key={`${msg.role}-${msg.timestamp ?? ""}-${msg.content.length}-${contentKeySnippet(msg.content)}`}
              msg={msg}
            />
          ))}

          {thinking ? (
            <div className="flex gap-2.5 text-muted-foreground text-xs italic">
              <Loader2 className="mt-0.5 shrink-0 animate-spin" size={14} />
              {thinking}
            </div>
          ) : null}

          {tools.length > 0 ? (
            <div className="flex flex-col gap-1 rounded-lg border border-border bg-surface-high/50 px-3 py-2">
              <p className="font-medium text-[10px] text-muted-foreground uppercase tracking-wide">Tools</p>
              {tools.map((t) => (
                <div className="font-mono text-foreground text-xs" key={t.name}>
                  <span
                    className={
                      t.status === "running" ? "text-warning" : t.ok === false ? "text-destructive" : "text-success"
                    }
                  >
                    {t.status === "running" ? "●" : t.ok === false ? "✗" : "✓"}
                  </span>{" "}
                  {t.name}
                  {t.preview ? <span className="ml-2 text-muted-foreground">— {t.preview.slice(0, 120)}</span> : null}
                </div>
              ))}
            </div>
          ) : null}

          {streamingText ? (
            <ChatBubble msg={{ role: "assistant", content: `${streamingText}▍`, toolCalls: undefined }} />
          ) : null}

          {pendingApproval ? (
            <ChatApprovalCard
              busy={approvalMut.isPending}
              onAlways={() =>
                approvalMut.mutate(
                  {
                    request_id: pendingApproval.request_id,
                    action: "always",
                    thread_id: activeThreadId,
                  },
                  { onSuccess: () => setSseApproval(null) }
                )
              }
              onApprove={() =>
                approvalMut.mutate(
                  {
                    request_id: pendingApproval.request_id,
                    action: "approve",
                    thread_id: activeThreadId,
                  },
                  { onSuccess: () => setSseApproval(null) }
                )
              }
              onDeny={() =>
                approvalMut.mutate(
                  {
                    request_id: pendingApproval.request_id,
                    action: "deny",
                    thread_id: activeThreadId,
                  },
                  { onSuccess: () => setSseApproval(null) }
                )
              }
              pending={pendingApproval}
            />
          ) : null}

          {authExt ? (
            <ChatAuthCard
              busy={authTokenMut.isPending || authCancelMut.isPending}
              extensionName={authExt.extension_name}
              instructions={authExt.instructions}
              onCancel={() =>
                authCancelMut.mutate({ extension_name: authExt.extension_name }, { onSuccess: () => setAuthExt(null) })
              }
              onSubmit={(tok) =>
                authTokenMut.mutate(
                  { extension_name: authExt.extension_name, token: tok },
                  { onSuccess: () => setAuthExt(null) }
                )
              }
            />
          ) : null}

          {sendMutation.isPending && !streamingText ? (
            <div className="flex gap-2.5">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-surface-highest">
                <Loader2 className="animate-spin text-muted-foreground" size={14} />
              </div>
              <div className="rounded-2xl rounded-tl-md border border-border bg-surface-high px-3.5 py-2.5 text-muted-foreground text-sm">
                Sending…
              </div>
            </div>
          ) : null}
        </div>

        <div className="border-border border-t bg-surface-high px-6 py-4">
          {stagedImages.length > 0 ? (
            <div className="mb-2 flex flex-wrap gap-2">
              {stagedImages.map((im, i) => (
                <button
                  className="rounded-lg border border-border bg-surface-low px-2 py-1 font-mono text-[10px] text-muted-foreground"
                  key={im.id}
                  onClick={() => setStagedImages((s) => s.filter((x) => x.id !== im.id))}
                  title="Remove"
                  type="button"
                >
                  Image {i + 1} ×
                </button>
              ))}
            </div>
          ) : null}

          {showSlash && input.startsWith("/") ? (
            <div className="mb-2 rounded-lg border border-border bg-surface-low px-2 py-1.5 text-muted-foreground text-xs">
              Slash commands are sent to the agent. Try: {SLASH_HINTS.join(", ")}
            </div>
          ) : null}

          <div className="flex items-end gap-3">
            <input
              accept="image/*"
              className="hidden"
              multiple
              onChange={(e) => {
                readFilesAsImages(e.target.files);
                e.target.value = "";
              }}
              ref={fileRef}
              type="file"
            />
            <button
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border text-muted-foreground transition-colors hover:bg-surface-low disabled:opacity-40"
              disabled={!isConnected || sendMutation.isPending}
              onClick={() => fileRef.current?.click()}
              title="Attach images"
              type="button"
            >
              <ImagePlus size={18} />
            </button>
            <textarea
              className="flex-1 resize-none rounded-xl border border-border bg-surface-low px-4 py-2.5 text-foreground text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
              disabled={!isConnected || sendMutation.isPending}
              onChange={(e) => {
                const v = e.target.value;
                setInput(v);
                setShowSlash(v.startsWith("/"));
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  if (input.trim().startsWith("/") && SLASH_HINTS.some((h) => input.trim() === h)) {
                    e.preventDefault();
                    runSlash(input);
                    return;
                  }
                  handleKeyDown(e);
                }
              }}
              placeholder={isConnected ? "Message, /help, or attach images…" : "Waiting for connection…"}
              rows={1}
              value={input}
            />
            <button
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-on-primary-fixed transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-40"
              disabled={!isConnected || (!input.trim() && stagedImages.length === 0) || sendMutation.isPending}
              onClick={() => {
                if (input.trim().startsWith("/")) {
                  runSlash(input);
                  return;
                }
                handleSend();
              }}
              type="button"
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function IronclawPage() {
  return <IronclawChat />;
}
