import type React from 'react';
import { useState, useEffect } from 'react';
import { 
  CheckCircle2, 
  XCircle, 
  RotateCcw, 
  Flame, 
  Volume2, 
  ArrowRight,
  BookOpen
} from 'lucide-react';
import type { FlashcardItem } from '../../types/flashcard';
import { speakChinese, playSoundEffect } from '../../utils/speech';
import { addXP } from '../../utils/storage';
import { getFlashcardIllustration } from '../../utils/flashcardIllustration';
import confetti from 'canvas-confetti';

interface FlashcardQuizProps {
  cards: FlashcardItem[];
  onComplete?: () => void;
}

export const FlashcardQuiz: React.FC<FlashcardQuizProps> = ({ cards }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [options, setOptions] = useState<FlashcardItem[]>([]);
  const [quizPool, setQuizPool] = useState<FlashcardItem[]>([]);

  // Initialize randomized quiz
  const initQuiz = () => {
    playSoundEffect('click');
    const shuffled = [...cards].sort(() => 0.5 - Math.random()).slice(0, 20);
    setQuizPool(shuffled);
    setCurrentIndex(0);
    setScore(0);
    setCombo(0);
    setSelectedOption(null);
    setIsAnswered(false);
  };

  useEffect(() => {
    initQuiz();
  }, [cards]);

  const currentCard = quizPool[currentIndex] || cards[0];

  // Generate 4 options for current card
  useEffect(() => {
    if (!currentCard) return;

    // Pronounce the target word
    speakChinese(currentCard.hanzi, 1.0);

    const distractors = cards
      .filter((c) => c.id !== currentCard.id)
      .sort(() => 0.5 - Math.random())
      .slice(0, 3);

    const fullOptions = [currentCard, ...distractors].sort(() => 0.5 - Math.random());
    setOptions(fullOptions);
    setSelectedOption(null);
    setIsAnswered(false);
  }, [currentIndex, currentCard, cards]);

  const handleSelectOption = (optionId: string) => {
    if (isAnswered) return;

    setSelectedOption(optionId);
    setIsAnswered(true);

    if (optionId === currentCard.id) {
      // CORRECT!
      playSoundEffect('correct');
      const newCombo = combo + 1;
      setCombo(newCombo);
      setScore((prev) => prev + 10 + newCombo * 2);
      addXP(10);
    } else {
      // INCORRECT
      playSoundEffect('incorrect');
      setCombo(0);
    }
  };

  const handleNext = () => {
    playSoundEffect('click');
    if (currentIndex < quizPool.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      // Complete
      playSoundEffect('streak');
      addXP(40);
      try {
        confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
      } catch (e) {
        console.warn(e);
      }
    }
  };

  const illustration = currentCard ? getFlashcardIllustration(currentCard) : null;
  const isQuizFinished = currentIndex >= quizPool.length - 1 && isAnswered;

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in pb-20">
      {/* Quiz Top Bar */}
      <div className="flex items-center justify-between gap-3 p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-xs">
        <span className="text-xs font-bold text-stone-500 dark:text-stone-400">
          Câu hỏi: <span className="text-stone-900 dark:text-white font-black">{currentIndex + 1} / {quizPool.length}</span>
        </span>

        <div className="flex items-center gap-3">
          {combo > 1 && (
            <div className="flex items-center gap-1 text-amber-500 font-bold text-xs">
              <Flame size={14} className="fill-amber-500" />
              <span>Combo x{combo}</span>
            </div>
          )}

          <span className="px-3 py-1 rounded-xl bg-red-600 text-white font-black text-xs">
            {score} Điểm
          </span>
        </div>
      </div>

      {/* Target Hanzi Question Card */}
      <div className="p-8 rounded-3xl bg-gradient-to-tr from-stone-900 to-stone-800 text-white text-center shadow-xl space-y-3 relative overflow-hidden">
        <div className="flex items-center justify-center gap-2">
          <span className="px-3 py-1 rounded-full bg-white/10 text-amber-300 font-bold text-xs uppercase tracking-wider flex items-center gap-1.5">
            {illustration && <span>{illustration.emoji}</span>}
            <span>Chọn nghĩa đúng của từ:</span>
          </span>
          <span className="px-2 py-0.5 rounded-full bg-white/10 text-[10px] font-bold text-stone-300">
            {currentCard.level}
          </span>
        </div>

        <h2 className="text-5xl sm:text-6xl font-black font-chinese tracking-tight my-2">
          {currentCard.hanzi}
        </h2>

        <div className="flex items-center justify-center gap-2">
          <span className="text-lg font-bold text-stone-300 font-sans">
            {currentCard.pinyin}
          </span>
          <button
            onClick={() => speakChinese(currentCard.hanzi, 1.0)}
            className="p-1.5 rounded-lg bg-white/20 hover:bg-white/30 transition-colors"
            title="Nghe lại phát âm"
          >
            <Volume2 size={16} />
          </button>
        </div>
      </div>

      {/* 4 Choices Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {options.map((opt, idx) => {
          let btnStyle = 'bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800 text-stone-800 dark:text-stone-200 hover:border-red-400';

          if (isAnswered) {
            if (opt.id === currentCard.id) {
              btnStyle = 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 text-emerald-700 dark:text-emerald-300 font-black shadow-md ring-2 ring-emerald-500/20';
            } else if (opt.id === selectedOption) {
              btnStyle = 'bg-red-50 dark:bg-red-950/60 border-red-500 text-red-700 dark:text-red-300 font-black';
            } else {
              btnStyle = 'opacity-40 bg-stone-50 dark:bg-stone-800/40 border-stone-200 dark:border-stone-800';
            }
          }

          return (
            <button
              key={opt.id}
              onClick={() => handleSelectOption(opt.id)}
              disabled={isAnswered}
              className={`p-4 rounded-2xl border-2 text-left transition-all duration-200 flex items-center justify-between gap-3 shadow-xs cursor-pointer ${btnStyle}`}
            >
              <div className="flex items-center gap-3">
                <span className="w-7 h-7 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-500 dark:text-stone-400 font-bold text-xs flex items-center justify-center">
                  {String.fromCharCode(65 + idx)}
                </span>
                <span className="font-bold text-sm sm:text-base">{opt.meaning}</span>
              </div>

              {isAnswered && opt.id === currentCard.id && (
                <CheckCircle2 size={20} className="text-emerald-500 shrink-0" />
              )}
              {isAnswered && opt.id === selectedOption && opt.id !== currentCard.id && (
                <XCircle size={20} className="text-red-500 shrink-0" />
              )}
            </button>
          );
        })}
      </div>

      {/* Answer Explanation & Next Button */}
      {isAnswered && (
        <div className="p-5 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-md space-y-3 animate-fade-in">
          {/* Explanation Header with Illustration */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-2xl font-black font-chinese text-stone-900 dark:text-white">
                {currentCard.hanzi}
              </span>
              <span className="text-sm font-bold text-red-600 dark:text-red-400">
                [{currentCard.pinyin}]
              </span>
              {currentCard.sinoVietnamese && (
                <span className="text-xs text-stone-400">({currentCard.sinoVietnamese})</span>
              )}
            </div>

            {illustration?.imageUrl && (
              <img
                src={illustration.imageUrl}
                alt={currentCard.meaning}
                className="w-12 h-12 rounded-xl object-cover border border-stone-200 dark:border-stone-700 shadow-xs shrink-0"
              />
            )}
          </div>

          <div className="text-sm font-bold text-stone-800 dark:text-stone-200">
            Nghĩa đúng: <span className="text-emerald-600 dark:text-emerald-400 font-black">{currentCard.meaning}</span>
          </div>

          {currentCard.exampleHanzi && (
            <div className="p-3.5 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-900 text-xs space-y-1">
              <span className="font-bold text-amber-800 dark:text-amber-300 flex items-center gap-1">
                <BookOpen size={13} />
                <span>Ví dụ thực tế:</span>
              </span>
              <div className="font-chinese font-bold text-sm text-stone-800 dark:text-stone-200">
                {currentCard.exampleHanzi}
              </div>
              <div className="text-stone-500 dark:text-stone-400">
                {currentCard.examplePinyin} — "{currentCard.exampleMeaning}"
              </div>
            </div>
          )}

          <div className="flex items-center justify-between pt-1">
            <span className="text-xs font-bold text-stone-500">
              {selectedOption === currentCard.id ? '🎉 Trả lời chính xác!' : '💡 Hãy ghi nhớ từ vựng này nhé!'}
            </span>

            {isQuizFinished ? (
              <button
                onClick={initQuiz}
                className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-red-600 to-amber-600 text-white font-bold text-xs shadow-md flex items-center gap-1.5 cursor-pointer"
              >
                <RotateCcw size={14} />
                <span>Làm lại bộ đề mới</span>
              </button>
            ) : (
              <button
                onClick={handleNext}
                className="px-5 py-2.5 rounded-2xl bg-stone-900 hover:bg-stone-800 dark:bg-white dark:hover:bg-stone-100 text-white dark:text-stone-900 font-bold text-xs shadow-md flex items-center gap-1.5 cursor-pointer"
              >
                <span>Câu tiếp theo</span>
                <ArrowRight size={14} />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
