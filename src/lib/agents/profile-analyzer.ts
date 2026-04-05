import { generateObject } from "ai";
import { getModel, getModelId } from "@/lib/ai/models";
import { developerProfileSchema } from "@/lib/ai/schemas/developer-profile";
import type { DeveloperProfile } from "@/lib/ai/schemas/developer-profile";
import type { GitHubProfileData } from "@/lib/github/types";
import {
  PROFILE_ANALYZER_SYSTEM_PROMPT,
  buildProfilePrompt,
} from "@/lib/ai/prompts/profile-analyzer";

export interface ProfileAnalysisResult {
  profile: DeveloperProfile;
  modelUsed: string;
  durationMs: number;
}

export async function analyzeProfile(
  githubProfile: GitHubProfileData,
  options: { maxRetries?: number; modelId?: string } = {}
): Promise<ProfileAnalysisResult> {
  const { maxRetries = 3, modelId } = options;
  const resolvedModelId = modelId ?? getModelId();
  const prompt = buildProfilePrompt(githubProfile);

  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const start = Date.now();

      const { object: profile } = await generateObject({
        model: getModel(resolvedModelId),
        schema: developerProfileSchema,
        system: PROFILE_ANALYZER_SYSTEM_PROMPT,
        prompt,
        temperature: 0.3,
      });

      return {
        profile,
        modelUsed: resolvedModelId,
        durationMs: Date.now() - start,
      };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.error(
        `[ProfileAnalyzer] Attempt ${attempt + 1}/${maxRetries} failed:`,
        lastError.message
      );

      if (attempt < maxRetries - 1) {
        const delay = Math.pow(2, attempt) * 1000;
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw new Error(
    `Profile analysis failed after ${maxRetries} attempts: ${lastError?.message}`
  );
}
