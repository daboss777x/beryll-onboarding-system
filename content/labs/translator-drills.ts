import type { TranslatorPublic } from "../schema";

/** Engineer-to-client translator drills. The rubric is in content/server/translator-rubric.ts. */
export const translatorDrills: TranslatorPublic = {
  "id": "translator-drills",
  "findings": [
    {
      "id": "tf-sqli-login",
      "title": "SQL injection on the login page",
      "engineerText": "SQLi in /login (POST param `username`), unauthenticated, boolean-based blind and error-based. Allows full read of the users and orders tables. Confirmed dump of 40 sample rows. CVSS 9.8.",
      "cvss": 9.8,
      "cvssVector": "AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H",
      "audience": "CEO of an online retailer",
      "context": "The CEO has no technical background and has a board meeting on Thursday."
    },
    {
      "id": "tf-tls-legacy",
      "title": "Old encryption protocol enabled",
      "engineerText": "TLS 1.0 and 1.1 enabled on payments.gateway endpoint. Weak ciphers (3DES) accepted. No known active exploitation; requires a man-in-the-middle position. CVSS 5.9.",
      "cvss": 5.9,
      "cvssVector": "AV:N/AC:H/PR:N/UI:N/S:U/C:H/I:N/A:N",
      "audience": "CFO of a credit union",
      "context": "The CFO cares about regulators and auditors, and asks, \"Do I need to worry?\""
    },
    {
      "id": "tf-open-bucket",
      "title": "Public storage bucket",
      "engineerText": "S3 bucket `inv-prod-archive` allows anonymous ListBucket and GetObject. Contains ~11,000 PDF invoices with customer names and addresses. Discovered via bucket-name enumeration. CVSS 7.5.",
      "cvss": 7.5,
      "cvssVector": "AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:N/A:N",
      "audience": "Managing Director of a logistics firm",
      "context": "Customer personal data is involved, so GDPR matters. The MD wants to know what happens next."
    },
    {
      "id": "tf-default-creds",
      "title": "Default admin password on warehouse console",
      "engineerText": "Warehouse management console on 10.20.4.15 accepts admin:admin. Reachable from the corporate VLAN. Allows reconfiguring pick lists and printing arbitrary labels. CVSS 9.8 (scored as network-reachable).",
      "cvss": 9.8,
      "cvssVector": "AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H",
      "audience": "COO of a manufacturer",
      "context": "The COO runs operations and wants to know whether shipments could be affected."
    },
    {
      "id": "tf-headers",
      "title": "Missing browser security headers",
      "engineerText": "Missing X-Frame-Options, Content-Security-Policy and Referrer-Policy headers on all pages. Clickjacking possible only on the donation page. CVSS 4.3.",
      "cvss": 4.3,
      "cvssVector": "AV:N/AC:L/PR:N/UI:R/S:U/C:N/I:L/A:N",
      "audience": "Director of a charity",
      "context": "The Director is non-technical, short on budget and might brush this off. The truth is moderate, not trivial and not terrifying."
    }
  ],
  "asks": [
    {
      "id": "ta-charity-site",
      "clientName": "Open Door Youth Services",
      "clientQuote": "Our donors keep asking if our website is safe. Can you just have a quick look and tell us?",
      "context": "A small charity with a WordPress site, an online donation form and a volunteer who looks after IT."
    },
    {
      "id": "ta-audit-six-weeks",
      "clientName": "Aran Foods Ltd",
      "clientQuote": "Our ISO 27001 audit is in six weeks. Can you test everything before then?",
      "context": "A mid-sized food manufacturer with an office network, a customer portal, a warehouse system and some cloud services."
    },
    {
      "id": "ta-phish-staff",
      "clientName": "Marlowe Legal LLP",
      "clientQuote": "Could you see whether our staff would fall for a trick? Maybe call them up or send them something?",
      "context": "A 60-person law firm. The partners are interested, but have not discussed it with staff or their DPO."
    }
  ]
};
