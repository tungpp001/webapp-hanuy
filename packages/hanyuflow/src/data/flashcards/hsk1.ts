import type { FlashcardItem } from '../../types/flashcard';
import { HSK1_SHEET_FLASHCARDS } from '../flashcardData';

// HSK 1 (150 words extracted from sheet + standard HSK 1)
export const HSK1_FLASHCARDS: FlashcardItem[] = HSK1_SHEET_FLASHCARDS.map(c => ({
  ...c,
  level: 'HSK 1'
}));
