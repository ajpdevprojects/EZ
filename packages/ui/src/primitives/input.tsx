import * as React from "react";
import { cn } from "../lib/cn";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  leadingIcon?: React.ReactNode;
  trailingIcon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, leadingIcon, trailingIcon, ...props }, ref) => {
    if (!leadingIcon && !trailingIcon) {
      return (
        <input
          type={type}
          ref={ref}
          className={cn(
            "flex h-12 w-full rounded-2xl border border-input bg-card px-4 text-sm text-foreground",
            "placeholder:text-muted-foreground transition-colors duration-150",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:border-ring",
            "disabled:cursor-not-allowed disabled:opacity-50",
            className,
          )}
          {...props}
        />
      );
    }

    return (
      <div className="relative flex items-center">
        {leadingIcon && (
          <span className="pointer-events-none absolute left-4 flex items-center text-muted-foreground">
            {leadingIcon}
          </span>
        )}
        <input
          type={type}
          ref={ref}
          className={cn(
            "flex h-12 w-full rounded-2xl border border-input bg-card text-sm text-foreground",
            "placeholder:text-muted-foreground transition-colors duration-150",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:border-ring",
            "disabled:cursor-not-allowed disabled:opacity-50",
            leadingIcon ? "pl-11" : "pl-4",
            trailingIcon ? "pr-11" : "pr-4",
            className,
          )}
          {...props}
        />
        {trailingIcon && (
          <span className="absolute right-4 flex items-center text-muted-foreground">
            {trailingIcon}
          </span>
        )}
      </div>
    );
  },
);
Input.displayName = "Input";

export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        "flex min-h-24 w-full rounded-2xl border border-input bg-card px-4 py-3 text-sm text-foreground",
        "placeholder:text-muted-foreground transition-colors duration-150",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:border-ring",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  ),
);
Textarea.displayName = "Textarea";
