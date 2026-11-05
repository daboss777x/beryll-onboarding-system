# API contracts (Joel, updated 2026-11-05)

Common rules:
- Errors: JSON `{ error: string, code?: string }`, `Cache-Control: no-store`. A 500 is always a friendly message. A 400 for a bad body is a plain sentence ("We couldn't find that call. Start a new one."): no schema paths or allowed values. The technical detail is logged on the server (`[api] invalid request: …`).
- Streaming endpoints return `text/plain` with header `X-AI-Mode: live|fallback`.
- Daily per-user limits: coach 50, roleplay 60, grade 40, matcher 30. Over the limit: `429 { code: "rate_limited" }`. If the usage counter itself fails: live AI mode fails closed with `503 { code: "rate_check_failed" }`; fallback mode lets the call through.
- The limits above cover the API routes only. Quizzes, labs and walkthroughs are server actions with their own daily caps, listed under "Other daily caps" at the end.
- No `OPENAI_API_KEY` means fallback mode for everything. A failed live call switches that feature to fallback for 60 s.

| Method & path | Auth | Request | Response | Fallback / errors |
|---|---|---|---|---|
| `GET /api/health` | public | none | `{ ok: true, aiMode: "live"\|"fallback", dataMode: "memory"\|"supabase" }` | always answers |
| `POST /api/ai/coach` | any signed-in role | `{ question: string (2-800), history?: {role:"user"\|"assistant", content≤2000}[] (≤20) }` | Streamed text, then `"\n\u001E"` + one JSON line `{ type:"meta", mode, method:"supabase"\|"embeddings"\|"keyword", citations:{sopId,title}[] }` + `"\n"`. Split on `\u001E`. | Keyword SOP search. SOP excerpts are shown only for a strong match (score ≥ 4 and ≥ 50% of the question's topic words in that SOP); bullets are never doubled. Otherwise one honest line with named people from the data ("your buddy, {first}, or your manager, {first}"): off-topic → "I can only help with Beryll onboarding topics…"; on-topic but no SOP → "I don't know. Ask …"; unclear → asks to rephrase; non-English → "I can only answer in English…"; angry → apology + human route (plus excerpts if strong). No citations unless SOPs were quoted. 400 / 401 / 429 |
| `POST /api/ai/roleplay` `action:"turn"` | hire | `{ action:"turn", personaId: "bank-ciso"\|"procurement-officer"\|"sme-owner-breach"\|"ngo-tight-budget", message: string (1-2000, not blank), sessionId?: uuid, certification?: boolean }`. No `sessionId`: the server creates a session owned by this hire, persona fixed (`cert-healthtech` when `certification:true`). With `sessionId`: the session's persona and mode win; `personaId`/`certification` are ignored. Send one turn at a time (wait for the stream to finish). | Streamed persona reply. Headers `X-Session-Id` (always; keep it for the next turn and for `end`), `X-Turns-Used`, `X-Turns-Left` (12 user turns max), `X-AI-Mode`. The server stores the hire's message before replying and the persona reply once the stream finishes. | Scripted objections, then client probes. Off-script messages (extraction attempts, gibberish, abuse, other languages) get an in-character line rotated by turn, per client, and don't advance the script. **Certification:** 403 `{code:"cert_locked"}` when the hire's certification task is Locked (same rule as the roadmap, `lib/logic/unlocks.ts` via `loadHireState`); checked when a certification session starts and on every turn of one. 400 bad body, 404 unknown persona or a session that is not this hire's, 409 `{code:"turn_limit"}` (send `end`), 409 `{code:"session_ended"}`, 403 non-hires, 429 / 503 as above |
| `POST /api/ai/roleplay` `action:"end"` | hire | `{ action:"end", sessionId: uuid }`. Nothing else is read: the grade uses the transcript the server stored. | `{ mode, sessionId, assessment: "scored"\|"not_assessed", result: { personaId, scores:{criterion,score,evidence}[] (accuracy, tone, escalation, data_handling, no_over_promising, next_step), overall 0-100, passed, summary, coaching: string[] }, certification?: { status:"pending"\|"passed"\|"retest", attempts, decision, needsAiGrade?: true } }`. `scored`: marks the session ended and saves the grade (and the certification row for a certification session); a second `end` returns the stored JSON, no re-grade. **`not_assessed`** (nothing gradeable, or no criterion has any quotable evidence): every score 0, `overall` 0, `passed` false, summary starts "Not enough to assess"; **the session stays active** (the hire can keep talking and end again), nothing is saved, no `certification` key, and when nothing was gradeable no certification attempt is used. | Keyword rubric scoring (anti-gaming rules below), same shape, summary starts "Quick automatic check (the AI coach is offline)". Certification in fallback: overall capped at 74, `needsAiGrade: true`, status `pending` if the uncapped check would have passed, never overwrites a stored AI score. Stays `pending` until the manager observation exists. 403 `cert_locked` (as for `turn`), 400 no user turns, 404 not this hire's session, 429 `rate_limited`, certification only: 429 `{code:"cert_limit"}` after 3 certification `end`s a day per hire (503 `rate_check_failed` if that counter is down) |
| `POST /api/ai/grade` | hire | redline: `{ labId:"redline-lab", itemId:"redline-…", answer:{ flags:{clauseId, category?, note?≤600}[] (≤20) } }` · translator: `{ labId:"translator-drills", itemId:"tf-…", answer: string≤8000 }` · SOW: `{ labId:"sow-check", itemId, answer: string \| { clauses:{title,body}[] } }` | `{ score 0-100, strengths: string[], gaps: string[], modelAnswerExcerpt: string, mode }`. **Saves nothing**: the caller records XP and task progress | Rule/keyword grader. 404 unknown item, 400 wrong shape |
| `POST /api/ai/matcher` `action:"turn"` | hire | `{ messages: {role,content}[] (start with []), action:"turn" }` | Streamed next question. Headers `X-Questions-Asked`, `X-Can-Finish` (true from question 6; 10 max) | Scripted question list; honours "skip" |
| `POST /api/ai/matcher` `action:"finish"` | hire | `{ messages, action:"finish" }` (≥1 user answer) | `{ mode, extracted:{ interests, preferences:{workingStyle,socialStyle,availability}, funFacts }, suggestions: {staffId,name,title,team,reason,icebreaker}[] (3), profile }`. Saves the matcher profile; visibility defaults to all false | Keyword matching |
| `GET /api/certificate/day30` · `/day90` | hire | none | `200 application/pdf`, inline | 403 `{code:"milestone_not_reached"}`, 404 for any other stage |

## Role-play sessions (server-held transcript)

The browser never sends history. Flow:
1. `turn` without `sessionId` → read `X-Session-Id` from the response headers.
2. `turn` with that `sessionId` for each further message (wait for the previous stream to finish).
3. `end` with the `sessionId` → grade. Retrying `end` is safe (returns the stored result).

Only ended sessions appear in `repo.listRoleplaySessions()`. A `not_assessed` end leaves the session active, so it does not appear there (practice is not recorded for it).

### Fallback grader rules (no `OPENAI_API_KEY`)

The keyword grader can't judge meaning, so it only credits real conversation (`FALLBACK_RULES` in `lib/ai/roleplay.ts`):
- Sentences under 4 words, repeated sentences, repeated turns and extraction attempts earn nothing.
- Keyword lists earn nothing: a sentence with under 20% function words, 3+ comma fragments averaging ≤ 3 words, more than 0.45 scoring keywords per word, or keywords for 4+ criteria at once. A turn that is mostly such sentences is "stuffed": it earns nothing and costs 10 points off the overall.
- Each keyword pattern counts once per criterion across the whole call. Penalties (over-promising, unsafe data handling) count anywhere.
- Overall caps by real hire turns (≥ 6 words with a creditable sentence): 0 → 30, 1 → 45, 2 → 65, 3+ → none; under 40 creditable words → 60.
- Certification: capped at `AI_PASS_SCORE - 1` (74). The quick check can never satisfy the AI half; the hire needs a live AI grade. Active ones are read with `repo.getRoleplaySession(hireId, id)`.

## Other daily caps (server actions, not API routes)

| What | Cap | Day boundary | Where |
|---|---|---|---|
| Quiz submissions | 10 per quiz | Dublin day | `QUIZ_ATTEMPTS_PER_DAY` in `components/app/quiz-rules.ts` |
| Lab attempts | 20 per task | UTC day | `DAILY_ATTEMPT_CAP` in `components/labs/attempt-cap.ts` |
| Walkthrough runs | 20 per walkthrough and mode | UTC day | same constant, used in `app/(hire)/contracts/actions.ts` |
| Certification role-play `end` | 3 per hire | see `/api/ai/roleplay` above | `CERT_DAILY_LIMIT` |

Failed quiz attempts do not return `correctOptionIds` or `explanation`. They are sent only once the attempt passes (or the quiz is already done). The time-skip does not reset these caps.
