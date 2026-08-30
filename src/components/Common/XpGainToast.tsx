import type React from 'react';
import { useState, useEffect } from 'react';
import { Zap, Sparkles, Flame } from 'lucide-react';

export interface XpNotificationEvent {
  id: number;
  amount: number;
  message?: string;
  type?: 'xp' | 'streak' | 'perfect';
}

// Global simple event listener for XP gains
type Listener = (event: XpNotificationEvent) => void;
const listeners: Listener[] = [];

export const triggerXpAnimation = (amount: number, message?: string, type: 'xp' | 'streak' | 'perfect' = 'xp') => {
  const event: XpNotificationEvent = {
    id: Date.now() + Math.random(),
    amount,
    message,
    type,
  };
  listeners.forEach((l) => l(event));
};

export const XpGainToastContainer: React.FC = () => {
  const [activeToasts, setActiveToasts] = useState<XpNotificationEvent[]>([]);

  useEffect(() => {
    const handler: Listener = (event) => {
      setActiveToasts((prev) => [...prev, event]);

      // Remove after animation completes (2 seconds)
      setTimeout(() => {
        setActiveToasts((prev) => prev.filter((t) => t.id !== event.id));
      }, 2000);
    };

    listeners.push(handler);
    return () => {
      const idx = listeners.indexOf(handler);
      if (idx !== -1) listeners.splice(idx, 1);
    };
  }, []);

  if (activeToasts.length === 0) return null;

  return (
    <div className="fixed top-20 right-6 z-50 pointer-events-none flex flex-col items-end gap-2">
      {activeToasts.map((toast) => (
        <div
          key={toast.id}
          className="animate-xp-fly flex items-center gap-2 px-4 py-2 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-red-600 text-white font-extrabold text-sm shadow-xl shadow-amber-500/30 border border-amber-300/40"
        >
          {toast.type === 'streak' ? (
            <Flame size={18} className="text-amber-200 fill-amber-200 animate-bounce" />
          ) : (
            <Zap size={18} className="text-amber-200 fill-amber-200 animate-bounce" />
          )}

          <span>+{toast.amount} XP</span>

          {toast.message && (
            <span className="text-xs font-medium text-amber-100 opacity-95">
              • {toast.message}
            </span>
          )}

          <Sparkles size={14} className="text-amber-200" />
        </div>
      ))}
    </div>
  );
};
