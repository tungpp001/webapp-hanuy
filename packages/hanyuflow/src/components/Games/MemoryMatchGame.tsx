import type React from 'react';
import { useState, useEffect } from 'react';
import { 
  RotateCcw, 
  ArrowLeft, 
  Clock, 
  Flame
} from 'lucide-react';
import { GAME_VOCAB_POOL } from '../../data/gameData';
import type { MemoryCard } from '../../types/game';
import { speakChinese, playSoundEffect } from '../../utils/speech';
import { addXP } from '../../utils/storage';
import confetti from 'canvas-confetti';

interface MemoryMatchGameProps {
  onBack: () => void;
}

export const MemoryMatchGame: React.FC<MemoryMatchGameProps> = ({ onBack }) => {
  const [cards, setCards] = useState<MemoryCard[]>([]);
  const [flippedIndices, setFlippedIndices] = useState<number[]>([]);
  const [matchedCount, setMatchedCount] = useState(0);
  const [moves, setMoves] = useState(0);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [score, setScore] = useState(0);
  const [isGameOver, setIsGameOver] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [isGameStarted, setIsGameStarted] = useState(false);

  // Initialize a new deck with 6 random vocabulary pairs (12 cards)
  const initGame = () => {
    playSoundEffect('click');
    const shuffledPool = [...GAME_VOCAB_POOL].sort(() => 0.5 - Math.random());
    const selectedVocabs = shuffledPool.slice(0, 6);

    const generatedCards: MemoryCard[] = [];

    selectedVocabs.forEach((v) => {
      // Hanzi card
      generatedCards.push({
        id: `h-${v.id}`,
        vocabId: v.id,
        content: v.hanzi,
        subContent: v.pinyin,
        type: 'hanzi',
        isFlipped: false,
        isMatched: false,
      });

      // Meaning card
      generatedCards.push({
        id: `m-${v.id}`,
        vocabId: v.id,
        content: v.meaning,
        subContent: v.sinoVietnamese ? `Hán-Việt: ${v.sinoVietnamese}` : undefined,
        type: 'meaning',
        isFlipped: false,
        isMatched: false,
      });
    });

    // Shuffle cards
    setCards(generatedCards.sort(() => 0.5 - Math.random()));
    setFlippedIndices([]);
    setMatchedCount(0);
    setMoves(0);
    setCombo(0);
    setMaxCombo(0);
    setScore(0);
    setIsGameOver(false);
    setSeconds(0);
    setIsGameStarted(true);
  };

  useEffect(() => {
    initGame();
  }, []);

  // Timer
  useEffect(() => {
    if (!isGameStarted || isGameOver) return;
    const interval = setInterval(() => {
      setSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isGameStarted, isGameOver]);

  const handleCardClick = (index: number) => {
    if (flippedIndices.length >= 2 || cards[index].isFlipped || cards[index].isMatched) {
      return;
    }

    playSoundEffect('click');

    // Flip the card
    const newCards = [...cards];
    newCards[index].isFlipped = true;
    setCards(newCards);

    const newFlipped = [...flippedIndices, index];
    setFlippedIndices(newFlipped);

    // If this is a Hanzi card, pronounce it
    if (newCards[index].type === 'hanzi') {
      speakChinese(newCards[index].content, 1.0);
    }

    // When 2 cards are flipped, check for match
    if (newFlipped.length === 2) {
      setMoves((prev) => prev + 1);
      const [firstIdx, secondIdx] = newFlipped;
      const firstCard = newCards[firstIdx];
      const secondCard = newCards[secondIdx];

      if (firstCard.vocabId === secondCard.vocabId && firstCard.type !== secondCard.type) {
        // MATCH!
        playSoundEffect('correct');
        const updatedCards = [...newCards];
        updatedCards[firstIdx].isMatched = true;
        updatedCards[secondIdx].isMatched = true;
        setCards(updatedCards);
        setFlippedIndices([]);

        const newCombo = combo + 1;
        setCombo(newCombo);
        setMaxCombo((prev) => Math.max(prev, newCombo));

        const earnedPoints = 100 + newCombo * 25;
        setScore((prev) => prev + earnedPoints);

        const newMatched = matchedCount + 1;
        setMatchedCount(newMatched);

        // Check victory (6 pairs matched)
        if (newMatched >= 6) {
          setIsGameOver(true);
          playSoundEffect('streak');
          addXP(50);
          try {
            confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
          } catch (e) {
            console.warn(e);
          }
        }
      } else {
        // MISMATCH
        playSoundEffect('incorrect');
        setCombo(0);
        setTimeout(() => {
          const resetCards = [...cards];
          resetCards[firstIdx].isFlipped = false;
          resetCards[secondIdx].isFlipped = false;
          setCards(resetCards);
          setFlippedIndices([]);
        }, 900);
      }
    }
  };

  const formatTime = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in pb-20">
      {/* Top Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2.5 rounded-2xl border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
            title="Quay lại Đấu Trường Game"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-lg sm:text-xl font-black text-stone-900 dark:text-white">
              🎴 Trúc Xanh Ghép Cặp Hán Tự (Memory Match)
            </h1>
            <p className="text-xs text-stone-400">
              Lật các cặp thẻ bài để ghép Chữ Hán với Nghĩa tiếng Việt tương ứng
            </p>
          </div>
        </div>

        <button
          onClick={initGame}
          className="px-4 py-2 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 text-xs font-bold text-stone-700 dark:text-stone-300 flex items-center gap-1.5 transition-all active:scale-95"
        >
          <RotateCcw size={14} />
          <span>Ván Mới</span>
        </button>
      </div>

      {/* Game Dashboard Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-center shadow-xs">
          <span className="text-[11px] font-bold uppercase text-stone-400 block mb-0.5">
            Điểm Số
          </span>
          <span className="text-xl sm:text-2xl font-black text-red-600 dark:text-red-400">
            {score}
          </span>
        </div>

        <div className="p-3.5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-center shadow-xs">
          <span className="text-[11px] font-bold uppercase text-stone-400 block mb-0.5">
            Đã Ghép
          </span>
          <span className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400">
            {matchedCount} / 6 Cặp
          </span>
        </div>

        <div className="p-3.5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-center shadow-xs">
          <span className="text-[11px] font-bold uppercase text-stone-400 flex items-center justify-center gap-1 mb-0.5">
            <Flame size={13} className="text-amber-500 fill-amber-500" />
            Combo
          </span>
          <span className="text-xl sm:text-2xl font-black text-amber-500">
            x{combo}
          </span>
        </div>

        <div className="p-3.5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-center shadow-xs">
          <span className="text-[11px] font-bold uppercase text-stone-400 flex items-center justify-center gap-1 mb-0.5">
            <Clock size={13} />
            Thời Gian
          </span>
          <span className="text-xl sm:text-2xl font-mono font-black text-stone-800 dark:text-stone-200">
            {formatTime(seconds)}
          </span>
        </div>
      </div>

      {/* Cards Grid 3x4 / 4x3 */}
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 sm:gap-4 perspective-1000 select-none">
        {cards.map((card, index) => (
          <div
            key={card.id}
            onClick={() => handleCardClick(index)}
            className={`h-28 sm:h-36 rounded-3xl transition-all duration-300 transform-style-3d cursor-pointer relative ${
              card.isMatched
                ? 'opacity-40 scale-95 pointer-events-none'
                : 'hover:scale-102 active:scale-95'
            } ${card.isFlipped ? 'rotate-y-180' : ''}`}
          >
            {/* FRONT (HIDDEN STATE) */}
            <div className="absolute inset-0 backface-hidden rounded-3xl bg-gradient-to-tr from-red-700 via-rose-700 to-amber-600 text-white shadow-md border-2 border-red-500/30 flex flex-col items-center justify-center p-3 text-center">
              <span className="font-calligraphy text-3xl sm:text-4xl text-amber-200 opacity-80">
                学
              </span>
              <span className="text-[10px] font-bold tracking-widest uppercase opacity-70 mt-1">
                LẬT THẺ
              </span>
            </div>

            {/* BACK (REVEALED STATE) */}
            <div className="absolute inset-0 backface-hidden rotate-y-180 rounded-3xl bg-white dark:bg-stone-900 border-2 border-red-500 dark:border-red-600 text-stone-900 dark:text-white shadow-lg flex flex-col items-center justify-center p-3 text-center">
              {card.type === 'hanzi' ? (
                <>
                  <span className="text-2xl sm:text-3xl font-black font-chinese text-red-600 dark:text-red-400">
                    {card.content}
                  </span>
                  {card.subContent && (
                    <span className="text-xs font-semibold text-stone-500 dark:text-stone-400 mt-1">
                      {card.subContent}
                    </span>
                  )}
                </>
              ) : (
                <>
                  <span className="text-sm sm:text-base font-bold text-stone-900 dark:text-white">
                    {card.content}
                  </span>
                  {card.subContent && (
                    <span className="text-[10px] text-amber-700 dark:text-amber-400 font-semibold mt-1">
                      {card.subContent}
                    </span>
                  )}
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* VICTORY MODAL */}
      {isGameOver && (
        <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-emerald-800 to-teal-700 text-white shadow-xl text-center space-y-4 animate-pop">
          <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center mx-auto text-3xl">
            🏆
          </div>

          <h3 className="text-2xl sm:text-3xl font-black">
            Hoàn Thành Xuất Sắc! (+50 XP)
          </h3>

          <p className="text-xs sm:text-sm text-stone-100 max-w-md mx-auto">
            Bạn đã ghép đúng toàn bộ các cặp từ vựng trong <span className="font-bold text-amber-300">{formatTime(seconds)}</span> với <span className="font-bold text-amber-300">{moves}</span> lượt lật thẻ và chuỗi combo cao nhất x{maxCombo}!
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
              className="px-6 py-2.5 rounded-2xl bg-white text-emerald-900 font-black text-xs shadow-lg hover:scale-105 transition-all"
            >
              Chơi Lại Ván Mới
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
