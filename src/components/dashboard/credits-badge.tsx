import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { Coins } from "lucide-react";

export async function CreditsBadge() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { credits: true },
  });

  const credits = user?.credits ?? 0;

  return (
    <div
      className={`inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-semibold ${
        credits <= 0
          ? "border-destructive/40 bg-destructive/10 text-destructive"
          : credits <= 3
            ? "border-primary/40 bg-primary/10 text-primary"
            : "border-border bg-muted/50 text-foreground"
      }`}
    >
      <Coins className="h-4 w-4" />
      <span>{credits}</span>
      <span className="text-muted-foreground font-normal hidden sm:inline">
        credit{credits !== 1 ? "s" : ""}
      </span>
    </div>
  );
}
