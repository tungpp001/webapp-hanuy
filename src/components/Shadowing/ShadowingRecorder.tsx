import type React from 'react';
import { useState, useEffect, useRef } from 'react';
import { 
  Mic, 
  MicOff, 
  Sparkles, 
  AlertCircle, 
  Volume2, 
  RotateCcw,
  Award
} from 'lucide-react';
import type { SubtitleSegment, ShadowingRecordResult } from '../../types/shadowing';
import { createSpeechRecognizer, evaluatePronunciation, speakChinese, playSoundEffect } from '../../utils/speech';
import type { SpeechRecognitionInstance } from '../../utils/speech';
import { addXP } from '../../utils/storage';

interface ShadowingRecorderProps {
  segment: SubtitleSegment;
  onCompleted?: (result: ShadowingRecordResult) => void;
}

export const ShadowingRecorder: React.FC<ShadowingRecorderProps> = ({
  segment,
  onCompleted,
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [spokenText, setSpokenText] = useState('');
  const [scoreResult, setScoreResult] = useState<ShadowingRecordResult | null>(null);
  const [supported, setSupported] = useState(true);

  const recognizerRef = useRef<SpeechRecognitionInstance | null>(null);
  const accumulatedTextRef = useRef('');

  // Reset when segment changes
  useEffect(() => {
    if (recognizerRef.current) {
      recognizerRef.current.abort();
      recognizerRef.current = null;
    }
    setSpokenText('');
    setScoreResult(null);
    setIsRecording(false);
    accumulatedTextRef.current = '';
  }, [segment.id]);

  const handleStartRecord = () => {
    playSoundEffect('click');
    setSpokenText('');
    setScoreResult(null);
    accumulatedTextRef.current = '';

    const recognizer = createSpeechRecognizer(
      (text: string, isFinal: boolean) => {
        setSpokenText(text);
        accumulatedTextRef.current = text;
        if (isFinal) {
          handleEvaluation(text);
        }
      },
      (error: string) => {
        console.warn('Recognition error:', error);
        setIsRecording(false);
      },
      (finalText: string) => {
        setIsRecording(false);
        const textToEvaluate = finalText || accumulatedTextRef.current;
        if (textToEvaluate) {
          handleEvaluation(textToEvaluate);
        }
      }
    );

    if (recognizer) {
      recognizerRef.current = recognizer;
      recognizer.start();
      setIsRecording(true);
    } else {
      setSupported(false);
    }
  };

  const handleStopRecord = () => {
    if (recognizerRef.current) {
      recognizerRef.current.stop();
    }
    setIsRecording(false);
    if (accumulatedTextRef.current) {
      handleEvaluation(accumulatedTextRef.current);
    }
  };

  const handleEvaluation = (text: string) => {
    setIsRecording(false);
    const evalResult = evaluatePronunciation(segment.hanzi, text);

    const result: ShadowingRecordResult = {
      segmentId: segment.id,
      userSpokenText: text,
      score: evalResult.score,
      matchedCharacters: evalResult.matchedChars.map(c => ({ char: c.char, isCorrect: c.isMatched })),
    };

    setScoreResult(result);

    if (evalResult.score >= 80) {
      playSoundEffect('correct');
      addXP(20);
    } else if (evalResult.score >= 50) {
      playSoundEffect('click');
      addXP(10);
    } else {
      playSoundEffect('incorrect');
    }

    onCompleted?.(result);
  };

  const handleListenSample = () => {
    playSoundEffect('click');
    speakChinese(segment.hanzi, 0.9);
  };

  return (
    <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-md space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-xl bg-red-100 dark:bg-red-950 text-red-600 dark:text-red-300 text-xs font-bold flex items-center gap-1.5">
            <Mic size={14} />
            <span>Phòng Thu Shadowing</span>
          </span>
          <span className="text-xs text-stone-400 font-medium">
            {segment.speaker && `[${segment.speaker}]`}
          </span>
        </div>

        <button
          onClick={handleListenSample}
          className="px-3 py-1.5 rounded-xl border border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300 hover:bg-red-50 hover:text-red-600 text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
          title="Nghe phát âm chuẩn"
        >
          <Volume2 size={15} />
          <span>Nghe giọng mẫu</span>
        </button>
      </div>

      {/* Target Sentence Display */}
      <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200/60 dark:border-stone-700/60 space-y-1 text-center">
        <div className="text-xs text-stone-400 font-medium">
          {segment.pinyin}
        </div>
        <div className="text-lg sm:text-xl font-bold font-chinese text-stone-900 dark:text-white">
          {segment.hanzi}
        </div>
        <div className="text-xs text-stone-500 dark:text-stone-400">
          "{segment.vietnamese}"
        </div>
      </div>

      {!supported && (
        <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-700 dark:text-amber-300 flex items-center gap-2">
          <AlertCircle size={16} className="shrink-0" />
          <span>Hãy cấp quyền Microphone trên trình duyệt Chrome/Edge để thu âm tiếng Trung trực tiếp.</span>
        </div>
      )}

      {/* Recording Control Button with Radar Waves */}
      <div className="flex flex-col items-center justify-center pt-1 pb-2">
        <button
          onClick={isRecording ? handleStopRecord : handleStartRecord}
          className={`relative group rounded-full p-4 sm:p-5 transition-all duration-300 flex items-center justify-center cursor-pointer ${
            isRecording
              ? 'bg-red-600 text-white shadow-xl shadow-red-500/40 scale-110'
              : 'bg-gradient-to-r from-red-600 to-amber-600 text-white shadow-lg hover:shadow-xl hover:scale-105 active:scale-95'
          }`}
          title={isRecording ? 'Nhấn để dừng ghi âm và chấm điểm' : 'Nhấn để bắt đầu nói nhại (Shadowing)'}
        >
          {isRecording ? (
            <>
              <span className="absolute -inset-2 rounded-full bg-red-500/30 animate-radar"></span>
              <span className="absolute -inset-4 rounded-full bg-red-500/20 animate-radar" style={{ animationDelay: '0.4s' }}></span>
              <MicOff size={28} className="relative z-10 animate-pulse" />
            </>
          ) : (
            <Mic size={28} className="transition-transform group-hover:scale-110" />
          )}
        </button>

        <span className="text-xs font-semibold text-stone-600 dark:text-stone-400 mt-2.5">
          {isRecording ? (
            <span className="text-red-600 dark:text-red-400 animate-pulse flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-red-600 animate-ping"></span>
              Đang lắng nghe... Nhấn lại vào Micro khi nói xong câu!
            </span>
          ) : (
            <span>Nhấn Micro để Shadowing câu này</span>
          )}
        </span>
      </div>

      {/* Real-time Recognition & Pronunciation Score Card */}
      {spokenText && isRecording && (
        <div className="p-3 rounded-xl bg-stone-100 dark:bg-stone-800 text-center text-xs font-chinese text-stone-700 dark:text-stone-300 animate-fade-in border border-stone-200 dark:border-stone-700">
          Đang nhận diện: <span className="font-bold text-red-600 dark:text-red-400">"{spokenText}"</span>
        </div>
      )}

      {scoreResult && (
        <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700 animate-pop space-y-3">
          {/* Score Badge */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className={`px-3 py-1 rounded-xl text-xs font-black flex items-center gap-1 ${
                scoreResult.score >= 80
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                  : scoreResult.score >= 50
                  ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                  : 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'
              }`}>
                <Award size={14} />
                <span>Độ chính xác: {scoreResult.score}%</span>
              </span>

              {scoreResult.score >= 80 && (
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <Sparkles size={13} />
                  <span>Xuất sắc (+20 XP)</span>
                </span>
              )}
            </div>

            <button
              onClick={handleStartRecord}
              className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 transition-colors cursor-pointer"
              title="Thu âm lại"
            >
              <RotateCcw size={15} />
            </button>
          </div>

          {/* Character by character analysis */}
          <div className="space-y-1">
            <span className="text-[11px] font-semibold text-stone-400 block">
              Phân tích từng chữ Hán bạn phát âm:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {scoreResult.matchedCharacters.map((item, idx) => (
                <span
                  key={idx}
                  className={`px-2.5 py-1 rounded-lg font-chinese font-bold text-sm border ${
                    item.isCorrect
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 text-emerald-700 dark:text-emerald-300'
                      : 'bg-red-50 dark:bg-red-950/60 border-red-300 text-red-700 dark:text-red-300'
                  }`}
                  title={item.isCorrect ? 'Phát âm chuẩn' : 'Chưa nhận diện đúng'}
                >
                  {item.char}
                </span>
              ))}
            </div>
          </div>

          {/* User Spoken Text vs Target */}
          <div className="text-xs text-stone-500 dark:text-stone-400 pt-1 border-t border-stone-200/60 dark:border-stone-700/60">
            <span>Giọng bạn nói: </span>
            <span className="font-chinese font-medium text-stone-800 dark:text-stone-200">
              "{scoreResult.userSpokenText || 'Không phát hiện giọng nói'}"
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
