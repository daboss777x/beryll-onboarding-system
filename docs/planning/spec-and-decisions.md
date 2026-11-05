# Beryll Cyber Security Onboarding System: Brainstorm / Discovery Notes
Date: 2026-11-03 · Goal: Pin down the features, scope, AI elements and build decisions for an interactive onboarding platform (first role: Business Development Manager), grounded in onboarding-research.md.
Status: complete (grill-me Q1–Q16)
Context sources: onboarding-research.md (pasted by user); project folder is empty (no code yet)


---

## Part A: Draft job description (assistant draft, needs user review)

**Business Development Manager, Beryll Cyber Security**
Location: Dublin, Ireland (hybrid) [user: "somewhere inside Europe"; Dublin is the assistant's pick] · Reports to: Managing Director / Head of Commercial [assumed] · Type: Full-time

**About Beryll.** Beryll Cyber Security helps organisations across Europe find and fix security weaknesses before attackers do: penetration testing, vulnerability assessments, security audits and compliance readiness, managed security monitoring, and staff awareness training. [service list assumed; confirm]

**The role.** You are the bridge between our clients and our cyber engineers. You win and grow client relationships, turn what clients need into clear, well-scoped, legally sound contracts, and make sure engineers can deliver what was promised and clients understand what they received.

**What you'll do**
1. *Contracts.* Draft proposals, NDAs, master service agreements (MSAs), statements of work (SOWs) and rules-of-engagement / authorisation-to-test letters from approved templates. Review client-supplied contracts for risk (liability caps, indemnities, data-protection clauses, payment terms, scope creep) and escalate to legal when needed. Manage all of it in Beryll's contract management system, from draft to signature to renewal.
2. *Client relationships.* Own a set of client accounts: regular check-ins, quarterly reviews, renewals and upsells. Be the first contact for questions, concerns and complaints, and escalate according to the escalation matrix.
3. *Scoping with engineers.* Run scoping calls together with engineers; turn technical scope (IP ranges, applications, testing windows, exclusions) into commercial terms; make sure no testing starts without a signed authorisation.
4. *Communication.* Translate engineering findings and report summaries into language executives can understand; keep clients updated on project progress; manage expectations when a timeline or scope changes.
5. *Pipeline and growth.* Qualify leads, keep the CRM current, prepare tender/RFP responses, and represent Beryll at industry events.
6. *Confidentiality and compliance.* Handle client data (reports, network details, findings) under Beryll's data-classification policy, GDPR (data processing agreements, international transfers) and NIS2 obligations where clients are in scope.

**What success looks like (90-day scorecard draft)**
- Day 30: certified for solo client contact; can independently draft an NDA and SOW from templates.
- Day 60: managing 3–5 accounts solo with QA-sampled communications at or above standard; one contract reviewed end to end.
- Day 90: a renewal or new SOW closed; one improvement to an SOP or template proposed.

**You'll bring**
- 3+ years in B2B business development, account management or contract administration, ideally in IT, telecoms, fintech or professional services.
- Strong drafting and contract-reading skills; comfort with commercial terms.
- Enough technical curiosity to learn the difference between a pentest and a vulnerability scan (we'll teach you the rest).
- Clear, calm communication, including with stressed clients after a security incident.
- Nice to have: legal or paralegal background, cybersecurity certification (e.g. ISC2 CC, Security+), experience with EU public-sector tenders.

---

## Part B: Feature ideas mapped to the research (assistant suggestions)

Legend: ★ = user's own idea · ✚ = new suggestion · [ref] = research section it implements

### 1. Journey spine
- ★ **Roadmap** from Step 0 to the end: Pre-boarding → Day 1 → Weeks 1–2 → Days 8–30 (certify) → 31–60 → 61–90 → quarterly to month 12 [§5]. Stages unlock in order; each has a clear "done means…" definition [4.1 role clarity].
- ✚ **"Today" view instead of the whole firehose**: shows only the next 1–3 tasks; the full map is one click away [4.6 information load].
- ✚ **Living 30/60/90 scorecard**: agreed with the manager in week 1, visible on the dashboard, reviewed at each check-in [4.1, 4.7].

### 2. Pre-boarding and Day 1
- ✚ **Welcome page before day 1**: short video/message from manager and buddy, day-one schedule, tracker for paperwork checklist (contract, PPS number/payroll, right-to-work, equipment) [§5 pre-boarding].
- ✚ **Realistic job preview, "A week as a Beryll BDM"**: an interactive story showing a real mix of tasks, including the hard parts (a client angry about a critical finding, procurement pushing on price) [4.4 RJP].
- ✚ **Day-1 "Three Things" card**: who we serve, what good looks like, who to ask. Nothing else is required on day 1 [§5 Day 1].
- ✚ **"Best Self" story**: hire writes about a moment they were at their best; it is shared with their team; earns a personalised badge [4.3 Wipro: 32% retention lift].

### 3. Learning the business (show → do → repeat)
- ★ **Contract-software simulator**: screenshots with clickable hotspots, drag-and-drop (e.g. drag clauses into a SOW, drag a contract to the "Legal review" column). Three modes: **Watch** (narrated demo) → **Guided** (hints) → **Solo** (no hints, scored) [Hormozi 3Ds, 4.9 practice].
- ★ **Animated explainers**: how a pentest engagement flows (lead → scoping → SOW → authorisation → testing → report → retest → renewal); pentest vs. vuln scan vs. red team vs. SOC; incident response; data classification policy.
- ✚ **Contract Redline Lab**: sample client contracts with planted risks (unlimited liability, no authorisation clause, client data transferred outside the EU without safeguards, 120-day payment terms). Hire highlights and annotates; AI and a stored answer key give feedback.
- ✚ **"Never test without a signature" scenario**: the critical cyber-specific rule. A branching story where skipping the authorisation letter causes a legal incident (unauthorised access offence under national computer-crime law). Required pass.
- ✚ **Glossary with tap-to-define**: every cyber term in any lesson links to a plain-English definition.

### 4. AI features
- ✚ **AI Client Role-play Simulator**: AI plays personas (a hurried bank CISO, a price-focused procurement officer, a panicked SME owner after a breach, an NGO with a tiny budget). Voice or text. Scored against the certification rubric (accuracy, tone, escalation, data handling, no over-promising) [4.9 simulations, §5 certification].
- ✚ **AI "Engineer ↔ Client Translator" drills**: AI gives a raw engineer finding ("SQLi in /login, CVSS 9.8"); hire rewrites it for a CEO; AI critiques. Then the reverse: turn a vague client request into a scope engineers can act on.
- ✚ **AI onboarding coach ("Ask Beryl")**: answers questions only from the SOP hub and cites the source; says "ask your buddy, X" when it doesn't know. Makes "who to ask" easy without replacing the human buddy [4.5, 4.9 Stanford AI-assist study].
- ✚ **AI contract-drafting sandbox**: hire drafts an SOW from a fictional client brief; AI checks it against the template checklist (scope, exclusions, timeline, authorisation, liability, payment).
- ✚ **AI quiz generator + spaced repetition**: key facts come back on days 3, 10 and 30 [4.6 repetition].

### 5. People and connection
- ✚ **People map / "Meet the team" quests**: org chart with faces; quests like "have coffee with 2 engineers", "sit in on a scoping call"; ticked off by the other person, not self-reported [4.5 Rollag/Bidwell relational].
- ✚ **Buddy space**: buddy (outside reporting line) gets their own checklist and twice-weekly prompts [§5].
- ✚ **Shadow log**: score sheet for 5+ real client interactions, debriefed with buddy [§5 weeks 1–2].
- ✚ **Kudos wall**: peer and founder recognition, both formal and spontaneous [4.10 Leila].
- Keep social items optional where possible [4.8 Piezunka: don't force everything].

### 6. Assessment and certification
- ★ **Stage quizzes** (scenario-based, not trivia).
- ✚ **Certification gate**: AI role-play pass + manager live observation using the same rubric → unlocks "Solo client contact" badge. Failure → coaching plan + retest [§5 days 8–30].
- ✚ **Staged progression badges**: Observer → Co-pilot → Solo (with QA) → Independent.
- ✚ **QA sampling (days 31–60)**: manager scores 1 in 5 real client emails/calls in the app [§5].

### 7. Feedback loops
- ✚ **Pulse check-ins on days 7, 30 and 90**: clarity, confidence and belonging, each rated 1–5 [§7].
- ✚ **Check-in scheduler with agendas**: day 1, week 1, biweekly, 30/60/90; manager is reminded and can't skip silently [4.7].
- ✚ **"Fix one SOP" mission**: hire proposes one improvement (days 31–60); it goes to the SOP owner [§5].
- ✚ **Program review at day 90**: newcomer rates the onboarding itself [§5, §6].

### 8. Gamification
- ★ **Sign-in, trophies, XP**, tied only to meaningful milestones (certification, first solo client call, best-self story), not clicks.
- ✚ Small cohorts mean a public leaderboard can feel punishing; suggest **personal progress + team "cohort" achievements** instead.

### 9. Admin / manager view
- ★ **Admin dashboard**: each hire's stage, overdue items, quiz scores and certification status.
- ✚ **At-risk flags**: low pulse score, missed check-in, stalled stage, failed certification twice → alert to the manager [§6 pitfalls].
- ✚ **Cohort metrics** from §7: time to certification, time to scorecard, 90-day/12-month retention, process completion. Uses counts for small headcount.
- ✚ **Content builder**: admins edit lessons, quizzes, SOPs and walkthrough screenshots without code, with an owner and a review date per SOP [§6 stale SOPs].
- ✚ **Role templates**: BDM first, then engineer, SOC analyst, etc.

### 10. Cyber-firm-specific touches
- ✚ **Practice what we preach**: the hire's own security setup is a step (MFA enrolment, password manager, device encryption, clean-desk policy), plus a simulated phishing email during week 2.
- ✚ **Data-handling drills**: "Can I email this pentest report to the client's personal Gmail?" style decisions.

---

## Summary / key decisions
- Q1: Build is a working prototype/demo with mock data and a mock contract tool; it should be possible to make it production-ready later.
- Q2: The contract tool is a live mini-app built in code with a step-by-step overlay (not screenshots); the same app is used for the Watch, Guided and Solo modes.
- Q3: The AI features run live on the OpenAI API, with the key kept on the server.
- Q4: Account types are New hire (BDM), Manager and Buddy. The Manager view doubles as the admin/tracking view.
- Q5: Full roadmap visible; days 0–30 fully playable, days 31–90 lighter; demo time-skip button.
- Q6: Bundles kept: contract/cyber labs, people & belonging, feedback & at-risk. Also: dummy hires at different stages for the manager view, and an interest-based "people you should meet" matcher. The AI suite's status is still open (see Q7).
- Q7: AI features are the interest matcher, client role-play with certification scoring, the Ask Beryl coach and AI marking of lab answers.
- Q8: The role-play is text only.
- Q9: Gamification is trophies, XP, a rank ladder and streaks, with no leaderboard.
- Q10: The stack is Next.js + Supabase + Vercel, with Framer Motion and dnd-kit.
- Q11: The look is a modern glass SaaS app with a gem theme, coloured aqua, white, grey and black to feel corporate.
- Q12: Light mode is the default, with a dark toggle.
- Q13: The interest matcher is an open AI chat interview, not a quiz.
- Q14: The contract walkthroughs are Create SOW, Approval pipeline and Review client contract.
- Q15: Add downloadable PDF certificates at day 30 and day 90.
- Q16: Beryll is based in Europe (Dublin suggested). The legal frame is GDPR/NIS2.

## Q&A log
### Q1: Purpose and realism of the build
- Asked: Is this for a real Beryll rollout, or a demo/portfolio/prototype (e.g. to show a client or for a course)? Does the contract management software really exist with real screenshots?
- Captured: **Working prototype/demo.** A polished, clickable product with realistic mock data and a mock contract tool, to show a client or investor or as a portfolio piece. Should be possible to make production-ready later.
- Implication: the contract management software is mocked (we design it ourselves), and Beryll's data is fictional.

### Q2: Contract software for the walkthrough
- Asked: Since it's a demo, how should the "custom contract management software" in the walkthrough be built?
- Captured: **Live mini-app.** A small fake "Beryll Contracts" tool built in code (contract list, editor, approval board). The walkthrough highlights its real buttons and uses real drag-and-drop on it. The same app is reused for the Watch → Guided → Solo modes.

### Q3: AI features in the demo
- Asked: Should the AI features call a real model live, or be scripted?
- Captured: **"live Open AI API"**: live calls to OpenAI (user's choice, not Claude). Key kept on the server.
- Tentative / suggested: a scripted fallback if the API fails during a demo; pick the exact OpenAI model at build time.

### Q4: Which roles/users the demo covers
- Asked: Does the demo cover only the BDM journey, or does it also need manager/buddy/admin views as separate logins?
- Captured: **Three account types: New hire (BDM), Manager, Buddy.** No separate Admin/HR account.
- Tentative / suggested: the Manager view takes over the "admin view" from the original brief (tracking progress, at-risk flags, metrics). Content editing could be a Manager tab or left out of the demo.
- Flags: does the Manager need content editing in the demo? → user

### Q5: Depth of the journey in the demo
- Asked: How much of the 90-day roadmap should be fully built and playable?
- Captured: **Full map, first 30 days playable.** Every stage appears on the roadmap. Pre-boarding through the certification gate (days 0–30) is fully built. Days 31–90 have lighter content (QA sampling, scorecard review, 90-day conversation). A "demo time-skip" button jumps ahead.

### Q6: Which suggested feature bundles to keep
- Asked: Which of the assistant-suggested feature bundles (Part B) are in the demo? (The stack, interface and colours come after the features are settled, as the user asked.)
- Captured: **Kept:** Contract & cyber labs; People & belonging; Feedback & at-risk. **Not selected:** AI practice suite (role-play, translator, drafting checker, Ask Beryl).
- New from user: (1) **Dummy hires in the manager/admin view** at different stages, so tracking shows more than one person. (2) **Interest & connection matcher**: the hire is asked about situations, interests and personal details, then gets recommendations for colleagues with matching interests to meet ("Daniel likes golf too, maybe you guys can go golfing this weekend").
- Flags: ~~possible conflict over the AI suite~~ resolved in Q7 (all AI features kept).
- Tentative / suggested: the interest matcher is a natural fit for AI (matching plus a friendly intro message); it's also the relational onboarding from §4.5. Personal data should be opt-in and visible only to the colleagues it matches.

### Q7: Which AI features (resolves the Q3/Q6 conflict)
- Asked: Which AI features should the demo have?
- Captured: **All four:** Interest matcher, AI client role-play (scores the certification gate), "Ask Beryl" SOP coach, AI feedback on lab answers (Redline Lab, translator rewrites, drafted SOWs).
- Note: the translator drills from the AI suite effectively come back through "AI feedback on labs".

### Q8: Role-play mode
- Asked: Text, voice, or both for the AI client role-play?
- Captured: **Text only.** A chat with the client, like an email or WhatsApp exchange.

### Q9: Gamification style
- Asked: What kind of rewards and motivation system?
- Captured: **Trophies + XP, no leaderboard.** XP for meaningful work, a trophy case, a rank ladder (Observer → Co-pilot → Solo → Independent) and streaks. No ranking against other hires.

### Q10: Tech stack and hosting
- Asked: What should it be built with and hosted on?
- Captured: **Next.js + Supabase + Vercel.** Next.js (React) app whose server routes keep the OpenAI key secret; Supabase for sign-in and the database; Vercel hosting. Framer Motion for animation, dnd-kit for drag-and-drop.

### Q11: Brand look and colours
- Asked: Does Beryll have brand colours/logo, or do we design an identity?
- Captured: "I like the GEM thing but make it feel **modern and SAAS like with glass effects** stuff just as a GEM would be but the overall colour themes should be yes **aqua, white, grey, and black** so that it feels like corporate."
- Tentative / suggested palette: black #0A0B0D / graphite #16181D, greys #2A2E35 to #9AA3AE, white #FFFFFF / off-white #F4F6F8, aqua primary #2DD4D4 with a deeper aqua #0EA5A5 for text on light backgrounds. Frosted-glass panels (backdrop blur, thin white borders at 10–15% opacity), a faceted gem logo mark, a subtle prism/refraction gradient on hero and trophy surfaces. Gold only for trophies? → to confirm.

### Q12: Light vs dark default
- Asked: Should the app default to dark (black glass) or light (white glass), and does it need a toggle?
- Captured: **Light default + dark toggle.** White/off-white with milky grey glass and aqua accents; dark mode (black glass, aqua glow) is available as a toggle.

### Q13: Interest matcher details
- Asked: What does the hire share, and who are the colleagues being matched (in the demo, they're fictional)?
- Captured: **Open AI chat only.** A conversational interview; the AI pulls out interests, situations and preferences itself, then recommends colleagues to meet.
- Tentative / suggested: about 12 fictional Beryll staff profiles; 3 suggestions, each with a reason and an icebreaker; the hire chooses what's visible to others (opt-in).

### Q14: Contract-tool tasks to simulate
- Asked: Which tasks in the Beryll Contracts mini-app get walkthroughs?
- Captured: **Three walkthroughs:** (1) Create a SOW from a template; (2) Approval pipeline (drag the card Draft → Legal Review → Engineer Sign-off → Sent to Client → Signed); (3) Review a client contract (flag risky clauses, suggest edits, escalate to legal). **Not selected:** the authorisation & renewals walkthrough. The authorisation rule is still taught through the "Never test without a signature" lab from Q6.

### Q15: Completeness backstop
- Asked: Anything we haven't touched? (JD assumptions: Kampala hybrid, reports to MD/Head of Commercial)
- Captured: **Change JD assumptions** (details pending, see Q16) and **Add a certificate**: a downloadable PDF onboarding certificate at day 30 and at day 90. Mobile wasn't made a priority; the layout will still be responsive.

### Q16: JD corrections
- Asked: What should the location, reporting line and services be?
- Captured: Location is **"somewhere inside Europe"**. Reporting line and services not changed, so the assumptions stay.
- Tentative / suggested: **Dublin, Ireland (hybrid).** It's English-speaking, in the EU and a cyber hub. Legal frame changed from Uganda/Kenya to GDPR + NIS2; pre-boarding paperwork updated. Part A/B text updated to match.
- Flags: onboarding-research.md frames the setting as East African. The research findings carry over, but §5's local-law notes no longer apply. Exact city → user may override.

## Open flags (pending input)
- Exact European city (Dublin suggested) → user
- Reporting line and service list are still assumptions → user
- Does the Manager need content editing in the demo? → user (from Q4)
- Gold only for trophies? → user (from Q11)

---

## Part C: Full build plan

### C1. Context
Build a working demo of **Beryll Onboard**, an interactive onboarding platform for Beryll Cyber Security (fictional, Dublin, hybrid). Its first journey takes a new **Business Development Manager** from pre-boarding to month 12. The design follows onboarding-research.md: early role clarity (4.1), a structured sequence (4.2), a best-self story (4.3), a realistic job preview (4.4), a buddy and relationship-building (4.5), a limited information load (4.6), a central manager (4.7), practice and simulation (4.9), and certification before solo client contact (§5). It should impress in a demo and be possible to take to production later. The project folder is empty; the build starts from scratch.

**Defaults for open flags** (change any time): city is Dublin; reporting line is the Managing Director; no content editor in the demo (content lives in code); gold is used only for trophies.

### C2. Architecture
| Layer | Choice | Notes |
|---|---|---|
| App | Next.js 15 (App Router, TypeScript, Server Components + Server Actions) | One app containing all three role areas |
| Styling | Tailwind CSS v4 + shadcn/ui primitives, restyled as glass | Design tokens as CSS variables (C7) |
| Motion | Framer Motion | Explainers, page transitions, trophy unlocks |
| Drag-and-drop | dnd-kit | Approval board, clause builder, Redline Lab |
| Auth + DB | Supabase (email/password + "demo quick-login" buttons), Postgres, row-level security | Stores progress/state only |
| Content | Typed TS/JSON in `content/`, validated with Zod at build time | Lessons, quizzes, labs, walkthroughs, SOPs, personas |
| AI | OpenAI API, called only from server route handlers; model set by `OPENAI_MODEL` env var; embeddings in Supabase pgvector for Ask Beryl | Structured JSON outputs for scoring |
| PDF | `@react-pdf/renderer` in a route handler | Day-30 and day-90 certificates |
| Hosting | Vercel (preview + production), Supabase cloud project | Env vars in Vercel only |
| Tests | Vitest (logic), Playwright (key flows) | |

**Demo clock.** Each hire has a `start_date` plus a `demo_day_offset`. A single function `getProgramDay(user)` drives unlocks, check-ins, pulses and spaced repetition. The **time-skip** control (shown only to demo accounts) bumps the offset.

### C3. Folder structure
```
app/
  (auth)/login/                  sign-in + demo quick-login cards
  (hire)/today/                  "Today" view (next 1–3 tasks)
  (hire)/roadmap/                stage map
  (hire)/learn/[moduleId]/       lessons, explainers, quizzes
  (hire)/contracts/              Beryll Contracts mini-app (also the walkthrough host)
  (hire)/labs/[labId]/           Redline, Signature story, data drills, security setup
  (hire)/practice/roleplay/      AI client role-play
  (hire)/people/                 people map, matcher chat, quests, kudos
  (hire)/me/                     trophies, XP, rank, scorecard, certificates
  (manager)/team/                hire list, at-risk flags, cohort metrics
  (manager)/team/[hireId]/       hire detail, check-ins, rubric, QA sampling
  (buddy)/buddy/                 buddy checklist, debriefs, quest confirmations
  api/ai/{roleplay,coach,grade,matcher}/route.ts
  api/certificate/[stage]/route.ts
components/  ui/ (glass kit) · walkthrough/ · contracts/ · explainers/ · gamification/
content/     stages.ts · modules/ · quizzes/ · labs/ · walkthroughs/ · sops/ · personas/ · staff.ts
lib/         program-day.ts · unlocks.ts · xp.ts · trophies.ts · at-risk.ts · spaced-repetition.ts · ai/ · supabase/
supabase/    migrations/ · seed.sql (demo users, staff, dummy hires)
scripts/     embed-sops.ts (builds the pgvector index)
```

### C4. Data model (Supabase)
- `profiles`: id, name, role (`hire|manager|buddy`), title, avatar, manager_id, buddy_id, start_date, demo_day_offset, is_demo
- `staff_directory`: the 12 fictional Beryll staff (name, team, bio, interests[], availability_note). Used by the matcher and the people map.
- `stage_progress`: hire_id, stage_id, status (`locked|active|done`), completed_at
- `task_progress`: hire_id, task_id, status, score, attempts, data jsonb (answers, drafts)
- `quiz_attempts` + `review_queue` (item_id, due_day): spaced repetition
- `walkthrough_runs`: hire_id, walkthrough_id, mode (`watch|guided|solo`), errors, duration, passed
- `contracts`: a per-hire sandbox of mini-app records (client, type, status column, clauses jsonb)
- `roleplay_sessions`: persona_id, transcript jsonb, rubric_scores jsonb, ai_summary, passed
- `certifications`: hire_id, ai_score, manager_observation jsonb, status (`pending|passed|retest`), signed_by
- `checkins`: hire_id, due_day, held_at, notes, agenda · `pulses`: day (7/30/90), clarity, confidence, belonging, comment
- `scorecard_items`: 30/60/90 goals, target, status
- `quests`: hire_id, staff_id/buddy, type, confirmed_by, confirmed_at
- `kudos`, `shadow_logs`, `sop_suggestions`, `program_reviews`
- `xp_events` (source, amount) · `trophies_earned`
- `matcher_profiles`: hire_id, extracted interests jsonb, visibility flags, suggestions jsonb
- `sop_chunks`: id, sop_id, title, text, embedding vector(1536)

**RLS rules.** A hire reads and writes only their own rows. A manager reads rows where `profiles.manager_id = auth.uid()` and writes checkins, certifications and QA scores. A buddy reads limited fields of their buddy-hire and confirms quests. Answer keys and rubrics live only on the server (in `content/` and `lib/ai`), never in client bundles.

### C5. Journey content (stage by stage)
| Stage | Unlock | Contents | Exit criterion |
|---|---|---|---|
| 0 Pre-boarding | Account created | Welcome video placeholders from manager + buddy, "A week as a Beryll BDM" job preview (branching story), paperwork checklist, personal security setup | Checklist done |
| 1 Day 1 | Program day 1 | Three Things card, Best Self story, meet-your-buddy, matcher chat interview, explainer: who Beryll serves + engagement lifecycle | Best Self story submitted |
| 2 Weeks 1–2 | Day 2 | Explainers (pentest vs. scan vs. red team vs. SOC; incident response; data classification; GDPR/NIS2 basics), the 3 contract walkthroughs (Watch → Guided), shadow log (5 interactions), Ask Beryl intro, stage quiz, scorecard agreed, test phishing email | Quiz ≥ 80%, all walkthroughs at Guided |
| 3 Days 8–30 | Stage 2 done | Walkthroughs in Solo, Redline Lab, Signature story, data-handling drills, AI role-play practice (3 personas), certification (AI role-play + manager observation), day-30 pulse | Certification passed → "Solo" rank + day-30 PDF |
| 4 Days 31–60 (light) | Certified | QA sampling (manager scores 1 in 5), cross-team quest, Fix-one-SOP mission | Mission submitted |
| 5 Days 61–90 (light) | Day 61 | Scorecard review, 90-day conversation, programme review, day-90 pulse | Manager sign-off → "Independent" + day-90 PDF |
| 6 Months 4–12 | Day 91 | Quarterly check-in cards only | — |

Check-ins are auto-created for day 1, week 1, every two weeks, and days 30/60/90. Pulses run on days 7, 30 and 90.

### C6. Core logic (pure modules in `lib/`, unit-tested)
- `unlocks.ts`: stage state machine based on stage exit criteria + program day.
- `xp.ts` / `trophies.ts`: XP only for meaningful events (task pass, walkthrough Solo pass, certification, quest confirmed, kudos received). Rank ladder: Observer (start) → Co-pilot (stage 2 done) → Solo (certified) → Independent (day-90 sign-off). Streak = consecutive program days with at least one completed task. Starter trophies (~15): First Steps, Best Self, Clause Hunter, Pipeline Pro, Signature Guardian, Phish Spotter, Connector (3 quests), Certified for Solo, etc.
- `at-risk.ts`: flags if any pulse dimension is 2 or lower, a check-in is overdue by more than 3 days, a stage is stalled beyond its expected days + 5, certification failed twice, or there has been no activity for 5 program days. Shows the reason and a suggested action.
- `spaced-repetition.ts`: missed or flagged quiz items come back on days +3, +10 and +30.
- Walkthrough engine (`components/walkthrough`): steps defined in `content/walkthroughs/*.ts` as `{ target: data-tour id, action: click|drag|type|select, expect, hint, narration }`. **Watch** auto-plays with a ghost cursor; **Guided** spotlights the target and validates each action; **Solo** hides hints, times the run, and counts errors. Runs on top of the real mini-app components.

### C7. Design system
- Tokens: `--bg #F4F6F8`, `--surface rgba(255,255,255,.65)` + `backdrop-blur(16px)`, `--border rgba(15,23,42,.08)`, `--text #0A0B0D`, `--muted #5B6470`, `--grey-200…800`, `--aqua #2DD4D4`, `--aqua-deep #0E9F9F` (text/buttons on light), `--gold #E0B04A` (trophies only). Dark theme: `--bg #0A0B0D`, `--surface rgba(22,24,29,.6)`, border `rgba(255,255,255,.1)`, aqua glow.
- Gem motif: a faceted SVG logo mark; a subtle prism gradient (aqua → white → pale grey) on hero cards, rank badges and trophies; facet-shaped progress nodes on the roadmap.
- Type: Inter (UI) + a display face (e.g. Sora) for headings. WCAG AA contrast is checked in both themes; layout works from 360px width up.

### C8. AI features (all server-side, `lib/ai/`)
| Feature | Endpoint | How it works | Output |
|---|---|---|---|
| Client role-play | `/api/ai/roleplay` | Persona prompt (from `content/personas`: bank CISO, procurement officer, SME owner after a breach, NGO on a tight budget) with hidden goals and objections; text chat streamed; ends on "End call" or after 12 turns | Final call to the grader with a rubric → JSON scores (accuracy, tone, escalation, data handling, no over-promising, next step), quotes as evidence, pass/fail |
| Certification | same + manager form | Fixed certification persona + fixed scenario seed, so every hire is judged the same way. AI score ≥ threshold **and** manager observation rubric passed → certified; otherwise a coaching plan + retest | `certifications` row |
| Ask Beryl coach | `/api/ai/coach` | Retrieval over `sop_chunks` (top 5 by embedding similarity); answers only from what it retrieves, with SOP citations; otherwise "I don't know, ask {buddy name}" | Streamed answer + citations |
| Lab grading | `/api/ai/grade` | Hire's answer + server-side answer key + rubric → structured feedback (Redline Lab annotations, translator rewrites, SOW drafts) | JSON {score, strengths, gaps, model_answer_excerpt} |
| Interest matcher | `/api/ai/matcher` | Chat interview of about 6–10 turns → extract interests into JSON → match against `staff_directory` → 3 suggestions with a reason + icebreaker. The hire sets what's visible | `matcher_profiles` row |

**Guardrails.** Per-user rate limit (simple counter table); a max-tokens limit on every call; prompt-injection defence (persona/rubric in the system prompt, the hire's text treated as data); a scripted fallback when the API errors, so a live demo never dead-ends; no client-identifying real data anywhere.

### C9. Seed data
- Demo logins: `hire@beryll.demo` (fresh, day 0), `manager@beryll.demo`, `buddy@beryll.demo`.
- Dummy hires under the manager: Aoife (pre-boarding), Luca (week 2), Sofia (day 22, certifying), Tomás (day 45, solo), Nadia (day 78, **at risk**: low belonging pulse + missed check-in), each with plausible activity history.
- 12 Beryll staff with roles and interests (golf, running, chess, cooking, football, photography, gaming, hiking…), so the matcher has real overlaps.
- Fictional clients and contracts for the mini-app (e.g. a Dublin credit union, a logistics firm, a health-tech startup).
- About 15 SOPs (scoping call, SOW template rules, escalation matrix, data classification, authorisation-to-test, client comms tone, GDPR DPA checklist…).

### C10. Build phases (each ends with a working, deployable app)
1. **Foundation**: scaffold Next.js, Tailwind, tokens, glass UI kit, theme toggle, Supabase project, migrations, RLS, auth + demo quick-login, seed script, Vercel deploy.
2. **Journey spine**: `content/stages.ts`, unlocks, program day + time-skip, Today view, Roadmap, profile/trophy shell, XP events.
3. **Manager & buddy**: team list, hire detail, check-ins, at-risk flags, cohort metrics; buddy checklist + quest confirmation. Dummy hires visible.
4. **Beryll Contracts + walkthroughs**: mini-app (list, SOW editor with clause drag-in, approval board with rules, contract review view); walkthrough engine; the 3 walkthroughs in 3 modes.
5. **Learning content**: explainer animations (4), quizzes + spaced repetition, pre-boarding + Day 1 content, Best Self story, job-preview story.
6. **Labs**: Redline Lab, Signature branching story, data-handling drills, security setup + phishing simulation.
7. **AI**: role-play + grader, certification flow (AI + manager), Ask Beryl with embeddings, lab grading, matcher chat + suggestions; fallbacks + rate limits.
8. **People, feedback, rewards**: people map, quests, kudos, shadow log, pulses, scorecard, Fix-one-SOP, programme review, trophies/rank/streaks, PDF certificates.
9. **Polish & QA**: empty/loading/error states, accessibility pass, mobile widths, Playwright flows, security review (no keys or answer keys in the client, RLS tests), production deploy.

### C11. Verification
- Unit tests: unlocks, XP/trophies, at-risk rules, spaced repetition, program day.
- Playwright: (a) the hire goes from day 0 through certification using time-skip and receives the day-30 PDF; (b) the manager sees the hire's progress update live and Nadia flagged as at risk; (c) the buddy confirms a quest and the hire gains XP; (d) each walkthrough passes in Guided and Solo.
- AI checks: the role-play grader returns valid JSON for 5 sample transcripts (one deliberately bad); Ask Beryl refuses an off-SOP question and cites sources for an on-SOP one; the fallback triggers when the API key is removed.
- Security: grep the client bundle for `OPENAI`/answer-key strings; RLS test that a hire can't read another hire's rows.
- Manual: light/dark themes, 360px width, keyboard navigation through a walkthrough.

### C12. What's needed from you before Phase 1
- An OpenAI API key, plus a Supabase account (I can create the project with you), and confirmation that Vercel is the account to deploy to.
