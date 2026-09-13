import type React from 'react';
import { useState, useEffect } from 'react';
import { 
  Layers, 
  HelpCircle, 
  ListOrdered, 
  Shuffle, 
  ChevronLeft, 
  ChevronRight, 
  Volume2, 
  VolumeX, 
  Eye, 
  EyeOff, 
  Sparkles,
  CheckCircle,
  RotateCcw
} from 'lucide-react';
import { HSK1_SHEET_FLASHCARDS } from '../../data/flashcardData';
import type { FlashcardItem, FlashcardMastery, FlashcardProgress } from '../../types/flashcard';
import { FlashcardCard } from './FlashcardCard';
import { FlashcardQuiz } from './FlashcardQuiz';
import { FlashcardList } from './FlashcardList';
import { playSoundEffect } from '../../utils/speech';

type FlashcardViewMode = 'deck' | 'quiz' | 'list';

export const FlashcardHub: React.FC = () => {
  const [viewMode, setViewMode] = useState<FlashcardViewMode>('deck');
  const [cards, setCards] = useState<FlashcardItem[]>(HSK1_SHEET_FLASHCARDS);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [autoPlayAudio, setAutoPlayAudio] = useState(true);
  const [showPinyinInitial, setShowPinyinInitial] = useState(true);

  // LocalStorage Progress Tracker
  const [progress, setProgress] = useState<FlashcardProgress>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('hanyu_flashcard_progress');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          console.warn(e);
        }
      }
    }
    return {};
  });

  // Save progress to LocalStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('hanyu_flashcard_progress', JSON.stringify(progress));
    }
  }, [progress]);

  // Categories
  const categories = ['all', ...Array.from(new Set(HSK1_SHEET_FLASHCARDS.map((c) => c.category)))];

  // Filter cards by category
  useEffect(() => {
    let filtered = HSK1_SHEET_FLASHCARDS;
    if (selectedCategory !== 'all') {
      filtered = HSK1_SHEET_FLASHCARDS.filter((c) => c.category === selectedCategory);
    }
    setCards(filtered);
    setCurrentIndex(0);
  }, [selectedCategory]);

  const handleShuffle = () => {
    playSoundEffect('click');
    const shuffled = [...cards].sort(() => 0.5 - Math.random());
    setCards(shuffled);
    setCurrentIndex(0);
  };

  const handleNext = () => {
    playSoundEffect('click');
    if (currentIndex < cards.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      setCurrentIndex(0); // loop
    }
  };

  const handlePrev = () => {
    playSoundEffect('click');
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    } else {
      setCurrentIndex(cards.length - 1);
    }
  };

  const handleRate = (cardId: string, mastery: FlashcardMastery) => {
    setProgress((prev) => ({
      ...prev,
      [cardId]: {
        mastery,
        reviewCount: (prev[cardId]?.reviewCount || 0) + 1,
        lastReviewed: new Date().toISOString(),
      },
    }));

    // Auto advance to next card
    setTimeout(() => {
      handleNext();
    }, 350);
  };

  // Keyboard navigation for flashcard deck
  useEffect(() => {
    if (viewMode !== 'deck') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') {
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [viewMode, currentIndex, cards.length]);

  // Mastery Statistics
  const totalCards = HSK1_SHEET_FLASHCARDS.length;
  const masteredCount = Object.values(progress).filter((p) => p.mastery === 'mastered').length;
  const learningCount = Object.values(progress).filter((p) => p.mastery === 'learning').length;
  const unlearnedCount = totalCards - masteredCount - learningCount;
  const progressPercent = Math.round((masteredCount / totalCards) * 100);

  const currentCard = cards[currentIndex] || cards[0];
  const currentMastery = progress[currentCard?.id]?.mastery || 'unlearned';

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fade-in pb-20">
      {/* Top Banner */}
      <div className="p-6 sm:p-10 rounded-3xl bg-gradient-to-r from-red-700 via-rose-700 to-amber-600 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 max-w-2xl space-y-3">
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-white/20 backdrop-blur-md text-white text-xs font-bold">
            <Layers size={14} className="text-amber-200" />
            Bộ Flashcards 150 Từ Vựng & Câu Ví Dụ Thực Tế
          </span>
          <h1 className="text-2xl sm:text-4xl font-black tracking-tight">
            Ôn Tập Từ Vựng & Mẫu Câu Giao Tiếp
          </h1>
          <p className="text-stone-100 text-xs sm:text-sm leading-relaxed">
            Dữ liệu tuyển chọn 150 từ vựng và câu ví dụ hoàn chỉnh theo giáo trình chuẩn: Xem mặt chữ Hán, Pinyin, nghe phát âm chuẩn và xem câu ví dụ thực tế!
          </p>
        </div>
        <div className="absolute right-4 bottom-[-20px] select-none pointer-events-none opacity-15 font-calligraphy text-9xl sm:text-[180px] text-white">
          卡片
        </div>
      </div>

      {/* Progress & Mastery Overview Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-xs">
          <span className="text-[11px] font-bold uppercase text-stone-400 block mb-1">
            Tiến Trình Đã Thuộc
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
              {progressPercent}%
            </span>
            <span className="text-xs text-stone-400 font-semibold">
              ({masteredCount}/{totalCards} từ)
            </span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-stone-100 dark:bg-stone-800 mt-2 overflow-hidden">
            <div
              style={{ width: `${progressPercent}%` }}
              className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500"
            />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-xs">
          <span className="text-[11px] font-bold uppercase text-emerald-600 dark:text-emerald-400 block mb-1 flex items-center gap-1">
            <CheckCircle size={13} />
            Đã Thuộc
          </span>
          <span className="text-2xl font-black text-stone-800 dark:text-stone-200">
            {masteredCount} từ
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-xs">
          <span className="text-[11px] font-bold uppercase text-amber-600 dark:text-amber-400 block mb-1 flex items-center gap-1">
            <Sparkles size={13} />
            Đang Học
          </span>
          <span className="text-2xl font-black text-stone-800 dark:text-stone-200">
            {learningCount} từ
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-xs">
          <span className="text-[11px] font-bold uppercase text-red-600 dark:text-red-400 block mb-1 flex items-center gap-1">
            <RotateCcw size={13} />
            Chưa Học
          </span>
          <span className="text-2xl font-black text-stone-800 dark:text-stone-200">
            {unlearnedCount} từ
          </span>
        </div>
      </div>

      {/* Navigation View Mode Tabs */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-b border-stone-200 dark:border-stone-800 pb-3">
        {/* Mode Pills */}
        <div className="flex items-center gap-1.5 bg-stone-100 dark:bg-stone-800 p-1 rounded-2xl">
          <button
            onClick={() => {
              playSoundEffect('click');
              setViewMode('deck');
            }}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              viewMode === 'deck'
                ? 'bg-red-600 text-white shadow-xs'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
            }`}
          >
            <Layers size={16} />
            <span>Lật Thẻ 3D ({cards.length})</span>
          </button>

          <button
            onClick={() => {
              playSoundEffect('click');
              setViewMode('quiz');
            }}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              viewMode === 'quiz'
                ? 'bg-red-600 text-white shadow-xs'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
            }`}
          >
            <HelpCircle size={16} />
            <span>Trắc Nghiệm Nhanh</span>
          </button>

          <button
            onClick={() => {
              playSoundEffect('click');
              setViewMode('list');
            }}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              viewMode === 'list'
                ? 'bg-red-600 text-white shadow-xs'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
            }`}
          >
            <ListOrdered size={16} />
            <span>Danh Sách 150 Từ</span>
          </button>
        </div>

        {/* Category Selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-stone-400 whitespace-nowrap">Chủ đề:</span>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-xs font-bold text-stone-800 dark:text-stone-200 focus:outline-hidden focus:ring-2 focus:ring-red-500 cursor-pointer"
          >
            {categories.map((c) => (
              <option key={c} value={c}>
                {c === 'all' ? 'Tất cả chủ đề (150 từ)' : c}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* VIEW 1: 3D FLASHCARD DECK MODE */}
      {viewMode === 'deck' && (
        <div className="space-y-6">
          {/* Deck Action Bar */}
          <div className="flex items-center justify-between gap-2 max-w-xl mx-auto text-xs font-semibold text-stone-500 dark:text-stone-400">
            {/* Progress indicator */}
            <span className="font-bold text-stone-800 dark:text-stone-200">
              Thẻ {currentIndex + 1} / {cards.length}
            </span>

            {/* Deck Toggles */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setAutoPlayAudio(!autoPlayAudio)}
                className={`p-2 rounded-xl border transition-all cursor-pointer ${
                  autoPlayAudio
                    ? 'bg-red-50 text-red-600 border-red-200 dark:bg-red-950/60 dark:border-red-900'
                    : 'border-stone-200 dark:border-stone-700 text-stone-400'
                }`}
                title={autoPlayAudio ? 'Tự động phát âm khi lật: Bật' : 'Tự động phát âm khi lật: Tắt'}
              >
                {autoPlayAudio ? <Volume2 size={15} /> : <VolumeX size={15} />}
              </button>

              <button
                onClick={() => setShowPinyinInitial(!showPinyinInitial)}
                className={`p-2 rounded-xl border transition-all cursor-pointer ${
                  showPinyinInitial
                    ? 'bg-red-50 text-red-600 border-red-200 dark:bg-red-950/60 dark:border-red-900'
                    : 'border-stone-200 dark:border-stone-700 text-stone-400'
                }`}
                title={showPinyinInitial ? 'Luôn hiện Pinyin mặt trước' : 'Ẩn Pinyin mặt trước để tự nhớ'}
              >
                {showPinyinInitial ? <Eye size={15} /> : <EyeOff size={15} />}
              </button>

              <button
                onClick={handleShuffle}
                className="px-3 py-1.5 rounded-xl border border-stone-200 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 transition-all flex items-center gap-1 text-xs font-bold cursor-pointer"
                title="Xáo trộn ngẫu nhiên"
              >
                <Shuffle size={14} />
                <span>Xáo thẻ</span>
              </button>
            </div>
          </div>

          {/* Active 3D Flashcard */}
          {currentCard && (
            <FlashcardCard
              card={currentCard}
              mastery={currentMastery}
              onRate={handleRate}
              showPinyinInitial={showPinyinInitial}
              autoPlayAudio={autoPlayAudio}
            />
          )}

          {/* Bottom Next/Prev Deck Navigation Buttons */}
          <div className="flex items-center justify-center gap-4 pt-2">
            <button
              onClick={handlePrev}
              className="p-3.5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 shadow-sm transition-all active:scale-95 cursor-pointer"
              title="Thẻ trước (Phím mũi tên Trái)"
            >
              <ChevronLeft size={20} />
            </button>

            <span className="text-xs font-mono font-bold text-stone-400">
              {currentIndex + 1} / {cards.length}
            </span>

            <button
              onClick={handleNext}
              className="p-3.5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 shadow-sm transition-all active:scale-95 cursor-pointer"
              title="Thẻ tiếp theo (Phím mũi tên Phải)"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      )}

      {/* VIEW 2: QUIZ MODE */}
      {viewMode === 'quiz' && <FlashcardQuiz cards={cards} />}

      {/* VIEW 3: DIRECTORY LIST MODE */}
      {viewMode === 'list' && <FlashcardList cards={cards} />}
    </div>
  );
};
