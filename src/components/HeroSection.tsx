import React, { useRef, useEffect, useState } from 'react';
import { ArrowDownCircle } from 'lucide-react';
import { AppSettings } from '../types';
import { OFFICIAL_ECOOFFICE_VIDEO } from '../assets/officialEcoOfficeVideo';

interface HeroSectionProps {
  onScrollToGrid: () => void;
  appSettings?: AppSettings;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ onScrollToGrid, appSettings }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoError, setVideoError] = useState(false);
  const [isVideoReady, setIsVideoReady] = useState(false);
  const [fallbackToOfficial, setFallbackToOfficial] = useState(false);

  // Determine active video URL
  const getActiveVideoUrl = () => {
    if (fallbackToOfficial) {
      return OFFICIAL_ECOOFFICE_VIDEO;
    }

    const firestore = appSettings?.bgVideoUrl;
    const local = typeof window !== 'undefined' ? (localStorage.getItem('dinsos_bg_video_url') || localStorage.getItem('dinsos_eco_video_url')) : null;

    const raw = (firestore && firestore !== 'LOCAL_STORAGE_SAVED_VIDEO') ? firestore : (local || '');
    
    // Filter out invalid local OS file paths (e.g. C:\Users\...) which browser security blocks
    if (!raw || raw === 'LOCAL_STORAGE_SAVED_VIDEO' || raw.startsWith('C:') || raw.startsWith('file:') || raw.includes('Users\\')) {
      return OFFICIAL_ECOOFFICE_VIDEO;
    }

    return raw || OFFICIAL_ECOOFFICE_VIDEO;
  };

  const activeVideo = getActiveVideoUrl();

  // If user explicitly uploads their own custom photo in settings, use it. Otherwise, strictly NO AI photo.
  const customUserPhoto = appSettings?.bgPhotoUrl && appSettings.bgPhotoUrl !== 'LOCAL_STORAGE_SAVED_PHOTO' 
    ? appSettings.bgPhotoUrl 
    : (typeof window !== 'undefined' ? localStorage.getItem('dinsos_bg_photo_url') : null);

  const bgMode = appSettings?.bgMode || (typeof window !== 'undefined' ? localStorage.getItem('dinsos_bg_mode') : null) || 'video';
  const showCustomPhoto = bgMode === 'photo' && !!customUserPhoto && customUserPhoto !== 'LOCAL_STORAGE_SAVED_PHOTO';

  // Smart deferral for mobile/desktop PageSpeed: render poster instantly, stream video on interaction/desktop
  const [shouldStreamVideo, setShouldStreamVideo] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Check data-saver or slow connection
    const nav = navigator as unknown as { connection?: { saveData?: boolean; effectiveType?: string } };
    if (nav.connection?.saveData || nav.connection?.effectiveType === '2g' || nav.connection?.effectiveType === 'slow-2g') {
      return; // Keep high-res poster image for data saver mode
    }

    let triggered = false;
    const startStreaming = () => {
      if (triggered) return;
      triggered = true;
      setShouldStreamVideo(true);
      cleanup();
    };

    const cleanup = () => {
      window.removeEventListener('scroll', startStreaming);
      window.removeEventListener('touchstart', startStreaming);
      window.removeEventListener('mousemove', startStreaming);
      window.removeEventListener('click', startStreaming);
    };

    // Trigger immediately on first user interaction (scroll, touch, mouse move, click)
    window.addEventListener('scroll', startStreaming, { passive: true, once: true });
    window.addEventListener('touchstart', startStreaming, { passive: true, once: true });
    window.addEventListener('mousemove', startStreaming, { passive: true, once: true });
    window.addEventListener('click', startStreaming, { passive: true, once: true });

    // Fallback: On desktop screens (width >= 1024px) stream after 4.5s
    const isDesktop = typeof window !== 'undefined' && window.innerWidth >= 1024;
    const fallbackTimer = setTimeout(() => {
      if (isDesktop) {
        startStreaming();
      }
    }, 4500);

    return () => {
      cleanup();
      clearTimeout(fallbackTimer);
    };
  }, []);

  useEffect(() => {
    if (!showCustomPhoto && videoRef.current && shouldStreamVideo) {
      const vid = videoRef.current;
      vid.defaultMuted = true;
      vid.muted = true;
      vid.playbackRate = 1.0;
      
      const tryPlay = () => {
        const playPromise = vid.play();
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              setIsVideoReady(true);
            })
            .catch(() => {
              vid.muted = true;
              vid.play().then(() => setIsVideoReady(true)).catch(() => {});
            });
        }
      };

      tryPlay();

      // Ensure autoplay succeeds on first user touch/scroll if browser paused it
      const handleUserInteraction = () => {
        if (vid.paused) {
          vid.play().then(() => setIsVideoReady(true)).catch(() => {});
        }
      };

      window.addEventListener('touchstart', handleUserInteraction, { once: true, passive: true });
      window.addEventListener('click', handleUserInteraction, { once: true, passive: true });

      return () => {
        window.removeEventListener('touchstart', handleUserInteraction);
        window.removeEventListener('click', handleUserInteraction);
      };
    }
  }, [showCustomPhoto, activeVideo, shouldStreamVideo]);

  const handleVideoError = () => {
    if (!fallbackToOfficial && activeVideo !== OFFICIAL_ECOOFFICE_VIDEO) {
      setFallbackToOfficial(true);
    } else {
      setVideoError(true);
    }
  };

  return (
    <section className="relative w-full h-[65vh] sm:h-[78vh] min-h-[360px] sm:min-h-[520px] md:-mt-[70px] md:pt-[70px] py-8 sm:py-0 flex items-center justify-center overflow-hidden bg-gradient-to-br from-[#011b15] via-[#022a1f] to-[#011712]">
      {/* Photo Mode Layer (only if user explicitly uploaded custom photo in settings) */}
      {showCustomPhoto && customUserPhoto && (
        <div 
          className="absolute inset-0 w-full h-full bg-cover bg-center z-0"
          style={{
            backgroundImage: `url(${customUserPhoto})`,
            filter: 'brightness(0.92) contrast(1.05)'
          }}
        />
      )}

      {/* Background Layer: Instant WebP Poster Image for immediate LCP paint */}
      {!showCustomPhoto && (
        <img
          src="/eco_office_poster.webp"
          alt="Eco Office Dinas Sosial Provinsi Jawa Barat"
          className="absolute inset-0 w-full h-full object-cover z-0 brightness-[1.08] contrast-[1.10] saturate-[1.12]"
          fetchPriority="high"
          loading="eager"
          decoding="sync"
        />
      )}

      {/* Background Layer: Real Video with deferred streaming that fades in seamlessly */}
      {!showCustomPhoto && !videoError && (
        <video
          key={activeVideo}
          ref={videoRef}
          src={shouldStreamVideo ? activeVideo : undefined}
          poster="/eco_office_poster.webp"
          autoPlay
          loop
          muted
          playsInline
          webkit-playsinline="true"
          preload={shouldStreamVideo ? 'metadata' : 'none'}
          disablePictureInPicture
          onError={handleVideoError}
          onCanPlay={() => setIsVideoReady(true)}
          onPlaying={() => setIsVideoReady(true)}
          onLoadedData={() => {
            setIsVideoReady(true);
            if (videoRef.current) {
              videoRef.current.play().catch(() => {});
            }
          }}
          className={`absolute inset-0 w-full h-full object-cover z-0 transition-opacity duration-700 brightness-[1.08] contrast-[1.10] saturate-[1.12] ${
            isVideoReady ? 'opacity-100' : 'opacity-0'
          }`}
          style={{
            willChange: 'transform, opacity',
            WebkitBackfaceVisibility: 'hidden',
            backfaceVisibility: 'hidden',
            transform: 'translateZ(0)',
            WebkitTransform: 'translateZ(0)',
          }}
        />
      )}

      {/* Subtle overlay to enhance text readability without obscuring video */}
      <div 
        className="absolute inset-0 z-[1] pointer-events-none transition-all duration-500" 
        style={{
          background: 'radial-gradient(circle at center, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.55) 100%)'
        }}
      />

      {/* Main Content with Text Drop Shadows (Video is completely visible behind) */}
      <div className="relative z-10 text-center max-w-4xl px-4 sm:px-6 mx-auto flex flex-col items-center">
        <h1 
          className="text-2xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-tight leading-tight mb-3 sm:mb-4 drop-shadow-[0_4px_12px_rgba(0,0,0,0.95)]"
          style={{ textShadow: '0 2px 16px rgba(0,0,0,0.95)' }}
        >
          Potensi dan Sumber Kesejahteraan Sosial (PSKS)
        </h1>

        <p 
          className="text-xs sm:text-base md:text-lg text-white max-w-3xl mb-6 sm:mb-8 leading-relaxed font-semibold drop-shadow-[0_2px_8px_rgba(0,0,0,0.95)]"
          style={{ textShadow: '0 2px 10px rgba(0,0,0,0.95)' }}
        >
          Sistem Pemantauan Terintegrasi dan Pengelolaan Data Pilar-Pilar Kesejahteraan Sosial Dinas Sosial Provinsi Jawa Barat
        </p>

        <div className="flex items-center justify-center">
          <button
            onClick={onScrollToGrid}
            aria-label="Lihat Data Dashboard Pilar PSKS Jawa Barat"
            className="group inline-flex items-center gap-2 bg-[#b8901c] hover:bg-[#d4af37] text-[#043e2e] font-extrabold text-xs sm:text-base px-5 sm:px-7 py-3 sm:py-3.5 rounded-xl shadow-2xl hover:shadow-2xl transition-all transform hover:-translate-y-1 active:scale-95 cursor-pointer"
          >
            <span>Lihat Data Dashboard</span>
            <ArrowDownCircle className="w-4 h-4 sm:w-5 sm:h-5 transition-transform group-hover:translate-y-0.5" />
          </button>
        </div>
      </div>
    </section>
  );
};







