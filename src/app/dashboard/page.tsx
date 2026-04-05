import { auth } from "@/lib/auth";

export default async function DashboardPage() {
  const session = await auth();

  return (
    <div>
      <h1 className="text-3xl font-bold">Welcome, {session?.user?.name}</h1>
      <p className="mt-2 text-foreground/60">
        Your open-source talent dashboard. Start scouting to find projects that
        match your skills.
      </p>

      <div className="mt-8 rounded-xl border border-dashed border-foreground/20 p-12 text-center">
        <h2 className="text-lg font-semibold">No recommendations yet</h2>
        <p className="mt-2 text-sm text-foreground/50">
          Click &quot;Start Scouting&quot; to analyze your GitHub profile and
          find matching projects.
        </p>
        <button
          disabled
          className="mt-6 rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white opacity-50 cursor-not-allowed"
        >
          Start Scouting (Coming Soon)
        </button>
      </div>
    </div>
  );
}
