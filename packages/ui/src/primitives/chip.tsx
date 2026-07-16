import { Check, X } from "lucide-react";
import * as React from "react";
import { cn } from "../lib/cn";

export interface ChipProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  selected?: boolean;
  onRemove?: () => void;
}

const chipClassName = (selected: boolean, className?: string) =>
  cn(
    "inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-medium transition-colors duration-150",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
    selected
      ? "border-primary bg-primary/15 text-primary"
      : "border-border bg-card text-foreground hover:bg-muted",
    className,
  );

export const Chip = React.forwardRef<HTMLButtonElement, ChipProps>(
  ({ className, selected = false, onRemove, children, ...props }, ref) => {
    if (!onRemove) {
      return (
        <button ref={ref} type="button" aria-pressed={selected} className={chipClassName(selected, className)} {...props}>
          {selected && <Check className="size-3.5" aria-hidden="true" />}
          {children}
        </button>
      );
    }

    return (
      <span className={chipClassName(selected, className)}>
        <button
          ref={ref}
          type="button"
          aria-pressed={selected}
          className="flex items-center gap-1.5 focus-visible:outline-none"
          {...props}
        >
          {selected && <Check className="size-3.5" aria-hidden="true" />}
          {children}
        </button>
        <button
          type="button"
          aria-label="Remove"
          onClick={onRemove}
          className="rounded-full hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <X className="size-3.5" aria-hidden="true" />
        </button>
      </span>
    );
  },
);
Chip.displayName = "Chip";
