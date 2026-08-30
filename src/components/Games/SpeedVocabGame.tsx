import type React from 'react';
import { useState, useEffect, useRef } from 'react';
import { 
  ArrowLeft, 
  Heart, 
  Flame, 
  Zap
} from 'lucide-react';
import { GAME_VOCAB_POOL } from '../../data/gameData';
import type { GameVocabItem } from '../../types/game';
import { speakChinese, playSoundEffect } from '../../utils/speech';
import { addXP } from '../../utils/storage';

interface SpeedVocabGameProps {
  onBack: () => void;
}

interface ActiveBubble {
  id: number;
  vocab: GameVocabItem;
  xPercent: number; // 10% to 80%
  yPercent: number; // 0% to 100%
  speed: number;
}

export const SpeedVocabGame: React.FC<SpeedVocabGameProps> = ({ onBack }) => {
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [isGameOver, setIsGameOver] = useState(false);
  const [activeBubbles, setActiveBubbles] = useState<ActiveBubble[]>([]);
  const [targetVocab, setTargetVocab] = useState<GameVocabItem>(GAME_VOCAB_POOL[0]);

  const nextBubbleIdRef = useRef(1);
  const gameLoopRef = useRef<number | null>(null);
  const targetVocabRef = useRef<GameVocabItem>(GAME_VOCAB_POOL[0]);
  const livesRef = useRef(3);
  const isGameOverRef = useRef(false);

  // Sync refs
  useEffect(() => {
    targetVocabRef.current = targetVocab;
  }, [targetVocab]);

  useEffect(() => {
    livesRef.current = lives;
  }, [lives]);

  useEffect(() => {
    isGameOverRef.current = isGameOver;
  }, [isGameOver]);

  const initGame = () => {
    playSoundEffect('click');
    setScore(0);
    setLives(3);
    livesRef.current = 3;
    setCombo(0);
    setMaxCombo(0);
    setIsGameOver(false);
    isGameOverRef.current = false;
    setActiveBubbles([]);
    nextBubbleIdRef.current = 1;

    // Pick first target
    const randomTarget = GAME_VOCAB_POOL[Math.floor(Math.random() * GAME_VOCAB_POOL.length)];
    setTargetVocab(randomTarget);
    targetVocabRef.current = randomTarget;

    // Spawn first batch of bubbles
    spawnBubble(randomTarget);
  };

  const spawnBubble = (specificVocab?: GameVocabItem) => {
    const vocab = specificVocab || GAME_VOCAB_POOL[Math.floor(Math.random() * GAME_VOCAB_POOL.length)];
    const newBubble: ActiveBubble = {
      id: nextBubbleIdRef.current++,
      vocab,
      xPercent: 10 + Math.random() * 75,
      yPercent: -10,
      speed: 0.35 + Math.random() * 0.25,
    };

    setActiveBubbles((prev) => [...prev, newBubble]);
  };

  // Main animation frame loop
  useEffect(() => {
    initGame();

    let lastSpawnTime = Date.now();

    const loop = () => {
      if (isGameOverRef.current) return;

      const now = Date.now();
      // Spawn new bubble every 1.6s
      if (now - lastSpawnTime > 1600) {
        // 40% chance to spawn the actual target word
        const shouldSpawnTarget = Math.random() < 0.45;
        spawnBubble(shouldSpawnTarget ? targetVocabRef.current : undefined);
        lastSpawnTime = now;
      }

      // Move existing bubbles downwards
      setActiveBubbles((prev) => {
        const nextList: ActiveBubble[] = [];

        prev.forEach((b) => {
          const nextY = b.yPercent + b.speed;

          // Check if bubble reached bottom (100%)
          if (nextY >= 100) {
            // If the missed bubble was the target, lose a life
            if (b.vocab.id === targetVocabRef.current.id) {
              playSoundEffect('incorrect');
              const newLives = livesRef.current - 1;
              setLives(newLives);
              livesRef.current = newLives;
              setCombo(0);

              if (newLives <= 0) {
                setIsGameOver(true);
                isGameOverRef.current = true;
                playSoundEffect('incorrect');
              }
            }
          } else {
            nextList.push({ ...b, yPercent: nextY });
          }
        });

        return nextList;
      });

      gameLoopRef.current = requestAnimationFrame(loop);
    };

    gameLoopRef.current = requestAnimationFrame(loop);

    return () => {
      if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
    };
  }, []);

  const handleBubbleClick = (bubble: ActiveBubble) => {
    if (isGameOver) return;

    if (bubble.vocab.id === targetVocab.id) {
      // CORRECT HIT!
      playSoundEffect('correct');
      speakChinese(bubble.vocab.hanzi, 1.0);

      // Remove hit bubble
      setActiveBubbles((prev) => prev.filter((b) => b.id !== bubble.id));

      const newCombo = combo + 1;
      setCombo(newCombo);
      setMaxCombo((prev) => Math.max(prev, newCombo));

      const earned = 50 + newCombo * 15;
      setScore((prev) => prev + earned);
      addXP(10);

      // Pick next target
      const remainingPool = GAME_VOCAB_POOL.filter((v) => v.id !== targetVocab.id);
      const nextTarget = remainingPool[Math.floor(Math.random() * remainingPool.length)];
      setTargetVocab(nextTarget);
      targetVocabRef.current = nextTarget;
    } else {
      // WRONG BUBBLE HIT
      playSoundEffect('incorrect');
      const newLives = lives - 1;
      setLives(newLives);
      livesRef.current = newLives;
      setCombo(0);

      if (newLives <= 0) {
        setIsGameOver(true);
        isGameOverRef.current = true;
      }
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-4 animate-fade-in pb-20 select-none">
      {/* Top Bar */}
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
              🚀 Bắn Từ Phản Xạ Nhanh (Speed Vocab Rush)
            </h1>
            <p className="text-xs text-stone-400">
              Nhấp vào bong bóng chữ Hán rơi xuống tương ứng với nghĩa tiếng Việt
            </p>
          </div>
        </div>

        {/* Lives & Score */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            {[1, 2, 3].map((i) => (
              <Heart
                key={i}
                size={20}
                className={`transition-all ${
                  i <= lives
                    ? 'text-red-500 fill-red-500 animate-pulse'
                    : 'text-stone-300 dark:text-stone-700'
                }`}
              />
            ))}
          </div>

          <span className="px-3.5 py-1.5 rounded-xl bg-red-600 text-white font-black text-sm shadow-sm">
            {score} Điểm
          </span>
        </div>
      </div>

      {/* Target Word Prompt Box (Mission Board) */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 text-white shadow-lg flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="p-2.5 rounded-xl bg-white/20 backdrop-blur-md">
            <Zap size={20} className="text-amber-200" />
          </span>
          <div>
            <span className="text-[11px] uppercase tracking-wider text-stone-100 font-bold block">
              Mục Tiêu Cần Bắn:
            </span>
            <div className="text-xl sm:text-2xl font-black">
              "{targetVocab.meaning}"
            </div>
            {targetVocab.sinoVietnamese && (
              <div className="text-xs text-amber-200">
                (Hán-Việt: {targetVocab.sinoVietnamese} • Pinyin: {targetVocab.pinyin})
              </div>
            )}
          </div>
        </div>

        {combo > 1 && (
          <div className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white/20 backdrop-blur-md font-black text-sm text-amber-200 animate-bounce">
            <Flame size={16} className="fill-amber-200" />
            <span>Combo x{combo}</span>
          </div>
        )}
      </div>

      {/* Falling Game Arena (Screen) */}
      <div className="relative w-full h-[450px] sm:h-[500px] rounded-3xl bg-stone-900 border-2 border-stone-800 shadow-2xl overflow-hidden">
        {/* Danger Line at bottom */}
        <div className="absolute bottom-2 inset-x-0 h-1 bg-red-500/50 border-t border-dashed border-red-400 pointer-events-none"></div>

        {/* Ambient Grid Background */}
        <div className="absolute inset-0 opacity-10 font-calligraphy text-9xl text-stone-700 flex items-center justify-around pointer-events-none">
          <span>速</span>
          <span>语</span>
        </div>

        {/* Active Falling Bubbles */}
        {activeBubbles.map((bubble) => (
          <button
            key={bubble.id}
            onClick={() => handleBubbleClick(bubble)}
            style={{
              left: `${bubble.xPercent}%`,
              top: `${bubble.yPercent}%`,
            }}
            className="absolute -translate-x-1/2 px-4 py-2.5 rounded-2xl bg-gradient-to-tr from-stone-800 to-stone-700 hover:from-red-600 hover:to-amber-600 text-white font-chinese font-black text-xl sm:text-2xl shadow-xl border border-stone-600 hover:border-red-400 hover:scale-110 active:scale-90 transition-transform cursor-pointer flex flex-col items-center justify-center animate-pop"
          >
            <span>{bubble.vocab.hanzi}</span>
          </button>
        ))}

        {/* GAME OVER OVERLAY */}
        {isGameOver && (
          <div className="absolute inset-0 z-30 bg-black/85 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center text-white space-y-4 animate-fade-in">
            <div className="w-16 h-16 rounded-full bg-red-600/30 border border-red-500 text-red-400 flex items-center justify-center text-3xl">
              💥
            </div>
            <h3 className="text-2xl sm:text-3xl font-black">
              Trò Chơi Kết Thúc!
            </h3>
            <p className="text-xs sm:text-sm text-stone-300 max-w-sm">
              Bạn đã đạt <span className="font-bold text-amber-400">{score} điểm</span> với chuỗi phản xạ cao nhất x{maxCombo}!
            </p>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={onBack}
                className="px-5 py-2.5 rounded-2xl bg-white/20 hover:bg-white/30 text-xs font-bold transition-all"
              >
                Chọn Game Khác
              </button>
              <button
                onClick={initGame}
                className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-red-600 to-amber-600 text-white font-black text-xs shadow-lg hover:scale-105 transition-all"
              >
                Chơi Lại Ngay
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
