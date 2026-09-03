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

  // Determine active video URL
  const getActiveVideoUrl = () => {
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

  useEffect(() => {
    if (!showCustomPhoto && videoRef.current) {
      const vid = videoRef.current;
      vid.defaultMuted = true;
      vid.muted = true;
      vid.playbackRate = 1.0;
      
      const playPromise = vid.play();
      if (playPromise !== undefined) {
        playPromise.catch((err) => {
          console.warn('Video autoplay initial catch, retrying muted play:', err);
          vid.muted = true;
          vid.play().catch(() => {});
        });
      }
    }
  }, [showCustomPhoto, activeVideo]);

  const handleVideoError = () => {
    console.warn('Primary video source failed, checking fallback');
    setVideoError(true);
  };

  return (
    <section className="relative w-full h-[65vh] sm:h-[78vh] min-h-[360px] sm:min-h-[520px] md:-mt-[70px] md:pt-[70px] py-8 sm:py-0 flex items-center justify-center overflow-hidden bg-[#021f18]">
      {/* Background Layer: Real Video by Default */}
      {!showCustomPhoto ? (
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
          onLoadedData={() => {
            if (videoRef.current) {
              videoRef.current.play().catch(() => {});
            }
          }}
          className="absolute inset-0 w-full h-full object-cover z-0 opacity-100 transition-opacity duration-700 brightness-[1.08] contrast-[1.10] saturate-[1.12]"
          style={{
            willChange: 'transform',
            WebkitBackfaceVisibility: 'hidden',
            backfaceVisibility: 'hidden',
            transform: 'translateZ(0)',
            WebkitTransform: 'translateZ(0)',
          }}
        />
      ) : (
        /* Only shown if Admin specifically uploaded a custom real photo */
        <div 
          className="absolute inset-0 w-full h-full bg-cover bg-center z-0 transition-all duration-700 transform scale-105"
          style={{ backgroundImage: `url(${customUserPhoto})` }}
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







