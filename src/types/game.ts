export type GameMode = 'memory' | 'speed' | 'sentence-race' | 'detective';

export interface GameVocabItem {
  id: string;
  hanzi: string;
  pinyin: string;
  sinoVietnamese?: string;
  meaning: string;
  hskLevel: string;
  audio?: string;
}

export interface MemoryCard {
  id: string;
  vocabId: string;
  content: string;
  subContent?: string;
  type: 'hanzi' | 'meaning';
  isFlipped: boolean;
  isMatched: boolean;
}

export interface FallingVocabItem {
  id: string;
  vocab: GameVocabItem;
  xPercent: number; // 5% to 85% horizontal position
  yPercent: number; // 0% to 100% vertical position
  speed: number;
}

export interface GameScoreRecord {
  gameMode: GameMode;
  highScore: number;
  gamesPlayed: number;
  lastPlayedDate: string;
}
