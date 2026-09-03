import React, { useState } from 'react';
import { AppSettings, UserSession } from '../types';

interface FloatingWhatsAppProps {
  appSettings?: AppSettings;
  session?: UserSession;
  currentWilayah?: string;
}

export const FloatingWhatsApp: React.FC<FloatingWhatsAppProps> = ({ appSettings, session, currentWilayah }) => {
  const [isHovered, setIsHovered] = useState(false);

  // Determine active region
  const targetWilayah = currentWilayah || session?.wilayah;

  // Resolve phone number hierarchy:
  // 1. Region-specific number if targetWilayah is set and not "Semua Wilayah" / "Jawa Barat"
  // 2. Superadmin number
  // 3. Fallback default floatingWaNumber
  let rawNum = appSettings?.floatingWaSuperadminNumber || appSettings?.floatingWaNumber || '6289602421065';
  
  if (targetWilayah && appSettings?.floatingWaRegionNumbers?.[targetWilayah]) {
    rawNum = appSettings.floatingWaRegionNumbers[targetWilayah];
  }

  const cleanNum = rawNum.replace(/[^0-9]/g, '');
  const finalNum = cleanNum.startsWith('0') ? '62' + cleanNum.slice(1) : cleanNum;
  const waUrl = `https://wa.me/${finalNum}`;

  return (
    <div className="fixed bottom-3.5 right-3.5 sm:bottom-6 sm:right-6 z-40 animate-wa-float select-none flex items-center justify-end">
      {/* Tightly Scoped Radar Pulse Rings (Confined to compact icon bounds) */}
      <span className="absolute right-0 w-11 h-11 sm:w-14 sm:h-14 rounded-full bg-[#25d366] opacity-40 animate-wa-pulse-1 pointer-events-none" />
      <span className="absolute right-0 w-11 h-11 sm:w-14 sm:h-14 rounded-full bg-emerald-400 opacity-40 animate-wa-pulse-2 pointer-events-none" />

      <a
        href={waUrl}
        target="_blank"
        rel="noreferrer"
        title="Hubungi Admin Dinsos Lewat WhatsApp"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onTouchStart={() => setIsHovered(true)}
        onTouchEnd={() => {
          setTimeout(() => setIsHovered(false), 2200);
        }}
        className="relative z-10 flex items-center bg-gradient-to-r from-[#25d366] via-[#1ebd5a] to-[#128c7e] text-white p-2.5 sm:p-3.5 rounded-full shadow-[0_8px_25px_rgba(37,211,102,0.4)] transition-all duration-300 cubic-bezier(0.16,1,0.3,1) hover:shadow-[0_10px_30px_rgba(37,211,102,0.6)] hover:scale-105 active:scale-95 cursor-pointer touch-manipulation ring-2 ring-white/40 group"
      >
        {/* Ambient Subtle Glow */}
        <span
          className={`absolute -inset-0.5 rounded-full bg-gradient-to-r from-emerald-300 to-[#25d366] blur-sm transition-opacity duration-300 pointer-events-none ${
            isHovered ? 'opacity-70' : 'opacity-20'
          }`}
        />

        {/* Official WhatsApp Vector Icon with Gentle Micro-Wiggle */}
        <div className="relative flex items-center justify-center w-6 h-6 sm:w-7 sm:h-7 shrink-0 aspect-square">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="w-6 h-6 sm:w-7 sm:h-7 text-white shrink-0 drop-shadow-md animate-wa-icon group-hover:scale-110 transition-transform duration-300"
          >
            <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.882-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
          </svg>

          {/* Active Online Green Dot Beacon */}
          <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-200 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-100 border border-emerald-600 shadow-[0_0_6px_#a7f3d0]" />
          </span>
        </div>

        {/* Smooth Expandable Text Label (Desktop only, stays compact round circle on mobile) */}
        <div
          className={`relative hidden sm:flex items-center overflow-hidden transition-all duration-300 cubic-bezier(0.16,1,0.3,1) ${
            isHovered ? 'max-w-[220px] opacity-100 ml-2.5' : 'max-w-0 opacity-0 ml-0'
          }`}
        >
          <span className="text-[11px] sm:text-xs font-black whitespace-nowrap pr-1.5 sm:pr-2.5 leading-none flex items-center tracking-wide text-white drop-shadow-sm">
            Hubungi Admin Dinsos
          </span>
        </div>
      </a>
    </div>
  );
};

