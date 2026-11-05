import type { Quiz } from "../schema";

export const quizDays830: Quiz = {
  "id": "quiz-days8-30",
  "stageId": "days8-30",
  "title": "Days 8-30 quiz",
  "intro": "Authorisation, contract risk and data handling in realistic scenarios. Pass mark 80%.",
  "passScore": 80,
  "questions": [
    {
      "id": "c-01",
      "type": "single",
      "scenario": "A long-standing client's CTO emails: \"Please run the retest on Monday. Same scope as last time.\" You have no new signed authorisation.",
      "prompt": "What do you do?",
      "options": [
        {
          "id": "a",
          "text": "Go ahead; they authorised it last time"
        },
        {
          "id": "b",
          "text": "Ask for a fresh signed authorisation (or confirmed extension) before the retest"
        },
        {
          "id": "c",
          "text": "Verbally confirm on a call and start"
        },
        {
          "id": "d",
          "text": "Ask the engineer to decide"
        }
      ]
    },
    {
      "id": "c-02",
      "type": "single",
      "scenario": "The client's hosting is with a cloud provider. The client signs an authorisation for their application.",
      "prompt": "What else should you check?",
      "options": [
        {
          "id": "a",
          "text": "Nothing, the client owns it"
        },
        {
          "id": "b",
          "text": "Whether the provider's rules allow testing and if their permission is needed"
        },
        {
          "id": "c",
          "text": "Whether the client likes our logo"
        },
        {
          "id": "d",
          "text": "Whether the cloud provider is Irish"
        }
      ]
    },
    {
      "id": "c-03",
      "type": "multi",
      "scenario": "A client MSA contains the clauses below.",
      "prompt": "Which are red flags? Choose all that apply.",
      "options": [
        {
          "id": "a",
          "text": "Payment within 120 days of invoice"
        },
        {
          "id": "b",
          "text": "Liability capped at fees paid in the previous 12 months"
        },
        {
          "id": "c",
          "text": "Beryll's liability is unlimited for all losses"
        },
        {
          "id": "d",
          "text": "The client may change the scope by email at any time with no change to the fee"
        }
      ]
    },
    {
      "id": "c-04",
      "type": "single",
      "scenario": "A client's DPA says report data may be sent to an affiliate in a country without an adequacy decision, with no safeguards named.",
      "prompt": "What is the problem?",
      "options": [
        {
          "id": "a",
          "text": "None; affiliates are fine"
        },
        {
          "id": "b",
          "text": "A transfer outside the EU/EEA needs a lawful safeguard such as SCCs"
        },
        {
          "id": "c",
          "text": "The DPA is too long"
        },
        {
          "id": "d",
          "text": "The affiliate is too big"
        }
      ]
    },
    {
      "id": "c-05",
      "type": "single",
      "scenario": "A prospect wants a 12% discount on a pentest. Your authority is up to 5%.",
      "prompt": "What do you do?",
      "options": [
        {
          "id": "a",
          "text": "Agree and tell Siobhán afterwards"
        },
        {
          "id": "b",
          "text": "Offer 5% or a scope option, and check anything higher with Siobhán before replying"
        },
        {
          "id": "c",
          "text": "Refuse flatly"
        },
        {
          "id": "d",
          "text": "Ask the client to talk to Niamh"
        }
      ]
    },
    {
      "id": "c-06",
      "type": "single",
      "scenario": "You receive a sales email from a friend at another company asking about your client's pentest results.",
      "prompt": "How do you respond?",
      "options": [
        {
          "id": "a",
          "text": "Share a little to help"
        },
        {
          "id": "b",
          "text": "Decline politely; client information is confidential"
        },
        {
          "id": "c",
          "text": "Share if they promise secrecy"
        },
        {
          "id": "d",
          "text": "Ask the client"
        }
      ]
    },
    {
      "id": "c-07",
      "type": "ordering",
      "scenario": "A procurement officer says, \"Drop the price by 25% and remove the retest.\"",
      "prompt": "Put your response steps in order.",
      "options": [
        {
          "id": "a",
          "text": "Offer scope or phasing options"
        },
        {
          "id": "b",
          "text": "Acknowledge the budget pressure"
        },
        {
          "id": "c",
          "text": "Check any discount above 5% with Siobhán"
        },
        {
          "id": "d",
          "text": "Explain what the retest protects"
        },
        {
          "id": "e",
          "text": "Agree next steps and a date"
        }
      ]
    },
    {
      "id": "c-08",
      "type": "single",
      "scenario": "In a role-play the CISO asks, \"Can you guarantee we won't be breached after your test?\"",
      "prompt": "What is the right answer?",
      "options": [
        {
          "id": "a",
          "text": "Yes, after our test you are secure"
        },
        {
          "id": "b",
          "text": "No one can guarantee that; the test shows where you are exposed today, and the retest confirms the fixes"
        },
        {
          "id": "c",
          "text": "It depends on your IT team"
        },
        {
          "id": "d",
          "text": "We cannot discuss that"
        }
      ]
    },
    {
      "id": "c-09",
      "type": "single",
      "scenario": "An engineer says, \"The client's contact signed the authorisation, but she is a junior analyst.\"",
      "prompt": "What is the concern?",
      "options": [
        {
          "id": "a",
          "text": "None"
        },
        {
          "id": "b",
          "text": "The signatory may not have authority to authorise testing of these systems; confirm with someone who does"
        },
        {
          "id": "c",
          "text": "She should have printed it"
        },
        {
          "id": "d",
          "text": "The font was small"
        }
      ]
    },
    {
      "id": "c-10",
      "type": "multi",
      "scenario": "You are about to send a Restricted report.",
      "prompt": "Which are correct ways to do it? Choose all that apply.",
      "options": [
        {
          "id": "a",
          "text": "The secure client portal, to named recipients"
        },
        {
          "id": "b",
          "text": "Encrypted transfer, password sent by a separate channel"
        },
        {
          "id": "c",
          "text": "Attached unencrypted to an email"
        },
        {
          "id": "d",
          "text": "A public file-sharing link anyone can open"
        }
      ]
    }
  ]
};
