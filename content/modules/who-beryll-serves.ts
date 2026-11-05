import type { Lesson } from "../schema";

export const whoBeryllServes: Lesson = {
  id: "who-beryll-serves",
  title: "Who Beryll serves",
  summary: "The clients we work with, what keeps them awake at night, and why they call us.",
  estMinutes: 8,
  sections: [
    {
      heading: "Our clients in five pictures",
      body: "- **Financial services** such as credit unions and payment firms. Regulated, risk-averse, quick to ask for evidence. Often in scope for NIS2 or DORA-style expectations.\n- **Logistics and manufacturing.** Many suppliers, lots of connected systems, procurement teams that negotiate hard.\n- **Health-tech and care providers.** Sensitive personal data; trust is everything.\n- **Online retailers and SMEs.** Small teams, no security staff, often reaching us after something has already gone wrong.\n- **Charities and public bodies.** Tight budgets, public accountability, tenders and grant conditions.",
    },
    {
      heading: "What keeps them awake",
      body: "Almost every conversation comes back to one of these worries:\n\n1. **\"Will we be breached?\"** and the cost of a breach in fines, downtime and trust.\n2. **\"Can we prove we are doing enough?\"** to customers, auditors and boards.\n3. **\"We do not have the people.\"** They need an extra pair of expert hands.\n4. **\"We do not want surprises.\"** Clear scope, clear price, clear timeline.",
      callout: { tone: "example", text: "A logistics CFO does not ask for a web application penetration test. She asks, \"Can a customer's portal leak other customers' shipment data?\" Learn to hear the second sentence behind the first." },
    },
    {
      heading: "Why they choose us",
      body: "We are small enough that the person who finds the problem is often the person who explains it, and big enough to cover testing, monitoring, compliance readiness and training. We write reports that people actually read. Your job is to keep that promise from the first call to the renewal.",
    },
  ],
};
