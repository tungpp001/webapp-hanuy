import type React from 'react';
import { Lightbulb } from 'lucide-react';
import type { GrammarPoint } from '../../types/chinese';
import { AudioButton } from '../Common/AudioButton';

interface GrammarPointsCardProps {
  grammarPoints: GrammarPoint[];
  className?: string;
}

export const GrammarPointsCard: React.FC<GrammarPointsCardProps> = ({ grammarPoints, className = '' }) => {
  if (!grammarPoints || grammarPoints.length === 0) return null;

  return (
    <div className={`rounded-3xl bg-gradient-to-br from-red-50/70 to-amber-50/70 dark:from-stone-900/90 dark:to-stone-900/40 border border-red-200/60 dark:border-red-900/30 p-5 sm:p-6 ${className}`}>
      <div className="flex items-center gap-2 mb-4">
        <div className="p-2 rounded-xl bg-red-600 text-white shadow-sm shadow-red-500/30">
          <Lightbulb size={20} />
        </div>
        <div>
          <h3 className="font-bold text-lg text-stone-900 dark:text-white">
            Ngữ Pháp & Mẹo Giao Tiếp Trọng Tâm
          </h3>
          <p className="text-xs text-stone-500 dark:text-stone-400">
            Các cấu trúc then chốt giúp bạn nói chuyện tự nhiên như người bản xứ
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {grammarPoints.map((point, idx) => (
          <div key={idx} className="p-4 rounded-2xl bg-white/80 dark:bg-stone-800/80 border border-stone-200/70 dark:border-stone-700/60 shadow-xs">
            <h4 className="text-base font-bold text-red-600 dark:text-red-400 mb-1.5 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300 text-xs flex items-center justify-center font-black">
                {idx + 1}
              </span>
              {point.title}
            </h4>

            {/* Structure Tag */}
            <div className="inline-block px-3 py-1 rounded-lg bg-stone-100 dark:bg-stone-700/70 text-stone-800 dark:text-stone-200 font-mono text-xs font-semibold mb-2">
              {point.structure}
            </div>

            <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-300 mb-3">
              {point.explanation}
            </p>

            {/* Examples */}
            {point.examples.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-stone-100 dark:border-stone-700/50">
                <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider">
                  Mẫu câu ứng dụng:
                </span>
                {point.examples.map((ex, exIdx) => (
                  <div key={exIdx} className="flex items-center justify-between gap-2 p-2 rounded-xl bg-stone-50 dark:bg-stone-900/50">
                    <div>
                      <div className="text-sm font-medium text-stone-900 dark:text-stone-100 font-chinese">
                        {ex.cn} <span className="text-xs text-stone-500 font-normal">({ex.pinyin})</span>
                      </div>
                      <div className="text-xs text-stone-600 dark:text-stone-400">
                        {ex.vn}
                      </div>
                    </div>
                    <AudioButton text={ex.cn} size="sm" variant="ghost" />
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
