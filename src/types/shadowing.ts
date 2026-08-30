export interface SubtitleSegment {
  id: string;
  startTime: number; // in seconds
  endTime: number;   // in seconds
  hanzi: string;
  pinyin: string;
  sinoVietnamese?: string;
  vietnamese: string;
  speaker?: string;
}

export interface ShadowingVideo {
  id: string;
  title: string;
  youtubeId: string;
  thumbnailUrl: string;
  category: 'vlog' | 'drama' | 'daily' | 'food' | 'interview' | 'animation';
  level: 'HSK 1-2' | 'HSK 3-4' | 'HSK 5+';
  durationText: string;
  description: string;
  subtitles: SubtitleSegment[];
}

export interface ShadowingRecordResult {
  segmentId: string;
  userSpokenText: string;
  score: number; // 0 - 100
  matchedCharacters: { char: string; isCorrect: boolean }[];
  audioBlobUrl?: string;
}
