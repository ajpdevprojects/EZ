import { Card, CardContent } from "@ez/ui";
import type { DailyPriorityItem } from "@ez/types";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

export function DailyPriorities({ priorities }: { priorities: DailyPriorityItem[] }) {
  return (
    <div className="flex flex-col gap-2">
      {priorities.map((priority) => (
        <Link key={priority.id} href={priority.href}>
          <Card className={priority.urgent ? "border-primary/40 bg-primary/5" : undefined}>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex flex-1 flex-col gap-0.5">
                <p className="text-sm font-medium text-foreground">{priority.label}</p>
                <p className="text-xs text-muted-foreground">{priority.description}</p>
              </div>
              <ArrowRight className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}
