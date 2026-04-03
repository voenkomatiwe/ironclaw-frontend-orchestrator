import { Bot, User, Wrench } from "lucide-react";
import { cn } from "@/common/lib/utils";
import type { IronclawMessage } from "../api-types";

type ChatBubbleProps = {
  msg: IronclawMessage;
};

export function ChatBubble({ msg }: ChatBubbleProps) {
  const isUser = msg.role === "user";

  return (
    <div className={cn("flex gap-2.5", isUser && "flex-row-reverse")}>
      <div
        className={cn(
          "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full",
          isUser ? "bg-primary" : "bg-surface-highest"
        )}
      >
        {isUser ? (
          <User className="text-on-primary-fixed" size={14} />
        ) : (
          <Bot className="text-muted-foreground" size={14} />
        )}
      </div>
      <div className={cn("flex max-w-[75%] flex-col gap-1.5", isUser ? "items-end" : "items-start")}>
        <div
          className={cn(
            "whitespace-pre-wrap rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed",
            isUser
              ? "rounded-tr-md bg-primary text-on-primary-fixed"
              : "rounded-tl-md border border-border bg-surface-low text-foreground"
          )}
        >
          {msg.content}
        </div>
        {msg.toolCalls && msg.toolCalls.length > 0 && (
          <div className="flex flex-wrap gap-1 px-1">
            {msg.toolCalls.map((tc) => (
              <span
                className={cn(
                  "inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-medium text-[10px]",
                  tc.has_error ? "bg-destructive-muted text-destructive" : "bg-primary-container text-primary"
                )}
                key={`${tc.name}-${tc.has_result}-${tc.result_preview ?? ""}`}
              >
                <Wrench size={9} />
                {tc.name}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
