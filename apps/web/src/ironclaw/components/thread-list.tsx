import { MessageSquare, Plus } from "lucide-react";
import { cn } from "@/common/lib/utils";
import type { IronclawThread } from "../api-types";

type ThreadListProps = {
  threads: IronclawThread[];
  activeId?: string;
  onSelect: (id: string) => void;
  onCreate: () => void;
  isCreating: boolean;
};

export function ThreadList({ threads, activeId, onSelect, onCreate, isCreating }: ThreadListProps) {
  return (
    <div className="flex w-56 shrink-0 flex-col border-border border-r bg-surface-low">
      <div className="flex items-center justify-between border-border border-b p-3">
        <span className="font-semibold text-muted-foreground text-xs uppercase tracking-wider">Threads</span>
        <button
          className="rounded p-1 text-muted-foreground transition-colors hover:bg-surface-high hover:text-foreground disabled:opacity-50"
          disabled={isCreating}
          onClick={onCreate}
          title="New thread"
          type="button"
        >
          <Plus size={14} />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto">
        {threads.length === 0 && <p className="p-3 text-muted-foreground text-xs">No threads yet</p>}
        {threads.map((t) => (
          <button
            className={cn(
              "w-full border-border/40 border-b px-3 py-2.5 text-left text-sm transition-colors",
              activeId === t.id
                ? "bg-green-100 font-medium text-green-700"
                : "text-muted-foreground hover:bg-surface-high"
            )}
            key={t.id}
            onClick={() => onSelect(t.id)}
            type="button"
          >
            <div className="flex items-center gap-2">
              <MessageSquare className="shrink-0" size={12} />
              <span className="truncate">{t.title ?? `Thread ${t.id.slice(0, 8)}`}</span>
            </div>
            {t.turn_count !== undefined && (
              <span className="ml-5 text-[10px] text-muted-foreground">{t.turn_count} turns</span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
