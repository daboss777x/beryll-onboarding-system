import type { DrillPublic } from "../schema";

/** Twelve quick decisions. Answers live in content/server/drill-keys.ts. */
export const dataHandlingDrills: DrillPublic[] = [
  {
    "id": "dh-01",
    "scenario": "A client's finance director asks you to send the full pentest report to her personal Gmail because the company portal is slow today. Can you send it?",
    "options": [
      {
        "id": "a",
        "text": "Yes, she is the client's director"
      },
      {
        "id": "b",
        "text": "No. Offer the secure portal or encrypted transfer to her business address, and send the password separately"
      },
      {
        "id": "c",
        "text": "Yes, but zip it with a password in the same email"
      },
      {
        "id": "d",
        "text": "Yes, but only the executive summary"
      }
    ]
  },
  {
    "id": "dh-02",
    "scenario": "You want help rewording a finding about a client's login page, and a public AI chatbot is open in your browser. Can you paste the finding in?",
    "options": [
      {
        "id": "a",
        "text": "Yes, if you leave out the client's name"
      },
      {
        "id": "b",
        "text": "No. Do not paste client information into public tools; ask a colleague or use Beryll's approved tools"
      },
      {
        "id": "c",
        "text": "Yes, but delete the chat afterwards"
      },
      {
        "id": "d",
        "text": "Yes, it is just text"
      }
    ]
  },
  {
    "id": "dh-03",
    "scenario": "You are about to send an encrypted report archive to a client contact. How do you share the password?",
    "options": [
      {
        "id": "a",
        "text": "In the same email"
      },
      {
        "id": "b",
        "text": "By a different channel, such as a phone call or an agreed messaging app"
      },
      {
        "id": "c",
        "text": "Do not use a password"
      },
      {
        "id": "d",
        "text": "Put it in the subject line"
      }
    ]
  },
  {
    "id": "dh-04",
    "scenario": "A colleague in Operations asks to see the Corrib Payments report \"just out of curiosity\". Do you share it?",
    "options": [
      {
        "id": "a",
        "text": "Yes, they work here"
      },
      {
        "id": "b",
        "text": "No. Restricted material is need-to-know; they have no role in that engagement"
      },
      {
        "id": "c",
        "text": "Yes, if you stay beside them"
      },
      {
        "id": "d",
        "text": "Yes, a redacted version by email"
      }
    ]
  },
  {
    "id": "dh-05",
    "scenario": "You are working on a train and want to print the scoping notes, which include client IP ranges, to read on the way home. Should you print them?",
    "options": [
      {
        "id": "a",
        "text": "Yes, paper is safer than a laptop"
      },
      {
        "id": "b",
        "text": "No. IP ranges are Restricted; read on your encrypted laptop and do not take printouts into public"
      },
      {
        "id": "c",
        "text": "Yes, if you shred them tomorrow"
      },
      {
        "id": "d",
        "text": "Yes, but fold them small"
      }
    ]
  },
  {
    "id": "dh-06",
    "scenario": "A client asks you to send their report directly to their external auditor. What do you do?",
    "options": [
      {
        "id": "a",
        "text": "Send it straight away"
      },
      {
        "id": "b",
        "text": "Ask the client's named contact to confirm in writing the auditor's name and address, then send through the secure portal"
      },
      {
        "id": "c",
        "text": "Refuse, since reports are never shared"
      },
      {
        "id": "d",
        "text": "Forward it to the auditor's general inbox"
      }
    ]
  },
  {
    "id": "dh-07",
    "scenario": "You stop for lunch and the car park is quiet. Your work laptop is in the boot. Is it OK to leave it there?",
    "options": [
      {
        "id": "a",
        "text": "Yes, boots are private"
      },
      {
        "id": "b",
        "text": "No. Take it with you or keep it locked in the office; never leave devices in a car"
      },
      {
        "id": "c",
        "text": "Yes, for under an hour"
      },
      {
        "id": "d",
        "text": "Yes, if the laptop is encrypted"
      }
    ]
  },
  {
    "id": "dh-08",
    "scenario": "You need to review a contract draft and the only quiet place is a busy café with public Wi-Fi. What is acceptable?",
    "options": [
      {
        "id": "a",
        "text": "Join the café Wi-Fi and open the contract"
      },
      {
        "id": "b",
        "text": "Use Beryll's VPN or your phone hotspot, and make sure nobody can see your screen"
      },
      {
        "id": "c",
        "text": "Use the café's desktop computer"
      },
      {
        "id": "d",
        "text": "Email the contract to your personal account to read on your phone"
      }
    ]
  },
  {
    "id": "dh-09",
    "scenario": "You find a USB stick in the Beryll car park. What do you do?",
    "options": [
      {
        "id": "a",
        "text": "Plug it in to see whose it is"
      },
      {
        "id": "b",
        "text": "Do not plug it in. Hand it to Operations (Elena) to give to security"
      },
      {
        "id": "c",
        "text": "Throw it in the bin"
      },
      {
        "id": "d",
        "text": "Take it home"
      }
    ]
  },
  {
    "id": "dh-10",
    "scenario": "A client emails you their administrator password so engineers can \"get in quicker\". What do you do?",
    "options": [
      {
        "id": "a",
        "text": "Forward it to the engineer"
      },
      {
        "id": "b",
        "text": "Do not use or forward it. Tell the client to change it, and agree a proper secure way to provide test accounts; tell the engineer"
      },
      {
        "id": "c",
        "text": "Save it in your notes"
      },
      {
        "id": "d",
        "text": "Reply with a thumbs-up"
      }
    ]
  },
  {
    "id": "dh-11",
    "scenario": "You have just finished a project for Kestrel Health Technologies and want to post on LinkedIn: \"Proud to have secured Kestrel's patient portal!\" May you post it?",
    "options": [
      {
        "id": "a",
        "text": "Yes, it's good marketing"
      },
      {
        "id": "b",
        "text": "No, not without the client's written permission and marketing approval"
      },
      {
        "id": "c",
        "text": "Yes, if you omit the portal"
      },
      {
        "id": "d",
        "text": "Yes, in a private group"
      }
    ]
  },
  {
    "id": "dh-12",
    "scenario": "In the pub, a colleague mentions that a client's CTO told you in confidence that they may have been breached. What do you do?",
    "options": [
      {
        "id": "a",
        "text": "Tell the rest of the group, it might be useful"
      },
      {
        "id": "b",
        "text": "Say nothing in public and move the conversation; share it at work, only with those who need to know"
      },
      {
        "id": "c",
        "text": "Post it in a group chat"
      },
      {
        "id": "d",
        "text": "Text the client's competitors"
      }
    ]
  }
];
export const DRILL_PASS_SCORE = 80;
