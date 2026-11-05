import "server-only";
import { getSops } from "./content";
import { stem, tokens } from "./text";

/**
 * Cheap, offline classification of a free-text message, used by the no-key fallbacks
 * (Ask Beryl and the scripted role-play client) so they answer honestly instead of
 * returning an unrelated SOP snippet or script line.
 */
export type MessageIntent = "ok" | "angry" | "non_english" | "unclear";

/** Common English function words (what a real English sentence is full of). */
const FUNCTION_WORDS = new Set(
  (
    "a an the and or but if of to in on at by for with from as is are was were be been am it its this that these those " +
    "i me my we our us you your he she they them their his her what which who whom how why when where do does did done " +
    "can could should would will shall may might must have has had not no yes so than then there here about into over " +
    "just any some all more most very too also please thanks thank hi hello hey ok okay sorry get got go going need want " +
    "know like one two first next new day days week time way let tell ask say see think sure right well good"
  ).split(" "),
);

/** Words that tie a question to onboarding at Beryll even when no SOP matches. */
const ONBOARDING_WORDS = new Set(
  (
    "beryll beryl onboarding onboard bdm buddy manager mentor team colleague client clients customer contract contracts sop sops " +
    "policy process approval approve discount pricing price quote proposal sow scope scoping pentest pen test testing engineer " +
    "engineers report reports authorisation authorization nda dpa gdpr nis2 dora iso crm tender rfp renewal renewals lead leads " +
    "pipeline opportunity escalate escalation incident breach certification certificate quiz lab labs roleplay role play " +
    "training lesson module roadmap task tasks xp checklist laptop access login account email calendar holiday leave payroll " +
    "pay salary probation review checkin check-in shadow shadowing walkthrough mission quest pulse"
  ).split(" "),
);

const ANGER = /\b(f+u+c+k\w*|shit\w*|crap|damn\w*|bloody|wtf|ffs|useless|ridiculous|pathetic|disgrace\w*|disgusting|outrage\w*|furious|livid|fed up|sick of|unacceptable|stupid|idiot\w*|hate|joke of a|worst)\b/i;

let vocab: Set<string> | null = null;
/** Every word stem in the SOPs plus function words: a rough "is this English business text" dictionary. */
function englishVocab(): Set<string> {
  if (!vocab) {
    vocab = new Set<string>();
    for (const s of getSops()) for (const w of (s.title + " " + s.body).toLowerCase().match(/[a-z]+/g) ?? []) vocab.add(stem(w));
    for (const w of FUNCTION_WORDS) vocab.add(stem(w));
    for (const w of ONBOARDING_WORDS) vocab.add(stem(w));
  }
  return vocab;
}

function letterStats(text: string): { letters: number; latin: number; upper: number } {
  let letters = 0;
  let latin = 0;
  let upper = 0;
  for (const ch of text) {
    if (!/\p{L}/u.test(ch)) continue;
    letters++;
    if (/[a-z]/i.test(ch)) latin++;
    if (/[A-Z]/.test(ch)) upper++;
  }
  return { letters, latin, upper };
}

const looksLikeGibberish = (w: string) => w.length >= 3 && (!/[aeiouy]/i.test(w) || /(.)\1{3,}/.test(w));

export function classifyMessage(text: string): MessageIntent {
  const t = text.trim();
  const { letters, latin, upper } = letterStats(t);
  if (letters < 2) return "unclear";
  if (latin / letters < 0.5) return "non_english"; // mostly non-Latin script

  const words = (t.match(/\p{L}[\p{L}'’-]*/gu) ?? []).map((w) => w.toLowerCase());
  const capsWords = (t.match(/\b[A-Z]{4,}\b/g) ?? []).length;
  if (ANGER.test(t) || (letters >= 12 && upper / letters >= 0.6 && /!/.test(t)) || (capsWords >= 3 && /!/.test(t))) return "angry";

  const v = englishVocab();
  const known = words.filter((w) => FUNCTION_WORDS.has(w) || v.has(stem(w.replace(/['’]/g, "")))).length;
  if (words.length >= 3 && known / words.length < 0.4) return "non_english";

  const content = tokens(t);
  if (!content.length || content.every(looksLikeGibberish) || (words.length < 3 && known === 0)) return "unclear";
  return "ok";
}

/** True when the text mentions something about onboarding or the job at Beryll. */
export function mentionsOnboarding(text: string): boolean {
  const words = text.toLowerCase().match(/[a-z0-9-]+/g) ?? [];
  const stems = new Set([...ONBOARDING_WORDS].map(stem));
  return words.some((w) => ONBOARDING_WORDS.has(w) || stems.has(stem(w)));
}

/** Share (0..1) of a sentence's words that are English function words ("the", "we", "to"...). */
export function functionWordShare(sentence: string): number {
  const words = (sentence.toLowerCase().match(/\p{L}[\p{L}'’]*/gu) ?? []).map((w) => w.replace(/['’].*$/, ""));
  if (!words.length) return 0;
  return words.filter((w) => FUNCTION_WORDS.has(w)).length / words.length;
}
