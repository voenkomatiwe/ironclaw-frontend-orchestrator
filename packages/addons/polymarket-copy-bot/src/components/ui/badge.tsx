import type * as React from "react";
import { cn } from "../../lib/utils";

const variantClasses: Record<string, string> = {
  default: "border-transparent bg-primary text-primary-foreground",
  secondary: "border-transparent bg-secondary text-secondary-foreground",
  destructive: "border-transparent bg-destructive text-destructive-foreground",
  outline: "text-foreground",
  success: "border-transparent bg-green-600/20 text-green-400",
  warning: "border-transparent bg-yellow-600/20 text-yellow-400",
};

export type BadgeProps = React.HTMLAttributes<HTMLDivElement> & {
  variant?: keyof typeof variantClasses;
};

function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 font-semibold text-xs transition-colors",
        variantClasses[variant],
        className
      )}
      {...props}
    />
  );
}

export { Badge };
