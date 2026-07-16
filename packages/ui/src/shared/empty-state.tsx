import * as React from "react";
import { cn } from "../lib/cn";

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-3 rounded-3xl border border-dashed border-border px-6 py-12 text-center",
        className,
      )}
    >
      {icon && <div className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">{icon}</div>}
      <h3 className="font-display text-lg font-semibold text-foreground">{title}</h3>
      {description && <p className="max-w-sm text-sm text-muted-foreground">{description}</p>}
      {action}
    </div>
  );
}
