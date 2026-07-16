import { Card, CardContent, CardHeader, CardTitle } from "@ez/ui";
import type { SkillGap } from "@ez/lib";
import { Target } from "lucide-react";

export function SkillGapCard({ skillGap }: { skillGap: SkillGap }) {
  return (
    <Card>
      <CardHeader className="flex-row items-center gap-2 space-y-0">
        <Target className="size-4 text-primary" aria-hidden="true" />
        <CardTitle className="text-base">Skill match</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <div
            role="progressbar"
            aria-valuenow={skillGap.coveragePercent}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Skill coverage"
            className="h-2 flex-1 overflow-hidden rounded-full bg-muted"
          >
            <div className="h-full rounded-full bg-primary" style={{ width: `${skillGap.coveragePercent}%` }} />
          </div>
          <span className="text-sm font-medium text-foreground">{skillGap.coveragePercent}%</span>
        </div>
        {skillGap.missingSkills.length > 0 ? (
          <p className="text-sm text-muted-foreground">
            Skills to highlight or grow before applying: {skillGap.missingSkills.join(", ")}.
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">Your resume covers every skill this role lists.</p>
        )}
      </CardContent>
    </Card>
  );
}
