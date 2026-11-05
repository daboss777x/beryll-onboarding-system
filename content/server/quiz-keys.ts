import "server-only";
import type { QuizKey } from "../schema";

/** Answer keys. Server only: never import from client code. */
export const quizKeys: QuizKey[] = [
  {
    "quizId": "quiz-preboarding",
    "items": [
      {
        "questionId": "pre-01",
        "correct": [
          "b"
        ],
        "explanation": "Security basics come first: encryption protects the data if the laptop is lost, and MFA plus a password manager protect every account you will use. Installing random software comes later and needs approval.",
        "reviewModuleId": "welcome-three-things"
      },
      {
        "questionId": "pre-02",
        "correct": [
          "a",
          "c"
        ],
        "explanation": "Unique generated passwords limit the damage if one site is breached, and the master passphrase should live in your head. Client credentials never go in personal apps.",
        "reviewModuleId": "data-classification"
      },
      {
        "questionId": "pre-03",
        "correct": [
          "c"
        ],
        "explanation": "Urgency plus a login link is a classic phishing pattern. Reporting with the button helps the security team; forwarding it spreads the risk.",
        "reviewModuleId": "data-classification"
      },
      {
        "questionId": "pre-04",
        "correct": [
          "c"
        ],
        "explanation": "Personal data goes through the approved secure channel. Email and text are not secure, and paper notes get lost.",
        "reviewModuleId": "data-classification"
      },
      {
        "questionId": "pre-05",
        "correct": [
          "b"
        ],
        "explanation": "Client identities are confidential. Even hints can identify a client, and in security a client being known as a target can matter.",
        "reviewModuleId": "who-beryll-serves"
      },
      {
        "questionId": "pre-06",
        "correct": [
          "a",
          "c",
          "d"
        ],
        "explanation": "BDMs scope, translate and review contracts. Nobody starts testing without a signed authorisation.",
        "reviewModuleId": "engagement-lifecycle"
      },
      {
        "questionId": "pre-07",
        "correct": [
          "b",
          "d",
          "c",
          "a"
        ],
        "explanation": "Encryption first so nothing is exposed, updates to close known holes, then the password manager, and MFA last so you can store the recovery codes safely.",
        "reviewModuleId": "welcome-three-things"
      },
      {
        "questionId": "pre-08",
        "correct": [
          "c"
        ],
        "explanation": "Clean desk: IP ranges are Restricted. Lock them away or shred them.",
        "reviewModuleId": "data-classification"
      }
    ]
  },
  {
    "quizId": "quiz-day1",
    "items": [
      {
        "questionId": "d1-01",
        "correct": [
          "b"
        ],
        "explanation": "Understanding the trigger shapes scope, service and price. A rush often comes from a customer questionnaire or audit.",
        "reviewModuleId": "who-beryll-serves"
      },
      {
        "questionId": "d1-02",
        "correct": [
          "d",
          "b",
          "c",
          "f",
          "e",
          "a",
          "h",
          "g"
        ],
        "explanation": "Lead, scoping, SOW, authorisation, testing, report, retest, renewal. Authorisation always comes before testing.",
        "reviewModuleId": "engagement-lifecycle"
      },
      {
        "questionId": "d1-03",
        "correct": [
          "b"
        ],
        "explanation": "Day one is deliberately light: just those three.",
        "reviewModuleId": "welcome-three-things"
      },
      {
        "questionId": "d1-04",
        "correct": [
          "b"
        ],
        "explanation": "Asking internally is encouraged. Never ask the client to explain our own report.",
        "reviewModuleId": "welcome-three-things"
      },
      {
        "questionId": "d1-05",
        "correct": [
          "b"
        ],
        "explanation": "Small organisations often have no security staff and come to us after an incident.",
        "reviewModuleId": "who-beryll-serves"
      },
      {
        "questionId": "d1-06",
        "correct": [
          "a",
          "c",
          "d"
        ],
        "explanation": "Never start testing without a signed authorisation, however keen the client.",
        "reviewModuleId": "welcome-three-things"
      },
      {
        "questionId": "d1-07",
        "correct": [
          "b"
        ],
        "explanation": "Verbal permission is not authorisation. It must be signed by someone with authority over the systems.",
        "reviewModuleId": "engagement-lifecycle"
      },
      {
        "questionId": "d1-08",
        "correct": [
          "b"
        ],
        "explanation": "A report is a snapshot; a renewal keeps the picture current.",
        "reviewModuleId": "engagement-lifecycle"
      }
    ]
  },
  {
    "quizId": "quiz-weeks1-2",
    "items": [
      {
        "questionId": "w-01",
        "correct": [
          "b"
        ],
        "explanation": "A broad, affordable first look is a vulnerability assessment. A red team is for mature clients and a SOC is monitoring, not testing.",
        "reviewModuleId": "service-types"
      },
      {
        "questionId": "w-02",
        "correct": [
          "b"
        ],
        "explanation": "A scan lists possible weaknesses; a pentest proves exploitation and impact.",
        "reviewModuleId": "service-types"
      },
      {
        "questionId": "w-03",
        "correct": [
          "b"
        ],
        "explanation": "Live incidents go to the SOC on-call straight away, by phone.",
        "reviewModuleId": "escalation-matrix"
      },
      {
        "questionId": "w-04",
        "correct": [
          "b"
        ],
        "explanation": "The GDPR 72-hour clock starts when the controller becomes aware. You do not give legal advice; you point them to their DPO and legal adviser.",
        "reviewModuleId": "gdpr-nis2-for-bdms"
      },
      {
        "questionId": "w-05",
        "correct": [
          "d"
        ],
        "explanation": "Reports list vulnerabilities and network details: Restricted.",
        "reviewModuleId": "data-classification"
      },
      {
        "questionId": "w-06",
        "correct": [
          "a",
          "c"
        ],
        "explanation": "Unlimited liability and unrestricted data transfers are non-standard and need legal. 30 days is our standard term; testing windows are a scoping matter for engineers.",
        "reviewModuleId": "gdpr-nis2-for-bdms"
      },
      {
        "questionId": "w-07",
        "correct": [
          "b",
          "e",
          "d",
          "a",
          "c"
        ],
        "explanation": "Draft, Legal Review, Engineer Sign-off, Sent to Client, Signed.",
        "reviewModuleId": "engagement-lifecycle"
      },
      {
        "questionId": "w-08",
        "correct": [
          "b"
        ],
        "explanation": "A SOW cannot be sent without engineer sign-off. Chase, and manage the client's expectation.",
        "reviewModuleId": "engagement-lifecycle"
      },
      {
        "questionId": "w-09",
        "correct": [
          "b"
        ],
        "explanation": "Acknowledge, state plainly, say what is happening, give a next step. Do not promise timelines or blame.",
        "reviewModuleId": "client-comms-standards"
      },
      {
        "questionId": "w-10",
        "correct": [
          "a",
          "b",
          "d"
        ],
        "explanation": "The DPA is required between controller and processor, and transfers need a safeguard.",
        "reviewModuleId": "gdpr-nis2-for-bdms"
      },
      {
        "questionId": "w-11",
        "correct": [
          "c"
        ],
        "explanation": "NIS2 scope is nuanced. Escalate to GRC rather than guess.",
        "reviewModuleId": "gdpr-nis2-for-bdms"
      },
      {
        "questionId": "w-12",
        "correct": [
          "b"
        ],
        "explanation": "Restricted data does not go to personal accounts. Offer the approved alternative.",
        "reviewModuleId": "data-classification"
      }
    ]
  },
  {
    "quizId": "quiz-days8-30",
    "items": [
      {
        "questionId": "c-01",
        "correct": [
          "b"
        ],
        "explanation": "Each engagement and retest needs a current signed authorisation, unless the existing one explicitly covers the retest window.",
        "reviewModuleId": "engagement-lifecycle"
      },
      {
        "questionId": "c-02",
        "correct": [
          "b"
        ],
        "explanation": "Third-party hosts may have their own testing policies. Confirm before the engineers start.",
        "reviewModuleId": "engagement-lifecycle"
      },
      {
        "questionId": "c-03",
        "correct": [
          "a",
          "c",
          "d"
        ],
        "explanation": "A 12-month fees cap is our standard. 120-day payment, unlimited liability and unilateral scope changes are all problems.",
        "reviewModuleId": "gdpr-nis2-for-bdms"
      },
      {
        "questionId": "c-04",
        "correct": [
          "b"
        ],
        "explanation": "Transfers need adequacy, SCCs or another safeguard.",
        "reviewModuleId": "gdpr-nis2-for-bdms"
      },
      {
        "questionId": "c-05",
        "correct": [
          "b"
        ],
        "explanation": "Discount authority: BDM up to 5%, Head of Commercial up to 15%, the Managing Director above that.",
        "reviewModuleId": "client-comms-standards"
      },
      {
        "questionId": "c-06",
        "correct": [
          "b"
        ],
        "explanation": "Client results are Restricted and never discussed with third parties.",
        "reviewModuleId": "data-classification"
      },
      {
        "questionId": "c-07",
        "correct": [
          "b",
          "d",
          "a",
          "c",
          "e"
        ],
        "explanation": "Acknowledge, explain value, offer options, check authority, then agree the next step.",
        "reviewModuleId": "client-comms-standards"
      },
      {
        "questionId": "c-08",
        "correct": [
          "b"
        ],
        "explanation": "Never guarantee security. Say what the service does and does not do.",
        "reviewModuleId": "client-comms-standards"
      },
      {
        "questionId": "c-09",
        "correct": [
          "b"
        ],
        "explanation": "The signer must have authority over the systems. Escalate if unsure.",
        "reviewModuleId": "engagement-lifecycle"
      },
      {
        "questionId": "c-10",
        "correct": [
          "a",
          "b"
        ],
        "explanation": "Restricted material only goes through approved secure channels to named recipients.",
        "reviewModuleId": "data-classification"
      }
    ]
  },
  {
    "quizId": "quiz-days31-60",
    "items": [
      {
        "questionId": "m-01",
        "correct": [
          "b"
        ],
        "explanation": "QA sampling is feedback. Seeing a strong example is the quickest way to improve.",
        "reviewModuleId": "client-comms-standards"
      },
      {
        "questionId": "m-02",
        "correct": [
          "b"
        ],
        "explanation": "CRM hygiene: update within one working day. The next step and date are the key fields.",
        "reviewModuleId": "client-comms-standards"
      },
      {
        "questionId": "m-03",
        "correct": [
          "b"
        ],
        "explanation": "SOPs have owners. Suggest, with evidence, and let the owner decide.",
        "reviewModuleId": "escalation-matrix"
      },
      {
        "questionId": "m-04",
        "correct": [
          "a",
          "c",
          "d"
        ],
        "explanation": "Photos of client screens break data handling. Anonymous notes and good questions are the point.",
        "reviewModuleId": "data-classification"
      },
      {
        "questionId": "m-05",
        "correct": [
          "b"
        ],
        "explanation": "Any change to dates or scope needs engineer input and an updated written authorisation.",
        "reviewModuleId": "engagement-lifecycle"
      },
      {
        "questionId": "m-06",
        "correct": [
          "b"
        ],
        "explanation": "Non-standard clauses need legal. The SOC lead must confirm it is deliverable.",
        "reviewModuleId": "gdpr-nis2-for-bdms"
      },
      {
        "questionId": "m-07",
        "correct": [
          "b"
        ],
        "explanation": "Client relationships and results are confidential.",
        "reviewModuleId": "data-classification"
      },
      {
        "questionId": "m-08",
        "correct": [
          "b"
        ],
        "explanation": "Active ownership means regular, planned contact.",
        "reviewModuleId": "client-comms-standards"
      }
    ]
  },
  {
    "quizId": "quiz-days61-90",
    "items": [
      {
        "questionId": "n-01",
        "correct": [
          "b"
        ],
        "explanation": "Start about 120 days out so budgets can be planned. The formal renewal quote goes about 90 days before.",
        "reviewModuleId": "engagement-lifecycle"
      },
      {
        "questionId": "n-02",
        "correct": [
          "b"
        ],
        "explanation": "Long auto-renewals with notice traps are non-standard and need legal.",
        "reviewModuleId": "gdpr-nis2-for-bdms"
      },
      {
        "questionId": "n-03",
        "correct": [
          "b"
        ],
        "explanation": "Qualify before you invest time: bid/no-bid first.",
        "reviewModuleId": "engagement-lifecycle"
      },
      {
        "questionId": "n-04",
        "correct": [
          "b",
          "c",
          "a",
          "d",
          "e"
        ],
        "explanation": "Qualify, draft, legal review, submit early, then log the outcome.",
        "reviewModuleId": "engagement-lifecycle"
      },
      {
        "questionId": "n-05",
        "correct": [
          "c"
        ],
        "explanation": "20% is above the Head of Commercial's authority, so it goes to the Managing Director via Siobhán.",
        "reviewModuleId": "client-comms-standards"
      },
      {
        "questionId": "n-06",
        "correct": [
          "b"
        ],
        "explanation": "Escalate to the SOC at once and remind them to involve their DPO. Preserve evidence, make no promises.",
        "reviewModuleId": "incident-response-basics"
      },
      {
        "questionId": "n-07",
        "correct": [
          "a",
          "b",
          "c"
        ],
        "explanation": "The conversation looks back with evidence and plans ahead.",
        "reviewModuleId": "client-comms-standards"
      },
      {
        "questionId": "n-08",
        "correct": [
          "b"
        ],
        "explanation": "A close without handover leaves engineers guessing.",
        "reviewModuleId": "engagement-lifecycle"
      }
    ]
  },
  {
    "quizId": "quiz-months4-12",
    "items": [
      {
        "questionId": "a-01",
        "correct": [
          "b"
        ],
        "explanation": "Always signed, always authority.",
        "reviewModuleId": "engagement-lifecycle"
      },
      {
        "questionId": "a-02",
        "correct": [
          "d"
        ],
        "explanation": "Restricted. Named recipients, approved transfer only.",
        "reviewModuleId": "data-classification"
      },
      {
        "questionId": "a-03",
        "correct": [
          "b"
        ],
        "explanation": "72 hours. NIS2 adds a 24-hour early warning for significant incidents.",
        "reviewModuleId": "gdpr-nis2-for-bdms"
      },
      {
        "questionId": "a-04",
        "correct": [
          "b"
        ],
        "explanation": "Report and delete.",
        "reviewModuleId": "data-classification"
      },
      {
        "questionId": "a-05",
        "correct": [
          "c",
          "e",
          "d",
          "b",
          "a"
        ],
        "explanation": "Draft, Legal Review, Engineer Sign-off, Sent to Client, Signed.",
        "reviewModuleId": "engagement-lifecycle"
      },
      {
        "questionId": "a-06",
        "correct": [
          "a",
          "c"
        ],
        "explanation": "Standard terms on our template do not; non-standard ones do.",
        "reviewModuleId": "gdpr-nis2-for-bdms"
      },
      {
        "questionId": "a-07",
        "correct": [
          "b"
        ],
        "explanation": "Acknowledge first.",
        "reviewModuleId": "client-comms-standards"
      },
      {
        "questionId": "a-08",
        "correct": [
          "b"
        ],
        "explanation": "BDM 5%, Head of Commercial 15%, Managing Director above.",
        "reviewModuleId": "client-comms-standards"
      }
    ]
  }
];
export const quizKeyById = (quizId: string) => quizKeys.find((k) => k.quizId === quizId);
