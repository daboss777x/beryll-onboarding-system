import type { Quiz } from "../schema";

export const quizWeeks12: Quiz = {
  "id": "quiz-weeks1-2",
  "stageId": "weeks1-2",
  "title": "Weeks 1-2 quiz",
  "intro": "Scenario questions across everything from your first two weeks. Pass mark 80%.",
  "passScore": 80,
  "questions": [
    {
      "id": "w-01",
      "type": "single",
      "scenario": "A client says, \"We want to know if our whole network can be hacked, and we need it cheap.\"",
      "prompt": "Which service fits best as a first step?",
      "options": [
        {
          "id": "a",
          "text": "A red team exercise"
        },
        {
          "id": "b",
          "text": "A vulnerability assessment, with a pentest on the riskiest systems later"
        },
        {
          "id": "c",
          "text": "A managed SOC"
        },
        {
          "id": "d",
          "text": "An ISO 27001 audit"
        }
      ]
    },
    {
      "id": "w-02",
      "type": "single",
      "scenario": "The client's CEO asks, \"So, did you hack us or just scan us?\"",
      "prompt": "How do you explain the difference?",
      "options": [
        {
          "id": "a",
          "text": "They are the same thing"
        },
        {
          "id": "b",
          "text": "A scan uses tools to find known weaknesses; a pentest is a person proving what an attacker could actually do"
        },
        {
          "id": "c",
          "text": "A scan is illegal"
        },
        {
          "id": "d",
          "text": "A pentest only checks passwords"
        }
      ]
    },
    {
      "id": "w-03",
      "type": "single",
      "scenario": "A client calls at 02:00: their files are encrypted and there is a ransom note.",
      "prompt": "Whom do you contact first at Beryll?",
      "options": [
        {
          "id": "a",
          "text": "Siobhán, by email in the morning"
        },
        {
          "id": "b",
          "text": "The SOC on-call, by phone, immediately"
        },
        {
          "id": "c",
          "text": "Legal, by Slack"
        },
        {
          "id": "d",
          "text": "Marketing"
        }
      ]
    },
    {
      "id": "w-04",
      "type": "single",
      "scenario": "The client's DPO asks when a data breach must be reported to the Data Protection Commission.",
      "prompt": "What do you tell them?",
      "options": [
        {
          "id": "a",
          "text": "Within 7 days"
        },
        {
          "id": "b",
          "text": "Within 72 hours of becoming aware, and advise them to involve their legal adviser"
        },
        {
          "id": "c",
          "text": "Only if more than 1,000 people are affected"
        },
        {
          "id": "d",
          "text": "Beryll reports on their behalf"
        }
      ]
    },
    {
      "id": "w-05",
      "type": "single",
      "prompt": "Which label does a penetration test report carry?",
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
      "id": "w-06",
      "type": "multi",
      "scenario": "A draft SOW arrives from a client's procurement team.",
      "prompt": "Which of these must go to legal before you proceed? Choose all that apply.",
      "options": [
        {
          "id": "a",
          "text": "Liability is unlimited"
        },
        {
          "id": "b",
          "text": "The payment term is 30 days"
        },
        {
          "id": "c",
          "text": "Report data may be stored \"anywhere in the world\""
        },
        {
          "id": "d",
          "text": "The testing window is 22:00 to 06:00"
        }
      ]
    },
    {
      "id": "w-07",
      "type": "ordering",
      "scenario": "The approval pipeline in Beryll Contracts.",
      "prompt": "Put the statuses in order.",
      "options": [
        {
          "id": "a",
          "text": "Sent to Client"
        },
        {
          "id": "b",
          "text": "Draft"
        },
        {
          "id": "c",
          "text": "Signed"
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
      "id": "w-08",
      "type": "single",
      "scenario": "You finish a SOW and the client wants it today. The engineer has not signed off.",
      "prompt": "What do you do?",
      "options": [
        {
          "id": "a",
          "text": "Send it and tell the client it is provisional"
        },
        {
          "id": "b",
          "text": "Chase the engineer and tell the client when to expect it"
        },
        {
          "id": "c",
          "text": "Mark the engineer sign-off yourself"
        },
        {
          "id": "d",
          "text": "Skip the engineer; it is only a SOW"
        }
      ]
    },
    {
      "id": "w-09",
      "type": "single",
      "scenario": "A critical finding appears mid-test and the client's IT lead phones you worried.",
      "prompt": "Which reply is best?",
      "options": [
        {
          "id": "a",
          "text": "It's probably nothing; testers exaggerate"
        },
        {
          "id": "b",
          "text": "I understand this is worrying. The engineer found a serious flaw and is already preparing the fix advice. I will call you at 3pm with the engineer."
        },
        {
          "id": "c",
          "text": "It will be fixed by tomorrow"
        },
        {
          "id": "d",
          "text": "Your developers should have caught this"
        }
      ]
    },
    {
      "id": "w-10",
      "type": "multi",
      "prompt": "Which statements about controllers and processors are correct? Choose all that apply.",
      "options": [
        {
          "id": "a",
          "text": "In a typical engagement the client is the controller"
        },
        {
          "id": "b",
          "text": "Beryll is usually a processor and needs a DPA"
        },
        {
          "id": "c",
          "text": "A processor never needs a contract with the controller"
        },
        {
          "id": "d",
          "text": "Transfers outside the EU/EEA need a lawful safeguard such as SCCs"
        }
      ]
    },
    {
      "id": "w-11",
      "type": "single",
      "scenario": "A prospect says, \"We're a hospital supplier, are we in scope for NIS2?\"",
      "prompt": "What is your best answer?",
      "options": [
        {
          "id": "a",
          "text": "Yes, definitely"
        },
        {
          "id": "b",
          "text": "No"
        },
        {
          "id": "c",
          "text": "It may be: it depends on the sector and size and your member state's law. I will bring in our GRC team to confirm."
        },
        {
          "id": "d",
          "text": "Ask Google"
        }
      ]
    },
    {
      "id": "w-12",
      "type": "single",
      "prompt": "A client asks you to email the full report to their personal Gmail because the office server is down. You:",
      "options": [
        {
          "id": "a",
          "text": "Send it; they are the client"
        },
        {
          "id": "b",
          "text": "Say no, offer the secure portal or encrypted transfer to their named business address"
        },
        {
          "id": "c",
          "text": "Send it with a password-protected zip in the same email"
        },
        {
          "id": "d",
          "text": "Send half of it"
        }
      ]
    }
  ]
};
