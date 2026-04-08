import { useEffect, useState } from "react";
import { cn } from "@/common/lib/utils";

const COMMANDS = [
  { command: "/help", description: "Show available commands" },
  { command: "/status", description: "Check gateway status" },
  { command: "/clear", description: "Clear conversation" },
  { command: "/compact", description: "Compact conversation" },
  { command: "/interrupt", description: "Interrupt current task" },
  { command: "/thread new", description: "Create a new thread" },
];

type SlashCommandMenuProps = {
  filter: string;
  onSelect: (command: string) => void;
  onClose: () => void;
};

export function SlashCommandMenu({ filter, onSelect, onClose }: SlashCommandMenuProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  const filtered = COMMANDS.filter((c) => c.command.startsWith(filter.toLowerCase()));

  useEffect(() => {
    setActiveIndex(0);
  }, [filter]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIndex((i) => (i + 1) % filtered.length);
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIndex((i) => (i - 1 + filtered.length) % filtered.length);
        return;
      }
      if (e.key === "Enter" && filtered.length > 0) {
        e.preventDefault();
        onSelect(filtered[activeIndex]!.command);
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [filtered, activeIndex, onSelect, onClose]);

  if (filtered.length === 0) return null;

  return (
    <div className="absolute right-4 bottom-full left-4 mb-2 overflow-hidden rounded-xl border border-border bg-surface-low shadow-lg md:right-6 md:left-6">
      <div className="p-1.5">
        {filtered.map((cmd, i) => (
          <button
            className={cn(
              "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors",
              i === activeIndex ? "bg-primary-container" : "hover:bg-surface-high"
            )}
            key={cmd.command}
            onClick={() => onSelect(cmd.command)}
            onMouseEnter={() => setActiveIndex(i)}
            type="button"
          >
            <span className="font-semibold text-primary text-sm">{cmd.command}</span>
            <span className="text-muted-foreground text-sm">{cmd.description}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
