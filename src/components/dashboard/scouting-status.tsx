"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import type { ScoutingStatusResponse } from "@/app/api/scouting/status/route";
import {
  Search,
  FolderSearch,
  Star,
  Clock,
  CheckCircle2,
  AlertCircle,
  GitBranch,
  Brain,
  Radar,
  Sparkles,
} from "lucide-react";

interface ScoutingStatusProps {
  initialCandidateCount: number;
  initialRecommendationCount: number;
  initialLastCompletedAt: string | null;
}

const steps = [
  {
    stage: "syncing",
    label: "Syncing GitHub",
    icon: GitBranch,
    description: "Fetching repos, commits, and PRs",
  },
  {
    stage: "analyzing",
    label: "Analyzing Profile",
    icon: Brain,
    description: "AI building your developer profile",
  },
  {
    stage: "scouting",
    label: "Scouting Repos",
    icon: Radar,
    description: "Searching for matching projects",
  },
  {
    stage: "recommending",
    label: "Recommendations",
    icon: Sparkles,
    description: "Generating contribution plans",
  },
];

function SparkleAnimation() {
  return (
    <span className="relative flex h-3 w-3">
      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary/60 opacity-75" />
      <span className="relative inline-flex h-3 w-3 rounded-full bg-primary" />
    </span>
  );
}

export function ScoutingStatus({
  initialCandidateCount,
  initialRecommendationCount,
  initialLastCompletedAt,
}: ScoutingStatusProps) {
  const [status, setStatus] = useState<ScoutingStatusResponse | null>(null);
  const [polling, setPolling] = useState(false);

  // Poll for status when pipeline might be active
  useEffect(() => {
    let interval: NodeJS.Timeout;

    async function fetchStatus() {
      try {
        const res = await fetch("/api/scouting/status");
        if (!res.ok) return;
        const data: ScoutingStatusResponse = await res.json();
        setStatus(data);

        const isActive = ["syncing", "analyzing", "scouting", "recommending"].includes(data.stage);
        setPolling(isActive);
      } catch {
        // ignore fetch errors
      }
    }

    fetchStatus();
    interval = setInterval(fetchStatus, 3000);

    return () => clearInterval(interval);
  }, []);

  const isActive = status
    ? ["syncing", "analyzing", "scouting", "recommending"].includes(status.stage)
    : false;

  const candidateCount = status?.candidateCount ?? initialCandidateCount;
  const recommendationCount = status?.recommendationCount ?? initialRecommendationCount;
  const lastCompletedAt = status?.lastCompletedAt ?? initialLastCompletedAt;

  return (
    <div className="space-y-4">
      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <Card>
          <CardContent className="flex items-center gap-3 py-4">
            <div className="rounded-lg bg-muted p-2.5 shrink-0">
              <FolderSearch className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Repos Found</p>
              <p className="text-2xl font-bold">{candidateCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 py-4">
            <div className="rounded-lg bg-muted p-2.5 shrink-0">
              <Star className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Recommendations</p>
              <p className="text-2xl font-bold">{recommendationCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 py-4">
            <div className="rounded-lg bg-muted p-2.5 shrink-0">
              <Clock className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Last Scout</p>
              <p className="text-base font-semibold">
                {lastCompletedAt
                  ? new Date(lastCompletedAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })
                  : "Never"}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pipeline tracker */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Search className="h-4 w-4" />
            Pipeline Status
            {isActive && (
              <Badge className="gap-1.5 bg-primary/15 text-primary dark:bg-primary/20">
                <SparkleAnimation />
                Running
              </Badge>
            )}
            {status?.stage === "complete" && (
              <Badge variant="secondary" className="gap-1">
                <CheckCircle2 className="h-3 w-3" />
                Complete
              </Badge>
            )}
            {status?.stage === "failed" && (
              <Badge variant="destructive" className="gap-1">
                <AlertCircle className="h-3 w-3" />
                Failed
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Progress bar */}
          {isActive && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{status?.message}</span>
                <span>{status?.progress}%</span>
              </div>
              <Progress value={status?.progress ?? 0} className="h-2" />
            </div>
          )}

          {/* Step indicators */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
            {steps.map((step, i) => {
              const StepIcon = step.icon;
              const currentStageIdx = steps.findIndex(
                (s) => s.stage === status?.stage
              );
              const isCurrentStep = status?.stage === step.stage;
              const isCompletedStep =
                status?.stage === "complete" ||
                (currentStageIdx >= 0 && i < currentStageIdx);
              const isFutureStep = !isCurrentStep && !isCompletedStep;

              return (
                <div
                  key={step.stage}
                  className={`relative rounded-lg border p-2 sm:p-3 text-center transition-all min-w-0 ${
                    isCurrentStep
                      ? "border-primary bg-primary/5"
                      : isCompletedStep
                        ? "border-primary/30 bg-primary/5"
                        : "border-border"
                  }`}
                >
                  <div className="flex justify-center mb-2">
                    {isCurrentStep ? (
                      <div className="relative">
                        <StepIcon className="h-5 w-5 text-primary animate-pulse" />
                        <div className="absolute -top-1 -right-1">
                          <SparkleAnimation />
                        </div>
                      </div>
                    ) : isCompletedStep ? (
                      <CheckCircle2 className="h-5 w-5 text-primary" />
                    ) : (
                      <StepIcon
                        className={`h-5 w-5 ${isFutureStep ? "text-muted-foreground/40" : "text-muted-foreground"}`}
                      />
                    )}
                  </div>
                  <p
                    className={`text-[11px] sm:text-xs font-medium break-words ${
                      isCurrentStep
                        ? "text-primary"
                        : isCompletedStep
                          ? "text-foreground"
                          : isFutureStep
                            ? "text-muted-foreground/50"
                            : "text-muted-foreground"
                    }`}
                  >
                    {step.label}
                  </p>
                  <p
                    className={`text-[10px] mt-0.5 ${
                      isFutureStep
                        ? "text-muted-foreground/30"
                        : "text-muted-foreground/70"
                    }`}
                  >
                    {step.description}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Idle state */}
          {status?.stage === "idle" && !polling && (
            <p className="text-sm text-muted-foreground text-center py-2">
              Click &quot;Start Scouting&quot; to run the pipeline
            </p>
          )}

          {/* Failed state */}
          {status?.stage === "failed" && (
            <p className="text-sm text-destructive text-center py-2">
              {status.message}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
