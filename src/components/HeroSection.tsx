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

  // Filter out any AI-generated photos, legacy posters, or data URLs
  const isAiOfficePhoto = (url?: string | null) => {
    if (!url) return false;
    if (url.startsWith('data:image')) return true;
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
    <section className="relative w-full h-[65vh] sm:h-[78vh] min-h-[360px] sm:min-h-[520px] md:-mt-[70px] md:pt-[70px] py-8 sm:py-0 flex items-center justify-center overflow-hidden bg-slate-950">
      {/* Photo Mode Layer (only if user explicitly uploaded custom photo in settings) */}
      {showCustomPhoto && customUserPhoto && (
        <div 
          className="absolute inset-0 w-full h-full bg-cover bg-center z-0"
          style={{
            backgroundImage: `url(${customUserPhoto})`,
            filter: 'brightness(0.96) contrast(1.02)'
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
          preload="auto"
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
          className={`absolute inset-0 w-full h-full object-cover z-0 transition-opacity duration-500 brightness-[1.02] contrast-[1.03] ${
            isVideoReady ? 'opacity-100' : 'opacity-0'
          }`}
        />
      )}

      {/* Subtle, crystal-clear overlay: ultra-transparent to keep the authentic video bright and vivid, while protecting text contrast */}
      <div 
        className="absolute inset-0 z-[1] pointer-events-none transition-all duration-300 bg-black/25 md:bg-gradient-to-r md:from-black/45 md:via-black/20 md:to-transparent" 
      />

      {/* Main Content Container: Left-aligned on Desktop (md:), Centered and balanced on Mobile */}
      <div className="relative z-10 w-full max-w-7xl px-4 sm:px-6 lg:px-8 mx-auto flex flex-col items-center md:items-start text-center md:text-left">
        <div className="max-w-2xl lg:max-w-3xl">
          <h1 
            className="text-2xl sm:text-3xl md:text-4xl lg:text-[46px] xl:text-[50px] font-extrabold text-white tracking-tight leading-[1.2] mb-3 sm:mb-4 [text-shadow:_0_2px_12px_rgba(0,0,0,0.85),_0_4px_24px_rgba(0,0,0,0.6)]"
          >
            Potensi dan Sumber{' '}
            <span className="inline md:block">Kesejahteraan Sosial</span>{' '}
            <span className="text-amber-300 font-extrabold whitespace-nowrap [text-shadow:_0_2px_12px_rgba(0,0,0,0.85)]">(PSKS Jabar)</span>
          </h1>

          <p 
            className="text-xs sm:text-base md:text-lg text-white/95 max-w-xl lg:max-w-2xl mb-6 sm:mb-8 leading-relaxed font-medium [text-shadow:_0_1px_8px_rgba(0,0,0,0.9),_0_2px_16px_rgba(0,0,0,0.7)]"
          >
            Sistem pemantauan terintegrasi dan tata kelola data 10 Pilar Kesejahteraan Sosial Dinas Sosial Provinsi Jawa Barat.
          </p>

          <div className="flex items-center justify-center md:justify-start">
            <button
              onClick={onScrollToGrid}
              aria-label="Lihat Data Dashboard Pilar PSKS Jawa Barat"
              className="group inline-flex items-center gap-2.5 bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 text-[#071732] font-bold text-xs sm:text-sm md:text-base px-5 sm:px-6 py-2.5 sm:py-3 rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.4)] hover:shadow-2xl transition-all transform hover:-translate-y-0.5 active:scale-95 cursor-pointer border border-amber-200/60"
            >
              <span>Lihat Data Dashboard</span>
              <ArrowDownCircle className="w-4 h-4 sm:w-5 sm:h-5 text-[#071732] transition-transform group-hover:translate-y-0.5" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};







