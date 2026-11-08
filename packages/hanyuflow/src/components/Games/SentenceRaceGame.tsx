import type React from 'react';
import { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Timer
} from 'lucide-react';
import { GAME_SENTENCE_POOL } from '../../data/gameData';
import type { GameSentenceQuiz } from '../../data/gameData';
import { speakChinese, playSoundEffect } from '../../utils/speech';
import { addXP } from '../../utils/storage';
import confetti from 'canvas-confetti';

interface SentenceRaceGameProps {
  onBack: () => void;
}

export const SentenceRaceGame: React.FC<SentenceRaceGameProps> = ({ onBack }) => {
  const [timeLeft, setTimeLeft] = useState(60);
  const [isGameOver, setIsGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [sentencesCompleted, setSentencesCompleted] = useState(0);

  const [currentQuizIndex, setCurrentQuizIndex] = useState(0);
  const [selectedWordIds, setSelectedWordIds] = useState<string[]>([]);
  const [shuffledQuestions, setShuffledQuestions] = useState<GameSentenceQuiz[]>([]);

  const currentQuiz = shuffledQuestions[currentQuizIndex] || GAME_SENTENCE_POOL[0];

  const initGame = () => {
    playSoundEffect('click');
    const shuffled = [...GAME_SENTENCE_POOL].sort(() => 0.5 - Math.random());
    setShuffledQuestions(shuffled);
    setCurrentQuizIndex(0);
    setSelectedWordIds([]);
    setTimeLeft(60);
    setIsGameOver(false);
    setScore(0);
    setCombo(0);
    setMaxCombo(0);
    setSentencesCompleted(0);
  };

  useEffect(() => {
    initGame();
  }, []);

  // 60s countdown timer
  useEffect(() => {
    if (isGameOver || timeLeft <= 0) return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          handleGameOver();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isGameOver, timeLeft]);

  const handleGameOver = () => {
    setIsGameOver(true);
    playSoundEffect('streak');
    addXP(60);
    try {
      confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
    } catch (e) {
      console.warn(e);
    }
  };

  const handlePickWord = (wordId: string) => {
    playSoundEffect('click');
    const newSelected = [...selectedWordIds, wordId];
    setSelectedWordIds(newSelected);

    // Check if user selected all words for this sentence
    if (newSelected.length === currentQuiz.words.length) {
      const isCorrect = newSelected.every((id, idx) => id === currentQuiz.correctOrder[idx]);

      if (isCorrect) {
        // CORRECT!
        playSoundEffect('correct');
        speakChinese(currentQuiz.hanziFull, 1.0);

        const newCombo = combo + 1;
        setCombo(newCombo);
        setMaxCombo((prev) => Math.max(prev, newCombo));

        const earned = 100 + newCombo * 30;
        setScore((prev) => prev + earned);
        setSentencesCompleted((prev) => prev + 1);

        // Next question
        setTimeout(() => {
          setSelectedWordIds([]);
          if (currentQuizIndex < shuffledQuestions.length - 1) {
            setCurrentQuizIndex((prev) => prev + 1);
          } else {
            // Loop questions if reached end
            setCurrentQuizIndex(0);
          }
        }, 500);
      } else {
        // WRONG ORDER
        playSoundEffect('incorrect');
        setCombo(0);
        setTimeout(() => {
          setSelectedWordIds([]);
        }, 600);
      }
    }
  };

  const handleRemoveWord = (wordId: string) => {
    playSoundEffect('click');
    setSelectedWordIds((prev) => prev.filter((id) => id !== wordId));
  };

  // Remaining available words
  const availableWords = (currentQuiz.words || []).filter(
    (w) => !selectedWordIds.includes(w.id)
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in pb-20 select-none">
      {/* Top Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2.5 rounded-2xl border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 hover:bg-stone-100 transition-colors"
            title="Quay lại Đấu Trường Game"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-lg sm:text-xl font-black text-stone-900 dark:text-white">
              🧩 Đua Tốc Độ Ghép Câu 60s (Sentence Race)
            </h1>
            <p className="text-xs text-stone-400">
              Ghép càng nhiều câu tiếng Trung chuẩn xác càng tốt trước khi hết giờ
            </p>
          </div>
        </div>

        {/* Timer & Score */}
        <div className="flex items-center gap-2.5">
          <div className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-2xl border font-mono font-black text-base shadow-xs ${
            timeLeft < 15
              ? 'bg-red-50 dark:bg-red-950/60 border-red-300 text-red-600 animate-pulse'
              : 'bg-stone-100 dark:bg-stone-800 border-stone-200 dark:border-stone-700 text-stone-800 dark:text-stone-200'
          }`}>
            <Timer size={18} className={timeLeft < 15 ? 'text-red-500' : 'text-stone-500'} />
            <span>{timeLeft}s</span>
          </div>

          <span className="px-4 py-2 rounded-2xl bg-gradient-to-r from-red-600 to-amber-600 text-white font-black text-sm shadow-md">
            {score} Điểm
          </span>
        </div>
      </div>

      {/* Main Game Card */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-md space-y-6">
        {/* Target Meaning */}
        <div className="p-5 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900 text-center space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
            Nghĩa câu tiếng Việt:
          </span>
          <h3 className="text-xl sm:text-2xl font-black text-stone-900 dark:text-white">
            "{currentQuiz.vietnameseMeaning}"
          </h3>
        </div>

        {/* Selected Words Dropzone */}
        <div className="min-h-[100px] p-4 rounded-2xl bg-stone-50 dark:bg-stone-800/50 border-2 border-dashed border-stone-200 dark:border-stone-700 flex flex-wrap items-center justify-center gap-2.5">
          {selectedWordIds.length === 0 ? (
            <span className="text-xs text-stone-400 m-auto">
              Nhấp vào các khối từ bên dưới để ghép vào đây...
            </span>
          ) : (
            selectedWordIds.map((id) => {
              const word = currentQuiz.words.find((w) => w.id === id);
              if (!word) return null;
              return (
                <button
                  key={id}
                  onClick={() => handleRemoveWord(id)}
                  className="px-4 py-2.5 rounded-2xl bg-white dark:bg-stone-900 border-2 border-red-500 text-red-600 dark:text-red-400 font-chinese font-black text-lg sm:text-xl shadow-md hover:scale-105 transition-transform"
                >
                  <span className="text-[10px] text-stone-400 block font-sans">{word.pinyin}</span>
                  <span>{word.hanzi}</span>
                </button>
              );
            })
          )}
        </div>

        {/* Word Options Bank */}
        <div className="flex flex-wrap items-center justify-center gap-2.5 pt-2">
          {availableWords.map((word) => (
            <button
              key={word.id}
              onClick={() => handlePickWord(word.id)}
              className="px-5 py-3 rounded-2xl bg-stone-100 dark:bg-stone-800 hover:bg-red-50 dark:hover:bg-red-950/40 border border-stone-200 dark:border-stone-700 hover:border-red-300 text-stone-800 dark:text-stone-200 font-chinese font-bold text-lg sm:text-xl shadow-sm hover:scale-105 active:scale-95 transition-all cursor-pointer"
            >
              <span className="text-[10px] text-stone-400 block font-sans">{word.pinyin}</span>
              <span>{word.hanzi}</span>
            </button>
          ))}
        </div>
      </div>

      {/* GAME OVER MODAL */}
      {isGameOver && (
        <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-red-800 via-rose-700 to-amber-700 text-white shadow-xl text-center space-y-4 animate-pop">
          <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center mx-auto text-3xl">
            🏆
          </div>

          <h3 className="text-2xl sm:text-3xl font-black">
            Hết Giờ! Đạt {score} Điểm (+60 XP)
          </h3>

          <p className="text-xs sm:text-sm text-stone-100 max-w-md mx-auto">
            Bạn đã xuất sắc hoàn thành <span className="font-bold text-amber-300">{sentencesCompleted} câu ghép</span> với chuỗi Combo cao nhất x{maxCombo}!
          </p>

          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              onClick={onBack}
              className="px-5 py-2.5 rounded-2xl bg-white/20 hover:bg-white/30 text-xs font-bold transition-all"
            >
              Chọn Trò Chơi Khác
            </button>
            <button
              onClick={initGame}
              className="px-6 py-2.5 rounded-2xl bg-white text-red-900 font-black text-xs shadow-lg hover:scale-105 transition-all"
            >
              Đua Lại Ván Mới
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
