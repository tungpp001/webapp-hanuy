import type React from 'react';
import { useState, useEffect } from 'react';
import { 
  Award, 
  CheckCircle2, 
  XCircle, 
  RotateCcw, 
  ArrowLeft, 
  Volume2, 
  BookOpen
} from 'lucide-react';
import confetti from 'canvas-confetti';
import type { HSKExamPaper, UserExamResult } from '../../types/hskExam';
import { speakChinese, playSoundEffect } from '../../utils/speech';
import { addXP } from '../../utils/storage';

interface HSKExamResultProps {
  exam: HSKExamPaper;
  result: UserExamResult;
  onRetake: () => void;
  onBackToList: () => void;
}

export const HSKExamResult: React.FC<HSKExamResultProps> = ({
  exam,
  result,
  onRetake,
  onBackToList,
}) => {
  const [filterMode, setFilterMode] = useState<'all' | 'incorrect' | 'correct'>('all');

  useEffect(() => {
    if (result.isPassed) {
      playSoundEffect('streak');
      addXP(100);
      try {
        confetti({
          particleCount: 100,
          spread: 80,
          origin: { y: 0.6 },
        });
      } catch (e) {
        console.warn('Confetti error', e);
      }
    } else {
      playSoundEffect('incorrect');
      addXP(30);
    }
  }, [result.isPassed]);

  const handlePlayAudio = (text?: string) => {
    if (!text) return;
    playSoundEffect('click');
    speakChinese(text, 0.9);
  };

  const filteredQuestions = exam.questions.filter((q) => {
    const isCorrect = result.userAnswers[q.id] === q.correctAnswer;
    if (filterMode === 'incorrect') return !isCorrect;
    if (filterMode === 'correct') return isCorrect;
    return true;
  });

  const minutesSpent = Math.floor(result.timeSpentSeconds / 60);
  const secondsSpent = result.timeSpentSeconds % 60;

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in pb-24">
      {/* Top Banner / Certificate */}
      <div className={`p-6 sm:p-10 rounded-3xl border text-white shadow-xl relative overflow-hidden ${
        result.isPassed
          ? 'bg-gradient-to-r from-emerald-800 via-teal-700 to-emerald-600 border-emerald-500/40'
          : 'bg-gradient-to-r from-stone-800 via-stone-900 to-red-900 border-red-500/40'
      }`}>
        <div className="relative z-10 max-w-2xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-bold">
            <Award size={14} className="text-amber-300" />
            Bảng Điểm Thi Thử HSK Quốc Tế • {exam.level}
          </div>

          <div>
            <h1 className="text-2xl sm:text-4xl font-black tracking-tight">
              {result.isPassed ? '🎉 CHÚC MỪNG! BẠN ĐÃ ĐỖ (合格)' : 'CHƯA ĐẠT (未合格) - CỐ GẮNG LÊN!'}
            </h1>
            <p className="text-stone-100 text-xs sm:text-sm mt-1">
              {result.isPassed 
                ? `Bạn đã xuất sắc vượt qua điểm chuẩn (${exam.passScore}đ) của kỳ thi thử ${exam.level}.`
                : `Điểm số của bạn chưa đạt mức điểm chuẩn (${exam.passScore}đ). Hãy xem lại các câu sai bên dưới và luyện tập thêm nhé!`}
            </p>
          </div>

          {/* Score breakdown cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            <div className="p-3.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15">
              <span className="text-[11px] uppercase tracking-wider text-stone-200 block mb-0.5 font-bold">
                Tổng Điểm
              </span>
              <div className="text-2xl sm:text-3xl font-black text-amber-300">
                {result.totalScore} <span className="text-sm font-normal text-white">/{result.maxScore}</span>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15">
              <span className="text-[11px] uppercase tracking-wider text-stone-200 block mb-0.5 font-bold">
                🎧 Nghe Hiểu
              </span>
              <div className="text-xl sm:text-2xl font-black">
                {result.sectionScores.listening.score} <span className="text-xs font-normal opacity-80">/{result.sectionScores.listening.max}</span>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15">
              <span className="text-[11px] uppercase tracking-wider text-stone-200 block mb-0.5 font-bold">
                📖 Đọc Hiểu
              </span>
              <div className="text-xl sm:text-2xl font-black">
                {result.sectionScores.reading.score} <span className="text-xs font-normal opacity-80">/{result.sectionScores.reading.max}</span>
              </div>
            </div>

            {result.sectionScores.writing ? (
              <div className="p-3.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15">
                <span className="text-[11px] uppercase tracking-wider text-stone-200 block mb-0.5 font-bold">
                  ✍️ Viết / Sắp Xếp
                </span>
                <div className="text-xl sm:text-2xl font-black">
                  {result.sectionScores.writing.score} <span className="text-xs font-normal opacity-80">/{result.sectionScores.writing.max}</span>
                </div>
              </div>
            ) : (
              <div className="p-3.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15">
                <span className="text-[11px] uppercase tracking-wider text-stone-200 block mb-0.5 font-bold">
                  ⏱️ Thời Gian
                </span>
                <div className="text-xl sm:text-2xl font-black">
                  {minutesSpent}p {secondsSpent}s
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="absolute right-4 bottom-[-15px] select-none pointer-events-none opacity-15 font-calligraphy text-9xl sm:text-[160px] text-white">
          成绩
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <button
          onClick={onBackToList}
          className="w-full sm:w-auto px-5 py-2.5 rounded-2xl border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2"
        >
          <ArrowLeft size={16} />
          <span>Danh sách đề thi</span>
        </button>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={onRetake}
            className="flex-1 sm:flex-none px-6 py-2.5 rounded-2xl bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-700 hover:to-amber-700 text-white font-bold text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-1.5"
          >
            <RotateCcw size={16} />
            <span>Thi lại đề này</span>
          </button>
        </div>
      </div>

      {/* Review Section */}
      <div className="space-y-4 pt-4 border-t border-stone-200 dark:border-stone-800">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h3 className="text-lg font-bold text-stone-900 dark:text-white flex items-center gap-2">
            <BookOpen size={20} className="text-red-500" />
            <span>Xem Lại Chi Tiết Từng Câu Hỏi ({exam.questions.length})</span>
          </h3>

          {/* Filter options */}
          <div className="flex items-center gap-1 bg-stone-100 dark:bg-stone-800 p-1 rounded-xl">
            <button
              onClick={() => setFilterMode('all')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                filterMode === 'all'
                  ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-white shadow-xs'
                  : 'text-stone-500 hover:text-stone-900'
              }`}
            >
              Tất cả
            </button>
            <button
              onClick={() => setFilterMode('incorrect')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                filterMode === 'incorrect'
                  ? 'bg-red-500 text-white shadow-xs'
                  : 'text-stone-500 hover:text-red-500'
              }`}
            >
              Câu làm sai
            </button>
            <button
              onClick={() => setFilterMode('correct')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                filterMode === 'correct'
                  ? 'bg-emerald-500 text-white shadow-xs'
                  : 'text-stone-500 hover:text-emerald-500'
              }`}
            >
              Câu làm đúng
            </button>
          </div>
        </div>

        {/* Question Review Cards */}
        <div className="space-y-4">
          {filteredQuestions.map((q, idx) => {
            const userAns = result.userAnswers[q.id];
            const isCorrect = userAns === q.correctAnswer;

            return (
              <div
                key={q.id}
                className={`p-5 sm:p-6 rounded-3xl border transition-all ${
                  isCorrect
                    ? 'bg-white dark:bg-stone-900 border-emerald-200 dark:border-emerald-900/50 shadow-xs'
                    : 'bg-red-50/40 dark:bg-stone-900 border-red-200 dark:border-red-900/50 shadow-xs'
                }`}
              >
                {/* Header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded-lg bg-stone-100 dark:bg-stone-800 text-stone-800 dark:text-stone-200 text-xs font-extrabold flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <span className="text-xs font-bold uppercase text-stone-400">
                      {q.section === 'listening' ? '🎧 Nghe' : q.section === 'reading' ? '📖 Đọc' : '✍️ Viết'}
                    </span>
                  </div>

                  <span className={`flex items-center gap-1 text-xs font-bold px-2.5 py-0.5 rounded-full ${
                    isCorrect
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                      : 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300'
                  }`}>
                    {isCorrect ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
                    <span>{isCorrect ? `Đúng (+${q.points}đ)` : 'Sai (0đ)'}</span>
                  </span>
                </div>

                {/* Audio Button if listening question */}
                {q.audioText && (
                  <div className="flex items-center gap-2 p-2.5 rounded-xl bg-stone-50 dark:bg-stone-800/80 mb-3">
                    <button
                      onClick={() => handlePlayAudio(q.audioText)}
                      className="p-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors"
                      title="Nghe lại câu thoại"
                    >
                      <Volume2 size={16} />
                    </button>
                    <div className="text-xs text-stone-700 dark:text-stone-300 font-chinese">
                      "{q.audioText}" {q.audioPinyin && <span className="text-stone-400">({q.audioPinyin})</span>}
                    </div>
                  </div>
                )}

                {/* Question Prompt */}
                <div className="text-sm sm:text-base font-bold font-chinese text-stone-900 dark:text-white mb-3">
                  {q.prompt}
                </div>

                {/* User Answer vs Correct Answer Box */}
                <div className="p-3.5 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200/60 dark:border-stone-700/60 text-xs space-y-1.5 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-stone-500">Lựa chọn của bạn:</span>
                    <span className={`font-bold ${isCorrect ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                      {userAns || 'Chưa trả lời'}
                    </span>
                  </div>

                  {!isCorrect && (
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-stone-500">Đáp án chính xác:</span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">
                        {q.correctAnswer}
                      </span>
                    </div>
                  )}
                </div>

                {/* Detailed Explanation */}
                <div className="p-3.5 rounded-2xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40 text-xs text-stone-700 dark:text-stone-300 space-y-1">
                  <span className="font-bold text-amber-800 dark:text-amber-300 block">
                    💡 Giải thích chi tiết:
                  </span>
                  <p className="leading-relaxed">
                    {q.explanation}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
