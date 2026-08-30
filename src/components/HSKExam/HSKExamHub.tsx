import type React from 'react';
import { useState, useEffect } from 'react';
import { HSKExamSelector } from './HSKExamSelector';
import { HSKExamRunner } from './HSKExamRunner';
import { HSKExamResult } from './HSKExamResult';
import type { HSKExamPaper, UserExamResult } from '../../types/hskExam';

const EXAM_HISTORY_KEY = 'hanyuflow_hsk_history_v1';

export const HSKExamHub: React.FC = () => {
  const [activeExam, setActiveExam] = useState<HSKExamPaper | null>(null);
  const [examResult, setExamResult] = useState<UserExamResult | null>(null);
  const [examHistory, setExamHistory] = useState<UserExamResult[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const saved = localStorage.getItem(EXAM_HISTORY_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(EXAM_HISTORY_KEY, JSON.stringify(examHistory));
      } catch (e) {
        console.warn('Failed to save exam history', e);
      }
    }
  }, [examHistory]);

  const handleSelectExam = (exam: HSKExamPaper) => {
    setActiveExam(exam);
    setExamResult(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleExitExam = () => {
    setActiveExam(null);
    setExamResult(null);
  };

  const handleSubmitExam = (result: UserExamResult) => {
    setExamResult(result);
    setExamHistory((prev) => [result, ...prev.filter((h) => h.examId !== result.examId)]);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleRetake = () => {
    setExamResult(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBackToList = () => {
    setActiveExam(null);
    setExamResult(null);
  };

  if (activeExam && examResult) {
    return (
      <HSKExamResult
        exam={activeExam}
        result={examResult}
        onRetake={handleRetake}
        onBackToList={handleBackToList}
      />
    );
  }

  if (activeExam) {
    return (
      <HSKExamRunner
        exam={activeExam}
        onExit={handleExitExam}
        onSubmitExam={handleSubmitExam}
      />
    );
  }

  return (
    <HSKExamSelector
      onSelectExam={handleSelectExam}
      examHistory={examHistory}
    />
  );
};
