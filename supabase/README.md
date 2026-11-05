# Supabase setup (Beryll Onboard)

The app runs **without** Supabase: if `NEXT_PUBLIC_SUPABASE_URL` or `NEXT_PUBLIC_SUPABASE_ANON_KEY` is missing, `lib/data` uses a seeded in-memory store and a demo-only signed-cookie session (every seeded account uses `DEMO_PASSWORD` from env, or `DEMO_PASSWORD` in `content/demo.ts` when unset). Follow these steps to switch to Supabase.

## 1. Create the project
1. Create a project at supabase.com (region: `eu-west-1`, Ireland).
2. **Authentication → Providers → Email**: keep Email enabled and turn **off** "Allow new users to sign up". All accounts are created by the seed script or an admin.
3. **Authentication → Providers → Email**: turn off "Confirm email" (the seed marks demo users as confirmed either way).

## 2. Run the migrations
In **SQL Editor**, run these files in order (or use `supabase db push` if you add the CLI later):
1. `supabase/migrations/0001_init.sql`: tables, pgvector, `match_sop_chunks()`, profile trigger
2. `supabase/migrations/0002_rls.sql`: RLS policies, helper functions, RPCs

## 3. Set env vars
In `.env.local` (and in Vercel → Project → Settings → Environment Variables):
```
NEXT_PUBLIC_SUPABASE_URL=https://<ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key>
SUPABASE_SERVICE_ROLE_KEY=<service role key>   # server/scripts only, never NEXT_PUBLIC
DEMO_PASSWORD=<password for the demo accounts>  # REQUIRED when seeding with NODE_ENV/VERCEL_ENV=production; else defaults to content/demo.ts
NEXT_PUBLIC_DEMO_MODE=true                      # shows quick-login cards + time-skip
DEMO_MODE=true                                  # production only: runtime switch, read by the server on every request
```
Demo mode is on when `NEXT_PUBLIC_DEMO_MODE=true` and, in production, also `DEMO_MODE=true` (`isDemoMode()` in `lib/supabase/env.ts`, read at runtime). While it is off, demo accounts (`app_metadata.is_demo = true`) are refused at sign-in and existing demo sessions are treated as signed out by middleware, because their shared password is in the repo.

Postgres can't read the app env, so `npm run seed` also writes the same decision to `app_settings` (`key = 'demo_mode'`). `set_demo_day_offset()` refuses unless that row is `true`. To turn demo time-skip off on a live database without re-seeding: `update public.app_settings set value = 'false' where key = 'demo_mode';`.
`NEXT_PUBLIC_*` values are inlined at build time, so rebuild/redeploy after changing them.

## 4. Seed
Run `npm run seed` (`scripts/seed.ts`). It reads `.env.local`, needs `NEXT_PUBLIC_SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY`, and exits cleanly with a message when they are missing.

It calls `seedSupabase(admin)` in `lib/data/seed.ts`, which builds everything from `content/demo.ts` (`buildDemoData(today)`) and `content/demo-contracts.ts`:
- auth users created with the `DEMO_IDS` ids (`app_metadata.role`, `app_metadata.is_demo`, confirmed email, shared demo password), then profiles and the staff directory are upserted;
- the demo hires' history (task/stage progress, check-ins, pulses, certifications, XP, trophies, quests, kudos, shadow logs, scorecard, a copy of the 10 sample contracts each) is reset and re-upserted with stable ids.

It is idempotent: running it again gives the same state (and resets anything changed during a demo). The in-memory store is built from the same `buildSeed()`.

## How auth and roles work
- The role lives in two places that must agree: `auth.users.raw_app_meta_data.role` (read by middleware, no DB call) and `profiles.role` (read by RLS). Only an admin/service role can set either.
- New auth users get a `profiles` row from the `on_auth_user_created` trigger.

## RLS summary
| Who | Can |
|---|---|
| Hire | read/write own rows in hire-owned tables (contracts, quests (never pre-confirmed; only unconfirmed ones can be deleted), shadow logs, matcher profile, SOP suggestions, program reviews); read-only on `pulses` (the server inserts them after checking the program day); **read-only** on the server-written tables `stage_progress`, `task_progress`, `quiz_attempts`, `review_queue`, `walkthrough_runs`, `roleplay_sessions`, `scorecard_items`, `certifications`, `xp_events`, `trophies_earned`; cannot change role/manager/buddy |
| Manager | read every row of hires where `profiles.manager_id = auth.uid()`; read/write `manager_notes` for those hires; write `checkins`, `certifications`; QA via `set_task_qa()`; time-skip demo hires via `set_demo_day_offset()` (demo mode only) |
| Buddy | `buddy_hire_summary()` (limited fields), `buddy_matcher_profile()` (only the interests the hire made visible; no direct read of `matcher_profiles`), read the hire's `quests`, confirm via `confirm_quest()` |
| Buddy, manager, hire | send kudos (`from_id`, `to_id`, `message` only): buddy/manager to their hire, hire to their own manager or buddy |
| Any signed-in user | read `staff_directory`, `sop_chunks`, `match_sop_chunks()` |
| anon | nothing |

Writes to `staff_directory` and `sop_chunks` need the service role (seed and `scripts/embed-sops.ts`).

Scored and completion rows (stage/task progress, quiz attempts, the spaced-repetition `review_queue`, walkthrough runs, role-play sessions, certifications, `scorecard_items`) are written the same way: `progress()` in `lib/data/supabase.ts` checks the caller is the hire or the hire's manager, then writes with the service role. A hire holding their own JWT and the public anon key therefore cannot mark tasks done, set scores or fake a certification through PostgREST.

XP and trophy awards also need the service role: `addXpEvent`/`awardTrophy` in `lib/data/supabase.ts` first check through RLS that the caller can see the hire (the hire, their manager or buddy), then insert with the service-role client. So `SUPABASE_SERVICE_ROLE_KEY` must be set on the server (Vercel) as well as for scripts.

Contract `status` is limited to `draft | legal_review | engineer_signoff | sent | signed` by a check constraint.

Role-play transcripts are held server-side: `/api/ai/roleplay` creates an `active` row, appends each turn through `append_roleplay_turns()` (granted to `service_role` only; one UPDATE checks owner, status and the 12-turn limit) and grades only the stored transcript when it marks the row `ended`. A hire can read but never write their sessions, so certification can't be faked by posting a transcript.

Manager-only notes (check-in notes, QA notes, the free text of a certification observation) live in `manager_notes` (`subject` = `checkin:<day>`, `qa:<task>` or `cert:<stage>:notes|note`), never on the hire-readable `checkins`, `task_progress` or `certifications` rows (a check constraint keeps `notes`/`note` out of `certifications.manager_observation`). Only the hire's manager has policies on it; `lib/data/supabase.ts` merges the notes back in for manager screens.

`app_settings` has RLS on and no policies: only the service role and definer functions (`demo_mode_enabled()`) read it.
