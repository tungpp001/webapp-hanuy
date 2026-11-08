import type React from 'react';
import { useState, useEffect } from 'react';
import { 
  Clock, 
  Flag, 
  ArrowLeft, 
  ArrowRight, 
  CheckCircle2, 
  Volume2, 
  Send,
  AlertTriangle,
  Pause,
  Play
} from 'lucide-react';
import type { HSKExamPaper, HSKQuestion, UserExamResult } from '../../types/hskExam';
import { speakChinese, playSoundEffect } from '../../utils/speech';

interface HSKExamRunnerProps {
  exam: HSKExamPaper;
  onExit: () => void;
  onSubmitExam: (result: UserExamResult) => void;
}

export const HSKExamRunner: React.FC<HSKExamRunnerProps> = ({
  exam,
  onExit,
  onSubmitExam,
}) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({}); // questionId -> answer
  const [flaggedQuestionIds, setFlaggedQuestionIds] = useState<string[]>([]);
  const [timeLeftSeconds, setTimeLeftSeconds] = useState(exam.durationMinutes * 60);
  const [isPaused, setIsPaused] = useState(false);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [sentenceOrderMap, setSentenceOrderMap] = useState<Record<string, string[]>>({}); // questionId -> ordered word IDs

  const currentQuestion: HSKQuestion = exam.questions[currentQuestionIndex];

  // Countdown timer effect
  useEffect(() => {
    if (isPaused || timeLeftSeconds <= 0) return;

    const interval = setInterval(() => {
      setTimeLeftSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          // Auto submit on time out
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isPaused, timeLeftSeconds]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleSelectAnswer = (ans: string) => {
    playSoundEffect('click');
    setUserAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: ans,
    }));
  };

  const toggleFlag = (qId: string) => {
    playSoundEffect('click');
    setFlaggedQuestionIds((prev) =>
      prev.includes(qId) ? prev.filter((id) => id !== qId) : [...prev, qId]
    );
  };

  // Sentence ordering in Writing section
  const handlePickOrderWord = (qId: string, wordId: string) => {
    playSoundEffect('click');
    const currentOrder = sentenceOrderMap[qId] || [];
    if (currentOrder.includes(wordId)) return;

    const newOrder = [...currentOrder, wordId];
    setSentenceOrderMap((prev) => ({ ...prev, [qId]: newOrder }));
    setUserAnswers((prev) => ({ ...prev, [qId]: newOrder.join(',') }));
  };

  const handleRemoveOrderWord = (qId: string, wordId: string) => {
    playSoundEffect('click');
    const currentOrder = sentenceOrderMap[qId] || [];
    const newOrder = currentOrder.filter((id) => id !== wordId);
    setSentenceOrderMap((prev) => ({ ...prev, [qId]: newOrder }));
    setUserAnswers((prev) => ({ ...prev, [qId]: newOrder.join(',') }));
  };

  const handlePlayAudio = (text?: string) => {
    if (!text) return;
    playSoundEffect('click');
    speakChinese(text, 0.9);
  };

  const handleSubmit = () => {
    // Calculate final scores
    let totalScore = 0;
    let listeningScore = 0;
    let listeningMax = 0;
    let readingScore = 0;
    let readingMax = 0;
    let writingScore = 0;
    let writingMax = 0;

    exam.questions.forEach((q) => {
      const userAns = userAnswers[q.id];
      const isCorrect = userAns === q.correctAnswer;

      if (q.section === 'listening') {
        listeningMax += q.points;
        if (isCorrect) listeningScore += q.points;
      } else if (q.section === 'reading') {
        readingMax += q.points;
        if (isCorrect) readingScore += q.points;
      } else if (q.section === 'writing') {
        writingMax += q.points;
        if (isCorrect) writingScore += q.points;
      }

      if (isCorrect) {
        totalScore += q.points;
      }
    });

    const isPassed = totalScore >= exam.passScore;
    const timeSpent = exam.durationMinutes * 60 - timeLeftSeconds;

    const result: UserExamResult = {
      examId: exam.id,
      examTitle: exam.title,
      level: exam.level,
      date: new Date().toLocaleDateString('vi-VN'),
      totalScore,
      maxScore: exam.totalPoints,
      isPassed,
      sectionScores: {
        listening: { score: listeningScore, max: listeningMax },
        reading: { score: readingScore, max: readingMax },
        ...(writingMax > 0 ? { writing: { score: writingScore, max: writingMax } } : {}),
      },
      userAnswers,
      timeSpentSeconds: Math.max(10, timeSpent),
    };

    onSubmitExam(result);
  };

  const answeredCount = Object.keys(userAnswers).length;

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-24 animate-fade-in">
      {/* Top Fixed Control Bar */}
      <div className="sticky top-16 sm:top-20 z-30 bg-white/90 dark:bg-stone-900/90 backdrop-blur-md rounded-3xl p-4 sm:p-5 border border-stone-200 dark:border-stone-800 shadow-md flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onExit}
            className="p-2 rounded-xl border border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
            title="Thoát bài thi"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-lg bg-red-100 dark:bg-red-950 text-red-600 dark:text-red-300 font-bold text-xs">
                {exam.level}
              </span>
              <h2 className="font-bold text-xs sm:text-sm text-stone-900 dark:text-white truncate max-w-[200px] sm:max-w-xs">
                {exam.title}
              </h2>
            </div>
            <span className="text-[11px] text-stone-400">
              Đã làm: {answeredCount}/{exam.questions.length} câu
            </span>
          </div>
        </div>

        {/* Timer & Actions */}
        <div className="flex items-center gap-2.5">
          {/* Countdown Clock */}
          <div className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-2xl border font-mono font-bold text-sm shadow-xs ${
            timeLeftSeconds < 180
              ? 'bg-red-50 dark:bg-red-950/60 border-red-300 text-red-600 animate-pulse'
              : 'bg-stone-100 dark:bg-stone-800 border-stone-200 dark:border-stone-700 text-stone-800 dark:text-stone-200'
          }`}>
            <Clock size={16} className={timeLeftSeconds < 180 ? 'text-red-500' : 'text-stone-500'} />
            <span>{formatTime(timeLeftSeconds)}</span>
          </div>

          <button
            onClick={() => setIsPaused(!isPaused)}
            className="p-2 rounded-xl border border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300 hover:bg-stone-100 transition-colors hidden sm:flex"
            title={isPaused ? 'Tiếp tục làm bài' : 'Tạm dừng bài thi'}
          >
            {isPaused ? <Play size={16} /> : <Pause size={16} />}
          </button>

          {/* Submit Button */}
          <button
            onClick={() => setShowSubmitConfirm(true)}
            className="px-4 sm:px-5 py-2 rounded-xl bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-700 hover:to-amber-700 text-white font-bold text-xs sm:text-sm shadow-md transition-all flex items-center gap-1.5"
          >
            <Send size={14} />
            <span>Nộp bài</span>
          </button>
        </div>
      </div>

      {/* Main Test Layout: Question + Navigator Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {/* Left Column: Current Question Card */}
        <div className="lg:col-span-3 space-y-6">
          <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-sm space-y-6">
            {/* Question Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-800 dark:text-stone-200 font-extrabold text-sm">
                  Câu {currentQuestionIndex + 1}
                </span>
                <span className="text-xs font-bold uppercase text-stone-400">
                  {currentQuestion.section === 'listening' ? '🎧 Nghe Hiểu' : currentQuestion.section === 'reading' ? '📖 Đọc Hiểu' : '✍️ Viết'}
                </span>
              </div>

              {/* Flag Question Toggle */}
              <button
                onClick={() => toggleFlag(currentQuestion.id)}
                className={`flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-xl border transition-all ${
                  flaggedQuestionIds.includes(currentQuestion.id)
                    ? 'bg-amber-50 dark:bg-amber-950/60 border-amber-300 text-amber-600 dark:text-amber-300'
                    : 'text-stone-400 border-stone-200 dark:border-stone-700 hover:bg-stone-50'
                }`}
              >
                <Flag size={14} className={flaggedQuestionIds.includes(currentQuestion.id) ? 'fill-amber-500' : ''} />
                <span>{flaggedQuestionIds.includes(currentQuestion.id) ? 'Đã đánh dấu' : 'Đánh dấu'}</span>
              </button>
            </div>

            {/* Audio Player for Listening Section */}
            {currentQuestion.audioText && (
              <div className="p-5 rounded-2xl bg-gradient-to-r from-red-50 to-orange-50 dark:from-stone-800 dark:to-stone-800/60 border border-red-200 dark:border-stone-700 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handlePlayAudio(currentQuestion.audioText)}
                    className="p-4 rounded-2xl bg-red-600 hover:bg-red-700 text-white shadow-md hover:scale-105 active:scale-95 transition-all flex items-center justify-center"
                    title="Nghe đoạn âm thanh"
                  >
                    <Volume2 size={24} />
                  </button>
                  <div>
                    <div className="text-xs font-bold uppercase tracking-wider text-red-600 dark:text-red-400">
                      Đoạn ghi âm bài thi (听力录音)
                    </div>
                    <div className="text-xs text-stone-500 dark:text-stone-400">
                      Nhấp nút loa để nghe đoạn hội thoại phát âm chuẩn
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Question Prompt Content */}
            <div className="space-y-3">
              {currentQuestion.imageIcon && (
                <div className="text-5xl text-center py-2">
                  {currentQuestion.imageIcon}
                </div>
              )}

              {currentQuestion.promptPinyin && (
                <div className="text-xs text-stone-400 font-medium">
                  {currentQuestion.promptPinyin}
                </div>
              )}

              <h3 className="text-lg sm:text-xl font-bold font-chinese text-stone-900 dark:text-white leading-relaxed">
                {currentQuestion.prompt}
              </h3>
            </div>

            {/* ANSWER CHOICES */}
            {/* 1. TRUE / FALSE TYPE */}
            {currentQuestion.type === 'true-false' && (
              <div className="grid grid-cols-2 gap-4 pt-2">
                <button
                  onClick={() => handleSelectAnswer('true')}
                  className={`p-5 rounded-2xl border-2 font-bold text-base transition-all flex items-center justify-center gap-2 ${
                    userAnswers[currentQuestion.id] === 'true'
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 text-emerald-700 dark:text-emerald-300 shadow-md ring-2 ring-emerald-500/20'
                      : 'bg-stone-50 dark:bg-stone-800 border-stone-200 dark:border-stone-700 hover:border-emerald-300 text-stone-800 dark:text-stone-200'
                  }`}
                >
                  <span className="text-xl">√</span>
                  <span>Đúng (正确)</span>
                </button>

                <button
                  onClick={() => handleSelectAnswer('false')}
                  className={`p-5 rounded-2xl border-2 font-bold text-base transition-all flex items-center justify-center gap-2 ${
                    userAnswers[currentQuestion.id] === 'false'
                      ? 'bg-red-50 dark:bg-red-950/60 border-red-500 text-red-700 dark:text-red-300 shadow-md ring-2 ring-red-500/20'
                      : 'bg-stone-50 dark:bg-stone-800 border-stone-200 dark:border-stone-700 hover:border-red-300 text-stone-800 dark:text-stone-200'
                  }`}
                >
                  <span className="text-xl">×</span>
                  <span>Sai (错误)</span>
                </button>
              </div>
            )}

            {/* 2. MULTIPLE CHOICE TYPE */}
            {currentQuestion.type === 'multiple-choice' && currentQuestion.options && (
              <div className="space-y-3 pt-2">
                {currentQuestion.options.map((opt) => {
                  const isSelected = userAnswers[currentQuestion.id] === opt.id;
                  return (
                    <button
                      key={opt.id}
                      onClick={() => handleSelectAnswer(opt.id)}
                      className={`w-full p-4 rounded-2xl border-2 text-left font-medium text-sm sm:text-base transition-all flex items-center justify-between ${
                        isSelected
                          ? 'bg-red-50 dark:bg-red-950/50 border-red-500 text-red-900 dark:text-red-200 shadow-sm ring-2 ring-red-500/20'
                          : 'bg-stone-50 dark:bg-stone-800/80 border-stone-200 dark:border-stone-700 hover:border-red-300 text-stone-800 dark:text-stone-200'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className={`w-8 h-8 rounded-xl font-bold text-xs flex items-center justify-center uppercase ${
                          isSelected 
                            ? 'bg-red-600 text-white' 
                            : 'bg-stone-200 dark:bg-stone-700 text-stone-600 dark:text-stone-300'
                        }`}>
                          {opt.id}
                        </span>
                        <div>
                          <div className="font-chinese font-semibold text-stone-900 dark:text-white">
                            {opt.text}
                          </div>
                          {opt.pinyin && (
                            <div className="text-xs text-stone-400">
                              {opt.pinyin}
                            </div>
                          )}
                        </div>
                      </div>

                      {isSelected && <CheckCircle2 size={18} className="text-red-600 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            )}

            {/* 3. SENTENCE ORDERING TYPE (WRITING) */}
            {currentQuestion.type === 'sentence-order' && currentQuestion.wordsForOrdering && (
              <div className="space-y-4 pt-2">
                {/* Chosen sentence slots */}
                <div className="min-h-[90px] p-4 rounded-2xl bg-stone-50 dark:bg-stone-800 border-2 border-dashed border-stone-200 dark:border-stone-700 flex flex-wrap items-center gap-2">
                  {(sentenceOrderMap[currentQuestion.id] || []).length === 0 ? (
                    <span className="text-xs text-stone-400 m-auto">
                      Nhấp vào các khối từ bên dưới để sắp xếp vào đây...
                    </span>
                  ) : (
                    (sentenceOrderMap[currentQuestion.id] || []).map((wId) => {
                      const word = currentQuestion.wordsForOrdering?.find((w) => w.id === wId);
                      if (!word) return null;
                      return (
                        <button
                          key={wId}
                          onClick={() => handleRemoveOrderWord(currentQuestion.id, wId)}
                          className="px-4 py-2 rounded-xl bg-white dark:bg-stone-900 border-2 border-red-300 dark:border-red-800 text-stone-900 dark:text-white text-base font-bold font-chinese hover:scale-105 transition-all shadow-xs"
                        >
                          <span className="text-[11px] text-stone-400 block">{word.pinyin}</span>
                          <span>{word.hanzi}</span>
                        </button>
                      );
                    })
                  )}
                </div>

                {/* Available word bank */}
                <div className="flex flex-wrap items-center gap-2">
                  {currentQuestion.wordsForOrdering
                    .filter((w) => !(sentenceOrderMap[currentQuestion.id] || []).includes(w.id))
                    .map((word) => (
                      <button
                        key={word.id}
                        onClick={() => handlePickOrderWord(currentQuestion.id, word.id)}
                        className="px-4 py-2 rounded-xl bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 hover:border-red-400 text-stone-800 dark:text-stone-200 text-base font-bold font-chinese hover:scale-105 transition-all cursor-pointer shadow-2xs"
                      >
                        <span className="text-[11px] text-stone-400 block">{word.pinyin}</span>
                        <span>{word.hanzi}</span>
                      </button>
                    ))}
                </div>
              </div>
            )}

            {/* Bottom Next/Prev Pagination */}
            <div className="pt-6 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between">
              <button
                onClick={() => {
                  playSoundEffect('click');
                  setCurrentQuestionIndex((prev) => Math.max(0, prev - 1));
                }}
                disabled={currentQuestionIndex === 0}
                className="px-4 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 disabled:opacity-30 font-bold text-xs flex items-center gap-1.5"
              >
                <ArrowLeft size={15} />
                <span>Câu trước</span>
              </button>

              <button
                onClick={() => {
                  playSoundEffect('click');
                  setCurrentQuestionIndex((prev) => Math.min(exam.questions.length - 1, prev + 1));
                }}
                disabled={currentQuestionIndex === exam.questions.length - 1}
                className="px-5 py-2.5 rounded-xl bg-stone-900 dark:bg-white text-white dark:text-stone-900 disabled:opacity-30 font-bold text-xs flex items-center gap-1.5"
              >
                <span>Câu tiếp theo</span>
                <ArrowRight size={15} />
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Question Navigator Grid */}
        <div className="lg:col-span-1 p-5 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-sm space-y-4">
          <h4 className="font-bold text-sm text-stone-900 dark:text-white">
            Danh Sách Câu Hỏi ({exam.questions.length})
          </h4>

          {/* Color Legend */}
          <div className="grid grid-cols-2 gap-2 text-[11px] text-stone-500 dark:text-stone-400 pb-2 border-b border-stone-100 dark:border-stone-800">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-red-600"></span>
              <span>Đã làm</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-stone-200 dark:bg-stone-700"></span>
              <span>Chưa làm</span>
            </div>
            <div className="flex items-center gap-1.5 col-span-2">
              <span className="w-3 h-3 rounded-full bg-amber-500"></span>
              <span>Đã cắm cờ (Flag)</span>
            </div>
          </div>

          {/* Question Grid Buttons */}
          <div className="grid grid-cols-5 gap-2">
            {exam.questions.map((q, idx) => {
              const isAnswered = !!userAnswers[q.id];
              const isFlagged = flaggedQuestionIds.includes(q.id);
              const isCurrent = currentQuestionIndex === idx;

              let btnBg = 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300';
              if (isFlagged) {
                btnBg = 'bg-amber-500 text-white font-bold';
              } else if (isAnswered) {
                btnBg = 'bg-red-600 text-white font-bold';
              }

              return (
                <button
                  key={q.id}
                  onClick={() => {
                    playSoundEffect('click');
                    setCurrentQuestionIndex(idx);
                  }}
                  className={`h-9 rounded-xl text-xs font-bold transition-all relative ${btnBg} ${
                    isCurrent ? 'ring-2 ring-offset-2 ring-stone-900 dark:ring-white scale-105' : 'hover:scale-105'
                  }`}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>

          {/* Submit Action */}
          <button
            onClick={() => setShowSubmitConfirm(true)}
            className="w-full py-3 rounded-2xl bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-700 hover:to-amber-700 text-white font-bold text-xs shadow-md transition-all"
          >
            Nộp bài thi ngay
          </button>
        </div>
      </div>

      {/* Submit Confirmation Modal */}
      {showSubmitConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-6 sm:p-8 max-w-md w-full text-center shadow-2xl space-y-4">
            <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-950 text-red-600 flex items-center justify-center mx-auto">
              <AlertTriangle size={32} />
            </div>

            <h3 className="text-xl font-bold text-stone-900 dark:text-white">
              Bạn có chắc chắn muốn nộp bài?
            </h3>

            <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400">
              Bạn đã hoàn thành <span className="font-bold text-red-600">{answeredCount}/{exam.questions.length}</span> câu hỏi. 
              Thời gian còn lại: <span className="font-mono font-bold">{formatTime(timeLeftSeconds)}</span>.
            </p>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => setShowSubmitConfirm(false)}
                className="flex-1 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 text-xs font-bold text-stone-700 dark:text-stone-300 hover:bg-stone-100"
              >
                Tiếp tục làm bài
              </button>
              <button
                onClick={() => {
                  setShowSubmitConfirm(false);
                  handleSubmit();
                }}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-md"
              >
                Xác nhận nộp bài
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
