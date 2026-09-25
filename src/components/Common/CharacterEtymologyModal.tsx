import type React from 'react';
import { X, Volume2, Sparkles, BookOpen, Layers } from 'lucide-react';
import { getCharacterEtymology } from '../../data/etymologyData';
import { speakChinese, playSoundEffect } from '../../utils/speech';

interface CharacterEtymologyModalProps {
  char: string;
  onClose: () => void;
}

export const CharacterEtymologyModal: React.FC<CharacterEtymologyModalProps> = ({ char, onClose }) => {
  const data = getCharacterEtymology(char);

  const handleSpeak = (text: string) => {
    playSoundEffect('click');
    speakChinese(text, 1.0);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-fade-in">
      <div className="relative w-full max-w-lg bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-2xl p-6 sm:p-8 space-y-5 animate-scale-up overflow-hidden">
        {/* Background Oriental Watermark */}
        <div className="absolute right-[-10px] top-[-10px] font-calligraphy text-9xl text-stone-100 dark:text-stone-800/60 pointer-events-none select-none opacity-40">
          {data.char}
        </div>

        {/* Header Bar */}
        <div className="flex items-center justify-between relative z-10">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-xl bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-300 font-bold text-xs flex items-center gap-1">
              <Sparkles size={14} />
              <span>Chiết Tự & Bộ Thủ Chữ Hán</span>
            </span>
          </div>

          <button
            onClick={() => {
              playSoundEffect('click');
              onClose();
            }}
            className="p-2 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-500 hover:text-stone-900 dark:hover:text-white transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Character Card Big */}
        <div className="p-5 rounded-2xl bg-gradient-to-tr from-amber-500/10 via-red-500/10 to-transparent border border-red-200/60 dark:border-red-900/60 flex items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-red-600 to-amber-600 text-white flex items-center justify-center font-chinese text-5xl font-black shadow-md shadow-red-500/20">
              {data.char}
            </div>

            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-xl font-black text-red-600 dark:text-red-400 font-sans">
                  {data.pinyin}
                </span>
                {data.sinoVietnamese && data.sinoVietnamese !== '—' && (
                  <span className="text-xs font-bold text-stone-500 dark:text-stone-400">
                    (Hán-Việt: {data.sinoVietnamese})
                  </span>
                )}
              </div>
              <div className="text-base font-bold text-stone-900 dark:text-white mt-0.5">
                {data.meaning}
              </div>
              <span className="text-[11px] text-stone-400 font-semibold">
                Tổng số nét: {data.strokeCount} nét
              </span>
            </div>
          </div>

          <button
            onClick={() => handleSpeak(data.char)}
            className="p-3 rounded-2xl bg-red-600 hover:bg-red-700 text-white shadow-md transition-all active:scale-95 cursor-pointer shrink-0"
            title="Nghe phát âm"
          >
            <Volume2 size={20} />
          </button>
        </div>

        {/* Radicals Breakdown Section */}
        <div className="space-y-2 relative z-10">
          <span className="text-xs font-bold uppercase tracking-wider text-stone-400 flex items-center gap-1.5">
            <Layers size={14} />
            <span>Bộ Thủ Cấu Thành:</span>
          </span>

          <div className="grid grid-cols-2 gap-2.5">
            {data.radicals.map((rad, idx) => (
              <div
                key={idx}
                className="p-3 rounded-2xl bg-stone-50 dark:bg-stone-800/80 border border-stone-200/80 dark:border-stone-700/80 flex items-center gap-3"
              >
                <span className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 font-chinese text-2xl font-bold flex items-center justify-center shrink-0">
                  {rad.radical}
                </span>
                <div className="min-w-0">
                  <span className="text-xs font-bold block text-stone-900 dark:text-white truncate">
                    {rad.name}
                  </span>
                  <span className="text-[11px] text-stone-500 dark:text-stone-400 truncate block">
                    {rad.meaning}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Mnemonic Story Box */}
        <div className="p-4 rounded-2xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/60 space-y-1 relative z-10">
          <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800 dark:text-amber-400 flex items-center gap-1">
            <BookOpen size={13} />
            <span>Mẹo Nhớ Chiết Tự:</span>
          </span>
          <p className="text-xs sm:text-sm font-medium text-stone-800 dark:text-stone-200 leading-relaxed">
            {data.mnemonic}
          </p>
        </div>

        {/* Related Compound Words */}
        {data.words.length > 0 && (
          <div className="space-y-2 relative z-10">
            <span className="text-xs font-bold uppercase tracking-wider text-stone-400 block">
              Từ Ghép Thường Dùng:
            </span>
            <div className="flex flex-wrap gap-2">
              {data.words.map((w, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSpeak(w.hanzi)}
                  className="px-3 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <span className="font-chinese text-sm">{w.hanzi}</span>
                  {w.pinyin && <span className="text-[10px] text-red-500 font-normal">({w.pinyin})</span>}
                  <span className="text-stone-400 font-normal">— {w.meaning}</span>
                  <Volume2 size={12} className="text-stone-400" />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
