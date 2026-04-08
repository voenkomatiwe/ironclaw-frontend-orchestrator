import { Briefcase, Database, Plus, Puzzle, Send } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router";
import { cn } from "@/common/lib/utils";

type GreetingSectionProps = {
  onSend: (text: string) => void;
  isSending: boolean;
  isDisconnected: boolean;
  inputRef: React.RefObject<HTMLInputElement | null>;
};

const QUICK_ACTIONS = [
  { label: "New thread", Icon: Plus, to: "/ironclaw" },
  { label: "Extensions", Icon: Puzzle, to: "/extensions" },
  { label: "Jobs", Icon: Briefcase, to: "/jobs" },
  { label: "Memory", Icon: Database, to: "/memory" },
] as const;

export function GreetingSection({ onSend, isSending, isDisconnected, inputRef }: GreetingSectionProps) {
  const [input, setInput] = useState("");
  const navigate = useNavigate();

  const handleSubmit = () => {
    const text = input.trim();
    if (!text || isSending) return;
    onSend(text);
    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSubmit();
    }
  };

  const hasContent = input.trim().length > 0;

  return (
    <div className="flex flex-col items-center">
      <h1 className="mb-4 font-display text-2xl font-bold text-foreground tracking-tight">
        What can I help you with?
      </h1>

      <div className="relative mb-4 w-full max-w-lg">
        <input
          className={cn(
            "w-full rounded-full border border-border bg-surface-low",
            "py-3 pr-12 pl-5 text-sm text-foreground",
            "placeholder:text-muted-foreground",
            "focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-ring/20",
            "disabled:opacity-50"
          )}
          disabled={isSending || isDisconnected}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={isDisconnected ? "Waiting for gateway..." : "Ask IronClaw anything..."}
          ref={inputRef}
          type="text"
          value={input}
        />
        <button
          className={cn(
            "absolute top-1/2 right-2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full transition-colors",
            hasContent
              ? "bg-primary text-on-primary-fixed shadow-sm shadow-primary/30 hover:bg-primary/90"
              : "bg-surface-highest text-muted-foreground"
          )}
          disabled={!hasContent || isSending}
          onClick={handleSubmit}
          type="button"
        >
          <Send size={14} />
        </button>
      </div>

      <div className="flex flex-wrap justify-center gap-2">
        {QUICK_ACTIONS.map(({ label, Icon, to }) => (
          <button
            className={cn(
              "flex items-center gap-1.5 rounded-full",
              "bg-surface-low px-4 py-2 text-xs text-muted-foreground",
              "border border-transparent transition-colors",
              "hover:border-border hover:text-foreground"
            )}
            key={to}
            onClick={() => navigate(to)}
            type="button"
          >
            <Icon size={14} />
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
