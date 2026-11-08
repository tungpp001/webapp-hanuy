import type React from 'react';
import { useState, useEffect, useMemo } from 'react';
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
  RotateCcw,
  GraduationCap,
  Image as ImageIcon
} from 'lucide-react';
import { HSK_LEVELS, ALL_FLASHCARDS } from '../../data/flashcards';
import type { FlashcardMastery, FlashcardProgress } from '../../types/flashcard';
import { FlashcardCard } from './FlashcardCard';
import { FlashcardQuiz } from './FlashcardQuiz';
import { FlashcardList } from './FlashcardList';
import { CharacterEtymologyModal } from '../Common/CharacterEtymologyModal';
import { playSoundEffect } from '../../utils/speech';
import { getSRSStats, getDueSRSFlashcards } from '../../utils/srs';

type FlashcardViewMode = 'deck' | 'quiz' | 'list';

export const FlashcardHub: React.FC = () => {
  const [selectedLevelId, setSelectedLevelId] = useState<string>('all');
  const [viewMode, setViewMode] = useState<FlashcardViewMode>('deck');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [autoPlayAudio, setAutoPlayAudio] = useState(true);
  const [showPinyinInitial, setShowPinyinInitial] = useState(true);
  const [showIllustration, setShowIllustration] = useState(true);
  const [isDueOnlyMode, setIsDueOnlyMode] = useState(false);
  const [selectedEtymologyChar, setSelectedEtymologyChar] = useState<string | null>(null);

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

  // Current Level Object
  const currentLevelInfo = useMemo(() => {
    return HSK_LEVELS.find((lvl) => lvl.id === selectedLevelId) || HSK_LEVELS[0];
  }, [selectedLevelId]);

  // Base cards of selected level
  const baseCards = useMemo(() => {
    return currentLevelInfo.cards;
  }, [currentLevelInfo]);

  // Available categories for selected level
  const availableCategories = useMemo(() => {
    const cats = Array.from(new Set(baseCards.map((c) => c.category)));
    return ['all', ...cats];
  }, [baseCards]);

  // SRS Statistics
  const srsStats = useMemo(() => {
    return getSRSStats(baseCards);
  }, [baseCards, progress]);

  // Reset category filter if not present in new level
  useEffect(() => {
    if (selectedCategory !== 'all' && !availableCategories.includes(selectedCategory)) {
      setSelectedCategory('all');
    }
  }, [selectedLevelId, availableCategories, selectedCategory]);

  // Filtered cards for active display
  const activeCards = useMemo(() => {
    let list = baseCards;
    if (isDueOnlyMode) {
      const dueList = getDueSRSFlashcards(baseCards);
      list = dueList.length > 0 ? dueList : baseCards;
    }
    if (selectedCategory !== 'all') {
      list = list.filter((c) => c.category === selectedCategory);
    }
    return list;
  }, [baseCards, selectedCategory, isDueOnlyMode, progress]);

  // Reset current card index when level or category changes
  useEffect(() => {
    setCurrentIndex(0);
  }, [selectedLevelId, selectedCategory, isDueOnlyMode]);

  const handleShuffle = () => {
    playSoundEffect('click');
    setCurrentIndex((prev) => (prev + 1) % (activeCards.length || 1));
  };

  const handleNext = () => {
    playSoundEffect('click');
    if (currentIndex < activeCards.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      setCurrentIndex(0); // loop back
    }
  };

  const handlePrev = () => {
    playSoundEffect('click');
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    } else {
      setCurrentIndex(activeCards.length - 1);
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

    // Auto advance to next card after brief delay
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
  }, [viewMode, currentIndex, activeCards.length]);

  // Level-specific Mastery Statistics
  const totalCardsInView = baseCards.length;
  const masteredCount = baseCards.filter((c) => progress[c.id]?.mastery === 'mastered').length;
  const learningCount = baseCards.filter((c) => progress[c.id]?.mastery === 'learning').length;
  const unlearnedCount = totalCardsInView - masteredCount - learningCount;
  const progressPercent = totalCardsInView > 0 ? Math.round((masteredCount / totalCardsInView) * 100) : 0;

  const currentCard = activeCards[currentIndex] || activeCards[0];
  const currentMastery = progress[currentCard?.id]?.mastery || 'unlearned';

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fade-in pb-20">
      {/* Top Banner with Level Indicator */}
      <div className={`p-6 sm:p-10 rounded-3xl bg-gradient-to-r ${currentLevelInfo.color} text-white shadow-xl relative overflow-hidden transition-all duration-500`}>
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-white/20 backdrop-blur-md text-white text-xs font-bold">
              <GraduationCap size={15} />
              {currentLevelInfo.name} ({currentLevelInfo.count} từ vựng & câu ví dụ)
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-black/20 backdrop-blur-sm text-[11px] font-bold">
              {currentLevelInfo.badge}
            </span>
            {srsStats.dueTodayCount > 0 && (
              <span className="px-2.5 py-0.5 rounded-full bg-amber-400 text-stone-900 text-[11px] font-extrabold animate-pulse">
                ⏰ {srsStats.dueTodayCount} từ cần ôn SRS hôm nay
              </span>
            )}
          </div>
          <h1 className="text-2xl sm:text-4xl font-black tracking-tight">
            Ôn Luyện Flashcard {currentLevelInfo.name}
          </h1>
          <p className="text-stone-100 text-xs sm:text-sm leading-relaxed">
            {currentLevelInfo.description}. Thuật toán lặp lại ngắt quãng SM-2 (SRS), chiết tự bộ thủ, nghe phát âm chuẩn và câu ví dụ thực tế!
          </p>
        </div>
        <div className="absolute right-4 bottom-[-20px] select-none pointer-events-none opacity-15 font-calligraphy text-9xl sm:text-[180px] text-white">
          {currentLevelInfo.id === 'all' ? '汉语' : currentLevelInfo.name.replace(' ', '')}
        </div>
      </div>

      {/* HSK Level Selection Tabs (HSK 1 to HSK 6 + Tất cả) */}
      <div className="bg-white dark:bg-stone-900 p-2 sm:p-3 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-xs">
        <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {HSK_LEVELS.map((lvl) => {
            const isSelected = selectedLevelId === lvl.id;
            return (
              <button
                key={lvl.id}
                onClick={() => {
                  playSoundEffect('click');
                  setSelectedLevelId(lvl.id);
                  setIsDueOnlyMode(false);
                }}
                className={`flex-1 min-w-[110px] sm:min-w-[130px] px-3 py-2.5 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all cursor-pointer text-center ${
                  isSelected
                    ? `${lvl.bgActive} shadow-md scale-[1.02]`
                    : 'bg-stone-50 dark:bg-stone-800/60 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <span className="text-xs sm:text-sm font-black">{lvl.name}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-md font-bold ${
                    isSelected ? 'bg-white/25 text-white' : 'bg-stone-200 dark:bg-stone-700 text-stone-600 dark:text-stone-400'
                  }`}>
                    {lvl.count}
                  </span>
                </div>
                <span className={`text-[10px] font-semibold truncate w-full ${
                  isSelected ? 'text-white/90' : 'text-stone-400 dark:text-stone-500'
                }`}>
                  {lvl.badge}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Progress & Mastery & SRS Overview Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-xs">
          <span className="text-[11px] font-bold uppercase text-stone-400 block mb-1">
            Tiến Trình {currentLevelInfo.name}
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
              {progressPercent}%
            </span>
            <span className="text-xs text-stone-400 font-semibold">
              ({masteredCount}/{totalCardsInView} từ)
            </span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-stone-100 dark:bg-stone-800 mt-2 overflow-hidden">
            <div
              style={{ width: `${progressPercent}%` }}
              className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500"
            />
          </div>
        </div>

        <button
          onClick={() => {
            playSoundEffect('click');
            setIsDueOnlyMode(!isDueOnlyMode);
          }}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
            isDueOnlyMode
              ? 'bg-amber-50 dark:bg-amber-950/60 border-amber-500 ring-2 ring-amber-500/20 shadow-md'
              : 'bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800 hover:border-amber-400'
          }`}
        >
          <span className="text-[11px] font-bold uppercase text-amber-600 dark:text-amber-400 block mb-1 flex items-center justify-between">
            <span className="flex items-center gap-1">
              <Sparkles size={13} />
              Cần Ôn SRS Hôm Nay
            </span>
            {isDueOnlyMode && <span className="text-[9px] px-1.5 py-0.2 rounded-md bg-amber-500 text-white">Đang lọc</span>}
          </span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-stone-800 dark:text-stone-200">
              {srsStats.dueTodayCount}
            </span>
            <span className="text-xs text-stone-400 font-semibold">từ</span>
          </div>
        </button>

        <div className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-xs">
          <span className="text-[11px] font-bold uppercase text-emerald-600 dark:text-emerald-400 block mb-1 flex items-center gap-1">
            <CheckCircle size={13} />
            Đã Thuộc (Mastered)
          </span>
          <span className="text-2xl font-black text-stone-800 dark:text-stone-200">
            {masteredCount} từ
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-xs">
          <span className="text-[11px] font-bold uppercase text-red-600 dark:text-red-400 block mb-1 flex items-center gap-1">
            <RotateCcw size={13} />
            Chưa Học / Đang Học
          </span>
          <span className="text-2xl font-black text-stone-800 dark:text-stone-200">
            {unlearnedCount + learningCount} từ
          </span>
        </div>
      </div>

      {/* Navigation View Mode Tabs & Category Selector */}
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
            <span>Lật Thẻ 3D ({activeCards.length})</span>
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
            <span>Danh Sách Từ Vựng</span>
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
            {availableCategories.map((c) => (
              <option key={c} value={c}>
                {c === 'all' ? `Tất cả chủ đề (${baseCards.length} từ)` : c}
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
              Thẻ {activeCards.length > 0 ? currentIndex + 1 : 0} / {activeCards.length}
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
                onClick={() => setShowIllustration(!showIllustration)}
                className={`p-2 rounded-xl border transition-all cursor-pointer ${
                  showIllustration
                    ? 'bg-red-50 text-red-600 border-red-200 dark:bg-red-950/60 dark:border-red-900'
                    : 'border-stone-200 dark:border-stone-700 text-stone-400'
                }`}
                title={showIllustration ? 'Hình minh họa: Đang bật' : 'Hình minh họa: Đang tắt'}
              >
                <ImageIcon size={15} />
              </button>

              <button
                onClick={handleShuffle}
                className="px-3 py-1.5 rounded-xl border border-stone-200 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 transition-all flex items-center gap-1 text-xs font-bold cursor-pointer"
                title="Đổi thẻ tiếp theo"
              >
                <Shuffle size={14} />
                <span>Đổi thẻ</span>
              </button>
            </div>
          </div>

          {/* Active 3D Flashcard */}
          {currentCard ? (
            <FlashcardCard
              card={currentCard}
              mastery={currentMastery}
              onRate={handleRate}
              showPinyinInitial={showPinyinInitial}
              autoPlayAudio={autoPlayAudio}
              showIllustration={showIllustration}
              onOpenEtymology={(char) => setSelectedEtymologyChar(char)}
            />
          ) : (
            <div className="p-10 text-center text-stone-400">
              Không có từ vựng nào trong chủ đề này.
            </div>
          )}

          {/* Bottom Next/Prev Deck Navigation Buttons */}
          {activeCards.length > 0 && (
            <div className="flex items-center justify-center gap-4 pt-2">
              <button
                onClick={handlePrev}
                className="p-3.5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 shadow-sm transition-all active:scale-95 cursor-pointer"
                title="Thẻ trước (Phím mũi tên Trái)"
              >
                <ChevronLeft size={20} />
              </button>

              <span className="text-xs font-mono font-bold text-stone-400">
                {currentIndex + 1} / {activeCards.length}
              </span>

              <button
                onClick={handleNext}
                className="p-3.5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 shadow-sm transition-all active:scale-95 cursor-pointer"
                title="Thẻ tiếp theo (Phím mũi tên Phải)"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          )}
        </div>
      )}

      {/* VIEW 2: QUIZ MODE */}
      {viewMode === 'quiz' && <FlashcardQuiz cards={activeCards.length >= 4 ? activeCards : ALL_FLASHCARDS} />}

      {/* VIEW 3: DIRECTORY LIST MODE */}
      {viewMode === 'list' && (
        <FlashcardList
          cards={activeCards}
          onOpenEtymology={(char) => setSelectedEtymologyChar(char)}
        />
      )}

      {/* Character Etymology & Radical Breakdown Modal */}
      {selectedEtymologyChar && (
        <CharacterEtymologyModal
          char={selectedEtymologyChar}
          onClose={() => setSelectedEtymologyChar(null)}
        />
      )}
    </div>
  );
};
