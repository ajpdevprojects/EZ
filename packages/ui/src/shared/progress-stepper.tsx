import { Check } from "lucide-react";
import * as React from "react";
import { cn } from "../lib/cn";

export interface ProgressStepperProps {
  steps: string[];
  currentStep: number;
  className?: string;
}

export function ProgressStepper({ steps, currentStep, className }: ProgressStepperProps) {
  return (
    <ol className={cn("flex items-center", className)} aria-label="Progress">
      {steps.map((step, index) => {
        const stepNumber = index + 1;
        const isComplete = stepNumber < currentStep;
        const isCurrent = stepNumber === currentStep;

        return (
          <li key={step} className="flex flex-1 items-center last:flex-none">
            <div className="flex flex-col items-center gap-2">
              <span
                aria-current={isCurrent ? "step" : undefined}
                className={cn(
                  "flex size-8 items-center justify-center rounded-full text-sm font-medium transition-colors duration-150",
                  isComplete && "bg-foreground text-background",
                  isCurrent && "bg-primary text-primary-foreground",
                  !isComplete && !isCurrent && "bg-muted text-muted-foreground",
                )}
              >
                {isComplete ? <Check className="size-4" aria-hidden="true" /> : stepNumber}
              </span>
              <span className="text-xs text-muted-foreground">{step}</span>
            </div>
            {stepNumber !== steps.length && (
              <span className={cn("mx-2 h-px flex-1", isComplete ? "bg-foreground" : "bg-border")} />
            )}
          </li>
        );
      })}
    </ol>
  );
}
