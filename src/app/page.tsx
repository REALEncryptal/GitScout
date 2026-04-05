export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-4 text-center">
      <h1 className="text-5xl font-bold tracking-tight sm:text-6xl">
        Git<span className="text-blue-600">Scout</span>
      </h1>
      <p className="mt-6 max-w-2xl text-lg text-foreground/70">
        Your personal open-source talent agent. We analyze your GitHub history
        to understand your unique coding style, scout thousands of repositories,
        and find active projects where your skills are needed most.
      </p>
      <div className="mt-10 flex gap-4">
        <a
          href="/login"
          className="rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 transition-colors"
        >
          Get Started
        </a>
      </div>

      <div className="mt-20 grid max-w-4xl gap-8 sm:grid-cols-3">
        <div className="rounded-xl border border-foreground/10 p-6 text-left">
          <h3 className="font-semibold">Analyze</h3>
          <p className="mt-2 text-sm text-foreground/60">
            We deep-dive into your GitHub history to map your languages,
            expertise areas, and contribution style.
          </p>
        </div>
        <div className="rounded-xl border border-foreground/10 p-6 text-left">
          <h3 className="font-semibold">Scout</h3>
          <p className="mt-2 text-sm text-foreground/60">
            AI agents search thousands of active repositories to find projects
            that match your unique skill set.
          </p>
        </div>
        <div className="rounded-xl border border-foreground/10 p-6 text-left">
          <h3 className="font-semibold">Contribute</h3>
          <p className="mt-2 text-sm text-foreground/60">
            Get curated recommendations with specific issues and a plan for
            making your first impact.
          </p>
        </div>
      </div>
    </main>
  );
}
