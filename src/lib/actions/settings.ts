"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export interface UserSettingsData {
  preferredLanguages: string[];
  excludedRepos: string[];
  excludedTopics: string[];
  minStars: number;
  difficultyPreference: string;
  scoutFrequency: string;
}

const DEFAULTS: UserSettingsData = {
  preferredLanguages: [],
  excludedRepos: [],
  excludedTopics: [],
  minStars: 10,
  difficultyPreference: "any",
  scoutFrequency: "weekly",
};

export async function getSettings(): Promise<UserSettingsData> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const settings = await db.userSettings.findUnique({
    where: { userId: session.user.id },
  });

  if (!settings) return DEFAULTS;

  return {
    preferredLanguages: settings.preferredLanguages,
    excludedRepos: settings.excludedRepos,
    excludedTopics: settings.excludedTopics,
    minStars: settings.minStars,
    difficultyPreference: settings.difficultyPreference,
    scoutFrequency: settings.scoutFrequency,
  };
}

export async function updateSettings(
  data: Partial<UserSettingsData>
): Promise<{ success: boolean }> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  // Validate
  if (data.minStars !== undefined && (data.minStars < 0 || data.minStars > 100000)) {
    throw new Error("minStars must be between 0 and 100000");
  }
  if (
    data.difficultyPreference &&
    !["beginner-friendly", "moderate", "advanced", "any"].includes(
      data.difficultyPreference
    )
  ) {
    throw new Error("Invalid difficulty preference");
  }
  if (
    data.scoutFrequency &&
    !["weekly", "biweekly", "monthly"].includes(data.scoutFrequency)
  ) {
    throw new Error("Invalid scout frequency");
  }

  await db.userSettings.upsert({
    where: { userId: session.user.id },
    create: {
      userId: session.user.id,
      ...DEFAULTS,
      ...data,
    },
    update: data,
  });

  return { success: true };
}
