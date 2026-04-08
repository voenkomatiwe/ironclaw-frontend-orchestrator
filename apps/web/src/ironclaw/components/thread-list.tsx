import { MessageSquare, Plus, X } from "lucide-react";
import { cn } from "@/common/lib/utils";
import type { IronclawThread } from "../api-types";

type ThreadListProps = {
  threads: IronclawThread[];
  activeId?: string;
  onSelect: (id: string) => void;
  onCreate: () => void;
  isCreating: boolean;
  drawerOpen?: boolean;
  onCloseDrawer?: () => void;
};

function ThreadListContent({ threads, activeId, onSelect, onCreate, isCreating, onCloseDrawer }: ThreadListProps) {
  return (
    <div className="flex h-full flex-col bg-surface-low">
      <div className="flex items-center justify-between border-border border-b px-4 py-3">
        <span className="font-semibold text-muted-foreground text-xs uppercase tracking-wider">Threads</span>
        <div className="flex items-center gap-2">
          <button
            className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-on-primary-fixed transition-colors hover:bg-primary/90 disabled:opacity-50"
            disabled={isCreating}
            onClick={onCreate}
            title="New thread"
            type="button"
          >
            <Plus size={14} />
          </button>
          {onCloseDrawer && (
            <button
              className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-surface-high md:hidden"
              onClick={onCloseDrawer}
              type="button"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {threads.length === 0 && <p className="p-3 text-center text-muted-foreground text-xs">No threads yet</p>}
        <div className="flex flex-col gap-1">
          {threads.map((t) => (
            <button
              className={cn(
                "w-full rounded-xl px-3 py-2.5 text-left text-sm transition-colors",
                activeId === t.id
                  ? "border-primary border-l-2 bg-primary-container font-medium text-primary"
                  : "text-muted-foreground hover:bg-surface-high"
              )}
              key={t.id}
              onClick={() => {
                onSelect(t.id);
                onCloseDrawer?.();
              }}
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
    </div>
  );
}

export function ThreadList(props: ThreadListProps) {
  const { drawerOpen, onCloseDrawer } = props;

  return (
    <>
      {/* Desktop sidebar */}
      <div className="hidden w-60 shrink-0 border-border border-r md:block">
        <ThreadListContent {...props} />
      </div>

      {/* Mobile drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-black/30"
            onClick={onCloseDrawer}
            onKeyDown={() => {}}
            role="presentation"
          />
          <div className="absolute inset-y-0 left-0 w-72 shadow-xl">
            <ThreadListContent {...props} />
          </div>
        </div>
      )}
    </>
  );
}
