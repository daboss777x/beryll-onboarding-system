// Client-safe content barrel. Nothing exported here is an answer key, rubric or hidden persona goal.
// Secrets live in ./server (server-only) and are deliberately NOT re-exported from this file.
// Harry owns ./walkthroughs and exports it separately.
export * from "./schema";
export { stages, stageById } from "./stages";
export { tasks, tasksByStage, taskById } from "./tasks";
export { lessons, lessonById, jobPreview } from "./modules";
export { quizzes, quizById } from "./quizzes";
export * from "./labs";
export { sops, sopById } from "./sops";
export { personaCards, personaById } from "./personas";
export { staff, staffById } from "./staff";
export { scorecardGoals } from "./scorecard";
export { glossary, glossaryById } from "./glossary";
export { clients, contracts, sowTemplate } from "./demo-contracts";
export { demoData, buildDemoData, DEMO_BASE_DATE, DEMO_IDS, CHECKIN_DAYS } from "./demo";
// DEMO_PASSWORD is deliberately not re-exported here (client-safe barrel). Server code imports it from ./demo.
export type { DemoData, DemoHire, DemoScorecardItem } from "./demo";
