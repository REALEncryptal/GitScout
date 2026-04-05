import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

describe("env validation", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("throws when DATABASE_URL is missing", async () => {
    delete process.env.DATABASE_URL;
    await expect(async () => {
      await import("@/lib/env");
    }).rejects.toThrow("Invalid environment variables");
  });

  it("throws when DATABASE_URL is not a valid URL", async () => {
    process.env.DATABASE_URL = "not-a-url";
    await expect(async () => {
      await import("@/lib/env");
    }).rejects.toThrow("Invalid environment variables");
  });

  it("succeeds with valid DATABASE_URL", async () => {
    process.env.DATABASE_URL =
      "postgresql://postgres:postgres@localhost:5432/gitscout";
    const { env } = await import("@/lib/env");
    expect(env.DATABASE_URL).toBe(
      "postgresql://postgres:postgres@localhost:5432/gitscout"
    );
  });

  it("allows optional fields to be missing", async () => {
    process.env.DATABASE_URL =
      "postgresql://postgres:postgres@localhost:5432/gitscout";
    delete process.env.GITHUB_CLIENT_ID;
    delete process.env.OPENAI_API_KEY;
    const { env } = await import("@/lib/env");
    expect(env.GITHUB_CLIENT_ID).toBeUndefined();
    expect(env.OPENAI_API_KEY).toBeUndefined();
  });
});
