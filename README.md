# Beryll Onboard

An interactive, research-based employee onboarding platform. This demo takes a new **Business Development Manager** at **Beryll Cyber Security** (a fictional firm in Dublin) from pre-boarding to month 12. On the way they get lessons, quizzes, a practice contracts app with guided walkthroughs, labs, AI client role-play, a certification gate and trophies. Their manager and buddy follow their progress in their own views.

It runs with **no keys at all**, using a seeded in-memory store and scripted AI fallbacks. Adding Supabase and an OpenAI key turns on a real database and live AI.

> All company data, people and clients are made up. This is a demo, not a production HR system.

---

## Who it's for

| Business type | What it takes off their plate |
|---|---|
| Cyber security and IT services firms | Teaching non-technical hires (sales, BD, account managers) the services, the engagement lifecycle and the "never test without signed authorisation" rule before they talk to clients |
| Professional services (consulting, legal, accounting) | Turning SOPs, templates and approval rules into practice with walkthroughs, instead of a folder of PDFs |
| Agencies and B2B service businesses with client-facing roles | Certifying that a hire can handle a client conversation (via AI role-play plus manager sign-off) before they work solo |
| Small and mid-sized firms without an L&D team | A structured 30/60/90 journey, check-in reminders and at-risk alerts, so onboarding doesn't depend on one busy manager remembering everything |
| HR and People teams | One place to see every new hire's stage, pulse scores and overdue check-ins, with research-backed reasons for each step |

## How it creates value

- **Shorter ramp-up.** Hires practise real tasks (drafting a SOW, moving a contract through approvals, reviewing a client's contract) in a safe copy of the tool, with Watch, Guided and Solo modes, before doing them for real.
- **Fewer costly mistakes.** Risky clauses, data-handling slips and testing without authorisation are rehearsed in labs first. Client contact is gated behind a certification.
- **Early warning on people who might quit.** Low pulse scores, missed check-ins, stalled stages and inactivity raise a flag for the manager with a suggested action, while there's still time to fix things.
- **Less manager time.** Check-ins, agendas, a scoring rubric and QA sampling are built in. The "Ask Beryl" coach answers SOP questions with citations, so managers aren't the only source of answers.
- **Better belonging.** The interest matcher, meet-the-team quests, a buddy space and a kudos wall help hires build relationships. The research ties feeling connected to staying.

The research behind each feature is listed under [Credits](#credits). No statistics are invented here; the effects reported in that research come from other firms and settings, so measure your own baseline.

---

## Features

**New hire**
- **Today and Roadmap.** Today shows only the next 1–3 tasks; the roadmap shows seven stages (pre-boarding → day 1 → weeks 1–2 → days 15–30 → 31–60 → 61–90 → months 4–12), each with a plain "done means…".
- **Lessons with animated explainers:** the engagement lifecycle, service types, incident response, and data classification (as a drag-and-drop exercise).
- **Scenario quizzes** with spaced repetition. Missed questions come back after 3, 10 and 30 days.
- **Beryll Contracts:** a practice contracts app with a contract list, clause builder, approval board (with real rules) and review view. Three walkthroughs run on top of it.
- **Labs:** redline lab, the "never test without a signature" branching story, data-handling drills, translator drills (engineer findings → CEO language), SOW check, security setup and a phishing simulation.
- **AI client role-play** (text) against personas, scored against a 6-part rubric.
- **Certification:** a fixed AI role-play *and* a manager observation must both pass. Passing unlocks the day-30 PDF certificate.
- **People:** people map, quests confirmed by colleagues, kudos, shadow log, and an **AI interest matcher** that suggests three colleagues to meet, each with an icebreaker.
- **Ask Beryl:** a coach that answers only from company SOPs, with citations, and points you to your buddy when it doesn't know.
- **Rewards:** XP, levels, 15 trophies, streaks, and ranks (Observer → Co-pilot → Solo → Independent). No leaderboard.
- Pulses (days 7/30/90), check-ins, checklists, a "Fix one SOP" mission, a day-90 programme review and a day-90 certificate.

**Manager:** cohort KPIs, every hire at a glance, risk flags with suggested actions, check-ins, the certification rubric, QA sampling, and day-90 sign-off.

**Buddy:** a limited view of their hire, a buddy checklist, and quest confirmations, which award the hire XP.

**Demo extras:** quick-login cards, five seeded dummy hires at different stages (one flagged at risk), a time-skip control, and a full demo reset.

### Architecture

```
                 Browser (light/dark glass UI)
                           │
                Next.js 15 App Router (Vercel)
   ┌───────────────────────┼─────────────────────────────┐
   │ middleware.ts         │ Server Components +         │ Route handlers
   │ (session + role       │ Server Actions              │ /api/ai/{roleplay,coach,
   │  routing)             │ (hire / manager / buddy)    │  grade,matcher}
   │                       │                             │ /api/certificate/[stage]
   └───────────┬───────────┴──────────────┬──────────────┴───────────┬───────────
               │                          │                          │
        lib/logic (pure rules:     lib/data Repository        lib/ai (server-only)
        program day, unlocks,      ├─ memory store (no keys)  ├─ OpenAI (live)
        XP, trophies, at-risk,     └─ Supabase (Postgres,     └─ scripted fallbacks
        scoring)                      RLS, pgvector)          lib/pdf (react-pdf)
               │
        content/ (stages, tasks, lessons, quizzes, labs, SOPs, personas, demo data)
        content/server/ (answer keys, rubrics, persona secrets: server-only)
```

An illustrated version is in [docs/architecture.html](docs/architecture.html).

## Project structure

```
app/
  (auth)/          sign-in and sign-out
  (hire)/          today, roadmap, learn, quiz, contracts, labs, practice,
                   certification, people, me, pulse, checklist, missions, review
  (manager)/       team and hire detail
  (buddy)/         buddy home
  api/             AI routes, PDF certificates, health check
  styleguide/      design kit preview
components/        ui (glass kit), brand, app shell, contracts, walkthrough, labs,
                   practice, explainers
content/           all journey content + demo data (answer keys in content/server/)
lib/               types.ts, logic/, data/, ai/, pdf/, supabase/
scripts/           seed.ts, embed-sops.ts
supabase/          SQL migrations + setup notes
tests/             e2e (Playwright) and persona test reports
docs/              SETUP, DEPLOY, API_CONTRACTS, architecture.html,
                   planning/spec-and-decisions.md (spec, decisions, build plan)
```

---

## Setup guide

### Fastest path: run the demo locally (no accounts needed)
1. Install **Node.js 20+** (22 LTS recommended) and git.
2. Clone and install:
   ```bash
   git clone https://github.com/daboss777x/beryll-onboard.git
   cd beryll-onboard
   npm install
   ```
3. Create your env file: `cp .env.example .env.local`
4. In `.env.local`, set `NEXT_PUBLIC_DEMO_MODE=true`. Demo mode is **off by default**, and without it nobody can sign in to the in-memory store.
5. Start it: `npm run dev`, then open http://localhost:3000.
6. Click a **Demo quick login** card (Hire: Alex Byrne · Manager: Siobhán Kelly · Buddy: Marco Rossi).
7. As the hire, use the **time-skip** control to jump ahead and see later stages. As the manager, open Nadia to see an at-risk flag.

Data resets when the server restarts. The AI features answer with scripted fallbacks.

### Add live AI (OpenAI)
8. Create an API key at https://platform.openai.com/api-keys.
9. Set `OPENAI_API_KEY=` in `.env.local`. Never prefix it with `NEXT_PUBLIC_`. Optionally change `OPENAI_MODEL` / `OPENAI_EMBED_MODEL`.
10. Restart, then check http://localhost:3000/api/health. It should show `"aiMode":"live"`.

### Add a real database (Supabase)
11. Create a project at https://supabase.com, in the region **West Europe (Ireland)**.
12. Go to Authentication → Providers → Email: keep Email enabled, turn **off** "Allow new users to sign up" and turn **off** "Confirm email".
13. In the SQL Editor, run `supabase/migrations/0001_init.sql`, **then** `0002_rls.sql`.
    These migrations have not yet been run against a live project. Treat the first run as a test.
14. From Project Settings → API, copy the URL, the `anon` key and the `service_role` key into `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` and `SUPABASE_SERVICE_ROLE_KEY`.
15. Set your own `DEMO_PASSWORD` and a 32+ character `DEMO_SESSION_SECRET` (`openssl rand -base64 32`).
16. Load the demo data: `npm run seed`. Then build the Ask Beryl index: `npm run embed:sops` (needs the OpenAI key).
17. Restart, and check that `/api/health` shows `"dataMode":"supabase"`.

### Test it
18. Run the checks:
    ```bash
    npm run lint
    npm run build
    npm test                 # unit tests, incl. a client-bundle secret-leak scan (run after build)
    npx playwright install   # once
    npm run test:e2e         # browser tests on their own build and port
    ```

### Deploy (Vercel)
19. Import the repo at https://vercel.com/new.
20. Add the env vars from `.env.example` in Project → Settings → Environment Variables. For a public demo, also set `DEMO_MODE=true`; production requires both demo flags.
21. Deploy. Then open `/api/health` on the live URL.

Full details and troubleshooting: [docs/SETUP.md](docs/SETUP.md) · [docs/DEPLOY.md](docs/DEPLOY.md) · [supabase/README.md](supabase/README.md) · [docs/API_CONTRACTS.md](docs/API_CONTRACTS.md).

---

## Customise it for your own business

| What | Where |
|---|---|
| Company name, logo, colours | `components/brand/`, tokens in `app/globals.css` |
| Stages, timeline, exit criteria | `content/stages.ts` |
| Tasks, XP, unlock days | `content/tasks.ts` |
| Lessons and branching stories | `content/modules/` |
| Quizzes (questions public, answers server-only) | `content/quizzes/` + `content/server/quiz-keys.ts` |
| Labs, drills, phishing email | `content/labs/` + `content/server/` |
| SOPs used by Ask Beryl | `content/sops/` (then `npm run embed:sops`) |
| AI client personas and the certification rubric | `content/personas/` + `content/server/persona-secrets.ts`, `rubric.ts` |
| Staff directory for the people map and matcher | `content/staff.ts` |
| Demo hires and contracts | `content/demo.ts`, `content/demo-contracts.ts` |
| Contract approval rules | `components/contracts/rules.ts` |
| Walkthrough steps | `content/walkthroughs/` |
| Trophies, ranks, XP curve, at-risk thresholds | `lib/logic/` |
| AI model and rate limits | `OPENAI_MODEL` env var, `lib/ai/guard.ts` |
| A new role (e.g. engineer, SOC analyst) | new stages, tasks and content in `content/`; the engine is role-agnostic |

## Security notes before real use

This is a demo. Before any real deployment:

- **Demo shortcuts.** Demo accounts share one password (`DEMO_PASSWORD`, with a default that is public in this repo), and the quick-login cards and time-skip control are exposed in demo mode. Keep `NEXT_PUBLIC_DEMO_MODE` / `DEMO_MODE` off for anything real.
- **The in-memory mode has no row-level security** and trusts its server code. It's for local demos only.
- **The demo session cookie** (memory mode) is HMAC-signed. Production requires a 32+ character `DEMO_SESSION_SECRET`.
- **The Supabase migrations are untested on a live project.** Review the RLS policies in `0002_rls.sql` and test them before storing real data.
- **The AI handles personal data.** The matcher stores interests the hire shares. In a real deployment, review GDPR obligations (lawful basis, retention, a DPA with OpenAI) and consider EU data residency.
- **Answer keys, rubrics and the OpenAI key** stay server-side (`server-only`). A test scans the client bundle for leaks, so keep it in CI.
- Daily caps limit answer-guessing and AI spend. Tune them in `lib/ai/guard.ts` and the server actions.
- Accepted demo risks are listed in [docs/DEPLOY.md](docs/DEPLOY.md#security-accepted-risks).

## Credits

**Onboarding research the journey is built on** (from the project's research brief):
- Bauer, T. N., et al. (2007). Newcomer adjustment during organizational socialization: a meta-analysis. *Journal of Applied Psychology*. https://pubmed.ncbi.nlm.nih.gov/17484552/
- Cable, D. M., Gino, F., & Staats, B. R. (2013). Reinventing Employee Onboarding. *MIT Sloan Management Review*. https://sloanreview.mit.edu/article/reinventing-employee-onboarding/ (the "best self" exercise)
- Saks, A. M., et al. (2007): socialization tactics meta-analysis, summary: https://scienceforwork.com/blog/socialization-tactics/
- SHRM Foundation / Bauer: the four Cs of onboarding. https://humaninterest.com/learn/articles/new-hire-onboarding-compliance-clarification-culture-connection/
- Realistic job previews research summary. https://www.qic-wd.org/sites/default/files/Umbrella%20Summary%20-%20RJP_3.pdf
- Allen et al. (2004), mentoring meta-analysis. https://pubmed.ncbi.nlm.nih.gov/14769125/ · Eby et al. (2008). https://digitalcommons.usf.edu/psy_facpub/23/
- Rollag, Parise & Cross (2005). Getting New Hires Up to Speed Quickly. *MIT SMR*. https://store.hbr.org/product/getting-new-hires-up-to-speed-quickly/SMR159
- Gallup (2021), practices for better employee onboarding. https://www.gallup.com/workplace/353096/practices-for-better-employee-onboarding.aspx
- Bidwell, M., Knowledge at Wharton: external hires (2012) https://knowledge.wharton.upenn.edu/article/why-external-hires-get-paid-more-and-perform-worse-than-internal-staff/ and onboarding best practices (2025) https://knowledge.wharton.upenn.edu/article/onboarding-best-practices-maximum-value-from-new-hires/
- Piezunka & Li (2026), Here's the Best Way to Onboard a Manager. https://knowledge.wharton.upenn.edu/article/heres-the-best-way-to-onboard-a-manager/
- Brynjolfsson, Li & Raymond, via Stanford GSB (2023): generative AI and customer-support productivity. https://www.gsb.stanford.edu/insights/generative-ai-can-boost-productivity-without-replacing-workers
- Jacobi & Chenoweth (2025), From orientation to impact. *McKinsey*. https://www.mckinsey.com/featured-insights/people-in-progress/from-orientation-to-impact-rethinking-how-we-prepare-new-hires
- McKinsey (2021), The great attrition stems from a great disconnect. https://www.mckinsey.com/featured-insights/week-in-charts/the-great-attrition-stems-from-a-great-disconnect
- Sweller (1988), cognitive load theory.
- Leila Hormozi, "The 5C's of Employee Onboarding" https://www.youtube.com/watch?v=XUSfz-3gLqM and "Employee Onboarding Hacks" https://www.youtube.com/watch?v=mQUInhCBvr4. Alex Hormozi, "The SIMPLE Managerial Framework" https://www.youtube.com/watch?v=IMowPVgcWbA (practitioner advice, not peer-reviewed).

**Built with** Next.js, React, Tailwind CSS, Framer Motion, dnd-kit, Supabase, OpenAI, react-pdf, Zod, lucide-react, Vitest and Playwright. Designed and built with Claude Code.
