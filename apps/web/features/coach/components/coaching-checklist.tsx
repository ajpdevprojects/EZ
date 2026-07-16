import type { CoachingChecklistItem } from "@/features/coach/data";
import { Card, CardContent } from "@ez/ui";
import { CheckCircle2, Circle } from "lucide-react";
import Link from "next/link";

export function CoachingChecklist({ items }: { items: CoachingChecklistItem[] }) {
  return (
    <Card>
      <CardContent className="flex flex-col divide-y divide-border p-0">
        {items.map((item) => (
          <Link
            key={item.id}
            href={item.href}
            className="flex items-start gap-3 p-4 transition-colors hover:bg-muted"
          >
            {item.done ? (
              <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-success" aria-hidden="true" />
            ) : (
              <Circle className="mt-0.5 size-5 shrink-0 text-muted-foreground" aria-hidden="true" />
            )}
            <span className="flex flex-col gap-0.5">
              <span
                className={
                  item.done
                    ? "text-sm font-medium text-muted-foreground line-through"
                    : "text-sm font-medium text-foreground"
                }
              >
                {item.label}
              </span>
              <span className="text-xs text-muted-foreground">{item.description}</span>
            </span>
          </Link>
        ))}
      </CardContent>
    </Card>
  );
}
