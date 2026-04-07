"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import type { Recommendation } from "@/lib/ai/schemas/recommendation";
import { updateRecommendationStatus } from "@/lib/actions/update-recommendation";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import {
  Bookmark,
  X,
  ExternalLink,
  ChevronRight,
  Clock,
  Zap,
  FileCode,
  GitPullRequest,
  BookOpen,
  TestTube,
  Wrench,
  Sparkles,
} from "lucide-react";

interface RecommendationCardProps {
  id: string;
  recommendation: Recommendation;
  status: string;
}

const effortColors: Record<string, string> = {
  "< 1 hour": "bg-primary/15 text-primary",
  "1-3 hours": "bg-primary/25 text-primary",
  "3-8 hours": "bg-secondary text-secondary-foreground",
  "1-2 days": "bg-muted text-muted-foreground",
};

const contributionIcons: Record<string, React.ReactNode> = {
  issue: <GitPullRequest className="h-3.5 w-3.5" />,
  documentation: <BookOpen className="h-3.5 w-3.5" />,
  test: <TestTube className="h-3.5 w-3.5" />,
  refactor: <Wrench className="h-3.5 w-3.5" />,
  feature: <Sparkles className="h-3.5 w-3.5" />,
};

function ScoreBadge({ score }: { score: number }) {
  const color =
    score >= 80
      ? "bg-primary text-primary-foreground"
      : score >= 60
        ? "bg-primary/20 text-primary"
        : "bg-muted text-muted-foreground";
  return (
    <span
      className={`inline-flex items-center justify-center rounded-md px-2.5 py-1 text-sm font-bold tabular-nums ${color}`}
    >
      {score}%
    </span>
  );
}

export function RecommendationCard({
  id,
  recommendation: rec,
  status,
}: RecommendationCardProps) {
  const router = useRouter();
  const [updating, setUpdating] = useState(false);
  const [open, setOpen] = useState(false);

  const [repoOwner, repoName] = rec.repoFullName.includes("/")
    ? [
        rec.repoFullName.slice(0, rec.repoFullName.indexOf("/")),
        rec.repoFullName.slice(rec.repoFullName.indexOf("/") + 1),
      ]
    : ["", rec.repoFullName];

  async function handleAction(
    e: React.MouseEvent,
    action: "saved" | "dismissed"
  ) {
    e.stopPropagation();
    setUpdating(true);
    try {
      await updateRecommendationStatus(id, action);
      toast.success(
        action === "saved"
          ? "Recommendation saved"
          : "Recommendation dismissed"
      );
      router.refresh();
    } catch {
      toast.error("Failed to update recommendation");
    } finally {
      setUpdating(false);
    }
  }

  return (
    <>
      {/* ── Compact card ── */}
      <Card
        className={`cursor-pointer transition-colors hover:bg-accent/50 ${status === "dismissed" ? "opacity-50" : ""}`}
        onClick={() => setOpen(true)}
      >
        <CardHeader className="pb-0">
          <div className="flex items-start justify-between gap-2 sm:gap-3 min-w-0">
            <div className="flex items-start gap-2 sm:gap-3 min-w-0 flex-1">
              <ScoreBadge score={rec.matchScore} />
              <div className="min-w-0 flex-1">
                <CardTitle className="text-base truncate">
                  {repoName}
                </CardTitle>
                {repoOwner && (
                  <p className="text-xs text-muted-foreground truncate">
                    {repoOwner}
                  </p>
                )}
              </div>
              <div className="hidden sm:flex gap-1.5 shrink-0">
                {rec.tags.slice(0, 3).map((tag) => (
                  <Badge key={tag} variant="outline" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-0.5 shrink-0">
              {status !== "dismissed" && status !== "saved" && (
                <>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8"
                    disabled={updating}
                    onClick={(e) => handleAction(e, "saved")}
                    title="Save"
                  >
                    <Bookmark className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-muted-foreground"
                    disabled={updating}
                    onClick={(e) => handleAction(e, "dismissed")}
                    title="Dismiss"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </>
              )}
              {status === "saved" && (
                <Bookmark className="h-4 w-4 fill-current text-primary" />
              )}
              <ChevronRight className="h-4 w-4 text-muted-foreground ml-1" />
            </div>
          </div>
          <p className="text-sm text-muted-foreground mt-2 line-clamp-2 break-words">{rec.headline}</p>
        </CardHeader>

        <CardContent className="pt-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="rounded-lg border bg-muted/30 p-4">
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-1.5 flex items-center gap-1.5">
                <Zap className="h-3 w-3" />
                Why you&apos;re a fit
              </p>
              <p className="text-sm line-clamp-2">{rec.whyYoureAFit[0]}</p>
            </div>
            <div className="rounded-lg border bg-muted/30 p-4">
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-1.5 flex items-center gap-1.5">
                {contributionIcons[rec.firstContribution.type] ?? (
                  <GitPullRequest className="h-3 w-3" />
                )}
                First contribution
              </p>
              <p className="text-sm line-clamp-2">
                {rec.firstContribution.title}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between mt-4">
            <Badge
              className={`gap-1 ${effortColors[rec.firstContribution.estimatedEffort] ?? ""}`}
            >
              <Clock className="h-3 w-3" />
              {rec.firstContribution.estimatedEffort}
            </Badge>
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              Details
              <ChevronRight className="h-3 w-3" />
            </span>
          </div>
        </CardContent>
      </Card>

      {/* ── Detail modal ── */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-2xl md:max-w-4xl">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <ScoreBadge score={rec.matchScore} />
              <div className="min-w-0 flex-1">
                <DialogTitle className="text-lg sm:text-xl break-words">
                  {repoName}
                </DialogTitle>
                {repoOwner && (
                  <p className="text-xs text-muted-foreground break-words">
                    {repoOwner}
                  </p>
                )}
                <DialogDescription className="mt-1 break-words">
                  {rec.headline}
                </DialogDescription>
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5 mt-3">
              {rec.tags.map((tag) => (
                <Badge key={tag} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          </DialogHeader>

          <Separator />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {/* Left: Why you're a fit */}
            <div className="rounded-lg border p-5">
              <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <Zap className="h-4 w-4 text-primary" />
                Why you&apos;re a fit
              </h4>
              <ul className="space-y-2.5">
                {rec.whyYoureAFit.map((reason, i) => (
                  <li
                    key={i}
                    className="flex gap-2.5 text-sm text-muted-foreground"
                  >
                    <span className="text-primary shrink-0 mt-0.5">+</span>
                    <span>{reason}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Right: First contribution */}
            <div className="rounded-lg border p-5">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-semibold flex items-center gap-2">
                  {contributionIcons[rec.firstContribution.type] ?? (
                    <GitPullRequest className="h-4 w-4 text-primary" />
                  )}
                  First contribution
                </h4>
                <Badge
                  className={`gap-1 ${effortColors[rec.firstContribution.estimatedEffort] ?? ""}`}
                >
                  <Clock className="h-3 w-3" />
                  {rec.firstContribution.estimatedEffort}
                </Badge>
              </div>

              <div className="space-y-3">
                <div>
                  <Badge variant="outline" className="text-xs mb-2 gap-1">
                    {contributionIcons[rec.firstContribution.type]}
                    {rec.firstContribution.type}
                  </Badge>
                  <p className="font-medium text-sm">
                    {rec.firstContribution.title}
                  </p>
                </div>
                <p className="text-sm text-muted-foreground">
                  {rec.firstContribution.description}
                </p>
                {rec.firstContribution.filesLikelyInvolved &&
                  rec.firstContribution.filesLikelyInvolved.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5">
                      <FileCode className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      {rec.firstContribution.filesLikelyInvolved.map(
                        (f, i) => (
                          <code
                            key={i}
                            className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono"
                          >
                            {f}
                          </code>
                        )
                      )}
                    </div>
                  )}
                {rec.firstContribution.issueUrl && (
                  <a
                    href={rec.firstContribution.issueUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline inline-flex items-center gap-1"
                  >
                    View issue
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
            </div>
          </div>

          <Separator />

          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <a
              href={rec.repoUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button className="gap-2">
                <ExternalLink className="h-4 w-4" />
                View Repository
              </Button>
            </a>
            {status !== "dismissed" && status !== "saved" && (
              <>
                <Button
                  variant="outline"
                  className="gap-2"
                  disabled={updating}
                  onClick={(e) => handleAction(e, "saved")}
                >
                  <Bookmark className="h-4 w-4" />
                  Save
                </Button>
                <Button
                  variant="ghost"
                  className="gap-2"
                  disabled={updating}
                  onClick={(e) => handleAction(e, "dismissed")}
                >
                  <X className="h-4 w-4" />
                  Dismiss
                </Button>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
