import * as React from "react";
import { cn } from "../../lib/utils";

export type ProgressProps = React.HTMLAttributes<HTMLDivElement> & {
  value?: number | null;
};

const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(({ className, value, ...props }, ref) => (
  <div className={cn("relative h-2 w-full overflow-hidden rounded-full bg-secondary", className)} ref={ref} {...props}>
    <div className="h-full bg-primary transition-all" style={{ width: `${Math.min(100, Math.max(0, value ?? 0))}%` }} />
  </div>
));
Progress.displayName = "Progress";

export { Progress };
