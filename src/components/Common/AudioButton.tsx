import type React from 'react';
import { useState } from 'react';
import { Volume2 } from 'lucide-react';
import { speakChinese, stopSpeaking, playSoundEffect } from '../../utils/speech';

interface AudioButtonProps {
  text: string;
  speed?: number;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'ghost' | 'pill';
  showSpeedControl?: boolean;
  className?: string;
}

export const AudioButton: React.FC<AudioButtonProps> = ({
  text,
  speed = 1.0,
  size = 'md',
  variant = 'ghost',
  showSpeedControl = false,
  className = '',
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentSpeed, setCurrentSpeed] = useState(speed);

  const handlePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isPlaying) {
      stopSpeaking();
      setIsPlaying(false);
      return;
    }

    playSoundEffect('click');
    setIsPlaying(true);
    speakChinese(text, currentSpeed, () => {
      setIsPlaying(false);
    });
  };

  const toggleSpeed = (e: React.MouseEvent) => {
    e.stopPropagation();
    const newSpeed = currentSpeed === 1.0 ? 0.75 : currentSpeed === 0.75 ? 1.2 : 1.0;
    setCurrentSpeed(newSpeed);
    playSoundEffect('click');
  };

  const sizeClasses = {
    sm: 'p-1.5 text-xs',
    md: 'p-2 text-sm',
    lg: 'p-3 text-base',
  };

  const iconSizes = {
    sm: 16,
    md: 20,
    lg: 24,
  };

  const variantClasses = {
    primary: 'bg-red-600 hover:bg-red-700 text-white shadow-md hover:shadow-lg active:scale-95',
    ghost: 'text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 active:scale-95',
    pill: 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40 border border-stone-200 dark:border-stone-700',
  };

  return (
    <div className={`inline-flex items-center gap-1.5 ${className}`}>
      <button
        onClick={handlePlay}
        className={`rounded-full transition-all duration-150 flex items-center justify-center relative ${sizeClasses[size]} ${variantClasses[variant]}`}
        title={isPlaying ? 'Dừng phát' : `Nghe phát âm (${currentSpeed}x)`}
        aria-label="Phát âm tiếng Trung"
      >
        {isPlaying ? (
          <>
            <span className="absolute -inset-1 rounded-full bg-red-500/30 animate-ping opacity-60"></span>
            <div className="flex items-center gap-0.5 h-4 px-1 relative z-10">
              <span className="w-1 bg-current rounded-full sound-wave-bar h-2"></span>
              <span className="w-1 bg-current rounded-full sound-wave-bar h-3"></span>
              <span className="w-1 bg-current rounded-full sound-wave-bar h-4"></span>
              <span className="w-1 bg-current rounded-full sound-wave-bar h-2"></span>
            </div>
          </>
        ) : (
          <Volume2 size={iconSizes[size]} className="transition-transform group-hover:scale-110" />
        )}
      </button>

      {showSpeedControl && (
        <button
          onClick={toggleSpeed}
          className="text-xs font-semibold px-2 py-0.5 rounded-full bg-stone-200/80 dark:bg-stone-800 hover:bg-stone-300 text-stone-600 dark:text-stone-300 transition-colors"
          title="Nhấn để đổi tốc độ đọc (0.75x - 1.0x - 1.2x)"
        >
          {currentSpeed}x
        </button>
      )}
    </div>
  );
};
