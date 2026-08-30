export type HSKLevel = 'HSK 1' | 'HSK 2' | 'HSK 3' | 'HSK 4';

export type QuestionSectionType = 'listening' | 'reading' | 'writing';

export interface HSKQuestion {
  id: string;
  section: QuestionSectionType;
  type: 'true-false' | 'multiple-choice' | 'fill-blank' | 'sentence-order';
  audioText?: string;
  audioPinyin?: string;
  imageIcon?: string; // e.g. '🍜', '✈️', '🍎', '👨‍🏫'
  prompt: string;
  promptPinyin?: string;
  promptSinoVietnamese?: string;
  options?: {
    id: string;
    text: string;
    pinyin?: string;
  }[];
  wordsForOrdering?: {
    id: string;
    hanzi: string;
    pinyin: string;
  }[];
  correctAnswer: string; // Option id, 'true'/'false', or comma-separated word IDs
  explanation: string;
  points: number;
}

export interface HSKExamPaper {
  id: string;
  title: string;
  level: HSKLevel;
  vocabRequirement: number; // e.g. 150, 300, 600, 1200
  durationMinutes: number;
  totalPoints: number;
  passScore: number;
  description: string;
  sections: {
    section: QuestionSectionType;
    title: string;
    description: string;
    questionCount: number;
    points: number;
  }[];
  questions: HSKQuestion[];
}

export interface UserExamResult {
  examId: string;
  examTitle: string;
  level: HSKLevel;
  date: string;
  totalScore: number;
  maxScore: number;
  isPassed: boolean;
  sectionScores: {
    listening: { score: number; max: number };
    reading: { score: number; max: number };
    writing?: { score: number; max: number };
  };
  userAnswers: Record<string, string>; // questionId -> answer
  timeSpentSeconds: number;
}
