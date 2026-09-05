import type React from 'react';
import { useState, useEffect, useRef, useCallback } from 'react';
import { 
  ArrowLeft, 
  RotateCcw, 
  Heart, 
  Flame, 
  Trophy, 
  Crosshair, 
  Keyboard, 
  ShieldAlert,
  Zap,
  Play,
  Pause
} from 'lucide-react';
import { GAME_VOCAB_POOL } from '../../data/gameData';
import type { GameVocabItem, FallingTypingWord, LaserBullet, ExplosionParticle } from '../../types/game';
import { soundSynth, normalizePinyin } from '../../utils/audioSynth';
import { speakChinese, playSoundEffect } from '../../utils/speech';
import { addXP } from '../../utils/storage';
import confetti from 'canvas-confetti';

interface GunTypingGameProps {
  onBack: () => void;
}

interface FloatingScore {
  id: string;
  x: number;
  y: number;
  text: string;
  color: string;
}

export const GunTypingGame: React.FC<GunTypingGameProps> = ({ onBack }) => {
  // Game states
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [wordsDestroyed, setWordsDestroyed] = useState(0);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [level, setLevel] = useState<'all' | 'HSK 1' | 'HSK 2' | 'HSK 3' | 'HSK 4'>('all');

  // Interactive entities
  const [fallingWords, setFallingWords] = useState<FallingTypingWord[]>([]);
  const [bullets, setBullets] = useState<LaserBullet[]>([]);
  const [particles, setParticles] = useState<ExplosionParticle[]>([]);
  const [floatingScores, setFloatingScores] = useState<FloatingScore[]>([]);

  // Gun turret state
  const [gunAngle, setGunAngle] = useState(0);
  const [isRecoil, setIsRecoil] = useState(false);
  const [muzzleFlash, setMuzzleFlash] = useState(false);

  // Hidden input for mobile keyboard focus
  const hiddenInputRef = useRef<HTMLInputElement>(null);
  const arenaRef = useRef<HTMLDivElement>(null);
  const nextIdRef = useRef(1);

  // Game loop refs for fresh state access in requestAnimationFrame
  const fallingWordsRef = useRef<FallingTypingWord[]>([]);
  const livesRef = useRef(3);
  const isGameOverRef = useRef(false);
  const isPausedRef = useRef(false);
  const comboRef = useRef(0);
  const levelRef = useRef(level);

  // Synchronize refs
  useEffect(() => {
    fallingWordsRef.current = fallingWords;
  }, [fallingWords]);

  useEffect(() => {
    livesRef.current = lives;
  }, [lives]);

  useEffect(() => {
    isGameOverRef.current = isGameOver;
  }, [isGameOver]);

  useEffect(() => {
    isPausedRef.current = isPaused;
  }, [isPaused]);

  useEffect(() => {
    comboRef.current = combo;
  }, [combo]);

  useEffect(() => {
    levelRef.current = level;
  }, [level]);

  // Filter pool by chosen level
  const getVocabPool = useCallback(() => {
    if (levelRef.current === 'all') return GAME_VOCAB_POOL;
    return GAME_VOCAB_POOL.filter((v) => v.hskLevel === levelRef.current);
  }, []);

  // Spawn a falling word
  const spawnWord = useCallback(() => {
    if (isGameOverRef.current || isPausedRef.current) return;

    const pool = getVocabPool();
    const vocab: GameVocabItem = pool[Math.floor(Math.random() * pool.length)];
    const rawPinyin = normalizePinyin(vocab.pinyin);

    if (!rawPinyin) return;

    const newWord: FallingTypingWord = {
      id: `word-${nextIdRef.current++}`,
      vocab,
      rawPinyin,
      typedLength: 0,
      xPercent: 12 + Math.random() * 70, // Keep in center 12% - 82%
      yPercent: -8,
      speed: 0.18 + Math.random() * 0.12, // Controlled smooth descent
      isTargeted: false,
    };

    setFallingWords((prev) => [...prev, newWord]);
  }, [getVocabPool]);

  // Initialize new game session
  const initGame = useCallback(() => {
    playSoundEffect('click');
    setScore(0);
    setLives(3);
    livesRef.current = 3;
    setCombo(0);
    comboRef.current = 0;
    setMaxCombo(0);
    setWordsDestroyed(0);
    setIsGameOver(false);
    isGameOverRef.current = false;
    setIsPaused(false);
    isPausedRef.current = false;
    setFallingWords([]);
    setBullets([]);
    setParticles([]);
    setFloatingScores([]);
    setGunAngle(0);
    nextIdRef.current = 1;

    // Focus input for typing
    setTimeout(() => {
      hiddenInputRef.current?.focus();
    }, 100);
  }, []);

  useEffect(() => {
    initGame();
  }, [initGame]);

  // Aim gun at a given target coordinate (xPercent, yPercent)
  const aimGunAt = (targetX: number, targetY: number) => {
    const gunX = 50; // Gun is at 50% horizontal center
    const gunY = 92; // Gun is near bottom 92%
    const dx = targetX - gunX;
    const dy = targetY - gunY;
    // Calculate angle in degrees
    const rad = Math.atan2(dy, dx);
    const deg = rad * (180 / Math.PI) + 90; // Offset 90deg so 0deg is pointing straight up
    setGunAngle(deg);
  };

  // Fire laser shot towards a target
  const fireLaser = (target: FallingTypingWord) => {
    soundSynth.playLaser();
    aimGunAt(target.xPercent, target.yPercent);

    // Gun recoil & muzzle flash animation
    setIsRecoil(true);
    setMuzzleFlash(true);
    setTimeout(() => setIsRecoil(false), 80);
    setTimeout(() => setMuzzleFlash(false), 100);

    // Create bullet projectile
    const bullet: LaserBullet = {
      id: `bullet-${nextIdRef.current++}`,
      startX: 50,
      startY: 92,
      targetX: target.xPercent,
      targetY: target.yPercent,
      progress: 0,
      color: '#ef4444',
    };

    setBullets((prev) => [...prev, bullet]);
  };

  // Trigger explosion effects upon word completion
  const triggerExplosion = (x: number, y: number, word: FallingTypingWord) => {
    soundSynth.playExplosion();

    // Native Chinese voice pronunciation
    speakChinese(word.vocab.hanzi, 1.0);

    // Generate burst particles
    const newParticles: ExplosionParticle[] = [];
    const colors = ['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#ec4899', '#ffffff'];

    for (let i = 0; i < 20; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 5;
      newParticles.push({
        id: `p-${nextIdRef.current++}`,
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 3 + Math.random() * 6,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: 1,
      });
    }

    setParticles((prev) => [...prev, ...newParticles]);

    // Add floating score toast
    const newCombo = comboRef.current + 1;
    const earnedPts = 100 + newCombo * 20;

    const floating: FloatingScore = {
      id: `fs-${nextIdRef.current++}`,
      x,
      y,
      text: newCombo > 1 ? `+${earnedPts} (Combo x${newCombo}!)` : `+${earnedPts}`,
      color: newCombo > 1 ? '#f59e0b' : '#10b981',
    };

    setFloatingScores((prev) => [...prev, floating]);

    // Update stats
    setCombo(newCombo);
    comboRef.current = newCombo;
    setMaxCombo((prev) => Math.max(prev, newCombo));
    setScore((prev) => prev + earnedPts);
    setWordsDestroyed((prev) => prev + 1);
    addXP(15);
  };

  // Process typed key
  const handleKeyInput = (char: string) => {
    if (isGameOver || isPaused) return;
    const lower = char.toLowerCase();
    if (!/^[a-z0-9]$/.test(lower)) return;

    const currentWords = [...fallingWordsRef.current];
    if (currentWords.length === 0) return;

    // 1. Check if there is already an actively targeted word
    const activeTargetIndex = currentWords.findIndex((w) => w.isTargeted);

    if (activeTargetIndex !== -1) {
      const target = currentWords[activeTargetIndex];
      const nextChar = target.rawPinyin[target.typedLength];

      if (lower === nextChar) {
        // MATCH NEXT LETTER!
        soundSynth.playHit();
        fireLaser(target);

        const newTypedLength = target.typedLength + 1;

        if (newTypedLength >= target.rawPinyin.length) {
          // WORD FULLY COMPLETED! DETONATE!
          triggerExplosion(target.xPercent, target.yPercent, target);
          // Remove word from screen
          setFallingWords((prev) => prev.filter((w) => w.id !== target.id));
        } else {
          // Update typed progress
          setFallingWords((prev) =>
            prev.map((w) =>
              w.id === target.id ? { ...w, typedLength: newTypedLength } : w
            )
          );
        }
      } else {
        // MISTYPED LETTER
        playSoundEffect('incorrect');
        setCombo(0);
        comboRef.current = 0;
      }
      return;
    }

    // 2. No word targeted yet: find closest word starting with this letter
    const matchingIndices = currentWords
      .map((w, idx) => ({ word: w, idx }))
      .filter(({ word }) => word.rawPinyin[0] === lower);

    if (matchingIndices.length > 0) {
      // Pick the lowest word (highest yPercent, closest to danger zone)
      matchingIndices.sort((a, b) => b.word.yPercent - a.word.yPercent);
      const chosen = matchingIndices[0];
      const target = chosen.word;

      fireLaser(target);
      soundSynth.playHit();

      const newTypedLength = 1;

      if (newTypedLength >= target.rawPinyin.length) {
        // 1-letter word (rare, but handled)
        triggerExplosion(target.xPercent, target.yPercent, target);
        setFallingWords((prev) => prev.filter((w) => w.id !== target.id));
      } else {
        setFallingWords((prev) =>
          prev.map((w) =>
            w.id === target.id
              ? { ...w, isTargeted: true, typedLength: newTypedLength }
              : { ...w, isTargeted: false }
          )
        );
      }
    } else {
      // No matching word on screen
      playSoundEffect('incorrect');
      setCombo(0);
      comboRef.current = 0;
    }
  };

  // Keyboard listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab' || e.key === 'Escape') return;
      if (e.key.length === 1) {
        handleKeyInput(e.key);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isGameOver, isPaused]);

  // Main animation frame game loop
  useEffect(() => {
    let lastSpawnTime = Date.now();
    let animId: number;

    const gameLoop = () => {
      if (!isGameOverRef.current && !isPausedRef.current) {
        const now = Date.now();

        // Spawn words periodically (every 2.2s)
        if (now - lastSpawnTime > 2200 && fallingWordsRef.current.length < 5) {
          spawnWord();
          lastSpawnTime = now;
        }

        // 1. Update falling words position
        setFallingWords((prev) => {
          const nextWords: FallingTypingWord[] = [];

          prev.forEach((w) => {
            const nextY = w.yPercent + w.speed;

            // Check bottom danger zone (90%)
            if (nextY >= 88) {
              // Word breached base defense!
              playSoundEffect('incorrect');
              soundSynth.playExplosion();

              const nextLives = livesRef.current - 1;
              setLives(nextLives);
              livesRef.current = nextLives;
              setCombo(0);
              comboRef.current = 0;

              if (nextLives <= 0) {
                setIsGameOver(true);
                isGameOverRef.current = true;
                playSoundEffect('streak');
                try {
                  confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
                } catch (e) {
                  console.warn(e);
                }
              }
            } else {
              nextWords.push({ ...w, yPercent: nextY });
            }
          });

          return nextWords;
        });

        // 2. Update laser bullets
        setBullets((prev) => {
          return prev
            .map((b) => ({ ...b, progress: b.progress + 0.25 }))
            .filter((b) => b.progress < 1);
        });

        // 3. Update explosion particles
        setParticles((prev) => {
          return prev
            .map((p) => ({
              ...p,
              x: p.x + p.vx * 0.15,
              y: p.y + p.vy * 0.15,
              alpha: p.alpha - 0.04,
            }))
            .filter((p) => p.alpha > 0);
        });

        // 4. Update floating scores
        setFloatingScores((prev) => {
          return prev
            .map((fs) => ({ ...fs, y: fs.y - 0.3 }))
            .filter((fs) => fs.y > 5);
        });
      }

      animId = requestAnimationFrame(gameLoop);
    };

    animId = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(animId);
  }, [spawnWord]);

  return (
    <div className="max-w-5xl mx-auto space-y-4 animate-fade-in pb-20 select-none">
      {/* Top Header Controls */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2.5 rounded-2xl border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
            title="Quay lại Đấu Trường Game"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-lg sm:text-xl font-black text-stone-900 dark:text-white flex items-center gap-2">
              <span>🔫 Chiếc Súng Bắn Chữ (Laser Typing Attack)</span>
            </h1>
            <p className="text-xs text-stone-400">
              Gõ Pinyin của từ rơi xuống để súng không gian xoay nòng và bắn tia Laser hủy diệt từ vựng!
            </p>
          </div>
        </div>

        {/* Level Filter & Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1 bg-stone-100 dark:bg-stone-800 p-1 rounded-xl text-xs font-bold">
            {(['all', 'HSK 1', 'HSK 2', 'HSK 3', 'HSK 4'] as const).map((lvl) => (
              <button
                key={lvl}
                onClick={() => {
                  setLevel(lvl);
                  initGame();
                }}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  level === lvl
                    ? 'bg-red-600 text-white shadow-xs'
                    : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
                }`}
              >
                {lvl === 'all' ? 'Tất cả' : lvl}
              </button>
            ))}
          </div>

          <button
            onClick={() => setIsPaused(!isPaused)}
            className="p-2 rounded-xl border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 hover:bg-stone-100 transition-colors cursor-pointer"
            title={isPaused ? 'Tiếp tục' : 'Tạm dừng'}
          >
            {isPaused ? <Play size={16} /> : <Pause size={16} />}
          </button>

          <button
            onClick={initGame}
            className="p-2 rounded-xl border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 hover:bg-stone-100 transition-colors cursor-pointer"
            title="Chơi lại ván mới"
          >
            <RotateCcw size={16} />
          </button>
        </div>
      </div>

      {/* Dashboard Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Score */}
        <div className="p-3 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase text-stone-400 block">Điểm Số</span>
            <span className="text-xl font-black text-red-600 dark:text-red-400">{score}</span>
          </div>
          <Zap size={20} className="text-red-500" />
        </div>

        {/* Combo */}
        <div className="p-3 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase text-stone-400 block">Combo Bắn Liên Tiếp</span>
            <span className="text-xl font-black text-amber-500">x{combo}</span>
          </div>
          <Flame size={20} className="text-amber-500 fill-amber-500" />
        </div>

        {/* Words Destroyed */}
        <div className="p-3 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase text-stone-400 block">Từ Đã Tiêu Diệt</span>
            <span className="text-xl font-black text-emerald-600 dark:text-emerald-400">{wordsDestroyed}</span>
          </div>
          <Trophy size={20} className="text-emerald-500" />
        </div>

        {/* Lives / Base Shield */}
        <div className="p-3 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase text-stone-400 block">Năng Lượng Căn Cứ</span>
            <div className="flex items-center gap-1 mt-0.5">
              {[1, 2, 3].map((i) => (
                <Heart
                  key={i}
                  size={18}
                  className={`transition-all ${
                    i <= lives
                      ? 'text-red-500 fill-red-500 animate-pulse'
                      : 'text-stone-300 dark:text-stone-700'
                  }`}
                />
              ))}
            </div>
          </div>
          <ShieldAlert size={20} className={lives === 1 ? 'text-red-500 animate-bounce' : 'text-stone-400'} />
        </div>
      </div>

      {/* Main Arcade Space Arena */}
      <div
        ref={arenaRef}
        onClick={() => hiddenInputRef.current?.focus()}
        className="relative w-full h-[520px] sm:h-[580px] rounded-3xl bg-radial from-slate-900 via-stone-950 to-black border-2 border-stone-800 shadow-2xl overflow-hidden cursor-crosshair select-none"
      >
        {/* Hidden Input for Mobile / Tablet Virtual Keyboard */}
        <input
          ref={hiddenInputRef}
          type="text"
          autoFocus
          className="absolute opacity-0 -top-10 left-0 pointer-events-none"
          onChange={(e) => {
            const val = e.target.value;
            if (val.length > 0) {
              handleKeyInput(val[val.length - 1]);
              e.target.value = '';
            }
          }}
        />

        {/* Cosmic Grid & Stars Background */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f293715_1px,transparent_1px),linear-gradient(to_bottom,#1f293715_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />
        
        {/* Laser Defense Danger Line at Bottom (88%) */}
        <div className="absolute bottom-[10%] inset-x-0 h-1 bg-red-500/40 border-t border-dashed border-red-500 pointer-events-none flex items-center justify-center">
          <span className="px-3 py-0.5 rounded-full bg-red-950/80 border border-red-500/60 text-[9px] font-mono uppercase tracking-widest text-red-400 -translate-y-1/2">
            VẠCH PHÒNG THỦ CĂN CỨ
          </span>
        </div>

        {/* Floating Scores */}
        {floatingScores.map((fs) => (
          <div
            key={fs.id}
            style={{ color: fs.color, left: `${fs.x}%`, top: `${fs.y}%` }}
            className="absolute -translate-x-1/2 -translate-y-1/2 font-black text-sm sm:text-base pointer-events-none animate-fade-in shadow-sm transition-all duration-500"
          >
            {fs.text}
          </div>
        ))}

        {/* Explosion Particles */}
        {particles.map((p) => (
          <div
            key={p.id}
            style={{
              left: `${p.x}%`,
              top: `${p.y}%`,
              width: `${p.size}px`,
              height: `${p.size}px`,
              backgroundColor: p.color,
              opacity: p.alpha,
            }}
            className="absolute rounded-full pointer-events-none shadow-md"
          />
        ))}

        {/* Laser Projectile Bullets */}
        {bullets.map((b) => {
          const currentX = b.startX + (b.targetX - b.startX) * b.progress;
          const currentY = b.startY + (b.targetY - b.startY) * b.progress;
          return (
            <div
              key={b.id}
              style={{
                left: `${currentX}%`,
                top: `${currentY}%`,
              }}
              className="absolute -translate-x-1/2 -translate-y-1/2 w-2.5 h-6 rounded-full bg-gradient-to-t from-red-500 via-amber-400 to-white shadow-[0_0_12px_#ef4444] pointer-events-none transform -rotate-45"
            />
          );
        })}

        {/* Falling Target Words */}
        {fallingWords.map((word) => {
          const isTargeted = word.isTargeted;
          const typedPart = word.rawPinyin.slice(0, word.typedLength);
          const remainingPart = word.rawPinyin.slice(word.typedLength);

          return (
            <div
              key={word.id}
              style={{
                left: `${word.xPercent}%`,
                top: `${word.yPercent}%`,
              }}
              className={`absolute -translate-x-1/2 px-4 py-2.5 rounded-2xl backdrop-blur-md transition-all duration-75 flex flex-col items-center justify-center text-center shadow-xl border-2 ${
                isTargeted
                  ? 'bg-red-950/90 border-red-400 shadow-red-500/50 scale-110 ring-4 ring-red-500/30'
                  : 'bg-stone-900/85 border-stone-700/80 hover:border-red-400/80'
              }`}
            >
              {/* Target lock reticle */}
              {isTargeted && (
                <div className="absolute -top-3 -right-3 p-1 rounded-full bg-red-600 text-white animate-spin">
                  <Crosshair size={14} />
                </div>
              )}

              {/* Hanzi */}
              <div className="text-2xl sm:text-3xl font-black font-chinese text-white leading-tight">
                {word.vocab.hanzi}
              </div>

              {/* Vietnamese Meaning */}
              <div className="text-[11px] text-amber-300 font-semibold mt-0.5">
                {word.vocab.meaning}
              </div>

              {/* Pinyin with Typed Highlighting */}
              <div className="mt-1 px-2.5 py-0.5 rounded-lg bg-black/60 border border-stone-700 font-mono text-xs tracking-wider">
                <span className="text-emerald-400 font-black underline decoration-2">
                  {typedPart}
                </span>
                <span className="text-stone-300 font-bold">
                  {remainingPart}
                </span>
              </div>
            </div>
          );
        })}

        {/* SCI-FI LASER CANNON GUN (Bottom Center) */}
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-none z-20">
          {/* Rotating Gun Turret & Dual Barrels */}
          <div
            style={{
              transform: `rotate(${gunAngle}deg) ${isRecoil ? 'translateY(6px)' : 'translateY(0)'}`,
              transformOrigin: 'bottom center',
            }}
            className="transition-transform duration-75 relative flex flex-col items-center"
          >
            {/* Muzzle Flash Shockwave */}
            {muzzleFlash && (
              <div className="absolute -top-6 w-12 h-12 rounded-full bg-gradient-to-t from-red-500 via-amber-300 to-white animate-ping opacity-90 shadow-[0_0_20px_#ef4444]" />
            )}

            {/* Dual Gun Barrels */}
            <div className="flex items-center gap-2 mb-[-4px]">
              <div className="w-2.5 h-10 bg-gradient-to-t from-stone-600 via-stone-400 to-red-500 rounded-t-sm shadow-md border-t-2 border-red-400" />
              <div className="w-2.5 h-10 bg-gradient-to-t from-stone-600 via-stone-400 to-red-500 rounded-t-sm shadow-md border-t-2 border-red-400" />
            </div>

            {/* Gun Mantlet / Center Core */}
            <div className="w-12 h-8 bg-gradient-to-tr from-stone-800 to-stone-700 rounded-xl border-2 border-red-500/80 shadow-lg flex items-center justify-center">
              <div className="w-4 h-4 rounded-full bg-red-500 animate-pulse shadow-[0_0_8px_#ef4444]" />
            </div>
          </div>

          {/* Heavy Base Turret Stand */}
          <div className="w-24 h-8 bg-gradient-to-b from-stone-800 to-stone-900 rounded-t-2xl border-t-2 border-x-2 border-stone-600 shadow-2xl flex items-center justify-center gap-2 px-3">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-[9px] font-mono font-bold text-stone-300 uppercase tracking-widest">
              LASER CANNON
            </span>
          </div>
        </div>

        {/* Virtual Keyboard Trigger Hint */}
        <div className="absolute bottom-3 right-4 z-20 flex items-center gap-1.5 px-3 py-1 rounded-xl bg-black/60 border border-stone-700 text-stone-400 text-xs">
          <Keyboard size={13} className="text-red-400" />
          <span>Gõ phím Pinyin để bắn</span>
        </div>

        {/* GAME OVER MODAL OVERLAY */}
        {isGameOver && (
          <div className="absolute inset-0 z-30 bg-black/85 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center text-white space-y-4 animate-fade-in">
            <div className="w-16 h-16 rounded-full bg-red-600/30 border-2 border-red-500 text-red-400 flex items-center justify-center text-3xl shadow-xl">
              💥
            </div>

            <h3 className="text-2xl sm:text-3xl font-black">
              Căn Cứ Bị Đột Phá! (Game Over)
            </h3>

            <p className="text-xs sm:text-sm text-stone-300 max-w-sm">
              Bạn đã bắn nổ <span className="font-bold text-emerald-400">{wordsDestroyed} từ vựng</span>, đạt <span className="font-bold text-amber-400">{score} điểm</span> với chuỗi Combo cao nhất x{maxCombo}!
            </p>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={onBack}
                className="px-5 py-2.5 rounded-2xl bg-white/20 hover:bg-white/30 text-xs font-bold transition-all cursor-pointer"
              >
                Chọn Game Khác
              </button>
              <button
                onClick={initGame}
                className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-red-600 to-amber-600 text-white font-black text-xs shadow-lg hover:scale-105 transition-all cursor-pointer"
              >
                Bắn Lại Trận Mới
              </button>
            </div>
          </div>
        )}

        {/* PAUSE OVERLAY */}
        {isPaused && !isGameOver && (
          <div className="absolute inset-0 z-30 bg-black/70 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center text-white space-y-3 animate-fade-in">
            <h3 className="text-2xl font-black">Đang Tạm Dừng</h3>
            <button
              onClick={() => setIsPaused(false)}
              className="px-6 py-2.5 rounded-2xl bg-white text-stone-900 font-bold text-xs shadow-lg hover:scale-105 transition-all cursor-pointer"
            >
              Tiếp Tục Bắn
            </button>
          </div>
        )}
      </div>

      {/* Touch Mobile Quick Letters Bar (For Mobile & Tablets) */}
      <div className="p-3.5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-sm space-y-2">
        <div className="flex items-center justify-between text-xs text-stone-400">
          <span className="font-bold text-stone-600 dark:text-stone-300 flex items-center gap-1">
            <Keyboard size={14} className="text-red-500" />
            <span>Bàn Phím Cảm Ứng Nhanh (Hoặc gõ trực tiếp bàn phím máy tính):</span>
          </span>
          <span className="text-[11px]">Hỗ trợ phím a-z</span>
        </div>

        <div className="flex flex-wrap gap-1.5 justify-center">
          {'abcdefghijklmnopqrstuvwxyz'.split('').map((char) => (
            <button
              key={char}
              onClick={() => handleKeyInput(char)}
              className="w-8 h-9 sm:w-9 sm:h-10 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-red-600 hover:text-white dark:hover:bg-red-600 border border-stone-200 dark:border-stone-700 text-stone-800 dark:text-stone-200 font-mono font-bold text-xs sm:text-sm active:scale-90 transition-all cursor-pointer flex items-center justify-center"
            >
              {char.toUpperCase()}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
