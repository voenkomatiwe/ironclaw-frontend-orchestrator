import { Loader2 } from "lucide-react";
import { useEffect, useRef } from "react";
import { Button } from "@/common/components/ui";
import { NearLogo } from "@/common/icons/near-logo";
import type { IronclawMessage, ToolExecution } from "../api-types";
import { ChatBubble } from "./chat-bubble";
import { ChatEmptyState } from "./chat-empty-state";
import { ChatToolCard } from "./chat-tool-card";

function contentKeySnippet(s: string): string {
  let h = 0;
  const cap = Math.min(s.length, 240);
  for (let i = 0; i < cap; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return `${h}`;
}

type ChatMessageListProps = {
  messages: IronclawMessage[];
  streamingText: string;
  thinking: string | null;
  tools: ToolExecution[];
  isConnected: boolean;
  isSending: boolean;
  hasMore: boolean;
  isLoadingOlder: boolean;
  highlightedMessageId?: string | null;
  onLoadOlder: () => void;
  onSelectPrompt: (prompt: string) => void;
};

export function ChatMessageList({
  messages,
  streamingText,
  thinking,
  tools,
  isConnected,
  isSending,
  hasMore,
  isLoadingOlder,
  highlightedMessageId,
  onLoadOlder,
  onSelectPrompt,
}: ChatMessageListProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const userScrolledUp = useRef(false);

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
    userScrolledUp.current = !atBottom;
  };

  // biome-ignore lint/correctness/useExhaustiveDependencies: auto-scroll
  useEffect(() => {
    const el = scrollRef.current;
    if (el && !userScrolledUp.current) {
      el.scrollTop = el.scrollHeight;
    }
  }, [messages.length, streamingText, tools.length, thinking]);

  return (
    <div
      className="flex-1 space-y-4 overflow-y-auto bg-background px-4 py-4 md:px-6"
      onScroll={handleScroll}
      ref={scrollRef}
    >
      {hasMore && (
        <div className="flex justify-center">
          <Button className="shadow-sm" disabled={isLoadingOlder} onClick={onLoadOlder} size="sm" type="button" variant="outline">
            {isLoadingOlder ? "Loading…" : "Load older messages"}
          </Button>
        </div>
      )}

      {messages.length === 0 && isConnected && !streamingText && <ChatEmptyState onSelectPrompt={onSelectPrompt} />}

      {messages.map((msg) => (
        <ChatBubble
          highlighted={Boolean(highlightedMessageId && msg.timestamp && msg.role === "assistant")}
          key={`${msg.role}-${msg.timestamp ?? ""}-${msg.content.length}-${contentKeySnippet(msg.content)}`}
          msg={msg}
        />
      ))}

      {tools.length > 0 && (
        <div className="ml-11 flex flex-col gap-2">
          {tools.map((t) => (
            <ChatToolCard key={t.name} tool={t} />
          ))}
        </div>
      )}

      {thinking && !streamingText && (
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary-darker">
            <NearLogo className="h-3.5 w-3.5" fill="white" />
          </div>
          <div className="flex items-center gap-2 rounded-2xl rounded-tl-sm border border-border bg-surface-low px-4 py-3 shadow-sm">
            <div className="flex gap-1">
              <div className="h-2 w-2 animate-pulse rounded-full bg-muted-foreground" />
              <div className="h-2 w-2 animate-pulse rounded-full bg-muted-foreground [animation-delay:0.2s]" />
              <div className="h-2 w-2 animate-pulse rounded-full bg-muted-foreground [animation-delay:0.4s]" />
            </div>
            <span className="text-muted-foreground text-xs">{thinking}</span>
          </div>
        </div>
      )}

      {streamingText && (
        <ChatBubble
          msg={{
            role: "assistant",
            content: `${streamingText}▍`,
            toolCalls: undefined,
          }}
        />
      )}

      {isSending && !streamingText && !thinking && (
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface-highest">
            <Loader2 className="animate-spin text-muted-foreground" size={14} />
          </div>
          <div className="rounded-2xl rounded-tl-sm border border-border bg-surface-low px-4 py-3 text-muted-foreground text-sm shadow-sm">
            Sending…
          </div>
        </div>
      )}
    </div>
  );
}
