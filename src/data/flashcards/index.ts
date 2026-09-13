import type { FlashcardItem } from '../../types/flashcard';
import { HSK1_FLASHCARDS } from './hsk1';
import { HSK2_FLASHCARDS } from './hsk2';
import { HSK3_FLASHCARDS } from './hsk3';
import { HSK4_FLASHCARDS } from './hsk4';
import { HSK5_FLASHCARDS } from './hsk5';
import { HSK6_FLASHCARDS } from './hsk6';

export {
  HSK1_FLASHCARDS,
  HSK2_FLASHCARDS,
  HSK3_FLASHCARDS,
  HSK4_FLASHCARDS,
  HSK5_FLASHCARDS,
  HSK6_FLASHCARDS
};

export const ALL_FLASHCARDS: FlashcardItem[] = [
  ...HSK1_FLASHCARDS,
  ...HSK2_FLASHCARDS,
  ...HSK3_FLASHCARDS,
  ...HSK4_FLASHCARDS,
  ...HSK5_FLASHCARDS,
  ...HSK6_FLASHCARDS
];

export interface HskLevelInfo {
  id: string;
  name: string;
  badge: string;
  description: string;
  color: string;
  borderActive: string;
  bgActive: string;
  textActive: string;
  cards: FlashcardItem[];
  count: number;
}

export const HSK_LEVELS: HskLevelInfo[] = [
  {
    id: 'all',
    name: 'Tất Cả HSK',
    badge: '1 - 6',
    description: 'Toàn bộ từ vựng và câu ví dụ từ HSK 1 đến HSK 6',
    color: 'from-amber-500 to-red-600',
    borderActive: 'border-red-500',
    bgActive: 'bg-red-600 text-white',
    textActive: 'text-red-600 dark:text-red-400',
    cards: ALL_FLASHCARDS,
    count: ALL_FLASHCARDS.length
  },
  {
    id: 'hsk1',
    name: 'HSK 1',
    badge: 'Cơ Bản',
    description: '150 từ vựng nền tảng, đại từ, số đếm và câu giao tiếp đơn giản',
    color: 'from-emerald-500 to-teal-600',
    borderActive: 'border-emerald-500',
    bgActive: 'bg-emerald-600 text-white',
    textActive: 'text-emerald-600 dark:text-emerald-400',
    cards: HSK1_FLASHCARDS,
    count: HSK1_FLASHCARDS.length
  },
  {
    id: 'hsk2',
    name: 'HSK 2',
    badge: 'Sơ Cấp',
    description: 'Từ vựng giao tiếp thực tế, sinh hoạt thường ngày và du lịch',
    color: 'from-sky-500 to-blue-600',
    borderActive: 'border-blue-500',
    bgActive: 'bg-blue-600 text-white',
    textActive: 'text-blue-600 dark:text-blue-400',
    cards: HSK2_FLASHCARDS,
    count: HSK2_FLASHCARDS.length
  },
  {
    id: 'hsk3',
    name: 'HSK 3',
    badge: 'Trung Cấp 1',
    description: 'Bày tỏ quan điểm, kế hoạch, công việc và đời sống xã hội',
    color: 'from-indigo-500 to-purple-600',
    borderActive: 'border-indigo-500',
    bgActive: 'bg-indigo-600 text-white',
    textActive: 'text-indigo-600 dark:text-indigo-400',
    cards: HSK3_FLASHCARDS,
    count: HSK3_FLASHCARDS.length
  },
  {
    id: 'hsk4',
    name: 'HSK 4',
    badge: 'Trung Cấp 2',
    description: 'Thảo luận chuyên sâu, cấu trúc câu phức, thương mại và đời sống',
    color: 'from-purple-500 to-pink-600',
    borderActive: 'border-purple-500',
    bgActive: 'bg-purple-600 text-white',
    textActive: 'text-purple-600 dark:text-purple-400',
    cards: HSK4_FLASHCARDS,
    count: HSK4_FLASHCARDS.length
  },
  {
    id: 'hsk5',
    name: 'HSK 5',
    badge: 'Cao Cấp',
    description: 'Văn phong học thuật, báo chí, kinh tế, phân tích logic',
    color: 'from-amber-600 to-orange-700',
    borderActive: 'border-amber-600',
    bgActive: 'bg-amber-600 text-white',
    textActive: 'text-amber-600 dark:text-amber-400',
    cards: HSK5_FLASHCARDS,
    count: HSK5_FLASHCARDS.length
  },
  {
    id: 'hsk6',
    name: 'HSK 6',
    badge: 'Thành Thạo',
    description: 'Thành ngữ kinh điển (成语), văn hóa sâu sắc, diễn đạt tự nhiên chuẩn bản xứ',
    color: 'from-rose-600 to-red-800',
    borderActive: 'border-rose-600',
    bgActive: 'bg-rose-600 text-white',
    textActive: 'text-rose-600 dark:text-rose-400',
    cards: HSK6_FLASHCARDS,
    count: HSK6_FLASHCARDS.length
  }
];

export const getFlashcardsByLevel = (levelId: string): FlashcardItem[] => {
  const found = HSK_LEVELS.find(l => l.id === levelId);
  return found ? found.cards : ALL_FLASHCARDS;
};
