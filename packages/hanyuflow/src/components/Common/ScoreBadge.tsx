import type React from 'react';
import { Flame, Zap } from 'lucide-react';
import type { UserProgress } from '../../types/chinese';

interface ScoreBadgeProps {
  progress: UserProgress;
  className?: string;
}

export const ScoreBadge: React.FC<ScoreBadgeProps> = ({ progress, className = '' }) => {
  // Calculate level based on XP
  const level = Math.floor(progress.xp / 100) + 1;
  const currentLevelXp = progress.xp % 100;

  return (
    <div className={`flex items-center gap-2 sm:gap-4 ${className}`}>
      {/* Streak Badge */}
      <div 
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-orange-500/10 to-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 font-bold text-sm shadow-sm"
        title={`${progress.streakDays} ngày học liên tiếp`}
      >
        <Flame size={18} className="text-orange-500 fill-orange-500 animate-bounce-subtle" />
        <span>{progress.streakDays}</span>
        <span className="text-xs font-normal opacity-80 hidden sm:inline">ngày</span>
      </div>

      {/* XP & Level Badge */}
      <div 
        className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-red-500/10 to-rose-500/10 border border-red-500/30 text-red-600 dark:text-red-400 font-bold text-sm shadow-sm"
        title={`Cấp độ ${level} (${currentLevelXp}/100 XP lên cấp tiếp theo)`}
      >
        <Zap size={18} className="text-red-500 fill-red-500" />
        <span>{progress.xp}</span>
        <span className="text-xs font-semibold px-1.5 py-0.5 rounded bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-300">
          Lv.{level}
        </span>
      </div>
    </div>
  );
};
