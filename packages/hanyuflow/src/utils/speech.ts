// Utility for Chinese Text-To-Speech, Voice Recognition & Sound Effects

export const getChineseVoices = (): SpeechSynthesisVoice[] => {
  if (typeof window === 'undefined' || !window.speechSynthesis) return [];
  const voices = window.speechSynthesis.getVoices();
  return voices.filter(v => v.lang.startsWith('zh') || v.lang.includes('cmn') || v.lang.includes('Chinese'));
};

export const speakChinese = (text: string, speed: number = 1.0, onEnd?: () => void): void => {
  if (typeof window === 'undefined' || !window.speechSynthesis) {
    console.warn('Speech synthesis not supported');
    onEnd?.();
    return;
  }

  // Cancel any ongoing speech
  window.speechSynthesis.cancel();

  // Clean text from punctuation if needed, or keep for natural pauses
  const cleanText = text.trim();
  if (!cleanText) {
    onEnd?.();
    return;
  }

  const utterance = new SpeechSynthesisUtterance(cleanText);
  utterance.lang = 'zh-CN';
  utterance.rate = Math.max(0.5, Math.min(2.0, speed));
  utterance.pitch = 1.0;

  const voices = getChineseVoices();
  if (voices.length > 0) {
    // Prefer higher quality natural voices if available (Microsoft Xiaoxiao, Google 普通话, Tingting, etc.)
    const preferredVoice = voices.find(v => 
      v.name.includes('Xiaoxiao') || 
      v.name.includes('Yunxi') || 
      v.name.includes('Google') || 
      v.name.includes('Natural') || 
      v.name.includes('Tingting') ||
      v.lang === 'zh-CN'
    ) || voices[0];

    utterance.voice = preferredVoice;
  }

  utterance.onend = () => {
    onEnd?.();
  };

  utterance.onerror = (e) => {
    console.warn('Speech synthesis error:', e);
    onEnd?.();
  };

  window.speechSynthesis.speak(utterance);
};

export const stopSpeaking = (): void => {
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
};

// Check if browser supports Web Speech API Recognition
export const isSpeechRecognitionSupported = (): boolean => {
  if (typeof window === 'undefined') return false;
  return 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
};

// Interface for speech recognition instance
export interface SpeechRecognitionInstance {
  start: () => void;
  stop: () => void;
  abort: () => void;
}

export const createSpeechRecognizer = (
  onResult: (transcript: string, isFinal: boolean) => void,
  onError: (error: string) => void,
  onEnd: (finalTranscript: string) => void
): SpeechRecognitionInstance | null => {
  if (!isSpeechRecognitionSupported()) {
    onError('Trình duyệt không hỗ trợ nhận diện giọng nói. Hãy dùng Chrome hoặc Edge.');
    return null;
  }

  // @ts-expect-error Web Speech API vendor prefix
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const recognition = new SpeechRecognition();

  recognition.lang = 'zh-CN';
  recognition.interimResults = true;
  recognition.continuous = false;
  recognition.maxAlternatives = 1;

  let lastRecognizedText = '';

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  recognition.onresult = (event: any) => {
    let interimTranscript = '';
    let finalTranscript = '';

    for (let i = event.resultIndex; i < event.results.length; ++i) {
      if (event.results[i].isFinal) {
        finalTranscript += event.results[i][0].transcript;
      } else {
        interimTranscript += event.results[i][0].transcript;
      }
    }

    const currentText = finalTranscript || interimTranscript;
    if (currentText) {
      lastRecognizedText = currentText;
      onResult(currentText, Boolean(finalTranscript));
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  recognition.onerror = (event: any) => {
    let message = 'Lỗi nhận diện giọng nói.';
    if (event.error === 'no-speech') {
      message = 'Chưa nghe thấy bạn nói. Hãy thử nói to và rõ hơn nhé!';
    } else if (event.error === 'audio-capture') {
      message = 'Không tìm thấy microphone trên thiết bị của bạn.';
    } else if (event.error === 'not-allowed') {
      message = 'Bạn chưa cấp quyền truy cập Microphone cho trình duyệt.';
    }
    onError(message);
  };

  recognition.onend = () => {
    onEnd(lastRecognizedText);
  };

  return {
    start: () => {
      try {
        recognition.start();
      } catch (e) {
        console.warn('Recognition start error', e);
      }
    },
    stop: () => {
      try {
        recognition.stop();
      } catch (e) {
        console.warn('Recognition stop error', e);
      }
    },
    abort: () => {
      try {
        recognition.abort();
      } catch (e) {
        console.warn('Recognition abort error', e);
      }
    }
  };
};

// Clean Hanzi string (remove punctuation, spaces, numbers)
export const cleanHanzi = (str: string): string => {
  return str.replace(/[^\u4e00-\u9fa5a-zA-Z0-9]/g, '').toLowerCase();
};

export interface PronunciationEvaluation {
  score: number; // 0 to 100
  spokenClean: string;
  targetClean: string;
  matchedChars: {
    char: string;
    isMatched: boolean;
  }[];
  feedbackMessage: string;
  feedbackLevel: 'perfect' | 'great' | 'good' | 'try-again';
}

// Evaluate spoken Chinese vs target Chinese
export const evaluatePronunciation = (target: string, spoken: string): PronunciationEvaluation => {
  const targetClean = cleanHanzi(target);
  const spokenClean = cleanHanzi(spoken);

  if (!spokenClean) {
    return {
      score: 0,
      spokenClean: '',
      targetClean,
      matchedChars: targetClean.split('').map(char => ({ char, isMatched: false })),
      feedbackMessage: 'Chưa phát hiện giọng nói rõ ràng. Hãy thử lại!',
      feedbackLevel: 'try-again'
    };
  }

  // Character match checking
  const targetArr = targetClean.split('');
  const spokenArr = spokenClean.split('');
  const matchedChars = targetArr.map((char, index) => {
    const isMatched = spokenArr.includes(char) || spokenArr[index] === char;
    return { char, isMatched };
  });

  const correctCount = matchedChars.filter(m => m.isMatched).length;
  const score = Math.round((correctCount / Math.max(1, targetArr.length)) * 100);

  let feedbackLevel: 'perfect' | 'great' | 'good' | 'try-again' = 'try-again';
  let feedbackMessage = 'Phát âm chưa chuẩn, bạn hãy nghe lại câu mẫu và nói lại nhé!';

  if (score >= 90) {
    feedbackLevel = 'perfect';
    feedbackMessage = 'Tuyệt vời! Phát âm rất chuẩn xác và tự nhiên! 🌟';
  } else if (score >= 70) {
    feedbackLevel = 'great';
    feedbackMessage = 'Rất tốt! Người bản xứ hoàn toàn hiểu câu này của bạn! 👍';
  } else if (score >= 50) {
    feedbackLevel = 'good';
    feedbackMessage = 'Khá ổn! Chú ý thêm một vài thanh điệu và ngữ điệu nhé! 👏';
  }

  return {
    score,
    spokenClean,
    targetClean,
    matchedChars,
    feedbackMessage,
    feedbackLevel
  };
};

// Web Audio API Synthesizer for instant game sounds
export const playSoundEffect = (type: 'correct' | 'incorrect' | 'click' | 'success' | 'streak'): void => {
  if (typeof window === 'undefined') return;
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();

    const now = ctx.currentTime;

    if (type === 'correct') {
      // Pleasant high double chime (Ding Ding!)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(523.25, now); // C5
      osc1.frequency.exponentialRampToValueAtTime(659.25, now + 0.1); // E5
      gain1.gain.setValueAtTime(0.2, now);
      gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.35);

      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(783.99, now + 0.1); // G5
      osc2.frequency.exponentialRampToValueAtTime(1046.50, now + 0.25); // C6
      gain2.gain.setValueAtTime(0, now);
      gain2.gain.setValueAtTime(0.25, now + 0.1);
      gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.45);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.1);
      osc2.stop(now + 0.45);
    } else if (type === 'incorrect') {
      // Low buzz
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.exponentialRampToValueAtTime(160, now + 0.25);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.3);
    } else if (type === 'click') {
      // Soft modern click
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.exponentialRampToValueAtTime(400, now + 0.05);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.05);
    } else if (type === 'streak' || type === 'success') {
      // Major triad fanfare
      const notes = [523.25, 659.25, 783.99, 1046.50]; // C - E - G - High C
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + i * 0.08);
        gain.gain.setValueAtTime(0.18, now + i * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.08 + 0.4);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + i * 0.08);
        osc.stop(now + i * 0.08 + 0.4);
      });
    }
  } catch (e) {
    console.warn('Audio effect error:', e);
  }
};
