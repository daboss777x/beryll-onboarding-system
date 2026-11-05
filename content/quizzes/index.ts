import type { Quiz } from "../schema";
import { quizPreboarding } from "./quiz-preboarding";
import { quizDay1 } from "./quiz-day1";
import { quizWeeks12 } from "./quiz-weeks1-2";
import { quizDays830 } from "./quiz-days8-30";
import { quizDays3160 } from "./quiz-days31-60";
import { quizDays6190 } from "./quiz-days61-90";
import { quizMonths412 } from "./quiz-months4-12";

export const quizzes: Quiz[] = [quizPreboarding, quizDay1, quizWeeks12, quizDays830, quizDays3160, quizDays6190, quizMonths412];
export const quizById = (id: string) => quizzes.find((q) => q.id === id);
