import type { Quiz } from "../schema";

export const quizDays6190: Quiz = {
  "id": "quiz-days61-90",
  "stageId": "days61-90",
  "title": "Days 61-90 refresher",
  "intro": "Renewals, tenders, pricing and incident basics in short scenarios. Pass mark 80%.",
  "passScore": 80,
  "questions": [
    {
      "id": "n-01",
      "type": "single",
      "scenario": "A client's contract ends in 4 months.",
      "prompt": "When should the renewal conversation start?",
      "options": [
        {
          "id": "a",
          "text": "In the final month"
        },
        {
          "id": "b",
          "text": "About 120 days before expiry, ideally at the report meeting"
        },
        {
          "id": "c",
          "text": "After it expires"
        },
        {
          "id": "d",
          "text": "Only if they ask"
        }
      ]
    },
    {
      "id": "n-02",
      "type": "single",
      "scenario": "An auto-renewal clause in a client's contract renews for 3 years unless cancelled with 6 months' notice.",
      "prompt": "What do you do?",
      "options": [
        {
          "id": "a",
          "text": "Accept; auto-renewal is good for us"
        },
        {
          "id": "b",
          "text": "Flag to legal; a multi-year auto-renewal with long notice is a trap for both sides"
        },
        {
          "id": "c",
          "text": "Delete the clause yourself"
        },
        {
          "id": "d",
          "text": "Sign quickly"
        }
      ]
    },
    {
      "id": "n-03",
      "type": "single",
      "scenario": "A public-sector tender arrives with a 3-week deadline.",
      "prompt": "What is the first step?",
      "options": [
        {
          "id": "a",
          "text": "Start writing"
        },
        {
          "id": "b",
          "text": "A bid/no-bid decision within two working days with Liam and Siobhán"
        },
        {
          "id": "c",
          "text": "Ask for an extension"
        },
        {
          "id": "d",
          "text": "Ignore it"
        }
      ]
    },
    {
      "id": "n-04",
      "type": "ordering",
      "scenario": "Responding to a tender.",
      "prompt": "Put the steps in order.",
      "options": [
        {
          "id": "a",
          "text": "Legal reviews the terms"
        },
        {
          "id": "b",
          "text": "Bid/no-bid decision"
        },
        {
          "id": "c",
          "text": "Draft the response and pricing"
        },
        {
          "id": "d",
          "text": "Submit at least a day before the deadline"
        },
        {
          "id": "e",
          "text": "Log the outcome in the CRM"
        }
      ]
    },
    {
      "id": "n-05",
      "type": "single",
      "scenario": "A client wants a 20% discount to sign a two-year renewal.",
      "prompt": "Who must approve?",
      "options": [
        {
          "id": "a",
          "text": "You"
        },
        {
          "id": "b",
          "text": "Siobhán, up to 15%"
        },
        {
          "id": "c",
          "text": "Niamh (Managing Director) for anything above 15%"
        },
        {
          "id": "d",
          "text": "Anyone"
        }
      ]
    },
    {
      "id": "n-06",
      "type": "single",
      "scenario": "A client reports they have just discovered unauthorised access to a database with customer emails.",
      "prompt": "What is the first thing to say?",
      "options": [
        {
          "id": "a",
          "text": "Don't worry, it's probably small"
        },
        {
          "id": "b",
          "text": "Thank you for telling us. I am bringing in our incident team now. Please keep systems as they are, and tell me who your DPO is."
        },
        {
          "id": "c",
          "text": "You must pay a fine"
        },
        {
          "id": "d",
          "text": "I will call you in a week"
        }
      ]
    },
    {
      "id": "n-07",
      "type": "multi",
      "prompt": "Which of these should be in your 90-day conversation? Choose all that apply.",
      "options": [
        {
          "id": "a",
          "text": "Which scorecard goals are met, with evidence"
        },
        {
          "id": "b",
          "text": "One thing the programme should change"
        },
        {
          "id": "c",
          "text": "A plan for the next quarter"
        },
        {
          "id": "d",
          "text": "A list of colleagues you disliked"
        }
      ]
    },
    {
      "id": "n-08",
      "type": "single",
      "prompt": "You have closed a renewal. What is the last step in the pipeline?",
      "options": [
        {
          "id": "a",
          "text": "Send the invoice"
        },
        {
          "id": "b",
          "text": "Mark the contract Signed, update the CRM closed-won and handover notes to the engineers"
        },
        {
          "id": "c",
          "text": "Nothing"
        },
        {
          "id": "d",
          "text": "Celebrate"
        }
      ]
    }
  ]
};
