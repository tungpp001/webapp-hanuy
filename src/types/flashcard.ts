export interface FlashcardItem {
  id: string;
  hanzi: string;
  pinyin: string;
  sinoVietnamese?: string;
  meaning: string;
  exampleHanzi?: string;
  examplePinyin?: string;
  exampleMeaning?: string;
  category: string;
  level: string;
}

export type FlashcardMastery = 'unlearned' | 'learning' | 'mastered';

export interface FlashcardProgress {
  [cardId: string]: {
    mastery: FlashcardMastery;
    reviewCount: number;
    lastReviewed: string;
  };
}
