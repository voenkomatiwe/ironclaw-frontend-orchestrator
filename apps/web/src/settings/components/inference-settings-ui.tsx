import type { ReactNode } from "react";
import { cn } from "@/common/lib/utils";

export function InferenceSection({
  title,
  children,
  className,
}: {
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("mb-4 rounded-xl border border-border bg-surface-high p-4", className)}>
      <h2 className="mb-3 border-border border-b pb-2 font-semibold text-[11px] text-muted-foreground uppercase tracking-wider">
        {title}
      </h2>
      <div className="divide-y divide-border/50">{children}</div>
    </section>
  );
}

export function InferenceRow({
  label,
  description,
  children,
}: {
  label: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
      <div className="min-w-0 sm:max-w-[min(56%,28rem)]">
        <div className="font-medium text-foreground text-sm">{label}</div>
        {description ? <p className="mt-0.5 text-muted-foreground text-xs leading-relaxed">{description}</p> : null}
      </div>
      <div className="flex shrink-0 items-center justify-end sm:min-w-[min(100%,240px)]">{children}</div>
    </div>
  );
}

export const inferenceControlClass =
  "w-full min-w-[200px] max-w-[280px] rounded-lg border border-border bg-surface-low px-3 py-2 font-mono text-foreground text-sm outline-none transition-colors focus-visible:border-primary focus-visible:ring-1 focus-visible:ring-primary";

export const inferenceSelectClass = cn(inferenceControlClass, "cursor-pointer");
