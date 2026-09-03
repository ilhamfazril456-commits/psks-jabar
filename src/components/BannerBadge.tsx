import React from 'react';
import { UserSession } from '../types';
import { Shield, MapPin, Globe2 } from 'lucide-react';

interface BannerBadgeProps {
  session: UserSession;
}

export const BannerBadge: React.FC<BannerBadgeProps> = ({ session }) => {
  let badgeText = 'PROVINSI JAWA BARAT';
  let badgeSub = 'Seluruh 27 Kabupaten & Kota';
  let roleIcon = <Globe2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#d4af37] shrink-0" />;

  const isSuper =
    session.role === 'superadmin' ||
    session.wilayah === 'Semua Wilayah' ||
    session.wilayah === 'Prov. Jabar';
  const isDev = session.role === 'developer';

  if (isDev) {
    badgeText = 'DEVELOPER ADMINISTRATOR';
    badgeSub = 'Otoritas Penuh Sistem';
    roleIcon = <Shield className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-300 shrink-0" />;
  } else if (isSuper) {
    badgeText = 'PROVINSI JAWA BARAT';
    badgeSub = 'Seluruh 27 Kabupaten & Kota';
    roleIcon = <Globe2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#d4af37] shrink-0" />;
  } else if (session.wilayah && session.role === 'user') {
    badgeText = session.wilayah.toUpperCase();
    badgeSub = session.statusActive === 'GUEST' ? 'Tamu Publik' : 'User Terdaftar';
    roleIcon = <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400 shrink-0" />;
  } else if (session.wilayah && session.role === 'admin') {
    badgeText = `WILAYAH ${session.wilayah.toUpperCase()}`;
    badgeSub = 'Admin Wilayah Terverifikasi';
    roleIcon = <Shield className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-300 shrink-0" />;
  }

  // Adaptive font sizing based on length of region name for perfect mobile display
  const getTextSizeClass = (text: string) => {
    if (text.length > 24) return 'text-[10px] sm:text-xs md:text-sm';
    if (text.length > 18) return 'text-[11px] sm:text-xs md:text-sm';
    return 'text-xs sm:text-sm';
  };

  const textSizeClass = getTextSizeClass(badgeText);

  return (
    <section
      id="banner-gerbang-digital"
      className="relative w-full bg-[#043e2e] border-y border-emerald-900/60 py-5 sm:py-7 px-4 sm:px-6"
    >
      <div className="max-w-5xl mx-auto flex flex-col items-center justify-center text-center space-y-2.5 sm:space-y-3">
        {/* Main Title: Clean, Modern, Authoritative Typography */}
        <h2
          id="judul-gerbang-psks"
          className="text-base sm:text-xl md:text-2xl lg:text-3xl font-black text-white uppercase tracking-tight leading-snug sm:leading-tight"
        >
          GERBANG DIGITAL POTENSI SUMBER KESEJAHTERAAN SOSIAL
        </h2>

        {/* Dynamic Contextual Region / Role Sorting Tag */}
        <div className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-3.5 py-1.5 rounded-full bg-[#02281e] border border-emerald-700/50 text-white shadow-2xs max-w-[95vw] sm:max-w-none">
          {roleIcon}
          <span className={`${textSizeClass} font-extrabold tracking-wide uppercase truncate`}>
            {badgeText}
          </span>
          {badgeSub && (
            <>
              <span className="hidden sm:inline text-emerald-500/80">•</span>
              <span className="hidden sm:inline text-[11px] sm:text-xs font-semibold text-emerald-300/90 truncate">
                {badgeSub}
              </span>
            </>
          )}
        </div>
      </div>
    </section>
  );
};
