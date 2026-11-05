import type { CheckIn, Profile, Pulse, TaskProgress, TaskStatus, XpEvent } from "../lib/types";
import type { DemoAccount, Kudos, Quest, ShadowLog } from "./schema";
import { stages } from "./stages";
import { tasks } from "./tasks";
import { scorecardGoals } from "./scorecard";

/** Demo logins. Kwame creates these in Supabase auth with this shared password. Demo only. */
export const DEMO_PASSWORD = "BerylDemo!2026";
/** The date the committed snapshot is built for. Seed scripts should call buildDemoData(new Date()-today) so the dates stay plausible. */
export const DEMO_BASE_DATE = "2026-11-04";

export const DEMO_IDS = {
  manager: "00000000-0000-4000-8000-000000000001",
  buddy: "00000000-0000-4000-8000-000000000002",
  alex: "00000000-0000-4000-8000-000000000010",
  aoife: "00000000-0000-4000-8000-000000000011",
  luca: "00000000-0000-4000-8000-000000000012",
  sofia: "00000000-0000-4000-8000-000000000013",
  tomas: "00000000-0000-4000-8000-000000000014",
  nadia: "00000000-0000-4000-8000-000000000015",
} as const;

/** Same as lib/logic/checkins CHECKIN_DAYS (1, 7, every 14 days to 84, 30/60/90); duplicated so content stays dependency-free. */
export const CHECKIN_DAYS = [1, 7, 14, 28, 30, 42, 56, 60, 70, 84, 90] as const;
const checkinLabel = (d: number) => ([1, 30, 60, 90].includes(d) ? `Day ${d}` : d % 7 === 0 ? `Week ${d / 7}` : `Day ${d}`);

export interface DemoScorecardItem { hireId: string; goalId: string; status: "agreed" | "in_progress" | "met" | "missed" }
export interface DemoHire {
  profile: Profile;
  programDay: number;
  taskProgress: TaskProgress[];
  pulses: Pulse[];
  checkIns: CheckIn[];
  xpEvents: XpEvent[];
  kudos: Kudos[];
  shadowLogs: ShadowLog[];
  quests: Quest[];
  scorecard: DemoScorecardItem[];
  story?: { text: string; submittedAt: string }; // Best Self story, when submitted
}
export interface DemoData { accounts: DemoAccount[]; alex: DemoHire; hires: DemoHire[] }

// ------------------------------------------------------------------ helpers
const addDays = (iso: string, n: number) => {
  const d = new Date(`${iso}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};
const at = (date: string, hhmm = "10:00") => `${date}T${hhmm}:00Z`;
const hash = (s: string) => [...s].reduce((h, ch) => (h * 31 + ch.charCodeAt(0)) >>> 0, 7);

interface Spec {
  key: keyof typeof DEMO_IDS;
  name: string;
  email: string;
  day: number; // program day
  doneInStage: number; // how many unlocked tasks of the current stage are done
  inProgress: string[];
  doneOptionalEarlier: boolean;
  overrides?: Record<string, TaskStatus>;
  attempts?: Record<string, number>;
  scoreFloor?: boolean; // keep scores close to the pass mark
  buddy?: boolean;
}

function stageOf(day: number) {
  return [...stages].reverse().find((s) => day >= s.startDay) ?? stages[0];
}

function buildTaskProgress(spec: Spec, start: string): TaskProgress[] {
  const hireId = DEMO_IDS[spec.key];
  const cur = stageOf(spec.day);
  const out: TaskProgress[] = [];
  const dateOfDay = (d: number) => addDays(start, d - 1);
  for (const st of stages) {
    const list = tasks.filter((t) => t.stageId === st.id);
    let doneSoFar = 0;
    list.forEach((t, i) => {
      const unlock = t.unlockDay ?? st.startDay;
      let status: TaskStatus;
      if (st.order < cur.order) status = t.required || spec.doneOptionalEarlier || i % 2 === 0 ? "done" : "available";
      else if (st.order > cur.order) status = "locked";
      else if (unlock > spec.day) status = "locked";
      else if (spec.inProgress.includes(t.id)) status = "in_progress";
      else if (doneSoFar < spec.doneInStage) { status = "done"; doneSoFar++; }
      else status = "available";
      status = spec.overrides?.[t.id] ?? status;

      const row: TaskProgress = { hireId, taskId: t.id, status, attempts: spec.attempts?.[t.id] ?? (status === "done" ? 1 : status === "in_progress" ? 1 : 0) };
      if (status === "done") {
        const base = st.id === "preboarding" ? -1 - (list.length - i) % 3 : unlock + (i % 2);
        const day = Math.min(spec.day, Math.max(st.id === "preboarding" ? -9 : 1, base));
        const when = st.id === "preboarding" ? addDays(start, base) : dateOfDay(day);
        row.completedAt = at(when, i % 2 ? "09:40" : "15:20");
        if (t.passScore !== undefined) {
          const room = Math.max(1, 100 - t.passScore - 3);
          row.score = spec.scoreFloor ? t.passScore + 2 + (hash(t.id) % 5) : Math.min(100, t.passScore + 4 + (hash(t.id + hireId) % room));
        }
        if (t.kind === "walkthrough") {
          const solo = t.href.endsWith("solo");
          row.data = { mode: t.href.split("mode=")[1], errors: solo ? hash(t.id + hireId) % 3 : 0, durationSec: solo ? 150 + (hash(t.id) % 120) : 240 };
        }
        if (t.kind === "certification") row.data = { aiScore: row.score ?? 85, managerObservation: "passed", signedBy: "siobhan-kelly" };
      }
      if (status === "in_progress" && t.kind === "certification") row.data = { aiScore: 84, managerObservation: "pending" };
      if (status === "in_progress" && t.id === "wk-shadow-log") row.data = { logged: 3, of: 5 };
      out.push(row);
    });
  }
  return out;
}

const NOTES: Record<number, string> = {
  1: "Warm welcome. Walked through the Three Things card and the first-week plan. No concerns.",
  7: "Week one done. Good questions about the approval pipeline. Agreed 30/60/90 scorecard.",
  14: "Confident with the SOW template. Wants more exposure to engineers; arranged a scoping-call shadow.",
  28: "Finished the solo walkthroughs. Certification booked for the following week.",
  30: "Day-30 conversation: certified for solo client contact. First two accounts assigned.",
  42: "Handling two accounts well. Reviewed one QA-sampled email together.",
  56: "Accounts steady. Discussed the Fix-one-SOP mission and cross-team quest.",
  60: "Day-60 review: scorecard on track. Agreed focus for the last 30 days.",
  70: "Pipeline review and renewal planning.",
};

function buildCheckIns(spec: Spec, start: string, missed: number[] = []): CheckIn[] {
  const hireId = DEMO_IDS[spec.key];
  return CHECKIN_DAYS.map((d) => {
    const held = spec.day >= d && !missed.includes(d);
    return { id: `${hireId}-checkin-d${d}`, hireId, dueDay: d, label: checkinLabel(d), ...(held ? { heldAt: at(addDays(start, d - 1), "11:00"), notes: NOTES[d] ?? "Regular catch-up. Nothing to flag." } : {}) };
  });
}

function buildScorecard(spec: Spec): DemoScorecardItem[] {
  const hireId = DEMO_IDS[spec.key];
  if (spec.day < 5) return [];
  return scorecardGoals.map((g) => {
    let status: DemoScorecardItem["status"] = "agreed";
    if (spec.day > 10) status = "in_progress";
    if (spec.day > g.horizon + (g.horizon === 30 ? 0 : 0) && spec.day > g.horizon) status = "met";
    if (spec.key === "nadia" && g.id === "d60-qa") status = "missed";
    if (spec.key === "nadia" && g.id === "d60-review") status = "in_progress";
    return { hireId, goalId: g.id, status };
  });
}

function xpFrom(progress: TaskProgress[]): XpEvent[] {
  return progress
    .filter((p) => p.status === "done" && p.completedAt)
    .map((p) => ({ hireId: p.hireId, source: p.taskId, amount: tasks.find((t) => t.id === p.taskId)!.xp, at: p.completedAt! }));
}

// ------------------------------------------------------------------ builder
export function buildDemoData(today: string = DEMO_BASE_DATE): DemoData {
  const startFor = (day: number, preGap = 1) => (day >= 1 ? addDays(today, -(day - 1)) : addDays(today, preGap));
  const title = "Business Development Manager";

  const profiles: Record<string, Profile> = {
    manager: { id: DEMO_IDS.manager, name: "Siobhán Kelly", email: "manager@beryll.demo", role: "manager", title: "Head of Commercial", startDate: "2021-03-01", demoDayOffset: 0, isDemo: true },
    buddy: { id: DEMO_IDS.buddy, name: "Marco Rossi", email: "buddy@beryll.demo", role: "buddy", title: "Senior Security Consultant", managerId: undefined, startDate: "2020-09-14", demoDayOffset: 0, isDemo: true },
  };

  const specs: Spec[] = [
    { key: "alex", name: "Alex Byrne", email: "hire@beryll.demo", day: 0, doneInStage: 0, inProgress: [], doneOptionalEarlier: false, buddy: true },
    { key: "aoife", name: "Aoife Brennan", email: "aoife@beryll.demo", day: 0, doneInStage: 2, inProgress: ["pre-security-setup"], doneOptionalEarlier: false },
    { key: "luca", name: "Luca Ferrari", email: "luca@beryll.demo", day: 9, doneInStage: 11, inProgress: ["wk-shadow-log"], doneOptionalEarlier: true, buddy: true },
    { key: "sofia", name: "Sofia Andersson", email: "sofia@beryll.demo", day: 22, doneInStage: 9, inProgress: ["d30-certification"], doneOptionalEarlier: true, attempts: { "lab-signature-story": 2 }, buddy: true },
    { key: "tomas", name: "Tomás Herrera", email: "tomas@beryll.demo", day: 45, doneInStage: 3, inProgress: ["mission-fix-sop"], doneOptionalEarlier: true, attempts: { "d30-certification": 1 } },
    { key: "nadia", name: "Nadia Haddad", email: "nadia@beryll.demo", day: 78, doneInStage: 0, inProgress: ["d90-scorecard-review"], doneOptionalEarlier: false, scoreFloor: true, attempts: { "d30-certification": 2, "lab-redline": 2 }, overrides: { "d60-cross-team": "available", "d60-qa-sampling": "done" } },
  ];

  const hires: DemoHire[] = specs.map((spec) => {
    const start = startFor(spec.day, spec.key === "alex" ? 1 : 3);
    const hireId = DEMO_IDS[spec.key];
    const taskProgress = buildTaskProgress(spec, start);
    const profile: Profile = {
      id: hireId, name: spec.name, email: spec.email, role: "hire", title,
      managerId: DEMO_IDS.manager, ...(spec.buddy ? { buddyId: DEMO_IDS.buddy } : {}),
      startDate: start, demoDayOffset: 0, isDemo: true,
    };
    const missed = spec.key === "nadia" ? [70] : [];
    return {
      profile, programDay: spec.day, taskProgress, pulses: [], checkIns: buildCheckIns(spec, start, missed),
      xpEvents: xpFrom(taskProgress), kudos: [], shadowLogs: [], quests: [], scorecard: buildScorecard(spec),
    };
  });
  const by = Object.fromEntries(hires.map((h) => [h.profile.name.split(" ")[0].toLowerCase().replace("á", "a"), h])) as Record<string, DemoHire>;
  const pulse = (h: DemoHire, day: 7 | 30 | 90, c: number, k: number, b: number, comment?: string): Pulse => ({
    hireId: h.profile.id, day, clarity: c, confidence: k, belonging: b, ...(comment ? { comment } : {}), submittedAt: at(addDays(h.profile.startDate, day - 1), "16:00"),
  });
  const kudos = (id: string, to: DemoHire, fromId: string, fromName: string, kind: Kudos["kind"], message: string, day: number): Kudos => ({
    id, toHireId: to.profile.id, fromId, fromName, kind, message, at: at(addDays(to.profile.startDate, day - 1), "17:05"),
  });
  const shadow = (h: DemoHire, n: number, day: number, interaction: string, withStaffId: string, obs: string, debriefed = true): ShadowLog => ({
    id: `${h.profile.id}-shadow-${n}`, hireId: h.profile.id, day, interaction, withStaffId, whatIObserved: obs, debriefedWithBuddy: debriefed,
  });
  const quest = (h: DemoHire, n: number, type: Quest["type"], withStaffId: string, day?: number): Quest => ({
    id: `${h.profile.id}-quest-${n}`, hireId: h.profile.id, type, withStaffId, ...(day !== undefined ? { confirmedAt: at(addDays(h.profile.startDate, day - 1), "12:30") } : {}),
  });

  const { aoife, luca, sofia, tomas, nadia } = by;

  // Luca: day 9
  luca.pulses = [pulse(luca, 7, 4, 3, 4, "Lots to learn but Marco has been great. The contract tool makes more sense now.")];
  luca.kudos = [kudos("kudos-luca-1", luca, "marco-rossi", "Marco Rossi", "peer", "Asked exactly the right question on the scoping call. Welcome aboard.", 5)];
  luca.shadowLogs = [
    shadow(luca, 1, 3, "Scoping call", "marco-rossi", "The engineer asked for IP ranges and exclusions before talking about price. Noted that the client was vague about third-party hosting."),
    shadow(luca, 2, 5, "Client check-in", "siobhan-kelly", "Siobhán opened with a recap of last quarter and ended with one clear ask and a date."),
    shadow(luca, 3, 8, "Findings call", "jonas-weber", "Jonas explained a login flaw using a door-lock analogy; the client understood in a minute.", false),
  ];
  luca.quests = [quest(luca, 1, "buddy-intro", "marco-rossi", 1), quest(luca, 2, "coffee", "katarzyna-nowak")];
  luca.story = { text: "Last spring I took over a failing renewal at my old company. I phoned the client, listened for forty minutes, and rebuilt the plan on the call. They renewed for two years.", submittedAt: at(luca.profile.startDate, "16:30") };

  // Sofia: day 22, certifying
  sofia.pulses = [pulse(sofia, 7, 4, 4, 5, "Felt welcomed from day one.")];
  sofia.kudos = [
    kudos("kudos-sofia-1", sofia, "niamh-ocallaghan", "Niamh O'Callaghan", "founder", "Your Best Self story made the whole office smile. Thank you for sharing it.", 3),
    kudos("kudos-sofia-2", sofia, "liam-brennan", "Liam Brennan", "peer", "Great catch on the 120-day payment clause in the Harbourline paper.", 18),
  ];
  sofia.shadowLogs = [
    shadow(sofia, 1, 3, "Scoping call", "enoch-omunu", "Enoch asked what the client would do if the test found something bad on day one. Good question to borrow."),
    shadow(sofia, 2, 4, "Client check-in", "liam-brennan", "Liam kept notes in the CRM live during the call."),
    shadow(sofia, 3, 6, "Report debrief", "jonas-weber", "Executive summary first, then technical detail only if asked."),
    shadow(sofia, 4, 9, "Contract discussion", "amara-okafor", "Amara asked three questions about liability before proposing any wording."),
    shadow(sofia, 5, 12, "SOC escalation (replayed)", "katarzyna-nowak", "Order of calls: SOC on-call, client contact, then manager."),
  ];
  sofia.quests = [quest(sofia, 1, "buddy-intro", "marco-rossi", 1), quest(sofia, 2, "coffee", "jonas-weber", 6), quest(sofia, 3, "scoping-call", "enoch-omunu", 9)];
  sofia.story = { text: "In my last role a client called me at 19:00 on a Friday because their website was down. I stayed on the phone, got the right engineer, and we were back up by midnight. The client sent flowers the next week.", submittedAt: at(sofia.profile.startDate, "16:10") };

  // Tomás: day 45
  tomas.pulses = [pulse(tomas, 7, 4, 4, 4), pulse(tomas, 30, 4, 5, 4, "I know what is expected. The certification gave me real confidence.")];
  tomas.kudos = [
    kudos("kudos-tomas-1", tomas, "jonas-weber", "Jonas Weber", "peer", "Brilliant plain-English write-up of the Atlas findings. The CFO forwarded it unchanged.", 38),
    kudos("kudos-tomas-2", tomas, "amara-okafor", "Amara Okafor", "peer", "Thank you for sending me the Kestrel DPA with the transfer clause already highlighted.", 41),
  ];
  tomas.shadowLogs = [
    shadow(tomas, 1, 3, "Scoping call", "marco-rossi", "Learned to ask who owns the hosting before anything else."),
    shadow(tomas, 2, 5, "Client check-in", "siobhan-kelly", "Short and warm. Always ends with a dated next step."),
    shadow(tomas, 3, 7, "Findings call", "enoch-omunu", "Enoch led with what the client should do, then why."),
    shadow(tomas, 4, 10, "Contract discussion", "amara-okafor", "How to propose a fallback clause instead of just saying no."),
    shadow(tomas, 5, 12, "Incident call (replayed)", "katarzyna-nowak", "Never says 'safe' until the SOC says so."),
  ];
  tomas.quests = [quest(tomas, 1, "buddy-intro", "marco-rossi", 1), quest(tomas, 2, "coffee", "elena-popescu", 4), quest(tomas, 3, "scoping-call", "enoch-omunu", 10), quest(tomas, 4, "cross-team", "declan-murphy", 40)];
  tomas.story = { text: "I once rewrote a 40-page supplier contract in a weekend because a customer needed it signed by Monday. I learned that clear drafting is a kindness to everyone who has to read it later.", submittedAt: at(tomas.profile.startDate, "15:55") };

  // Nadia: day 78, at risk
  nadia.pulses = [
    pulse(nadia, 7, 3, 3, 3, "Not always sure who to ask about contracts."),
    pulse(nadia, 30, 3, 3, 2, "I mostly work on my own. I have not really met the engineers yet."),
  ];
  nadia.kudos = [kudos("kudos-nadia-1", nadia, "siobhan-kelly", "Siobhán Kelly", "manager", "Careful, accurate work on the Fernhill authorisation letter.", 44)];
  nadia.shadowLogs = [
    shadow(nadia, 1, 6, "Scoping call", "marco-rossi", "Quiet call; I mostly listened."),
    shadow(nadia, 2, 9, "Client check-in", "liam-brennan", "Learned how to structure a recap email."),
    shadow(nadia, 3, 14, "Findings call", "jonas-weber", "Plain-English explanation of an API flaw.", false),
    shadow(nadia, 4, 19, "Contract discussion", "amara-okafor", "Watched a liability clause negotiation.", false),
    shadow(nadia, 5, 24, "Client check-in", "siobhan-kelly", "Observed a difficult renewal call.", false),
  ];
  nadia.quests = [quest(nadia, 1, "buddy-intro", "marco-rossi", 5), quest(nadia, 2, "cross-team", "declan-murphy")];
  nadia.story = { text: "Before this I managed a charity's partnership accounts. My proudest moment was calming a funder who thought we had lost their data. We had not, and I made sure they knew that before the day was out.", submittedAt: at(addDays(nadia.profile.startDate, 2), "17:20") };

  // Aoife: pre-boarding (nothing beyond the task states)
  aoife.pulses = [];

  const alex = hires.find((h) => h.profile.id === DEMO_IDS.alex)!;
  const accounts: DemoAccount[] = [
    { email: "hire@beryll.demo", profile: alex.profile },
    { email: "manager@beryll.demo", profile: { ...profiles.manager }, staffId: "siobhan-kelly" },
    { email: "buddy@beryll.demo", profile: { ...profiles.buddy }, staffId: "marco-rossi" },
  ];
  return { accounts, alex, hires: hires.filter((h) => h.profile.id !== DEMO_IDS.alex) };
}

export const demoData: DemoData = buildDemoData(DEMO_BASE_DATE);
