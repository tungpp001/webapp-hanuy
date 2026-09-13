import type React from 'react';
import { useState, useEffect } from 'react';
import { 
  Volume2, 
  RotateCw, 
  Check, 
  X, 
  Bookmark, 
  BookmarkCheck, 
  Sparkles,
  BookOpen
} from 'lucide-react';
import type { FlashcardItem, FlashcardMastery } from '../../types/flashcard';
import { speakChinese, playSoundEffect } from '../../utils/speech';
import { toggleBookmarkWord, isWordBookmarked, addXP } from '../../utils/storage';

interface FlashcardCardProps {
  card: FlashcardItem;
  mastery?: FlashcardMastery;
  onRate: (cardId: string, mastery: FlashcardMastery) => void;
  showPinyinInitial?: boolean;
  autoPlayAudio?: boolean;
}

export const FlashcardCard: React.FC<FlashcardCardProps> = ({
  card,
  onRate,
  showPinyinInitial = true,
  autoPlayAudio = true,
}) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const [showPinyin, setShowPinyin] = useState(showPinyinInitial);
  const [isBookmarked, setIsBookmarked] = useState(false);

  useEffect(() => {
    setIsFlipped(false);
    setShowPinyin(showPinyinInitial);
    setIsBookmarked(isWordBookmarked(card.hanzi));

    if (autoPlayAudio) {
      speakChinese(card.hanzi, 1.0);
    }
  }, [card.id, card.hanzi, showPinyinInitial, autoPlayAudio]);

  const handleFlip = () => {
    playSoundEffect('click');
    setIsFlipped(!isFlipped);
  };

  const handleSpeakHanzi = (e: React.MouseEvent) => {
    e.stopPropagation();
    playSoundEffect('click');
    speakChinese(card.hanzi, 1.0);
  };

  const handleSpeakExample = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (card.exampleHanzi) {
      playSoundEffect('click');
      speakChinese(card.exampleHanzi, 0.9);
    }
  };

  const handleBookmarkToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    playSoundEffect('click');
    const newState = toggleBookmarkWord(card.hanzi);
    setIsBookmarked(newState);
  };

  const handleRating = (status: FlashcardMastery, e: React.MouseEvent) => {
    e.stopPropagation();
    if (status === 'mastered') {
      playSoundEffect('correct');
      addXP(10);
    } else if (status === 'learning') {
      playSoundEffect('click');
      addXP(5);
    } else {
      playSoundEffect('incorrect');
    }
    onRate(card.id, status);
  };

  return (
    <div className="w-full max-w-xl mx-auto perspective-1000 select-none">
      {/* 3D Flip Card Container */}
      <div
        onClick={handleFlip}
        className={`relative min-h-[380px] sm:min-h-[420px] rounded-3xl transition-transform duration-500 transform-style-3d cursor-pointer shadow-xl ${
          isFlipped ? 'rotate-y-180' : ''
        }`}
      >
        {/* =================================================================== */}
        {/* FRONT OF THE CARD (MẶT TRƯỚC: CHỮ HÁN & PHIÊN ÂM) */}
        {/* =================================================================== */}
        <div className="absolute inset-0 backface-hidden rounded-3xl bg-gradient-to-tr from-white via-stone-50 to-red-50/40 dark:from-stone-900 dark:via-stone-900 dark:to-stone-800 border-2 border-stone-200 dark:border-stone-700 p-6 sm:p-8 flex flex-col justify-between text-center overflow-hidden">
          {/* Top Row: Category badge & bookmark */}
          <div className="flex items-center justify-between">
            <span className="px-3 py-1 rounded-xl bg-red-100 dark:bg-red-950 text-red-600 dark:text-red-300 font-bold text-xs">
              {card.category}
            </span>

            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 font-bold text-xs">
                {card.level}
              </span>
              <button
                onClick={handleBookmarkToggle}
                className={`p-2 rounded-xl border transition-colors cursor-pointer ${
                  isBookmarked
                    ? 'bg-amber-500 text-white border-amber-500 shadow-xs'
                    : 'border-stone-200 dark:border-stone-700 text-stone-400 hover:text-amber-500 hover:bg-amber-50'
                }`}
                title={isBookmarked ? 'Đã lưu trong sổ tay' : 'Lưu vào sổ tay từ vựng'}
              >
                {isBookmarked ? <BookmarkCheck size={16} /> : <Bookmark size={16} />}
              </button>
            </div>
          </div>

          {/* Center: Hanzi & Pinyin */}
          <div className="space-y-3 my-auto py-6">
            <h2 className="text-6xl sm:text-7xl font-black font-chinese text-stone-900 dark:text-white tracking-tight leading-none drop-shadow-xs">
              {card.hanzi}
            </h2>

            {showPinyin ? (
              <div className="text-xl sm:text-2xl font-bold text-red-600 dark:text-red-400 font-sans">
                {card.pinyin}
              </div>
            ) : (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowPinyin(true);
                }}
                className="px-3 py-1 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-500 hover:text-red-600 text-xs font-semibold transition-colors cursor-pointer"
              >
                👁️ Hiện Pinyin
              </button>
            )}

            {card.sinoVietnamese && (
              <div className="text-xs font-bold text-stone-500 dark:text-stone-400">
                Âm Hán-Việt: <span className="text-stone-700 dark:text-stone-200">{card.sinoVietnamese}</span>
              </div>
            )}

            {/* Audio pronounce button */}
            <div className="pt-2">
              <button
                onClick={handleSpeakHanzi}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-red-50 hover:bg-red-100 dark:bg-red-950/60 dark:hover:bg-red-900/60 text-red-600 dark:text-red-300 font-bold text-xs transition-all shadow-xs active:scale-95 cursor-pointer"
              >
                <Volume2 size={16} />
                <span>Phát âm mẫu (zh-CN)</span>
              </button>
            </div>
          </div>

          {/* Bottom Flip Hint */}
          <div className="flex items-center justify-center gap-1.5 text-xs text-stone-400 font-medium pt-2 border-t border-stone-200/60 dark:border-stone-800">
            <RotateCw size={13} className="text-red-500 animate-spin-slow" />
            <span>Nhấp vào thẻ hoặc bấm phím Space để xem nghĩa & câu ví dụ</span>
          </div>
        </div>

        {/* =================================================================== */}
        {/* BACK OF THE CARD (MẶT SAU: NGHĨA & CÂU VÍ DỤ THỰC TẾ) */}
        {/* =================================================================== */}
        <div className="absolute inset-0 backface-hidden rotate-y-180 rounded-3xl bg-gradient-to-tr from-white via-stone-50 to-amber-50/40 dark:from-stone-900 dark:via-stone-900 dark:to-stone-800 border-2 border-amber-400/70 dark:border-amber-600/70 p-6 sm:p-8 flex flex-col justify-between text-left overflow-y-auto">
          {/* Top Row: Word summary */}
          <div className="flex items-center justify-between border-b border-stone-200/80 dark:border-stone-800 pb-3">
            <div className="flex items-center gap-2">
              <span className="text-2xl font-black font-chinese text-red-600 dark:text-red-400">
                {card.hanzi}
              </span>
              <span className="text-sm font-bold text-stone-500 dark:text-stone-400 font-sans">
                [{card.pinyin}]
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold px-2 py-0.5 rounded-lg bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300">
                {card.level}
              </span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-lg bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300">
                {card.category}
              </span>
            </div>
          </div>

          {/* Center: Meaning & Example Sentence */}
          <div className="space-y-4 my-auto py-3">
            {/* Vietnamese Meaning */}
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400 block mb-0.5">
                Nghĩa tiếng Việt:
              </span>
              <div className="text-xl sm:text-2xl font-black text-stone-900 dark:text-white">
                {card.meaning}
              </div>
            </div>

            {/* Example Sentence Box */}
            {card.exampleHanzi && (
              <div className="p-4 rounded-2xl bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-900 space-y-1.5 relative group">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800 dark:text-amber-400 flex items-center gap-1">
                    <BookOpen size={13} />
                    <span>Câu Ví Dụ Thực Tế:</span>
                  </span>

                  <button
                    onClick={handleSpeakExample}
                    className="p-1.5 rounded-lg bg-amber-200/80 dark:bg-amber-900 text-amber-900 dark:text-amber-200 hover:scale-110 transition-transform cursor-pointer"
                    title="Nghe phát âm câu ví dụ"
                  >
                    <Volume2 size={14} />
                  </button>
                </div>

                <div className="text-base sm:text-lg font-bold font-chinese text-stone-900 dark:text-white leading-relaxed">
                  {card.exampleHanzi}
                </div>

                {card.examplePinyin && (
                  <div className="text-xs font-semibold text-amber-700 dark:text-amber-300 font-sans">
                    {card.examplePinyin}
                  </div>
                )}

                {card.exampleMeaning && (
                  <div className="text-xs text-stone-600 dark:text-stone-300 pt-1 border-t border-amber-200/60 dark:border-amber-900/60">
                    "{card.exampleMeaning}"
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Bottom Rating Action Buttons (Anki style) */}
          <div className="pt-3 border-t border-stone-200/80 dark:border-stone-800 space-y-2">
            <span className="text-[11px] font-bold text-stone-400 text-center block">
              Bạn đã nhớ từ này chưa?
            </span>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={(e) => handleRating('unlearned', e)}
                className="px-3 py-2 rounded-xl bg-red-50 hover:bg-red-100 dark:bg-red-950/60 dark:hover:bg-red-900/60 text-red-600 dark:text-red-300 font-bold text-xs flex items-center justify-center gap-1 border border-red-200 dark:border-red-900 active:scale-95 transition-all cursor-pointer"
              >
                <X size={14} />
                <span>Chưa nhớ</span>
              </button>

              <button
                onClick={(e) => handleRating('learning', e)}
                className="px-3 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/60 dark:hover:bg-amber-900/60 text-amber-700 dark:text-amber-300 font-bold text-xs flex items-center justify-center gap-1 border border-amber-200 dark:border-amber-900 active:scale-95 transition-all cursor-pointer"
              >
                <Sparkles size={14} />
                <span>Tạm nhớ</span>
              </button>

              <button
                onClick={(e) => handleRating('mastered', e)}
                className="px-3 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 font-bold text-xs flex items-center justify-center gap-1 border border-emerald-200 dark:border-emerald-900 active:scale-95 transition-all cursor-pointer"
              >
                <Check size={14} />
                <span>Đã thuộc</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
