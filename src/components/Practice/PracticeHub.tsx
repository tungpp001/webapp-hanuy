import type React from 'react';
import { useState } from 'react';
import { 
  Puzzle, 
  Headphones, 
  Layers, 
  CheckCircle2, 
  XCircle, 
  Sparkles, 
  Volume2
} from 'lucide-react';
import { SENTENCE_BUILDER_QUIZZES, LISTENING_QUIZZES } from '../../data/quizzes';
import { FLASHCARDS } from '../../data/vocabulary';
import { AudioButton } from '../Common/AudioButton';
import { speakChinese, playSoundEffect } from '../../utils/speech';
import { addXP } from '../../utils/storage';
import { CelebrationModal } from '../Common/CelebrationModal';

export const PracticeHub: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'sentence' | 'listening' | 'flashcards'>('sentence');

  // Sentence Builder State
  const [sentenceIndex, setSentenceIndex] = useState(0);
  const [selectedWordIds, setSelectedWordIds] = useState<string[]>([]);
  const [isSentenceChecked, setIsSentenceChecked] = useState(false);
  const [isSentenceCorrect, setIsSentenceCorrect] = useState(false);
  const [sentenceScore, setSentenceScore] = useState(0);

  // Listening Quiz State
  const [listenIndex, setListenIndex] = useState(0);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [isListenAnswered, setIsListenAnswered] = useState(false);
  const [listenScore, setListenScore] = useState(0);

  // Flashcards State
  const [cardIndex, setCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [selectedHsk, setSelectedHsk] = useState<string>('all');
  const [knownCardIds, setKnownCardIds] = useState<string[]>([]);

  // Celebration modal
  const [showCelebration, setShowCelebration] = useState(false);

  // Filter flashcards
  const filteredCards = FLASHCARDS.filter(
    (card) => selectedHsk === 'all' || card.hskLevel === selectedHsk
  );
  const currentCard = filteredCards[cardIndex] || filteredCards[0];

  // ----------------------------------------------------
  // Sentence Builder Handlers
  // ----------------------------------------------------
  const currentSentence = SENTENCE_BUILDER_QUIZZES[sentenceIndex];
  
  // Available words (words not yet picked)
  const availableWords = currentSentence.words.filter(
    (w) => !selectedWordIds.includes(w.id)
  );

  const handlePickWord = (wordId: string) => {
    if (isSentenceChecked) return;
    playSoundEffect('click');
    setSelectedWordIds(prev => [...prev, wordId]);
  };

  const handleRemoveWord = (wordId: string) => {
    if (isSentenceChecked) return;
    playSoundEffect('click');
    setSelectedWordIds(prev => prev.filter(id => id !== wordId));
  };

  const handleCheckSentence = () => {
    const isCorrect = 
      selectedWordIds.length === currentSentence.correctOrder.length &&
      selectedWordIds.every((id, idx) => id === currentSentence.correctOrder[idx]);

    setIsSentenceChecked(true);
    setIsSentenceCorrect(isCorrect);

    if (isCorrect) {
      playSoundEffect('correct');
      setSentenceScore(prev => prev + 1);
      addXP(20);
      // Speak the completed full sentence
      const fullSentence = currentSentence.words
        .sort((a, b) => currentSentence.correctOrder.indexOf(a.id) - currentSentence.correctOrder.indexOf(b.id))
        .map(w => w.hanzi)
        .join('');
      speakChinese(fullSentence);
    } else {
      playSoundEffect('incorrect');
    }
  };

  const handleNextSentence = () => {
    playSoundEffect('click');
    if (sentenceIndex < SENTENCE_BUILDER_QUIZZES.length - 1) {
      setSentenceIndex(prev => prev + 1);
      setSelectedWordIds([]);
      setIsSentenceChecked(false);
    } else {
      setShowCelebration(true);
    }
  };

  // ----------------------------------------------------
  // Listening Quiz Handlers
  // ----------------------------------------------------
  const currentListen = LISTENING_QUIZZES[listenIndex];

  const handleSelectOption = (optionId: string) => {
    if (isListenAnswered) return;
    setSelectedOptionId(optionId);
    setIsListenAnswered(true);

    const chosen = currentListen.options.find(o => o.id === optionId);
    if (chosen?.isCorrect) {
      playSoundEffect('correct');
      setListenScore(prev => prev + 1);
      addXP(25);
    } else {
      playSoundEffect('incorrect');
    }
  };

  const handleNextListening = () => {
    playSoundEffect('click');
    if (listenIndex < LISTENING_QUIZZES.length - 1) {
      setListenIndex(prev => prev + 1);
      setSelectedOptionId(null);
      setIsListenAnswered(false);
    } else {
      setShowCelebration(true);
    }
  };

  // ----------------------------------------------------
  // Flashcard Handlers
  // ----------------------------------------------------
  const handleFlipCard = () => {
    playSoundEffect('click');
    setIsFlipped(!isFlipped);
  };

  const handleCardKnow = (known: boolean) => {
    playSoundEffect(known ? 'correct' : 'click');
    if (known && !knownCardIds.includes(currentCard.id)) {
      setKnownCardIds(prev => [...prev, currentCard.id]);
      addXP(10);
    }

    setIsFlipped(false);
    if (cardIndex < filteredCards.length - 1) {
      setCardIndex(prev => prev + 1);
    } else {
      setShowCelebration(true);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in pb-20">
      {/* Header Tabs */}
      <div className="flex items-center gap-2 p-1.5 bg-stone-100 dark:bg-stone-800 rounded-2xl max-w-lg mx-auto">
        <button
          onClick={() => { setActiveTab('sentence'); setIsSentenceChecked(false); }}
          className={`flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 transition-all ${
            activeTab === 'sentence'
              ? 'bg-red-600 text-white shadow-sm'
              : 'text-stone-600 dark:text-stone-300 hover:text-stone-900'
          }`}
        >
          <Puzzle size={16} />
          <span>Ghép Câu</span>
        </button>
        <button
          onClick={() => { setActiveTab('listening'); setIsListenAnswered(false); }}
          className={`flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 transition-all ${
            activeTab === 'listening'
              ? 'bg-red-600 text-white shadow-sm'
              : 'text-stone-600 dark:text-stone-300 hover:text-stone-900'
          }`}
        >
          <Headphones size={16} />
          <span>Luyện Nghe</span>
        </button>
        <button
          onClick={() => setActiveTab('flashcards')}
          className={`flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 transition-all ${
            activeTab === 'flashcards'
              ? 'bg-red-600 text-white shadow-sm'
              : 'text-stone-600 dark:text-stone-300 hover:text-stone-900'
          }`}
        >
          <Layers size={16} />
          <span>Flashcard 3D</span>
        </button>
      </div>

      {/* ---------------------------------------------------- */}
      {/* 1. SENTENCE BUILDER */}
      {/* ---------------------------------------------------- */}
      {activeTab === 'sentence' && (
        <div className="bg-white dark:bg-stone-900 rounded-3xl p-6 sm:p-8 border border-stone-200 dark:border-stone-800 shadow-md space-y-6">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-stone-400">
              Câu {sentenceIndex + 1} / {SENTENCE_BUILDER_QUIZZES.length}
            </span>
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-red-100 dark:bg-red-950 text-red-600 dark:text-red-300">
              ⭐ Điểm: {sentenceScore}/{SENTENCE_BUILDER_QUIZZES.length}
            </span>
          </div>

          {/* Vietnamese Target Meaning */}
          <div className="p-5 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900 text-center">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 block mb-1">
              Sắp xếp các từ tiếng Trung để diễn đạt ý:
            </span>
            <h3 className="text-lg sm:text-xl font-bold text-stone-900 dark:text-white">
              "{currentSentence.vietnameseMeaning}"
            </h3>
            {currentSentence.hintPinyin && (
              <span className="text-xs text-stone-400 mt-1 inline-block">
                Gợi ý phiên âm: {currentSentence.hintPinyin}
              </span>
            )}
          </div>

          {/* Selected Words Dropzone */}
          <div className="min-h-[100px] p-4 rounded-2xl bg-stone-50 dark:bg-stone-800/50 border-2 border-dashed border-stone-200 dark:border-stone-700 flex flex-wrap items-center gap-2">
            {selectedWordIds.length === 0 ? (
              <span className="text-xs text-stone-400 m-auto">
                Nhấp vào các khối từ bên dưới để ghép vào đây...
              </span>
            ) : (
              selectedWordIds.map((id) => {
                const word = currentSentence.words.find(w => w.id === id);
                if (!word) return null;
                return (
                  <button
                    key={id}
                    onClick={() => handleRemoveWord(id)}
                    disabled={isSentenceChecked}
                    className="group px-4 py-2.5 rounded-xl bg-white dark:bg-stone-800 border-2 border-red-200 dark:border-red-800 shadow-sm hover:border-red-500 hover:scale-105 active:scale-95 transition-all text-center"
                  >
                    <span className="text-xs text-stone-400 block">{word.pinyin}</span>
                    <span className="text-xl font-bold font-chinese text-stone-900 dark:text-white">
                      {word.hanzi}
                    </span>
                  </button>
                );
              })
            )}
          </div>

          {/* Available Word Bank */}
          <div className="flex flex-wrap items-center justify-center gap-2.5 pt-2">
            {availableWords.map((word) => (
              <button
                key={word.id}
                onClick={() => handlePickWord(word.id)}
                disabled={isSentenceChecked}
                className="px-4 py-2.5 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-red-50 dark:hover:bg-red-950 border border-stone-200 dark:border-stone-700 hover:border-red-300 text-center hover:scale-105 active:scale-95 transition-all cursor-pointer"
              >
                <span className="text-xs text-stone-500 block">{word.pinyin}</span>
                <span className="text-xl font-bold font-chinese text-stone-800 dark:text-stone-200">
                  {word.hanzi}
                </span>
              </button>
            ))}
          </div>

          {/* Actions & Feedback */}
          <div className="pt-4 border-t border-stone-100 dark:border-stone-800 flex flex-col sm:flex-row items-center justify-between gap-3">
            {!isSentenceChecked ? (
              <button
                onClick={handleCheckSentence}
                disabled={selectedWordIds.length === 0}
                className="w-full sm:w-auto px-8 py-3 rounded-2xl bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-700 hover:to-amber-700 disabled:opacity-50 text-white font-bold text-sm shadow-md transition-all"
              >
                Kiểm tra câu
              </button>
            ) : (
              <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-3 animate-fade-in">
                <div className="flex items-center gap-2">
                  {isSentenceCorrect ? (
                    <CheckCircle2 size={24} className="text-emerald-500 shrink-0" />
                  ) : (
                    <XCircle size={24} className="text-red-500 shrink-0" />
                  )}
                  <div>
                    <span className="text-sm font-bold text-stone-900 dark:text-white">
                      {isSentenceCorrect ? 'Chính xác 100%! 🎉' : 'Chưa đúng thứ tự ngữ pháp!'}
                    </span>
                    <p className="text-xs text-stone-500 dark:text-stone-400">
                      {currentSentence.explanation}
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleNextSentence}
                  className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-stone-900 dark:bg-white text-white dark:text-stone-900 font-bold text-xs hover:opacity-90 transition-opacity"
                >
                  {sentenceIndex < SENTENCE_BUILDER_QUIZZES.length - 1 ? 'Câu tiếp theo →' : 'Xem kết quả'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* 2. LISTENING COMPREHENSION */}
      {/* ---------------------------------------------------- */}
      {activeTab === 'listening' && (
        <div className="bg-white dark:bg-stone-900 rounded-3xl p-6 sm:p-8 border border-stone-200 dark:border-stone-800 shadow-md space-y-6">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-stone-400">
              Bài nghe {listenIndex + 1} / {LISTENING_QUIZZES.length}
            </span>
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-red-100 dark:bg-red-950 text-red-600 dark:text-red-300">
              ⭐ Điểm: {listenScore}/{LISTENING_QUIZZES.length}
            </span>
          </div>

          {/* Audio Player Button */}
          <div className="text-center py-6 px-4 rounded-3xl bg-gradient-to-b from-stone-50 to-orange-50/30 dark:from-stone-800/60 dark:to-stone-800/20 border border-stone-200/80 dark:border-stone-700 space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-stone-500">
              Nhấn để nghe đoạn hội thoại ngắn:
            </span>
            <div>
              <button
                onClick={() => {
                  playSoundEffect('click');
                  speakChinese(currentListen.audioText, 0.9);
                }}
                className="p-6 rounded-full bg-gradient-to-tr from-red-600 to-amber-500 text-white shadow-xl shadow-red-500/30 hover:scale-110 active:scale-95 transition-all inline-flex items-center justify-center"
              >
                <Volume2 size={40} />
              </button>
            </div>
            <div className="text-xs text-stone-400">
              (Có thể nhấn nghe lại nhiều lần)
            </div>
          </div>

          {/* Question */}
          <h3 className="text-base sm:text-lg font-bold text-stone-900 dark:text-white">
            ❓ {currentListen.question}
          </h3>

          {/* Options */}
          <div className="space-y-2.5">
            {currentListen.options.map((opt) => {
              const isSelected = selectedOptionId === opt.id;
              let optStyle = 'bg-stone-50 dark:bg-stone-800 border-stone-200 dark:border-stone-700 hover:border-red-300 text-stone-800 dark:text-stone-200';
              if (isListenAnswered) {
                if (opt.isCorrect) {
                  optStyle = 'bg-emerald-500 text-white border-emerald-500 shadow-md';
                } else if (isSelected && !opt.isCorrect) {
                  optStyle = 'bg-red-500 text-white border-red-500 shadow-md';
                } else {
                  optStyle = 'opacity-40 bg-stone-100 dark:bg-stone-800 text-stone-400 border-transparent';
                }
              }

              return (
                <button
                  key={opt.id}
                  onClick={() => handleSelectOption(opt.id)}
                  disabled={isListenAnswered}
                  className={`w-full p-4 rounded-2xl border-2 text-left font-semibold text-sm transition-all duration-150 flex items-center justify-between ${optStyle}`}
                >
                  <span>{opt.text}</span>
                  {isListenAnswered && opt.isCorrect && (
                    <CheckCircle2 size={18} className="text-white shrink-0" />
                  )}
                  {isListenAnswered && isSelected && !opt.isCorrect && (
                    <XCircle size={18} className="text-white shrink-0" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Explanation */}
          {isListenAnswered && (
            <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 flex flex-col sm:flex-row items-center justify-between gap-3 animate-fade-in">
              <div className="text-xs text-stone-600 dark:text-stone-300 space-y-1">
                <div className="font-bold text-stone-900 dark:text-white">
                  Đoạn âm thanh: "{currentListen.audioText}"
                </div>
                <div>{currentListen.explanation}</div>
              </div>

              <button
                onClick={handleNextListening}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-stone-900 dark:bg-white text-white dark:text-stone-900 font-bold text-xs hover:opacity-90 transition-opacity shrink-0"
              >
                {listenIndex < LISTENING_QUIZZES.length - 1 ? 'Bài nghe tiếp →' : 'Xem kết quả'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* 3. FLASHCARDS 3D */}
      {/* ---------------------------------------------------- */}
      {activeTab === 'flashcards' && (
        <div className="space-y-6">
          {/* Level Filter */}
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-1.5">
              {['all', 'HSK 1', 'HSK 2', 'HSK 3'].map((lvl) => (
                <button
                  key={lvl}
                  onClick={() => { setSelectedHsk(lvl); setCardIndex(0); setIsFlipped(false); }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    selectedHsk === lvl
                      ? 'bg-red-600 text-white shadow-xs'
                      : 'bg-white dark:bg-stone-800 text-stone-600 dark:text-stone-400 border border-stone-200 dark:border-stone-700'
                  }`}
                >
                  {lvl === 'all' ? 'Tất cả từ vựng' : lvl}
                </button>
              ))}
            </div>

            <span className="text-xs font-bold text-stone-500">
              Đã thuộc: {knownCardIds.length}/{filteredCards.length} từ
            </span>
          </div>

          {/* 3D Flashcard */}
          <div 
            className="w-full h-80 sm:h-96 perspective-1000 cursor-pointer"
            onClick={handleFlipCard}
          >
            <div className={`relative w-full h-full duration-500 transform-style-3d transition-transform ${isFlipped ? 'rotate-y-180' : ''}`}>
              {/* FRONT OF CARD */}
              <div className="absolute inset-0 w-full h-full backface-hidden rounded-3xl bg-white dark:bg-stone-900 border-2 border-stone-200 dark:border-stone-800 p-8 flex flex-col justify-between items-center text-center shadow-xl">
                <div className="w-full flex items-center justify-between">
                  <span className="text-xs font-black px-2.5 py-1 rounded-full bg-red-100 dark:bg-red-950 text-red-600 dark:text-red-400">
                    {currentCard.hskLevel} • {currentCard.category}
                  </span>
                  <AudioButton text={currentCard.hanzi} size="sm" variant="ghost" />
                </div>

                <div>
                  <div className="text-5xl sm:text-6xl font-black font-chinese text-stone-900 dark:text-white tracking-wider mb-3">
                    {currentCard.hanzi}
                  </div>
                  <div className="text-lg font-bold text-stone-600 dark:text-stone-300">
                    {currentCard.pinyin}
                  </div>
                  <div className="text-xs text-amber-700 dark:text-amber-400 font-semibold mt-1">
                    Hán-Việt: {currentCard.sinoVietnamese}
                  </div>
                </div>

                <span className="text-xs text-stone-400 flex items-center gap-1 font-medium">
                  <Sparkles size={13} className="text-amber-500" />
                  Nhấn vào thẻ để xem nghĩa tiếng Việt & câu ví dụ
                </span>
              </div>

              {/* BACK OF CARD */}
              <div className="absolute inset-0 w-full h-full backface-hidden rotate-y-180 rounded-3xl bg-gradient-to-b from-stone-900 to-stone-950 text-white border-2 border-red-900/40 p-6 sm:p-8 flex flex-col justify-between shadow-2xl">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-red-400">
                    Nghĩa & Ứng Dụng
                  </span>
                  <AudioButton text={currentCard.exampleCn} size="sm" variant="pill" />
                </div>

                <div className="text-center">
                  <h4 className="text-2xl font-black text-amber-400 mb-2">
                    {currentCard.meaning}
                  </h4>
                  <div className="p-3 rounded-2xl bg-white/10 text-xs text-stone-200 text-left mt-3">
                    <div className="font-chinese text-sm font-bold text-white mb-0.5">
                      {currentCard.exampleCn}
                    </div>
                    <div className="text-stone-400 text-[11px]">
                      {currentCard.examplePinyin}
                    </div>
                    <div className="text-amber-200 text-xs mt-1">
                      {currentCard.exampleVn}
                    </div>
                  </div>
                </div>

                <div className="text-center text-[11px] text-stone-400">
                  Thẻ {cardIndex + 1} / {filteredCards.length}
                </div>
              </div>
            </div>
          </div>

          {/* Bottom SRS Controls */}
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => handleCardKnow(false)}
              className="flex-1 max-w-xs py-3 rounded-2xl border border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 font-bold text-xs sm:text-sm transition-all"
            >
              🔄 Cần ôn lại
            </button>
            <button
              onClick={() => handleCardKnow(true)}
              className="flex-1 max-w-xs py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs sm:text-sm shadow-md transition-all"
            >
              ✨ Đã thuộc (+10 XP)
            </button>
          </div>
        </div>
      )}

      {/* Completion Modal */}
      <CelebrationModal
        isOpen={showCelebration}
        title="Xuất Sắc! Hoàn Thành Phần Luyện Tập 🎉"
        subtitle="Bạn đã hoàn thành các câu hỏi thực hành và tích lũy thêm nhiều kinh nghiệm phản xạ."
        xpGained={60}
        onClose={() => setShowCelebration(false)}
        actionText="Tiếp tục học"
      />
    </div>
  );
};
