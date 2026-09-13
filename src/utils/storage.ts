import type { UserProgress } from '../types/chinese';
import { triggerXpAnimation } from '../components/Common/XpGainToast';

const STORAGE_KEY = 'hanyuflow_user_progress_v1';

const DEFAULT_PROGRESS: UserProgress = {
  xp: 120,
  streakDays: 3,
  lastActiveDate: new Date().toISOString().split('T')[0],
  completedDialogueIds: ['restaurant-1'],
  bookmarkedWords: ['点餐', '结账', '多少钱'],
  masteredCardIds: [],
  totalPracticeTimeMinutes: 25,
};

export const getUserProgress = (): UserProgress => {
  if (typeof window === 'undefined') return DEFAULT_PROGRESS;
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return DEFAULT_PROGRESS;
    const parsed = JSON.parse(saved);
    return { ...DEFAULT_PROGRESS, ...parsed };
  } catch {
    return DEFAULT_PROGRESS;
  }
};

export const saveUserProgress = (progress: UserProgress): void => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch (e) {
    console.warn('Failed to save progress', e);
  }
};

export const addXP = (amount: number): UserProgress => {
  const current = getUserProgress();
  const today = new Date().toISOString().split('T')[0];
  
  let streak = current.streakDays;
  if (current.lastActiveDate !== today) {
    const lastDate = new Date(current.lastActiveDate);
    const currentDate = new Date(today);
    const diffTime = Math.abs(currentDate.getTime() - lastDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) {
      streak += 1;
    } else if (diffDays > 1) {
      streak = 1;
    }
  }

  const updated: UserProgress = {
    ...current,
    xp: current.xp + amount,
    streakDays: Math.max(1, streak),
    lastActiveDate: today,
  };

  saveUserProgress(updated);
  triggerXpAnimation(amount);
  return updated;
};

export const markDialogueCompleted = (dialogueId: string): UserProgress => {
  const current = getUserProgress();
  if (current.completedDialogueIds.includes(dialogueId)) return current;

  const updated: UserProgress = {
    ...current,
    completedDialogueIds: [...current.completedDialogueIds, dialogueId],
    xp: current.xp + 50, // Reward 50 XP
  };
  saveUserProgress(updated);
  return updated;
};

export const toggleBookmarkWord = (word: string): boolean => {
  const current = getUserProgress();
  const exists = current.bookmarkedWords.includes(word);
  const updatedWords = exists 
    ? current.bookmarkedWords.filter(w => w !== word)
    : [...current.bookmarkedWords, word];
    
  const updated: UserProgress = {
    ...current,
    bookmarkedWords: updatedWords,
  };
  saveUserProgress(updated);
  return !exists;
};

export const isWordBookmarked = (word: string): boolean => {
  const current = getUserProgress();
  return current.bookmarkedWords.includes(word);
};
