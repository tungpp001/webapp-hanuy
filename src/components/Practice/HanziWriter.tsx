import type React from 'react';
import { useState, useRef, useEffect } from 'react';
import { RotateCcw, ArrowRight, ArrowLeft } from 'lucide-react';
import { AudioButton } from '../Common/AudioButton';
import { playSoundEffect } from '../../utils/speech';
import { addXP } from '../../utils/storage';

const HANZI_PRACTICE_LIST = [
  { hanzi: '你', pinyin: 'nǐ', sinoVietnamese: 'Nhĩ', meaning: 'Bạn / Anh / Chị', strokes: 7 },
  { hanzi: '好', pinyin: 'hǎo', sinoVietnamese: 'Hảo', meaning: 'Tốt / Đẹp / Khỏe', strokes: 6 },
  { hanzi: '我', pinyin: 'wǒ', sinoVietnamese: 'Ngã', meaning: 'Tôi / Ta', strokes: 7 },
  { hanzi: '爱', pinyin: 'ài', sinoVietnamese: 'Ái', meaning: 'Yêu / Thích', strokes: 10 },
  { hanzi: '中', pinyin: 'zhōng', sinoVietnamese: 'Trung', meaning: 'Ở giữa / Trung Quốc', strokes: 4 },
  { hanzi: '文', pinyin: 'wén', sinoVietnamese: 'Văn', meaning: 'Văn chương / Chữ viết', strokes: 4 },
  { hanzi: '吃', pinyin: 'chī', sinoVietnamese: 'Ngật', meaning: 'Ăn', strokes: 6 },
  { hanzi: '喝', pinyin: 'hē', sinoVietnamese: 'Hát', meaning: 'Uống', strokes: 12 },
  { hanzi: '谢', pinyin: 'xiè', sinoVietnamese: 'Tạ', meaning: 'Cảm ơn', strokes: 12 },
  { hanzi: '再', pinyin: 'zài', sinoVietnamese: 'Tái', meaning: 'Lại / Một lần nữa', strokes: 6 },
];

export const HanziWriter: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [strokeColor, setStrokeColor] = useState('#DC2626'); // Cố Cung Red
  const brushSize = 8;
  const [showWatermark, setShowWatermark] = useState(true);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);

  const currentChar = HANZI_PRACTICE_LIST[currentIndex];

  // Draw Tian Zi Ge (田字格 / 米字格) Background
  const drawGrid = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    ctx.clearRect(0, 0, width, height);

    ctx.strokeStyle = '#E2E8F0';
    ctx.lineWidth = 1;

    // Outer border
    ctx.strokeRect(0, 0, width, height);

    // Dashed inner lines
    ctx.beginPath();
    ctx.setLineDash([4, 4]);

    // Horizontal
    ctx.moveTo(0, height / 2);
    ctx.lineTo(width, height / 2);

    // Vertical
    ctx.moveTo(width / 2, 0);
    ctx.lineTo(width / 2, height);

    // Diagonals (米字格)
    ctx.moveTo(0, 0);
    ctx.lineTo(width, height);
    ctx.moveTo(width, 0);
    ctx.lineTo(0, height);

    ctx.stroke();
    ctx.setLineDash([]); // Reset dash
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    drawGrid(ctx, canvas.width, canvas.height);
    setHasDrawn(false);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    drawGrid(ctx, canvas.width, canvas.height);
    setHasDrawn(false);
  }, [currentIndex]);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsDrawing(true);
    setHasDrawn(true);

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    const x = clientX - rect.left;
    const y = clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = brushSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    const x = clientX - rect.left;
    const y = clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const handleNext = () => {
    playSoundEffect('click');
    if (hasDrawn) {
      addXP(15);
    }
    if (currentIndex < HANZI_PRACTICE_LIST.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      setCurrentIndex(0);
    }
  };

  const handlePrev = () => {
    playSoundEffect('click');
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  return (
    <div className="max-w-xl mx-auto space-y-5 animate-fade-in pb-16">
      {/* Header Info */}
      <div className="p-5 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-sm flex items-center justify-between">
        <div>
          <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-950 text-red-600 dark:text-red-300">
            Luyện Viết Chữ Hán ({currentIndex + 1}/{HANZI_PRACTICE_LIST.length})
          </span>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-2xl font-bold font-chinese text-stone-900 dark:text-white">
              {currentChar.hanzi}
            </span>
            <span className="text-sm font-semibold text-stone-600 dark:text-stone-300">
              {currentChar.pinyin}
            </span>
            <span className="text-xs text-amber-700 dark:text-amber-400">
              ({currentChar.sinoVietnamese} - {currentChar.meaning})
            </span>
          </div>
        </div>

        <AudioButton text={currentChar.hanzi} size="md" variant="pill" />
      </div>

      {/* Writing Canvas Container (米字格) */}
      <div className="relative w-80 h-80 sm:w-96 sm:h-96 mx-auto rounded-3xl bg-white shadow-xl overflow-hidden border-2 border-stone-300 select-none">
        {/* Background Watermark Character */}
        {showWatermark && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none opacity-20 font-chinese text-[200px] sm:text-[240px] text-stone-800">
            {currentChar.hanzi}
          </div>
        )}

        {/* HTML5 Canvas */}
        <canvas
          ref={canvasRef}
          width={384}
          height={384}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          className="absolute inset-0 w-full h-full cursor-crosshair touch-none"
        />
      </div>

      {/* Toolbar & Colors */}
      <div className="flex items-center justify-between gap-2 p-3 bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm">
        {/* Color pickers */}
        <div className="flex items-center gap-2">
          {['#DC2626', '#0F172A', '#0D9488', '#D97706'].map((color) => (
            <button
              key={color}
              onClick={() => setStrokeColor(color)}
              className={`w-7 h-7 rounded-full transition-transform ${
                strokeColor === color ? 'scale-125 ring-2 ring-offset-2 ring-stone-400' : 'hover:scale-110'
              }`}
              style={{ backgroundColor: color }}
              title="Chọn màu nét bút"
            />
          ))}
        </div>

        {/* Watermark toggle */}
        <button
          onClick={() => setShowWatermark(!showWatermark)}
          className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-all ${
            showWatermark 
              ? 'bg-red-50 text-red-600 border-red-200' 
              : 'text-stone-400 border-stone-200'
          }`}
        >
          {showWatermark ? 'Ẩn chữ mẫu' : 'Hiện chữ mẫu'}
        </button>

        {/* Clear button */}
        <button
          onClick={clearCanvas}
          className="p-2 rounded-xl text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 text-xs font-bold flex items-center gap-1"
          title="Xóa viết lại"
        >
          <RotateCcw size={15} />
          <span>Viết lại</span>
        </button>
      </div>

      {/* Next/Prev Navigation */}
      <div className="flex items-center justify-between gap-3">
        <button
          onClick={handlePrev}
          disabled={currentIndex === 0}
          className="flex-1 py-3 rounded-2xl border border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 disabled:opacity-40 font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-1.5"
        >
          <ArrowLeft size={16} />
          <span>Chữ trước</span>
        </button>

        <button
          onClick={handleNext}
          className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-700 hover:to-amber-700 text-white font-bold text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-1.5 active:scale-95"
        >
          <span>Chữ tiếp theo (+15 XP)</span>
          <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
};
