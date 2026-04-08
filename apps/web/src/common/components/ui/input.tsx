import type { ComponentProps } from "react";
import { cn } from "@/common/lib/utils";

type InputProps = ComponentProps<"input">;

function Input({ className, ...props }: InputProps) {
  return (
    <input
      className={cn(
        "rounded-lg border border-border bg-surface-low px-3 py-2 text-foreground text-sm outline-none placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary disabled:opacity-50",
        className
      )}
      {...props}
    />
  );
}

export type { InputProps };
export { Input };
