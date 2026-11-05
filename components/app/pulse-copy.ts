// Pulse wording shared by the hire form (client) and the manager view (server).
export type PulseDim = "clarity" | "confidence" | "belonging";

export const PULSE_QUESTIONS: { id: PulseDim; label: string; question: string }[] = [
  { id: "clarity", label: "Clarity", question: "I know what is expected of me and what good looks like." },
  { id: "confidence", label: "Confidence", question: "I feel able to do the work in front of me." },
  { id: "belonging", label: "Belonging", question: "I feel part of the team and know who to ask." },
];
