import React, { useState, useEffect, useRef } from 'react';
import { AnnouncementConfig } from '../types';
import { X, Sparkles } from 'lucide-react';

interface FloatingAnnouncementModalProps {
  isOpen: boolean;
  announcement: AnnouncementConfig;
  onClose: () => void;
  onOpenDetail: () => void;
}

export const FloatingAnnouncementModal: React.FC<FloatingAnnouncementModalProps> = ({
  isOpen,
  announcement,
  onClose,
  onOpenDetail,
}) => {
  const durationSeconds =
    announcement.displayDurationSeconds &&
    [10, 15, 20, 25, 30].includes(announcement.displayDurationSeconds)
      ? announcement.displayDurationSeconds
      : 15;

  const [remainingSeconds, setRemainingSeconds] = useState<number>(durationSeconds);
  const [isClosing, setIsClosing] = useState<boolean>(false);

  const isClosingRef = useRef<boolean>(false);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const targetEndTimeRef = useRef<number>(0);

  isClosingRef.current = isClosing;

  // Graceful exit animation before unmounting
  const handleInitiateClose = () => {
    if (isClosingRef.current) return;
    setIsClosing(true);
    isClosingRef.current = true;

    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }

    closeTimeoutRef.current = setTimeout(() => {
      onClose();
      setIsClosing(false);
      isClosingRef.current = false;
    }, 240);
  };

  // 100% Robust, 1-Second Interval tied to system wall-clock
  // Mengurangi frekuensi render React dari 20x/detik menjadi 1x/detik (Optimasi 95% CPU/Main-Thread)
  useEffect(() => {
    if (!isOpen || !announcement || !announcement.active) {
      setIsClosing(false);
      isClosingRef.current = false;
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current);
        closeTimeoutRef.current = null;
      }
      return;
    }

    setIsClosing(false);
    isClosingRef.current = false;
    setRemainingSeconds(durationSeconds);
    targetEndTimeRef.current = Date.now() + durationSeconds * 1000;

    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
    }

    // Interval 1000ms (1 detik) hemat memori & CPU
    timerIntervalRef.current = setInterval(() => {
      if (isClosingRef.current) return;

      const now = Date.now();
      const secondsLeft = Math.max(0, Math.ceil((targetEndTimeRef.current - now) / 1000));

      setRemainingSeconds(secondsLeft);

      if (secondsLeft <= 0) {
        if (timerIntervalRef.current) {
          clearInterval(timerIntervalRef.current);
          timerIntervalRef.current = null;
        }
        handleInitiateClose();
      }
    }, 1000);

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current);
        closeTimeoutRef.current = null;
      }
    };
  }, [isOpen, durationSeconds, announcement?.active]);

  if (!isOpen || !announcement || !announcement.active) {
    return null;
  }

  const handleActionClick = () => {
    if (announcement.actionType === 'url' && announcement.linkUrl) {
      let url = announcement.linkUrl.trim();
      if (!/^https?:\/\//i.test(url)) {
        url = 'https://' + url;
      }
      window.open(url, '_blank', 'noopener,noreferrer');
      handleInitiateClose();
    } else {
      onOpenDetail();
      handleInitiateClose();
    }
  };

  return (
    <div
      id="floating-announcement-overlay"
      className={`fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-xs transition-all duration-300 ${
        isClosing ? 'animate-overlay-exit' : 'animate-overlay-fade'
      }`}
      onClick={handleInitiateClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="floating-announcement-card"
    >
      {/* Perfectly Proportioned 1:1 Square (Kotak) Frameless Card Container */}
      <div
        id="floating-announcement-card"
        style={{ '--announcement-duration': `${durationSeconds}s` } as React.CSSProperties}
        className={`relative w-[88vw] max-w-[460px] aspect-square max-h-[85vh] rounded-3xl shadow-[0_25px_70px_rgba(0,0,0,0.85)] overflow-hidden flex flex-col transition-all bg-slate-950 select-none ${
          isClosing ? 'animate-pop-exit' : 'animate-pop-spring'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Hardware-Accelerated Pure CSS Continuous Top Progress Bar (60-120 FPS di GPU Compositor) */}
        <div className="absolute top-0 left-0 right-0 z-30 h-1 bg-white/20 overflow-hidden">
          <div className="h-full w-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.9)] animate-announcement-bar" />
        </div>

        {/* Floating Top Controls Overlay */}
        <div className="absolute top-3.5 left-3.5 right-3.5 z-30 flex items-center justify-between pointer-events-none">
          {/* Modern White Countdown Ring & Pill Timer */}
          <div
            id="floating-announcement-timer"
            className="pointer-events-auto inline-flex items-center gap-2 bg-black/60 hover:bg-black/75 text-white border border-white/25 px-3 py-1.5 rounded-full shadow-lg transition-all duration-200"
            title="Waktu tayang otomatis tersisa"
          >
            {/* Smooth GPU-Accelerated SVG Countdown Ring */}
            <div className="relative w-5 h-5 flex items-center justify-center shrink-0">
              <svg className="w-5 h-5 -rotate-90" viewBox="0 0 36 36">
                <circle
                  cx="18"
                  cy="18"
                  r="14"
                  className="text-white/25"
                  strokeWidth="3.5"
                  stroke="currentColor"
                  fill="none"
                />
                <circle
                  cx="18"
                  cy="18"
                  r="14"
                  className="text-white animate-announcement-ring drop-shadow-[0_0_4px_rgba(255,255,255,0.8)]"
                  strokeWidth="3.5"
                  strokeDasharray={88}
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                />
              </svg>
            </div>
            <span className="text-xs font-black font-mono tracking-wider text-white drop-shadow-sm">
              {remainingSeconds}s
            </span>
          </div>

          {/* Top Right Modern White Close Button (X) */}
          <button
            id="btn-close-floating-announcement"
            type="button"
            onClick={handleInitiateClose}
            className="pointer-events-auto w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-black/60 hover:bg-black/80 active:scale-90 text-white flex items-center justify-center transition-all duration-200 cursor-pointer shadow-lg border border-white/25 hover:border-white/60 group"
            aria-label="Tutup Pengumuman"
            title="Tutup Pengumuman"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5 text-white group-hover:scale-110 transition-transform stroke-[2.5]" />
          </button>
        </div>

        {/* Square Content Body (Frameless, Fills 1:1 Aspect Ratio) */}
        <div
          id="floating-announcement-image-box"
          onClick={handleActionClick}
          className="relative w-full h-full flex items-center justify-center cursor-pointer group overflow-hidden bg-slate-950"
          title="Klik untuk membuka informasi pengumuman"
        >
          {announcement.photoUrl ? (
            <>
              {/* Subtle ambient background poster */}
              <img
                src={announcement.photoUrl}
                alt=""
                aria-hidden="true"
                width="460"
                height="460"
                loading="lazy"
                decoding="async"
                referrerPolicy="no-referrer"
                className="absolute inset-0 w-full h-full object-cover blur-sm opacity-25 scale-105 pointer-events-none"
              />
              {/* Crisp Foreground Poster fitted seamlessly into 1:1 square card */}
              <img
                src={announcement.photoUrl}
                alt={announcement.title || 'Pengumuman Resmi'}
                width="460"
                height="460"
                decoding="async"
                referrerPolicy="no-referrer"
                className="relative z-10 w-full h-full object-cover group-hover:scale-[1.015] transition-transform duration-300 select-none block"
              />
            </>
          ) : (
            <div className="relative z-10 w-full h-full bg-gradient-to-br from-[#091f42] via-[#0f2b5c] to-[#143b7d] p-6 sm:p-8 flex flex-col justify-between text-white">
              <div className="pt-8 flex items-center justify-start">
                <div className="inline-flex items-center gap-2 bg-amber-400/20 border border-amber-300/40 text-amber-300 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider">
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>Dinas Sosial Provinsi Jawa Barat</span>
                </div>
              </div>
              <div className="my-auto py-2 text-center space-y-2.5">
                <h3 className="text-xl sm:text-2xl font-black text-white leading-snug px-2">
                  {announcement.title}
                </h3>
                {announcement.subtitle && (
                  <p className="text-xs sm:text-sm text-blue-100/90 font-medium line-clamp-3 px-2">
                    {announcement.subtitle}
                  </p>
                )}
              </div>
              <div className="pb-10 text-center text-[11px] text-amber-300/80 font-bold">
                {announcement.publishedBy || 'Otoritas Pusat Dinsos Jabar'}
              </div>
            </div>
          )}
        </div>

        {/* Floating Bottom Action Pill */}
        <div className="absolute bottom-3.5 sm:bottom-4 inset-x-0 flex justify-center z-30 pointer-events-none">
          <button
            id="btn-action-floating-announcement-info"
            type="button"
            onClick={handleActionClick}
            className="pointer-events-auto bg-white/95 hover:bg-white active:scale-95 text-slate-950 font-black text-xs sm:text-sm px-6 py-2.5 rounded-full shadow-[0_10px_25px_rgba(0,0,0,0.5)] transition-all duration-200 cursor-pointer uppercase tracking-wider border border-white/70 hover:scale-105"
            title="Klik untuk membaca informasi lengkap"
          >
            {announcement.actionType === 'url' ? 'Buka Tautan' : 'Info Lengkap'}
          </button>
        </div>
      </div>
    </div>
  );
};
