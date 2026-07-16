"use client";

import * as ToastPrimitive from "@radix-ui/react-toast";
import { AlertCircle, CheckCircle2, Info } from "lucide-react";
import * as React from "react";
import { cn } from "../lib/cn";
import { type ToastVariant, useToastStore } from "./toast-store";

const VARIANT_ICON: Record<ToastVariant, React.ReactNode> = {
  default: <Info className="size-5 text-info" aria-hidden="true" />,
  success: <CheckCircle2 className="size-5 text-success" aria-hidden="true" />,
  warning: <AlertCircle className="size-5 text-warning" aria-hidden="true" />,
  error: <AlertCircle className="size-5 text-destructive" aria-hidden="true" />,
};

export function Toaster() {
  const toasts = useToastStore((state) => state.toasts);
  const dismiss = useToastStore((state) => state.dismiss);

  return (
    <ToastPrimitive.Provider swipeDirection="right">
      {toasts.map((item) => (
        <ToastPrimitive.Root
          key={item.id}
          duration={5000}
          onOpenChange={(open) => {
            if (!open) dismiss(item.id);
          }}
          className={cn(
            "flex items-start gap-3 rounded-2xl border border-border bg-card p-4 shadow-lg",
            "data-[state=open]:animate-in data-[state=open]:slide-in-from-bottom-4",
            "data-[state=closed]:animate-out data-[state=closed]:fade-out-0",
            "data-[swipe=end]:animate-out",
          )}
        >
          {VARIANT_ICON[item.variant ?? "default"]}
          <div className="flex flex-col gap-0.5">
            <ToastPrimitive.Title className="text-sm font-medium text-foreground">
              {item.title}
            </ToastPrimitive.Title>
            {item.description && (
              <ToastPrimitive.Description className="text-sm text-muted-foreground">
                {item.description}
              </ToastPrimitive.Description>
            )}
          </div>
        </ToastPrimitive.Root>
      ))}
      <ToastPrimitive.Viewport className="fixed bottom-0 right-0 z-[100] flex w-full max-w-sm flex-col gap-2 p-4 sm:bottom-4 sm:right-4" />
    </ToastPrimitive.Provider>
  );
}
