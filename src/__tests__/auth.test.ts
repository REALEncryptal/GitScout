import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock next-auth and dependencies before imports
vi.mock("next-auth", () => {
  const mockAuth = vi.fn();
  const mockSignIn = vi.fn();
  const mockSignOut = vi.fn();
  const mockHandlers = { GET: vi.fn(), POST: vi.fn() };

  return {
    default: vi.fn((config: unknown) => {
      // Store config for testing callbacks
      (mockAuth as unknown as Record<string, unknown>).__config = config;
      return {
        auth: mockAuth,
        signIn: mockSignIn,
        signOut: mockSignOut,
        handlers: mockHandlers,
      };
    }),
  };
});

vi.mock("next-auth/providers/github", () => ({
  default: vi.fn((config: unknown) => ({ id: "github", ...(config as object) })),
}));

vi.mock("@auth/prisma-adapter", () => ({
  PrismaAdapter: vi.fn(() => ({})),
}));

vi.mock("@/lib/db", () => ({
  db: {},
}));

describe("Auth configuration", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("exports auth, signIn, signOut, and handlers", async () => {
    const authModule = await import("@/lib/auth");
    expect(authModule.auth).toBeDefined();
    expect(authModule.signIn).toBeDefined();
    expect(authModule.signOut).toBeDefined();
    expect(authModule.handlers).toBeDefined();
  });

  it("configures GitHub provider with authorization scope", async () => {
    const GitHub = (await import("next-auth/providers/github")).default;
    await import("@/lib/auth");
    expect(GitHub).toHaveBeenCalledWith(
      expect.objectContaining({
        authorization: {
          params: { scope: "read:user user:email" },
        },
      })
    );
  });

  it("uses PrismaAdapter", async () => {
    const { PrismaAdapter } = await import("@auth/prisma-adapter");
    await import("@/lib/auth");
    expect(PrismaAdapter).toHaveBeenCalled();
  });

  it("uses database session strategy", async () => {
    const NextAuth = (await import("next-auth")).default;
    await import("@/lib/auth");
    expect(NextAuth).toHaveBeenCalledWith(
      expect.objectContaining({
        session: { strategy: "database" },
      })
    );
  });

  it("sets login page to /login", async () => {
    const NextAuth = (await import("next-auth")).default;
    await import("@/lib/auth");
    expect(NextAuth).toHaveBeenCalledWith(
      expect.objectContaining({
        pages: { signIn: "/login" },
      })
    );
  });

  it("session callback attaches user id", async () => {
    const NextAuth = (await import("next-auth")).default;
    await import("@/lib/auth");

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const config = vi.mocked(NextAuth).mock.calls[0][0] as any;
    const sessionCallback = config.callbacks?.session;

    if (!sessionCallback) throw new Error("session callback not defined");

    const mockSession = {
      user: { id: "", name: "Test", email: "test@test.com" },
      expires: "2026-01-01",
    };
    const mockUser = {
      id: "user-123",
      email: "test@test.com",
      emailVerified: null,
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await (sessionCallback as any)({
      session: mockSession,
      user: mockUser,
      trigger: "update",
      newSession: undefined,
    });

    expect(result.user.id).toBe("user-123");
  });
});
