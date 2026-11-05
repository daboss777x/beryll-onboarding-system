import "server-only";
import type { DrillKey } from "../schema";

export const drillKeys: DrillKey[] = [
  {
    "drillId": "dh-01",
    "correctOptionId": "b",
    "explanation": "A pentest report is Restricted. It goes to named business recipients through the approved channel only, never to a personal account. The slow portal is a reason to call Elena or the engineer, not to relax the rule.",
    "sopId": "data-classification-policy"
  },
  {
    "drillId": "dh-02",
    "correctOptionId": "b",
    "explanation": "Even without the name, details like URLs or software versions can identify a client and are Restricted. Public AI tools may retain input.",
    "sopId": "data-classification-policy"
  },
  {
    "drillId": "dh-03",
    "correctOptionId": "b",
    "explanation": "The password must travel separately from the file, or encryption adds nothing.",
    "sopId": "data-classification-policy"
  },
  {
    "drillId": "dh-04",
    "correctOptionId": "b",
    "explanation": "Internal colleagues also need a reason to see Restricted material. Curiosity is not a reason.",
    "sopId": "data-classification-policy"
  },
  {
    "drillId": "dh-05",
    "correctOptionId": "b",
    "explanation": "Printouts get lost and cannot be wiped. Avoid printing Restricted data, particularly outside the office.",
    "sopId": "data-classification-policy"
  },
  {
    "drillId": "dh-06",
    "correctOptionId": "b",
    "explanation": "Sharing with a third party is fine if the client, who owns the report, authorises it in writing and the recipients are named and the channel is secure.",
    "sopId": "data-classification-policy"
  },
  {
    "drillId": "dh-07",
    "correctOptionId": "b",
    "explanation": "Devices are stolen from cars constantly. Encryption helps but is not an excuse.",
    "sopId": "data-classification-policy"
  },
  {
    "drillId": "dh-08",
    "correctOptionId": "b",
    "explanation": "Use the VPN or a hotspot and watch for onlookers. Never move Confidential files to personal devices or accounts.",
    "sopId": "data-classification-policy"
  },
  {
    "drillId": "dh-09",
    "correctOptionId": "b",
    "explanation": "Found USB drives are a classic attack. Never plug them in.",
    "sopId": "data-classification-policy"
  },
  {
    "drillId": "dh-10",
    "correctOptionId": "b",
    "explanation": "Credentials by email are exposed already. Test accounts are provided through the agreed secure channel, ideally with the authorisation.",
    "sopId": "authorisation-to-test"
  },
  {
    "drillId": "dh-11",
    "correctOptionId": "b",
    "explanation": "Client names and engagements are confidential unless the client has agreed in writing. A claim of having \"secured\" them is also an over-promise.",
    "sopId": "client-comms-tone"
  },
  {
    "drillId": "dh-12",
    "correctOptionId": "b",
    "explanation": "Possible incidents are Restricted. Public conversations can be overheard and a leak can harm the client.",
    "sopId": "incident-client-comms"
  }
];
