import type React from 'react';
import { useState } from 'react';
import { Play, Clock, Layers, ArrowRight, Film, Link, ExternalLink } from 'lucide-react';
import { SHADOWING_VIDEOS } from '../../data/shadowingVideos';
import type { ShadowingVideo } from '../../types/shadowing';
import { extractYouTubeId } from '../../utils/youtube';
import { playSoundEffect } from '../../utils/speech';

interface ShadowingVideoListProps {
  onSelectVideo: (video: ShadowingVideo) => void;
}

export const ShadowingVideoList: React.FC<ShadowingVideoListProps> = ({
  onSelectVideo,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedLevel, setSelectedLevel] = useState<string>('all');
  const [customUrl, setCustomUrl] = useState('');

  const categories = [
    { id: 'all', label: 'Tất cả video' },
    { id: 'daily', label: '🐼 Panda Studio: Đời sống' },
    { id: 'food', label: '🍜 Panda Studio: Ăn uống & Mua sắm' },
    { id: 'interview', label: '💼 Panda Studio: Công sở & Phỏng vấn' },
    { id: 'vlog', label: '☕ Panda Studio: Kết bạn & Sở thích' },
  ];

  const levels = ['all', 'HSK 1-2', 'HSK 3-4', 'HSK 5+'];

  const filteredVideos = SHADOWING_VIDEOS.filter((v) => {
    const matchCat = selectedCategory === 'all' || v.category === selectedCategory;
    const matchLvl = selectedLevel === 'all' || v.level === selectedLevel;
    return matchCat && matchLvl;
  });

  const handleStart = (video: ShadowingVideo) => {
    playSoundEffect('click');
    onSelectVideo(video);
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customUrl.trim()) return;

    const extractedId = extractYouTubeId(customUrl);
    if (!extractedId) return;

    const newCustomVideo: ShadowingVideo = {
      id: `custom-${Date.now()}`,
      title: `Video Panda Studio / YouTube (${extractedId})`,
      youtubeId: extractedId,
      thumbnailUrl: `https://img.youtube.com/vi/${extractedId}/hqdefault.jpg`,
      category: 'vlog',
      level: 'HSK 1-2',
      durationText: 'Tùy chỉnh',
      description: 'Luyện nghe ngữ điệu và phát âm Shadowing trực tiếp theo video YouTube từ kênh Panda Studio (@PandaStudio24).',
      subtitles: [
        {
          id: 'c-1',
          startTime: 0,
          endTime: 4.5,
          speaker: 'Panda Studio',
          hanzi: '你好！欢迎来到Panda Studio中文课堂，今天我们一起练习口语。',
          pinyin: 'Nǐ hǎo! Huānyíng lái dào Panda Studio zhōngwén kètáng, jīntiān wǒmen yìqǐ liànxí kǒuyǔ.',
          sinoVietnamese: 'Nhĩ hảo! Hoan nghênh lai đáo Panda Studio trung văn khóa đường, kim thiên ngã môn nhất khởi luyện tập khẩu ngữ.',
          vietnamese: 'Xin chào! Hoan nghênh bạn đến với lớp học tiếng Trung Panda Studio, hôm nay chúng ta cùng luyện khẩu ngữ nhé.',
        },
        {
          id: 'c-2',
          startTime: 4.6,
          endTime: 9.0,
          speaker: 'Panda Studio',
          hanzi: '跟着视频一句一句跟读，你的中文发音会越来越标准！',
          pinyin: 'Gēnzhe shìpín yí jù yí jù gēndú, nǐ de zhōngwén fāyīn huì yuè lái yuè biāozhǔn!',
          sinoVietnamese: 'Căn trứ thị tần nhất cú nhất cú căn độc, nhĩ đích trung văn phát âm hội việt lai việt tiêu chuẩn!',
          vietnamese: 'Nhại theo video từng câu từng chữ, phát âm tiếng Trung của bạn sẽ ngày càng chuẩn xác!',
        }
      ]
    };

    playSoundEffect('correct');
    onSelectVideo(newCustomVideo);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fade-in pb-20">
      {/* Header Banner with Panda Studio Badge */}
      <div className="p-6 sm:p-10 rounded-3xl bg-gradient-to-r from-red-700 via-rose-700 to-amber-600 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-white/20 backdrop-blur-md text-white text-xs font-bold">
              <Film size={14} className="text-amber-200" />
              Chuyên Mục Shadowing Kênh Panda Studio 🐼
            </span>
            <a
              href="https://www.youtube.com/@PandaStudio24"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-md text-xs font-bold text-amber-200 hover:text-white transition-colors"
            >
              <span>@PandaStudio24</span>
              <ExternalLink size={12} />
            </a>
          </div>

          <h1 className="text-2xl sm:text-4xl font-black tracking-tight">
            Luyện Shadowing Kênh Panda Studio (@PandaStudio24)
          </h1>
          <p className="text-stone-100 text-xs sm:text-sm leading-relaxed">
            Học các mẫu câu giao tiếp đời sống, công sở và luyện nghe thụ động tuyển chọn từ kênh YouTube Panda Studio với phụ đề đồng bộ, phát âm chuẩn và AI chấm điểm phát âm!
          </p>
        </div>
        <div className="absolute right-4 bottom-[-20px] select-none pointer-events-none opacity-15 font-calligraphy text-9xl sm:text-[180px] text-white">
          熊猫
        </div>
      </div>

      {/* Quick Paste Custom YouTube URL Box */}
      <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-md space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <span className="text-xs font-bold text-stone-700 dark:text-stone-300 flex items-center gap-1.5">
            <Link size={15} className="text-red-500" />
            <span>Dán Bất Kỳ Link Video Nào Từ Kênh @PandaStudio24:</span>
          </span>
          <a
            href="https://www.youtube.com/@PandaStudio24/videos"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[11px] text-red-600 dark:text-red-400 font-semibold hover:underline flex items-center gap-1"
          >
            <span>Xem kho video trên YouTube Panda Studio</span>
            <ExternalLink size={11} />
          </a>
        </div>

        <form onSubmit={handleCustomSubmit} className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Dán link video Panda Studio tại đây (vd: https://www.youtube.com/watch?v=...)"
            value={customUrl}
            onChange={(e) => setCustomUrl(e.target.value)}
            className="flex-1 px-4 py-2.5 rounded-2xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs sm:text-sm text-stone-900 dark:text-white placeholder-stone-400 focus:outline-hidden focus:ring-2 focus:ring-red-500"
          />
          <button
            type="submit"
            className="px-5 py-2.5 rounded-2xl bg-stone-900 hover:bg-stone-800 dark:bg-white dark:hover:bg-stone-100 text-white dark:text-stone-900 font-bold text-xs sm:text-sm shadow-md transition-all shrink-0 cursor-pointer"
          >
            Mở Video
          </button>
        </form>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none w-full sm:w-auto">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3.5 py-2 rounded-2xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === cat.id
                  ? 'bg-red-600 text-white shadow-md'
                  : 'bg-white dark:bg-stone-900 text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-800 hover:border-red-300'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Level Filters */}
        <div className="flex items-center gap-1.5 bg-white dark:bg-stone-900 p-1.5 rounded-2xl border border-stone-200 dark:border-stone-800 text-xs font-bold self-end sm:self-auto">
          {levels.map((lvl) => (
            <button
              key={lvl}
              onClick={() => setSelectedLevel(lvl)}
              className={`px-3 py-1 rounded-xl transition-all cursor-pointer ${
                selectedLevel === lvl
                  ? 'bg-stone-900 dark:bg-white text-white dark:text-stone-900'
                  : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              {lvl === 'all' ? 'Tất cả HSK' : lvl}
            </button>
          ))}
        </div>
      </div>

      {/* Video Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredVideos.map((video) => (
          <div
            key={video.id}
            onClick={() => handleStart(video)}
            className="rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col justify-between group cursor-pointer"
          >
            <div>
              {/* Thumbnail with overlay badge & duration */}
              <div className="relative aspect-video overflow-hidden bg-stone-900">
                <img
                  src={video.thumbnailUrl}
                  alt={video.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90 group-hover:opacity-100"
                />

                {/* Level badge */}
                <div className="absolute top-3 left-3 px-3 py-1 rounded-xl bg-black/60 backdrop-blur-md text-white text-xs font-bold">
                  {video.level}
                </div>

                {/* Duration */}
                <div className="absolute bottom-3 right-3 px-2.5 py-1 rounded-lg bg-black/70 backdrop-blur-md text-white text-[11px] font-mono font-semibold flex items-center gap-1">
                  <Clock size={12} />
                  <span>{video.durationText}</span>
                </div>

                {/* Play hover button */}
                <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/40 transition-colors">
                  <div className="w-14 h-14 rounded-full bg-red-600/90 text-white flex items-center justify-center shadow-lg group-hover:scale-110 active:scale-95 transition-transform">
                    <Play size={24} className="ml-1 fill-white" />
                  </div>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-5 sm:p-6 space-y-2">
                <h3 className="text-base sm:text-lg font-bold text-stone-900 dark:text-white group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors line-clamp-2">
                  {video.title}
                </h3>
                <p className="text-xs text-stone-500 dark:text-stone-400 line-clamp-2 leading-relaxed">
                  {video.description}
                </p>
              </div>
            </div>

            {/* Card Footer */}
            <div className="px-5 sm:px-6 pb-5 pt-2 flex items-center justify-between border-t border-stone-100 dark:border-stone-800">
              <span className="text-xs font-semibold text-stone-500 dark:text-stone-400 flex items-center gap-1">
                <Layers size={14} className="text-red-500" />
                <span>{video.subtitles.length} câu phụ đề đồng bộ</span>
              </span>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleStart(video);
                }}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-red-600 to-amber-600 text-white font-bold text-xs shadow-xs hover:shadow-md transition-all flex items-center gap-1 cursor-pointer"
              >
                <span>Luyện Shadowing</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
