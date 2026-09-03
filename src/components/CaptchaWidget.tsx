import React, { useState, useEffect, useCallback } from 'react';
import { RotateCw, Volume2, ShieldCheck, AlertCircle } from 'lucide-react';

interface CaptchaWidgetProps {
  userInput: string;
  setUserInput: (val: string) => void;
  onCaptchaCodeChange?: (code: string) => void;
  isError?: boolean;
  refreshTrigger?: number;
  inputRef?: React.RefObject<HTMLInputElement | null>;
}

// Characters used for captcha code generation (excluding ambiguous characters like 0, O, 1, I, l)
const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export function generateCaptchaCode(length = 5): string {
  let result = '';
  for (let i = 0; i < length; i++) {
    result += CHARS.charAt(Math.floor(Math.random() * CHARS.length));
  }
  return result;
}

export const CaptchaWidget: React.FC<CaptchaWidgetProps> = ({
  userInput,
  setUserInput,
  onCaptchaCodeChange,
  isError = false,
  refreshTrigger,
  inputRef,
}) => {
  const [captchaCode, setCaptchaCode] = useState<string>('');
  const [noiseLines, setNoiseLines] = useState<Array<{ x1: number; y1: number; x2: number; y2: number; color: string }>>([]);
  const [dots, setDots] = useState<Array<{ cx: number; cy: number; r: number; color: string }>>([]);

  const refreshCaptcha = useCallback(() => {
    const newCode = generateCaptchaCode(5);
    setCaptchaCode(newCode);
    setUserInput('');
    if (onCaptchaCodeChange) {
      onCaptchaCodeChange(newCode);
    }

    // Generate random noise lines
    const lines = Array.from({ length: 4 }).map(() => ({
      x1: Math.floor(Math.random() * 160),
      y1: Math.floor(Math.random() * 40),
      x2: Math.floor(Math.random() * 160),
      y2: Math.floor(Math.random() * 40),
      color: ['#043e2e', '#d4af37', '#059669', '#334155', '#b45309'][Math.floor(Math.random() * 5)],
    }));
    setNoiseLines(lines);

    // Generate random noise dots
    const noiseDots = Array.from({ length: 18 }).map(() => ({
      cx: Math.floor(Math.random() * 160),
      cy: Math.floor(Math.random() * 40),
      r: Math.random() * 2 + 1,
      color: ['#043e2e', '#94a3b8', '#d4af37', '#1e293b'][Math.floor(Math.random() * 4)],
    }));
    setDots(noiseDots);
  }, [setUserInput, onCaptchaCodeChange]);

  useEffect(() => {
    refreshCaptcha();
  }, [refreshTrigger]);

  const handleSpeak = () => {
    if ('speechSynthesis' in window) {
      // Read aloud character by character in Indonesian spell-out
      const textToSpeak = captchaCode.split('').join(' . ');
      const utterance = new SpeechSynthesisUtterance(`Kode keamanan: ${textToSpeak}`);
      utterance.lang = 'id-ID';
      utterance.rate = 0.8;
      window.speechSynthesis.speak(utterance);
    } else {
      alert(`Kode CAPTCHA adalah: ${captchaCode.split('').join(' ')}`);
    }
  };

  const isMatched = userInput.trim().toUpperCase() === captchaCode && captchaCode.length > 0;

  return (
    <div className="bg-slate-50/90 border border-slate-300 rounded-xl p-1.5 sm:p-2 space-y-1 shadow-xs">
      <div className="flex items-center justify-between">
        <label className="text-[9px] font-black text-[#043e2e] uppercase flex items-center gap-1">
          <ShieldCheck className="w-3 h-3 text-[#d4af37]" />
          <span>Verifikasi CAPTCHA</span>
        </label>
        <span className="text-[7.5px] bg-[#043e2e] text-[#f3e5ab] font-bold px-1.5 py-0.5 rounded-full">
          SECURITY GATE
        </span>
      </div>

      {/* Visual CAPTCHA Box */}
      <div className="flex items-center gap-1.5">
        {/* SVG Distorted Captcha Display */}
        <div className="relative flex-1 bg-gradient-to-r from-emerald-950 via-slate-900 to-[#043e2e] rounded-lg p-0.5 flex items-center justify-center overflow-hidden border border-[#d4af37]/40 shadow-inner select-none h-7">
          {/* Noise Canvas Overlay */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 160 40">
            {dots.map((dot, i) => (
              <circle key={i} cx={dot.cx} cy={dot.cy} r={dot.r} fill={dot.color} opacity={0.6} />
            ))}
            {noiseLines.map((line, i) => (
              <line
                key={i}
                x1={line.x1}
                y1={line.y1}
                x2={line.x2}
                y2={line.y2}
                stroke={line.color}
                strokeWidth={1.5}
                strokeDasharray="4 2"
                opacity={0.7}
              />
            ))}
          </svg>

          {/* Distorted Code Characters */}
          <div className="relative z-10 flex items-center justify-center gap-1.5 px-2">
            {captchaCode.split('').map((char, index) => {
              // Rotation between -18deg and 18deg
              const rot = (index % 2 === 0 ? 1 : -1) * ((index * 7 + 9) % 18);
              const colors = ['#f3e5ab', '#ffffff', '#6ee7b7', '#fde047', '#93c5fd'];
              const charColor = colors[index % colors.length];

              return (
                <span
                  key={index}
                  style={{
                    transform: `rotate(${rot}deg) translateY(${((index % 3) - 1) * 2}px)`,
                    color: charColor,
                    fontFamily: 'monospace, Courier, sans-serif',
                  }}
                  className="text-xs sm:text-sm font-black tracking-widest drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]"
                >
                  {char}
                </span>
              );
            })}
          </div>
        </div>

        {/* Action Buttons: Refresh & Read Aloud */}
        <div className="flex gap-1 shrink-0">
          <button
            type="button"
            onClick={refreshCaptcha}
            title="Acak Kode CAPTCHA Baru"
            className="p-1 bg-white hover:bg-emerald-50 text-slate-700 hover:text-[#043e2e] border border-slate-300 rounded-lg shadow-xs transition-all cursor-pointer flex items-center justify-center"
          >
            <RotateCw className="w-3 h-3" />
          </button>
          <button
            type="button"
            onClick={handleSpeak}
            title="Dengarkan Kode CAPTCHA (Audio)"
            className="p-1 bg-white hover:bg-amber-50 text-slate-700 hover:text-amber-700 border border-slate-300 rounded-lg shadow-xs transition-all cursor-pointer flex items-center justify-center"
          >
            <Volume2 className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Input Field for CAPTCHA Code */}
      <div>
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            autoComplete="off"
            maxLength={6}
            placeholder="Ketik 5 Karakter Kode CAPTCHA"
            value={userInput}
            onChange={(e) => setUserInput(e.target.value.toUpperCase())}
            className={`w-full bg-white border rounded-lg px-2.5 py-1 text-xs font-black tracking-wider uppercase transition-all focus:outline-none ${
              isMatched
                ? 'border-emerald-600 bg-emerald-50/50 text-emerald-900 focus:ring-1 focus:ring-emerald-500'
                : isError
                ? 'border-red-500 bg-red-50/50 text-red-900 focus:ring-1 focus:ring-red-500'
                : 'border-slate-300 text-slate-800 focus:border-[#043e2e] focus:ring-1 focus:ring-[#043e2e]'
            }`}
          />
          {isMatched && (
            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] font-bold text-emerald-600 flex items-center gap-1 bg-white px-1.5 py-0.5 rounded-full border border-emerald-300">
              <ShieldCheck className="w-2.5 h-2.5" />
              <span>Valid</span>
            </span>
          )}
        </div>
        <p className="text-[8px] text-slate-500 font-medium mt-0.5 flex items-center justify-between">
          <span>*Tidak peka huruf besar/kecil.</span>
          {isError && (
            <span className="text-red-600 font-bold flex items-center gap-1">
              <AlertCircle className="w-2.5 h-2.5" /> Kode salah
            </span>
          )}
        </p>
      </div>
    </div>
  );
};
