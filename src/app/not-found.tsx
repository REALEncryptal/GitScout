import Link from "next/link";
import { auth } from "@/lib/auth";
import { ThemeToggle } from "@/components/theme-toggle";

export default async function NotFound() {
  const session = await auth();
  const href = session?.user ? "/dashboard" : "/";
  const label = session?.user ? "Back to dashboard" : "Back to homepage";

  return (
    <>
      <header className="absolute top-0 right-0 p-4">
        <ThemeToggle />
      </header>
      <main className="flex flex-1 flex-col items-center justify-center px-4 text-center">
        <p className="text-sm font-semibold text-primary">404</p>
        <h1 className="mt-4 text-5xl font-bold tracking-tight sm:text-6xl">
          Page not found
        </h1>
        <p className="mt-6 max-w-xl text-lg text-muted-foreground">
          Sorry, we couldn&apos;t find the page you&apos;re looking for. It may
          have been moved or no longer exists.
        </p>
        <div className="mt-10">
          <Link
            href={href}
            className="rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors"
          >
            {label}
          </Link>
        </div>
      </main>
    </>
  );
}
