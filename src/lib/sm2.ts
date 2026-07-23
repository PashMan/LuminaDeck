import { Flashcard, SM2Rating, ReviewLog } from '../types';

/**
 * SuperMemo SM-2 Spaced Repetition Calculator
 * @param card Current flashcard state
 * @param rating User or AI assigned rating (1: Again, 2: Hard, 3: Good, 4: Easy)
 * @param userAnswer Optional user input string
 * @param aiScore Optional 0-100 score from AI evaluation
 */
export function calculateSM2(
  card: Flashcard,
  rating: SM2Rating,
  userAnswer?: string,
  aiScore?: number
): Flashcard {
  // Map 1-4 SM2Rating to 0-5 SuperMemo grade quality
  // 1 (Again) -> 1
  // 2 (Hard)  -> 3
  // 3 (Good)  -> 4
  // 4 (Easy)  -> 5
  const qualityMap: Record<SM2Rating, number> = {
    1: 1,
    2: 3,
    3: 4,
    4: 5,
  };

  const q = qualityMap[rating];
  let { repetitions, interval, easeFactor } = card;

  if (q < 3) {
    // Failed recall
    repetitions = 0;
    interval = 1; // repeat in 1 day or end of queue
  } else {
    // Successful recall
    if (repetitions === 0) {
      interval = 1;
    } else if (repetitions === 1) {
      interval = 6;
    } else {
      interval = Math.max(1, Math.round(interval * easeFactor));
    }
    repetitions += 1;
  }

  // Calculate new Ease Factor (EF)
  // EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
  easeFactor = easeFactor + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02));
  if (easeFactor < 1.3) {
    easeFactor = 1.3;
  }
  // Round easeFactor to 2 decimal places
  easeFactor = Math.round(easeFactor * 100) / 100;

  const now = new Date();
  const nextDueDate = new Date(now.getTime() + interval * 24 * 60 * 60 * 1000);

  const reviewLog: ReviewLog = {
    id: `rev_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    timestamp: now.toISOString(),
    userAnswer,
    aiScore,
    rating,
    interval,
    easeFactor,
  };

  return {
    ...card,
    repetitions,
    interval,
    easeFactor,
    dueDate: nextDueDate.toISOString(),
    lastReviewedAt: now.toISOString(),
    history: [...(card.history || []), reviewLog],
  };
}

/**
 * Format interval display string for rating buttons (e.g., "1d", "6d", "14d")
 */
export function getNextIntervalText(card: Flashcard, rating: SM2Rating): string {
  const dummy = calculateSM2(card, rating);
  if (rating === 1) return '< 1d';
  if (dummy.interval === 1) return '1d';
  return `${dummy.interval}d`;
}

/**
 * Check if card is due for review today
 */
export function isCardDue(card: Flashcard): boolean {
  if (!card.dueDate) return true;
  const due = new Date(card.dueDate).getTime();
  const now = new Date().getTime();
  return due <= now;
}

/**
 * Categorize card mastery status
 */
export function getCardStatus(card: Flashcard): 'new' | 'learning' | 'young' | 'mature' {
  if (card.repetitions === 0) return 'new';
  if (card.repetitions < 3) return 'learning';
  if (card.interval < 21) return 'young';
  return 'mature';
}
