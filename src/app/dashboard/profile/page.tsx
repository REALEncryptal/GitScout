import { getDashboardData } from "@/lib/actions/get-dashboard-data";
import { ProfileCard } from "@/components/dashboard/profile-card";

export default async function ProfilePage() {
  const data = await getDashboardData();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Your Profile</h1>
        <p className="mt-1 text-muted-foreground">
          AI-generated analysis of your GitHub contributions
        </p>
      </div>

      {data.developerProfile && data.githubUsername ? (
        <ProfileCard
          profile={data.developerProfile}
          username={data.githubUsername}
        />
      ) : (
        <div className="rounded-xl border border-dashed border-muted-foreground/20 p-12 text-center">
          <h3 className="text-lg font-semibold">No profile generated yet</h3>
          <p className="mt-2 text-muted-foreground">
            Start scouting from the dashboard to generate your developer
            profile.
          </p>
          <a
            href="/dashboard"
            className="mt-4 inline-block text-sm text-primary hover:underline"
          >
            Go to dashboard &rarr;
          </a>
        </div>
      )}
    </div>
  );
}
