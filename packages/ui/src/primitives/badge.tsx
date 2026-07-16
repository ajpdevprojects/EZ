import { type VariantProps, cva } from "class-variance-authority";
import * as React from "react";
import { cn } from "../lib/cn";

export const badgeVariants = cva(
  "inline-flex items-center rounded-full px-3 py-1 text-xs font-medium whitespace-nowrap",
  {
    variants: {
      variant: {
        neutral: "bg-muted text-muted-foreground",
        new: "bg-success/15 text-success",
        recommended: "bg-info/15 text-info",
        applied: "bg-accent/20 text-accent-foreground",
        interview: "bg-violet-400/15 text-violet-300",
        offer: "bg-primary/20 text-primary",
        success: "bg-success/15 text-success",
        warning: "bg-warning/15 text-warning",
        error: "bg-destructive/15 text-destructive",
      },
    },
    defaultVariants: {
      variant: "neutral",
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant, className }))} {...props} />;
}
