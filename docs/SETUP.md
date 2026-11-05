# Setup

For a developer running Beryll Onboard on their own machine. You need Node.js 20 or later and npm.

The app works with no keys. Steps 4 and 5 are optional and add a real database and live AI. Demo mode (step 2) is off by default, so turn it on to sign in.

## 1. Install and run

1. Install packages: `npm install`
2. Copy the env template: `cp .env.example .env.local`
3. In `.env.local`, set `NEXT_PUBLIC_DEMO_MODE=true`. (See step 2 for why.)
4. Start the app: `npm run dev`
5. Open http://localhost:3000.

You are now on the in-memory store. Data resets when the server restarts. AI answers use scripted fallbacks.

## 2. Sign in with a demo account

Demo mode is **off by default**. The in-memory store only has demo accounts, so with demo mode off nobody can log in. Set `NEXT_PUBLIC_DEMO_MODE=true` in `.env.local` and restart.

With it on, click a **Demo quick login** card on the sign-in page. The cards show only in demo mode.

When demo mode is off, demo accounts are refused even with the right password.

| Role | Name | Email |
|---|---|---|
| Hire | Alex Byrne | `hire@beryll.demo` |
| Manager | Siobhán Kelly | `manager@beryll.demo` |
| Buddy | Marco Rossi | `buddy@beryll.demo` |

More hires sit under the manager, so the team view has something to show. You can sign in as them with the email and password form.

| Name | Email | Where they are |
|---|---|---|
| Aoife Brennan | `aoife@beryll.demo` | Pre-boarding |
| Luca Ferrari | `luca@beryll.demo` | Week 2 (day 9) |
| Sofia Andersson | `sofia@beryll.demo` | Day 22, close to certification |
| Tomás Herrera | `tomas@beryll.demo` | Day 45, already certified |
| Nadia Haddad | `nadia@beryll.demo` | Day 78, flagged at risk |

The password for every demo account is `DEMO_PASSWORD` from your env. If it is blank, the default in `content/demo.ts` is used. That default is public (it is in the repo), so set your own on anything shared.

## 3. Use the demo time-skip

Hires move through the program by day. To see later stages without waiting, use the **Demo time-skip** control on a hire's screens. It shows only in demo mode and only on demo accounts.

- **+1 day** and **+7 days** move the program day forward.
- **Jump to stage** moves to the start of a stage.
- **Reset** puts the demo hire back to how the seed left them: the starting day, stage and task progress, quiz attempts, review queue, walkthrough runs, XP and trophies. It is not just the day. It does not touch other people's data, and it only works on demo hires.

Under the hood, each hire has a start date plus a day offset. The control changes the offset. All unlocks, check-ins and pulses read the program day from `getProgramDay()`.

## 4. Optional: live AI with OpenAI

1. Create an API key at platform.openai.com.
2. In `.env.local`, set `OPENAI_API_KEY=<your key>`.
3. Optional: change `OPENAI_MODEL` (default `gpt-4.1-mini`) or `OPENAI_EMBED_MODEL` (default `text-embedding-3-small`).
4. Restart `npm run dev`.

Never add `NEXT_PUBLIC_` to this key. It must stay on the server.

Check it worked: open http://localhost:3000/api/health. You should see `"aiMode":"live"`. With no key it says `"fallback"`.

Each user has a daily limit per AI feature. If a live call fails, that feature uses its fallback for 60 seconds.

Other daily caps stop answer guessing:

- Quizzes: 10 tries per quiz a day (Dublin day).
- Labs: 20 attempts per task a day (UTC day).
- Walkthroughs: 20 saved runs per walkthrough and mode a day (UTC day).

A failed quiz attempt does not reveal the answers. They show once the quiz is passed.

## 5. Optional: Supabase (EU region)

Without these steps the app stays on the in-memory store.

1. Create a project at supabase.com. Choose the EU region **West Europe (Ireland), `eu-west-1`**.
2. Go to **Authentication > Providers > Email**.
3. Keep Email enabled. Turn **off** "Allow new users to sign up".
4. Turn **off** "Confirm email".
5. Go to **SQL Editor**. Paste and run `supabase/migrations/0001_init.sql`. Wait for it to finish.
6. Paste and run `supabase/migrations/0002_rls.sql`. Run 0001 first, always.

   **Warning:** these migrations have never been run against a real Supabase project. 0001 and 0002 were edited in place (manager-only notes now live in a new `manager_notes` table; quests, pulses and kudos are locked down). Treat the first run as a test and read any SQL error carefully.
7. Go to **Project Settings > API**. Copy the project URL, the `anon` key and the `service_role` key.
8. In `.env.local`, set:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://<ref>.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key>
   SUPABASE_SERVICE_ROLE_KEY=<service_role key>
   ```
9. Set `NEXT_PUBLIC_DEMO_MODE=true` in `.env.local` if you want demo accounts to work. The seed records this choice in the database.
10. Load the demo users and data: `npm run seed`
11. Build the Ask Beryl search index: `npm run embed:sops`. This needs `OPENAI_API_KEY` as well. Without it, Ask Beryl falls back to keyword search.
12. Restart `npm run dev`.

The order is always: 0001, 0002, seed, embed.

Check it worked: http://localhost:3000/api/health should show `"dataMode":"supabase"`.

Notes:

- `SUPABASE_SERVICE_ROLE_KEY` is needed on the server for all progress writes (tasks, quizzes, scores, XP, trophies, certifications). Without it, those writes fail.
- `npm run seed` is safe to run again. It resets the demo accounts to their starting state.
- `npm run seed` refuses to run in production (`NODE_ENV` or `VERCEL_ENV` = `production`) unless `DEMO_PASSWORD` is set. Use the same value on Vercel.
- Turning demo off on a live database also needs this in the SQL Editor: `update public.app_settings set value = 'false' where key = 'demo_mode';`
- `NEXT_PUBLIC_` values are inlined when the app builds. Rebuild after changing them.
- More on access rules: [supabase/README.md](../supabase/README.md).

## 6. Run the checks

```bash
npm run lint
npm test
npm run build
npm run test:e2e
```

- `npm run test:e2e` builds the app into `.next-e2e` and serves it on port 3210. It sets its own env (`NEXT_PUBLIC_DEMO_MODE`, `DEMO_MODE`, a session secret, no Supabase, no OpenAI), so your `.env.local` does not matter. If Playwright says a browser is missing, run `npx playwright install` once.
- `PW_REUSE=1 npm run test:e2e` reuses a server that is already running. This is faster, but in-memory state then leaks between runs. Restart the server if a test fails oddly.
- The bundle-leak test (`lib/ai/bundle-leak.test.ts`) scans `.next/static`. Run `npm run build` first, then `npm test`. With no build it is skipped, not failed. The e2e build goes to `.next-e2e`, so it does not count.

## Troubleshooting

| Problem | Likely cause and fix |
|---|---|
| No login cards or time-skip | `NEXT_PUBLIC_DEMO_MODE` is not `true`. Set it in `.env.local` and restart. Demo mode is off by default. |
| "Invalid login" on a demo account | Demo mode is off, the password is wrong, or in Supabase mode `npm run seed` has not run. Demo accounts are refused when demo mode is off. Check `NEXT_PUBLIC_DEMO_MODE`, `DEMO_PASSWORD`, then seed. |
| Demo works on `npm run dev` but not `npm run start` | `npm run start` is production. It also needs `DEMO_MODE=true` in the environment. |
| `npm run seed` says it refuses to seed in production | Set an explicit `DEMO_PASSWORD`. Use the same value on Vercel. |
| Changed an env var, nothing happened | Restart the dev server. For `NEXT_PUBLIC_` values in a build, rebuild. |
| `npm run seed` says keys are missing | It needs `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in `.env.local`. |
| Migration 0002 fails | Run `0001_init.sql` first. |
| Progress will not save in Supabase mode | `SUPABASE_SERVICE_ROLE_KEY` is missing or wrong. |
| Cannot sign in as a new user | Sign-ups are off by design. Accounts come from `npm run seed` or the Supabase dashboard. |
| `/api/health` says `"aiMode":"fallback"` | No `OPENAI_API_KEY`, or a live call failed recently. Wait 60 seconds and retry. |
| `/api/health` says `"dataMode":"memory"` | The two public Supabase variables are missing. |
| Ask Beryl gives weak answers | Run `npm run embed:sops`, or accept keyword search. |
| Everything reset | You are on the in-memory store. A server restart clears it. |
| Port 3000 in use | `npm run dev -- -p 3001` |
| Playwright cannot find a browser | `npx playwright install` |
