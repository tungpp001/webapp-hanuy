import type React from 'react';
import { useState } from 'react';
import { Volume2, CheckCircle2, XCircle, Music } from 'lucide-react';
import { PINYIN_INITIALS, PINYIN_FINALS, TONES_GUIDE, TONE_QUIZ_ITEMS } from '../../data/pinyinData';
import { AudioButton } from '../Common/AudioButton';
import { speakChinese, playSoundEffect } from '../../utils/speech';
import { addXP } from '../../utils/storage';
import { CelebrationModal } from '../Common/CelebrationModal';

export const ToneMaster: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'quiz' | 'tones' | 'pinyin'>('quiz');

  // Quiz State
  const [quizIndex, setQuizIndex] = useState(0);
  const [selectedTone, setSelectedTone] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [showCelebration, setShowCelebration] = useState(false);

  const currentQuiz = TONE_QUIZ_ITEMS[quizIndex];

  const handlePlayQuizAudio = () => {
    playSoundEffect('click');
    speakChinese(currentQuiz.character, 0.85);
  };

  const handleSelectTone = (tone: number) => {
    if (isAnswered) return;

    setSelectedTone(tone);
    setIsAnswered(true);

    const isCorrect = tone === currentQuiz.correctTone;
    if (isCorrect) {
      playSoundEffect('correct');
      setScore(prev => prev + 1);
      setStreak(prev => prev + 1);
      addXP(15);
    } else {
      playSoundEffect('incorrect');
      setStreak(0);
    }
  };

  const handleNextQuiz = () => {
    playSoundEffect('click');
    if (quizIndex < TONE_QUIZ_ITEMS.length - 1) {
      setQuizIndex(prev => prev + 1);
      setSelectedTone(null);
      setIsAnswered(false);
    } else {
      setShowCelebration(true);
    }
  };

  const handleRestartQuiz = () => {
    setQuizIndex(0);
    setSelectedTone(null);
    setIsAnswered(false);
    setScore(0);
    setStreak(0);
    setShowCelebration(false);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in pb-20">
      {/* Header Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-amber-600 via-orange-600 to-red-600 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10 max-w-xl">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-white text-xs font-bold mb-3">
            <Music size={14} className="text-amber-200" />
            Luyện Tai & Phát Âm Pinyin Chuẩn
          </span>
          <h1 className="text-2xl sm:text-3xl font-black mb-2 tracking-tight">
            Chinh Phục 4 Thanh Điệu Tiếng Trung
          </h1>
          <p className="text-stone-100 text-xs sm:text-sm leading-relaxed">
            Thanh điệu là yếu tố quan trọng nhất để người bản xứ hiểu đúng nghĩa. Luyện phân biệt thanh 1, 2, 3, 4 ngay tại đây!
          </p>
        </div>
        <div className="absolute right-4 bottom-[-10px] select-none pointer-events-none opacity-15 font-calligraphy text-9xl text-white">
          声调
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 p-1.5 bg-stone-100 dark:bg-stone-800 rounded-2xl max-w-md mx-auto">
        <button
          onClick={() => setActiveTab('quiz')}
          className={`flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
            activeTab === 'quiz'
              ? 'bg-red-600 text-white shadow-sm'
              : 'text-stone-600 dark:text-stone-300 hover:text-stone-900'
          }`}
        >
          🎮 Game Luyện Tai
        </button>
        <button
          onClick={() => setActiveTab('tones')}
          className={`flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
            activeTab === 'tones'
              ? 'bg-red-600 text-white shadow-sm'
              : 'text-stone-600 dark:text-stone-300 hover:text-stone-900'
          }`}
        >
          📈 Biểu Đồ 4 Thanh
        </button>
        <button
          onClick={() => setActiveTab('pinyin')}
          className={`flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
            activeTab === 'pinyin'
              ? 'bg-red-600 text-white shadow-sm'
              : 'text-stone-600 dark:text-stone-300 hover:text-stone-900'
          }`}
        >
          🔤 Bảng Pinyin
        </button>
      </div>

      {/* TAB 1: TONE QUIZ GAME */}
      {activeTab === 'quiz' && (
        <div className="bg-white dark:bg-stone-900 rounded-3xl p-6 sm:p-8 border border-stone-200 dark:border-stone-800 shadow-md space-y-6">
          {/* Quiz Top bar */}
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-stone-400">
              Câu {quizIndex + 1} / {TONE_QUIZ_ITEMS.length}
            </span>
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300">
                🔥 Streak: {streak}
              </span>
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-red-100 dark:bg-red-950 text-red-600 dark:text-red-300">
                ⭐ Điểm: {score}/{TONE_QUIZ_ITEMS.length}
              </span>
            </div>
          </div>

          {/* Listening Card */}
          <div className="text-center py-6 px-4 rounded-3xl bg-gradient-to-b from-stone-50 to-red-50/30 dark:from-stone-800/60 dark:to-stone-800/20 border border-stone-200/80 dark:border-stone-700 space-y-4">
            <p className="text-xs sm:text-sm font-bold text-stone-600 dark:text-stone-400 uppercase tracking-wider">
              Nhấn nút loa để nghe âm thanh và đoán xem từ này mang thanh mấy:
            </p>

            <button
              onClick={handlePlayQuizAudio}
              className="group relative p-6 rounded-full bg-gradient-to-tr from-red-600 to-amber-500 text-white shadow-xl shadow-red-500/30 hover:scale-110 active:scale-95 transition-all duration-200 inline-flex items-center justify-center"
            >
              <Volume2 size={42} className="group-hover:animate-bounce-subtle" />
            </button>

            <div>
              <span className="text-3xl sm:text-4xl font-black font-chinese text-stone-900 dark:text-white">
                {currentQuiz.character}
              </span>
              <div className="text-xs text-amber-700 dark:text-amber-400 font-semibold mt-1">
                Hán-Việt: {currentQuiz.sinoVietnamese} ({currentQuiz.meaning})
              </div>
            </div>
          </div>

          {/* 4 Tone Selection Options */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[1, 2, 3, 4].map((t) => {
              const isSelected = selectedTone === t;
              const isCorrectAnswer = currentQuiz.correctTone === t;

              let btnStyle = 'bg-stone-50 dark:bg-stone-800 border-stone-200 dark:border-stone-700 hover:border-red-400 text-stone-800 dark:text-stone-200';
              if (isAnswered) {
                if (isCorrectAnswer) {
                  btnStyle = 'bg-emerald-500 text-white border-emerald-500 shadow-md scale-102';
                } else if (isSelected && !isCorrectAnswer) {
                  btnStyle = 'bg-red-500 text-white border-red-500 shadow-md';
                } else {
                  btnStyle = 'opacity-40 bg-stone-100 dark:bg-stone-800 text-stone-400 border-transparent';
                }
              }

              const toneLabels: Record<number, { title: string; symbol: string; pitch: string }> = {
                1: { title: 'Thanh 1', symbol: '¯ (Cao phẳng)', pitch: '5-5' },
                2: { title: 'Thanh 2', symbol: 'ˊ (Dấu sắc)', pitch: '3-5' },
                3: { title: 'Thanh 3', symbol: 'ˇ (Dấu hỏi trầm)', pitch: '2-1-4' },
                4: { title: 'Thanh 4', symbol: 'ˋ (Rơi dứt khoát)', pitch: '5-1' },
              };

              return (
                <button
                  key={t}
                  onClick={() => handleSelectTone(t)}
                  disabled={isAnswered}
                  className={`p-4 rounded-2xl border-2 text-center transition-all duration-200 cursor-pointer flex flex-col items-center justify-center ${btnStyle}`}
                >
                  <span className="text-xl sm:text-2xl font-black mb-1">
                    {toneLabels[t].title}
                  </span>
                  <span className="text-xs font-semibold opacity-90">
                    {toneLabels[t].symbol}
                  </span>
                  <span className="text-[11px] font-mono opacity-70 mt-1">
                    {toneLabels[t].pitch}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Explanation & Next Step */}
          {isAnswered && (
            <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700 flex flex-col sm:flex-row items-center justify-between gap-3 animate-fade-in">
              <div className="flex items-center gap-3">
                {selectedTone === currentQuiz.correctTone ? (
                  <CheckCircle2 size={24} className="text-emerald-500 shrink-0" />
                ) : (
                  <XCircle size={24} className="text-red-500 shrink-0" />
                )}
                <div>
                  <div className="text-sm font-bold text-stone-900 dark:text-white">
                    Phiên âm đúng: <span className="text-red-600 dark:text-red-400 font-bold">{currentQuiz.pinyinWithTone}</span>
                  </div>
                  <div className="text-xs text-stone-500 dark:text-stone-400">
                    {currentQuiz.tip}
                  </div>
                </div>
              </div>

              <button
                onClick={handleNextQuiz}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-stone-900 dark:bg-white text-white dark:text-stone-900 font-bold text-xs hover:opacity-90 transition-opacity"
              >
                {quizIndex < TONE_QUIZ_ITEMS.length - 1 ? 'Câu tiếp theo →' : 'Xem kết quả'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: TONE GUIDE & PITCH VISUALIZER */}
      {activeTab === 'tones' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {TONES_GUIDE.map((tone) => (
              <div
                key={tone.toneNumber}
                className="p-5 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-sm space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-950 text-red-600 dark:text-red-300">
                      {tone.pitch}
                    </span>
                    <h3 className="text-lg font-bold text-stone-900 dark:text-white mt-1">
                      {tone.name}
                    </h3>
                  </div>
                  <div className="text-2xl font-black text-amber-600 dark:text-amber-400 font-mono">
                    {tone.mark}
                  </div>
                </div>

                <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-300 leading-relaxed">
                  {tone.description}
                </p>

                <div className="p-3 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200/60 dark:border-stone-700 text-xs">
                  <div className="text-stone-500 dark:text-stone-400 font-medium">
                    💡 Mẹo liên hệ tiếng Việt:
                  </div>
                  <div className="font-semibold text-stone-800 dark:text-stone-200 mt-0.5">
                    {tone.vietnameseAnalogy}
                  </div>
                </div>

                <div className="pt-2 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between">
                  <span className="text-xs font-bold text-stone-700 dark:text-stone-300">
                    Ví dụ: {tone.example}
                  </span>
                  <AudioButton text={tone.example.split(' ')[0]} size="sm" variant="ghost" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: PINYIN TABLE */}
      {activeTab === 'pinyin' && (
        <div className="space-y-6">
          {/* Thanh Mẫu (Initials) */}
          <div className="bg-white dark:bg-stone-900 rounded-3xl p-6 border border-stone-200 dark:border-stone-800 shadow-sm">
            <h3 className="text-base font-bold text-stone-900 dark:text-white mb-1">
              Bảng 23 Thanh Mẫu (Phụ âm đầu)
            </h3>
            <p className="text-xs text-stone-500 mb-4">
              Nhấn vào từng âm để nghe cách phát âm và xem lưu ý khẩu hình miệng:
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {PINYIN_INITIALS.map((init, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200/80 dark:border-stone-700 flex flex-col justify-between"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-xl font-extrabold text-red-600 dark:text-red-400">
                        {init.letter}
                      </span>
                      <span className="text-xs text-stone-400 ml-1">({init.pinyin})</span>
                    </div>
                    <AudioButton text={init.exampleWord} size="sm" variant="ghost" />
                  </div>
                  <div className="text-[11px] text-stone-600 dark:text-stone-300 mt-2 font-medium">
                    {init.vietnameseApproximation}
                  </div>
                  <div className="text-[10px] text-stone-400 mt-1">
                    VD: {init.exampleWord} ({init.examplePinyin}) - {init.exampleMeaning}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Vận Mẫu (Finals) */}
          <div className="bg-white dark:bg-stone-900 rounded-3xl p-6 border border-stone-200 dark:border-stone-800 shadow-sm">
            <h3 className="text-base font-bold text-stone-900 dark:text-white mb-1">
              Bảng Vận Mẫu Thông Dụng (Nguyên âm)
            </h3>
            <p className="text-xs text-stone-500 mb-4">
              Các nguyên âm đơn, nguyên âm kép và nguyên âm mũi:
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {PINYIN_FINALS.map((fin, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200/80 dark:border-stone-700 flex flex-col justify-between"
                >
                  <div className="flex items-start justify-between">
                    <span className="text-lg font-bold text-amber-600 dark:text-amber-400">
                      {fin.letter}
                    </span>
                    <AudioButton text={fin.exampleWord} size="sm" variant="ghost" />
                  </div>
                  <div className="text-[11px] text-stone-600 dark:text-stone-300 mt-1 font-medium">
                    {fin.vietnameseApproximation}
                  </div>
                  <div className="text-[10px] text-stone-400 mt-1">
                    VD: {fin.exampleWord} ({fin.exampleMeaning})
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Completion Modal */}
      <CelebrationModal
        isOpen={showCelebration}
        title="Xuất Sắc! Hoàn Thành Luyện Tai 🎉"
        subtitle={`Bạn đã đạt được ${score}/${TONE_QUIZ_ITEMS.length} câu đúng trong phần luyện thanh điệu.`}
        score={Math.round((score / TONE_QUIZ_ITEMS.length) * 100)}
        xpGained={50}
        onClose={() => setShowCelebration(false)}
        onRestart={handleRestartQuiz}
        actionText="Tiếp tục học"
      />
    </div>
  );
};
