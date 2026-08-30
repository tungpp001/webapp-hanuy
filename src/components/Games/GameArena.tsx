import type React from 'react';
import { useState } from 'react';
import { 
  Gamepad2, 
  ArrowRight
} from 'lucide-react';
import { MemoryMatchGame } from './MemoryMatchGame';
import { SpeedVocabGame } from './SpeedVocabGame';
import { SentenceRaceGame } from './SentenceRaceGame';
import type { GameMode } from '../../types/game';
import { playSoundEffect } from '../../utils/speech';

export const GameArena: React.FC = () => {
  const [activeGame, setActiveGame] = useState<GameMode | null>(null);

  const handleSelectGame = (mode: GameMode) => {
    playSoundEffect('click');
    setActiveGame(mode);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBackToDashboard = () => {
    setActiveGame(null);
  };

  if (activeGame === 'memory') {
    return <MemoryMatchGame onBack={handleBackToDashboard} />;
  }

  if (activeGame === 'speed') {
    return <SpeedVocabGame onBack={handleBackToDashboard} />;
  }

  if (activeGame === 'sentence-race') {
    return <SentenceRaceGame onBack={handleBackToDashboard} />;
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fade-in pb-20">
      {/* Header Banner */}
      <div className="p-6 sm:p-10 rounded-3xl bg-gradient-to-r from-red-700 via-rose-700 to-amber-600 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 max-w-2xl space-y-3">
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-white/20 backdrop-blur-md text-white text-xs font-bold">
            <Gamepad2 size={14} className="text-amber-200" />
            Đấu Trường Game Học Tiếng Trung (HanYu Arcade 🎮)
          </span>
          <h1 className="text-2xl sm:text-4xl font-black tracking-tight">
            Vừa Chơi Game Vừa Nhớ Từ & Câu Siêu Tốc
          </h1>
          <p className="text-stone-100 text-xs sm:text-sm leading-relaxed">
            Chơi các mini-games phản xạ hấp dẫn để khắc sâu mặt chữ Hán, nghĩa ngữ cảnh và cấu trúc ngữ pháp giao tiếp một cách tự nhiên và không nhàm chán!
          </p>
        </div>
        <div className="absolute right-4 bottom-[-20px] select-none pointer-events-none opacity-15 font-calligraphy text-9xl sm:text-[180px] text-white">
          游戏
        </div>
      </div>

      {/* Game Modes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* GAME 1: MEMORY MATCH */}
        <div
          onClick={() => handleSelectGame('memory')}
          className="rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-sm hover:shadow-xl transition-all duration-300 p-6 flex flex-col justify-between group cursor-pointer relative overflow-hidden"
        >
          <div className="space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-red-600 to-rose-500 text-white flex items-center justify-center text-2xl shadow-md group-hover:scale-110 transition-transform">
              🎴
            </div>

            <div>
              <span className="text-[11px] font-bold uppercase text-red-600 dark:text-red-400 tracking-wider">
                Rèn Luyện Trí Nhớ Mặt Chữ
              </span>
              <h3 className="text-lg sm:text-xl font-bold text-stone-900 dark:text-white mt-1 group-hover:text-red-600 transition-colors">
                Trúc Xanh Ghép Cặp (Memory Match)
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400 mt-2 leading-relaxed">
                Lật mở các cặp thẻ 3D để kết nối Chữ Hán với Nghĩa tiếng Việt và phát âm audio mẫu.
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs font-semibold text-stone-400 pt-1">
              <span>• 6 Cặp từ ngẫu nhiên</span>
              <span>• Thưởng Combo XP</span>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
              +50 XP Thưởng
            </span>
            <button className="px-4 py-2 rounded-xl bg-gradient-to-r from-red-600 to-amber-600 text-white font-bold text-xs shadow-xs group-hover:shadow-md transition-all flex items-center gap-1">
              <span>Chơi Ngay</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>

        {/* GAME 2: SPEED VOCAB RUSH */}
        <div
          onClick={() => handleSelectGame('speed')}
          className="rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-sm hover:shadow-xl transition-all duration-300 p-6 flex flex-col justify-between group cursor-pointer relative overflow-hidden"
        >
          <div className="space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 text-white flex items-center justify-center text-2xl shadow-md group-hover:scale-110 transition-transform">
              🚀
            </div>

            <div>
              <span className="text-[11px] font-bold uppercase text-amber-600 dark:text-amber-400 tracking-wider">
                Phản Xạ Tốc Độ Cao
              </span>
              <h3 className="text-lg sm:text-xl font-bold text-stone-900 dark:text-white mt-1 group-hover:text-amber-600 transition-colors">
                Bắn Từ Rơi Nhanh (Speed Vocab Rush)
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400 mt-2 leading-relaxed">
                Bong bóng chữ Hán rơi liên tục, chạm nhanh vào bong bóng đúng theo nghĩa mục tiêu trước khi chạm đáy!
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs font-semibold text-stone-400 pt-1">
              <span>• 3 Mạng ❤️</span>
              <span>• Tăng tốc theo điểm</span>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
              +10 XP / Từ đúng
            </span>
            <button className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 text-white font-bold text-xs shadow-xs group-hover:shadow-md transition-all flex items-center gap-1">
              <span>Chơi Ngay</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>

        {/* GAME 3: SENTENCE RACE */}
        <div
          onClick={() => handleSelectGame('sentence-race')}
          className="rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-sm hover:shadow-xl transition-all duration-300 p-6 flex flex-col justify-between group cursor-pointer relative overflow-hidden"
        >
          <div className="space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center text-2xl shadow-md group-hover:scale-110 transition-transform">
              🧩
            </div>

            <div>
              <span className="text-[11px] font-bold uppercase text-emerald-600 dark:text-emerald-400 tracking-wider">
                Ghi Nhớ Cấu Trúc Câu
              </span>
              <h3 className="text-lg sm:text-xl font-bold text-stone-900 dark:text-white mt-1 group-hover:text-emerald-600 transition-colors">
                Đua Ghép Câu 60s (Sentence Race)
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400 mt-2 leading-relaxed">
                Đua tốc độ ghép các khối từ xáo trộn thành câu tiếng Trung hoàn chỉnh trong 60 giây nghẹt thở.
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs font-semibold text-stone-400 pt-1">
              <span>• Đếm ngược 60 giây</span>
              <span>• Luyện phản xạ ngữ pháp</span>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
              +60 XP Thưởng
            </span>
            <button className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold text-xs shadow-xs group-hover:shadow-md transition-all flex items-center gap-1">
              <span>Chơi Ngay</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
