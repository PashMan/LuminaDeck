export interface EvaluationResult {
  score: number;
  isCorrect: boolean;
  sm2Rating: number;
  ratingLabel: 'Again' | 'Hard' | 'Good' | 'Easy';
  feedback: string;
  keyPointsCovered: string[];
  missingPoints: string[];
  idealPhrasingTip?: string;
}

function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[.,!?:;()"'\-—_`]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractKeywords(text: string): string[] {
  const normalized = normalizeText(text);
  const stopWords = new Set([
    'a', 'an', 'the', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had',
    'and', 'or', 'but', 'if', 'then', 'else', 'when', 'at', 'by', 'for', 'with', 'about',
    'against', 'between', 'into', 'through', 'during', 'before', 'after', 'above', 'below',
    'to', 'from', 'up', 'down', 'in', 'out', 'on', 'off', 'over', 'under', 'again', 'further',
    'that', 'this', 'these', 'those', 'what', 'which', 'who', 'whom', 'this', 'that',
    'и', 'в', 'во', 'не', 'что', 'он', 'на', 'я', 'с', 'со', 'как', 'а', 'то', 'все', 'она',
    'так', 'его', 'но', 'да', 'ты', 'к', 'у', 'же', 'вы', 'за', 'бы', 'по', 'только', 'ее',
    'мне', 'было', 'вот', 'от', 'меня', 'еще', 'нет', 'о', 'из', 'ему', 'теперь', 'когда',
  ]);

  return normalized
    .split(' ')
    .filter((w) => w.length >= 2 && !stopWords.has(w));
}

export function evaluateAnswerClientSide(
  question: string,
  expectedAnswer: string,
  userAnswer: string,
  cardType: string = 'qa'
): EvaluationResult {
  const normUser = normalizeText(userAnswer);
  const normExpected = normalizeText(expectedAnswer);

  if (!normUser) {
    return {
      score: 0,
      isCorrect: false,
      sm2Rating: 1,
      ratingLabel: 'Again',
      feedback: 'No answer was entered. Take a moment to review the reference card.',
      keyPointsCovered: [],
      missingPoints: extractKeywords(expectedAnswer),
    };
  }

  // Exact match or contains exact answer
  if (normUser === normExpected || normUser.includes(normExpected) || normExpected.includes(normUser)) {
    return {
      score: 100,
      isCorrect: true,
      sm2Rating: 4,
      ratingLabel: 'Easy',
      feedback: 'Spot on! Perfect understanding of the key concept.',
      keyPointsCovered: extractKeywords(expectedAnswer),
      missingPoints: [],
      idealPhrasingTip: 'Great recall speed and precision!',
    };
  }

  // Word overlap / Keyword matching
  const expectedKeywords = extractKeywords(expectedAnswer);
  const userKeywords = extractKeywords(userAnswer);

  if (expectedKeywords.length === 0) {
    return {
      score: 80,
      isCorrect: true,
      sm2Rating: 3,
      ratingLabel: 'Good',
      feedback: 'Good effort! Answer matches expected concept.',
      keyPointsCovered: userKeywords,
      missingPoints: [],
    };
  }

  const covered = expectedKeywords.filter((kw) =>
    userKeywords.some((ukw) => ukw === kw || ukw.includes(kw) || kw.includes(ukw))
  );
  const missing = expectedKeywords.filter((kw) => !covered.includes(kw));

  const overlapRatio = covered.length / expectedKeywords.length;
  const score = Math.min(100, Math.round(overlapRatio * 100));

  if (score >= 75) {
    return {
      score,
      isCorrect: true,
      sm2Rating: 3,
      ratingLabel: 'Good',
      feedback: 'Solid answer! You captured the main ideas accurately.',
      keyPointsCovered: covered,
      missingPoints: missing,
      idealPhrasingTip: `Key terms retained: ${covered.join(', ')}`,
    };
  } else if (score >= 40) {
    return {
      score,
      isCorrect: true,
      sm2Rating: 2,
      ratingLabel: 'Hard',
      feedback: 'Partially correct. You got part of the core concept, but missed key terms.',
      keyPointsCovered: covered,
      missingPoints: missing,
      idealPhrasingTip: missing.length ? `Remember to mention: ${missing.slice(0, 3).join(', ')}` : undefined,
    };
  } else {
    return {
      score,
      isCorrect: false,
      sm2Rating: 1,
      ratingLabel: 'Again',
      feedback: 'The answer missed core terms. Review the full card answer to reinforce memory.',
      keyPointsCovered: covered,
      missingPoints: missing,
      idealPhrasingTip: `Key reference answer: "${expectedAnswer}"`,
    };
  }
}

export function explainCardClientSide(
  question: string,
  answer: string,
  explanation?: string
): string {
  const parts = [
    `💡 **Concept Breakdown:**\n${question}`,
    `\n🎯 **Key Answer:**\n${answer}`,
  ];

  if (explanation) {
    parts.push(`\n🧠 **Memory Trick / Intuition:**\n${explanation}`);
  }

  parts.push(
    `\n📌 **Why it matters:**\nMastering this concept ensures long-term retention under SuperMemo SM-2 spacing intervals.`
  );

  return parts.join('\n');
}
