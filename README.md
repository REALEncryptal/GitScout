# GitScout

Your personal open-source talent agent. GitScout analyzes your GitHub history to understand your unique coding style and strengths, proactively scouts thousands of repositories to find active projects where your skills are needed most, and delivers curated recommendations explaining exactly why you're a great fit and how to make your first impact.

## How It Works

1. **Analyze** - Sign in with GitHub and GitScout deep-dives into your repositories, languages, commit patterns, and contribution history to build a comprehensive developer profile.
2. **Scout** - AI agents search thousands of active open-source repositories to find projects that match your unique skill set and contribution style.
3. **Contribute** - Get personalized recommendations with specific issues, an explanation of why you're a great fit, and a plan for making your first contribution.

## Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router)
- **AI**: [Vercel AI SDK](https://sdk.vercel.ai/) (provider-agnostic - supports OpenAI & Anthropic)
- **Auth**: [Auth.js v5](https://authjs.dev/) with GitHub OAuth
- **Database**: PostgreSQL with [Prisma](https://www.prisma.io/)
- **Background Jobs**: [Inngest](https://www.inngest.com/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Testing**: [Vitest](https://vitest.dev/) + [React Testing Library](https://testing-library.com/) + [Playwright](https://playwright.dev/)

## Architecture

GitScout uses a multi-agent pipeline where three specialized AI agents communicate through the database and event-driven background jobs:

```
User triggers scout
  -> Fetch GitHub Data         -> store GitHubProfile
  -> Agent 1: Profile Analyzer -> store DeveloperProfile
  -> Agent 2: Repo Scout       -> store CandidateRepos
  -> Agent 3: Recommendation   -> store Recommendations
```

Each agent is independently testable, retryable, and swappable.

## Getting Started

### Prerequisites

- Node.js 22+
- PostgreSQL 16+
- A [GitHub OAuth App](https://github.com/settings/developers)

### 1. Clone and install

```bash
git clone https://github.com/RealEncryptal/GitScout.git
cd GitScout
npm install
```

### 2. Set up environment variables

Copy the example and fill in your values:

```bash
cp .env.example .env
```

You'll need:
- **`DATABASE_URL`** - Your PostgreSQL connection string
- **`GITHUB_CLIENT_ID`** / **`GITHUB_CLIENT_SECRET`** - From your [GitHub OAuth App](https://github.com/settings/developers) (set the callback URL to `http://localhost:3000/api/auth/callback/github`)
- **`AUTH_SECRET`** - Generate with `openssl rand -base64 32`

### 3. Set up the database

```bash
npx prisma db push
```

### 4. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and sign in with GitHub.

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm test` | Run unit/integration tests (Vitest) |
| `npm run test:e2e` | Run end-to-end tests (Playwright) |
| `npm run lint` | Run ESLint |

## Project Structure

```
src/
├── app/                  # Next.js App Router pages & API routes
│   ├── api/
│   │   ├── auth/         # Auth.js route handler
│   │   └── health/       # Health check endpoint
│   ├── dashboard/        # Protected dashboard pages
│   └── login/            # Login page
├── components/           # React components
│   └── auth/             # Auth-related components
├── lib/                  # Shared utilities
│   ├── auth.ts           # Auth.js configuration
│   ├── db.ts             # Prisma client singleton
│   └── env.ts            # Environment variable validation
└── __tests__/            # Unit & integration tests
e2e/                      # Playwright E2E tests
prisma/                   # Prisma schema & migrations
```

## License

MIT
