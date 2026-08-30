import type React from 'react';
import { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  RotateCcw, 
  ArrowRight, 
  Sparkles
} from 'lucide-react';
import type { Dialogue } from '../../types/chinese';
import { AudioButton } from '../Common/AudioButton';
import { VoiceRecorder } from '../Common/VoiceRecorder';
import { CelebrationModal } from '../Common/CelebrationModal';
import { 
  speakChinese, 
  evaluatePronunciation, 
  playSoundEffect 
} from '../../utils/speech';
import type { PronunciationEvaluation } from '../../utils/speech';
import { addXP, markDialogueCompleted } from '../../utils/storage';

interface RoleplayModeProps {
  dialogue: Dialogue;
  onExit: () => void;
  onCompleted?: () => void;
}

export const RoleplayMode: React.FC<RoleplayModeProps> = ({
  dialogue,
  onExit,
  onCompleted,
}) => {
  const [currentLineIndex, setCurrentLineIndex] = useState(0);
  const [spokenTranscript, setSpokenTranscript] = useState('');
  const [evaluation, setEvaluation] = useState<PronunciationEvaluation | null>(null);
  const [lineScores, setLineScores] = useState<number[]>([]);
  const [showCelebration, setShowCelebration] = useState(false);
  const [isAISpeaking, setIsAISpeaking] = useState(false);

  const currentLine = dialogue.lines[currentLineIndex];
  const isAITurn = currentLine.speaker.role === 'A';
  const isUserTurn = currentLine.speaker.role === 'B';

  // Handle AI turn automatically
  useEffect(() => {
    if (isAITurn && !showCelebration) {
      setIsAISpeaking(true);
      setSpokenTranscript('');
      setEvaluation(null);

      const timer = setTimeout(() => {
        speakChinese(currentLine.hanzi, 1.0, () => {
          setIsAISpeaking(false);
          // Wait 1 second then advance to user's turn
          setTimeout(() => {
            if (currentLineIndex < dialogue.lines.length - 1) {
              setCurrentLineIndex(prev => prev + 1);
            } else {
              finishRoleplay();
            }
          }, 1000);
        });
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [currentLineIndex, isAITurn, showCelebration]);

  const handleVoiceTranscript = (text: string) => {
    setSpokenTranscript(text);
    if (isUserTurn) {
      const evalResult = evaluatePronunciation(currentLine.hanzi, text);
      setEvaluation(evalResult);

      if (evalResult.score >= 70) {
        playSoundEffect('correct');
      } else {
        playSoundEffect('incorrect');
      }
    }
  };

  const handleContinue = () => {
    playSoundEffect('click');
    const currentScore = evaluation ? evaluation.score : 80;
    const updatedScores = [...lineScores, currentScore];
    setLineScores(updatedScores);

    if (currentLineIndex < dialogue.lines.length - 1) {
      setCurrentLineIndex(prev => prev + 1);
      setSpokenTranscript('');
      setEvaluation(null);
    } else {
      finishRoleplay(updatedScores);
    }
  };

  const handleRetry = () => {
    playSoundEffect('click');
    setSpokenTranscript('');
    setEvaluation(null);
  };

  const finishRoleplay = (_finalScores = lineScores) => {
    addXP(60);
    markDialogueCompleted(dialogue.id);
    onCompleted?.();
    setShowCelebration(true);
  };

  const restartAll = () => {
    setShowCelebration(false);
    setCurrentLineIndex(0);
    setSpokenTranscript('');
    setEvaluation(null);
    setLineScores([]);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-20 animate-fade-in">
      {/* Top Header */}
      <div className="flex items-center justify-between p-4 sm:p-5 bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={onExit}
            className="p-2.5 rounded-2xl border border-stone-200 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300 transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-950 text-red-600 dark:text-red-300 uppercase tracking-wider">
                Chế độ Đóng Vai AI
              </span>
              <span className="text-xs text-stone-400">
                Câu {currentLineIndex + 1}/{dialogue.lines.length}
              </span>
            </div>
            <h2 className="text-base sm:text-lg font-bold text-stone-900 dark:text-white">
              {dialogue.title}
            </h2>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-24 sm:w-36 h-2.5 bg-stone-100 dark:bg-stone-800 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-red-600 to-amber-500 transition-all duration-300 rounded-full"
            style={{ width: `${((currentLineIndex + 1) / dialogue.lines.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Roleplay Mission Card */}
      <div className="p-4 rounded-2xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 text-xs sm:text-sm text-amber-900 dark:text-amber-200 flex items-start gap-2.5">
        <Sparkles size={18} className="text-amber-600 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold">Nhiệm vụ của bạn: </span>
          <span>{dialogue.roleplayGoal.mission}</span>
        </div>
      </div>

      {/* Main Conversation Stage */}
      <div className="space-y-4">
        {/* Machine / AI Speaker (Role A) */}
        <div className={`p-5 sm:p-6 rounded-3xl transition-all duration-300 border ${
          isAITurn
            ? 'bg-white dark:bg-stone-900 border-red-300 dark:border-red-800 shadow-lg ring-2 ring-red-500/20'
            : 'bg-stone-50/70 dark:bg-stone-900/40 border-stone-200 dark:border-stone-800 opacity-70'
        }`}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <span className="text-3xl p-2 rounded-2xl bg-stone-100 dark:bg-stone-800">
                {dialogue.lines.find(l => l.speaker.role === 'A')?.speaker.avatar || '👨‍🍳'}
              </span>
              <div>
                <h4 className="font-bold text-stone-900 dark:text-white flex items-center gap-2">
                  <span>{dialogue.roleplayGoal.roleA}</span>
                  {isAISpeaking && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-600 font-bold animate-pulse">
                      Đang nói...
                    </span>
                  )}
                </h4>
                <span className="text-xs text-stone-500">Đối tác đối thoại AI</span>
              </div>
            </div>

            {isAITurn && (
              <AudioButton text={currentLine.hanzi} size="lg" variant="primary" />
            )}
          </div>

          <div className="mt-2">
            <div className="text-xs text-stone-500 dark:text-stone-400 font-medium mb-1">
              {isAITurn ? currentLine.pinyin : '...'}
            </div>
            <div className="text-2xl font-bold font-chinese text-stone-900 dark:text-stone-100 mb-2">
              {isAITurn ? currentLine.hanzi : '...'}
            </div>
            <div className="text-sm text-stone-600 dark:text-stone-300 pt-2 border-t border-stone-100 dark:border-stone-800">
              {isAITurn ? currentLine.vietnamese : '...'}
            </div>
          </div>
        </div>

        {/* User Speaker (Role B) */}
        <div className={`p-5 sm:p-6 rounded-3xl transition-all duration-300 border ${
          isUserTurn
            ? 'bg-gradient-to-b from-white to-amber-50/30 dark:from-stone-900 dark:to-stone-900 border-amber-300 dark:border-amber-700 shadow-xl ring-2 ring-amber-500/20'
            : 'bg-stone-50/70 dark:bg-stone-900/40 border-stone-200 dark:border-stone-800 opacity-70'
        }`}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <span className="text-3xl p-2 rounded-2xl bg-amber-100 dark:bg-amber-950/60">
                {dialogue.lines.find(l => l.speaker.role === 'B')?.speaker.avatar || '🙋‍♂️'}
              </span>
              <div>
                <h4 className="font-bold text-stone-900 dark:text-white flex items-center gap-2">
                  <span>{dialogue.roleplayGoal.roleB}</span>
                  {isUserTurn && (
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500 text-white font-bold animate-bounce-subtle">
                      Lượt của bạn! 🎙️
                    </span>
                  )}
                </h4>
                <span className="text-xs text-stone-500">Hãy đọc to câu thoại tiếng Trung bên dưới</span>
              </div>
            </div>

            {isUserTurn && (
              <div className="flex items-center gap-2">
                <AudioButton text={currentLine.hanzi} size="md" variant="pill" showSpeedControl />
              </div>
            )}
          </div>

          {isUserTurn ? (
            <div className="mt-2 space-y-4">
              {/* Target sentence to speak */}
              <div className="p-4 rounded-2xl bg-stone-100/80 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700">
                <div className="text-sm font-semibold text-stone-600 dark:text-stone-400 mb-1">
                  {currentLine.pinyin}
                </div>
                <div className="text-2xl sm:text-3xl font-extrabold font-chinese tracking-wide text-stone-900 dark:text-white mb-2">
                  {currentLine.hanzi}
                </div>
                <div className="text-xs font-semibold text-amber-700 dark:text-amber-400 mb-1">
                  Âm Hán-Việt: {currentLine.sinoVietnamese}
                </div>
                <div className="text-sm text-stone-600 dark:text-stone-300 pt-2 border-t border-stone-200 dark:border-stone-700">
                  Nghĩa: <span className="font-semibold">{currentLine.vietnamese}</span>
                </div>
              </div>

              {/* Voice Recording Control */}
              <div className="flex flex-col items-center justify-center py-3">
                <VoiceRecorder
                  onTranscript={handleVoiceTranscript}
                  disabled={isAISpeaking}
                />
              </div>

              {/* Recognition Result & Pronunciation Evaluation */}
              {spokenTranscript && (
                <div className="p-4 rounded-2xl bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 shadow-sm animate-fade-in space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">
                      Giọng bạn vừa nói:
                    </span>
                    {evaluation && (
                      <span className={`text-sm font-extrabold px-2.5 py-0.5 rounded-full ${
                        evaluation.score >= 80 
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                          : evaluation.score >= 50
                          ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                          : 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300'
                      }`}>
                        Độ chính xác: {evaluation.score}%
                      </span>
                    )}
                  </div>

                  <div className="text-lg font-bold font-chinese text-stone-800 dark:text-stone-200 flex items-center gap-1.5 flex-wrap">
                    {evaluation?.matchedChars ? (
                      evaluation.matchedChars.map((item, i) => (
                        <span
                          key={i}
                          className={`px-1.5 py-0.5 rounded-md font-bold text-xl ${
                            item.isMatched
                              ? 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300'
                              : 'bg-red-100 dark:bg-red-900/60 text-red-700 dark:text-red-300 border border-red-300'
                          }`}
                          title={item.isMatched ? 'Phát âm chuẩn' : 'Chưa chuẩn'}
                        >
                          {item.char}
                        </span>
                      ))
                    ) : (
                      <span>{spokenTranscript}</span>
                    )}
                  </div>

                  {evaluation && (
                    <div className="text-xs font-medium text-stone-600 dark:text-stone-300 pt-1">
                      {evaluation.feedbackMessage}
                    </div>
                  )}

                  {/* Actions after speaking */}
                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-100 dark:border-stone-700">
                    <button
                      onClick={handleRetry}
                      className="px-3.5 py-2 rounded-xl border border-stone-200 dark:border-stone-700 text-xs font-bold text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-700 transition-colors flex items-center gap-1"
                    >
                      <RotateCcw size={14} />
                      Nói lại
                    </button>

                    <button
                      onClick={handleContinue}
                      className="px-5 py-2 rounded-xl bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-700 hover:to-amber-700 text-white text-xs font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-1.5"
                    >
                      <span>Tiếp tục</span>
                      <ArrowRight size={14} />
                    </button>
                  </div>
                </div>
              )}

              {/* Skip / Manual Continue option */}
              {!spokenTranscript && (
                <div className="flex justify-end pt-1">
                  <button
                    onClick={handleContinue}
                    className="text-xs font-semibold text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 transition-colors flex items-center gap-1"
                  >
                    <span>Bỏ qua câu này</span>
                    <ArrowRight size={13} />
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="text-xs text-stone-400 italic py-2">
              Đang đợi đối tác AI nói câu thoại...
            </div>
          )}
        </div>
      </div>

      {/* Completion Modal */}
      <CelebrationModal
        isOpen={showCelebration}
        title="Xuất Sắc! Hoàn Thành Hội Thoại 🎉"
        subtitle={`Bạn đã hoàn thành phiên đóng vai giao tiếp "${dialogue.title}".`}
        score={lineScores.length > 0 ? Math.round(lineScores.reduce((a,b)=>a+b,0)/lineScores.length) : 95}
        xpGained={60}
        onClose={onExit}
        onRestart={restartAll}
        actionText="Quay về bài học"
      />
    </div>
  );
};
