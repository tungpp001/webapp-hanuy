import type React from 'react';
import { useState } from 'react';
import { X, Bookmark, BookmarkCheck, Sparkles, BookOpen } from 'lucide-react';
import type { WordBreakdown } from '../../types/chinese';
import { AudioButton } from '../Common/AudioButton';
import { toggleBookmarkWord } from '../../utils/storage';
import { playSoundEffect } from '../../utils/speech';

interface WordModalProps {
  word: WordBreakdown | null;
  onClose: () => void;
  isBookmarked?: boolean;
  onBookmarkChange?: () => void;
}

export const WordModal: React.FC<WordModalProps> = ({
  word,
  onClose,
  isBookmarked = false,
  onBookmarkChange,
}) => {
  const [bookmarked, setBookmarked] = useState(isBookmarked);

  if (!word) return null;

  const handleToggleBookmark = () => {
    const newState = toggleBookmarkWord(word.hanzi);
    setBookmarked(newState);
    playSoundEffect('click');
    onBookmarkChange?.();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in" onClick={onClose}>
      <div 
        className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-6 max-w-md w-full shadow-2xl relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
        >
          <X size={20} />
        </button>

        {/* Word Header */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-3">
              <span className="text-4xl font-extrabold text-red-600 dark:text-red-400 font-chinese tracking-wide">
                {word.hanzi}
              </span>
              <AudioButton text={word.hanzi} size="md" variant="primary" showSpeedControl />
            </div>

            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              <span className="text-lg font-bold text-stone-800 dark:text-stone-200">
                {word.pinyin}
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 font-medium">
                Hán-Việt: {word.sinoVietnamese}
              </span>
              {word.pos && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400">
                  {word.pos}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Meaning Box */}
        <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200/80 dark:border-stone-700/60 mb-4">
          <div className="text-xs font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
            <Sparkles size={14} className="text-red-500" />
            Nghĩa tiếng Việt
          </div>
          <div className="text-base font-semibold text-stone-900 dark:text-white">
            {word.meaning}
          </div>
        </div>

        {/* Example Sentence */}
        {(word.exampleCn || word.notes) && (
          <div className="p-4 rounded-2xl bg-red-50/50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/40 mb-5">
            <div className="text-xs font-bold text-red-700 dark:text-red-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <BookOpen size={14} />
              Ví dụ giao tiếp thực tế
            </div>
            {word.exampleCn && (
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="text-sm font-medium text-stone-900 dark:text-stone-100 font-chinese">
                    {word.exampleCn}
                  </div>
                  {word.exampleVn && (
                    <div className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                      {word.exampleVn}
                    </div>
                  )}
                </div>
                <AudioButton text={word.exampleCn} size="sm" variant="ghost" />
              </div>
            )}
            {word.notes && (
              <div className="text-xs text-stone-600 dark:text-stone-300 mt-2 italic">
                * Lưu ý: {word.notes}
              </div>
            )}
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-stone-200 dark:border-stone-800">
          <button
            onClick={handleToggleBookmark}
            className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl border transition-all ${
              bookmarked
                ? 'bg-amber-500 text-white border-amber-500 shadow-sm'
                : 'text-stone-600 dark:text-stone-300 border-stone-300 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800'
            }`}
          >
            {bookmarked ? <BookmarkCheck size={16} /> : <Bookmark size={16} />}
            <span>{bookmarked ? 'Đã lưu vào sổ tay' : 'Lưu từ vựng này'}</span>
          </button>

          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold rounded-xl bg-stone-900 dark:bg-white text-white dark:text-stone-900 hover:opacity-90 transition-opacity"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
