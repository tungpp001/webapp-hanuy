import type React from 'react';
import { useState } from 'react';
import { 
  Search, 
  Volume2, 
  Bookmark, 
  BookmarkCheck, 
  BookOpen
} from 'lucide-react';
import type { FlashcardItem } from '../../types/flashcard';
import { speakChinese, playSoundEffect } from '../../utils/speech';
import { toggleBookmarkWord, isWordBookmarked } from '../../utils/storage';

interface FlashcardListProps {
  cards: FlashcardItem[];
}

export const FlashcardList: React.FC<FlashcardListProps> = ({ cards }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [bookmarkedMap, setBookmarkedMap] = useState<Record<string, boolean>>(() => {
    const map: Record<string, boolean> = {};
    cards.forEach((c) => {
      map[c.id] = isWordBookmarked(c.hanzi);
    });
    return map;
  });

  const categories = ['all', ...Array.from(new Set(cards.map((c) => c.category)))];

  const filteredCards = cards.filter((c) => {
    const matchCategory = selectedCategory === 'all' || c.category === selectedCategory;
    const term = searchTerm.toLowerCase().trim();
    const matchSearch =
      !term ||
      c.hanzi.toLowerCase().includes(term) ||
      c.pinyin.toLowerCase().includes(term) ||
      c.meaning.toLowerCase().includes(term) ||
      (c.exampleHanzi && c.exampleHanzi.toLowerCase().includes(term)) ||
      (c.exampleMeaning && c.exampleMeaning.toLowerCase().includes(term));
    return matchCategory && matchSearch;
  });

  const handleSpeak = (text: string) => {
    playSoundEffect('click');
    speakChinese(text, 1.0);
  };

  const handleToggleBookmark = (card: FlashcardItem) => {
    playSoundEffect('click');
    const newState = toggleBookmarkWord(card.hanzi);
    setBookmarkedMap((prev) => ({
      ...prev,
      [card.id]: newState,
    }));
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in pb-20">
      {/* Search & Category Filter Bar */}
      <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-sm space-y-3">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" size={16} />
          <input
            type="text"
            placeholder="Tìm kiếm Chữ Hán, Pinyin, nghĩa hoặc câu ví dụ..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs sm:text-sm text-stone-900 dark:text-white placeholder-stone-400 focus:outline-hidden focus:ring-2 focus:ring-red-500"
          />
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-red-600 text-white shadow-xs'
                  : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200'
              }`}
            >
              {cat === 'all' ? 'Tất cả chủ đề' : cat}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between text-xs text-stone-400 px-1">
        <span>Hiển thị {filteredCards.length} / {cards.length} từ vựng & câu ví dụ</span>
      </div>

      {/* Vocabulary & Example Sentences Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredCards.map((card) => {
          const isBookmarked = bookmarkedMap[card.id];

          return (
            <div
              key={card.id}
              className="p-5 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-xs hover:shadow-md transition-all flex flex-col justify-between gap-3 group"
            >
              {/* Header: Hanzi, Pinyin & Bookmark */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="text-3xl font-black font-chinese text-stone-900 dark:text-white">
                    {card.hanzi}
                  </span>
                  <div>
                    <div className="text-sm font-bold text-red-600 dark:text-red-400">
                      {card.pinyin}
                    </div>
                    <span className="text-[11px] font-semibold text-stone-400">
                      {card.category}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleSpeak(card.hanzi)}
                    className="p-2 rounded-xl border border-stone-200 dark:border-stone-700 text-stone-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer"
                    title="Phát âm từ này"
                  >
                    <Volume2 size={16} />
                  </button>

                  <button
                    onClick={() => handleToggleBookmark(card)}
                    className={`p-2 rounded-xl border transition-colors cursor-pointer ${
                      isBookmarked
                        ? 'bg-amber-500 text-white border-amber-500 shadow-xs'
                        : 'border-stone-200 dark:border-stone-700 text-stone-400 hover:text-amber-500 hover:bg-amber-50'
                    }`}
                    title={isBookmarked ? 'Đã lưu trong sổ tay' : 'Lưu vào sổ tay'}
                  >
                    {isBookmarked ? <BookmarkCheck size={16} /> : <Bookmark size={16} />}
                  </button>
                </div>
              </div>

              {/* Meaning */}
              <div className="text-base font-bold text-stone-800 dark:text-stone-200">
                {card.meaning}
              </div>

              {/* Example Sentence Box */}
              {card.exampleHanzi && (
                <div className="p-3.5 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200/60 dark:border-stone-700/60 space-y-1 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 flex items-center gap-1">
                      <BookOpen size={11} />
                      <span>Câu ví dụ:</span>
                    </span>
                    <button
                      onClick={() => handleSpeak(card.exampleHanzi!)}
                      className="text-stone-400 hover:text-red-600 transition-colors cursor-pointer"
                      title="Nghe câu ví dụ"
                    >
                      <Volume2 size={13} />
                    </button>
                  </div>
                  <div className="font-chinese font-bold text-sm text-stone-900 dark:text-white">
                    {card.exampleHanzi}
                  </div>
                  <div className="text-stone-500 dark:text-stone-400">
                    {card.examplePinyin} — "{card.exampleMeaning}"
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
