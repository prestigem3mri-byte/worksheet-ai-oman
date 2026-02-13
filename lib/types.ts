export type Mode = "practice" | "contest";

export type QuestionType = "mcq" | "tf" | "short";

export type Question = {
  id: string;
  type: QuestionType;
  question: string;
  options?: string[];
  answer: string;
  explanation?: string;
};

export type Worksheet = {
  title: string;
  grade: string;
  topic: string;
  mode: Mode;
  count: number;
  questions: Question[];
};
