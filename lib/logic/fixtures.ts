import type { StageDef, TaskDef, TaskProgress } from "../types";

export const STAGES: StageDef[] = [
  { id: "preboarding", order: 0, title: "Pre-boarding", subtitle: "", startDay: 0, endDay: 0, playable: "full", doneMeans: "" },
  { id: "day1", order: 1, title: "Day 1", subtitle: "", startDay: 1, endDay: 1, playable: "full", doneMeans: "" },
  { id: "weeks1-2", order: 2, title: "Weeks 1-2", subtitle: "", startDay: 2, endDay: 7, playable: "full", doneMeans: "" },
  { id: "days8-30", order: 3, title: "Days 8-30", subtitle: "", startDay: 8, endDay: 30, playable: "full", doneMeans: "" },
  { id: "days31-60", order: 4, title: "Days 31-60", subtitle: "", startDay: 31, endDay: 60, playable: "light", doneMeans: "" },
  { id: "days61-90", order: 5, title: "Days 61-90", subtitle: "", startDay: 61, endDay: 90, playable: "light", doneMeans: "" },
  { id: "months4-12", order: 6, title: "Months 4-12", subtitle: "", startDay: 91, endDay: 365, playable: "cards", doneMeans: "" },
];

const t = (id: string, stageId: TaskDef["stageId"], extra: Partial<TaskDef> = {}): TaskDef => ({
  id, stageId, kind: "lesson", title: id, summary: "", estMinutes: 5, xp: 20, required: true, href: "/x", ...extra,
});

export const TASKS: TaskDef[] = [
  t("pre-check", "preboarding"),
  t("d1-story", "day1"),
  t("w-quiz", "weeks1-2", { kind: "quiz", passScore: 80 }),
  t("w-optional", "weeks1-2", { required: false }),
  t("m-redline", "days8-30"),
  t("m-late", "days8-30", { unlockDay: 12 }),
  t("m-cert", "days8-30", { kind: "certification", xp: 200 }),
  t("l-mission", "days31-60"),
  t("s-review", "days61-90"),
  t("q-cards", "months4-12", { required: false }),
];

export const prog = (taskId: string, status: TaskProgress["status"] = "done", extra: Partial<TaskProgress> = {}): TaskProgress => ({
  hireId: "h1", taskId, status, attempts: 1, ...extra,
});
