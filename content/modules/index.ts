import type { Lesson } from "../schema";
import { welcomeFromYourTeam } from "./welcome-from-your-team";
import { welcomeThreeThings } from "./welcome-three-things";
import { whoBeryllServes } from "./who-beryll-serves";
import { engagementLifecycle } from "./engagement-lifecycle";
import { serviceTypes } from "./service-types";
import { incidentResponseBasics } from "./incident-response-basics";
import { dataClassification } from "./data-classification";
import { gdprNis2ForBdms } from "./gdpr-nis2-for-bdms";
import { clientCommsStandards } from "./client-comms-standards";
import { escalationMatrix } from "./escalation-matrix";
import { askBerylIntro } from "./ask-beryl-intro";
export { jobPreview } from "./job-preview";

export const lessons: Lesson[] = [
  welcomeFromYourTeam, welcomeThreeThings, whoBeryllServes, engagementLifecycle, serviceTypes,
  incidentResponseBasics, dataClassification, gdprNis2ForBdms, clientCommsStandards, escalationMatrix, askBerylIntro,
];
export const lessonById = (id: string) => lessons.find((l) => l.id === id);
