import type { Checklist } from "../schema";

export const paperworkChecklist: Checklist = {
  id: "paperwork",
  title: "Paperwork checklist",
  intro: "Everything Operations and Payroll need before day one. Upload documents through the secure HR portal, never by email.",
  items: [
    { id: "signed-contract", title: "Sign your employment contract", detail: "Review and e-sign the contract in the HR portal. Ask Siobhán or Elena if anything is unclear." },
    { id: "pps-number", title: "Provide your PPS number", detail: "Enter it in the HR portal so Payroll can register you with Revenue." },
    { id: "right-to-work", title: "Confirm your right to work", detail: "Upload a passport or national ID, and a work permit if you need one. Operations will check the originals on day one." },
    { id: "bank-details", title: "Add your bank details", detail: "Enter IBAN and BIC in the portal for payroll." },
    { id: "emergency-contact", title: "Add an emergency contact", detail: "Someone we can call if something happens at work. Visible only to Operations." },
    { id: "equipment-prefs", title: "Choose your equipment preferences", detail: "Laptop operating system, keyboard layout and whether you want a second screen. Elena will order it." },
    { id: "policies-read", title: "Read the acceptable-use and confidentiality policies", detail: "Short and plain English. You will sign them on day one.", why: "Everything you handle at Beryll is covered by them." },
    { id: "tax-credits", title: "Complete your Revenue tax credit details", detail: "Payroll will guide you through this." },
  ],
};

export const securitySetupChecklist: Checklist = {
  id: "security-setup",
  title: "Secure your own setup",
  intro: "We are a cyber security company, so we start with ourselves. These five habits protect you, your colleagues and every client we serve.",
  items: [
    { id: "mfa", title: "Turn on multi-factor authentication", detail: "Use the authenticator app (not SMS where possible) on your work account. Save the recovery codes in your password manager.", why: "MFA stops most account takeovers even when a password leaks." },
    { id: "password-manager", title: "Set up the password manager", detail: "Create a long master passphrase you can remember, and let the manager generate a unique password for every site.", why: "Re-used passwords are how one breach becomes ten." },
    { id: "device-encryption", title: "Check your device is encrypted", detail: "FileVault (Mac) or BitLocker (Windows) must show as On. Lock the screen whenever you step away.", why: "A lost laptop should be an inconvenience, not an incident." },
    { id: "clean-desk", title: "Learn the clean-desk rule", detail: "At the end of the day, client papers are locked away or shredded, and nothing sensitive is left on screens or whiteboards.", why: "Scoping notes contain IP ranges and names; both are Restricted." },
    { id: "report-phish", title: "Find the report-phish button", detail: "Open your email, find the Report Phish button in the toolbar, and press the test button once to see what it does.", why: "Reporting is quicker than deleting and helps protect the team." },
  ],
};

export const shadowLogChecklist: Checklist = {
  id: "shadow-log",
  title: "Shadow log",
  intro: "Sit in on at least five real client interactions in weeks 1 and 2 and note what you saw. Debrief with your buddy afterwards. Keep notes anonymous: no client names or technical details.",
  items: [
    { id: "scoping-call", title: "A scoping call", detail: "What questions did the engineer ask? What did the BDM capture?" },
    { id: "client-checkin", title: "A client check-in", detail: "How did the account owner open and close the call?" },
    { id: "report-debrief", title: "A report debrief or findings call", detail: "How was a technical finding explained in plain English?" },
    { id: "contract-discussion", title: "A contract or pricing discussion", detail: "Which clauses came up? Who was brought in?" },
    { id: "incident-or-soc", title: "An incident, SOC or escalation conversation (live or replayed)", detail: "Who was called, in what order, and what was said to the client?" },
  ],
};

export const checklists: Checklist[] = [paperworkChecklist, securitySetupChecklist, shadowLogChecklist];
export const checklistById = (id: string) => checklists.find((c) => c.id === id);
