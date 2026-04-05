"use client";

import { signOut, useSession } from "next-auth/react";

export function UserMenu() {
  const { data: session } = useSession();

  if (!session?.user) return null;

  return (
    <div className="flex items-center gap-3">
      {session.user.image && (
        <img
          src={session.user.image}
          alt={session.user.name ?? "User avatar"}
          className="h-8 w-8 rounded-full"
        />
      )}
      <span className="text-sm font-medium">{session.user.name}</span>
      <button
        onClick={() => signOut({ callbackUrl: "/" })}
        className="rounded-md border border-foreground/20 px-3 py-1.5 text-xs font-medium hover:bg-foreground/5 transition-colors"
      >
        Sign out
      </button>
    </div>
  );
}
