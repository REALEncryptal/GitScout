import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { UserMenu } from "@/components/auth/user-menu";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session) redirect("/login");

  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b border-foreground/10 px-6 py-4">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <a href="/dashboard" className="text-xl font-bold">
            Git<span className="text-blue-600">Scout</span>
          </a>
          <UserMenu />
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-8">
        {children}
      </main>
    </div>
  );
}
