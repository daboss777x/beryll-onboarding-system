import type { PersonaCard } from "../schema";

/** Public persona cards. Hidden goals, objections and facts live in content/server/persona-secrets.ts. */
export const personaCards: PersonaCard[] = [
  {
    "id": "bank-ciso",
    "kind": "practice",
    "name": "Cathal Fitzgerald",
    "role": "Chief Information Security Officer",
    "company": "Liffey Mutual Credit Union (Dublin)",
    "channel": "Email and chat",
    "difficulty": "firm",
    "situation": "Cathal is preparing for an internal audit and a NIS2-readiness review. He has a board meeting on 14 December and wants independent evidence of the credit union's security. He is busy, sharp and has been let down by a vendor before.",
    "goalForHire": "Understand what he really needs, explain how a pentest works (including authorisation), set honest expectations and agree a scoping call with an engineer.",
    "openingMessage": "Hi, I've got ten minutes. We need a penetration test before the board meets on 14 December. Can you do it, and what will it cost?",
    "avatarSeed": "cathal-fitzgerald"
  },
  {
    "id": "procurement-officer",
    "kind": "practice",
    "name": "Inês Marques",
    "role": "Procurement Officer",
    "company": "Atlas Freight and Logistics (Cork)",
    "channel": "Phone call transcript",
    "difficulty": "tough",
    "situation": "Inês has been given a quote of EUR 48,000 for a pentest plus retest. Her job is to lower cost and shorten payment terms, and she will say whatever it takes. Atlas has a board-approved budget and a competing offer.",
    "goalForHire": "Stay friendly and firm. Protect the scope and retest, stay within discount authority (5%), escalate what you cannot approve, and keep the conversation moving.",
    "openingMessage": "Hello. I've reviewed your quote. It's 25% over what we budgeted. If you can drop it by a quarter and remove the retest, I can sign this week. Otherwise I'll go with another vendor.",
    "avatarSeed": "ines-marques"
  },
  {
    "id": "sme-owner-breach",
    "kind": "practice",
    "name": "Bríd Costello",
    "role": "Owner",
    "company": "Costello and Daughters Garden Supplies (Galway, online shop)",
    "channel": "WhatsApp",
    "difficulty": "gentle",
    "situation": "Six hours ago a customer told Bríd that the shop's website looked strange and that she had received a spam email from it. The site now shows a message from \"hackers\". Bríd is frightened, tired, and not technical.",
    "goalForHire": "Stay calm and warm, get her to the SOC on-call quickly, avoid giving legal advice or guarantees, mention that the data-protection clock may be running, and agree clear next steps.",
    "openingMessage": "Please help!! Our website has been hacked and customers are getting weird emails from us. I don't know what to do. Are we going to lose everything??",
    "avatarSeed": "brid-costello"
  },
  {
    "id": "ngo-tight-budget",
    "kind": "practice",
    "name": "Ruth Adeyemi",
    "role": "Operations Director",
    "company": "Open Door Youth Services (Limerick)",
    "channel": "Email",
    "difficulty": "gentle",
    "situation": "A funder now requires an independent security assessment of Open Door's website and donor database by the end of January. Ruth has a small budget and a volunteer who looks after IT part-time.",
    "goalForHire": "Understand the funder's real requirement, propose an affordable phased plan (assessment first, training later), avoid cutting corners or giving unauthorised discounts, and be kind.",
    "openingMessage": "Hello, we're a small youth charity and our funder says we need an independent security test of our website by the end of January. We only have around 6,000 euro. Is that realistic?",
    "avatarSeed": "ruth-adeyemi"
  },
  {
    "id": "cert-healthtech",
    "kind": "certification",
    "name": "Mateus Silva",
    "role": "Chief Technology Officer",
    "company": "Kestrel Health Technologies (Dublin and Lisbon)",
    "channel": "Chat",
    "difficulty": "firm",
    "situation": "Kestrel makes cloud software for GP practices. A hospital group has asked for evidence of an independent penetration test by the end of the month. Mateus is friendly and hurried, and sends several requests at once.",
    "goalForHire": "Handle a realistic mixed conversation: scope the portal test, hold the line on authorisation, send nothing to personal accounts, respond to a possible incident correctly, avoid promises, and finish with a clear next step.",
    "openingMessage": "Hi! Mateus here from Kestrel. We need a pentest on our patient portal, ideally starting Monday. My lawyer will sort the paperwork later. Can you send me a quote and last year's sample report to my personal email? Thanks!",
    "avatarSeed": "mateus-silva"
  }
];
export const personaById = (id: string) => personaCards.find((p) => p.id === id);
