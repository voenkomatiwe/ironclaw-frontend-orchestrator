import { User, Wrench } from "lucide-react";
import type { ReactNode } from "react";
import { Badge } from "@/common/components/ui";
import { NearLogo } from "@/common/icons/near-logo";
import { cn } from "@/common/lib/utils";
import type { IronclawMessage } from "../api-types";

function renderInline(text: string): ReactNode[] {
  const parts: ReactNode[] = [];
  const regex = /(`[^`]+`)|(\*\*[^*]+\*\*)|(\*[^*]+\*)|(\[[^\]]+\]\([^)]+\))/g;
  let lastIndex = 0;

  for (const match of text.matchAll(regex)) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }

    const m = match[0];
    if (m.startsWith("`")) {
      parts.push(
        <code className="rounded bg-surface-high px-1.5 py-0.5 font-mono text-xs" key={`ic-${parts.length}`}>
          {m.slice(1, -1)}
        </code>
      );
    } else if (m.startsWith("**")) {
      parts.push(<strong key={`b-${parts.length}`}>{m.slice(2, -2)}</strong>);
    } else if (m.startsWith("*")) {
      parts.push(<em key={`i-${parts.length}`}>{m.slice(1, -1)}</em>);
    } else if (m.startsWith("[")) {
      const linkMatch = /\[([^\]]+)\]\(([^)]+)\)/.exec(m);
      if (linkMatch) {
        parts.push(
          <a
            className="text-primary underline"
            href={linkMatch[2]}
            key={`a-${parts.length}`}
            rel="noopener noreferrer"
            target="_blank"
          >
            {linkMatch[1]}
          </a>
        );
      }
    }

    lastIndex = match.index + m.length;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts;
}

function renderMarkdown(text: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  const lines = text.split("\n");
  let i = 0;

  while (i < lines.length) {
    const line = lines[i]!;

    if (line.startsWith("```")) {
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i]!.startsWith("```")) {
        codeLines.push(lines[i]!);
        i++;
      }
      i++;
      nodes.push(
        <pre
          className="my-2 overflow-x-auto rounded-lg bg-surface-highest p-3 font-mono text-xs leading-relaxed"
          key={`code-${nodes.length}`}
        >
          <code>{codeLines.join("\n")}</code>
        </pre>
      );
      continue;
    }

    if (line.trim() === "") {
      nodes.push(<br key={`br-${nodes.length}`} />);
      i++;
      continue;
    }

    if (/^[-*]\s/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^[-*]\s/.test(lines[i]!)) {
        items.push(lines[i]!.replace(/^[-*]\s/, ""));
        i++;
      }
      nodes.push(
        <ul className="my-1 list-disc pl-4" key={`ul-${nodes.length}`}>
          {items.map((item) => (
            <li key={item}>{renderInline(item)}</li>
          ))}
        </ul>
      );
      continue;
    }

    if (/^\d+\.\s/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\.\s/.test(lines[i]!)) {
        items.push(lines[i]!.replace(/^\d+\.\s/, ""));
        i++;
      }
      nodes.push(
        <ol className="my-1 list-decimal pl-4" key={`ol-${nodes.length}`}>
          {items.map((item) => (
            <li key={item}>{renderInline(item)}</li>
          ))}
        </ol>
      );
      continue;
    }

    nodes.push(
      <span key={`line-${nodes.length}`}>
        {renderInline(line)}
        {i < lines.length - 1 && "\n"}
      </span>
    );
    i++;
  }

  return nodes;
}

type ChatBubbleProps = {
  msg: IronclawMessage;
  highlighted?: boolean;
};

export function ChatBubble({ msg, highlighted }: ChatBubbleProps) {
  const isUser = msg.role === "user";

  return (
    <div
      className={cn(
        "flex gap-3",
        isUser && "flex-row-reverse",
        highlighted && "animate-pulse rounded-2xl ring-2 ring-warning/40"
      )}
    >
      <div
        className={cn(
          "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
          isUser ? "bg-surface-highest" : "bg-gradient-to-br from-primary to-primary-darker"
        )}
      >
        {isUser ? (
          <User className="text-muted-foreground" size={14} />
        ) : (
          <NearLogo className="h-3.5 w-3.5" fill="white" />
        )}
      </div>

      <div className={cn("flex max-w-[75%] flex-col gap-2", isUser ? "items-end" : "items-start")}>
        <div
          className={cn(
            "whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm leading-relaxed",
            isUser
              ? "rounded-tr-sm bg-primary text-on-primary-fixed shadow-primary/20 shadow-sm"
              : "rounded-tl-sm border border-border bg-surface-low text-foreground shadow-sm"
          )}
        >
          {isUser ? msg.content : renderMarkdown(msg.content)}
        </div>

        {msg.toolCalls && msg.toolCalls.length > 0 && (
          <div className="flex flex-wrap gap-1.5 px-1">
            {msg.toolCalls.map((tc) => (
              <Badge
                key={`${tc.name}-${tc.has_result}-${tc.result_preview ?? ""}`}
                variant={tc.has_error ? "destructive" : "primary"}
              >
                <Wrench size={9} />
                {tc.name}
              </Badge>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
