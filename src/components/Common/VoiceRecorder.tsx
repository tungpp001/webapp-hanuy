import type React from 'react';
import { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, AlertCircle } from 'lucide-react';
import { createSpeechRecognizer, isSpeechRecognitionSupported, playSoundEffect } from '../../utils/speech';
import type { SpeechRecognitionInstance } from '../../utils/speech';

interface VoiceRecorderProps {
  onTranscript: (text: string) => void;
  isListening?: boolean;
  disabled?: boolean;
  className?: string;
}

export const VoiceRecorder: React.FC<VoiceRecorderProps> = ({
  onTranscript,
  isListening: externalIsListening,
  disabled = false,
  className = '',
}) => {
  const [internalListening, setInternalListening] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [supported, setSupported] = useState(true);
  const recognizerRef = useRef<SpeechRecognitionInstance | null>(null);

  const isListening = externalIsListening !== undefined ? externalIsListening : internalListening;

  useEffect(() => {
    setSupported(isSpeechRecognitionSupported());
  }, []);

  const handleStart = () => {
    if (disabled) return;
    setErrorMsg(null);

    const rec = createSpeechRecognizer(
      (transcript) => {
        onTranscript(transcript);
      },
      (error) => {
        setErrorMsg(error);
        setInternalListening(false);
      },
      () => {
        setInternalListening(false);
      }
    );

    if (rec) {
      recognizerRef.current = rec;
      rec.start();
      setInternalListening(true);
      playSoundEffect('click');
    }
  };

  const handleStop = () => {
    if (recognizerRef.current) {
      recognizerRef.current.stop();
      setInternalListening(false);
      playSoundEffect('click');
    }
  };

  const toggleRecording = () => {
    if (isListening) {
      handleStop();
    } else {
      handleStart();
    }
  };

  if (!supported) {
    return (
      <div className="flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-3 py-1.5 rounded-lg border border-amber-200 dark:border-amber-800">
        <AlertCircle size={14} />
        <span>Trình duyệt hiện tại chưa hỗ trợ nhận diện giọng nói (Khuyên dùng Chrome/Edge).</span>
      </div>
    );
  }

  return (
    <div className={`flex flex-col items-center gap-2 ${className}`}>
      <button
        onClick={toggleRecording}
        disabled={disabled}
        className={`relative group rounded-full p-4 transition-all duration-300 flex items-center justify-center ${
          isListening
            ? 'bg-red-600 text-white shadow-lg shadow-red-500/40 scale-110'
            : disabled
            ? 'bg-stone-200 dark:bg-stone-800 text-stone-400 cursor-not-allowed'
            : 'bg-gradient-to-r from-red-600 to-amber-600 text-white shadow-md hover:shadow-xl hover:scale-105 active:scale-95'
        }`}
        title={isListening ? 'Nhấn để dừng ghi âm' : 'Nhấn để phát âm thử'}
        aria-label="Thu âm giọng nói"
      >
        {isListening ? (
          <>
            <span className="absolute inset-0 rounded-full bg-red-500 animate-ping opacity-40"></span>
            <MicOff size={28} className="relative z-10 animate-pulse" />
          </>
        ) : (
          <Mic size={28} className="transition-transform group-hover:scale-110" />
        )}
      </button>

      <span className="text-xs font-medium text-stone-600 dark:text-stone-400 flex items-center gap-1">
        {isListening ? (
          <span className="text-red-600 dark:text-red-400 font-semibold animate-pulse flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-red-600 animate-ping"></span>
            Đang lắng nghe bạn nói tiếng Trung...
          </span>
        ) : (
          <span>Nhấn Micro để nói</span>
        )}
      </span>

      {errorMsg && (
        <div className="text-xs text-red-500 flex items-center gap-1 mt-1 text-center max-w-xs">
          <AlertCircle size={13} className="shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}
    </div>
  );
};
