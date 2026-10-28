import React from 'react';

const DEFAULT_OPTIMIZED_LOGO = '/official_logo_64.webp';

interface OfficialPsksLogoProps {
  className?: string;
  sizeClassName?: string;
  showRing?: boolean;
  logoUrl?: string;
}

export const OfficialPsksLogo: React.FC<OfficialPsksLogoProps> = ({
  className = '',
  sizeClassName = 'w-10 h-10 sm:w-11 sm:h-11 md:w-12 md:h-12',
  showRing = true,
  logoUrl,
}) => {
  // Synchronous cache lookup to prevent any momentary flash of old fallback logo
  const resolvedLogo = React.useMemo(() => {
    if (logoUrl && logoUrl.trim() !== '' && logoUrl !== 'LOCAL_STORAGE_SAVED_PHOTO') {
      return logoUrl;
    }
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem('dinsos_logo_url');
        if (cached && cached.trim() !== '' && cached !== 'LOCAL_STORAGE_SAVED_PHOTO') {
          return cached;
        }
      } catch {}
    }
    return DEFAULT_OPTIMIZED_LOGO;
  }, [logoUrl]);

  return (
    <div
      className={`relative select-none aspect-square shrink-0 rounded-full flex items-center justify-center overflow-hidden bg-transparent ${
        showRing
          ? 'border-2 border-[#d4af37] ring-1 ring-amber-400/60 shadow-md shadow-black/40'
          : 'border border-[#d4af37]/60'
      } ${sizeClassName} ${className}`}
      style={{
        borderRadius: '50%',
        clipPath: 'circle(50% at 50% 50%)',
      }}
    >
      <img
        src={resolvedLogo}
        alt="Logo Resmi PSKS Jawa Barat - Dinas Sosial Provinsi Jawa Barat"
        width="48"
        height="48"
        className="w-full h-full aspect-square rounded-full object-contain object-center scale-100 transition-transform duration-300 group-hover:scale-105"
        loading="eager"
        fetchPriority="high"
        decoding="async"
        onError={(e) => {
          const target = e.currentTarget;
          if (target.src !== DEFAULT_OPTIMIZED_LOGO) {
            target.src = DEFAULT_OPTIMIZED_LOGO;
          }
        }}
        style={{
          borderRadius: '50%',
          imageRendering: '-webkit-optimize-contrast',
        }}
      />
    </div>
  );
};

export default OfficialPsksLogo;

