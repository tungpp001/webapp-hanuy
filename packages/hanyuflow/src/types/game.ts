export type GameMode = 'memory' | 'speed' | 'sentence-race' | 'gun-typing' | 'detective';

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

export interface FallingTypingWord {
  id: string;
  vocab: GameVocabItem;
  rawPinyin: string; // e.g. "nihao" (normalized without tones)
  typedLength: number; // number of characters already matched
  xPercent: number; // 10% to 80%
  yPercent: number; // 0% to 100%
  speed: number;
  isTargeted: boolean;
}

export interface LaserBullet {
  id: string;
  startX: number;
  startY: number;
  targetX: number;
  targetY: number;
  progress: number; // 0 to 1
  color: string;
}

export interface ExplosionParticle {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
}

export interface GameScoreRecord {
  gameMode: GameMode;
  highScore: number;
  gamesPlayed: number;
  lastPlayedDate: string;
}
