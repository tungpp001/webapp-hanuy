import type React from 'react';
import { useState } from 'react';
import {
  BookOpen,
  Layers,
  Gamepad2,
  Film,
  MoreHorizontal,
  Music,
  Puzzle,
  Award,
  Bookmark,
  MessageSquare,
  Moon,
  Sun,
  X,
  Download
} from 'lucide-react';
import type { ActiveTabType } from '../Header';
import { playSoundEffect } from '../../utils/speech';

interface MobileNavProps {
  activeTab: ActiveTabType;
  onSelectTab: (tab: ActiveTabType) => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  showParticles?: boolean;
  onToggleParticles?: () => void;
}

export const MobileNav: React.FC<MobileNavProps> = ({
  activeTab,
  onSelectTab,
  isDarkMode,
  onToggleDarkMode,
  showParticles = true,
  onToggleParticles,
}) => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const mainTabs: { id: ActiveTabType; label: string; icon: React.ReactNode }[] = [
    { id: 'dialogues', label: 'Hội Thoại', icon: <BookOpen size={20} /> },
    { id: 'flashcards', label: 'Flashcards', icon: <Layers size={20} /> },
    { id: 'games', label: 'Trò Chơi', icon: <Gamepad2 size={20} /> },
    { id: 'shadowing', label: 'Shadowing', icon: <Film size={20} /> },
  ];

  const allTools: { id: ActiveTabType; label: string; desc: string; icon: React.ReactNode; color: string }[] = [
    { id: 'dialogues', label: 'Hội Thoại Thực Chiến', desc: 'Mẫu câu & nhập vai giọng nói', icon: <BookOpen size={20} />, color: 'from-red-500 to-rose-600' },
    { id: 'flashcards', label: 'Flashcards HSK 1 - 6', desc: 'Thẻ 3D & hình ảnh minh họa', icon: <Layers size={20} />, color: 'from-amber-500 to-red-600' },
    { id: 'games', label: 'Đấu Trường Game', desc: 'Bắn súng gõ chữ, ghép câu, nhớ bài', icon: <Gamepad2 size={20} />, color: 'from-violet-500 to-purple-600' },
    { id: 'shadowing', label: 'Video Shadowing', desc: 'Luyện nhại giọng theo YouTube', icon: <Film size={20} />, color: 'from-rose-500 to-pink-600' },
    { id: 'tones', label: 'Luyện 4 Thanh Điệu', desc: 'Nhận diện thanh điệu chuẩn xác', icon: <Music size={20} />, color: 'from-sky-500 to-blue-600' },
    { id: 'practice', label: 'Luyện Tập & Viết Hán Tự', desc: 'Thuận bút, trắc nghiệm pinyin', icon: <Puzzle size={20} />, color: 'from-emerald-500 to-teal-600' },
    { id: 'hsk', label: 'Đề Thi Thử HSK', desc: 'Luyện thi chuẩn HSK 1 - 6 bấm giờ', icon: <Award size={20} />, color: 'from-amber-600 to-orange-600' },
    { id: 'notebook', label: 'Sổ Tay Từ Vựng', desc: 'Từ vựng đã lưu & quản lý ôn tập', icon: <Bookmark size={20} />, color: 'from-teal-500 to-cyan-600' },
    { id: 'chat', label: 'Trợ Lý AI Tiểu Hoa', desc: 'Hội thoại & sửa lỗi ngữ pháp', icon: <MessageSquare size={20} />, color: 'from-fuchsia-500 to-rose-600' },
  ];

  const handleTabSelect = (tab: ActiveTabType) => {
    playSoundEffect('click');
    onSelectTab(tab);
    setIsDrawerOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <>
      {/* Bottom Fixed Navigation Bar for Mobile */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-stone-900/95 backdrop-blur-lg border-t border-stone-200 dark:border-stone-800 shadow-2xl safe-area-bottom">
        <div className="flex items-center justify-around h-16 px-2">
          {mainTabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabSelect(tab.id)}
                className={`flex-1 flex flex-col items-center justify-center gap-1 py-1 rounded-2xl transition-all cursor-pointer ${
                  isActive
                    ? 'text-red-600 dark:text-red-400 font-extrabold scale-105'
                    : 'text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200 font-semibold'
                }`}
              >
                <div className={`p-1 rounded-xl transition-all ${isActive ? 'bg-red-50 dark:bg-red-950/60' : ''}`}>
                  {tab.icon}
                </div>
                <span className="text-[10px] tracking-tight">{tab.label}</span>
              </button>
            );
          })}

          {/* More / Menu Drawer Toggle */}
          <button
            onClick={() => {
              playSoundEffect('click');
              setIsDrawerOpen(true);
            }}
            className={`flex-1 flex flex-col items-center justify-center gap-1 py-1 rounded-2xl transition-all cursor-pointer ${
              !mainTabs.some(t => t.id === activeTab)
                ? 'text-red-600 dark:text-red-400 font-extrabold scale-105'
                : 'text-stone-500 dark:text-stone-400 font-semibold'
            }`}
          >
            <div className={`p-1 rounded-xl transition-all ${!mainTabs.some(t => t.id === activeTab) ? 'bg-red-50 dark:bg-red-950/60' : ''}`}>
              <MoreHorizontal size={20} />
            </div>
            <span className="text-[10px] tracking-tight">Thêm ⋯</span>
          </button>
        </div>
      </nav>

      {/* Slide-Up Bottom Drawer / Modal */}
      {isDrawerOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex flex-col justify-end bg-black/60 backdrop-blur-xs animate-fade-in">
          {/* Backdrop dismiss */}
          <div className="flex-1" onClick={() => setIsDrawerOpen(false)} />

          {/* Drawer Content */}
          <div className="bg-white dark:bg-stone-900 rounded-t-3xl border-t border-stone-200 dark:border-stone-800 shadow-2xl p-5 max-h-[85vh] overflow-y-auto space-y-4 animate-slide-up">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-stone-200 dark:border-stone-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-red-600 to-amber-500 text-white flex items-center justify-center font-calligraphy text-lg font-bold shadow-xs">
                  语
                </div>
                <span className="font-extrabold text-stone-900 dark:text-white text-base">
                  Khám Phá HanYuFlow
                </span>
              </div>
              <button
                onClick={() => setIsDrawerOpen(false)}
                className="p-2 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Quick Actions (Theme & Petals) */}
            <div className="grid grid-cols-2 gap-2.5">
              <button
                onClick={() => {
                  playSoundEffect('click');
                  onToggleDarkMode();
                }}
                className="p-3 rounded-2xl bg-stone-50 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700 flex items-center justify-between text-xs font-bold text-stone-800 dark:text-stone-200 cursor-pointer"
              >
                <span>Chế độ hiển thị</span>
                {isDarkMode ? <Sun size={16} className="text-amber-400" /> : <Moon size={16} />}
              </button>

              {onToggleParticles && (
                <button
                  onClick={() => {
                    playSoundEffect('click');
                    onToggleParticles();
                  }}
                  className={`p-3 rounded-2xl border flex items-center justify-between text-xs font-bold cursor-pointer ${
                    showParticles
                      ? 'bg-red-50 dark:bg-red-950/60 border-red-200 dark:border-red-800 text-red-600 dark:text-red-300'
                      : 'bg-stone-50 dark:bg-stone-800/80 border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-400'
                  }`}
                >
                  <span>Hoa đào rơi</span>
                  <span>{showParticles ? '🌸 Bật' : '🌸 Tắt'}</span>
                </button>
              )}
            </div>

            {/* All Modules List */}
            <div className="space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400 block px-1">
                Tất cả chức năng học tập
              </span>

              <div className="grid grid-cols-1 gap-2">
                {allTools.map((tool) => {
                  const isSelected = activeTab === tool.id;
                  return (
                    <button
                      key={tool.id}
                      onClick={() => handleTabSelect(tool.id)}
                      className={`w-full p-3.5 rounded-2xl flex items-center gap-3.5 text-left border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-red-50 dark:bg-red-950/60 border-red-300 dark:border-red-800 shadow-xs'
                          : 'bg-stone-50/70 dark:bg-stone-800/40 border-stone-200/70 dark:border-stone-800 hover:bg-stone-100'
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-xl bg-gradient-to-tr ${tool.color} text-white flex items-center justify-center shadow-xs shrink-0`}>
                        {tool.icon}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={`text-sm font-bold truncate ${isSelected ? 'text-red-600 dark:text-red-400' : 'text-stone-900 dark:text-white'}`}>
                            {tool.label}
                          </span>
                          {isSelected && (
                            <span className="px-1.5 py-0.2 rounded-md bg-red-600 text-white text-[9px] font-bold">
                              Đang học
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-stone-500 dark:text-stone-400 truncate">
                          {tool.desc}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* PWA Install Guide Banner */}
            <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 dark:from-stone-800 dark:to-stone-800 border border-amber-200 dark:border-stone-700 text-xs text-stone-700 dark:text-stone-300 flex items-center gap-3">
              <div className="p-2 rounded-xl bg-amber-500 text-white shrink-0">
                <Download size={16} />
              </div>
              <div className="flex-1 leading-snug">
                <span className="font-bold block text-stone-900 dark:text-white">Cài đặt ứng dụng vào điện thoại</span>
                <span>Nhấn <strong>Chia sẻ (iOS)</strong> hoặc <strong>⋯ (Android)</strong> rồi chọn <strong>"Thêm vào Màn hình chính"</strong> để học tiện lợi nhất!</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
