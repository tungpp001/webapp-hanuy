import type React from 'react';
import { useState } from 'react';
import { Bookmark, BookmarkCheck, Search, Trash2 } from 'lucide-react';
import { FLASHCARDS } from '../../data/vocabulary';
import { DIALOGUES } from '../../data/dialogues';
import { getUserProgress, toggleBookmarkWord } from '../../utils/storage';
import { AudioButton } from '../Common/AudioButton';
import { playSoundEffect } from '../../utils/speech';

interface VocabNotebookProps {
  onUpdate?: () => void;
}

export const VocabNotebook: React.FC<VocabNotebookProps> = ({ onUpdate }) => {
  const [progress, setProgress] = useState(getUserProgress());
  const [searchQuery, setSearchQuery] = useState('');

  // Collect all vocabulary from flashcards and dialogues
  const allVocabMap = new Map<string, { hanzi: string; pinyin: string; sinoVietnamese: string; meaning: string; exampleCn?: string; exampleVn?: string }>();

  FLASHCARDS.forEach(fc => {
    allVocabMap.set(fc.hanzi, {
      hanzi: fc.hanzi,
      pinyin: fc.pinyin,
      sinoVietnamese: fc.sinoVietnamese,
      meaning: fc.meaning,
      exampleCn: fc.exampleCn,
      exampleVn: fc.exampleVn,
    });
  });

  DIALOGUES.forEach(d => {
    d.lines.forEach(l => {
      l.words.forEach(w => {
        if (!allVocabMap.has(w.hanzi)) {
          allVocabMap.set(w.hanzi, {
            hanzi: w.hanzi,
            pinyin: w.pinyin,
            sinoVietnamese: w.sinoVietnamese,
            meaning: w.meaning,
            exampleCn: w.exampleCn,
            exampleVn: w.exampleVn,
          });
        }
      });
    });
  });

  const bookmarkedItems = progress.bookmarkedWords.map(word => {
    return allVocabMap.get(word) || {
      hanzi: word,
      pinyin: '',
      sinoVietnamese: '',
      meaning: 'Từ vựng đã lưu',
    };
  });

  const filteredItems = bookmarkedItems.filter(item => 
    item.hanzi.includes(searchQuery) ||
    item.pinyin.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.meaning.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.sinoVietnamese.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleRemove = (hanzi: string) => {
    toggleBookmarkWord(hanzi);
    const updated = getUserProgress();
    setProgress(updated);
    playSoundEffect('click');
    onUpdate?.();
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in pb-20">
      {/* Header */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-red-700 via-rose-700 to-amber-600 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10 max-w-xl">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-white text-xs font-bold mb-3">
            <BookmarkCheck size={14} className="text-amber-200" />
            Sổ Tay Từ Vựng Yêu Thích
          </span>
          <h1 className="text-2xl sm:text-3xl font-black mb-2 tracking-tight">
            Từ Vựng Giao Tiếp Của Tôi
          </h1>
          <p className="text-stone-100 text-xs sm:text-sm leading-relaxed">
            Xem lại và ôn tập các từ vựng bạn đã đánh dấu trong các bài hội thoại thực chiến.
          </p>
        </div>
        <div className="absolute right-4 bottom-[-10px] select-none pointer-events-none opacity-15 font-calligraphy text-9xl text-white">
          生词
        </div>
      </div>

      {/* Search & Count */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" size={16} />
          <input
            type="text"
            placeholder="Tìm trong sổ tay (chữ Hán, pinyin, nghĩa)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-xs sm:text-sm text-stone-900 dark:text-white placeholder-stone-400 focus:outline-hidden focus:ring-2 focus:ring-red-500"
          />
        </div>

        <span className="text-xs font-bold text-stone-500">
          Tổng cộng: {progress.bookmarkedWords.length} từ đã lưu
        </span>
      </div>

      {/* Word Cards Grid */}
      {filteredItems.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {filteredItems.map((item, idx) => (
            <div
              key={idx}
              className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 hover:border-red-300 dark:hover:border-red-800 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-2xl sm:text-3xl font-black font-chinese text-red-600 dark:text-red-400">
                      {item.hanzi}
                    </span>
                    {item.pinyin && (
                      <span className="text-sm font-semibold text-stone-700 dark:text-stone-300 ml-2">
                        {item.pinyin}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    <AudioButton text={item.hanzi} size="sm" variant="ghost" />
                    <button
                      onClick={() => handleRemove(item.hanzi)}
                      className="p-1.5 rounded-lg text-stone-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                      title="Bỏ lưu khỏi sổ tay"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>

                {item.sinoVietnamese && (
                  <div className="text-xs text-amber-700 dark:text-amber-400 font-semibold mt-0.5">
                    Hán-Việt: {item.sinoVietnamese}
                  </div>
                )}

                <div className="text-xs sm:text-sm font-medium text-stone-900 dark:text-stone-100 mt-2">
                  {item.meaning}
                </div>

                {item.exampleCn && (
                  <div className="mt-2.5 pt-2 border-t border-stone-100 dark:border-stone-800 text-xs">
                    <div className="text-stone-700 dark:text-stone-300 font-chinese">
                      {item.exampleCn}
                    </div>
                    {item.exampleVn && (
                      <div className="text-stone-400 text-[11px] mt-0.5">
                        {item.exampleVn}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 p-8 space-y-3">
          <Bookmark size={40} className="mx-auto text-stone-300 dark:text-stone-700" />
          <h3 className="font-bold text-stone-700 dark:text-stone-300">
            Chưa có từ vựng nào trong sổ tay
          </h3>
          <p className="text-xs text-stone-400 max-w-sm mx-auto">
            Khi học trong các bài hội thoại, hãy nhấp vào từ vựng bất kỳ và chọn "Lưu từ vựng này" để ôn tập lại tại đây nhé!
          </p>
        </div>
      )}
    </div>
  );
};
