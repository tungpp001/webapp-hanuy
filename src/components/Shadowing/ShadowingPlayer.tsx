import type React from 'react';
import { useState, useRef } from 'react';
import { 
  ArrowLeft, 
  RotateCcw, 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward,
  Link,
  Volume2,
  ExternalLink
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
  const [customYouTubeUrl, setCustomYouTubeUrl] = useState('');
  const [currentVideoId, setCurrentVideoId] = useState(video.youtubeId);

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

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const activeSegment: SubtitleSegment = video.subtitles[activeSegmentIndex] || video.subtitles[0];

  // Helper to send postMessage commands to YouTube IFrame API
  const sendIframeCommand = (command: string, args: any[] = []) => {
    if (!iframeRef.current || !iframeRef.current.contentWindow) return;
    try {
      iframeRef.current.contentWindow.postMessage(
        JSON.stringify({
          event: 'command',
          func: command,
          args: args,
        }),
        '*'
      );
    } catch (e) {
      console.warn('IFrame postMessage error', e);
    }
  };

  const seekToSegment = (index: number) => {
    if (index < 0 || index >= video.subtitles.length) return;
    setActiveSegmentIndex(index);
    const seg = video.subtitles[index];
    sendIframeCommand('seekTo', [seg.startTime, true]);
    sendIframeCommand('playVideo', []);
    setIsPlaying(true);
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
    if (isPlaying) {
      sendIframeCommand('pauseVideo', []);
      setIsPlaying(false);
    } else {
      sendIframeCommand('playVideo', []);
      setIsPlaying(true);
    }
  };

  const handleSpeedChange = (speed: number) => {
    setPlaybackSpeed(speed);
    sendIframeCommand('setPlaybackRate', [speed]);
    playSoundEffect('click');
  };

  const handleApplyCustomUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customYouTubeUrl.trim()) return;
    const extractedId = extractYouTubeId(customYouTubeUrl);
    if (extractedId) {
      setCurrentVideoId(extractedId);
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
            className="p-2.5 rounded-2xl border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
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
            className={`px-3 py-1.5 rounded-xl transition-all ${
              showPinyin ? 'bg-red-600 text-white shadow-xs' : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            Pinyin
          </button>
          <button
            onClick={() => setShowSinoVietnamese(!showSinoVietnamese)}
            className={`px-3 py-1.5 rounded-xl transition-all ${
              showSinoVietnamese ? 'bg-red-600 text-white shadow-xs' : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            Hán-Việt
          </button>
          <button
            onClick={() => setShowTranslation(!showTranslation)}
            className={`px-3 py-1.5 rounded-xl transition-all ${
              showTranslation ? 'bg-red-600 text-white shadow-xs' : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            Bản dịch
          </button>
        </div>
      </div>

      {/* Quick Paste Custom YouTube URL Bar */}
      <form onSubmit={handleApplyCustomUrl} className="flex items-center gap-2 p-3 bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-xs">
        <div className="relative flex-1">
          <Link className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={15} />
          <input
            type="text"
            placeholder="Dán link YouTube bất kỳ để phát và luyện Shadowing (vd: https://www.youtube.com/watch?v=...)"
            value={customYouTubeUrl}
            onChange={(e) => setCustomYouTubeUrl(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-xl bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-white placeholder-stone-400 border border-stone-200 dark:border-stone-700 focus:outline-hidden focus:ring-2 focus:ring-red-500"
          />
        </div>
        <button
          type="submit"
          className="px-4 py-2 bg-stone-900 hover:bg-stone-800 dark:bg-white dark:hover:bg-stone-100 text-white dark:text-stone-900 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer"
        >
          Tải Video
        </button>
        <a
          href={`https://www.youtube.com/watch?v=${currentVideoId}`}
          target="_blank"
          rel="noopener noreferrer"
          className="p-2 rounded-xl border border-stone-200 dark:border-stone-700 text-stone-500 hover:text-red-600 dark:hover:text-red-400 transition-colors hidden sm:flex items-center gap-1 text-xs font-semibold"
          title="Mở trên YouTube"
        >
          <ExternalLink size={14} />
          <span>YouTube</span>
        </a>
      </form>

      {/* Main Grid: YouTube Video + Sync Subtitles & Shadowing Studio */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (7 Cols): YouTube Video Embed + Segment Controls */}
        <div className="lg:col-span-7 space-y-4">
          {/* YouTube Video Container */}
          <div className="relative rounded-3xl overflow-hidden bg-black shadow-xl aspect-video border-2 border-stone-800">
            <iframe
              ref={iframeRef}
              key={currentVideoId}
              src={`https://www.youtube.com/embed/${currentVideoId}?enablejsapi=1&autoplay=0&rel=0&modestbranding=1&playsinline=1`}
              title={video.title}
              className="absolute inset-0 w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          </div>

          {/* Video Playback Controller Bar */}
          <div className="p-4 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-sm flex items-center justify-between gap-2 flex-wrap">
            {/* Speed selection */}
            <div className="flex items-center gap-1">
              {[0.75, 0.9, 1.0, 1.25].map((speed) => (
                <button
                  key={speed}
                  onClick={() => handleSpeedChange(speed)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                    playbackSpeed === speed
                      ? 'bg-stone-900 dark:bg-white text-white dark:text-stone-900 shadow-xs'
                      : 'text-stone-500 hover:bg-stone-100 dark:hover:bg-stone-800'
                  }`}
                >
                  {speed}x
                </button>
              ))}
            </div>

            {/* Prev, Play/Pause, Replay, Next, TTS Fallback */}
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrevSegment}
                disabled={activeSegmentIndex === 0}
                className="p-2 rounded-xl border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 hover:bg-stone-100 disabled:opacity-30 transition-all"
                title="Câu trước"
              >
                <SkipBack size={16} />
              </button>

              <button
                onClick={handleReplaySegment}
                className="px-3.5 py-2 rounded-xl bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-300 font-bold text-xs flex items-center gap-1.5 shadow-xs hover:scale-105 active:scale-95 transition-all"
                title="Phát lại câu hiện tại"
              >
                <RotateCcw size={14} />
                <span>Lặp câu</span>
              </button>

              <button
                onClick={togglePlayPause}
                className="p-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white shadow-md transition-all active:scale-95"
                title={isPlaying ? 'Tạm dừng video' : 'Phát video'}
              >
                {isPlaying ? <Pause size={16} /> : <Play size={16} />}
              </button>

              <button
                onClick={() => handlePlayTTSFallback(activeSegment.hanzi)}
                className="p-2 rounded-xl border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 hover:text-red-600 hover:bg-red-50 transition-all"
                title="Phát âm thanh mẫu (TTS tiếng Trung bản xứ)"
              >
                <Volume2 size={16} />
              </button>

              <button
                onClick={handleNextSegment}
                disabled={activeSegmentIndex === video.subtitles.length - 1}
                className="p-2 rounded-xl border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 hover:bg-stone-100 disabled:opacity-30 transition-all"
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
