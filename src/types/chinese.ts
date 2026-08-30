export interface WordBreakdown {
  hanzi: string;
  pinyin: string;
  sinoVietnamese: string; // Âm Hán-Việt
  meaning: string;
  pos?: string; // Loại từ: Danh từ, Động từ, Tính từ, Lượng từ, v.v.
  exampleCn?: string;
  exampleVn?: string;
  notes?: string;
}

export interface DialogueLine {
  id: string;
  speaker: {
    id: string;
    name: string;
    nameCn: string;
    role: 'A' | 'B';
    avatar: string;
    gender?: 'male' | 'female';
  };
  hanzi: string;
  pinyin: string;
  sinoVietnamese: string;
  vietnamese: string;
  audioText?: string;
  words: WordBreakdown[];
  grammarNote?: string;
}

export interface GrammarPoint {
  title: string;
  structure: string;
  explanation: string;
  examples: {
    cn: string;
    pinyin: string;
    vn: string;
  }[];
}

export interface Dialogue {
  id: string;
  title: string;
  titleCn: string;
  pinyin: string;
  sinoVietnamese: string;
  level: 'HSK 1' | 'HSK 2' | 'HSK 3' | 'HSK 4';
  category: 'restaurant' | 'shopping' | 'travel' | 'hotel' | 'dating' | 'work' | 'hospital' | 'airport' | 'bank' | 'daily';
  categoryNameVn: string;
  icon: string;
  description: string;
  durationMinutes: number;
  grammarPoints: GrammarPoint[];
  lines: DialogueLine[];
  roleplayGoal: {
    roleA: string;
    roleB: string;
    mission: string;
  };
}

export interface PinyinInitial {
  letter: string;
  pinyin: string;
  vietnameseApproximation: string;
  exampleWord: string;
  examplePinyin: string;
  exampleMeaning: string;
  type: 'Âm môi' | 'Âm đầu lưỡi' | 'Âm cuống lưỡi' | 'Âm mặt lưỡi' | 'Âm uốn lưỡi' | 'Âm răng trước';
}

export interface PinyinFinal {
  letter: string;
  pinyin: string;
  vietnameseApproximation: string;
  exampleWord: string;
  examplePinyin: string;
  exampleMeaning: string;
  type: 'Vận mẫu đơn' | 'Vận mẫu kép' | 'Vận mẫu mũi';
}

export interface ToneQuizItem {
  id: string;
  character: string;
  pinyinWithTone: string;
  pinyinWithoutTone: string;
  correctTone: 1 | 2 | 3 | 4;
  sinoVietnamese: string;
  meaning: string;
  tip: string;
}

export interface FlashcardItem {
  id: string;
  hanzi: string;
  pinyin: string;
  sinoVietnamese: string;
  meaning: string;
  hskLevel: 'HSK 1' | 'HSK 2' | 'HSK 3' | 'HSK 4';
  category: string;
  exampleCn: string;
  examplePinyin: string;
  exampleVn: string;
  mastered?: boolean;
}

export interface SentenceQuizItem {
  id: string;
  vietnameseMeaning: string;
  hintPinyin?: string;
  words: {
    id: string;
    hanzi: string;
    pinyin: string;
    sinoVietnamese: string;
  }[];
  correctOrder: string[]; // array of word IDs
  explanation: string;
}

export interface ListeningQuizItem {
  id: string;
  audioText: string;
  pinyin: string;
  question: string;
  options: {
    id: string;
    text: string;
    isCorrect: boolean;
  }[];
  explanation: string;
}

export interface UserProgress {
  xp: number;
  streakDays: number;
  lastActiveDate: string;
  completedDialogueIds: string[];
  bookmarkedWords: string[];
  masteredCardIds: string[];
  totalPracticeTimeMinutes: number;
}
