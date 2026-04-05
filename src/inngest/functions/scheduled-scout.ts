import { inngest } from "../client";
import { db } from "@/lib/db";

export const scheduledScout = inngest.createFunction(
  {
    id: "scheduled-weekly-scout",
    triggers: [{ cron: "0 9 * * 1" }], // Every Monday at 9 AM
  },
  async ({ step }: { step: any }) => {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const activeUsers = await step.run("get-active-users", async () => {
      return db.user.findMany({
        where: {
          sessions: {
            some: {
              expires: { gt: thirtyDaysAgo },
            },
          },
          developerProfile: { isNot: null },
        },
        select: { id: true },
      });
    });

    if (activeUsers.length === 0) {
      return { success: true, usersTriggered: 0 };
    }

    await step.sendEvent(
      "fan-out-scouts",
      activeUsers.map((user: { id: string }) => ({
        name: "github/sync.requested" as const,
        data: { userId: user.id },
      }))
    );

    return { success: true, usersTriggered: activeUsers.length };
  }
);
