import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps, ElementType } from "react";
import { cn } from "@/common/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-1.5 font-medium transition-colors disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-on-primary-fixed hover:bg-primary/90",
        success: "bg-success text-white hover:bg-success/90",
        destructive: "border border-destructive/30 text-destructive hover:bg-destructive-muted",
        outline: "border border-border bg-surface-low text-foreground hover:bg-surface-highest",
        ghost: "text-muted-foreground hover:bg-surface-high hover:text-foreground",
        link: "text-primary underline hover:underline",
      },
      size: {
        sm: "rounded-md px-2.5 py-1.5 text-xs",
        md: "rounded-lg px-3 py-1.5 text-sm",
        lg: "rounded-xl px-4 py-2.5 text-sm",
        icon: "h-8 w-8 rounded-lg",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  }
);

type ButtonProps<T extends ElementType = "button"> = {
  as?: T;
} & VariantProps<typeof buttonVariants> &
  Omit<ComponentProps<T>, "as">;

function Button<T extends ElementType = "button">({ as, variant, size, className, ...props }: ButtonProps<T>) {
  const Comp = as ?? "button";
  return <Comp className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}

export type { ButtonProps };
export { Button, buttonVariants };
