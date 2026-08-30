import type React from 'react';
import { useState } from 'react';
import { Play, Clock, Layers, ArrowRight, Film, Link } from 'lucide-react';
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
    { id: 'all', label: 'Tất cả chủ đề' },
    { id: 'food', label: '🍜 Ẩm thực & Chợ đêm' },
    { id: 'drama', label: '🎬 Phim ngắn đời sống' },
    { id: 'interview', label: '🎤 Phỏng vấn đường phố' },
    { id: 'vlog', label: '🚄 Tàu cao tốc & Du lịch' },
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
      title: `Video YouTube Tùy Chọn (${extractedId})`,
      youtubeId: extractedId,
      thumbnailUrl: `https://img.youtube.com/vi/${extractedId}/hqdefault.jpg`,
      category: 'vlog',
      level: 'HSK 3-4',
      durationText: 'Tùy chỉnh',
      description: 'Luyện nghe ngữ điệu và phát âm Shadowing trực tiếp theo video YouTube do bạn chọn.',
      subtitles: [
        {
          id: 'c-1',
          startTime: 0,
          endTime: 5.0,
          speaker: 'Người Nói',
          hanzi: '你好，欢迎来到中文世界，今天我们一起学习！',
          pinyin: 'Nǐ hǎo, huānyíng lái dào zhōngwén shìjiè, jīntiān wǒmen yìqǐ xuéxí!',
          sinoVietnamese: 'Nhĩ hảo, hoan nghênh lai đáo trung văn thế giới, kim thiên ngã môn nhất khởi học tập!',
          vietnamese: 'Xin chào, hoan nghênh bạn đến với thế giới tiếng Trung, hôm nay chúng ta cùng học tập!',
        },
        {
          id: 'c-2',
          startTime: 5.0,
          endTime: 10.0,
          speaker: 'Người Nói',
          hanzi: '跟着视频练习中文发音，你的口语会越来越流利。',
          pinyin: 'Gēnzhe shìpín liànxí zhōngwén fāyīn, nǐ de kǒuyǔ huì yuè lái yuè liúlì.',
          sinoVietnamese: 'Căn trứ thị tần luyện tập trung văn phát âm, nhĩ đích khẩu ngữ hội việt lai việt lưu lợi.',
          vietnamese: 'Luyện phát âm tiếng Trung theo video, khẩu ngữ của bạn sẽ ngày càng lưu loát.',
        }
      ]
    };

    playSoundEffect('correct');
    onSelectVideo(newCustomVideo);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fade-in pb-20">
      {/* Header Banner */}
      <div className="p-6 sm:p-10 rounded-3xl bg-gradient-to-r from-red-700 via-rose-700 to-amber-600 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 max-w-2xl space-y-3">
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-white/20 backdrop-blur-md text-white text-xs font-bold">
            <Film size={14} className="text-amber-200" />
            Phương Pháp Shadowing Video YouTube
          </span>
          <h1 className="text-2xl sm:text-4xl font-black tracking-tight">
            Luyện Phản Xạ Nói & Ngữ Điệu Bản Xứ
          </h1>
          <p className="text-stone-100 text-xs sm:text-sm leading-relaxed">
            Xem video YouTube, nghe người bản xứ nói trong vlog / phim ảnh thực tế, lặp lại từng câu và để AI phân tích chấm điểm chuẩn xác theo thời gian thực!
          </p>
        </div>
        <div className="absolute right-4 bottom-[-20px] select-none pointer-events-none opacity-15 font-calligraphy text-9xl sm:text-[180px] text-white">
          视频
        </div>
      </div>

      {/* Quick Paste Custom YouTube URL Box */}
      <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-md space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-stone-700 dark:text-stone-300 flex items-center gap-1.5">
            <Link size={15} className="text-red-500" />
            <span>Dán Bất Kỳ Link Video YouTube Tiếng Trung Nào Bạn Thích:</span>
          </span>
          <span className="text-[11px] text-stone-400">
            Hỗ trợ link đầy đủ hoặc link rút gọn youtu.be
          </span>
        </div>

        <form onSubmit={handleCustomSubmit} className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Dán link YouTube tại đây (vd: https://www.youtube.com/watch?v=...)"
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
              className={`px-3.5 py-2 rounded-2xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all ${
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
              className={`px-3 py-1 rounded-xl transition-all ${
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
                <span>Bắt đầu Shadowing</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
