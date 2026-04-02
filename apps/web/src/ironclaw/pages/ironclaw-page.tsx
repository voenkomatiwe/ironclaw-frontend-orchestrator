import { AlertCircle, Bot, Loader2, Send } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { IronclawMessage, IronclawThread, IronclawTurn } from "../api-types";
import { ChatBubble } from "../components/chat-bubble";
import { ThreadList } from "../components/thread-list";
import {
  useIronclawCreateThread,
  useIronclawHistory,
  useIronclawSendMessage,
  useIronclawStatus,
  useIronclawThreads,
} from "../queries";

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

export function IronclawChat() {
  const { data: status, isLoading: statusLoading } = useIronclawStatus();
  const { data: threadsData } = useIronclawThreads();
  const [activeThreadId, setActiveThreadId] = useState<string | undefined>();
  const { data: history } = useIronclawHistory(activeThreadId);
  const sendMutation = useIronclawSendMessage();
  const createThread = useIronclawCreateThread();
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const allThreads: IronclawThread[] = useMemo(() => {
    if (!threadsData) return [];
    const list: IronclawThread[] = [];
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

  const messages: IronclawMessage[] = useMemo(() => (history?.turns ? turnsToMessages(history.turns) : []), [history]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = () => {
    const text = input.trim();
    if (!text || sendMutation.isPending) return;
    setInput("");
    sendMutation.mutate({ content: text, thread_id: activeThreadId });
  };

  const handleCreateThread = () => {
    createThread.mutate(undefined, {
      onSuccess: (newThread) => setActiveThreadId(newThread.id),
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const isConnected = status?.connected === true;

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
              {statusLoading ? "Checking connection…" : isConnected ? "Connected to IronClaw Gateway" : "Disconnected"}
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
            {status?.error ?? "Cannot reach IronClaw Gateway. Check IRONCLAW_TOKEN and IRONCLAW_GATEWAY_URL."}
          </div>
        )}

        <div className="flex-1 space-y-4 overflow-y-auto bg-background px-6 py-4" ref={scrollRef}>
          {messages.length === 0 && isConnected && (
            <div className="flex h-full flex-col items-center justify-center text-muted-foreground">
              <Bot className="mb-3 text-muted-foreground/40" size={40} />
              <p className="text-sm">Send a message to start chatting with IronClaw</p>
            </div>
          )}
          {messages.map((msg, i) => (
            <ChatBubble key={i} msg={msg} />
          ))}
          {sendMutation.isPending && (
            <div className="flex gap-2.5">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-surface-highest">
                <Loader2 className="animate-spin text-muted-foreground" size={14} />
              </div>
              <div className="rounded-2xl rounded-tl-md border border-border bg-surface-high px-3.5 py-2.5 text-muted-foreground text-sm">
                Thinking…
              </div>
            </div>
          )}
        </div>

        <div className="border-border border-t bg-surface-high px-6 py-4">
          <div className="flex items-end gap-3">
            <textarea
              className="flex-1 resize-none rounded-xl border border-border bg-surface-low px-4 py-2.5 text-foreground text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
              disabled={!isConnected || sendMutation.isPending}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={isConnected ? "Type a message…" : "Waiting for connection…"}
              rows={1}
              value={input}
            />
            <button
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-on-primary-fixed transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-40"
              disabled={!isConnected || !input.trim() || sendMutation.isPending}
              onClick={handleSend}
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
