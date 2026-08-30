import { useState, useEffect } from 'react';
import { Header } from './components/Header';
import type { ActiveTabType } from './components/Header';
import { DialogueList } from './components/Dialogue/DialogueList';
import { DialogueViewer } from './components/Dialogue/DialogueViewer';
import { RoleplayMode } from './components/Dialogue/RoleplayMode';
import { ShadowingHub } from './components/Shadowing/ShadowingHub';
import { ToneMaster } from './components/ToneMaster/ToneMaster';
import { PracticeHub } from './components/Practice/PracticeHub';
import { HSKExamHub } from './components/HSKExam/HSKExamHub';
import { VocabNotebook } from './components/Notebook/VocabNotebook';
import { AIChatBot } from './components/AIAssistant/AIChatBot';
import { AmbientBackground } from './components/Common/AmbientBackground';
import { XpGainToastContainer } from './components/Common/XpGainToast';
import type { Dialogue, UserProgress } from './types/chinese';
import { getUserProgress } from './utils/storage';
import { Globe } from 'lucide-react';

export function App() {
  const [activeTab, setActiveTab] = useState<ActiveTabType>('dialogues');
  const [selectedDialogue, setSelectedDialogue] = useState<Dialogue | null>(null);
  const [isRoleplaying, setIsRoleplaying] = useState(false);
  const [progress, setProgress] = useState<UserProgress>(getUserProgress());
  const [showParticles, setShowParticles] = useState<boolean>(true);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') === 'dark' ||
        (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
    return false;
  });

  // Apply dark mode class to <html>
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  const refreshProgress = () => {
    setProgress(getUserProgress());
  };

  const handleSelectDialogue = (dialogue: Dialogue) => {
    setSelectedDialogue(dialogue);
    setIsRoleplaying(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBackToList = () => {
    setSelectedDialogue(null);
    setIsRoleplaying(false);
    refreshProgress();
  };

  const handleStartRoleplay = () => {
    setIsRoleplaying(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleExitRoleplay = () => {
    setIsRoleplaying(false);
    refreshProgress();
  };

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950 text-stone-800 dark:text-stone-100 flex flex-col font-sans transition-colors duration-200 relative">
      {/* Ambient Floating Oriental Elements & Petals */}
      <AmbientBackground enabled={showParticles} />

      {/* Floating XP Reward Toasts */}
      <XpGainToastContainer />

      {/* Top Navbar */}
      <Header
        activeTab={activeTab}
        onSelectTab={(tab) => {
          setActiveTab(tab);
          setSelectedDialogue(null);
          setIsRoleplaying(false);
        }}
        progress={progress}
        isDarkMode={isDarkMode}
        onToggleDarkMode={() => setIsDarkMode(!isDarkMode)}
        showParticles={showParticles}
        onToggleParticles={() => setShowParticles(!showParticles)}
      />

      {/* Main App Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {/* DIALOGUES TAB */}
        {activeTab === 'dialogues' && (
          <>
            {isRoleplaying && selectedDialogue ? (
              <RoleplayMode
                dialogue={selectedDialogue}
                onExit={handleExitRoleplay}
                onCompleted={refreshProgress}
              />
            ) : selectedDialogue ? (
              <DialogueViewer
                dialogue={selectedDialogue}
                onBack={handleBackToList}
                onStartRoleplay={handleStartRoleplay}
                onProgressUpdate={refreshProgress}
              />
            ) : (
              <DialogueList
                onSelectDialogue={handleSelectDialogue}
                completedIds={progress.completedDialogueIds}
              />
            )}
          </>
        )}

        {/* SHADOWING TAB */}
        {activeTab === 'shadowing' && <ShadowingHub />}

        {/* TONE MASTER TAB */}
        {activeTab === 'tones' && <ToneMaster />}

        {/* PRACTICE HUB TAB */}
        {activeTab === 'practice' && <PracticeHub />}

        {/* HSK MOCK EXAM TAB */}
        {activeTab === 'hsk' && <HSKExamHub />}

        {/* VOCABULARY NOTEBOOK TAB */}
        {activeTab === 'notebook' && <VocabNotebook onUpdate={refreshProgress} />}

        {/* AI CHAT TAB */}
        {activeTab === 'chat' && <AIChatBot />}
      </main>

      {/* Footer */}
      <footer className="border-t border-stone-200 dark:border-stone-800 bg-white/60 dark:bg-stone-900/60 backdrop-blur-xs py-8 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-stone-500 dark:text-stone-400">
          <div className="flex items-center gap-2">
            <span className="font-bold text-stone-800 dark:text-stone-200">HanYuFlow 汉语流</span>
            <span>— Web App Học Tiếng Trung Giao Tiếp Thực Chiến Cho Người Việt</span>
          </div>

          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <Globe size={14} className="text-red-500" />
              Chữ Hán • Pinyin • Âm Hán-Việt
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              Phản Xạ Giọng Nói AI
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
