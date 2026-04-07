import { getDashboardData } from "@/lib/actions/get-dashboard-data";
import { getRecommendations } from "@/lib/actions/get-recommendations";
import { ProfileCard } from "@/components/dashboard/profile-card";
import { RecommendationCard } from "@/components/dashboard/recommendation-card";
import { ScoutingStatus } from "@/components/dashboard/scouting-status";
import { ScoutTriggerButton } from "@/components/dashboard/scout-trigger-button";

export default async function DashboardPage() {
  const data = await getDashboardData();
  const { items: recommendations } = await getRecommendations({ limit: 5 });

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-3xl font-bold">Dashboard</h1>
          <p className="mt-1 text-muted-foreground truncate">
            {data.githubUsername
              ? `Welcome back, @${data.githubUsername}`
              : "Your open-source talent dashboard"}
          </p>
        </div>
        <ScoutTriggerButton credits={data.credits} isScanning={data.isScanning} />
      </div>

      {/* Pipeline status + stats (full width) */}
      <ScoutingStatus
        initialCandidateCount={data.scoutingStatus.candidateCount}
        initialRecommendationCount={data.scoutingStatus.recommendationCount}
        initialLastCompletedAt={data.scoutingStatus.completedAt?.toISOString() ?? null}
      />

      {/* Profile */}
      {data.developerProfile && data.githubUsername ? (
        <ProfileCard
          profile={data.developerProfile}
          username={data.githubUsername}
        />
      ) : (
        <div className="rounded-xl border border-dashed border-muted-foreground/20 p-8 text-center">
          <h3 className="font-semibold">No Profile Yet</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Start scouting to analyze your GitHub profile and get personalized
            recommendations.
          </p>
        </div>
      )}

      {/* Recommendations */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Recommendations</h2>
          {recommendations.length > 0 && (
            <a
              href="/dashboard/recommendations"
              className="text-sm text-primary hover:underline"
            >
              View all &rarr;
            </a>
          )}
        </div>

        {recommendations.length > 0 ? (
          <div className="space-y-4">
            {recommendations.map((rec) => (
              <RecommendationCard
                key={rec.id}
                id={rec.id}
                recommendation={rec.data}
                status={rec.status}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-muted-foreground/20 p-12 text-center">
            <h3 className="font-semibold">No recommendations yet</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Click &quot;Start Scouting&quot; to analyze your GitHub profile
              and find matching projects.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
