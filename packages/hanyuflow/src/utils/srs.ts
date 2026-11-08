import type { FlashcardItem } from '../types/flashcard';

export type SRSGrade = 'again' | 'hard' | 'good' | 'easy';

export interface SRSRecord {
  cardId: string;
  interval: number; // in days
  repetition: number;
  easeFactor: number; // default 2.5
  dueDate: string; // ISO date string YYYY-MM-DD
  lastReviewed: string; // ISO timestamp
  state: 'new' | 'learning' | 'review' | 'mastered';
}

export interface SRSStorageMap {
  [cardId: string]: SRSRecord;
}

const SRS_STORAGE_KEY = 'hanyuflow_srs_records';

export const getSRSRecords = (): SRSStorageMap => {
  if (typeof window === 'undefined') return {};
  try {
    const data = localStorage.getItem(SRS_STORAGE_KEY);
    return data ? JSON.parse(data) : {};
  } catch (e) {
    console.warn('Error reading SRS records:', e);
    return {};
  }
};

export const saveSRSRecords = (records: SRSStorageMap) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(SRS_STORAGE_KEY, JSON.stringify(records));
  } catch (e) {
    console.warn('Error saving SRS records:', e);
  }
};

const getTodayDateString = (): string => {
  const d = new Date();
  return d.toISOString().split('T')[0];
};

/**
 * SM-2 Algorithmic calculation for Spaced Repetition
 */
export const calculateSRS = (
  prevRecord: SRSRecord | undefined,
  grade: SRSGrade
): SRSRecord => {
  const now = new Date();

  let interval = 1;
  let repetition = prevRecord ? prevRecord.repetition : 0;
  let easeFactor = prevRecord ? prevRecord.easeFactor : 2.5;
  let state: SRSRecord['state'] = 'learning';

  // Grade multiplier mapping
  let quality = 3; // Good
  if (grade === 'again') quality = 0;
  else if (grade === 'hard') quality = 2;
  else if (grade === 'good') quality = 4;
  else if (grade === 'easy') quality = 5;

  if (quality < 3) {
    // Forgot / Hard failure: Reset streak to 1 day
    repetition = 0;
    interval = 1;
    state = 'learning';
  } else {
    // Success
    if (repetition === 0) {
      interval = 1;
    } else if (repetition === 1) {
      interval = grade === 'easy' ? 4 : 2;
    } else {
      interval = Math.round(prevRecord!.interval * easeFactor);
      if (grade === 'easy') interval = Math.round(interval * 1.3);
    }
    repetition += 1;
    state = interval >= 21 ? 'mastered' : 'review';
  }

  // Adjust ease factor (SM-2 standard formula)
  easeFactor = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  if (easeFactor < 1.3) easeFactor = 1.3;
  if (easeFactor > 3.0) easeFactor = 3.0;

  // Calculate next due date
  const nextDueDate = new Date();
  nextDueDate.setDate(nextDueDate.getDate() + interval);
  const dueDateStr = nextDueDate.toISOString().split('T')[0];

  return {
    cardId: prevRecord?.cardId || '',
    interval,
    repetition,
    easeFactor,
    dueDate: dueDateStr,
    lastReviewed: now.toISOString(),
    state,
  };
};

export const updateCardSRS = (cardId: string, grade: SRSGrade): SRSRecord => {
  const records = getSRSRecords();
  const current = records[cardId] || {
    cardId,
    interval: 0,
    repetition: 0,
    easeFactor: 2.5,
    dueDate: getTodayDateString(),
    lastReviewed: new Date().toISOString(),
    state: 'new',
  };

  const updated = calculateSRS(current, grade);
  updated.cardId = cardId;
  records[cardId] = updated;
  saveSRSRecords(records);
  return updated;
};

export const getDueSRSFlashcards = (allCards: FlashcardItem[]): FlashcardItem[] => {
  const records = getSRSRecords();
  const todayStr = getTodayDateString();

  return allCards.filter((card) => {
    const rec = records[card.id];
    // If not reviewed yet or due today or overdue
    if (!rec) return false;
    return rec.dueDate <= todayStr;
  });
};

export const getSRSStats = (allCards: FlashcardItem[]) => {
  const records = getSRSRecords();
  const todayStr = getTodayDateString();

  let dueTodayCount = 0;
  let masteredCount = 0;
  let learningCount = 0;
  let newCount = 0;

  allCards.forEach((card) => {
    const rec = records[card.id];
    if (!rec) {
      newCount++;
    } else {
      if (rec.state === 'mastered') masteredCount++;
      else learningCount++;

      if (rec.dueDate <= todayStr) {
        dueTodayCount++;
      }
    }
  });

  return {
    total: allCards.length,
    dueTodayCount,
    masteredCount,
    learningCount,
    newCount,
  };
};
