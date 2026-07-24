import { Deck, Flashcard, StudyStats } from '../types';
import { SAMPLE_DECKS } from './sampleDecks';

const STORAGE_KEYS = {
  DECKS: 'mempulse_decks_v1',
  STATS: 'mempulse_stats_v1',
};

export function getInitialDecks(): Deck[] {
  try {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
      return SAMPLE_DECKS;
    }
    const raw = localStorage.getItem(STORAGE_KEYS.DECKS);
    if (!raw) {
      saveDecks(SAMPLE_DECKS);
      return SAMPLE_DECKS;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      saveDecks(SAMPLE_DECKS);
      return SAMPLE_DECKS;
    }
    return parsed;
  } catch (e) {
    console.error('Failed to parse decks from localStorage', e);
    return SAMPLE_DECKS;
  }
}

export function saveDecks(decks: Deck[]): void {
  try {
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.DECKS, JSON.stringify(decks));
    }
  } catch (e) {
    console.error('Failed to save decks to localStorage', e);
  }
}

export function getInitialStats(): StudyStats {
  const defaultStats: StudyStats = {
    totalReviews: 0,
    cardsMastered: 0,
    streakDays: 1,
    lastStudyDate: new Date().toISOString().split('T')[0],
    dailyHistory: [],
  };

  try {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
      return defaultStats;
    }
    const raw = localStorage.getItem(STORAGE_KEYS.STATS);
    if (!raw) return defaultStats;
    const parsed = JSON.parse(raw);
    return { ...defaultStats, ...parsed };
  } catch (e) {
    return defaultStats;
  }
}

export function saveStats(stats: StudyStats): void {
  try {
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.STATS, JSON.stringify(stats));
    }
  } catch (e) {
    console.error('Failed to save stats to localStorage', e);
  }
}

export function logStudySession(cardCount: number, correctCount: number): StudyStats {
  const stats = getInitialStats();
  const today = new Date().toISOString().split('T')[0];

  // Update streak
  if (stats.lastStudyDate) {
    const last = new Date(stats.lastStudyDate);
    const curr = new Date(today);
    const diffDays = Math.floor((curr.getTime() - last.getTime()) / (1000 * 3600 * 24));

    if (diffDays === 1) {
      stats.streakDays += 1;
    } else if (diffDays > 1) {
      stats.streakDays = 1;
    }
  } else {
    stats.streakDays = 1;
  }

  stats.lastStudyDate = today;
  stats.totalReviews += cardCount;

  // Record in daily history
  const historyIndex = stats.dailyHistory.findIndex((h) => h.date === today);
  if (historyIndex >= 0) {
    stats.dailyHistory[historyIndex].count += cardCount;
    stats.dailyHistory[historyIndex].correctCount += correctCount;
  } else {
    stats.dailyHistory.push({
      date: today,
      count: cardCount,
      correctCount,
    });
  }

  // Keep last 60 days
  if (stats.dailyHistory.length > 60) {
    stats.dailyHistory = stats.dailyHistory.slice(-60);
  }

  saveStats(stats);
  return stats;
}

/**
 * Export Deck to Anki Compatible Tab-Separated Values (CSV/TSV)
 */
export function exportDeckToAnkiTSV(deck: Deck): string {
  const lines: string[] = [];
  lines.push(`# Deck: ${deck.title}`);
  lines.push(`# Description: ${deck.description}`);
  lines.push('# Front\tBack\tTags');

  deck.cards.forEach((card) => {
    let front = card.question;
    let back = card.answer;
    if (card.codeSnippet) {
      front += `\n<pre><code>${card.codeSnippet}</code></pre>`;
    }
    if (card.clozeText) {
      front = card.clozeText;
    }
    if (card.explanation) {
      back += `<br><em>${card.explanation}</em>`;
    }
    const tags = card.tags.join(' ');
    lines.push(`${front.replace(/\t/g, ' ')}\t${back.replace(/\t/g, ' ')}\t${tags}`);
  });

  return lines.join('\n');
}

/**
 * Download text file helper
 */
export function downloadFile(filename: string, content: string, contentType = 'text/plain') {
  const blob = new Blob([content], { type: contentType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
