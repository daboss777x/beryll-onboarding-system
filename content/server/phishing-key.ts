import "server-only";
import type { PhishingKey } from "../schema";

export const phishingKey: PhishingKey = {
  "emailId": "phish-m365-expiry",
  "redFlags": [
    {
      "id": "f1",
      "where": "sender",
      "description": "The sender domain is beryll-itsupport.com, not Beryll's real domain. Look-alike domains are a classic trick."
    },
    {
      "id": "f2",
      "where": "sender",
      "description": "The Reply-To address goes somewhere different from the sender, so your reply would go to the attacker."
    },
    {
      "id": "f3",
      "where": "subject",
      "description": "Capital letters, urgency and a threat (\"TODAY\") are designed to stop you thinking."
    },
    {
      "id": "f4",
      "where": "body",
      "description": "A generic greeting (\"Dear User\") instead of your name; a real IT team knows who you are."
    },
    {
      "id": "f5",
      "where": "body",
      "description": "Threat of suspension and deletion at a deadline pressures you to act without checking."
    },
    {
      "id": "f6",
      "where": "link",
      "description": "The button leads to verify-account.example, not a Microsoft or Beryll address. Hover to check where a link really goes."
    },
    {
      "id": "f7",
      "where": "attachment",
      "description": "An unexpected .html attachment can contain a fake login page that captures your password."
    }
  ],
  "correctAction": "Do not click or open anything. Press the report-phish button, which sends it to Security and removes it from your inbox. If you already clicked, tell Security immediately and change your password; there is no shame in it, only in staying quiet."
};
