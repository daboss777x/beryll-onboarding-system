import type { Quiz } from "../schema";

export const quizDays3160: Quiz = {
  "id": "quiz-days31-60",
  "stageId": "days31-60",
  "title": "Days 31-60 refresher",
  "intro": "Short scenarios from your first weeks with your own accounts, with a few earlier items coming back. Pass mark 80%.",
  "passScore": 80,
  "questions": [
    {
      "id": "m-01",
      "type": "single",
      "scenario": "Your manager scores one of your client emails 2 out of 5 for clarity.",
      "prompt": "What is the most useful response?",
      "options": [
        {
          "id": "a",
          "text": "Argue the score"
        },
        {
          "id": "b",
          "text": "Ask for an example of a 5 and rewrite yours"
        },
        {
          "id": "c",
          "text": "Ignore it"
        },
        {
          "id": "d",
          "text": "Stop emailing clients"
        }
      ]
    },
    {
      "id": "m-02",
      "type": "single",
      "scenario": "After a client call you have ten minutes before the next meeting.",
      "prompt": "What do you do first?",
      "options": [
        {
          "id": "a",
          "text": "Check email"
        },
        {
          "id": "b",
          "text": "Update the CRM: summary, next step and date"
        },
        {
          "id": "c",
          "text": "Take a break"
        },
        {
          "id": "d",
          "text": "Plan lunch"
        }
      ]
    },
    {
      "id": "m-03",
      "type": "single",
      "scenario": "You notice the scoping-call SOP says \"two engineers\" but in practice one is enough.",
      "prompt": "What is the best step?",
      "options": [
        {
          "id": "a",
          "text": "Edit the SOP yourself"
        },
        {
          "id": "b",
          "text": "Propose the change to the SOP owner through the Fix-one-SOP mission with a reason"
        },
        {
          "id": "c",
          "text": "Ignore it"
        },
        {
          "id": "d",
          "text": "Tell the client"
        }
      ]
    },
    {
      "id": "m-04",
      "type": "multi",
      "scenario": "An engineer is helping a client on a live engagement and you join them for an hour as part of your cross-team quest.",
      "prompt": "What are sensible things to do? Choose all that apply.",
      "options": [
        {
          "id": "a",
          "text": "Listen and ask what the client sees in the report"
        },
        {
          "id": "b",
          "text": "Take photos of the client's screen for your notes"
        },
        {
          "id": "c",
          "text": "Keep notes without client names or IP addresses"
        },
        {
          "id": "d",
          "text": "Ask what the engineer wishes BDMs knew"
        }
      ]
    },
    {
      "id": "m-05",
      "type": "single",
      "scenario": "A client asks to extend the testing window by a week \"because our team is busy\".",
      "prompt": "What do you do?",
      "options": [
        {
          "id": "a",
          "text": "Agree; it is only a week"
        },
        {
          "id": "b",
          "text": "Check with the lead engineer for capacity and update the SOW or authorisation in writing"
        },
        {
          "id": "c",
          "text": "Tell the client to ask again later"
        },
        {
          "id": "d",
          "text": "Extend the authorisation yourself"
        }
      ]
    },
    {
      "id": "m-06",
      "type": "single",
      "scenario": "A NIS2-scope client is asking for a clause that Beryll notifies them of any incident within 4 hours.",
      "prompt": "What is the right move?",
      "options": [
        {
          "id": "a",
          "text": "Accept; we are fast"
        },
        {
          "id": "b",
          "text": "Flag to Legal and the SOC lead; the standard is early warning in line with NIS2 timelines"
        },
        {
          "id": "c",
          "text": "Reject without discussion"
        },
        {
          "id": "d",
          "text": "Tell them 72 hours only"
        }
      ]
    },
    {
      "id": "m-07",
      "type": "single",
      "scenario": "A colleague at another client's firm asks if Beryll has tested a competitor.",
      "prompt": "What do you say?",
      "options": [
        {
          "id": "a",
          "text": "Yes, here's what we found"
        },
        {
          "id": "b",
          "text": "I can't discuss other clients"
        },
        {
          "id": "c",
          "text": "Maybe"
        },
        {
          "id": "d",
          "text": "Only if you promise"
        }
      ]
    },
    {
      "id": "m-08",
      "type": "single",
      "prompt": "An account you own has not been contacted for 45 days. What do you do?",
      "options": [
        {
          "id": "a",
          "text": "Wait for them to call"
        },
        {
          "id": "b",
          "text": "Send a short check-in email and book a quarterly review"
        },
        {
          "id": "c",
          "text": "Remove the account from the CRM"
        },
        {
          "id": "d",
          "text": "Ask Marco to contact them"
        }
      ]
    }
  ]
};
