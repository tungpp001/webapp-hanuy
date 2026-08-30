import type React from 'react';
import { 
  BookOpen, 
  Music, 
  Puzzle, 
  MessageSquare, 
  Moon, 
  Sun
} from 'lucide-react';
import type { UserProgress } from '../types/chinese';
import { ScoreBadge } from './Common/ScoreBadge';
import { playSoundEffect } from '../utils/speech';

export type ActiveTabType = 'dialogues' | 'tones' | 'practice' | 'chat';

interface HeaderProps {
  activeTab: ActiveTabType;
  onSelectTab: (tab: ActiveTabType) => void;
  progress: UserProgress;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onSelectTab,
  progress,
  isDarkMode,
  onToggleDarkMode,
}) => {
  const navItems: { id: ActiveTabType; label: string; icon: React.ReactNode }[] = [
    { id: 'dialogues', label: 'Hội Thoại', icon: <BookOpen size={17} /> },
    { id: 'tones', label: 'Luyện 4 Thanh', icon: <Music size={17} /> },
    { id: 'practice', label: 'Luyện Tập & Thẻ', icon: <Puzzle size={17} /> },
    { id: 'chat', label: 'Trợ Lý AI', icon: <MessageSquare size={17} /> },
  ];

  const handleTabClick = (tab: ActiveTabType) => {
    playSoundEffect('click');
    onSelectTab(tab);
  };

  return (
    <header className="sticky top-0 z-40 bg-white/80 dark:bg-stone-900/80 backdrop-blur-md border-b border-stone-200/80 dark:border-stone-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20 gap-2">
          {/* Logo & Brand */}
          <div 
            onClick={() => handleTabClick('dialogues')}
            className="flex items-center gap-2.5 cursor-pointer group select-none shrink-0"
          >
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-red-600 to-amber-500 text-white flex items-center justify-center font-calligraphy text-2xl shadow-md shadow-red-500/20 group-hover:scale-105 transition-transform">
              语
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-lg sm:text-xl tracking-tight text-stone-900 dark:text-white group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors">
                  HanYuFlow
                </span>
                <span className="text-xs px-1.5 py-0.5 rounded-md bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300 font-bold font-chinese hidden sm:inline">
                  汉语流
                </span>
              </div>
              <p className="text-[10px] text-stone-400 font-medium hidden md:block">
                Tiếng Trung Giao Tiếp Thực Chiến
              </p>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 bg-stone-100/80 dark:bg-stone-800/80 p-1.5 rounded-2xl border border-stone-200/60 dark:border-stone-700/60">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleTabClick(item.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 ${
                  activeTab === item.id
                    ? 'bg-red-600 text-white shadow-xs scale-102'
                    : 'text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-stone-700/50'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            ))}
          </nav>

          {/* Right Side: Score, Streak, Theme Toggle */}
          <div className="flex items-center gap-2 sm:gap-3">
            <ScoreBadge progress={progress} />

            {/* Dark mode toggle */}
            <button
              onClick={() => {
                playSoundEffect('click');
                onToggleDarkMode();
              }}
              className="p-2.5 rounded-2xl border border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
              title={isDarkMode ? 'Chuyển sang chế độ Sáng' : 'Chuyển sang chế độ Tối'}
            >
              {isDarkMode ? <Sun size={18} className="text-amber-400" /> : <Moon size={18} />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Tabs (Bottom or sub-bar) */}
        <div className="flex md:hidden items-center justify-around py-2 border-t border-stone-100 dark:border-stone-800">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleTabClick(item.id)}
              className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-xl text-[11px] font-bold transition-colors ${
                activeTab === item.id
                  ? 'text-red-600 dark:text-red-400'
                  : 'text-stone-400 hover:text-stone-600'
              }`}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      </div>
    </header>
  );
};
