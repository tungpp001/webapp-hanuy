import type React from 'react';
import { useState } from 'react';
import { Award, Clock, CheckCircle2, XCircle, ArrowRight } from 'lucide-react';
import { HSK_EXAMS } from '../../data/hskExams';
import type { HSKExamPaper, HSKLevel, UserExamResult } from '../../types/hskExam';
import { playSoundEffect } from '../../utils/speech';

interface HSKExamSelectorProps {
  onSelectExam: (exam: HSKExamPaper) => void;
  examHistory: UserExamResult[];
}

export const HSKExamSelector: React.FC<HSKExamSelectorProps> = ({ onSelectExam, examHistory }) => {
  const [selectedLevel, setSelectedLevel] = useState<string>('all');

  const levels = ['all', 'HSK 1', 'HSK 2', 'HSK 3', 'HSK 4'];

  const filteredExams = HSK_EXAMS.filter(
    (exam) => selectedLevel === 'all' || exam.level === selectedLevel
  );

  const handleStart = (exam: HSKExamPaper) => {
    playSoundEffect('click');
    onSelectExam(exam);
  };

  const getLatestResultForExam = (examId: string) => {
    return examHistory.find(h => h.examId === examId);
  };

  const levelColorMap: Record<HSKLevel, { badge: string; border: string; bg: string }> = {
    'HSK 1': { badge: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300', border: 'border-emerald-300', bg: 'from-emerald-500/10' },
    'HSK 2': { badge: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300', border: 'border-blue-300', bg: 'from-blue-500/10' },
    'HSK 3': { badge: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300', border: 'border-amber-300', bg: 'from-amber-500/10' },
    'HSK 4': { badge: 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300', border: 'border-purple-300', bg: 'from-purple-500/10' },
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fade-in pb-20">
      {/* Header Banner */}
      <div className="p-6 sm:p-10 rounded-3xl bg-gradient-to-r from-red-800 via-rose-700 to-amber-700 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-white/20 backdrop-blur-md text-white text-xs font-bold mb-3">
            <Award size={14} className="text-amber-300" />
            Hệ Thống Thi Thử HSK Chuẩn Quốc Tế (汉语水平考试)
          </span>
          <h1 className="text-2xl sm:text-4xl font-black mb-2 tracking-tight">
            Đề Thi Thử HSK Cấp Bậc 1 - 4
          </h1>
          <p className="text-stone-100 text-xs sm:text-base leading-relaxed mb-4">
            Trải nghiệm bài thi chuẩn format quốc tế gồm đầy đủ các phần Nghe Hiểu (听力), Đọc Hiểu (阅读) và Viết (书写) với đồng hồ đếm ngược, chấm điểm tức thì và phân tích giải thích chi tiết.
          </p>
        </div>
        <div className="absolute right-4 bottom-[-20px] select-none pointer-events-none opacity-15 font-calligraphy text-9xl sm:text-[180px] text-white">
          考试
        </div>
      </div>

      {/* Level Filters */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {levels.map((lvl) => (
            <button
              key={lvl}
              onClick={() => setSelectedLevel(lvl)}
              className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all shrink-0 ${
                selectedLevel === lvl
                  ? 'bg-red-600 text-white shadow-md shadow-red-600/30'
                  : 'bg-white dark:bg-stone-900 text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-800 hover:border-red-300'
              }`}
            >
              {lvl === 'all' ? 'Tất cả cấp độ' : lvl}
            </button>
          ))}
        </div>

        <span className="text-xs font-bold text-stone-500">
          Hiển thị {filteredExams.length} đề thi
        </span>
      </div>

      {/* Exam Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredExams.map((exam) => {
          const color = levelColorMap[exam.level];
          const latestResult = getLatestResultForExam(exam.id);

          return (
            <div
              key={exam.id}
              className={`rounded-3xl p-6 bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between relative overflow-hidden group`}
            >
              <div className="space-y-4">
                {/* Top badges */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-xl text-xs font-black ${color.badge}`}>
                      {exam.level}
                    </span>
                    <span className="text-xs text-stone-500 dark:text-stone-400 font-semibold">
                      Yêu cầu ~{exam.vocabRequirement} từ vựng
                    </span>
                  </div>

                  {latestResult && (
                    <span className={`flex items-center gap-1 text-xs font-bold px-2.5 py-0.5 rounded-full ${
                      latestResult.isPassed 
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' 
                        : 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300'
                    }`}>
                      {latestResult.isPassed ? <CheckCircle2 size={13} /> : <XCircle size={13} />}
                      Điểm gần nhất: {latestResult.totalScore}/{latestResult.maxScore}
                    </span>
                  )}
                </div>

                {/* Title and Description */}
                <div>
                  <h3 className="text-lg sm:text-xl font-bold text-stone-900 dark:text-white group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors">
                    {exam.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 mt-1 leading-relaxed">
                    {exam.description}
                  </p>
                </div>

                {/* Sections breakdown pill list */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
                  {exam.sections.map((sec, idx) => (
                    <div key={idx} className="p-2.5 rounded-xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200/60 dark:border-stone-700/60 text-center">
                      <div className="text-xs font-bold text-stone-800 dark:text-stone-200">
                        {sec.title.split(':')[1]?.trim() || sec.title}
                      </div>
                      <div className="text-[11px] text-stone-500 dark:text-stone-400">
                        {sec.questionCount} câu • {sec.points}đ
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bottom bar & CTA */}
              <div className="mt-6 pt-4 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 text-xs text-stone-500 dark:text-stone-400 font-medium">
                  <span className="flex items-center gap-1">
                    <Clock size={14} className="text-red-500" />
                    {exam.durationMinutes} phút
                  </span>
                  <span>•</span>
                  <span>Tổng {exam.totalPoints}đ (Đỗ: {exam.passScore}đ)</span>
                </div>

                <button
                  onClick={() => handleStart(exam)}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-700 hover:to-amber-700 text-white font-bold text-xs shadow-md hover:shadow-lg transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 shrink-0"
                >
                  <span>Bắt đầu thi</span>
                  <ArrowRight size={15} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
