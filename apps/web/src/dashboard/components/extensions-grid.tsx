import { Plus } from "lucide-react";
import { useNavigate } from "react-router";
import { ExtensionBrandAvatar } from "@/common/components/extension-brand-avatar";
import { cn } from "@/common/lib/utils";
import { extensionKindBadgeClass } from "@/extensions/lib/extension-kind-styles";
import { useExtensions } from "@/extensions/queries";

export function ExtensionsGrid() {
  const navigate = useNavigate();
  const { data: extensions, isLoading } = useExtensions();

  const active = (extensions ?? []).filter((e) => e.active);

  if (isLoading) {
    return (
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-sm font-semibold text-foreground">Active Extensions</h2>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              className="h-16 animate-pulse rounded-xl bg-surface-low"
              key={i}
            />
          ))}
        </div>
      </section>
    );
  }

  if (active.length === 0) {
    return (
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-sm font-semibold text-foreground">Active Extensions</h2>
        </div>
        <button
          className="w-full rounded-xl border border-dashed border-border p-4 text-center text-sm text-muted-foreground transition-colors hover:border-primary/30 hover:text-foreground"
          onClick={() => navigate("/extensions")}
          type="button"
        >
          No extensions yet — Browse marketplace
        </button>
      </section>
    );
  }

  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-display text-sm font-semibold text-foreground">Active Extensions</h2>
        <button
          className="text-xs text-primary hover:underline"
          onClick={() => navigate("/extensions")}
          type="button"
        >
          See all →
        </button>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {active.map((ext) => (
          <div
            className={cn(
              "flex items-center gap-2.5 rounded-xl bg-surface-low p-3",
              "border border-transparent transition-colors",
              "hover:border-border cursor-pointer"
            )}
            key={ext.name}
            onClick={() => navigate(`/addons/${ext.name}/manage`)}
          >
            <ExtensionBrandAvatar
              className="!size-8 !rounded-lg"
              description={ext.description}
              displayName={ext.display_name}
              iconSize={16}
              name={ext.name}
            />
            <div className="min-w-0 flex-1">
              <div className="truncate text-xs font-medium text-foreground">
                {ext.display_name || ext.name}
              </div>
              <span className={cn("inline-block rounded-full px-1.5 py-0.5 text-[10px] leading-none", extensionKindBadgeClass(ext.kind))}>
                {ext.kind.replace("_", " ")}
              </span>
            </div>
            <div className="h-1.5 w-1.5 shrink-0 rounded-full bg-success" />
          </div>
        ))}
        <button
          className={cn(
            "flex items-center justify-center gap-1.5 rounded-xl p-3",
            "border border-dashed border-border text-xs text-muted-foreground",
            "transition-colors hover:border-primary/30 hover:text-foreground"
          )}
          onClick={() => navigate("/extensions")}
          type="button"
        >
          <Plus size={14} />
          Add more
        </button>
      </div>
    </section>
  );
}
