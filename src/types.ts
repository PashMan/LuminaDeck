export type CardType = 'qa' | 'cloze' | 'code' | 'mcq';

export type SM2Rating = 1 | 2 | 3 | 4; // 1: Again, 2: Hard, 3: Good, 4: Easy

export interface ReviewLog {
  id: string;
  timestamp: string; // ISO string
  userAnswer?: string;
  aiScore?: number; // 0 - 100
  rating: SM2Rating;
  interval: number; // in days
  easeFactor: number;
}

export interface Flashcard {
  id: string;
  type: CardType;
  question: string;
  answer: string;
  explanation?: string;
  clozeText?: string; // e.g. "PostgreSQL uses {{c1::WAL}} for durability"
  codeSnippet?: string;
  options?: string[]; // for MCQ
  correctOptionIndex?: number;
  tags: string[];
  
  // SM-2 Spaced Repetition parameters
  repetitions: number;
  interval: number; // in days
  easeFactor: number; // default 2.5
  dueDate: string; // ISO string
  lastReviewedAt: string | null; // ISO string
  history: ReviewLog[];
}

export interface Deck {
  id: string;
  title: string;
  description: string;
  icon: string; // Lucide icon name or emoji
  color: string; // Tailwind color theme or hex
  tags: string[];
  createdAt: string;
  updatedAt: string;
  cards: Flashcard[];
}

export interface AIGenerationOptions {
  title?: string;
  sourceType: 'text' | 'topic' | 'doc';
  sourceContent: string;
  cardCount: number;
  cardTypes: CardType[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  targetLanguage: 'auto' | 'ru' | 'en';
}

export interface AnswerEvaluation {
  score: number;
  isCorrect: boolean;
  sm2Rating: SM2Rating;
  ratingLabel: 'Again' | 'Hard' | 'Good' | 'Easy';
  feedback: string;
  keyPointsCovered?: string[];
  missingPoints?: string[];
  idealPhrasingTip?: string;
}

export interface StudyStats {
  totalReviews: number;
  cardsMastered: number;
  streakDays: number;
  lastStudyDate: string; // YYYY-MM-DD
  dailyHistory: {
    date: string; // YYYY-MM-DD
    count: number;
    correctCount: number;
  }[];
}
