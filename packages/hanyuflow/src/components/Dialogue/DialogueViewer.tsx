import type React from 'react';
import { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Play, 
  Square, 
  Mic2, 
  Sparkles
} from 'lucide-react';
import type { Dialogue, WordBreakdown } from '../../types/chinese';
import { AudioButton } from '../Common/AudioButton';
import { WordModal } from './WordModal';
import { GrammarPointsCard } from './GrammarPointsCard';
import { speakChinese, stopSpeaking, playSoundEffect } from '../../utils/speech';
import { markDialogueCompleted } from '../../utils/storage';

interface DialogueViewerProps {
  dialogue: Dialogue;
  onBack: () => void;
  onStartRoleplay: () => void;
  onProgressUpdate?: () => void;
}

export const DialogueViewer: React.FC<DialogueViewerProps> = ({
  dialogue,
  onBack,
  onStartRoleplay,
  onProgressUpdate,
}) => {
  // Display visibility toggles
  const [showPinyin, setShowPinyin] = useState(true);
  const [showSinoVietnamese, setShowSinoVietnamese] = useState(true);
  const [showTranslation, setShowTranslation] = useState(true);
  const [globalSpeed, setGlobalSpeed] = useState<0.75 | 1.0 | 1.25>(1.0);
  
  // Audio playback state
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
  const [activePlayingIndex, setActivePlayingIndex] = useState<number | null>(null);

  // Selected word for modal
  const [selectedWord, setSelectedWord] = useState<WordBreakdown | null>(null);

  // Active tab: 'dialogue' | 'grammar' | 'vocab'
  const [activeTab, setActiveTab] = useState<'dialogue' | 'grammar' | 'vocab'>('dialogue');

  // Handle auto-playing the entire dialogue sequentially
  useEffect(() => {
    let timeoutId: number;

    const playSequentialLine = (index: number) => {
      if (index >= dialogue.lines.length) {
        setIsAutoPlaying(false);
        setActivePlayingIndex(null);
        // Mark completed and award XP
        markDialogueCompleted(dialogue.id);
        onProgressUpdate?.();
        return;
      }

      setActivePlayingIndex(index);
      const line = dialogue.lines[index];
      speakChinese(line.hanzi, globalSpeed, () => {
        // Small pause between speakers
        timeoutId = window.setTimeout(() => {
          playSequentialLine(index + 1);
        }, 900);
      });
    };

    if (isAutoPlaying) {
      playSequentialLine(0);
    } else {
      stopSpeaking();
      setActivePlayingIndex(null);
    }

    return () => {
      clearTimeout(timeoutId);
      stopSpeaking();
    };
  }, [isAutoPlaying, dialogue, globalSpeed]);

  const toggleAutoPlay = () => {
    playSoundEffect('click');
    setIsAutoPlaying(!isAutoPlaying);
  };

  const handleWordClick = (word: WordBreakdown) => {
    playSoundEffect('click');
    setSelectedWord(word);
  };

  // Collect all unique words in dialogue for vocabulary tab
  const allVocab = dialogue.lines.flatMap(l => l.words);
  const uniqueVocab = Array.from(new Map(allVocab.map(w => [w.hanzi, w])).values());

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20 animate-fade-in">
      {/* Top Bar Navigation & Info */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 sm:p-6 bg-white dark:bg-stone-900 rounded-3xl border border-stone-200/80 dark:border-stone-800 shadow-sm">
        <div className="flex items-start gap-3 sm:gap-4">
          <button
            onClick={onBack}
            className="p-2.5 rounded-2xl border border-stone-200 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300 transition-colors mt-0.5"
            title="Quay lại danh sách bài học"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="text-2xl">{dialogue.icon}</span>
              <h1 className="text-xl sm:text-2xl font-black text-stone-900 dark:text-white">
                {dialogue.title}
              </h1>
              <span className="px-2.5 py-0.5 rounded-full bg-red-100 dark:bg-red-950/70 text-red-700 dark:text-red-300 text-xs font-bold">
                {dialogue.level}
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs sm:text-sm text-stone-500 dark:text-stone-400">
              <span className="font-chinese font-semibold text-stone-800 dark:text-stone-200">{dialogue.titleCn}</span>
              <span>•</span>
              <span>{dialogue.pinyin}</span>
              <span className="hidden sm:inline">•</span>
              <span className="hidden sm:inline">({dialogue.sinoVietnamese})</span>
            </div>
          </div>
        </div>

        {/* Roleplay CTA Button */}
        <button
          onClick={onStartRoleplay}
          className="flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-700 hover:to-amber-700 text-white font-bold text-sm shadow-md hover:shadow-xl hover:scale-105 active:scale-95 transition-all duration-200 shrink-0"
        >
          <Mic2 size={18} className="animate-pulse" />
          <span>Luyện Nói AI (Roleplay)</span>
        </button>
      </div>

      {/* Tabs & Toolbar Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 bg-stone-100/90 dark:bg-stone-800/90 backdrop-blur-md rounded-2xl border border-stone-200/80 dark:border-stone-700 sticky top-4 z-20 shadow-sm">
        {/* Study Tabs */}
        <div className="flex items-center gap-1 bg-white/70 dark:bg-stone-900/70 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('dialogue')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'dialogue'
                ? 'bg-red-600 text-white shadow-xs'
                : 'text-stone-600 dark:text-stone-300 hover:text-stone-900'
            }`}
          >
            Hội Thoại ({dialogue.lines.length})
          </button>
          <button
            onClick={() => setActiveTab('grammar')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'grammar'
                ? 'bg-red-600 text-white shadow-xs'
                : 'text-stone-600 dark:text-stone-300 hover:text-stone-900'
            }`}
          >
            Ngữ Pháp ({dialogue.grammarPoints.length})
          </button>
          <button
            onClick={() => setActiveTab('vocab')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'vocab'
                ? 'bg-red-600 text-white shadow-xs'
                : 'text-stone-600 dark:text-stone-300 hover:text-stone-900'
            }`}
          >
            Từ Vựng ({uniqueVocab.length})
          </button>
        </div>

        {/* Display Toggles and Auto-play controls */}
        <div className="flex items-center justify-between sm:justify-end gap-1.5 flex-wrap">
          {/* Toggle Pinyin */}
          <button
            onClick={() => setShowPinyin(!showPinyin)}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
              showPinyin 
                ? 'bg-white dark:bg-stone-900 text-red-600 border-red-200 dark:border-red-900 shadow-xs' 
                : 'bg-transparent text-stone-400 border-transparent hover:bg-white/50'
            }`}
            title="Bật/Tắt hiển thị Pinyin"
          >
            Pinyin
          </button>

          {/* Toggle Sino-Vietnamese */}
          <button
            onClick={() => setShowSinoVietnamese(!showSinoVietnamese)}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
              showSinoVietnamese 
                ? 'bg-white dark:bg-stone-900 text-amber-600 border-amber-200 dark:border-amber-900 shadow-xs' 
                : 'bg-transparent text-stone-400 border-transparent hover:bg-white/50'
            }`}
            title="Bật/Tắt Âm Hán-Việt"
          >
            Hán-Việt
          </button>

          {/* Toggle Vietnamese Translation */}
          <button
            onClick={() => setShowTranslation(!showTranslation)}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
              showTranslation 
                ? 'bg-white dark:bg-stone-900 text-emerald-600 border-emerald-200 dark:border-emerald-900 shadow-xs' 
                : 'bg-transparent text-stone-400 border-transparent hover:bg-white/50'
            }`}
            title="Bật/Tắt Dịch nghĩa Tiếng Việt"
          >
            Dịch Nghĩa
          </button>

          {/* Speed Toggle */}
          <button
            onClick={() => {
              const speeds: (0.75 | 1.0 | 1.25)[] = [0.75, 1.0, 1.25];
              const next = speeds[(speeds.indexOf(globalSpeed) + 1) % speeds.length];
              setGlobalSpeed(next);
            }}
            className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-white dark:bg-stone-900 text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-700 hover:bg-stone-50"
            title="Đổi tốc độ đọc toàn bài"
          >
            {globalSpeed}x
          </button>

          {/* Play All Button */}
          <button
            onClick={toggleAutoPlay}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs shadow-xs transition-all ${
              isAutoPlaying
                ? 'bg-red-600 text-white animate-pulse'
                : 'bg-stone-900 dark:bg-white text-white dark:text-stone-900 hover:opacity-90'
            }`}
          >
            {isAutoPlaying ? <Square size={13} fill="currentColor" /> : <Play size={13} fill="currentColor" />}
            <span>{isAutoPlaying ? 'Dừng phát' : 'Nghe Toàn Bài'}</span>
          </button>
        </div>
      </div>

      {/* Main Content Areas */}
      {activeTab === 'dialogue' && (
        <div className="space-y-4">
          <div className="text-xs font-medium text-stone-500 dark:text-stone-400 px-2 flex items-center gap-1.5">
            <Sparkles size={14} className="text-amber-500" />
            <span>Mẹo: Nhấp chuột vào bất kỳ từ tiếng Trung nào bên dưới để tra nghĩa & âm Hán-Việt tức thì!</span>
          </div>

          {dialogue.lines.map((line, index) => {
            const isPlayingThis = activePlayingIndex === index;
            const isRoleA = line.speaker.role === 'A';

            return (
              <div
                key={line.id}
                className={`p-4 sm:p-5 rounded-3xl transition-all duration-300 border ${
                  isPlayingThis
                    ? 'bg-red-50/80 dark:bg-red-950/40 border-red-300 dark:border-red-800 shadow-md ring-2 ring-red-500/20'
                    : isRoleA
                    ? 'bg-white dark:bg-stone-900/90 border-stone-200/80 dark:border-stone-800'
                    : 'bg-gradient-to-r from-amber-50/50 to-orange-50/40 dark:from-stone-900 dark:to-stone-800/80 border-amber-200/60 dark:border-stone-700'
                }`}
              >
                {/* Speaker Header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <span className="text-2xl p-1.5 rounded-2xl bg-stone-100 dark:bg-stone-800 shadow-xs">
                      {line.speaker.avatar}
                    </span>
                    <div>
                      <div className="font-bold text-sm text-stone-800 dark:text-stone-200 flex items-center gap-1.5">
                        <span>{line.speaker.name}</span>
                        <span className="text-xs text-stone-400 font-normal">({line.speaker.nameCn})</span>
                      </div>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                        isRoleA 
                          ? 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300' 
                          : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                      }`}>
                        Vai {line.speaker.role}
                      </span>
                    </div>
                  </div>

                  {/* Line Audio Play Button */}
                  <div className="flex items-center gap-1">
                    <AudioButton
                      text={line.hanzi}
                      speed={globalSpeed}
                      size="md"
                      variant={isPlayingThis ? 'primary' : 'pill'}
                      showSpeedControl
                    />
                  </div>
                </div>

                {/* Main Chinese Sentence with Clickable Words */}
                <div className="my-2.5">
                  <div className="flex flex-wrap items-baseline gap-1.5 sm:gap-2">
                    {line.words && line.words.length > 0 ? (
                      line.words.map((w, wIdx) => (
                        <button
                          key={wIdx}
                          onClick={() => handleWordClick(w)}
                          className="group relative inline-flex flex-col items-center p-1 rounded-xl hover:bg-red-100/70 dark:hover:bg-red-950/60 hover:text-red-700 dark:hover:text-red-300 transition-all cursor-pointer"
                        >
                          {showPinyin && (
                            <span className="text-xs font-semibold text-stone-500 dark:text-stone-400 group-hover:text-red-600 transition-colors">
                              {w.pinyin}
                            </span>
                          )}
                          <span className="text-xl sm:text-2xl font-bold font-chinese tracking-wide text-stone-900 dark:text-stone-100 group-hover:scale-105 transition-transform">
                            {w.hanzi}
                          </span>
                          {showSinoVietnamese && (
                            <span className="text-[11px] font-medium text-amber-700/80 dark:text-amber-400/80">
                              {w.sinoVietnamese}
                            </span>
                          )}
                        </button>
                      ))
                    ) : (
                      <span className="text-xl sm:text-2xl font-bold font-chinese text-stone-900 dark:text-stone-100">
                        {line.hanzi}
                      </span>
                    )}
                  </div>
                </div>

                {/* Translation Line */}
                {showTranslation && (
                  <div className="pt-2 mt-2 border-t border-stone-100 dark:border-stone-800 text-sm font-medium text-stone-700 dark:text-stone-300 flex items-start gap-2">
                    <span className="text-xs font-bold px-1.5 py-0.5 rounded bg-stone-200/60 dark:bg-stone-800 text-stone-600 dark:text-stone-400 shrink-0">
                      Dịch
                    </span>
                    <span>{line.vietnamese}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Grammar Points Tab */}
      {activeTab === 'grammar' && (
        <GrammarPointsCard grammarPoints={dialogue.grammarPoints} />
      )}

      {/* Vocabulary List Tab */}
      {activeTab === 'vocab' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 animate-fade-in">
          {uniqueVocab.map((w, idx) => (
            <div
              key={idx}
              onClick={() => handleWordClick(w)}
              className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 hover:border-red-300 dark:hover:border-red-800 hover:shadow-md transition-all cursor-pointer flex items-center justify-between group"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold font-chinese text-red-600 dark:text-red-400 group-hover:scale-105 transition-transform">
                    {w.hanzi}
                  </span>
                  <span className="text-sm font-semibold text-stone-700 dark:text-stone-300">
                    {w.pinyin}
                  </span>
                </div>
                <div className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">
                  Hán-Việt: {w.sinoVietnamese}
                </div>
                <div className="text-xs font-medium text-stone-800 dark:text-stone-200 mt-1">
                  {w.meaning}
                </div>
              </div>
              <AudioButton text={w.hanzi} size="sm" variant="ghost" />
            </div>
          ))}
        </div>
      )}

      {/* Word Detail Popup Modal */}
      <WordModal
        word={selectedWord}
        onClose={() => setSelectedWord(null)}
      />
    </div>
  );
};
