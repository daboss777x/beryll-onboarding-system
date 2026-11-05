import type { PhishingEmail } from "../schema";

/** The week-2 test phishing email. Red flags are in content/server/phishing-key.ts. */
export const phishingEmail: PhishingEmail = {
  "id": "phish-m365-expiry",
  "fromName": "Beryll IT Helpdesk",
  "fromAddress": "helpdesk@beryll-itsupport.com",
  "replyTo": "it.helpdesk.verify@mail-secure.example",
  "to": "you@beryll.example",
  "subject": "ACTION REQUIRED: your Microsoft 365 password expires TODAY",
  "sentAt": "Tue 17:42",
  "body": "Dear User,\n\nOur records show that your Microsoft 365 password will expire in 2 hours. To avoid losing access to your email and files you must verify your account immediately.\n\nClick the button below to keep your current password:\n\n[ KEEP MY PASSWORD ]\n\nAccounts not verified by 18:00 will be suspended and your pending documents will be deleted.\n\nThank you for your cooperation.\n\nIT Support Team\nBeryll Cyber Security",
  "links": [
    {
      "text": "KEEP MY PASSWORD",
      "url": "https://beryll-login.verify-account.example/m365?u=you"
    }
  ],
  "attachments": [
    "Password_Reset_Form.html"
  ]
};
