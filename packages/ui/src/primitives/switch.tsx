import * as SwitchPrimitive from "@radix-ui/react-switch";
import * as React from "react";
import { cn } from "../lib/cn";

export const Switch = React.forwardRef<
  React.ComponentRef<typeof SwitchPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SwitchPrimitive.Root>
>(({ className, ...props }, ref) => (
  <SwitchPrimitive.Root
    ref={ref}
    className={cn(
      "peer inline-flex h-7 w-12 shrink-0 items-center rounded-full border border-transparent transition-colors duration-150",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
      "data-[state=checked]:bg-primary data-[state=unchecked]:bg-muted",
      "disabled:cursor-not-allowed disabled:opacity-50",
      className,
    )}
    {...props}
  >
    <SwitchPrimitive.Thumb
      className={cn(
        "pointer-events-none block size-5 translate-x-1 rounded-full bg-soft-ivory shadow-sm transition-transform duration-150",
        "data-[state=checked]:translate-x-6",
      )}
    />
  </SwitchPrimitive.Root>
));
Switch.displayName = "Switch";
