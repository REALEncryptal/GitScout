# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Stack versions (read before coding)

This project runs on bleeding-edge versions whose APIs differ from older docs:
- **Next.js 16** (App Router) — read `node_modules/next/dist/docs/` before touching routing, server actions, or config.
- **React 19** with the new `use` / Actions APIs.
- **Prisma 7** with `@prisma/adapter-pg` — generated client lives at `src/generated/prisma` (not `@prisma/client`).
- **Auth.js v5 beta** (`next-auth@5`).
- **Vercel AI SDK v6** (`ai@^6`) with `@ai-sdk/openai` v3 and `@ai-sdk/anthropic` v3.
- **Tailwind v4** (`@tailwindcss/postcss`).
- **Vitest 4**, **Playwright 1.59**.
- **Zod 4**.

When in doubt, check `package.json` and the package's bundled docs in `node_modules/`.

## Commands

| Task | Command |
|---|---|
| Dev server | `npm run dev` |
| Build | `npm run build` |
| Lint | `npm run lint` |
| Unit/integration tests | `npm test` (vitest run) |
| Watch tests | `npm run test:watch` |
| Single test file | `npx vitest run src/__tests__/<file>.test.ts` |
| Single test by name | `npx vitest run -t "<test name>"` |
| E2E tests | `npm run test:e2e` |
| Push schema to DB | `npx prisma db push` |

Vitest is configured in `vitest.config.ts` with `jsdom`, the `@/` → `src/` alias, and `src/__tests__/setup.ts` as the setup file. Tests are discovered as `src/**/*.test.{ts,tsx}`.

## Architecture

GitScout is a multi-stage AI pipeline that analyzes a user's GitHub history and recommends open-source projects to contribute to. Stages run as **Inngest** background functions, communicating via events and persisting state to Postgres via Prisma.

**Pipeline (`src/inngest/functions/`)** — each step emits an event consumed by the next:

1. `sync-github-data.ts` — listens for `github/sync.requested`. Creates a `ScoutingRun`, fetches the user's GitHub data via Octokit, stores a `GitHubProfile`, emits `github/sync.completed`.
2. `analyze-profile.ts` — runs the **Profile Analyzer** agent (`src/lib/agents/profile-analyzer.ts`) to produce a `DeveloperProfile`, emits `profile/analyzed`.
3. `scout-repos.ts` — runs the **Repo Scout** agent (`src/lib/agents/repo-scout.ts`) which performs GitHub searches (`src/lib/github/search.ts`) to find candidate repos, persists `CandidateRepo` rows, emits `repos/scouted`.
4. `generate-recommendations.ts` — runs the **Recommendation Engine** agent (`src/lib/agents/recommendation-engine.ts`) to score candidates and persist `Recommendation` rows, emits `recommendations/generated`.
5. `scheduled-scout.ts` — cron-style entry point that triggers the pipeline based on each user's `scoutFrequency` setting.

The full event contract lives in `src/inngest/events.ts`. A `scoutingRunId` is threaded through every event so the UI can track progress for one pipeline run end-to-end.

**Agents (`src/lib/agents/`)** are pure functions that take typed input, call an LLM via the Vercel AI SDK, and return typed output. They are independently testable — see corresponding `src/__tests__/*.test.ts`. The model is selected through `src/lib/ai/models.ts`, which supports OpenAI, Anthropic, and OpenRouter (any `openrouter/<model>` id is allowed dynamically). Default model comes from `DEFAULT_MODEL` env var.

**Database (`prisma/schema.prisma`)** — Postgres via the `@prisma/adapter-pg` driver adapter. **The Prisma client is generated to `src/generated/prisma`**, not `@prisma/client`. Import from `@/lib/db` (the singleton). Key models: `User`, `GitHubProfile`, `DeveloperProfile`, `ScoutingRun`, `CandidateRepo`, `Recommendation`, `UserSettings`. JSON columns are used for the raw GitHub payloads and agent outputs.

**Auth (`src/lib/auth.ts`)** — Auth.js v5 with the GitHub OAuth provider and Prisma adapter. The user's GitHub `access_token` is stored on the `Account` row and read by the sync function to authorize Octokit calls.

**Server actions** live in `src/lib/actions/`. UI is a Next.js App Router app under `src/app/` with a protected `dashboard/` segment and a `login/` segment. Components use shadcn/ui primitives in `src/components/ui/` plus app-specific components in `src/components/dashboard/`.

**Env validation** is centralized in `src/lib/env.ts` (Zod). Add new env vars there.
