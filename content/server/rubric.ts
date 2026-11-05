import "server-only";
import type { Rubric } from "../schema";

/**
 * Shared role-play and certification rubric (same for every persona so grading is consistent).
 * overall (0-100) = sum(score/5 * weight) over criteria, weights sum to 100. passThreshold matches the d30-certification task passScore.
 */
export const rubric: Rubric = {
  "passThreshold": 75,
  "criteria": [
    {
      "id": "accuracy",
      "label": "Accuracy",
      "weight": 20,
      "question": "Is what the hire says about services, process, law and Beryll's rules correct?",
      "descriptors": {
        "1": "Multiple factual errors that could mislead the client",
        "2": "A significant error or several small ones",
        "3": "Mostly correct with a noticeable gap or an unclear explanation",
        "4": "Correct throughout, with one minor imprecision",
        "5": "Fully correct, precise and confidently explained without jargon"
      }
    },
    {
      "id": "tone",
      "label": "Tone",
      "weight": 15,
      "question": "Is the hire warm, calm, professional and adapted to the client's state?",
      "descriptors": {
        "1": "Cold, defensive, dismissive or panicky",
        "2": "Stiff or inconsistent; ignores the client's feelings",
        "3": "Polite but generic; acknowledges emotion only briefly",
        "4": "Warm and professional, adapts well",
        "5": "Calm, empathetic and confident; the client clearly feels heard"
      }
    },
    {
      "id": "escalation",
      "label": "Escalation",
      "weight": 20,
      "question": "Does the hire spot what needs escalating and to whom, at the right time?",
      "descriptors": {
        "1": "Misses clear escalation triggers or decides alone",
        "2": "Escalates late or to the wrong person",
        "3": "Escalates some triggers but misses others",
        "4": "Escalates correctly, with minor delay or vagueness",
        "5": "Spots every trigger, names the right person and timing, and tells the client what will happen"
      }
    },
    {
      "id": "data_handling",
      "label": "Data handling",
      "weight": 15,
      "question": "Does the hire protect client data and follow the classification rules?",
      "descriptors": {
        "1": "Agrees to send Restricted data insecurely or shares sensitive details carelessly",
        "2": "Hesitates but lets a risky request stand",
        "3": "Declines the risky request but offers no alternative",
        "4": "Declines and offers the approved channel",
        "5": "Declines clearly, proposes the secure route, and keeps their own handling clean throughout"
      }
    },
    {
      "id": "no_over_promising",
      "label": "No over-promising",
      "weight": 15,
      "question": "Does the hire avoid guarantees, unauthorised commitments and unrealistic timelines?",
      "descriptors": {
        "1": "Guarantees security, outcomes or discounts they cannot authorise",
        "2": "Makes one clear unauthorised promise",
        "3": "Softens a promise but still implies a guarantee",
        "4": "Avoids promises, with a minor imprecise phrase",
        "5": "Consistently says what is known, what is not, and what happens next; no unauthorised promises"
      }
    },
    {
      "id": "next_step",
      "label": "Clear next step",
      "weight": 15,
      "question": "Does the conversation end with a specific, agreed next step?",
      "descriptors": {
        "1": "No next step; the client is left unsure",
        "2": "A vague next step such as 'we'll be in touch'",
        "3": "A next step with no owner or date",
        "4": "A clear next step with an owner or a date",
        "5": "A clear, agreed next step with owner, date and a summary of what each side will do"
      }
    }
  ]
};
