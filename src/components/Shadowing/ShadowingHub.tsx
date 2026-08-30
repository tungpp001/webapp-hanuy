import type React from 'react';
import { useState } from 'react';
import { ShadowingVideoList } from './ShadowingVideoList';
import { ShadowingPlayer } from './ShadowingPlayer';
import type { ShadowingVideo } from '../../types/shadowing';

export const ShadowingHub: React.FC = () => {
  const [selectedVideo, setSelectedVideo] = useState<ShadowingVideo | null>(null);

  const handleSelectVideo = (video: ShadowingVideo) => {
    setSelectedVideo(video);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBackToList = () => {
    setSelectedVideo(null);
  };

  if (selectedVideo) {
    return (
      <ShadowingPlayer
        video={selectedVideo}
        onBack={handleBackToList}
      />
    );
  }

  return (
    <ShadowingVideoList
      onSelectVideo={handleSelectVideo}
    />
  );
};
