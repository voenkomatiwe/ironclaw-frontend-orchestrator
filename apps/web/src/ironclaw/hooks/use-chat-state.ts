import { useCallback, useState } from "react";
import type { IronclawPendingApproval, IronclawSsePayload, ToolExecution } from "../api-types";

function normId(a?: string | null, b?: string | null): boolean {
  if (!a || !b) return false;
  return a.replace(/-/g, "").toLowerCase() === b.replace(/-/g, "").toLowerCase();
}

function payloadThreadMatch(payload: IronclawSsePayload, threadId?: string): boolean {
  const tid = payload.thread_id;
  if (!tid) return true;
  return normId(tid, threadId);
}

type ChatStateReturn = {
  streamingText: string;
  thinking: string | null;
  tools: ToolExecution[];
  sseApproval: IronclawPendingApproval | null;
  authExt: { extension_name: string; instructions?: string } | null;
  sseFresh: boolean;
  highlightedMessageId: string | null;
  handleSseEvent: (raw: { event: string; payload: IronclawSsePayload }) => void;
  resetState: () => void;
  clearApproval: () => void;
  clearAuth: () => void;
};

export function useChatState(activeThreadId: string | undefined, onResponse: () => void): ChatStateReturn {
  const [streamingText, setStreamingText] = useState("");
  const [thinking, setThinking] = useState<string | null>(null);
  const [tools, setTools] = useState<ToolExecution[]>([]);
  const [sseApproval, setSseApproval] = useState<IronclawPendingApproval | null>(null);
  const [authExt, setAuthExt] = useState<{
    extension_name: string;
    instructions?: string;
  } | null>(null);
  const [sseFresh, setSseFresh] = useState(false);
  const [highlightedMessageId, setHighlightedMessageId] = useState<string | null>(null);

  const resetState = useCallback(() => {
    setStreamingText("");
    setThinking(null);
    setTools([]);
    setSseFresh(false);
    setSseApproval(null);
    setAuthExt(null);
    setHighlightedMessageId(null);
  }, []);

  const clearApproval = useCallback(() => {
    setSseApproval(null);
    setHighlightedMessageId(null);
  }, []);

  const clearAuth = useCallback(() => {
    setAuthExt(null);
  }, []);

  const handleSseEvent = useCallback(
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
        onResponse();
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
            x.name === name
              ? {
                  ...x,
                  status: "done" as const,
                  ok: Boolean(p.success),
                  preview: x.preview,
                }
              : x
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
          setHighlightedMessageId(p.thread_id ?? activeThreadId ?? null);
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
    [activeThreadId, onResponse]
  );

  return {
    streamingText,
    thinking,
    tools,
    sseApproval,
    authExt,
    sseFresh,
    highlightedMessageId,
    handleSseEvent,
    resetState,
    clearApproval,
    clearAuth,
  };
}
