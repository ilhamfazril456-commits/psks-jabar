import React, { useState, useEffect, useRef } from 'react';
import { AnnouncementConfig } from '../types';
import { X, Clock, Sparkles } from 'lucide-react';

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
  const totalDurationMs = durationSeconds * 1000;

  const [remainingMs, setRemainingMs] = useState<number>(totalDurationMs);
  const [isClosing, setIsClosing] = useState<boolean>(false);

  const isClosingRef = useRef<boolean>(false);
  const startTimeRef = useRef<number>(0);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  isClosingRef.current = isClosing;

  // Initiate graceful exit animation before unmounting
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
    }, 250);
  };

  // 100% Robust, Wall-Clock Continuous Timer
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
    setRemainingMs(totalDurationMs);
    startTimeRef.current = Date.now();

    const targetEndTime = startTimeRef.current + totalDurationMs;

    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
    }

    // 50ms interval tied to absolute system clock
    timerIntervalRef.current = setInterval(() => {
      if (isClosingRef.current) return;

      const now = Date.now();
      const timeLeft = Math.max(0, targetEndTime - now);

      setRemainingMs(timeLeft);

      if (timeLeft <= 0) {
        if (timerIntervalRef.current) {
          clearInterval(timerIntervalRef.current);
          timerIntervalRef.current = null;
        }
        handleInitiateClose();
      }
    }, 50);

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
  }, [isOpen, totalDurationMs, announcement?.active]);

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

  const displaySeconds = Math.max(0, Math.ceil(remainingMs / 1000));
  const progressRatio = Math.max(0, Math.min(1, remainingMs / totalDurationMs));

  // Determine frame styling
  const customFrameBg = announcement.frameColor || '#ffffff';
  const customBorderColor = announcement.frameBorderColor || '#e2e8f0';

  return (
    <div
      id="floating-announcement-overlay"
      className={`fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-5 md:p-8 bg-black/75 backdrop-blur-sm transition-all duration-300 ${
        isClosing ? 'animate-overlay-exit' : 'animate-overlay-fade'
      }`}
      onClick={handleInitiateClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="floating-announcement-card"
    >
      {/* Centered Modal Container with Dynamic Frame Styling */}
      <div
        id="floating-announcement-card"
        style={{
          backgroundColor: customFrameBg,
          borderColor: customBorderColor,
        }}
        className={`relative w-full max-w-lg sm:max-w-xl md:max-w-2xl lg:max-w-3xl rounded-2xl sm:rounded-3xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.65)] overflow-hidden flex flex-col transition-all border-2 ${
          isClosing ? 'animate-pop-exit' : 'animate-pop-spring'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Progress Countdown Bar */}
        <div className="w-full bg-black/10 h-1 sm:h-1.5 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-emerald-600 via-emerald-500 to-slate-900 transition-[width] duration-75 ease-linear"
            style={{ width: `${progressRatio * 100}%` }}
          />
        </div>

        {/* Top Header Controls (Timer Pill in Classic Black & Green Circular Close Button) */}
        <div className="px-3.5 sm:px-6 pt-3 sm:pt-4 pb-1 sm:pb-2 flex items-center justify-between z-20">
          {/* Classic Elegant Black Countdown Timer */}
          <div
            id="floating-announcement-timer"
            className="inline-flex items-center gap-1.5 sm:gap-2 bg-slate-950 text-white border border-slate-700/80 text-[11px] sm:text-xs font-mono font-bold px-3 sm:px-3.5 py-1 sm:py-1.5 rounded-full shadow-md tracking-wider select-none"
            title="Waktu tayang otomatis tersisa"
          >
            <Clock className="w-3.5 h-3.5 text-slate-300 animate-spin" style={{ animationDuration: '6s' }} />
            <span className="text-slate-100 font-semibold">{displaySeconds}s</span>
          </div>

          {/* Top Right Green Close Button (X) */}
          <button
            id="btn-close-floating-announcement"
            type="button"
            onClick={handleInitiateClose}
            className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 rounded-full bg-[#16a34a] hover:bg-[#15803d] active:scale-90 text-white flex items-center justify-center transition-all duration-200 cursor-pointer shadow-md hover:shadow-lg border-2 border-white"
            aria-label="Tutup Pengumuman"
            title="Tutup Pengumuman"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5 text-white stroke-[2.5]" />
          </button>
        </div>

        {/* Framing Wrapper with Jarak / Spacing around Image */}
        <div className="px-3.5 sm:px-6 md:px-8 py-2 sm:py-3 flex-1 flex flex-col items-center justify-center">
          {/* Announcement Poster Image Container - Clean Seamless Background (No Forced Black Letterbox) */}
          <div
            id="floating-announcement-image-box"
            onClick={handleActionClick}
            className="w-full relative cursor-pointer group rounded-xl sm:rounded-2xl overflow-hidden flex items-center justify-center"
            title="Klik untuk membuka informasi pengumuman"
          >
            {announcement.photoUrl ? (
              <img
                src={announcement.photoUrl}
                alt={announcement.title || 'Pengumuman Resmi'}
                referrerPolicy="no-referrer"
                className="w-full h-auto max-h-[58vh] sm:max-h-[62vh] object-contain rounded-xl shadow-xs group-hover:scale-[1.012] transition-transform duration-300 select-none block mx-auto"
              />
            ) : (
              <div className="w-full aspect-[16/9] bg-gradient-to-br from-[#043e2e] via-[#065e44] to-[#043e2e] p-6 sm:p-10 flex flex-col justify-between text-white border-2 border-[#d4af37] rounded-xl">
                <div className="flex items-center justify-between">
                  <div className="inline-flex items-center gap-2 bg-amber-400/20 border border-amber-300/40 text-amber-300 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider">
                    <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                    <span>Dinas Sosial Provinsi Jawa Barat</span>
                  </div>
                </div>
                <div className="my-auto py-4 text-center space-y-2">
                  <h3 className="text-xl sm:text-2xl font-black text-white">{announcement.title}</h3>
                  {announcement.subtitle && (
                    <p className="text-xs sm:text-sm text-emerald-100 font-semibold">{announcement.subtitle}</p>
                  )}
                </div>
                <div className="text-center text-[11px] text-amber-200 font-bold">
                  {announcement.publishedBy || 'Otoritas Pusat Dinsos Jabar'}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Extended Bottom Area INSIDE the Frame with Centered Info Button */}
        <div className="pb-4 sm:pb-6 pt-1 sm:pt-2 px-4 sm:px-6 flex flex-col items-center justify-center">
          <button
            id="btn-action-floating-announcement-info"
            type="button"
            onClick={handleActionClick}
            className="w-full max-w-[200px] sm:max-w-[240px] bg-[#009664] hover:bg-[#007e53] active:scale-95 text-white font-extrabold text-xs sm:text-sm py-2.5 sm:py-3 rounded-xl sm:rounded-2xl shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer tracking-wider text-center uppercase border border-emerald-400/40 hover:border-white/50"
            title="Klik untuk membaca informasi lengkap"
          >
            Info
          </button>
        </div>
      </div>
    </div>
  );
};
