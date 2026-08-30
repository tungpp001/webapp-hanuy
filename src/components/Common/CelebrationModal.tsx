import type React from 'react';
import { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Award, Star, ArrowRight, RotateCcw } from 'lucide-react';
import { playSoundEffect } from '../../utils/speech';

interface CelebrationModalProps {
  isOpen: boolean;
  title: string;
  subtitle?: string;
  score?: number; // e.g. 95%
  xpGained: number;
  onClose: () => void;
  onRestart?: () => void;
  actionText?: string;
}

export const CelebrationModal: React.FC<CelebrationModalProps> = ({
  isOpen,
  title,
  subtitle = 'Bạn đã hoàn thành xuất sắc bài học này!',
  score,
  xpGained,
  onClose,
  onRestart,
  actionText = 'Tiếp tục bài tiếp theo',
}) => {
  useEffect(() => {
    if (isOpen) {
      playSoundEffect('streak');
      
      // Fire confetti burst
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#DC2626', '#F59E0B', '#10B981', '#6366F1', '#EC4899']
        });
      } catch (e) {
        console.warn('Confetti error', e);
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-6 sm:p-8 max-w-md w-full text-center shadow-2xl transform transition-all duration-300 scale-100 animate-scale-up">
        {/* Animated Trophy Icon */}
        <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-tr from-amber-400 to-red-500 flex items-center justify-center text-white shadow-lg shadow-amber-500/30">
          <Award size={44} className="animate-bounce-subtle" />
        </div>

        <h3 className="text-2xl font-black text-stone-900 dark:text-white mb-1">
          {title}
        </h3>
        <p className="text-sm text-stone-600 dark:text-stone-300 mb-6">
          {subtitle}
        </p>

        {/* Score & XP Cards */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          {score !== undefined && (
            <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
              <span className="text-xs text-amber-700 dark:text-amber-300 font-medium block mb-0.5">
                Độ chuẩn xác
              </span>
              <span className="text-2xl font-black text-amber-600 dark:text-amber-400">
                {score}%
              </span>
            </div>
          )}

          <div className={`p-3.5 rounded-2xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 ${score === undefined ? 'col-span-2' : ''}`}>
            <span className="text-xs text-red-700 dark:text-red-300 font-medium block mb-0.5">
              Phần thưởng XP
            </span>
            <span className="text-2xl font-black text-red-600 dark:text-red-400 flex items-center justify-center gap-1">
              +{xpGained} <Star size={20} className="fill-red-500 text-red-500" />
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-2.5">
          {onRestart && (
            <button
              onClick={onRestart}
              className="w-full sm:w-auto px-4 py-3 rounded-xl border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 font-semibold text-sm transition-all flex items-center justify-center gap-1.5"
            >
              <RotateCcw size={16} />
              Luyện lại
            </button>
          )}

          <button
            onClick={onClose}
            className="w-full flex-1 px-5 py-3 rounded-xl bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-700 hover:to-amber-700 text-white font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-1.5 active:scale-95"
          >
            <span>{actionText}</span>
            <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};
