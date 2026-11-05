import type { StageDef } from "../lib/types";

/**
 * Seven stages from spec C5.
 * NOTE: the stage id "days8-30" keeps the spec's name, but its startDay is 15 (not 8) so it does not
 * overlap "weeks1-2" (days 2-14). Walkthrough-solo and certification work therefore unlocks from day 15,
 * or earlier if the hire finishes weeks1-2 early (unlock logic is Natalie's, based on exit criteria + day).
 */
export const stages: StageDef[] = [
  {
    id: "preboarding",
    order: 0,
    title: "Pre-boarding",
    subtitle: "Before you start: see the job, sort the paperwork, secure your kit",
    startDay: 0,
    endDay: 0,
    playable: "full",
    doneMeans: "Your paperwork checklist is complete and your own security setup (MFA, password manager, encrypted laptop) is done, so day one starts clean.",
  },
  {
    id: "day1",
    order: 1,
    title: "Day 1",
    subtitle: "Three things to know, and the people to ask",
    startDay: 1,
    endDay: 1,
    playable: "full",
    doneMeans: "You have submitted your Best Self story and know who Beryll serves, what good looks like, and who to ask.",
  },
  {
    id: "weeks1-2",
    order: 2,
    title: "Weeks 1-2",
    subtitle: "Learn the business: services, lifecycle, contracts and the rules that keep us safe",
    startDay: 2,
    endDay: 14,
    playable: "full",
    doneMeans: "You score 80% or more on the stage quiz, have completed all three contract walkthroughs at Guided level, and agreed your 30/60/90 scorecard with your manager.",
    rankOnComplete: "copilot",
  },
  {
    id: "days8-30",
    order: 3,
    title: "Days 8-30 (certify)",
    subtitle: "Do it solo, practise with AI clients, and earn the right to talk to real clients on your own",
    startDay: 15, // spec title says days 8-30; start moved to 15 to avoid overlapping weeks1-2
    endDay: 30,
    playable: "full",
    doneMeans: "You have passed the certification (AI client role-play plus your manager's live observation), which unlocks solo client contact and your day-30 certificate.",
    rankOnComplete: "solo",
  },
  {
    id: "days31-60",
    order: 4,
    title: "Days 31-60",
    subtitle: "Your own accounts, with quality sampling and a first improvement to the way we work",
    startDay: 31,
    endDay: 60,
    playable: "light",
    doneMeans: "Your manager has scored a sample of your real client emails and calls, and you have submitted your Fix-one-SOP mission.",
  },
  {
    id: "days61-90",
    order: 5,
    title: "Days 61-90",
    subtitle: "Review the scorecard, have the 90-day conversation, and tell us how onboarding went",
    startDay: 61,
    endDay: 90,
    playable: "light",
    doneMeans: "Your manager has signed off your 90-day scorecard and conversation, which makes you Independent and unlocks your day-90 certificate.",
    rankOnComplete: "independent",
  },
  {
    id: "months4-12",
    order: 6,
    title: "Months 4-12",
    subtitle: "Quarterly check-ins to keep growing",
    startDay: 91,
    endDay: 365,
    playable: "cards",
    doneMeans: "There is no exit gate here. Each quarter you and your manager review progress and pick one thing to grow next.",
  },
];

export const stageById = (id: StageDef["id"]): StageDef => {
  const s = stages.find((x) => x.id === id);
  if (!s) throw new Error(`Unknown stage ${id}`);
  return s;
};
