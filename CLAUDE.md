# Beryll Onboard

## What it is
An interactive, research-based onboarding platform (demo). It takes a new **Business Development Manager** at **Beryll Cyber Security** (fictional, Dublin; GDPR/NIS2 frame) from pre-boarding to month 12. There are three roles: **hire**, **manager** and **buddy**. Everything runs with no keys: a seeded in-memory store and scripted AI fallbacks. Supabase and OpenAI are optional upgrades.

Spec, decisions (Q1–Q16) and the build plan: `docs/planning/spec-and-decisions.md`. Research basis: an onboarding research brief cited as section refs (`researchRef` on tasks); its sources are listed in README Credits.

## How it works (data and request flow)
1. **Request** → `middleware.ts` reads the session (Supabase cookie, or a signed demo cookie in memory mode) and routes by role: hire → `/today`, manager → `/team`, buddy → `/buddy`. `/api` always passes through middleware.
2. **Pages** are Server Components that call `requireUser(role)` (`lib/data/auth.ts`), then `const repo = await getRepo()` (`lib/data/index.ts`). That gives Supabase if the public Supabase env vars are set, otherwise the in-memory store.
3. **Journey state** is computed from pure functions in `lib/logic/`: `getProgramDay()` (start date + demo offset, Dublin calendar), `computeStageStatuses`, `computeTaskStatuses`, XP/levels, ranks, `evaluateTrophies`, `riskFlags`, spaced repetition, check-ins, `scoreQuiz`, `certificationDecision`, cohort metrics.
4. **Writes** go through Server Actions (`app/(hire)/actions.ts`, manager/buddy actions). They award XP and trophies idempotently, with daily caps on attempts.
5. **AI** route handlers (`app/api/ai/roleplay`, `coach`, `grade`, `matcher`) use `lib/ai/` (server-only). It calls OpenAI with Zod-validated structured output and falls back to scripted/keyword logic (`mode: "live" | "fallback"`). Rate limits are in `lib/ai/guard.ts`. Contracts: `docs/API_CONTRACTS.md`.
6. **Content** (stages, tasks, lessons, quizzes, labs, SOPs, personas, staff, demo data) is typed TS in `content/`, validated by Zod tests. Answer keys, rubrics and persona secrets live in `content/server/` (server-only).
7. **PDF** certificates: `app/api/certificate/[stage]` + `lib/pdf/`, only when the milestone is reached.

## Key files
| Path | What |
|---|---|
| `lib/types.ts` | Shared domain + row types (single source of truth) |
| `lib/logic/` | Pure business rules + unit tests |
| `lib/data/repo.ts` | Repository interface; `memory.ts` / `supabase.ts` implementations; `seed.ts` |
| `lib/data/auth.ts`, `session.ts`, `access.ts` | Auth helpers, demo cookie, route rules |
| `lib/supabase/env.ts` | `isSupabaseConfigured()`, `isDemoMode()` |
| `lib/ai/` | OpenAI client, guard, roleplay, coach, grade, matcher, fallbacks; `bundle-leak.test.ts` |
| `content/` + `content/server/` | All journey content; server-only keys |
| `components/ui/`, `components/brand/` | Glass gem design kit (tokens in `app/globals.css`) |
| `components/contracts/`, `components/walkthrough/`, `content/walkthroughs/` | Beryll Contracts mini-app, walkthrough engine (Watch/Guided/Solo), steps |
| `components/explainers/` | 4 animated explainers (`EXPLAINERS` registry) |
| `supabase/migrations/0001_init.sql`, `0002_rls.sql` | Schema, RLS, pgvector, RPCs |
| `scripts/seed.ts`, `scripts/embed-sops.ts` | Supabase seed; Ask Beryl index |
| `tests/e2e/` | Playwright flows, AI guardrail tests |

## Commands
`npm run dev` · `npm run build` · `npm run lint` · `npm test` (Vitest; run after a build so the bundle-leak scan runs) · `npm run test:e2e` (Playwright, own build in `.next-e2e`, port 3210) · `npm run seed` · `npm run embed:sops`

## Rules and conventions
- Shared domain types live in `lib/types.ts`. Don't fork types.
- The OpenAI key, answer keys, rubrics and persona hidden goals are **server-only** (`import "server-only"`). Never ship them to client bundles.
- Data access only goes through `lib/data/` (repository). Memory mode has no RLS, so every page, action and route must call `requireUser` / `requireApiUser` first.
- The program day comes from `getProgramDay()` in `lib/logic/program-day.ts`. Never compute days inline.
- Design tokens are CSS variables in `app/globals.css`. Use the glass kit in `components/ui/`, with no ad-hoc colours. Gold is for rewards only. `--aqua-deep` is `#0B7F80` (AA contrast).
- Light theme is the default; dark is a toggle (`data-theme="dark"` on `<html>`).
- Every walkthrough target in the contracts mini-app carries a `data-tour="<id>"` attribute.
- Contract pipeline: Legal Review is mandatory only if any clause is `standard:false`. Nothing reaches Sent without Engineer Sign-off. A SOW needs an Authorisation before Signed.
- A route folder with its own `page.tsx` **and** child routes needs its own `loading.tsx`. Without it, production soft navigation hangs (see `app/(manager)/team/loading.tsx`).
- No `export type { … }` re-exports in `"use server"` files: the Turbopack build fails with "X is not defined". Put shared types in a plain module.
- Failed attempts never reveal answer keys. Keys come back only on a pass or once the task is done. Writes from attempts are capped per day.
- Build output folders (`.next`, `.next-e2e`, `.next-*`) are git-ignored. Use your own `NEXT_DIST_DIR` and port when building in parallel.

## Env and deploy rules
- Env template: `.env.example`. `NEXT_PUBLIC_*` values are inlined at build time, so rebuild after changing them.
- Demo mode on the server = `NEXT_PUBLIC_DEMO_MODE=true` AND (not production OR runtime `DEMO_MODE=true`). Use `isDemoMode()` from `lib/supabase/env.ts`. Demo accounts are refused when demo mode is off.
- Production requires `DEMO_SESSION_SECRET` (32+ chars). `npm run seed` refuses production without `DEMO_PASSWORD`.
- Supabase order: `0001_init.sql` → `0002_rls.sql` → `npm run seed` → `npm run embed:sops`. Region: eu-west-1.
- Never deploy, push or publish without the owner's go-ahead.

## Known shortcuts (demo)
- Shared demo password with a public default; quick-login cards and time-skip in demo mode.
- Memory mode: no RLS, state resets on restart.
- The SQL migrations have not been run against a live Supabase project yet.
- Accepted risks are listed in `docs/DEPLOY.md`.

## Credits
The onboarding research sources (Bauer et al. 2007; Cable, Gino & Staats 2013; Saks et al. 2007; Gallup 2021; Bidwell/Wharton; Piezunka & Li 2026; Brynjolfsson, Li & Raymond/Stanford GSB; McKinsey 2021/2025; Leila and Alex Hormozi) are listed with links in README.md → Credits.
