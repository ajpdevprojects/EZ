"use client";

import { analyzeJobMatchAction } from "@/features/jobs/actions";
import type { JobMatchAnalysis } from "@ez/lib";
import { Badge, Button, Card, CardContent, toast } from "@ez/ui";
import { Sparkles } from "lucide-react";
import * as React from "react";

export function JobMatchAnalysisCard({
  jobId,
  initialScore,
  initialReason,
}: {
  jobId: string;
  initialScore: number | null;
  initialReason: string | null;
}) {
  const [analysis, setAnalysis] = React.useState<JobMatchAnalysis | null>(
    initialScore !== null || initialReason ? { score: initialScore, reason: initialReason ?? "" } : null,
  );
  const [isAnalyzing, setIsAnalyzing] = React.useState(false);

  async function handleAnalyze() {
    setIsAnalyzing(true);
    const result = await analyzeJobMatchAction(jobId);
    setIsAnalyzing(false);

    if (result.error) {
      toast({ title: "Analysis unavailable", description: result.error, variant: "warning" });
      return;
    }
    if (result.analysis) setAnalysis(result.analysis);
  }

  return (
    <Card className="border-primary/30 bg-primary/5">
      <CardContent className="flex flex-col gap-3 p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Sparkles className="size-4 text-primary" aria-hidden="true" />
            <p className="text-sm font-medium text-foreground">Elizabeth&apos;s match analysis</p>
          </div>
          {analysis?.score !== null && analysis?.score !== undefined && (
            <Badge variant="offer">{analysis.score}/100</Badge>
          )}
        </div>
        {analysis ? (
          <p className="text-sm text-muted-foreground">{analysis.reason}</p>
        ) : (
          <p className="text-sm text-muted-foreground">
            See how well this role matches your profile and resume before you apply.
          </p>
        )}
        <Button
          type="button"
          variant="secondary"
          size="sm"
          disabled={isAnalyzing}
          onClick={handleAnalyze}
          className="self-start"
        >
          {isAnalyzing ? "Analyzing…" : analysis ? "Re-analyze" : "Analyze my fit for this role"}
        </Button>
      </CardContent>
    </Card>
  );
}
