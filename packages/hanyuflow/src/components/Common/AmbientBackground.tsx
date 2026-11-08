import type React from 'react';
import { useMemo } from 'react';

interface Particle {
  id: number;
  left: string;
  top: string;
  size: number;
  duration: string;
  delay: string;
  opacity: number;
}

export const AmbientBackground: React.FC<{ enabled?: boolean }> = ({ enabled = true }) => {
  const particles: Particle[] = useMemo(() => {
    return Array.from({ length: 12 }).map((_, i) => ({
      id: i,
      left: `${(i * 8.5 + (i % 3) * 4) % 100}%`,
      top: `${-20 - (i % 5) * 15}px`,
      size: 8 + (i % 4) * 4,
      duration: `${14 + (i % 5) * 3}s`,
      delay: `${(i * 1.3) % 8}s`,
      opacity: 0.25 + (i % 3) * 0.15,
    }));
  }, []);

  if (!enabled) return null;

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 select-none">
      {/* Subtle Glowing Aura Orbs */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-gradient-to-br from-red-500/10 to-amber-500/5 dark:from-red-600/15 dark:to-transparent rounded-full blur-3xl animate-pulse-slow"></div>
      <div className="absolute top-1/3 -right-32 w-[450px] h-[450px] bg-gradient-to-bl from-amber-500/10 via-rose-500/5 to-transparent dark:from-amber-600/10 dark:to-transparent rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '2s' }}></div>
      <div className="absolute -bottom-32 left-1/4 w-96 h-96 bg-gradient-to-tr from-emerald-500/5 to-transparent dark:from-teal-600/10 dark:to-transparent rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '4s' }}></div>

      {/* Floating Cherry Blossom Petals */}
      {particles.map((p) => (
        <div
          key={p.id}
          className="petal-particle"
          style={{
            left: p.left,
            top: p.top,
            width: `${p.size}px`,
            height: `${p.size * 1.3}px`,
            animationDuration: p.duration,
            animationDelay: p.delay,
            opacity: p.opacity,
          }}
        >
          <svg viewBox="0 0 30 40" className="w-full h-full fill-red-400/50 dark:fill-red-400/30">
            <path d="M15,0 C25,10 30,25 20,35 C10,40 5,30 2,20 C0,10 8,0 15,0 Z" />
          </svg>
        </div>
      ))}
    </div>
  );
};
