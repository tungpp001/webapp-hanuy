import type React from 'react';
import { useState, useRef, useEffect } from 'react';
import { 
  ArrowLeft, 
  RotateCcw, 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Link, 
  Volume2, 
  Film,
  Tv,
  Repeat
} from 'lucide-react';
import type { ShadowingVideo, SubtitleSegment } from '../../types/shadowing';
import { ShadowingRecorder } from './ShadowingRecorder';
import { WordModal } from '../Dialogue/WordModal';
import { extractYouTubeId } from '../../utils/youtube';
import { speakChinese, playSoundEffect } from '../../utils/speech';

interface ShadowingPlayerProps {
  video: ShadowingVideo;
  onBack: () => void;
}

export const ShadowingPlayer: React.FC<ShadowingPlayerProps> = ({ video, onBack }) => {
  const [activeSegmentIndex, setActiveSegmentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);
  const [playerMode, setPlayerMode] = useState<'video' | 'youtube'>(video.videoUrl ? 'video' : 'youtube');
  const [customYouTubeUrl, setCustomYouTubeUrl] = useState('');
  const [currentVideoId, setCurrentVideoId] = useState(video.youtubeId);
  const [isLooping, setIsLooping] = useState(false);

  // Subtitle layer toggles
  const [showPinyin, setShowPinyin] = useState(true);
  const [showSinoVietnamese, setShowSinoVietnamese] = useState(true);
  const [showTranslation, setShowTranslation] = useState(true);

  // Word lookup modal
  const [selectedWord, setSelectedWord] = useState<{
    hanzi: string;
    pinyin: string;
    sinoVietnamese: string;
    meaning: string;
  } | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const activeSegment: SubtitleSegment = video.subtitles[activeSegmentIndex] || video.subtitles[0];

  // Set playback rate when changed
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = playbackSpeed;
    }
  }, [playbackSpeed]);

  // Sync subtitle highlighting as HTML5 video plays
  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const currentTime = videoRef.current.currentTime;

    // Check if active segment should loop
    if (isLooping && currentTime >= activeSegment.endTime) {
      videoRef.current.currentTime = activeSegment.startTime;
      videoRef.current.play();
      return;
    }

    // Find current active segment by timestamp
    const foundIndex = video.subtitles.findIndex(
      (s) => currentTime >= s.startTime && currentTime <= s.endTime
    );

    if (foundIndex !== -1 && foundIndex !== activeSegmentIndex) {
      setActiveSegmentIndex(foundIndex);
    }
  };

  const seekToSegment = (index: number) => {
    if (index < 0 || index >= video.subtitles.length) return;
    setActiveSegmentIndex(index);
    const seg = video.subtitles[index];

    if (videoRef.current) {
      videoRef.current.currentTime = seg.startTime;
      videoRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
    }
    playSoundEffect('click');
  };

  const handleReplaySegment = () => {
    seekToSegment(activeSegmentIndex);
  };

  const handleNextSegment = () => {
    if (activeSegmentIndex < video.subtitles.length - 1) {
      seekToSegment(activeSegmentIndex + 1);
    }
  };

  const handlePrevSegment = () => {
    if (activeSegmentIndex > 0) {
      seekToSegment(activeSegmentIndex - 1);
    }
  };

  const togglePlayPause = () => {
    playSoundEffect('click');
    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
      } else {
        videoRef.current.pause();
        setIsPlaying(false);
      }
    } else {
      setIsPlaying(!isPlaying);
    }
  };

  const handleSpeedChange = (speed: number) => {
    setPlaybackSpeed(speed);
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
    }
    playSoundEffect('click');
  };

  const handleApplyCustomUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customYouTubeUrl.trim()) return;
    const extractedId = extractYouTubeId(customYouTubeUrl);
    if (extractedId) {
      setCurrentVideoId(extractedId);
      setPlayerMode('youtube');
      playSoundEffect('click');
      setCustomYouTubeUrl('');
    }
  };

  const handlePlayTTSFallback = (text: string) => {
    playSoundEffect('click');
    speakChinese(text, playbackSpeed);
  };

  // Word click lookup
  const handleWordClick = (char: string) => {
    setSelectedWord({
      hanzi: char,
      pinyin: '',
      sinoVietnamese: '',
      meaning: `Tra từ chữ "${char}" trong câu hội thoại`,
    });
    playSoundEffect('click');
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-24 animate-fade-in">
      {/* Top Header Navigation */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2.5 rounded-2xl border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
            title="Quay lại danh sách video"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-lg bg-red-100 dark:bg-red-950 text-red-600 dark:text-red-300 text-xs font-black">
                {video.level}
              </span>
              <h1 className="text-base sm:text-lg font-bold text-stone-900 dark:text-white line-clamp-1">
                {video.title}
              </h1>
            </div>
            <span className="text-xs text-stone-400">
              Câu {activeSegmentIndex + 1} / {video.subtitles.length} • Luyện Shadowing phản xạ
            </span>
          </div>
        </div>

        {/* Subtitle Toggles */}
        <div className="flex items-center gap-1.5 bg-stone-100 dark:bg-stone-800/80 p-1.5 rounded-2xl border border-stone-200 dark:border-stone-700 text-xs font-bold">
          <button
            onClick={() => setShowPinyin(!showPinyin)}
            className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
              showPinyin ? 'bg-red-600 text-white shadow-xs' : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            Pinyin
          </button>
          <button
            onClick={() => setShowSinoVietnamese(!showSinoVietnamese)}
            className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
              showSinoVietnamese ? 'bg-red-600 text-white shadow-xs' : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            Hán-Việt
          </button>
          <button
            onClick={() => setShowTranslation(!showTranslation)}
            className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
              showTranslation ? 'bg-red-600 text-white shadow-xs' : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            Bản dịch
          </button>
        </div>
      </div>

      {/* Mode Switcher & Quick Paste Custom YouTube URL Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-xs">
        {/* Source switch pills */}
        <div className="flex items-center gap-1.5 bg-stone-100 dark:bg-stone-800 p-1 rounded-xl shrink-0">
          <button
            onClick={() => setPlayerMode('video')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              playerMode === 'video'
                ? 'bg-red-600 text-white shadow-xs'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
            }`}
          >
            <Film size={14} />
            <span>Video Trực Tiếp (HD 100% Chạy)</span>
          </button>
          <button
            onClick={() => setPlayerMode('youtube')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              playerMode === 'youtube'
                ? 'bg-red-600 text-white shadow-xs'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
            }`}
          >
            <Tv size={14} />
            <span>YouTube Player</span>
          </button>
        </div>

        {/* Input link */}
        <form onSubmit={handleApplyCustomUrl} className="flex items-center gap-2 flex-1 max-w-md">
          <div className="relative flex-1">
            <Link className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={14} />
            <input
              type="text"
              placeholder="Dán link YouTube (vd: https://youtube.com/watch?v=...)"
              value={customYouTubeUrl}
              onChange={(e) => setCustomYouTubeUrl(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-white placeholder-stone-400 border border-stone-200 dark:border-stone-700 focus:outline-hidden focus:ring-2 focus:ring-red-500"
            />
          </div>
          <button
            type="submit"
            className="px-3 py-1.5 bg-stone-900 hover:bg-stone-800 dark:bg-white dark:hover:bg-stone-100 text-white dark:text-stone-900 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer"
          >
            Tải
          </button>
        </form>
      </div>

      {/* Main Grid: Video Player + Sync Subtitles & Shadowing Studio */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (7 Cols): Video Player + Segment Controls */}
        <div className="lg:col-span-7 space-y-4">
          {/* Player Container */}
          <div className="relative rounded-3xl overflow-hidden bg-black shadow-xl aspect-video border-2 border-stone-800 flex items-center justify-center">
            {playerMode === 'video' && video.videoUrl ? (
              <video
                ref={videoRef}
                src={video.videoUrl}
                poster={video.thumbnailUrl}
                onTimeUpdate={handleTimeUpdate}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                className="w-full h-full object-cover"
                playsInline
                controls={false}
              />
            ) : (
              <iframe
                key={currentVideoId}
                src={`https://www.youtube.com/embed/${currentVideoId}?autoplay=0&rel=0&modestbranding=1&playsinline=1`}
                title={video.title}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            )}

            {/* In-video subtitle overlay */}
            <div className="absolute bottom-3 inset-x-4 p-2.5 rounded-2xl bg-black/75 backdrop-blur-md text-white text-center pointer-events-none transition-all">
              {showPinyin && (
                <div className="text-xs text-amber-300 font-medium">
                  {activeSegment.pinyin}
                </div>
              )}
              <div className="text-base sm:text-lg font-bold font-chinese leading-tight">
                {activeSegment.hanzi}
              </div>
              {showTranslation && (
                <div className="text-xs text-stone-200 mt-0.5">
                  {activeSegment.vietnamese}
                </div>
              )}
            </div>
          </div>

          {/* Video Playback Controller Bar */}
          <div className="p-4 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-sm flex items-center justify-between gap-2 flex-wrap">
            {/* Speed selection */}
            <div className="flex items-center gap-1">
              {[0.75, 0.9, 1.0, 1.25].map((speed) => (
                <button
                  key={speed}
                  onClick={() => handleSpeedChange(speed)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    playbackSpeed === speed
                      ? 'bg-stone-900 dark:bg-white text-white dark:text-stone-900 shadow-xs'
                      : 'text-stone-500 hover:bg-stone-100 dark:hover:bg-stone-800'
                  }`}
                >
                  {speed}x
                </button>
              ))}
            </div>

            {/* Prev, Play/Pause, Replay, Loop, Next, TTS */}
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrevSegment}
                disabled={activeSegmentIndex === 0}
                className="p-2 rounded-xl border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 hover:bg-stone-100 disabled:opacity-30 transition-all cursor-pointer"
                title="Câu trước"
              >
                <SkipBack size={16} />
              </button>

              <button
                onClick={handleReplaySegment}
                className="px-3.5 py-2 rounded-xl bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-300 font-bold text-xs flex items-center gap-1.5 shadow-xs hover:scale-105 active:scale-95 transition-all cursor-pointer"
                title="Phát lại câu hiện tại"
              >
                <RotateCcw size={14} />
                <span>Phát lại</span>
              </button>

              <button
                onClick={() => {
                  playSoundEffect('click');
                  setIsLooping(!isLooping);
                }}
                className={`p-2 rounded-xl border transition-all cursor-pointer ${
                  isLooping 
                    ? 'bg-red-600 text-white border-red-600 shadow-xs' 
                    : 'border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300 hover:bg-stone-100'
                }`}
                title={isLooping ? 'Tắt lặp lại câu này' : 'Bật lặp lại câu này liên tục (AB Repeat)'}
              >
                <Repeat size={16} />
              </button>

              <button
                onClick={togglePlayPause}
                className="p-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white shadow-md transition-all active:scale-95 cursor-pointer"
                title={isPlaying ? 'Tạm dừng video' : 'Phát video'}
              >
                {isPlaying ? <Pause size={16} /> : <Play size={16} />}
              </button>

              <button
                onClick={() => handlePlayTTSFallback(activeSegment.hanzi)}
                className="p-2 rounded-xl border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 hover:text-red-600 hover:bg-red-50 transition-all cursor-pointer"
                title="Phát âm thanh mẫu (TTS tiếng Trung bản xứ)"
              >
                <Volume2 size={16} />
              </button>

              <button
                onClick={handleNextSegment}
                disabled={activeSegmentIndex === video.subtitles.length - 1}
                className="p-2 rounded-xl border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 hover:bg-stone-100 disabled:opacity-30 transition-all cursor-pointer"
                title="Câu tiếp theo"
              >
                <SkipForward size={16} />
              </button>
            </div>
          </div>

          {/* Embedded Shadowing Studio Mic */}
          <ShadowingRecorder segment={activeSegment} />
        </div>

        {/* Right Column (5 Cols): Synchronized Subtitle Timeline */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-5 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-stone-900 dark:text-white flex items-center gap-2">
                <span>Phụ Đề Đồng Bộ ({video.subtitles.length} câu)</span>
              </h3>
              <span className="text-[11px] text-stone-400">
                Nhấp vào câu để tua video
              </span>
            </div>

            {/* Scrollable Subtitle Segment List */}
            <div className="space-y-3 max-h-[560px] overflow-y-auto pr-1">
              {video.subtitles.map((sub, idx) => {
                const isActive = activeSegmentIndex === idx;

                return (
                  <div
                    key={sub.id}
                    onClick={() => seekToSegment(idx)}
                    className={`p-4 rounded-2xl border-2 transition-all cursor-pointer text-left relative ${
                      isActive
                        ? 'bg-red-50/70 dark:bg-red-950/40 border-red-500 shadow-md ring-2 ring-red-500/20'
                        : 'bg-stone-50 dark:bg-stone-800/50 border-stone-200/60 dark:border-stone-700/60 hover:border-red-300 hover:bg-white'
                    }`}
                  >
                    {/* Speaker & Timestamp */}
                    <div className="flex items-center justify-between text-[11px] text-stone-400 mb-1.5">
                      <span className="font-bold text-stone-600 dark:text-stone-300">
                        {sub.speaker ? `${sub.speaker}` : `Câu ${idx + 1}`}
                      </span>
                      <span className="font-mono">
                        {Math.floor(sub.startTime / 60)}:{(sub.startTime % 60).toFixed(0).padStart(2, '0')} - {Math.floor(sub.endTime / 60)}:{(sub.endTime % 60).toFixed(0).padStart(2, '0')}
                      </span>
                    </div>

                    {/* Pinyin */}
                    {showPinyin && (
                      <div className="text-xs text-stone-500 dark:text-stone-400 font-medium mb-1">
                        {sub.pinyin}
                      </div>
                    )}

                    {/* Hanzi */}
                    <div className="text-base sm:text-lg font-bold font-chinese text-stone-900 dark:text-white leading-relaxed">
                      {sub.hanzi.split('').map((char, cIdx) => (
                        <span
                          key={cIdx}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleWordClick(char);
                          }}
                          className="hover:text-red-600 hover:bg-red-100/60 dark:hover:bg-red-950/60 rounded-sm transition-colors cursor-pointer"
                          title={`Tra nghĩa chữ ${char}`}
                        >
                          {char}
                        </span>
                      ))}
                    </div>

                    {/* Sino-Vietnamese */}
                    {showSinoVietnamese && sub.sinoVietnamese && (
                      <div className="text-[11px] text-amber-700 dark:text-amber-400 font-semibold mt-1">
                        Hán-Việt: {sub.sinoVietnamese}
                      </div>
                    )}

                    {/* Vietnamese Translation */}
                    {showTranslation && (
                      <div className="text-xs text-stone-600 dark:text-stone-300 mt-1 pt-1.5 border-t border-stone-200/40 dark:border-stone-700/40">
                        {sub.vietnamese}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Word Details Modal */}
      {selectedWord && (
        <WordModal
          word={selectedWord}
          onClose={() => setSelectedWord(null)}
        />
      )}
    </div>
  );
};
