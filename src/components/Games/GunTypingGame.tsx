import type React from 'react';
import { useState, useEffect, useRef, useCallback } from 'react';
import { 
  ArrowLeft, 
  RotateCcw, 
  Heart, 
  Flame, 
  Trophy, 
  Keyboard, 
  ShieldAlert, 
  Zap, 
  Play, 
  Pause,
  Gauge
} from 'lucide-react';
import { GAME_VOCAB_POOL } from '../../data/gameData';
import type { GameVocabItem } from '../../types/game';
import { soundSynth, normalizePinyin } from '../../utils/audioSynth';
import { speakChinese, playSoundEffect } from '../../utils/speech';
import { addXP } from '../../utils/storage';
import confetti from 'canvas-confetti';

interface GunTypingGameProps {
  onBack: () => void;
}

// Falling word entity on Canvas
interface CanvasWord {
  id: string;
  vocab: GameVocabItem;
  rawPinyin: string;
  typedLength: number;
  x: number; // in pixels
  y: number; // in pixels
  speed: number;
  width: number;
  height: number;
  isTargeted: boolean;
  alpha: number;
}

// Laser bullet particle on Canvas
interface CanvasLaser {
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
  targetX: number;
  targetY: number;
  progress: number;
  speed: number;
}

// Explosion particle on Canvas
interface CanvasParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  life: number;
  decay: number;
}

// Shockwave ring on Canvas
interface CanvasShockwave {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  color: string;
  alpha: number;
}

// Floating score toast on Canvas
interface CanvasFloatingText {
  x: number;
  y: number;
  text: string;
  color: string;
  alpha: number;
  vy: number;
}

type SpeedMode = 'slow' | 'normal' | 'fast' | 'extreme';

export const GunTypingGame: React.FC<GunTypingGameProps> = ({ onBack }) => {
  // React HUD states (only updated on events, NOT every frame)
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [wordsDestroyed, setWordsDestroyed] = useState(0);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [level, setLevel] = useState<'all' | 'HSK 1' | 'HSK 2' | 'HSK 3' | 'HSK 4'>('all');
  const [speedMode, setSpeedMode] = useState<SpeedMode>('normal');

  // Canvas and input refs
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const hiddenInputRef = useRef<HTMLInputElement>(null);

  // Speed multiplier values
  const speedMultipliers: Record<SpeedMode, { speed: number; spawnDelay: number; label: string; icon: string }> = {
    slow: { speed: 0.65, spawnDelay: 3200, label: '0.65x Chậm', icon: '🐢' },
    normal: { speed: 1.0, spawnDelay: 2200, label: '1.0x Chuẩn', icon: '⚡' },
    fast: { speed: 1.45, spawnDelay: 1500, label: '1.45x Nhanh', icon: '🚀' },
    extreme: { speed: 1.95, spawnDelay: 1000, label: '1.95x Siêu Tốc', icon: '🔥' },
  };

  // Game Engine Mutable State (Runs at native 60–120 FPS on Canvas)
  const engineRef = useRef<{
    words: CanvasWord[];
    lasers: CanvasLaser[];
    particles: CanvasParticle[];
    shockwaves: CanvasShockwave[];
    floatingTexts: CanvasFloatingText[];
    gunAngle: number;
    targetGunAngle: number;
    recoil: number;
    muzzleFlash: number;
    lastSpawnTime: number;
    nextId: number;
    lives: number;
    combo: number;
    score: number;
    wordsDestroyed: number;
    isGameOver: boolean;
    isPaused: boolean;
    level: string;
    speedMode: SpeedMode;
  }>({
    words: [],
    lasers: [],
    particles: [],
    shockwaves: [],
    floatingTexts: [],
    gunAngle: 0,
    targetGunAngle: 0,
    recoil: 0,
    muzzleFlash: 0,
    lastSpawnTime: Date.now(),
    nextId: 1,
    lives: 3,
    combo: 0,
    score: 0,
    wordsDestroyed: 0,
    isGameOver: false,
    isPaused: false,
    level: 'all',
    speedMode: 'normal',
  });

  // Sync React state into Engine refs
  useEffect(() => {
    engineRef.current.level = level;
  }, [level]);

  useEffect(() => {
    engineRef.current.speedMode = speedMode;
  }, [speedMode]);

  useEffect(() => {
    engineRef.current.isPaused = isPaused;
  }, [isPaused]);

  // Spawn new word on Canvas
  const spawnWord = useCallback((canvasWidth: number) => {
    const engine = engineRef.current;
    if (engine.isGameOver || engine.isPaused) return;

    let pool = GAME_VOCAB_POOL;
    if (engine.level !== 'all') {
      pool = GAME_VOCAB_POOL.filter((v) => v.hskLevel === engine.level);
    }

    const vocab = pool[Math.floor(Math.random() * pool.length)];
    const rawPinyin = normalizePinyin(vocab.pinyin);
    if (!rawPinyin) return;

    // Card width & height
    const cardWidth = Math.min(220, Math.max(160, vocab.hanzi.length * 40 + 40));
    const cardHeight = 85;

    // Random X bounded inside canvas
    const padding = 20;
    const minX = padding + cardWidth / 2;
    const maxX = canvasWidth - padding - cardWidth / 2;
    const spawnX = minX + Math.random() * (maxX - minX);

    const baseSpeed = 0.55 + Math.random() * 0.35;
    const currentMultiplier = speedMultipliers[engine.speedMode].speed;

    const newWord: CanvasWord = {
      id: `w-${engine.nextId++}`,
      vocab,
      rawPinyin,
      typedLength: 0,
      x: spawnX,
      y: -cardHeight,
      speed: baseSpeed * currentMultiplier,
      width: cardWidth,
      height: cardHeight,
      isTargeted: false,
      alpha: 1,
    };

    engine.words.push(newWord);
  }, []);

  // Initialize Game Session
  const initGame = useCallback(() => {
    playSoundEffect('click');
    const engine = engineRef.current;
    engine.words = [];
    engine.lasers = [];
    engine.particles = [];
    engine.shockwaves = [];
    engine.floatingTexts = [];
    engine.gunAngle = 0;
    engine.targetGunAngle = 0;
    engine.recoil = 0;
    engine.muzzleFlash = 0;
    engine.lastSpawnTime = Date.now();
    engine.lives = 3;
    engine.combo = 0;
    engine.score = 0;
    engine.wordsDestroyed = 0;
    engine.isGameOver = false;
    engine.isPaused = false;

    setScore(0);
    setLives(3);
    setCombo(0);
    setMaxCombo(0);
    setWordsDestroyed(0);
    setIsGameOver(false);
    setIsPaused(false);

    setTimeout(() => {
      hiddenInputRef.current?.focus();
    }, 100);
  }, []);

  useEffect(() => {
    initGame();
  }, [initGame]);

  // Fire laser shot
  const triggerLaserShot = (target: CanvasWord, gunX: number, gunY: number) => {
    const engine = engineRef.current;
    soundSynth.playLaser();

    // Aim calculation
    const dx = target.x - gunX;
    const dy = target.y - gunY;
    engine.targetGunAngle = Math.atan2(dy, dx) + Math.PI / 2;

    // Recoil and flash
    engine.recoil = 12;
    engine.muzzleFlash = 1.0;

    // Add laser projectile
    engine.lasers.push({
      startX: gunX,
      startY: gunY,
      currentX: gunX,
      currentY: gunY,
      targetX: target.x,
      targetY: target.y,
      progress: 0,
      speed: 0.18, // High speed travel
    });
  };

  // Trigger explosion
  const triggerExplosion = (x: number, y: number, word: CanvasWord) => {
    const engine = engineRef.current;
    soundSynth.playExplosion();

    // Native Chinese voice pronunciation
    speakChinese(word.vocab.hanzi, 1.0);

    // Shockwave ring
    engine.shockwaves.push({
      x,
      y,
      radius: 5,
      maxRadius: 65,
      color: '#ef4444',
      alpha: 1,
    });

    // 25+ Spark particles
    const colors = ['#ef4444', '#f59e0b', '#10b981', '#38bdf8', '#ec4899', '#ffffff'];
    for (let i = 0; i < 28; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2.5 + Math.random() * 6.5;
      engine.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 3 + Math.random() * 5,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: 1,
        life: 1,
        decay: 0.025 + Math.random() * 0.02,
      });
    }

    // Floating score text
    const newCombo = engine.combo + 1;
    engine.combo = newCombo;
    const earned = 100 + newCombo * 20;
    engine.score += earned;
    engine.wordsDestroyed += 1;

    engine.floatingTexts.push({
      x,
      y,
      text: newCombo > 1 ? `+${earned} (x${newCombo}!)` : `+${earned}`,
      color: newCombo > 1 ? '#f59e0b' : '#10b981',
      alpha: 1,
      vy: -1.2,
    });

    // Update React HUD stats
    setCombo(newCombo);
    setMaxCombo((prev) => Math.max(prev, newCombo));
    setScore(engine.score);
    setWordsDestroyed(engine.wordsDestroyed);
    addXP(15);
  };

  // Handle keystroke input
  const handleKeyInput = (char: string) => {
    const engine = engineRef.current;
    if (engine.isGameOver || engine.isPaused) return;

    const lower = char.toLowerCase();
    if (!/^[a-z0-9]$/.test(lower)) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const gunX = canvas.width / 2;
    const gunY = canvas.height - 40;

    // 1. Check if there is already an actively locked target
    const activeTarget = engine.words.find((w) => w.isTargeted);

    if (activeTarget) {
      const nextExpected = activeTarget.rawPinyin[activeTarget.typedLength];

      if (lower === nextExpected) {
        // MATCH!
        soundSynth.playHit();
        triggerLaserShot(activeTarget, gunX, gunY);

        activeTarget.typedLength += 1;

        if (activeTarget.typedLength >= activeTarget.rawPinyin.length) {
          // COMPLETED!
          triggerExplosion(activeTarget.x, activeTarget.y, activeTarget);
          engine.words = engine.words.filter((w) => w.id !== activeTarget.id);
        }
      } else {
        // MISTYPE
        playSoundEffect('incorrect');
        engine.combo = 0;
        setCombo(0);
      }
      return;
    }

    // 2. No target locked: find candidate starting with typed letter
    const candidates = engine.words.filter((w) => w.rawPinyin[0] === lower);

    if (candidates.length > 0) {
      // Prioritize lowest word (closest to danger line)
      candidates.sort((a, b) => b.y - a.y);
      const target = candidates[0];

      target.isTargeted = true;
      target.typedLength = 1;

      soundSynth.playHit();
      triggerLaserShot(target, gunX, gunY);

      if (target.typedLength >= target.rawPinyin.length) {
        triggerExplosion(target.x, target.y, target);
        engine.words = engine.words.filter((w) => w.id !== target.id);
      }
    } else {
      playSoundEffect('incorrect');
      engine.combo = 0;
      setCombo(0);
    }
  };

  // Physical keyboard listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab' || e.key === 'Escape') return;
      if (e.key.length === 1) {
        handleKeyInput(e.key);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Main Canvas Render Loop (60–120 FPS)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const resizeCanvas = () => {
      const parent = canvas.parentElement;
      if (parent) {
        canvas.width = parent.clientWidth;
        canvas.height = parent.clientHeight || 560;
      }
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Deep Space Starfield positions
    const stars = Array.from({ length: 45 }, () => ({
      x: Math.random() * (canvas.width || 800),
      y: Math.random() * (canvas.height || 600),
      size: Math.random() * 2 + 0.5,
      alpha: Math.random() * 0.8 + 0.2,
      speed: Math.random() * 0.4 + 0.1,
    }));

    const render = () => {
      const engine = engineRef.current;
      const w = canvas.width;
      const h = canvas.height;
      const gunX = w / 2;
      const gunY = h - 40;

      // 1. CLEAR & DRAW SPACE BACKGROUND
      ctx.fillStyle = '#09090b';
      ctx.fillRect(0, 0, w, h);

      // Radial Cosmic Nebula Glow
      const bgGlow = ctx.createRadialGradient(gunX, h * 0.4, 50, gunX, h * 0.4, w * 0.7);
      bgGlow.addColorStop(0, '#1e1b4b1a');
      bgGlow.addColorStop(0.5, '#450a0a18');
      bgGlow.addColorStop(1, '#00000000');
      ctx.fillStyle = bgGlow;
      ctx.fillRect(0, 0, w, h);

      // Stars floating downward
      ctx.fillStyle = '#ffffff';
      stars.forEach((s) => {
        s.y += s.speed;
        if (s.y > h) s.y = 0;
        ctx.globalAlpha = s.alpha;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalAlpha = 1;

      // 2. DANGER DEFENSE LINE AT BOTTOM (86%)
      const dangerY = h * 0.86;
      ctx.strokeStyle = '#ef444466';
      ctx.lineWidth = 2;
      ctx.setLineDash([8, 6]);
      ctx.beginPath();
      ctx.moveTo(0, dangerY);
      ctx.lineTo(w, dangerY);
      ctx.stroke();
      ctx.setLineDash([]);

      // 3. SPAWN WORDS LOGIC
      if (!engine.isGameOver && !engine.isPaused) {
        const now = Date.now();
        const spawnInterval = speedMultipliers[engine.speedMode].spawnDelay;

        if (now - engine.lastSpawnTime > spawnInterval && engine.words.length < 6) {
          spawnWord(w);
          engine.lastSpawnTime = now;
        }
      }

      // 4. UPDATE & DRAW FALLING WORDS
      for (let i = engine.words.length - 1; i >= 0; i--) {
        const word = engine.words[i];

        if (!engine.isGameOver && !engine.isPaused) {
          word.y += word.speed;

          // Check if word hit danger line
          if (word.y + word.height / 2 >= dangerY) {
            // Breach base!
            soundSynth.playExplosion();
            playSoundEffect('incorrect');

            engine.lives -= 1;
            engine.combo = 0;
            setLives(engine.lives);
            setCombo(0);

            // Remove word
            engine.words.splice(i, 1);

            if (engine.lives <= 0) {
              engine.isGameOver = true;
              setIsGameOver(true);
              playSoundEffect('streak');
              try {
                confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
              } catch (e) {
                console.warn(e);
              }
            }
            continue;
          }
        }

        // DRAW VOCAB CARD
        ctx.save();
        ctx.translate(word.x, word.y);

        // Card Glow
        if (word.isTargeted) {
          ctx.shadowColor = '#ef4444';
          ctx.shadowBlur = 18;
          ctx.fillStyle = 'rgba(69, 10, 10, 0.9)';
          ctx.strokeStyle = '#ef4444';
          ctx.lineWidth = 2.5;
        } else {
          ctx.shadowColor = '#000000';
          ctx.shadowBlur = 8;
          ctx.fillStyle = 'rgba(24, 24, 27, 0.88)';
          ctx.strokeStyle = 'rgba(82, 82, 91, 0.7)';
          ctx.lineWidth = 1.5;
        }

        // Rounded Card Box
        ctx.beginPath();
        ctx.roundRect(-word.width / 2, -word.height / 2, word.width, word.height, 16);
        ctx.fill();
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Hanzi Text
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 22px "Noto Serif SC", serif';
        ctx.textAlign = 'center';
        ctx.fillText(word.vocab.hanzi, 0, -12);

        // Vietnamese Meaning
        ctx.fillStyle = '#fbbf24';
        ctx.font = 'bold 11px sans-serif';
        ctx.fillText(word.vocab.meaning, 0, 4);

        // Pinyin Box with Typed Progress
        const typedPart = word.rawPinyin.slice(0, word.typedLength);
        const remainPart = word.rawPinyin.slice(word.typedLength);

        ctx.font = 'bold 13px monospace';
        const totalPinyinWidth = ctx.measureText(word.rawPinyin).width;
        let pinyinStartX = -totalPinyinWidth / 2;

        // Draw Typed Letters in Neon Green
        if (typedPart) {
          ctx.fillStyle = '#10b981';
          ctx.textAlign = 'left';
          ctx.fillText(typedPart, pinyinStartX, 24);
          pinyinStartX += ctx.measureText(typedPart).width;
        }

        // Draw Remaining Letters in Stone Gray
        if (remainPart) {
          ctx.fillStyle = '#d4d4d8';
          ctx.textAlign = 'left';
          ctx.fillText(remainPart, pinyinStartX, 24);
        }

        // Draw Target Reticle if locked
        if (word.isTargeted) {
          ctx.strokeStyle = '#ef4444';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(word.width / 2 - 4, -word.height / 2 + 4, 6, 0, Math.PI * 2);
          ctx.stroke();
        }

        ctx.restore();
      }

      // 5. UPDATE & DRAW LASER BULLETS
      for (let i = engine.lasers.length - 1; i >= 0; i--) {
        const laser = engine.lasers[i];
        laser.progress += laser.speed;

        laser.currentX = laser.startX + (laser.targetX - laser.startX) * laser.progress;
        laser.currentY = laser.startY + (laser.targetY - laser.startY) * laser.progress;

        // Draw glowing laser bolt
        ctx.save();
        ctx.shadowColor = '#ef4444';
        ctx.shadowBlur = 12;
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 3;

        const tailLength = 22;
        const angle = Math.atan2(laser.targetY - laser.startY, laser.targetX - laser.startX);
        const tailX = laser.currentX - Math.cos(angle) * tailLength;
        const tailY = laser.currentY - Math.sin(angle) * tailLength;

        const laserGrad = ctx.createLinearGradient(tailX, tailY, laser.currentX, laser.currentY);
        laserGrad.addColorStop(0, 'rgba(239, 68, 68, 0)');
        laserGrad.addColorStop(1, '#ffffff');

        ctx.strokeStyle = laserGrad;
        ctx.beginPath();
        ctx.moveTo(tailX, tailY);
        ctx.lineTo(laser.currentX, laser.currentY);
        ctx.stroke();
        ctx.restore();

        if (laser.progress >= 1) {
          engine.lasers.splice(i, 1);
        }
      }

      // 6. UPDATE & DRAW SHOCKWAVES
      for (let i = engine.shockwaves.length - 1; i >= 0; i--) {
        const sw = engine.shockwaves[i];
        sw.radius += 3.5;
        sw.alpha -= 0.045;

        ctx.save();
        ctx.globalAlpha = Math.max(0, sw.alpha);
        ctx.strokeStyle = sw.color;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(sw.x, sw.y, sw.radius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();

        if (sw.alpha <= 0) {
          engine.shockwaves.splice(i, 1);
        }
      }

      // 7. UPDATE & DRAW EXPLOSION PARTICLES
      for (let i = engine.particles.length - 1; i >= 0; i--) {
        const p = engine.particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.08; // Gravity
        p.alpha -= p.decay;

        ctx.save();
        ctx.globalAlpha = Math.max(0, p.alpha);
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        if (p.alpha <= 0) {
          engine.particles.splice(i, 1);
        }
      }

      // 8. UPDATE & DRAW FLOATING SCORES
      for (let i = engine.floatingTexts.length - 1; i >= 0; i--) {
        const ft = engine.floatingTexts[i];
        ft.y += ft.vy;
        ft.alpha -= 0.02;

        ctx.save();
        ctx.globalAlpha = Math.max(0, ft.alpha);
        ctx.fillStyle = ft.color;
        ctx.font = 'bold 15px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(ft.text, ft.x, ft.y);
        ctx.restore();

        if (ft.alpha <= 0) {
          engine.floatingTexts.splice(i, 1);
        }
      }

      // 9. DRAW SCI-FI LASER GUN TURRET AT BOTTOM CENTER
      // Smooth Turret Angle Lerp
      engine.gunAngle += (engine.targetGunAngle - engine.gunAngle) * 0.22;
      engine.recoil *= 0.82;
      engine.muzzleFlash *= 0.8;

      ctx.save();
      ctx.translate(gunX, gunY);

      // Heavy Base Chassis
      ctx.fillStyle = '#27272a';
      ctx.strokeStyle = '#52525b';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(-42, -10, 84, 30, [14, 14, 0, 0]);
      ctx.fill();
      ctx.stroke();

      // Energy Ring LED
      ctx.fillStyle = '#10b981';
      ctx.beginPath();
      ctx.arc(0, 5, 4, 0, Math.PI * 2);
      ctx.fill();

      // Rotating Gun Barrel
      ctx.rotate(engine.gunAngle);

      // Recoil translation
      ctx.translate(0, engine.recoil);

      // Dual Plasma Barrels
      ctx.fillStyle = '#71717a';
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 1.5;

      // Left Barrel
      ctx.fillRect(-10, -42, 6, 36);
      ctx.strokeRect(-10, -42, 6, 36);

      // Right Barrel
      ctx.fillRect(4, -42, 6, 36);
      ctx.strokeRect(4, -42, 6, 36);

      // Gun Mantlet Core
      ctx.fillStyle = '#3f3f46';
      ctx.beginPath();
      ctx.arc(0, -6, 16, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Core Glowing Crystal
      ctx.fillStyle = '#ef4444';
      ctx.shadowColor = '#ef4444';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(0, -6, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Muzzle Flash Flare
      if (engine.muzzleFlash > 0.05) {
        ctx.save();
        ctx.globalAlpha = engine.muzzleFlash;
        const flare = ctx.createRadialGradient(0, -46, 2, 0, -46, 26);
        flare.addColorStop(0, '#ffffff');
        flare.addColorStop(0.4, '#f59e0b');
        flare.addColorStop(1, 'rgba(239, 68, 68, 0)');
        ctx.fillStyle = flare;
        ctx.beginPath();
        ctx.arc(0, -46, 26, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      ctx.restore();

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [spawnWord]);

  return (
    <div className="max-w-5xl mx-auto space-y-4 animate-fade-in pb-20 select-none">
      {/* Top Header Navigation */}
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
              Gõ Pinyin của từ rơi xuống để súng Laser xoay nòng theo thời gian thực 60-120 FPS và bắn nổ tung từ vựng!
            </p>
          </div>
        </div>

        {/* Level & Speed & Controls Bar */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* SPEED MODE SELECTOR */}
          <div className="flex items-center gap-1 bg-stone-100 dark:bg-stone-800 p-1 rounded-xl text-xs font-bold">
            <span className="px-1.5 text-stone-400 flex items-center gap-1">
              <Gauge size={13} />
            </span>
            {(['slow', 'normal', 'fast', 'extreme'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setSpeedMode(mode)}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  speedMode === mode
                    ? 'bg-red-600 text-white shadow-xs'
                    : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
                }`}
                title={`Tốc độ rơi ${speedMultipliers[mode].label}`}
              >
                <span>{speedMultipliers[mode].icon}</span>
                <span className="hidden sm:inline ml-1">{speedMultipliers[mode].label.split(' ')[1]}</span>
              </button>
            ))}
          </div>

          {/* HSK Level Filter */}
          <div className="flex items-center gap-1 bg-stone-100 dark:bg-stone-800 p-1 rounded-xl text-xs font-bold">
            {(['all', 'HSK 1', 'HSK 2', 'HSK 3', 'HSK 4'] as const).map((lvl) => (
              <button
                key={lvl}
                onClick={() => {
                  setLevel(lvl);
                  initGame();
                }}
                className={`px-2 py-1 rounded-lg transition-all cursor-pointer ${
                  level === lvl
                    ? 'bg-stone-900 dark:bg-white text-white dark:text-stone-900 shadow-xs'
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

      {/* Main High-Performance Hardware Accelerated Canvas Arena */}
      <div
        onClick={() => hiddenInputRef.current?.focus()}
        className="relative w-full h-[520px] sm:h-[580px] rounded-3xl border-2 border-stone-800 shadow-2xl overflow-hidden cursor-crosshair select-none bg-black"
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

        {/* Hardware Canvas Element */}
        <canvas
          ref={canvasRef}
          className="w-full h-full block"
        />

        {/* Virtual Keyboard Trigger Hint */}
        <div className="absolute bottom-3 right-4 z-20 flex items-center gap-1.5 px-3 py-1 rounded-xl bg-black/60 border border-stone-700 text-stone-400 text-xs pointer-events-none">
          <Keyboard size={13} className="text-red-400" />
          <span>Gõ phím Pinyin để bắn</span>
        </div>

        {/* GAME OVER OVERLAY */}
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
