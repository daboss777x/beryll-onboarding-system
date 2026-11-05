import type { Quiz } from "../schema";

export const quizMonths412: Quiz = {
  "id": "quiz-months4-12",
  "stageId": "months4-12",
  "title": "Annual refresher quiz",
  "intro": "Keep the non-negotiables fresh. Pass mark 80%.",
  "passScore": 80,
  "questions": [
    {
      "id": "a-01",
      "type": "single",
      "scenario": "A friendly client says verbally, \"Go ahead and test our new site next week.\"",
      "prompt": "What is required before testing?",
      "options": [
        {
          "id": "a",
          "text": "Nothing; it is a verbal go-ahead"
        },
        {
          "id": "b",
          "text": "A signed authorisation from someone with authority, covering the new site"
        },
        {
          "id": "c",
          "text": "An email from anyone"
        },
        {
          "id": "d",
          "text": "A text from the CEO"
        }
      ]
    },
    {
      "id": "a-02",
      "type": "single",
      "prompt": "A pentest report is classified:",
      "options": [
        {
          "id": "a",
          "text": "Public"
        },
        {
          "id": "b",
          "text": "Internal"
        },
        {
          "id": "c",
          "text": "Confidential"
        },
        {
          "id": "d",
          "text": "Restricted"
        }
      ]
    },
    {
      "id": "a-03",
      "type": "single",
      "prompt": "Under GDPR, the supervisory authority is notified of a personal-data breach within:",
      "options": [
        {
          "id": "a",
          "text": "24 hours"
        },
        {
          "id": "b",
          "text": "72 hours of becoming aware"
        },
        {
          "id": "c",
          "text": "7 days"
        },
        {
          "id": "d",
          "text": "30 days"
        }
      ]
    },
    {
      "id": "a-04",
      "type": "single",
      "scenario": "An email from \"Beryll IT\" asks you to confirm your password at a link.",
      "prompt": "What do you do?",
      "options": [
        {
          "id": "a",
          "text": "Confirm"
        },
        {
          "id": "b",
          "text": "Report with the phish button and delete"
        },
        {
          "id": "c",
          "text": "Reply to ask"
        },
        {
          "id": "d",
          "text": "Forward"
        }
      ]
    },
    {
      "id": "a-05",
      "type": "ordering",
      "scenario": "The approval pipeline.",
      "prompt": "Order the statuses.",
      "options": [
        {
          "id": "a",
          "text": "Signed"
        },
        {
          "id": "b",
          "text": "Sent to Client"
        },
        {
          "id": "c",
          "text": "Draft"
        },
        {
          "id": "d",
          "text": "Engineer Sign-off"
        },
        {
          "id": "e",
          "text": "Legal Review"
        }
      ]
    },
    {
      "id": "a-06",
      "type": "multi",
      "prompt": "Which clauses need legal before you proceed? Choose all that apply.",
      "options": [
        {
          "id": "a",
          "text": "Unlimited liability"
        },
        {
          "id": "b",
          "text": "Standard 30-day payment"
        },
        {
          "id": "c",
          "text": "Transfers outside the EU/EEA without SCCs"
        },
        {
          "id": "d",
          "text": "A mutual NDA on our template"
        }
      ]
    },
    {
      "id": "a-07",
      "type": "single",
      "prompt": "A client is upset about a critical finding. Your first words are:",
      "options": [
        {
          "id": "a",
          "text": "Actually, that is what the test is for"
        },
        {
          "id": "b",
          "text": "I understand why this is worrying. Here is what we found and what happens next."
        },
        {
          "id": "c",
          "text": "It's fine"
        },
        {
          "id": "d",
          "text": "It's not our fault"
        }
      ]
    },
    {
      "id": "a-08",
      "type": "single",
      "prompt": "Discount authority for a BDM is up to:",
      "options": [
        {
          "id": "a",
          "text": "0%"
        },
        {
          "id": "b",
          "text": "5%"
        },
        {
          "id": "c",
          "text": "15%"
        },
        {
          "id": "d",
          "text": "25%"
        }
      ]
    }
  ]
};
