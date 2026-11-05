import "server-only";
// Everything here is secret: answer keys, rubrics and persona hidden goals. Import only from server code (route handlers, server actions, lib/ai).
export { quizKeys, quizKeyById } from "./quiz-keys";
export { redlineKeys } from "./redline-keys";
export { drillKeys } from "./drill-keys";
export { phishingKey } from "./phishing-key";
export { translatorRubric } from "./translator-rubric";
export { personaSecrets, personaSecretById } from "./persona-secrets";
export { rubric } from "./rubric";
