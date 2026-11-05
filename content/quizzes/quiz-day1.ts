import type { Quiz } from "../schema";

export const quizDay1: Quiz = {
  "id": "quiz-day1",
  "stageId": "day1",
  "title": "Day 1 check",
  "intro": "Short scenarios on who we serve and how an engagement flows. Pass mark 70%.",
  "passScore": 70,
  "questions": [
    {
      "id": "d1-01",
      "type": "single",
      "scenario": "A prospect says, \"We need a pentest by Friday.\"",
      "prompt": "What is your best first move?",
      "options": [
        {
          "id": "a",
          "text": "Quote a price"
        },
        {
          "id": "b",
          "text": "Ask what triggered the request and what they hope to prove"
        },
        {
          "id": "c",
          "text": "Book testers for Friday"
        },
        {
          "id": "d",
          "text": "Tell them it is impossible"
        }
      ]
    },
    {
      "id": "d1-02",
      "type": "ordering",
      "scenario": "The engagement lifecycle.",
      "prompt": "Put the steps in order.",
      "options": [
        {
          "id": "a",
          "text": "Report"
        },
        {
          "id": "b",
          "text": "Scoping"
        },
        {
          "id": "c",
          "text": "SOW"
        },
        {
          "id": "d",
          "text": "Lead"
        },
        {
          "id": "e",
          "text": "Testing"
        },
        {
          "id": "f",
          "text": "Authorisation"
        },
        {
          "id": "g",
          "text": "Renewal"
        },
        {
          "id": "h",
          "text": "Retest"
        }
      ]
    },
    {
      "id": "d1-03",
      "type": "single",
      "prompt": "What are the Three Things on your Day-1 card?",
      "options": [
        {
          "id": "a",
          "text": "Pricing, templates, CRM"
        },
        {
          "id": "b",
          "text": "Who we serve, what good looks like, who to ask"
        },
        {
          "id": "c",
          "text": "Laptop, badge, desk"
        },
        {
          "id": "d",
          "text": "Services, tools, targets"
        }
      ]
    },
    {
      "id": "d1-04",
      "type": "single",
      "scenario": "You are unsure how to read a section of a pentest report.",
      "prompt": "Who is the ideal first person to ask?",
      "options": [
        {
          "id": "a",
          "text": "The client"
        },
        {
          "id": "b",
          "text": "Marco, your buddy, or an engineer such as Jonas"
        },
        {
          "id": "c",
          "text": "Nobody; figure it out"
        },
        {
          "id": "d",
          "text": "Social media"
        }
      ]
    },
    {
      "id": "d1-05",
      "type": "single",
      "prompt": "Which client most likely reaches us after something has already gone wrong?",
      "options": [
        {
          "id": "a",
          "text": "A large listed bank"
        },
        {
          "id": "b",
          "text": "An online retailer SME without a security team"
        },
        {
          "id": "c",
          "text": "A government department"
        },
        {
          "id": "d",
          "text": "A software giant"
        }
      ]
    },
    {
      "id": "d1-06",
      "type": "multi",
      "prompt": "Which of these are things a good BDM does consistently? Choose all that apply.",
      "options": [
        {
          "id": "a",
          "text": "Scopes honestly"
        },
        {
          "id": "b",
          "text": "Starts testing early when the client is keen"
        },
        {
          "id": "c",
          "text": "Explains findings in plain English"
        },
        {
          "id": "d",
          "text": "Escalates early"
        }
      ]
    },
    {
      "id": "d1-07",
      "type": "single",
      "scenario": "A friendly prospect says, \"My IT guy says we're fine to start testing tomorrow, no need for paperwork.\"",
      "prompt": "What do you say?",
      "options": [
        {
          "id": "a",
          "text": "Fine, tomorrow then"
        },
        {
          "id": "b",
          "text": "We need a signed authorisation from someone with the authority to give it, then we can start"
        },
        {
          "id": "c",
          "text": "Only the paperwork for the first day"
        },
        {
          "id": "d",
          "text": "Let me ask my buddy whether to bother"
        }
      ]
    },
    {
      "id": "d1-08",
      "type": "single",
      "prompt": "Why does the lifecycle end with renewal rather than the report?",
      "options": [
        {
          "id": "a",
          "text": "Reports are not important"
        },
        {
          "id": "b",
          "text": "Security is continuous; new systems and threats appear, so the relationship continues"
        },
        {
          "id": "c",
          "text": "Renewals are the only revenue"
        },
        {
          "id": "d",
          "text": "It is a legal requirement"
        }
      ]
    }
  ]
};
