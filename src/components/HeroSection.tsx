import React, { useRef, useEffect, useState } from 'react';
import { ArrowDownCircle } from 'lucide-react';
import { AppSettings } from '../types';
import { OFFICIAL_ECOOFFICE_VIDEO } from '../assets/officialEcoOfficeVideo';

interface HeroSectionProps {
  onScrollToGrid: () => void;
  appSettings?: AppSettings;
  isTabActive?: boolean;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ onScrollToGrid, appSettings, isTabActive = true }) => {
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

  // Filter out any AI-generated photos or legacy office posters
  const isAiOfficePhoto = (url?: string | null) => {
    if (!url) return false;
    const lower = url.toLowerCase();
    return (
      lower.includes('eco_office_poster') || 
      lower.includes('eco_office_') || 
      lower.includes('dinsos_jabar_building') || 
      lower.includes('facade') || 
      lower.includes('poster')
    );
  };

  const rawCustomPhoto = appSettings?.bgPhotoUrl && appSettings.bgPhotoUrl !== 'LOCAL_STORAGE_SAVED_PHOTO' 
    ? appSettings.bgPhotoUrl 
    : (typeof window !== 'undefined' ? localStorage.getItem('dinsos_bg_photo_url') : null);

  const customUserPhoto = isAiOfficePhoto(rawCustomPhoto) ? null : rawCustomPhoto;

  const bgMode = appSettings?.bgMode || (typeof window !== 'undefined' ? localStorage.getItem('dinsos_bg_mode') : null) || 'video';
  const showCustomPhoto = bgMode === 'photo' && !!customUserPhoto && customUserPhoto !== 'LOCAL_STORAGE_SAVED_PHOTO';

  // Manage video pause/play based on active tab state
  useEffect(() => {
    if (!showCustomPhoto && videoRef.current) {
      if (!isTabActive) {
        videoRef.current.pause();
      } else {
        const vid = videoRef.current;
        if (vid.paused) {
          vid.play().catch(() => {});
        }
      }
    }
  }, [isTabActive, showCustomPhoto]);

  // Direct video play for official Dinsos background video across all devices
  useEffect(() => {
    if (!showCustomPhoto && videoRef.current) {
      const vid = videoRef.current;
      vid.defaultMuted = true;
      vid.muted = true;
      vid.playbackRate = 1.0;
      
      const tryPlay = () => {
        if (!isTabActive) return;
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

      const handleUserInteraction = () => {
        if (vid.paused && isTabActive) {
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
  }, [showCustomPhoto, activeVideo, isTabActive]);

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

      {/* Background Layer: Real Video Dinsos Jabar (Active on Mobile and Desktop) */}
      {!showCustomPhoto && !videoError && (
        <video
          key={activeVideo}
          ref={videoRef}
          src={activeVideo}
          autoPlay
          loop
          muted
          playsInline
          webkit-playsinline="true"
          preload="none"
          disablePictureInPicture
          onError={handleVideoError}
          onCanPlay={() => {
            setIsVideoReady(true);
            if (videoRef.current && videoRef.current.paused && isTabActive) {
              videoRef.current.play().catch(() => {});
            }
          }}
          onPlaying={() => setIsVideoReady(true)}
          onLoadedData={() => {
            setIsVideoReady(true);
            if (videoRef.current && videoRef.current.paused && isTabActive) {
              videoRef.current.play().catch(() => {});
            }
          }}
          className={`absolute inset-0 w-full h-full object-cover z-0 transition-opacity duration-300 brightness-[1.05] contrast-[1.08] saturate-[1.10] ${
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







