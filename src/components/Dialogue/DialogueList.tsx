import type React from 'react';
import { useState } from 'react';
import { Search, Sparkles, CheckCircle2, Clock, PlayCircle } from 'lucide-react';
import type { Dialogue } from '../../types/chinese';
import { DIALOGUES } from '../../data/dialogues';

interface DialogueListProps {
  onSelectDialogue: (dialogue: Dialogue) => void;
  completedIds?: string[];
}

export const DialogueList: React.FC<DialogueListProps> = ({
  onSelectDialogue,
  completedIds = [],
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedLevel, setSelectedLevel] = useState<string>('all');

  const categories = [
    { id: 'all', label: 'Tất cả chủ đề', icon: '🌟' },
    { id: 'restaurant', label: 'Ăn uống', icon: '🍜' },
    { id: 'shopping', label: 'Mua sắm', icon: '🛍️' },
    { id: 'travel', label: 'Du lịch & Đường sá', icon: '🚕' },
    { id: 'hotel', label: 'Khách sạn', icon: '🏨' },
    { id: 'dating', label: 'Kết bạn', icon: '☕' },
    { id: 'work', label: 'Công sở', icon: '💼' },
    { id: 'hospital', label: 'Y tế & Bệnh viện', icon: '🏥' },
    { id: 'airport', label: 'Sân bay', icon: '✈️' },
  ];

  const levels = ['all', 'HSK 1', 'HSK 2', 'HSK 3', 'HSK 4'];

  const filteredDialogues = DIALOGUES.filter((d) => {
    const matchesSearch =
      d.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.titleCn.includes(searchQuery) ||
      d.pinyin.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.sinoVietnamese.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = selectedCategory === 'all' || d.category === selectedCategory;
    const matchesLevel = selectedLevel === 'all' || d.level === selectedLevel;

    return matchesSearch && matchesCategory && matchesLevel;
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fade-in pb-16">
      {/* Hero Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-red-800 via-red-600 to-amber-600 p-6 sm:p-10 text-white shadow-xl">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-white text-xs font-bold mb-3">
            <Sparkles size={14} className="text-amber-300" />
            Hội Thoại Tình Huống Thực Chiến 100%
          </div>
          <h1 className="text-2xl sm:text-4xl font-black mb-2 tracking-tight">
            Luyện Giao Tiếp Tiếng Trung Cùng AI
          </h1>
          <p className="text-stone-100 text-sm sm:text-base font-normal mb-6 leading-relaxed">
            Học qua các tình huống đời thực với chữ Hán, Pinyin, Hán-Việt và đối thoại giọng nói trực tiếp để phản xạ tự nhiên.
          </p>

          {/* Search Box */}
          <div className="relative max-w-lg">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
            <input
              type="text"
              placeholder="Tìm kiếm chủ đề, chữ Hán (点餐, 买东西...), phiên âm..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3 rounded-2xl bg-white text-stone-900 placeholder-stone-400 text-sm font-medium shadow-md focus:outline-hidden focus:ring-2 focus:ring-amber-400 transition-all"
            />
          </div>
        </div>

        {/* Decorative Chinese Calligraphy watermark */}
        <div className="absolute right-4 bottom-0 select-none pointer-events-none opacity-15 font-calligraphy text-9xl sm:text-[180px] text-white">
          交流
        </div>
      </div>

      {/* Category Pills Filter */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`flex items-center gap-1.5 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all duration-150 shrink-0 ${
              selectedCategory === cat.id
                ? 'bg-red-600 text-white shadow-md shadow-red-600/30 scale-102'
                : 'bg-white dark:bg-stone-900 text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-800 hover:border-red-300 dark:hover:border-red-800 hover:bg-red-50/50'
            }`}
          >
            <span>{cat.icon}</span>
            <span>{cat.label}</span>
          </button>
        ))}
      </div>

      {/* Level Filters */}
      <div className="flex items-center justify-between gap-4">
        <div className="text-sm font-bold text-stone-700 dark:text-stone-300 flex items-center gap-2">
          <span>Danh sách bài học</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-stone-200 dark:bg-stone-800 text-stone-600 dark:text-stone-400">
            {filteredDialogues.length} chủ đề
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-xs text-stone-400 font-medium hidden sm:inline">Cấp độ:</span>
          {levels.map((lvl) => (
            <button
              key={lvl}
              onClick={() => setSelectedLevel(lvl)}
              className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all ${
                selectedLevel === lvl
                  ? 'bg-stone-900 dark:bg-white text-white dark:text-stone-900'
                  : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:bg-stone-200'
              }`}
            >
              {lvl === 'all' ? 'Tất cả' : lvl}
            </button>
          ))}
        </div>
      </div>

      {/* Dialogue Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredDialogues.map((dialogue) => {
          const isCompleted = completedIds.includes(dialogue.id);

          return (
            <div
              key={dialogue.id}
              onClick={() => onSelectDialogue(dialogue)}
              className="group relative bg-white dark:bg-stone-900 rounded-3xl p-6 border border-stone-200/80 dark:border-stone-800 hover:border-red-400 dark:hover:border-red-600 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer flex flex-col justify-between"
            >
              <div>
                {/* Header: Icon & Badges */}
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="text-4xl p-3 rounded-2xl bg-stone-50 dark:bg-stone-800 group-hover:scale-110 transition-transform duration-200">
                    {dialogue.icon}
                  </div>
                  <div className="flex items-center gap-2">
                    {isCompleted && (
                      <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-xs font-bold">
                        <CheckCircle2 size={13} />
                        Đã xong
                      </span>
                    )}
                    <span className="px-2.5 py-1 rounded-full bg-red-50 dark:bg-red-950/80 text-red-600 dark:text-red-400 text-xs font-black">
                      {dialogue.level}
                    </span>
                  </div>
                </div>

                {/* Title and Chinese info */}
                <h3 className="text-lg font-bold text-stone-900 dark:text-white group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors mb-1">
                  {dialogue.title}
                </h3>
                <div className="flex items-center gap-2 text-xs text-stone-500 dark:text-stone-400 mb-3">
                  <span className="font-chinese font-bold text-stone-800 dark:text-stone-200">
                    {dialogue.titleCn}
                  </span>
                  <span>•</span>
                  <span>{dialogue.pinyin}</span>
                </div>

                <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-300 line-clamp-2 mb-4 leading-relaxed">
                  {dialogue.description}
                </p>
              </div>

              {/* Bottom Metadata & CTA */}
              <div className="pt-4 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between">
                <div className="flex items-center gap-3 text-xs text-stone-400 font-medium">
                  <span className="flex items-center gap-1">
                    <Clock size={13} />
                    {dialogue.durationMinutes} phút
                  </span>
                  <span>•</span>
                  <span>{dialogue.lines.length} câu thoại</span>
                </div>

                <span className="inline-flex items-center gap-1 text-xs font-bold text-red-600 dark:text-red-400 group-hover:translate-x-1 transition-transform">
                  Học ngay <PlayCircle size={15} />
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {filteredDialogues.length === 0 && (
        <div className="text-center py-16 bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 p-8">
          <p className="text-stone-400 text-sm">Không tìm thấy bài học nào phù hợp với tìm kiếm của bạn.</p>
        </div>
      )}
    </div>
  );
};
