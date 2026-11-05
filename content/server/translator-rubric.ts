import "server-only";
import type { TranslatorRubric } from "../schema";

export const translatorRubric: TranslatorRubric = {
  "findings": [
    {
      "findingId": "tf-sqli-login",
      "mustInclude": [
        "An outsider could read customer data through the login page",
        "No password or special access is needed",
        "The engineer proved it with a small sample",
        "It is urgent but fixable, with the fix and who owns it",
        "What the CEO should decide or do next"
      ],
      "mustAvoid": [
        "Jargon such as SQLi, parameter, blind, CVSS used without explanation",
        "Promising that no data has been taken"
      ],
      "modelAnswer": "We found a serious weakness in your website's login page. Someone outside the company could use it to read information held about your customers, without needing a password. Our engineer proved this by retrieving a small sample of records. It is a priority because it is easy for an attacker to use, but it is also fixable: your developers can close it quickly, and our team will walk them through it today. We recommend fixing it this week and then retesting. We do not yet know whether anyone else has used it, so you should also ask your IT team to check logs."
    },
    {
      "findingId": "tf-tls-legacy",
      "mustInclude": [
        "The payment connection still accepts outdated security settings",
        "An attacker would need to intercept traffic, so the risk is moderate",
        "Likely to be flagged by auditors or PCI-style checks",
        "Simple configuration change",
        "No evidence of exploitation"
      ],
      "mustAvoid": [
        "Saying there is nothing to worry about",
        "Alarming the CFO with 'critical' language"
      ],
      "modelAnswer": "Your payment page still allows older, weaker security settings when customers connect. To take advantage, an attacker would need to sit between the customer and your server, which is difficult, so the risk is moderate rather than urgent. We saw no sign it has been used. It is still worth fixing soon because auditors and regulators expect modern settings. It is a configuration change your IT provider can make in a few hours."
    },
    {
      "findingId": "tf-open-bucket",
      "mustInclude": [
        "Invoices with customer names and addresses are publicly viewable",
        "Anyone on the internet can find and download them",
        "Personal data means GDPR considerations including the 72-hour clock if it is a breach",
        "Immediate step: close access now",
        "Check logs to see if anyone downloaded them"
      ],
      "mustAvoid": [
        "Giving legal conclusions",
        "Saying it is definitely a reportable breach or definitely not"
      ],
      "modelAnswer": "A storage folder holding about 11,000 customer invoices is open to anyone on the internet. Those invoices include customer names and addresses. The first step is to close the access today. Then your IT team should check the access logs to see whether anyone downloaded files. Because personal data is involved, your data protection officer should be told straight away, as they will decide whether the 72-hour reporting rule applies. We can support you with the technical evidence."
    },
    {
      "findingId": "tf-default-creds",
      "mustInclude": [
        "A control system that runs the warehouse still uses a factory-set password",
        "Anyone on the internal network could take control",
        "Operational impact: wrong labels, wrong picking, delays",
        "Quick fix: change the password and restrict access",
        "Check whether other devices have default passwords"
      ],
      "mustAvoid": [
        "Technical IP details in an executive summary",
        "Understating it because it is internal"
      ],
      "modelAnswer": "The system that controls your warehouse still uses the password it shipped with. Anyone connected to your internal network, including a visitor or an infected laptop, could log in and change pick lists or print wrong labels, which could delay or misdirect shipments. This is quick to fix: change the password and limit who can reach the console. We also suggest checking other devices for factory passwords."
    },
    {
      "findingId": "tf-headers",
      "mustInclude": [
        "Some standard protective settings are missing from the website",
        "Low to moderate risk: mainly affects the donation page",
        "Cheap and quick to fix",
        "Why it matters: protects donors from being tricked",
        "Not an emergency, but do not ignore it"
      ],
      "mustAvoid": [
        "Dismissing it as unimportant",
        "Overdramatising"
      ],
      "modelAnswer": "Your website is missing a few standard protective settings. The main practical risk is that someone could trick a donor by placing your donation page inside a fake page. This is a low-to-moderate risk, and the fix is small and cheap: your web developer can add the settings in under an hour. It is not an emergency, but it is the kind of thing donors and funders increasingly expect."
    }
  ],
  "asks": [
    {
      "askId": "ta-charity-site",
      "goodScopeElements": [
        "Which website, URL and who hosts it",
        "Whether it is a vulnerability assessment (broad, affordable) or a pentest",
        "Donation form and payment provider handled by whom",
        "Testing window and contact",
        "Deliverable: report in plain English with prioritised fixes",
        "Authorisation signed by someone with authority; check the host's rules",
        "Budget range and a phased option"
      ],
      "clarifyingQuestions": [
        "What do donors actually ask for: evidence, a certificate, or reassurance?",
        "Who hosts the site and who can sign an authorisation?",
        "Do you store donor details on the site?",
        "What is the budget?"
      ],
      "redFlags": [
        "Quick look without a defined scope or authorisation",
        "Promising to certify that the website is safe"
      ],
      "modelScope": "Scope: vulnerability assessment of the charity's public website and donation form, hosted by the named provider. Out of scope: the payment provider's own systems. Activities: automated and manual checks for known weaknesses; no disruptive tests. Deliverables: a short plain-English report with a prioritised fix list and a one-page summary for donors. Authorisation: signed by an authorised trustee before testing, and the host's testing policy checked. Option: phased retest after fixes."
    },
    {
      "askId": "ta-audit-six-weeks",
      "goodScopeElements": [
        "Clarify what the auditor requires: policy, technical testing, or both",
        "Define 'everything' into assets: office network, portal, warehouse system, cloud",
        "Prioritise by risk given six weeks",
        "Time for testing plus time for fixes and retest",
        "Authorisation for each environment and third-party hosting",
        "Realistic expectations: a test is not a certificate"
      ],
      "clarifyingQuestions": [
        "What exactly did the auditor ask to see?",
        "Which systems are in the ISO scope statement?",
        "Can we test production or is there staging?",
        "Who signs authorisations for cloud and warehouse systems?"
      ],
      "redFlags": [
        "Agreeing to test everything in six weeks",
        "Implying that testing will make them pass the audit"
      ],
      "modelScope": "Scope after clarification: vulnerability assessment of the systems named in the ISMS scope, plus a pentest of the customer portal, in weeks 1 to 3. Fixes in weeks 3 to 5, retest in week 5. Out of scope: anything not named in the ISO scope statement. Authorisation per environment, with the cloud provider's policy checked. We cannot promise audit success; we provide evidence and prioritised remediation."
    },
    {
      "askId": "ta-phish-staff",
      "goodScopeElements": [
        "Social engineering is a distinct service needing explicit written authorisation",
        "Which techniques: email phishing, phone pretexting, physical",
        "Who is informed (a small group such as the DPO and partners)",
        "Rules about data: no real credentials are kept; results are reported in aggregate",
        "Staff welfare and a debrief with training",
        "Legal and employment considerations",
        "Stop conditions and an emergency contact"
      ],
      "clarifyingQuestions": [
        "Who at the firm has authority to approve, and has the DPO been consulted?",
        "Are staff told in advance in general terms?",
        "Which techniques are allowed?",
        "What do you want to learn: awareness level, or how far an attacker could go?"
      ],
      "redFlags": [
        "Starting any contact with staff without a signed authorisation",
        "Naming and shaming individuals"
      ],
      "modelScope": "Scope: a phishing simulation to all staff over a two-week window, plus (optional) phone pretexting to a sample of 10. Authorisation signed by a partner and acknowledged by the DPO. Results reported in aggregate, with no individual named. A debrief and awareness session follows. Stop rules and an emergency contact are defined in the authorisation letter."
    }
  ],
  "scoring": "Score each rewrite 0-5 against mustInclude (coverage), plain English (no unexplained jargon), tone (calm, not alarmist), and mustAvoid. Score each scope 0-5 against goodScopeElements, whether the clarifying questions are sensible, and absence of redFlags. 70% of the maximum passes."
};
