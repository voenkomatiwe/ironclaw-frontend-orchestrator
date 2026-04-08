import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";
import { cn } from "@/common/lib/utils";

const badgeVariants = cva("inline-flex items-center rounded-full px-2 py-0.5 font-medium text-[10px]", {
  variants: {
    variant: {
      default: "bg-surface-highest text-muted-foreground",
      primary: "bg-primary-container text-primary",
      success: "bg-success-muted text-success",
      destructive: "bg-destructive-muted text-destructive",
      warning: "bg-warning-muted text-warning",
      outline: "border border-border text-muted-foreground",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

type BadgeProps = ComponentProps<"span"> & VariantProps<typeof badgeVariants>;

function Badge({ variant, className, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export type { BadgeProps };
export { Badge, badgeVariants };
