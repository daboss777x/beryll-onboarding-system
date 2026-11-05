import type { Quiz } from "../schema";

export const quizPreboarding: Quiz = {
  "id": "quiz-preboarding",
  "stageId": "preboarding",
  "title": "Pre-boarding check",
  "intro": "Quick scenarios on the job and on the security habits you set up before day one. Pass mark 70%.",
  "passScore": 70,
  "questions": [
    {
      "id": "pre-01",
      "type": "single",
      "scenario": "Your new laptop arrives at home the day before you start.",
      "prompt": "What do you do first?",
      "options": [
        {
          "id": "a",
          "text": "Connect it to home Wi-Fi and sign in to everything"
        },
        {
          "id": "b",
          "text": "Check that disk encryption is on, then set up your password manager and MFA"
        },
        {
          "id": "c",
          "text": "Install your favourite apps and a VPN"
        },
        {
          "id": "d",
          "text": "Leave it in the box until Elena calls"
        }
      ]
    },
    {
      "id": "pre-02",
      "type": "multi",
      "prompt": "Which of these are good password-manager habits? Choose all that apply.",
      "options": [
        {
          "id": "a",
          "text": "One long, unique, generated password per account"
        },
        {
          "id": "b",
          "text": "Re-using your favourite strong password for all work sites"
        },
        {
          "id": "c",
          "text": "A strong master passphrase that you never write on a sticky note"
        },
        {
          "id": "d",
          "text": "Saving client credentials in a personal notes app for convenience"
        }
      ]
    },
    {
      "id": "pre-03",
      "type": "single",
      "scenario": "An email arrives: \"IT Support: your mailbox is almost full. Log in within 2 hours to avoid suspension.\" It uses a link to a login page.",
      "prompt": "What should you do?",
      "options": [
        {
          "id": "a",
          "text": "Click the link and log in quickly"
        },
        {
          "id": "b",
          "text": "Reply asking if it is real"
        },
        {
          "id": "c",
          "text": "Do not click; use the report-phish button, then carry on"
        },
        {
          "id": "d",
          "text": "Forward it to colleagues as a warning"
        }
      ]
    },
    {
      "id": "pre-04",
      "type": "single",
      "scenario": "Elena asks for your PPS number and bank details for payroll.",
      "prompt": "What is the right way to send them?",
      "options": [
        {
          "id": "a",
          "text": "Reply to her email with a photo"
        },
        {
          "id": "b",
          "text": "Text them to her"
        },
        {
          "id": "c",
          "text": "Upload them through the secure HR portal link in your welcome pack"
        },
        {
          "id": "d",
          "text": "Bring them on a sticky note on day one"
        }
      ]
    },
    {
      "id": "pre-05",
      "type": "single",
      "scenario": "At a family dinner someone asks who Beryll's biggest clients are.",
      "prompt": "What is the best answer?",
      "options": [
        {
          "id": "a",
          "text": "Name a few to sound impressive"
        },
        {
          "id": "b",
          "text": "Say you cannot discuss clients, and talk about what you do instead"
        },
        {
          "id": "c",
          "text": "Describe them without names, but mention the town"
        },
        {
          "id": "d",
          "text": "Share the list if they promise not to tell anyone"
        }
      ]
    },
    {
      "id": "pre-06",
      "type": "multi",
      "scenario": "You have read \"A week as a Beryll BDM\".",
      "prompt": "Which of these are part of the BDM role? Choose all that apply.",
      "options": [
        {
          "id": "a",
          "text": "Running scoping calls with engineers"
        },
        {
          "id": "b",
          "text": "Quietly agreeing a test start date before an authorisation is signed"
        },
        {
          "id": "c",
          "text": "Translating findings into plain English for executives"
        },
        {
          "id": "d",
          "text": "Reviewing client contracts and escalating risky clauses to legal"
        }
      ]
    },
    {
      "id": "pre-07",
      "type": "ordering",
      "scenario": "Setting up a new work laptop securely.",
      "prompt": "Put these steps in a sensible order.",
      "options": [
        {
          "id": "a",
          "text": "Enrol in multi-factor authentication"
        },
        {
          "id": "b",
          "text": "Confirm full-disk encryption is on"
        },
        {
          "id": "c",
          "text": "Install the password manager and create the master passphrase"
        },
        {
          "id": "d",
          "text": "Install the operating-system updates"
        }
      ]
    },
    {
      "id": "pre-08",
      "type": "single",
      "scenario": "It is 18:00 on Friday. Your desk has handwritten scoping notes with a client's IP ranges.",
      "prompt": "What should you do before leaving?",
      "options": [
        {
          "id": "a",
          "text": "Leave them; the office is locked"
        },
        {
          "id": "b",
          "text": "Take a photo and send it to your personal phone"
        },
        {
          "id": "c",
          "text": "Put them in the locked drawer or shred them if no longer needed"
        },
        {
          "id": "d",
          "text": "Tuck them under the keyboard"
        }
      ]
    }
  ]
};
