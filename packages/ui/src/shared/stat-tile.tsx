import * as React from "react";
import { cn } from "../lib/cn";

export interface StatTileProps {
  label: string;
  value: React.ReactNode;
  className?: string;
}

export function StatTile({ label, value, className }: StatTileProps) {
  return (
    <div className={cn("flex flex-1 flex-col gap-1 rounded-2xl border border-border bg-card px-4 py-3", className)}>
      <span className="font-display text-2xl font-semibold text-foreground">{value}</span>
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  );
}
